import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {loadStructuredDocuments} from '../src/lib/document-source.mjs';

const args=process.argv.slice(2),strict=args.includes('--check'),selected=args.find(a=>!a.startsWith('--'));
const sources=await loadStructuredDocuments();
if(selected&&!sources.some(s=>s.id===selected))throw Error('Unknown document: '+selected);
const problems=[],warnings=[],catalog=[],topicMap=new Map(),personMap=new Map(),sourceMap=new Map();
const err=(id,msg)=>problems.push(id+': '+msg),warn=(id,msg)=>warnings.push(id+': '+msg);
const timeOf=value=>value.split(':').reduce((n,x)=>n*60+Number(x),0);
const sourceKey=s=>{try{const u=new URL(s),host=u.hostname.toLowerCase(),v=host==='youtu.be'?u.pathname.split('/')[1]:['www.youtube.com','youtube.com','m.youtube.com'].includes(host)?u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]:null;if(v&&/^[A-Za-z0-9_-]{11}$/.test(v))return 'youtube:'+v;u.hash='';return u.href;}catch{return '';}};
function register(map,item,id){
 if(!item||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(item.id)||!item.name?.trim()){err(id,'invalid person/topic: '+JSON.stringify(item));return;}
 const previous=map.get(item.id);if(previous&&previous!==item.name)err(id,'inconsistent label for '+item.id+': '+previous+' / '+item.name);
 map.set(item.id,item.name);
}
for(const {id,document,chapters} of sources){
 for(const person of document.people||[])register(personMap,person,id);
 for(const topic of document.topics||[])register(topicMap,topic,id);
 const provenance=document.provenance;
 if(provenance?.rights==='unverified')warn(id,'publication rights unverified');
 if(provenance?.transcript==='unverified'||provenance?.translation==='unverified')warn(id,'transcript or translation review unverified');
 const embeddedSource=document.facts.find(f=>f.label==='元動画')?.url||'',source=embeddedSource||provenance?.sourceUrl;
 const key=sourceKey(source);
 if(!key)err(id,'valid original source URL missing');
 else if(sourceMap.has(key))err(id,'duplicate source with '+sourceMap.get(key));
 else sourceMap.set(key,id);
 if(embeddedSource&&provenance?.sourceUrl&&sourceKey(embeddedSource)!==sourceKey(provenance.sourceUrl))err(id,'source URL disagrees with provenance');
 const allAnchors=new Set(),chapterSummaries=[],blocks=[];let total=0,previous=-1;
 for(const chapter of chapters){
  const start=chapter.timeRange.match(/\b\d{1,3}:\d{2}:\d{2}\b/)?.[0]||'';
  for(const topic of chapter.topics)register(topicMap,topic,id);
  if(!start)err(id,'missing chapter timestamp '+chapter.id);
  for(const entry of chapter.utterances){
   if(allAnchors.has(entry.id))err(id,'duplicate fixed utterance id '+entry.id);
   allAnchors.add(entry.id);
   const stamp=timeOf(entry.time);
   if(stamp<previous)err(id,'non-monotonic document timestamp '+entry.id);
   previous=stamp;total++;
   const $=load('<div class="utterance"><p class="en">'+entry.english+'</p><p class="ja">'+entry.japanese+'</p></div>');
   const en=$('.en').text(),ja=$('.ja').text();
   const terms=$('.en strong.key').toArray().map(n=>$(n).text());
   if(!en.trim()||!ja.trim())err(id,'missing bilingual content '+entry.id);
   const note=entry.annotations.map(a=>(a.phrase?a.phrase+'：':'')+a.explanation).join('');
   blocks.push({anchor:entry.id,en,ja,note,time:stamp,terms});
  }
  chapterSummaries.push({anchor:chapter.id,title:chapter.title,startSeconds:start?timeOf(start):null,utterances:chapter.utterances.length});
 }
 catalog.push({id,title:document.title,source,genre:document.genre,chapterCount:chapters.length,utteranceCount:total,chapters:chapterSummaries,provenance,...(selected===id?{utterances:blocks}: {})});
}
const concepts=JSON.parse(await readFile('src/data/concepts.json','utf8'));
const ids=new Set();
for(const concept of concepts){
 if(!concept.id||ids.has(concept.id)||!Array.isArray(concept.aliases)||!concept.aliases.length)err('concept registry','invalid or duplicate concept '+concept.id);
 ids.add(concept.id);
}
const report={documents:selected?catalog.filter(d=>d.id===selected):catalog,
 topics:[...topicMap].map(([id,name])=>({id,name})),
 people:[...personMap].map(([id,name])=>({id,name})),
 concepts:concepts.map(({id,name,ja,kind,aliases})=>({id,name,ja,kind,aliases})),warnings,errors:problems};
console.log(JSON.stringify(strict?{documents:catalog.map(({id,chapterCount,utteranceCount})=>({id,chapterCount,utteranceCount})),warnings,errors:problems}:report,null,2));
if(problems.length)process.exitCode=1;
