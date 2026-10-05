import { mkdir, readFile, writeFile, readdir, realpath, copyFile, constants, lstat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { cameraProjector, renderBlockout, escape } from './blockout.mjs';

const files = ['scene-bible.json', 'camera-bible.json', 'storyboard.json'];
const json = async p => JSON.parse(await readFile(p, 'utf8'));
const write = async (p, value, flag = 'w') => writeFile(p, JSON.stringify(value, null, 2)+'\n', {flag});
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (ok, message) => { if (!ok) throw new Error(message); };
const id = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const vector = value => Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
const strings = value => Array.isArray(value) && value.every(v => typeof v === 'string' && v.trim());
const unique = list => new Set(list).size === list.length;

export async function localFile(dir, relative) {
  fail(typeof relative === 'string' && relative && !path.isAbsolute(relative) && !relative.includes('\\') && !relative.includes(':') && !relative.split('/').includes('..'), `Use a project-relative local path: ${relative}`);
  const root = await realpath(dir);
  const result = await realpath(path.join(root, relative));
  fail(result.startsWith(root + path.sep), `Path escapes project: ${relative}`);
  return result;
}

export async function initScene(dir) {
  await mkdir(path.join(dir, 'continuity'), {recursive:true});
  await mkdir(path.join(dir, 'output', 'references'), {recursive:true});
  await localFile(dir, 'continuity');
  await localFile(dir, 'output/references');
  const source = await readdir(path.join(dir, 'source')).catch(() => []);
  const refs = source.filter(n => /^0-.*\.(png|jpg|jpeg|webp)$/i.test(n)).sort().map(n => `source/${n}`);
  const analysis = await json(path.join(dir, 'image.json')).catch(() => ({}));
  const scene = {schema_version:1, scene_id:path.basename(dir), revision:1, status:'draft',
    title:analysis.scene_name || path.basename(dir), description:analysis.literal_description || '',
    coordinate_system:'right-handed-y-up-meters', reference_images:refs,
    style:analysis.visual_style || '', lighting:analysis.lighting || '',
    invariants:[], assumptions:['Positions, unseen surfaces and dimensions require authoring; a single image does not prove them.'], geometry:[]};
  const camera = {schema_version:1, scene_id:scene.scene_id, revision:1, status:'draft',
    action_axis:[[-1,0,0],[1,0,0]], cameras:[{id:'establishing', position:[0,1.6,5], target:[0,1,0],
      focal_length_mm:35, sensor_width_mm:36, width:960, height:540, framing:'Establish the scene and fixed landmarks.'}]};
  const storyboard = {schema_version:1, scene_id:scene.scene_id, panels:[{id:'p01', camera_id:'establishing',
    beat:'Establish the scene', continuity:{time:'same moment', lighting:scene.lighting, props:[], characters:[]}}]};
  const manifest = {schema_version:1, scene_id:scene.scene_id, assets:[]};
  const created = [];
  for (const [name, value] of [...files.map((n,i)=>[n,[scene,camera,storyboard][i]]), ['asset-manifest.json',manifest]]) {
    try { await write(path.join(dir,'continuity',name), value, 'wx'); created.push(name); }
    catch(error) { if(error.code !== 'EEXIST') throw error; }
  }
  return {created, next:'Author and lock the bibles, then validate and plan. Existing files were preserved.'};
}

export function validateDocuments(scene, cameras, storyboard, manifest) {
  for (const doc of [scene,cameras,storyboard,manifest]) fail(doc.schema_version===1 && doc.scene_id===scene.scene_id && id(doc.scene_id), 'Schema version or scene_id mismatch');
  for (const bible of [scene,cameras]) fail(Number.isInteger(bible.revision) && bible.revision>0 && ['draft','locked'].includes(bible.status), 'Invalid bible revision/status');
  fail(scene.coordinate_system==='right-handed-y-up-meters', 'Use right-handed-y-up-meters');
  for (const key of ['title','description','style','lighting']) fail(typeof scene[key]==='string' && scene[key].trim(), `Missing scene ${key}`);
  fail(strings(scene.invariants) && scene.invariants.length>0 && strings(scene.assumptions), 'Provide invariants and an assumptions array');
  fail(strings(scene.reference_images), 'Invalid reference_images');
  fail(Array.isArray(scene.geometry) && unique(scene.geometry.map(g=>g.id)), 'Duplicate/invalid geometry');
  for (const g of scene.geometry) fail(id(g.id) && typeof g.description==='string' && g.description.trim() && vector(g.position) && vector(g.size) && g.size.every(v=>v>0) && (!g.color || /^#[a-f0-9]{6}$/i.test(g.color)), `Invalid geometry: ${g.id}`);
  fail(Array.isArray(cameras.action_axis) && cameras.action_axis.length===2 && cameras.action_axis.every(vector), 'Invalid action_axis');
  const [a,b] = cameras.action_axis;
  fail(Math.hypot(b[0]-a[0], b[2]-a[2])>0, 'Action axis must have length in the XZ plane');
  fail(Array.isArray(cameras.cameras) && cameras.cameras.length>0 && unique(cameras.cameras.map(c=>c.id)), 'Duplicate/empty cameras');
  for (const c of cameras.cameras) {
    fail(id(c.id) && vector(c.position) && vector(c.target) && [c.focal_length_mm,c.sensor_width_mm].every(v=>Number.isFinite(v)&&v>0) && [c.width,c.height].every(v=>Number.isInteger(v)&&v>=64&&v<=8192) && typeof c.framing==='string' && c.framing.trim(), `Invalid camera: ${c.id}`);
    cameraProjector(c); // Reject zero view direction and vertical look-at singularities.
  }
  fail(Array.isArray(storyboard.panels) && storyboard.panels.length>0 && unique(storyboard.panels.map(p=>p.id)), 'Duplicate/empty panels');
  let previousSide = 0;
  for (const p of storyboard.panels) {
    const c = cameras.cameras.find(c=>c.id===p.camera_id);
    fail(id(p.id) && c && typeof p.beat==='string' && p.beat.trim(), `Invalid panel/camera: ${p.id}`);
    const state = p.continuity;
    fail(state && ['time','lighting'].every(k=>typeof state[k]==='string'&&state[k].trim()) && Array.isArray(state.props) && Array.isArray(state.characters), `Missing panel continuity: ${p.id}`);
    fail(unique(state.props.map(v=>v.id)) && unique(state.characters.map(v=>v.id)), `Duplicate panel entity: ${p.id}`);
    for(const prop of state.props) fail(scene.geometry.some(g=>g.id===prop.id) && (!prop.position || vector(prop.position)) && (prop.visible===undefined || typeof prop.visible==='boolean'), `Unknown/invalid prop: ${prop.id}`);
    for(const character of state.characters) fail(id(character.id) && vector(character.position) && ['pose','wardrobe'].every(k=>typeof character[k]==='string'&&character[k].trim()), `Invalid character state: ${character.id}`);
    const side = Math.sign((b[0]-a[0])*(c.position[2]-a[2])-(b[2]-a[2])*(c.position[0]-a[0]));
    fail(!previousSide || !side || side===previousSide || (typeof p.axis_exception==='string' && p.axis_exception.trim()), `180-degree axis crossing at ${p.id}; add an intentional axis_exception reason`);
    if(side) previousSide=side;
  }
  fail(Array.isArray(manifest.assets) && unique(manifest.assets.map(a=>a.id)), 'Invalid/duplicate asset manifest');
  for(const asset of manifest.assets) fail(id(asset.id) && ['pending-review','accepted','rejected'].includes(asset.review) && /^[a-f0-9]{64}$/.test(asset.sha256) && typeof asset.path==='string', `Invalid manifest asset: ${asset.id}`);
  return true;
}

export async function loadScene(dir) {
  await localFile(dir, 'continuity');
  const [scene,cameras,storyboard,manifest] = await Promise.all([...files,'asset-manifest.json'].map(n=>json(path.join(dir,'continuity',n))));
  validateDocuments(scene,cameras,storyboard,manifest);
  fail(scene.scene_id===path.basename(dir), 'scene_id must match the project directory slug');
  const references = [];
  for(const relative of scene.reference_images) references.push({path:relative,sha256:sha(await readFile(await localFile(dir,relative)))});
  for(const asset of manifest.assets) fail(sha(await readFile(await localFile(dir,asset.path)))===asset.sha256, `Asset changed on disk: ${asset.path}`);
  return {scene,cameras,storyboard,manifest,references};
}

function fingerprint(docs) {
  return sha(JSON.stringify({scene:docs.scene,cameras:docs.cameras,references:docs.references}));
}
const panelHash = panel => sha(JSON.stringify(panel));
const assetCurrent = (docs, asset) => asset.snapshot===fingerprint(docs) && asset.panel_sha256===panelHash(docs.storyboard.panels.find(p=>p.id===asset.panel_id) ?? null);

export async function planScene(dir, provider='codex') {
  fail(['codex','local'].includes(provider), 'Reference provider must be codex or local; World Labs uses its separate opt-in command');
  const docs = await loadScene(dir);
  fail(docs.scene.status==='locked' && docs.cameras.status==='locked', 'Lock both bibles after reviewing the authored layout');
  fail(provider!=='codex' || docs.references.length>0, 'Codex plan requires a canonical local reference image');
  fail(provider!=='local' || docs.scene.geometry.length>0, 'Local provider requires authored box geometry');
  const snapshot = fingerprint(docs);
  const output = path.join(dir,'output','references');
  await mkdir(output,{recursive:true});
  await localFile(dir, 'output/references');
  const names = await readdir(output);
  const index = names.reduce((n,s)=>Math.max(n,Number(s.match(/^\.?(\d+)-/)?.[1] ?? -1)), -1)+1;
  const accepted = docs.manifest.assets.filter(a=>a.review==='accepted' && a.provider==='codex' && assetCurrent(docs,a));
  const requests = [];
  for(const panel of docs.storyboard.panels) {
    const camera = docs.cameras.cameras.find(c=>c.id===panel.camera_id);
    const request = {schema_version:1, index, scene_id:docs.scene.scene_id, panel_id:panel.id,
      provider, status:provider==='local'?'completed':'planned', snapshot,
      scene_revision:docs.scene.revision,camera_revision:docs.cameras.revision,
      reference_images:[...docs.references,...accepted.map(a=>({path:a.path,sha256:a.sha256}))],
      scene:docs.scene,camera,panel,
      prompt:[`Create one comic scene reference for ${docs.scene.title}, panel ${panel.id}.`,
        `Setting: ${docs.scene.description}`, `Style: ${docs.scene.style}`, `Base lighting: ${docs.scene.lighting}`,
        `Fixed invariants (preserve in every view): ${JSON.stringify(docs.scene.invariants)}`,
        `Authored geometry in right-handed Y-up meters (+X right, +Y up, +Z toward establishing camera): ${JSON.stringify(docs.scene.geometry)}`,
        `Camera: ${JSON.stringify(camera)}`, `Action/continuity: ${JSON.stringify(panel)}`,
        `Assumptions, not observed facts: ${JSON.stringify(docs.scene.assumptions)}`,
        'Use the canonical image(s) for identity and style; accepted generated references are secondary. Change only the requested viewpoint/action. Keep door/window counts, prop identities, materials, scale and light direction. Do not mirror the set or add decoration. Do not infer hidden architecture as fact. No captions, labels, speech bubbles or watermark.',
        'Single-image novel views are generative interpretations, not exact camera renders. Flag spatial uncertainty during review.'].join('\n')};
    const requestRelative = `output/references/.${index}-${panel.id}-request.json`;
    if(provider==='local') {
      request.output_path = `output/references/${index}-${panel.id}-blockout.svg`;
      await writeFile(path.join(dir,request.output_path),renderBlockout(docs.scene,camera,panel),{flag:'wx'});
      docs.manifest.assets.push({id:`v${index}-${panel.id}-blockout`,panel_id:panel.id,camera_id:camera.id,
        provider:'local',role:'composition-proxy',path:request.output_path,sha256:sha(await readFile(path.join(dir,request.output_path))),
        snapshot,panel_sha256:panelHash(panel),request_path:requestRelative,review:'pending-review',created_at:new Date().toISOString()});
    }
    await write(path.join(dir,requestRelative),request,'wx');
    requests.push({panel_id:panel.id,request_path:requestRelative,status:request.status,output_path:request.output_path});
  }
  if(provider==='local') await write(path.join(dir,'continuity','asset-manifest.json'),docs.manifest);
  await write(path.join(output,`${index}-reference-plan.json`),{schema_version:1,provider,snapshot,requests},'wx');
  return {index,provider,requests,note:provider==='codex'?'Planned only. Codex must invoke its available image tool and register each real output.':'Local box composition guides rendered; not reconstructed scene assets.'};
}

export async function registerImage(dir, requestPath, imagePath, model) {
  fail(typeof model==='string' && model.trim(), 'Record the actual reported model or unknown; never guess a model version');
  const docs = await loadScene(dir);
  const requestFile = await localFile(dir,requestPath);
  fail(requestPath.startsWith('output/references/.'), 'Expected a reference request path');
  const request = await json(requestFile);
  fail(request.provider==='codex' && request.status==='planned' && request.scene_id===docs.scene.scene_id, 'Not a pending Codex request');
  fail(Number.isInteger(request.index) && request.index>=0 && id(request.panel_id) && docs.storyboard.panels.some(p=>p.id===request.panel_id && p.camera_id===request.camera?.id), 'Invalid request identity');
  fail(requestPath===`output/references/.${request.index}-${request.panel_id}-request.json`, 'Request filename/identity mismatch');
  fail(request.snapshot===fingerprint(docs), 'Bibles, storyboard or canonical references changed; create a new plan');
  fail(JSON.stringify(request.scene)===JSON.stringify(docs.scene) && JSON.stringify(request.camera)===JSON.stringify(docs.cameras.cameras.find(c=>c.id===request.camera.id)) && JSON.stringify(request.panel)===JSON.stringify(docs.storyboard.panels.find(p=>p.id===request.panel_id)), 'Request snapshot content was altered; create a new plan');
  for(const reference of request.reference_images) {
    fail(docs.references.some(r=>r.path===reference.path) || docs.manifest.assets.some(a=>a.path===reference.path && a.review==='accepted' && assetCurrent(docs,a)), `Reference is no longer canonical/accepted: ${reference.path}`);
    fail(sha(await readFile(await localFile(dir,reference.path)))===reference.sha256, `Request reference changed: ${reference.path}`);
  }
  const bytes = await readFile(imagePath);
  const ext = path.extname(imagePath).toLowerCase();
  const png = bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
  const webp = bytes.toString('ascii',0,4)==='RIFF' && bytes.toString('ascii',8,12)==='WEBP';
  fail((ext==='.png'&&png) || (['.jpg','.jpeg'].includes(ext)&&jpg) || (ext==='.webp'&&webp), 'Expected an actual PNG/JPEG/WebP image, not a renamed non-image');
  const relative = `output/references/${request.index}-${request.panel_id}-reference${ext}`;
  await localFile(dir, 'output/references');
  await copyFile(imagePath,path.join(dir,relative),constants.COPYFILE_EXCL);
  const asset = {id:`v${request.index}-${request.panel_id}-reference`,panel_id:request.panel_id,camera_id:request.camera.id,
    provider:'codex',model,role:'comic-reference',path:relative,sha256:sha(bytes),snapshot:request.snapshot,panel_sha256:panelHash(request.panel),
    request_path:requestPath,review:'pending-review',created_at:new Date().toISOString()};
  docs.manifest.assets.push(asset);
  await write(path.join(dir,'continuity','asset-manifest.json'),docs.manifest);
  await write(requestFile,{...request,status:'completed',output_path:relative,model});
  return asset;
}

export async function reviewAsset(dir, assetId, status, notes) {
  fail(['accepted','rejected'].includes(status) && typeof notes==='string' && notes.trim(), 'Review needs accepted/rejected and concrete notes');
  const docs = await loadScene(dir);
  const asset = docs.manifest.assets.find(a=>a.id===assetId);
  fail(asset, `Unknown asset: ${assetId}`);
  fail(status!=='accepted' || assetCurrent(docs,asset), 'Cannot accept an obsolete layout/panel; replan');
  Object.assign(asset,{review:status,review_notes:notes,reviewed_at:new Date().toISOString()});
  await write(path.join(dir,'continuity','asset-manifest.json'),docs.manifest);
  return asset;
}

export async function gallery(dir) {
  const docs = await loadScene(dir);
  const cards = docs.manifest.assets.map(a=>`<article><h2>${escape(a.panel_id)} / ${escape(a.camera_id)}</h2><img src="${escape(a.path)}" alt="${escape(a.role)}"><p>${escape(a.role)} · ${escape(a.review)}${!assetCurrent(docs,a)?' · OBSOLETE LAYOUT/PANEL':''}</p><p>${escape(a.review_notes ?? 'Visual review pending')}</p></article>`);
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(docs.scene.title)}</title><style>body{font:16px system-ui;background:#eef2f5;color:#172738;margin:32px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr));gap:24px}article{min-width:0;background:white;padding:16px;border:1px solid #bccbd6}img{width:100%;height:auto}h2{font-size:18px}</style><h1>${escape(docs.scene.title)}</h1><p>Scene references · local proxies are composition guides · images need continuity review.</p><main>${cards.join('')||'<p>No rendered or registered references yet. A plan alone is not a finished image.</p>'}</main></html>`;
  // Replace only this generated gallery; never follow a pre-existing symlink.
  const galleryPath=path.join(dir,'reference-gallery.html');
  const existing=await lstat(galleryPath).catch(error=>{if(error.code!=='ENOENT') throw error; return null;});
  fail(!existing?.isSymbolicLink(), 'Gallery output must not be a symlink');
  await writeFile(galleryPath,html);
  return {gallery:path.join(dir,'reference-gallery.html'),assets:docs.manifest.assets.length};
}
