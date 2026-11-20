#!/usr/bin/env node
// Verify the browser-exported original YouTube caption bytes before editorial use.
// Never print subtitle text or commit the source files.
import {readFile} from 'node:fs/promises';
import {basename} from 'node:path';
import {createHash} from 'node:crypto';

const [captionPath,evidencePath]=process.argv.slice(2);
const fail=(message)=>{console.error('CAPTURE_REJECTED:',message);process.exit(1);};
if(!captionPath||!evidencePath){
  console.error('Usage: node scripts/verify-youtube-caption-capture.mjs path/to/VIDEO.en.youtube-auto.json3 path/to/VIDEO.evidence.json');
  process.exit(2);
}
const isId=(value)=>typeof value==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(value);
const isSha=(value)=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
let bytes,proof,captions;
try{
  bytes=await readFile(captionPath);
  proof=JSON.parse(await readFile(evidencePath,'utf8'));
  captions=proof?.format==='json3'?JSON.parse(bytes.toString('utf8')):null;
}catch(err){fail('Could not read and parse JSON3 or evidence: '+err.message);}
if(proof?.provider!=='youtube'||proof?.transport!=='youtube-direct')fail('Only direct YouTube player caption exports are accepted');
if(!isId(proof.videoId)||!isSha(proof.sha256))fail('Missing video ID or SHA-256 proof');
if(!['youtube-auto-captions','youtube-captions'].includes(proof.method))fail('Unexpected caption method');
if(!/^en(?:-[A-Za-z0-9]+)*$/.test(proof.language||''))fail('English source track required');
if(proof.tool!=='youtube-original-captions.user.js')fail('Expected original browser exporter');
if(!['json3','vtt'].includes(proof.format))fail('Expected YouTube JSON3 or WebVTT');
if(proof.fileName!==basename(captionPath))fail('Caption filename differs from proof');
if(proof.bytes!==bytes.length)fail('Caption size differs from proof');
const sha=createHash('sha256').update(bytes).digest('hex');
if(sha!==proof.sha256)fail('Caption contents differ from captured SHA-256');
if(typeof proof.capturedAt!=='string'||!Number.isFinite(Date.parse(proof.capturedAt))||
 !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(proof.capturedAt))fail('Missing actual UTC capture time');
if(proof.sourceUrl!== 'https://www.youtube.com/watch?v='+proof.videoId)fail('Original YouTube video ID mismatch');
const segments=[];
if(proof.format==='json3'){
  if(!Array.isArray(captions?.events))fail('Not a YouTube JSON3 events payload');
  for(const e of captions.events){
    if(!e||!Number.isSafeInteger(e.tStartMs)||e.tStartMs<0||!Array.isArray(e.segs))continue;
    const text=e.segs.map(s=>typeof s.utf8==='string'?s.utf8:'').join('').trim();
    if(!text)continue;
    segments.push({startMs:e.tStartMs,durationMs:Number.isFinite(e.dDurationMs)?e.dDurationMs:0});
  }
}else{
  const text=bytes.toString('utf8');
  if(!text.startsWith('WEBVTT'))fail('Not a WebVTT caption file');
  const toMs=(timestamp)=>{
    const values=timestamp.split(':').map(Number);
    return values.length===3
      ? Math.round((values[0]*3600+values[1]*60+values[2])*1000)
      : Math.round((values[0]*60+values[1])*1000);
  };
  const time='((?:\\d{2}:)?\\d{2}:\\d{2}\\.\\d{3})';
  const regexp=new RegExp('^\\s*'+time+'\\s+-->\\s+'+time,'gm);
  for(const m of text.matchAll(regexp)){
    const startMs=toMs(m[1]),endMs=toMs(m[2]);
    if(Number.isFinite(startMs)&&Number.isFinite(endMs)&&endMs>=startMs)
      segments.push({startMs,durationMs:endMs-startMs});
  }
}
if(segments.length<10)fail('Too few timed English caption events');
let last=-1;
for(const segment of segments){
 if(segment.startMs<last)fail('Non-monotonic YouTube caption timestamps');
 last=segment.startMs;
}
const lastMs=Math.max(...segments.map(s=>s.startMs+Math.max(s.durationMs,0)));
if(proof.videoId==='4YSXNotY8QU' && lastMs<5400000)fail('Žižek source ends before the expected 95-minute video; likely incomplete');
if(proof.captionEvents!==segments.length)fail('Event count does not match original capture evidence');
console.log(JSON.stringify({
  status:'CAPTURE_BYTES_VERIFIED',
  videoId:proof.videoId,
  method:proof.method,
  language:proof.language,
  capturedAt:proof.capturedAt,
  sha256:sha,
  sourceBytes:bytes.length,
  captionEvents:segments.length,
  lastCaptionSecond:Math.round(lastMs/1000),
  warning:'Checks file integrity and shape, not speaker accuracy or redistribution rights. Verify YouTube audio and publication permission separately.'
},null,2));
