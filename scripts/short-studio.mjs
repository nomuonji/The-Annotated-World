#!/usr/bin/env node
// Source-first editorial planning. No publishing or synthetic transcript creation.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const catalog=read(path.join(ROOT,'templates/annotated-short/studio-catalog.json'));
const [cmd,arg,...flags]=process.argv.slice(2);
const nonempty=x=>typeof x==='string'&&x.trim().length>0;
const requireThat=(x,m)=>{if(!x)throw Error(m)};
const plain=s=>String(s??'').replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const ja=s=>String(s??'').replace(/\s/g,'');
const safeId=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]+$/.test(s);
function document(slug){
 requireThat(safeId(slug),'invalid document slug');
 const root=path.join(ROOT,'src/content/documents',slug);
 const doc=read(path.join(root,'document.json'));
 const chapters=doc.chapterOrder.map(id=>{requireThat(safeId(id),'bad chapter ID');return read(path.join(root,'chapters',id+'.json'))});
 return {doc,chapters};
}
function discover(slug){
 const {doc,chapters}=document(slug);
 const candidates=[];
 for(const ch of chapters)for(const u of ch.utterances){
  const text=plain(u.english), notes=u.annotations||[];
  if(!text||!u.time)continue;
  const sentences=text.match(/[^.!?]+[.!?]+(?:["”])?|[^.!?]+$/g)||[];
  for(const raw of sentences){
   const quote=raw.trim(), n=quote.split(/\s+/).length;
   if(n<5||n>42)continue;
   const evidence=notes.filter(a=>quote.toLowerCase().includes(plain(a.anchor||a.phrase).toLowerCase())).map(a=>({id:a.id,kind:a.kind,phrase:a.anchor||a.phrase,explanation:a.explanation}));
   const signals=[/\?/.test(quote)&&'question',/\b(but|however|instead|yet|nonetheless|too much|rather|not that)\b/i.test(quote)&&'paradox',/\b(consequence|result|end up|led to|became|wrong)\w*\b/i.test(quote)&&'consequence'].filter(Boolean);
   if(!signals.length&&!evidence.length)continue;
   candidates.push({chapterId:ch.id,utteranceId:u.id,time:u.time,speaker:u.speaker?.name,quote,signals,annotations:evidence,chapterSummary:ch.summary,sourceContext:text,score:signals.length*2+Math.min(evidence.length,2)});
  }
 }
 candidates.sort((a,b)=>b.score-a.score);
 // Diversity by utterance, not all variants from one paragraph.
 const picked=[], seen=new Map();
 for(const c of candidates){if((seen.get(c.utteranceId)||0)>=2)continue;seen.set(c.utteranceId,(seen.get(c.utteranceId)||0)+1);picked.push(c);if(picked.length===24)break}
 return {document:slug,title:doc.title,candidates:picked,warning:'Heuristic candidates only. Editor must read context, verify meaning, rights, speaker, translation, and choose one coherent argument. Time is utterance-level, not clip boundary.'};
}
function check(b,dir,media=false,publish=false){
 requireThat(b.format==='annotated-short-studio/v2','wrong format');
 for(const f of [b.title,b.speaker?.name,b.speaker?.voiceId,b.speaker?.disclosure,b.editor?.voiceId,b.source?.slug,b.source?.url,b.source?.eventContext])requireThat(nonempty(f),'missing title/source/voice identity');
 requireThat(b.speaker.voiceId!==b.editor.voiceId,'distinct role voices required');
 requireThat(['synthetic','original'].includes(b.speaker.audioKind),'explicit audio kind required');
 requireThat(b.speaker.audioKind!=='original'||b.source.originalAudioChecked===true,'original voice requires verified recording');
 const {chapters}=document(b.source.slug);
 const lookup=new Map(chapters.flatMap(ch=>ch.utterances.map(u=>[ch.id+'/'+u.id,u])));
 const ids=new Set();
 const file=(f,label)=>{requireThat(nonempty(f)&&!path.isAbsolute(f)&&!f.split(/[\\/]/).includes('..'),label+' invalid path');if(media)requireThat(fs.existsSync(path.join(dir,f))&&fs.statSync(path.join(dir,f)).isFile(),label+' missing '+f)};
 function segment(s){
  requireThat(safeId(s.id)&&!ids.has(s.id),'duplicate/invalid segment id '+s.id);ids.add(s.id);
  const q=s.role==='QUOTE';
  requireThat(catalog.patterns[s.visual?.pattern]?.roles.includes(s.role),s.id+' unsupported visual role/pattern');
  const expected=q?b.speaker.voiceId:b.editor.voiceId;
  requireThat(s.voiceId===expected,s.id+' voice mismatch');
  requireThat(Array.isArray(s.cues)&&s.cues.length>0,s.id+' empty cues');
  if(q){
   const u=lookup.get(s.sourceRef?.chapterId+'/'+s.sourceRef?.utteranceId);
   requireThat(u&&nonempty(s.en)&&plain(u.english).includes(plain(s.en)),s.id+' quote not found in referenced utterance');
   requireThat(u.time===s.sourceRef.time,s.id+' source timestamp mismatch');
   requireThat(u.speaker?.name===b.speaker.sourceName,s.id+' source speaker mismatch');
   requireThat(nonempty(s.ja)&&plain(s.cues.map(c=>c.en).join(' '))===plain(s.en),s.id+' EN cue omission');
   requireThat(ja(s.cues.map(c=>c.ja).join(''))===ja(s.ja),s.id+' JA cue omission');
  }else{
   requireThat(nonempty(s.evidence)&&nonempty(s.ja)&&ja(s.cues.map(c=>c.ja).join(''))===ja(s.ja),s.id+' missing note/evidence or JA mismatch');
   requireThat(!s.en&&s.cues.every(c=>!c.en),s.id+' editor must not impersonate source');
  }
  const v=s.visual;
  requireThat(s.holdMs==null||(Number.isInteger(s.holdMs)&&s.holdMs>=0&&s.holdMs<=3000),s.id+' invalid comprehension hold');
  if(v.revealAtCue!=null){
   requireThat(['contrast','timeline','branch','sequence'].includes(v.pattern)&&Array.isArray(v.revealAtCue)&&v.revealAtCue.length===v.items?.length&&v.revealAtCue[0]===0&&v.revealAtCue.every((n,i)=>Number.isInteger(n)&&n>=0&&n<s.cues.length&&(i===0||n>=v.revealAtCue[i-1])),s.id+' invalid cue reveal schedule');
  }
  if(['branch','sequence'].includes(v.pattern))requireThat(Array.isArray(v.items)&&v.items.length===3&&v.items.every(i=>nonempty(i.label)&&nonempty(i.text)),s.id+' three grounded visual items required');
  if(v.pattern==='language'){
   const u=lookup.get(v.termRef?.chapterId+'/'+v.termRef?.utteranceId);
   requireThat(u&&nonempty(v.term)&&plain(u.english).toLowerCase().includes(plain(v.term).toLowerCase())&&nonempty(v.meaning)&&nonempty(v.value)&&nonempty(v.detail),s.id+' language term needs exact source, meaning, interpretive value and concise detail');
   requireThat([...b.hooks,...b.body].some(q=>q.role==='QUOTE'&&q.sourceRef?.chapterId===v.termRef.chapterId&&q.sourceRef?.utteranceId===v.termRef.utteranceId&&plain(q.en).toLowerCase().includes(plain(v.term).toLowerCase())),s.id+' term must appear in a selected quote');
  }
  if(v.pattern==='closing')requireThat(s===b.body.at(-1)&&nonempty(v.headline)&&(s.holdMs??0)>=500,s.id+' closing must be final with a deliberate hold');
  if(['portrait','archive'].includes(v.pattern)){file(v.asset,s.id+' visual');requireThat(nonempty(v.credit)&&nonempty(v.dateLabel),s.id+' visual provenance required')}
  if(q&&v.pattern==='archive'){file(b.speaker.portrait,'speaker portrait');requireThat(nonempty(b.speaker.portraitCredit), 'speaker portrait credit')}
  if(['contrast','timeline'].includes(v.pattern))requireThat(Array.isArray(v.items)&&v.items.length===2&&v.items.every(i=>nonempty(i.label)&&nonempty(i.text)),s.id+' two grounded visual items required');
  if(['title','concept'].includes(v.pattern))requireThat(nonempty(v.headline),s.id+' headline required');
  requireThat(['none','note-entry','reversal','resolution'].includes(s.effect||'none'),s.id+' unknown effect');
  const mode=s.timing?.mode;
  requireThat(['cue-audio','measured'].includes(mode),s.id+' timing must be measured or per-cue audio');
  if(mode==='measured'){
   file(s.audio,s.id+' audio');
   requireThat(['manual-listening','tts-boundaries','waveform-reviewed','source-timestamps'].includes(s.timing.evidence),s.id+' timing provenance required');
   requireThat(Number.isFinite(s.timing.start)&&Number.isFinite(s.timing.end)&&s.timing.start>=0&&s.timing.end>s.timing.start,s.id+' invalid trim');
   requireThat(Array.isArray(s.timing.cuts)&&s.timing.cuts.length===s.cues.length-1,s.id+' cut count mismatch');
   let prev=s.timing.start;
   for(const cut of s.timing.cuts){requireThat(Number.isFinite(cut)&&cut>prev&&cut<s.timing.end,s.id+' invalid cue cut');prev=cut}
  }
  for(const c of s.cues){
   requireThat(nonempty(c.ja)&&(!q||nonempty(c.en)),s.id+' empty caption');
   requireThat(!!c.hiEN===!!c.hiJA&&(!c.hiEN||(c.en.includes(c.hiEN)&&c.ja.includes(c.hiJA))),s.id+' highlight pair invalid');
   if(mode==='cue-audio')file(c.audio,s.id+' cue audio');
  }
 }
 requireThat(Array.isArray(b.hooks)&&b.hooks.length>=2&&b.hooks.length<=3,'2–3 distinct hooks required');
 const mechanisms=new Set();
 for(const h of b.hooks){requireThat(h.role==='QUOTE'&&catalog.hooks[h.mechanism]&&!mechanisms.has(h.mechanism)&&nonempty(h.promise), 'distinct quote hook mechanism and promise required');mechanisms.add(h.mechanism);segment(h)}
 requireThat(b.hooks.some(h=>h.id===b.selectedHook),'select a hook');
 const roles=b.body?.map(s=>s.role)||[];
 requireThat(roles.length>=4&&roles[0]==='CONTEXT'&&roles[1]==='QUOTE'&&['QUOTE','ANNOTATION'].includes(roles.at(-1))&&roles.filter(r=>r==='CONTEXT').length===1&&roles.includes('ANNOTATION'),'body must introduce source, alternate and end in quote or closing annotation');
 for(let i=0;i<roles.length;i++){if(roles[i]==='ANNOTATION')requireThat(roles[i-1]==='QUOTE'&&(i===roles.length-1||roles[i+1]==='QUOTE'),'note must follow a quote and either precede a quote or close the body');segment(b.body[i])}
 requireThat(catalog.audio.motifs[b.music?.motif],'choose original motif');
 requireThat(nonempty(b.editorial?.payoff)&&nonempty(b.editorial?.target)&&nonempty(b.editorial?.articleUrl),'editorial payoff/target/article link required');
 if(publish){
  requireThat(b.publication?.approved===true&&b.source.originalAudioChecked===true&&b.source.rightsReviewed===true&&b.music.rightsReviewed===true,'publication gates not cleared');
  requireThat([...b.hooks,...b.body].every(s=>!['portrait','archive'].includes(s.visual.pattern)||s.visual.rightsReviewed===true),'visual rights not cleared');
  if([...b.hooks,...b.body].some(s=>s.role==='QUOTE'&&s.visual.pattern==='archive'))requireThat(b.speaker.portraitRightsReviewed===true,'portrait rights not cleared');
 }
 return {ok:true,hooks:b.hooks.map(h=>h.id),segments:b.body.length+1,publicationApproved:b.publication?.approved===true,warning:'Structural/source-text validation only; recording, translations, rights, first frames, audio and audience quality require separate review.'};
}
function metrics(data){
 requireThat(Array.isArray(data)&&data.length>0,'metrics array required');
 const seen=new Set(), groups=new Map();
 for(const r of data){
  for(const f of ['productionId','hookId','platform','publishedAt','window','bodyRevision'])requireThat(nonempty(r[f]),'metrics missing '+f);
  requireThat(['24h','72h','7d'].includes(r.window),'use comparable fixed measurement window');
  const key=[r.platform,r.productionId,r.hookId,r.window,r.bodyRevision].join('/');
  requireThat(!seen.has(key),'duplicate observation '+key);seen.add(key);
  for(const f of ['shown','engagedViews','views'])if(r[f]!=null)requireThat(Number.isInteger(r[f])&&r[f]>=0,'invalid '+f);
  for(const f of ['stayedPct','averageViewedPct','completionPct'])if(r[f]!=null)requireThat(Number.isFinite(r[f])&&r[f]>=0&&(f==='averageViewedPct'||r[f]<=100),'invalid '+f);
  const group=[r.platform,r.productionId,r.bodyRevision,r.window].join('/');
  if(!groups.has(group))groups.set(group,[]);groups.get(group).push(r);
 }
 return [...groups].map(([comparison,rows])=>({comparison,rows:rows.map(r=>({hookId:r.hookId,shown:r.shown??null,views:r.views??null,engagedViews:r.engagedViews??null,stayedPct:r.stayedPct??null,averageViewedPct:r.averageViewedPct??null,completionPct:r.completionPct??null,dropoffs:r.dropoffs??[]})),interpretation:rows.length<2?'No matched hook comparison yet.':'Descriptive comparison only; consider exposure, traffic mix, posting time and uncertainty. No causal winner or automatic promotion.'}));
}
try{
 requireThat(arg,'usage: discover <slug> | check/plan <brief.json> | metrics <observations.json>');
 if(cmd==='discover')console.log(JSON.stringify(discover(arg),null,2));
 else if(cmd==='metrics')console.log(JSON.stringify(metrics(read(arg)),null,2));
 else if(['check','plan'].includes(cmd)){
  const b=read(arg);const r=check(b,path.dirname(path.resolve(arg)),flags.includes('--media')||flags.includes('--publish'),flags.includes('--publish'));
  console.log(JSON.stringify(cmd==='plan'?{...r,variants:b.hooks.map(h=>({hookId:h.id,sequence:[h,...b.body].map(s=>({id:s.id,role:s.role,pattern:s.visual.pattern,timing:s.timing.mode}))}))}:r,null,2));
 }else throw Error('unknown command '+cmd);
}catch(e){console.error(e.message);process.exitCode=1}
