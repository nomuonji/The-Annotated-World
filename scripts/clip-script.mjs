#!/usr/bin/env node
// Deterministic support for the clip script agent; semantic editing remains the agent's job.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const must=(v,m)=>{if(!v)throw Error(m)};
const has=x=>typeof x==='string'&&x.trim().length>0;
const safe=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]+$/.test(s);
const plain=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&nbsp;/g,' ').replace(/&#39;|&apos;/g,"'").replace(/\s+/g,' ').trim();
function studio(...args){
 const r=spawnSync(process.execPath,[path.join(ROOT,'scripts/short-studio.mjs'),...args],{encoding:'utf8',maxBuffer:16*1024*1024});
 if(r.error)throw r.error;
 must(r.status===0,'Studio validation failed: '+(r.stderr||r.stdout).trim());
 return JSON.parse(r.stdout);
}
function doc(slug){
 must(safe(slug),'invalid document slug');
 const folder=path.join(ROOT,'src/content/documents',slug);
 const meta=read(path.join(folder,'document.json'));
 const chapters=meta.chapterOrder.map(id=>{must(safe(id),'invalid chapter ID');return read(path.join(folder,'chapters',id+'.json'))});
 return {meta,chapters};
}
function excerpt(ch,u){
 return {chapterId:ch.id,utteranceId:u.id,time:u.time,speaker:u.speaker?.name,english:plain(u.english),japanese:plain(u.japanese),annotations:u.annotations||[]};
}
function usedClips(slug){
 const dir=path.join(ROOT,'productions');if(!fs.existsSync(dir))return [];
 const out=[];
 for(const d of fs.readdirSync(dir,{withFileTypes:true})){
  if(!d.isDirectory())continue;
  const file=path.join(dir,d.name,'brief.json');if(!fs.existsSync(file))continue;
  const b=read(file);if(b.source?.slug!==slug)continue;
  out.push({clipId:d.name,title:b.title,payoff:b.editorial?.payoff,quotes:[...(b.hooks||[]),...(b.body||[])].filter(s=>s.role==='QUOTE').map(s=>({sourceRef:s.sourceRef,en:s.en}))});
 }
 return out;
}
function prepare(slug,chapter){
 const {meta,chapters}=doc(slug);
 if(chapter)must(chapters.some(ch=>ch.id===chapter),'chapter not found: '+chapter);
 const all=chapters.flatMap(ch=>ch.utterances.map(u=>excerpt(ch,u)));
 const byRef=new Map(all.map((u,i)=>[u.chapterId+'/'+u.utteranceId,i]));
 const discovered=studio('discover',slug);
 const candidates=discovered.candidates.filter(c=>!chapter||c.chapterId===chapter).map(c=>{
  const i=byRef.get(c.chapterId+'/'+c.utteranceId);
  return {...c,context:all.slice(Math.max(0,i-1),i+2)};
 });
 return {format:'annotated-clip-agent-packet/v1',slug,title:meta.title,description:meta.description,source:meta.provenance||{},sourceFacts:meta.facts||[],sources:meta.sources,people:meta.people||[],chapterIndex:chapters.map(c=>({id:c.id,title:c.title,summary:c.summary,timeRange:c.timeRange,utteranceCount:c.utterances.length})),chapter:chapter?{id:chapter,utterances:all.filter(u=>u.chapterId===chapter)}:null,candidates,existingClips:usedClips(slug),instructions:'Candidates are heuristic, not selected scripts. Read full relevant chapter JSON and neighboring utterances. Source time is utterance-level. Check provenance, translation and rights separately. Compare angles; do not reuse a clip merely because keywords match.'};
}
function review(b){
 const r=b.editorial?.scriptReview;
 must(r&&has(r.selection)&&has(r.contextRisk),'editorial.scriptReview requires selection and contextRisk');
 must(Array.isArray(r.rejectedAngles)&&r.rejectedAngles.every(x=>has(x.angle)&&has(x.reason)),'scriptReview.rejectedAngles requires angle/reason');
 must(Array.isArray(r.unresolved)&&r.unresolved.every(has),'scriptReview.unresolved must be a string array');
 must(r.rejectedAngles.length>0||r.unresolved.some(x=>has(x)),'record comparison or reason it could not be completed');
 const match=(items,expected,fields,name)=>{
  must(Array.isArray(items)&&items.length===expected.length,name+' must cover each segment once');
  const ids=new Set(items.map(x=>x.id));
  must(ids.size===expected.length&&expected.every(x=>ids.has(x.id)),name+' IDs mismatch');
  must(items.every(x=>fields.every(f=>has(x[f]))),name+' missing review text');
 };
 match(r.hooks,b.hooks,['promiseCheck','tradeoff'],'scriptReview.hooks');
 match(r.annotations,b.body.filter(x=>x.role==='ANNOTATION'),['addedKnowledge','basis','limitations'],'scriptReview.annotations');
 return r;
}
function estimate(s){
 // Deliberately only rough planning: no actual timing is inferred.
 return s.role==='QUOTE'?plain(s.en).split(/\s+/).length/2.35:plain(s.ja).length/5;
}
function visual(v){
 return [v.pattern,v.headline,v.term,v.meaning,v.value,v.revealAtCue?.join(','),v.kicker,v.items?.map(x=>x.label+': '+x.text).join(' → '),v.detail,v.asset,v.dateLabel,v.credit].filter(Boolean).join(' / ');
}
function exportScript(file){
 const full=path.resolve(file),b=read(full),r=studio('check',full),ed=review(b);
 const folder=path.dirname(full);
 const source=doc(b.source.slug).meta;
 const lines=['# '+b.title,'','**台本・制作指示（非公開の編集用）** — 構造・教材原文の検査 PASS。事実・録音・権利・映像の審査は別。','',
  '- 原典: '+source.title+' / '+b.source.url,'- 発言者: '+b.speaker.name+' / '+b.speaker.disclosure,
  '- 場面: '+b.source.eventContext,'- 対象: '+b.editorial.target,'- 視聴後の理解: '+b.editorial.payoff,'- 教材: '+b.editorial.articleUrl,
  '- 教材参照審査: '+(r.articleReviewVerified?'対象教材・章の固定版、引用・話者・時刻・来歴の構造確認済':'未審査')+' / 教材の原典転写来歴: '+r.transcriptProvenance,
  '- 原典録音照合: '+(b.source.originalAudioChecked?'briefで確認済と申告（証跡は別途）':b.speaker.audioKind==='synthetic'?'未照合。教材を合成朗読するため再取得不要':'未確認・実録利用不可'),
  '- 原典権利審査: '+(b.source.rightsReviewed?'briefで審査済と申告':'未確認'),
  '- 公開承認: '+(b.publication.approved?'briefで承認済と申告（公開操作なし）':'未承認'),
  '- BGM: '+b.music.motif,'','## フック比較（本編共通）',''];
 const scenes=(s)=>{
  const rows=['### '+s.id+' / '+s.role,''];
  if(s.role==='QUOTE')rows.push('- 教材参照: '+s.sourceRef.chapterId+'/'+s.sourceRef.utteranceId+' @ '+s.sourceRef.time+'（発話開始の記録、切出し境界ではない）','- 英語音声: '+s.en,'- 和訳: '+s.ja);
  else rows.push('- 日本語編者音声: '+s.ja,'- 根拠: '+s.evidence);
  rows.push('- 映像: '+visual(s.visual),'- 音響: '+(s.effect||'none'),'- 理解の間: '+(s.holdMs||0)+'ms（追加）','- 概算発話尺: 約'+Math.round(estimate(s))+'秒（実測ではない）','- 字幕の意味句:');
  for(const c of s.cues)rows.push('  - '+(c.en?c.en+' / ':'')+c.ja+(c.hiEN?' ｜強調: '+c.hiEN+' ⇔ '+c.hiJA:''));
  return rows.concat('');
 };
 for(const h of b.hooks){
  const a=ed.hooks.find(x=>x.id===h.id);
  lines.push('**'+h.mechanism+'**'+(h.id===b.selectedHook?'（推奨版）':'')+' — '+h.promise,'- 回収の審査: '+a.promiseCheck,'- 比較上の得失: '+a.tradeoff,...scenes(h));
 }
 lines.push('## 共通本編','');for(const s of b.body)lines.push(...scenes(s));
 lines.push('## 編集審査','- 採用理由: '+ed.selection,'- 文脈・誤読のリスク: '+ed.contextRisk,'- 比較した他の論点:');
 for(const a of ed.rejectedAngles)lines.push('  - '+a.angle+' — '+a.reason);
 if(!ed.rejectedAngles.length)lines.push('  - 比較不足（未確認事項参照）');
 lines.push('- 編者註の追加価値:');for(const a of ed.annotations)lines.push('  - '+a.id+': '+a.addedKnowledge+' / 根拠: '+a.basis+' / 留保: '+a.limitations);
 lines.push('- 未確認事項:');for(const x of ed.unresolved)lines.push('  - '+x);
 if(!ed.unresolved.length)lines.push('  - 台本担当者による申告なし。技術検査は独立した真実性・権利確認ではない。');
 const media=new Map();const add=(name,kind,details='')=>{if(has(name))media.set(name,{kind,details})};
 for(const s of [...b.hooks,...b.body]){
  add(s.visual.asset,'映像',s.visual.credit||'');
  if(s.role==='QUOTE'&&s.visual.pattern==='archive')add(b.speaker.portrait,'肖像',b.speaker.portraitCredit||'');
  if(s.timing.mode==='measured')add(s.audio,'音声',s.voiceId);
  else for(const c of s.cues)add(c.audio,'音声',s.voiceId);
 }
 lines.push('','## 制作引継ぎ','素材の存在チェック（内容・権利・同期の検証ではない）:');
 for(const [f,m] of media)lines.push('- ['+(fs.existsSync(path.resolve(folder,f))?'x':' ')+'] '+m.kind+' '+f+' — '+m.details);
 lines.push('','各フックの概算合計発話尺（無音・間・画面演出を含まない）:');
 for(const h of b.hooks)lines.push('- '+h.id+': 約'+Math.round([h,...b.body].reduce((n,s)=>n+estimate(s),0))+'秒');
 lines.push('','次工程: 教材参照審査と素材・引用・音声の利用権を確認し、発話境界を実測。原典録音は実録音声使用時のみ別途照合。Studio v2 の --media / render を使用。投稿は別承認。');
 must(r.ok,'invalid brief');return lines.join('\n')+'\n';
}
try{
 const [cmd,arg,...rest]=process.argv.slice(2);
 must(has(arg),'usage: prepare <slug> [--chapter <id>] | export <brief.json>');
 if(cmd==='prepare'){
  must(!rest.length||(rest.length===2&&rest[0]==='--chapter'&&safe(rest[1])),'invalid prepare options');
  console.log(JSON.stringify(prepare(arg,rest[1]),null,2));
 }else if(cmd==='export'){must(!rest.length,'export takes one brief path');process.stdout.write(exportScript(arg))}
 else throw Error('unknown command '+cmd);
}catch(e){console.error(e.message);process.exitCode=1}
