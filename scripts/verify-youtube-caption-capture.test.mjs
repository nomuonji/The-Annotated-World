import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';

const verifier=new URL('./verify-youtube-caption-capture.mjs',import.meta.url).pathname;
const id='4YSXNotY8QU';
const formatTime=(m)=>{
  const h=Math.floor(m/60),min=m%60;
  return String(h).padStart(2,'0')+':'+String(min).padStart(2,'0')+':00.000';
};
function sourcePayload(format){
  if(format==='json3')return Buffer.from(JSON.stringify({
    events:Array.from({length:11},(_,i)=>({
      tStartMs:i*550000,dDurationMs:2000,segs:[{utf8:'One genuine caption line '+i+'.'}]
    }))
  }));
  return Buffer.from('WEBVTT\n\n'+Array.from({length:11},(_,i)=>
    formatTime(i*9)+' --> '+formatTime(i*9+1)+'\nSubtitle '+i+'\n'
  ).join('\n'));
}
async function runCase(format,mutate){
  const dir=await mkdtemp(join(tmpdir(),'annotated-capture-'));
  try{
    const filename=id+'_en_youtube-auto.'+format;
    const bytes=sourcePayload(format);
    const evidence={
      provider:'youtube',transport:'youtube-direct',videoId:id,
      sourceUrl:'https://www.youtube.com/watch?v='+id,
      method:'youtube-auto-captions',language:'en',
      tool:'youtube-original-captions.user.js',
      capturedAt:'2026-11-21T00:00:00.000Z',
      format,fileName:filename,bytes:bytes.length,captionEvents:11,
      sha256:createHash('sha256').update(bytes).digest('hex')
    };
    const actual=mutate?mutate({...evidence}):evidence;
    const path=join(dir,filename), proof=join(dir,id+'.evidence.json');
    await writeFile(path,bytes);await writeFile(proof,JSON.stringify(actual));
    return spawnSync(process.execPath,[verifier,path,proof],{encoding:'utf8'});
  }finally{await rm(dir,{recursive:true,force:true});}
}
test('valid original YouTube JSON3 and WebVTT exports verify without leaking transcript content',async()=>{
  for(const format of ['json3','vtt']){
    const result=await runCase(format);
    assert.equal(result.status,0,format+': '+result.stderr);
    assert.match(result.stdout,/CAPTURE_BYTES_VERIFIED/);
    assert.doesNotMatch(result.stdout,/Subtitle|genuine caption line/);
  }
});
test('a modified SHA-256 evidence fails closed',async()=>{
  const result=await runCase('json3',proof=>({...proof,sha256:'0'.repeat(64)}));
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/CAPTURE_REJECTED/);
});
test('a forged source video ID fails closed',async()=>{
  const result=await runCase('vtt',proof=>({...proof,videoId:'aaaaaaaaaaa'}));
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/CAPTURE_REJECTED/);
});
