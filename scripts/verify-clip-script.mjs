import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const cli=path.join(root,'scripts/clip-script.mjs');
const run=(...args)=>spawnSync(process.execPath,[cli,...args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
const example=path.join(root,'templates/annotated-short/studio-brief.example.json');
test('real chapter packet preserves source context, translation, chapter index and annotations',()=>{
 const b=JSON.parse(fs.readFileSync(example));
 const r=run('prepare',b.source.slug,'--chapter','ch10');
 assert.equal(r.status,0,r.stderr);
 const p=JSON.parse(r.stdout);
 assert.equal(p.chapter.id,'ch10');
 const u=p.chapter.utterances.find(x=>x.utteranceId==='ch10-line-2');
 assert.ok(u.english.includes(b.hooks[0].en));
 assert.ok(u.japanese&&u.annotations.length);
 assert.ok(p.chapterIndex.some(x=>x.id==='ch9'));
 assert.ok(p.candidates.every(x=>x.context.length>=2));
 assert.notEqual(run('prepare',b.source.slug,'--chapter','missing').status,0);
});
test('export is a script, does not require media, keeps source refs and all hook reviews',()=>{
 const r=run('export',example);
 assert.equal(r.status,0,r.stderr);
 assert.ok(r.stdout.includes('We acted too much, and the consequences were shocking.'));
 assert.ok(r.stdout.includes('ch10/ch10-line-2'));
 assert.ok(r.stdout.includes('## 共通本編')&&r.stdout.includes('## 制作引継ぎ')&&r.stdout.includes('未承認'));
 assert.ok(r.stdout.includes('概算')&&r.stdout.includes('audio/paradox.wav'));
});
test('export fails with missing annotation review or invented quotation',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'clip-script-'));
 try{
 const p=path.join(dir,'brief.json');const b=JSON.parse(fs.readFileSync(example));
 const broken=structuredClone(b);broken.editorial.scriptReview.annotations.pop();
 fs.writeFileSync(p,JSON.stringify(broken));
 assert.notEqual(run('export',p).status,0);
 b.hooks[0].en='This quotation was invented.';b.hooks[0].cues[0].en=b.hooks[0].en;
 fs.writeFileSync(p,JSON.stringify(b));
 assert.notEqual(run('export',p).status,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('closing editorial annotation is accepted, consecutive annotations are not',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'clip-ending-'));
 try{
 const p=path.join(dir,'brief.json');const b=JSON.parse(fs.readFileSync(example));
 const n=structuredClone(b.body.find(x=>x.role==='ANNOTATION'));
 const review=structuredClone(b.editorial.scriptReview.annotations.find(x=>x.id===n.id));
 n.id='editorial-close';review.id=n.id;
 b.body.push(n);b.editorial.scriptReview.annotations.push(review);
 fs.writeFileSync(p,JSON.stringify(b));const r=run('export',p);assert.equal(r.status,0,r.stderr);assert.ok(r.stdout.includes('editorial-close'));
 const bad=structuredClone(n);bad.id='extra-close';b.body.push(bad);b.editorial.scriptReview.annotations.push({...review,id:bad.id});
 fs.writeFileSync(p,JSON.stringify(b));assert.notEqual(run('export',p).status,0);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
