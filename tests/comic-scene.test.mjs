import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, readdir, rm, mkdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { initScene, loadScene, planScene, registerImage, reviewAsset, gallery, localFile } from '../.agents/skills/image-blast-comic-scene/scripts/scene.mjs';
import { cameraProjector, renderBlockout } from '../.agents/skills/image-blast-comic-scene/scripts/blockout.mjs';

const repo=fileURLToPath(new URL('../',import.meta.url));
const sandbox=await mkdtemp(path.join(tmpdir(),'comic-scene-'));
after(()=>rm(sandbox,{recursive:true,force:true}));
let number=0;
const json=async p=>JSON.parse(await readFile(p,'utf8'));
const put=async (p,value)=>writeFile(p,JSON.stringify(value,null,2)+'\n');
async function fixture() {
  const dir=path.join(sandbox,String(number++),'worlds','study');
  await mkdir(path.join(dir,'source'),{recursive:true});
  await cp(path.join(repo,'docs/examples/study'),path.join(dir,'continuity'),{recursive:true});
  return dir;
}
const cleanEnv=Object.fromEntries(Object.entries(process.env).filter(([k])=>!['WORLD_LABS_API_KEY','FAL_KEY','OPENAI_API_KEY'].includes(k)));
const cli=path.join(repo,'.agents/skills/image-blast-comic-scene/scripts/comic-scene.mjs');
// A real 1x1 PNG fixture tests the file handoff, not native image generation.
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nJ8AAAAASUVORK5CYII=','base64');
async function nativeFixture() {
  const dir=await fixture();
  await writeFile(path.join(dir,'source','0-canon.png'),png);
  const file=path.join(dir,'continuity','scene-bible.json');
  const scene=await json(file); scene.reference_images=['source/0-canon.png']; await put(file,scene);
  return dir;
}

test('actual CLI local provider works without keys, packages or network and preserves init data',async()=>{
  const dir=await fixture();
  const cwd=path.resolve(dir,'../..');
  const before=await readFile(path.join(dir,'continuity','scene-bible.json'),'utf8');
  execFileSync(process.execPath,[cli,'init','--world','study'],{cwd,env:cleanEnv});
  assert.equal(await readFile(path.join(dir,'continuity','scene-bible.json'),'utf8'),before);
  const output=JSON.parse(execFileSync(process.execPath,[cli,'plan','--world','study','--provider','local'],{cwd,env:cleanEnv,encoding:'utf8'}));
  assert.equal(output.requests.length,3);
  for(const request of output.requests) assert.match(await readFile(path.join(dir,request.output_path),'utf8'),/<svg/);
  const docs=await loadScene(dir); assert.equal(docs.manifest.assets.length,3);
  assert.ok(docs.manifest.assets.every(a=>a.provider==='local'&&a.review==='pending-review'));
  const report=await gallery(dir); assert.equal(report.assets,3);
  const html=await readFile(report.gallery,'utf8'); assert.ok(!html.includes('https://'));
  const second=await planScene(dir,'local'); assert.equal(second.index,1);
  assert.equal((await readdir(path.join(dir,'output','references'))).filter(n=>n.endsWith('.svg')).length,6);
});

test('draft initialization does not invent a finished scene and cannot generate',async()=>{
  const dir=path.join(sandbox,'draft','worlds','draft');
  await mkdir(path.join(dir,'source'),{recursive:true});
  await initScene(dir);
  await assert.rejects(planScene(dir,'local'),/Missing scene description/);
});

test('native plan does not create images; registration and review record real disk outputs',async()=>{
  const dir=await nativeFixture();
  const plan=await planScene(dir);
  assert.ok(plan.requests.every(r=>r.status==='planned'&&!r.output_path));
  assert.equal((await loadScene(dir)).manifest.assets.length,0);
  const first=plan.requests[0].request_path;
  const request=await json(path.join(dir,first));
  assert.match(request.prompt,/Fixed invariants/);
  assert.equal(request.reference_images[0].path,'source/0-canon.png');
  const image=path.join(dir,'source/0-canon.png');
  const asset=await registerImage(dir,first,image,'unknown');
  assert.equal(asset.review,'pending-review');
  assert.equal(await readFile(path.join(dir,asset.path)).then(b=>b.equals(png)),true);
  await assert.rejects(registerImage(dir,first,image,'unknown'),/Not a pending/);
  await reviewAsset(dir,asset.id,'accepted','Fixture protocol review; no claim of visual generation.');
  const next=await planScene(dir);
  const nextRequest=await json(path.join(dir,next.requests[0].request_path));
  assert.equal(nextRequest.reference_images.length,2);
  assert.equal(nextRequest.reference_images[0].path,'source/0-canon.png');
  assert.equal(nextRequest.reference_images[1].path,asset.path);
});

test('changed bibles/canon invalidate pending native plans and accepted assets',async()=>{
  const dir=await nativeFixture();
  const plan=await planScene(dir);
  const asset=await registerImage(dir,plan.requests[0].request_path,path.join(dir,'source/0-canon.png'),'unknown');
  await reviewAsset(dir,asset.id,'accepted','Reviewed fixture handoff.');
  const file=path.join(dir,'continuity','scene-bible.json');
  const scene=await json(file); scene.revision++; scene.invariants.push('New established layout constraint.'); await put(file,scene);
  await assert.rejects(registerImage(dir,plan.requests[1].request_path,path.join(dir,'source/0-canon.png'),'unknown'),/changed/);
  await assert.rejects(reviewAsset(dir,asset.id,'accepted','Again'),/obsolete/);
  const next=await planScene(dir);
  assert.equal((await json(path.join(dir,next.requests[0].request_path))).reference_images.length,1);
  await gallery(dir); assert.match(await readFile(path.join(dir,'reference-gallery.html'),'utf8'),/OBSOLETE LAYOUT/);
  await writeFile(path.join(dir,'source/0-canon.png'),Buffer.concat([png,Buffer.from('changed')]));
  await assert.rejects(registerImage(dir,next.requests[0].request_path,path.join(dir,'source/0-canon.png'),'unknown'),/changed/);
});

test('validation catches axis crossing, bad camera, unknown prop and duplicate IDs',async()=>{
  const dir=await fixture();
  const storyboardPath=path.join(dir,'continuity','storyboard.json');
  const story=await json(storyboardPath); delete story.panels[1].axis_exception; await put(storyboardPath,story);
  await assert.rejects(loadScene(dir),/axis crossing/);
  story.panels[1].axis_exception='Intentional reverse'; story.panels[0].continuity.props=[{id:'made-up'}]; await put(storyboardPath,story);
  await assert.rejects(loadScene(dir),/Unknown\/invalid prop/);
  story.panels[0].continuity.props=[]; story.panels[1].id=story.panels[0].id; await put(storyboardPath,story);
  await assert.rejects(loadScene(dir),/Duplicate\/empty panels/);
  story.panels[1].id='p02'; await put(storyboardPath,story);
  const file=path.join(dir,'continuity','camera-bible.json'); const cameras=await json(file);
  cameras.cameras[0].target=cameras.cameras[0].position; await put(file,cameras);
  await assert.rejects(loadScene(dir),/Degenerate/);
});

test('project paths cannot traverse or escape through symlinks',async()=>{
  const dir=await nativeFixture();
  for(const p of ['../outside.png','/absolute.png','https://example.com/a.png','source\\a.png']) await assert.rejects(localFile(dir,p),/project-relative/);
  const outside=path.join(sandbox,'external-dir'); await mkdir(outside,{recursive:true}); await writeFile(path.join(outside,'image.png'),png);
  await symlink(outside,path.join(dir,'linked'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(localFile(dir,'linked/image.png'),/escapes/);
});

test('tampered outputs and renamed non-images are rejected',async()=>{
  const dir=await nativeFixture();
  const plan=await planScene(dir);
  const fake=path.join(sandbox,'fake.png'); await writeFile(fake,'not an image');
  await assert.rejects(registerImage(dir,plan.requests[0].request_path,fake,'unknown'),/actual PNG/);
  await planScene(dir,'local');
  const docs=await loadScene(dir); await writeFile(path.join(dir,docs.manifest.assets[0].path),'tampered');
  await assert.rejects(loadScene(dir),/Asset changed on disk/);
});

test('rejected secondary references cannot be reused by pending requests',async()=>{
  const dir=await nativeFixture();
  const plan=await planScene(dir);
  const image=path.join(dir,'source/0-canon.png');
  const asset=await registerImage(dir,plan.requests[0].request_path,image,'unknown');
  await reviewAsset(dir,asset.id,'accepted','Fixture review');
  const next=await planScene(dir);
  await reviewAsset(dir,asset.id,'rejected','Later found a continuity error');
  await assert.rejects(registerImage(dir,next.requests[0].request_path,image,'unknown'),/no longer canonical\/accepted/);
});

test('appending panels preserves accepted references; editing their state invalidates them',async()=>{
  const dir=await nativeFixture();
  const image=path.join(dir,'source/0-canon.png');
  const plan=await planScene(dir);
  const asset=await registerImage(dir,plan.requests[0].request_path,image,'unknown');
  await reviewAsset(dir,asset.id,'accepted','Reviewed fixture protocol.');
  const file=path.join(dir,'continuity/storyboard.json');
  const story=await json(file);
  story.panels.push({...structuredClone(story.panels[2]),id:'p04'}); await put(file,story);
  const next=await planScene(dir);
  assert.equal((await json(path.join(dir,next.requests[3].request_path))).reference_images.length,2);
  // Existing unchanged pending panel requests remain valid after appending.
  await registerImage(dir,plan.requests[1].request_path,image,'unknown');
  story.panels[0].beat='Changed action'; await put(file,story);
  await assert.rejects(reviewAsset(dir,asset.id,'accepted','Again'),/obsolete/);
  const changed=await planScene(dir);
  assert.equal((await json(path.join(dir,changed.requests[3].request_path))).reference_images.length,1);
});

test('output directory symlinks are rejected before generating outside the project',async()=>{
  const dir=await fixture();
  const outside=path.join(sandbox,'external-output'); await mkdir(outside,{recursive:true});
  await mkdir(path.join(dir,'output'));
  await symlink(outside,path.join(dir,'output','references'),process.platform==='win32'?'junction':'dir');
  await assert.rejects(planScene(dir,'local'),/escapes/);
  assert.deepEqual(await readdir(outside),[]);
});

test('perspective projection obeys target, focal length and panel prop state',async()=>{
  const {scene,cameras,storyboard}=await loadScene(await fixture());
  const c=cameras.cameras[0]; const project=cameraProjector(c);
  const center=project(c.target); assert.equal(center.x,c.width/2); assert.ok(Math.abs(center.y-c.height/2)<1e-9);
  const point=[1,1,0]; const p=project(point); const tele=cameraProjector({...c,focal_length_mm:c.focal_length_mm*2})(point);
  assert.ok(Math.abs((tele.x-c.width/2)-2*(p.x-c.width/2))<1e-9);
  const panel=structuredClone(storyboard.panels[0]); panel.continuity.props=[{id:'desk',visible:false}];
  const svg=renderBlockout(scene,c,panel); assert.ok(!svg.includes('<title>desk</title>'));
  const html=renderBlockout({...scene,title:'<script>bad</script>'},c,panel); assert.ok(!html.includes('<script>'));
});

test('legacy project CLI works on Windows/POSIX and reports additive continuity',async()=>{
  const dir=await fixture();
  const script=path.join(repo,'.claude/scripts/project/project-state.mjs');
  const state=JSON.parse(execFileSync(process.execPath,[script,'--world','study'],{cwd:path.resolve(dir,'../..'),env:cleanEnv,encoding:'utf8'}));
  assert.equal(state.state.has_scene_bible,true); assert.equal(state.state.has_camera_bible,true);
  assert.equal(state.state.has_world,false); assert.deepEqual(state.state.object_counts,{pending:0,completed:0});
});

test('optional World Labs script fails clearly without a key and never falls back',async()=>{
  const cwd=path.join(sandbox,'optional'); await mkdir(cwd);
  try {
    execFileSync(process.execPath,[path.join(repo,'.claude/scripts/world/generate-world.mjs'),'--world','study','--prompt','A study'],{cwd,env:cleanEnv,encoding:'utf8',stdio:'pipe'});
    assert.fail('Expected missing optional provider credential');
  } catch(error) { assert.match(String(error.stderr),/WORLD_LABS_API_KEY is not set/); }
});
