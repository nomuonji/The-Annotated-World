import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {load} from 'cheerio';

export const CONTENT_DIR=join(process.cwd(),'src/content/documents');
const slug=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const chapterId=/^[a-z][a-z0-9-]*$/;
const utteranceId=/^[a-z][a-z0-9-]*$/;
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=value=>typeof value==='string'&&value.trim().length>0;
const fail=(path,reason)=>{throw Error(path+': '+reason);};
const urlOk=value=>typeof value==='string'&&/^https:\/\/[^\s<>"']+$/.test(value);
const seconds=value=>{const a=value.split(':').map(Number);return a.reduce((n,v)=>n*60+v,0);};
const timePattern=/^\d{1,3}:\d{2}:\d{2}$/;
const genreSet=new Set(['philosophy','literature','film-culture','society','technology','internet']);

function renderDocument(document,chapters){
 const facts=document.facts.map(f=>'<div class="meta-item"><dt>'+escape(f.label)+'</dt><dd>'+(f.url?'<a href="'+escape(f.url)+'" target="_blank" rel="noopener noreferrer">'+escape(f.value)+'</a>':escape(f.value))+'</dd></div>').join('\n');
 const toc=chapters.map((c,i)=>'<li><a href="#'+escape(c.id)+'"><span class="toc-time">'+escape(c.timeRange.match(/\d{1,3}:\d{2}:\d{2}/)?.[0]||'')+'</span>'+(i+1)+'. '+escape(c.title.replace(/^\d+[.．]\s*/,''))+'</a></li>').join('\n');
 const transcriptLink=c=>{if(!document.transcriptBaseUrl)return '';const url=new URL(document.transcriptBaseUrl);const start=c.timeRange.match(/\d{1,3}:\d{2}:\d{2}/)?.[0];if(start)url.searchParams.set('t',String(seconds(start)));return '<p class="source-transcript"><a href="'+escape(url.href)+'" target="_blank" rel="noopener noreferrer">この章の原文スクリプトを出典で読む</a></p>';};
 const body=chapters.map(c=>'<section class="sec" id="'+escape(c.id)+'">'+
 '<div class="sec-header"><p class="sec-time">'+escape(c.timeRange)+'</p><h2>'+escape(c.title)+'</h2><p class="sec-sub">'+escape(c.summary)+'</p>'+transcriptLink(c)+'</div>'+
 c.utterances.map(u=>'<div class="utterance" id="'+escape(u.id)+'">'+
 '<p class="speaker-line"><span class="'+escape(u.speaker.className)+'">'+escape(u.speaker.name)+'</span> · '+escape(u.time)+'</p>'+
 '<p class="en">'+u.english+'</p><p class="ja">'+u.japanese+'</p>'+
 '<p class="note">'+u.annotations.map(a=>'<span class="note-entry" data-note-id="'+escape(a.id)+'">'+(a.phrase?'<strong>'+escape(a.phrase)+'</strong>：':'')+escape(a.explanation)+'</span>').join('')+'</p></div>').join('\n')+
 '</section>').join('\n');
 const sources=document.sources.items.map(s=>'<li>'+escape(s.before)+'<a href="'+escape(s.url)+'" target="_blank" rel="noopener noreferrer">'+escape(s.label)+'</a>'+escape(s.after)+'</li>').join('\n');
 return '<header class="hero"><p class="hero-meta">'+escape(document.heroMeta)+'</p><h1>'+escape(document.title)+'</h1><p class="deck">'+escape(document.description)+'</p><dl class="meta-strip">'+facts+'</dl></header>\n'+
 '<nav class="toc" aria-label="チャプター目次"><h2>'+escape(document.toc.title)+'</h2><p class="toc-lead">'+escape(document.toc.description)+'</p><ol class="toc-list">'+toc+'</ol></nav>\n'+
 body+'\n<footer class="sources"><h2>'+escape(document.sources.title)+'</h2><ol>'+sources+'</ol></footer>';
}

function verifyDocument(id,document){
 if(!document||typeof document!=='object')fail(id,'document.json is not an object');
 for(const k of ['title','heroMeta','description'])if(!text(document[k]))fail(id,'missing '+k);
 if(!Array.isArray(document.chapterOrder)||!document.chapterOrder.length||new Set(document.chapterOrder).size!==document.chapterOrder.length)fail(id,'chapterOrder missing or duplicate');
 if(!Array.isArray(document.facts)||!document.facts.length)fail(id,'missing metadata facts');
 for(const f of document.facts)if(!text(f.label)||!text(f.value)||(f.url&&!urlOk(f.url)))fail(id,'invalid metadata fact');
 if(!document.toc||!text(document.toc.title)||!text(document.toc.description))fail(id,'invalid toc');
 if(!document.sources||!text(document.sources.title)||!Array.isArray(document.sources.items)||!document.sources.items.length)fail(id,'invalid sources');
 for(const item of document.sources.items)if(typeof item.before!=='string'||typeof item.after!=='string'||!text(item.label)||!urlOk(item.url))fail(id,'invalid source item');
 if(!genreSet.has(document.genre)||!text(document.format))fail(id,'genre and format are mandatory');
 if(document.transcriptBaseUrl!==undefined&&!urlOk(document.transcriptBaseUrl))fail(id,'invalid transcriptBaseUrl');
 if(!document.provenance||!urlOk(document.provenance.sourceUrl)||!text(document.provenance.basis))fail(id,'provenance required');
 if(!['full','excerpt','unverified'].includes(document.provenance.coverage)||
  !['verified','unverified','not-applicable'].includes(document.provenance.transcript)||
  !['verified','unverified'].includes(document.provenance.translation)||
  !['original','licensed','public-domain','unverified'].includes(document.provenance.rights))fail(id,'invalid provenance status');
 if(!Array.isArray(document.people)||!Array.isArray(document.topics))fail(id,'people and topics must be arrays');
 // Content publication is controlled by presence in the repository, never an editorial status flag.
 for(const key of ['status','draft','published','retired','chapterMetadata'])if(Object.hasOwn(document,key))fail(id,'unsupported legacy field '+key);
}
function verifyChapter(id,chapter,seen){
 const at=id+'/'+chapter?.id;
 if(!chapter||!chapterId.test(chapter.id))fail(id,'chapter id invalid');
 for(const field of ['title','timeRange','summary'])if(!text(chapter[field]))fail(at,'missing '+field);
 if(!Array.isArray(chapter.genres)||!chapter.genres.length||chapter.genres.some(g=>!genreSet.has(g)))fail(at,'invalid genres');
 if(!Array.isArray(chapter.topics)||!chapter.topics.length||chapter.topics.some(t=>!slug.test(t.id)||!text(t.name)))fail(at,'missing/invalid topics');
 if(!Array.isArray(chapter.utterances)||!chapter.utterances.length)fail(at,'missing utterances');
 let last=-1;const noteIds=new Set();
 for(const u of chapter.utterances){
  if(!utteranceId.test(u.id)||!u.id.startsWith(chapter.id+'-')||seen.has(u.id))fail(at,'duplicate/invalid fixed utterance id '+u.id);
  seen.add(u.id);
  if(!u.speaker||!text(u.speaker.name)||!text(u.speaker.className))fail(u.id,'speaker required');
  if(!timePattern.test(u.time)||seconds(u.time)<last)fail(u.id,'missing or nonmonotonic timestamp');
  last=seconds(u.time);
  if(!text(u.english)||!text(u.japanese))fail(u.id,'source English and Japanese are required');
  if(!Array.isArray(u.annotations)||!u.annotations.length)fail(u.id,'missing notes');
  const sourceEnglish=load('<p>'+u.english+'</p>')('p').text().toLocaleLowerCase();
  for(const a of u.annotations){
   if(!text(a.id)||!a.id.startsWith(u.id+'-note-')||noteIds.has(a.id)||typeof a.phrase!=='string'||!text(a.explanation))fail(u.id,'invalid note id, phrase or explanation');
   noteIds.add(a.id);
   // The imported first article includes historic pattern-based labels. New articles quote exact English.
   if(id!=='slavoj-zizek-signs-from-the-future'&&(!a.phrase||!sourceEnglish.includes(a.phrase.toLocaleLowerCase())))fail(a.id,'annotation must match source English');
  }
 }
}
export async function loadStructuredDocuments(){
 const all=await readdir(CONTENT_DIR,{withFileTypes:true});
 const loose=all.filter(e=>e.isFile()&&/\.(?:html|meta\.json|annotations\.json)$/.test(e.name));
 if(loose.length)fail(CONTENT_DIR,'legacy files in active content directory: '+loose.map(e=>e.name).join(', '));
 const ids=all.filter(e=>e.isDirectory()).map(e=>e.name).sort();
 if(!ids.length)fail(CONTENT_DIR,'no document directories');
 return Promise.all(ids.map(async id=>{
  if(!slug.test(id))fail(id,'invalid document slug');
  const base=join(CONTENT_DIR,id);
  const document=JSON.parse(await readFile(join(base,'document.json'),'utf8'));
  verifyDocument(id,document);
  const existing=(await readdir(join(base,'chapters'))).filter(p=>p.endsWith('.json')).sort();
  const expected=document.chapterOrder.map(s=>s+'.json').sort();
  if(JSON.stringify(existing)!==JSON.stringify(expected))fail(id,'chapter files and chapterOrder mismatch');
  const seen=new Set();
  const chapters=[];
  for(const anchor of document.chapterOrder){
   if(!chapterId.test(anchor))fail(id,'invalid chapter id '+anchor);
   const chapter=JSON.parse(await readFile(join(base,'chapters',anchor+'.json'),'utf8'));
   if(chapter.id!==anchor)fail(id,'chapter filename and id mismatch: '+anchor);
   verifyChapter(id,chapter,seen);
   chapters.push(chapter);
  }
  const bodyHtml=renderDocument(document,chapters);
  return {id,document,chapters,bodyHtml};
 }));
}
