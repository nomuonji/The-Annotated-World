// Read-only source-caption probe. NEVER use third-party transcripts or ASR.
// Checks only YouTube's own watch/embed player responses and caption URLs.
import crypto from 'node:crypto';
const id = process.argv[2] || '4YSXNotY8QU';
if (!/^[A-Za-z0-9_-]{11}$/.test(id)) throw new Error('Invalid YouTube ID');
const urls=[
  'https://www.youtube.com/watch?v='+id,
  'https://www.youtube.com/embed/'+id,
  'https://www.youtube-nocookie.com/embed/'+id,
  'https://m.youtube.com/watch?v='+id,
];
const headers={'user-agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/153.0.0.0 Safari/537.36',
'accept-language':'en-US,en;q=0.9'};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function objectAfter(src, marker){
 const start=src.indexOf(marker);
 if(start<0)return null;
 let i=src.indexOf('{',start+marker.length);
 if(i<0||i-start>180)return null;
 let depth=0,inString=false,escape=false;
 for(let j=i;j<src.length;j++){
  const ch=src[j];
  if(inString){if(escape)escape=false;else if(ch==='\\')escape=true;else if(ch==='"')inString=false;}
  else if(ch==='"')inString=true;
  else if(ch==='{')depth++;
  else if(ch==='}'&&--depth===0){try{return JSON.parse(src.slice(i,j+1))}catch{return null}}
 }
 return null;
}
const visited=new Set();
let anyTracks=false, anyBytes=false;
for(const url of urls){
 try{
  const response=await fetch(url,{headers,signal:AbortSignal.timeout(12000)});
  const body=await response.text();
  const blocked=/sign in to confirm you're not a bot|unusual traffic|captcha/i.test(body);
  const markerNames=['ytInitialPlayerResponse =','ytInitialPlayerResponse=','"playerResponse":','ytInitialPlayerResponse\\":'];
  const results=markerNames.map(m=>objectAfter(body,m)).filter(Boolean);
  const tracks=results.flatMap(x=>x?.captions?.playerCaptionsTracklistRenderer?.captionTracks??[]);
  console.log('YOUTUBE_PAGE='+JSON.stringify({url,status:response.status,bytes:body.length,botBlocked:blocked,playerResponseCount:results.length,captionTrackCount:tracks.length}));
  for(const track of tracks){
   const raw=track.baseUrl||'';
   let u;try{u=new URL(raw)}catch{continue}
   const allowed=u.protocol==='https:'&&(['youtube.com','www.youtube.com','m.youtube.com'].includes(u.hostname)||u.hostname.endsWith('.youtube.com'));
   if(!allowed){console.log('YOUTUBE_TRACK_REJECTED_NON_YOUTUBE_HOST='+u.hostname);continue}
   const key=track.vssId||track.languageCode||raw;
   if(visited.has(key))continue;visited.add(key);
   anyTracks=true;
   console.log('YOUTUBE_TRACK='+JSON.stringify({languageCode:track.languageCode,kind:track.kind||'manual',name:track.name?.simpleText||track.name?.runs?.map(x=>x.text).join(''),sourceHost:u.host}));
   for(const fmt of ['json3','vtt']){
    const t=new URL(u);t.searchParams.set('fmt',fmt);
    try{
     const r=await fetch(t,{headers,signal:AbortSignal.timeout(15000)});
     const bytes=Buffer.from(await r.arrayBuffer());
     const ok=r.ok&&bytes.length>200;
     console.log('YOUTUBE_CAPTION_FETCH='+JSON.stringify({language:track.languageCode,format:fmt,status:r.status,bytes:bytes.length,sha256:ok?sha(bytes):null,nonempty:ok}));
     if(ok)anyBytes=true;
    }catch(e){console.log('YOUTUBE_CAPTION_FETCH_ERROR='+String(e).slice(0,190))}
   }
  }
 }catch(e){console.log('YOUTUBE_PAGE_ERROR='+JSON.stringify({url,error:String(e).slice(0,180)}))}
}
console.log('YOUTUBE_ORIGINAL_CAPTION_TRACKS_FOUND='+Number(anyTracks));
console.log('YOUTUBE_ORIGINAL_CAPTION_BYTES_ACQUIRED='+Number(anyBytes));
