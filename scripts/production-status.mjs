import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'), folder=path.join(root,'productions');
const stages=['planned','script_ready','pilot_rendered','rendered','reviewed','private_uploaded','published'];
const rows=[],must=(ok,msg)=>{if(!ok)throw Error(msg)},hex=(v,n)=>typeof v==='string'&&new RegExp('^[0-9a-f]{'+n+'}$').test(v);
for(const entry of fs.readdirSync(folder,{withFileTypes:true}).filter(x=>x.isDirectory())){
 const p=path.join(folder,entry.name),f=path.join(p,'status.json');if(!fs.existsSync(f))continue;
 const s=JSON.parse(fs.readFileSync(f,'utf8')),i=stages.indexOf(s.stage),d=s.delivery||{};
 must(s.clipId===entry.name&&i>=0&&Number.isInteger(s.episode)&&s.episode>0&&Array.isArray(s.blockers)&&s.nextAction,'Invalid status: '+entry.name);
 if(i>=1){must(fs.existsSync(path.join(p,'brief.json')),'Missing brief: '+entry.name);execFileSync(process.execPath,[path.join(root,'scripts/clip-script.mjs'),'export',path.join(p,'brief.json')],{stdio:['ignore','ignore','inherit']})}
 if(i>=2)must(hex(s.preview?.sha256,64)||hex(s.render?.sha256,64),'Missing media digest: '+entry.name);
 if(i>=3)must(s.script?.renderMatchesBrief===true&&hex(s.render?.sha256,64)&&s.render?.storage&&/^https:\/\/github\.com\/nomuonji\/The-Annotated-World\/actions\/runs\/[0-9]+\/artifacts\/[0-9]+$/.test(s.render.artifactUrl||''),'Rendered media must match brief and a pinned Actions artifact');
 if(i>=4){const b=JSON.parse(fs.readFileSync(path.join(p,'brief.json'),'utf8'));must(!!b.source.articleReview&&(b.speaker.audioKind!=='original'||s.gates?.sourceRecording==='confirmed'),'Missing article review or original audio verification');must(b.publication?.approved===true&&b.source?.rightsReviewed===true&&b.music?.rightsReviewed===true,'Source brief rights and publication gate missing');must(b.deliveryReview?.approved===true&&b.deliveryReview.mediaSha256===s.render.sha256&&b.deliveryReview.reviewer&&b.deliveryReview.evidence,'Specific rendered media review evidence missing');must(s.render?.mediaReview?.approved===true&&s.render.mediaReview.mediaSha256===s.render.sha256,'Render media audit must match actual MP4');}
 if(i>=4)must(s.blockers.length===0&&['sourceText','sourceRights','ttsTerms','editorial','media'].every(k=>s.gates?.[k]==='confirmed'),'Review gates remain open');
 if(i>=5)must(s.ownerAuthorization?.publicReleaseAuthorized===true&&s.ownerAuthorization.scope?.includes(s.clipId)&&d.videoId&&d.channelId&&hex(d.sourceSha,40)&&d.approvedMediaSha256===s.render.sha256&&d.receipt,'Missing episode authorization or exact-video delivery readback');
 if(i===6)must(d.privacy==='public'&&d.publishedAt&&d.watchUrl==='https://www.youtube.com/watch?v='+d.videoId,'Missing YouTube public readback');
 rows.push({episode:s.episode,id:s.clipId,title:s.title,stage:s.stage,blockers:s.blockers,videoId:d.videoId??null,nextAction:s.nextAction});
}
must(new Set(rows.map(x=>x.episode)).size===rows.length,'Duplicate episode number');
console.log(JSON.stringify(rows.sort((a,b)=>a.episode-b.episode),null,2));
