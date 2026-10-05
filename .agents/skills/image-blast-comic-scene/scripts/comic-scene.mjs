#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { initScene, loadScene, planScene, registerImage, reviewAsset, gallery } from './scene.mjs';

export async function main(argv=process.argv.slice(2)) {
  const [command, ...args] = argv;
  const flags = {};
  const allowed = {init:['world'], validate:['world'], plan:['world','provider'], register:['world','request','image','model'], review:['world','asset','status','notes'], gallery:['world']};
  for(let i=0;i<args.length;i+=2) {
    if(!args[i].startsWith('--') || !args[i+1] || args[i+1].startsWith('--')) throw new Error('Expected --flag value pairs');
    if(!allowed[command]?.includes(args[i].slice(2))) throw new Error(`Unknown flag for ${command}: ${args[i]}`);
    flags[args[i].slice(2)]=args[i+1];
  }
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(flags.world ?? '')) throw new Error('Supply --world <lowercase-hyphenated-slug>');
  const dir=path.resolve('worlds',flags.world);
  switch(command) {
    case 'init': return initScene(dir);
    case 'validate': {const docs=await loadScene(dir); return {valid:true,scene_id:docs.scene.scene_id,panels:docs.storyboard.panels.length};}
    case 'plan': return planScene(dir,flags.provider ?? 'codex');
    case 'register': return registerImage(dir,flags.request,flags.image,flags.model);
    case 'review': return reviewAsset(dir,flags.asset,flags.status,flags.notes);
    case 'gallery': return gallery(dir);
    default: throw new Error('Commands: init | validate | plan [--provider codex|local] | register --request <project-relative-path> --image <file> --model <reported-model-or-unknown> | review --asset <id> --status accepted|rejected --notes <text> | gallery');
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(result=>console.log(JSON.stringify(result,null,2))).catch(error=>{console.error(error.message);process.exitCode=1;});
}
