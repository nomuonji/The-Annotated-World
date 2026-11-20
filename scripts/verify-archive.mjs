import {loadStructuredDocuments} from '../src/lib/document-source.mjs';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { load } from 'cheerio';
const sources=await loadStructuredDocuments();
const home=load(await readFile('dist/library/index.html','utf8'));
assert.equal(home('.document-entry').length,sources.length,'Library should list every source exactly once');
const historicChecksums={
 ch1:'e51610598383d472',ch2:'97e6016b90247d9c',ch3:'f8d72525e5963534',
 ch4:'25c85fa8ea04685a',ch5:'14ebe13fcb4eb92c',ch6:'fc5a6a46d2d887f0',
 ch7:'9b3771e22704928e',ch8:'ae8aa506af00e7a3',ch9:'85ebbe384a70db0e',
 ch10:'63a2d15c14668bb8',ch11:'4a4f624a2d72503f'
};
const fingerprint=s=>{let h=0xcbf29ce484222325n;for(let i=0;i<s.length;i++){h^=BigInt(s.charCodeAt(i));h=(h*0x100000001b3n)&0xffffffffffffffffn;}return h.toString(16).padStart(16,'0');};
for(const {id,document,chapters,bodyHtml} of sources){
 const source=load('<main class="page">'+bodyHtml+'</main>');
 const page=load(await readFile('dist/read/'+id+'/index.html','utf8'));
 assert.equal(home('.document-entry h3 a').filter((_,e)=>home(e).attr('href')==='/read/'+id+'/').length,1);
 for(const selector of ['.hero h1','.hero-meta','.deck','.meta-strip','.toc-list li','section.sec h2','.speaker-line','.utterance .en','.utterance .ja','.utterance .note','.sources']){
  const extract=($)=>$(selector).toArray().map(e=>{
   const copy=$(e).clone();
   if(selector==='.utterance .en')copy.find('.in-situ-annotation,.inline-note-ref').remove();
   return copy.text().trim();
  });
  assert.deepEqual(extract(page),extract(source),id+': '+selector);
 }
 const inline=($)=>$('.en strong.key,.note strong,.en em').toArray().map(e=>{
  const copy=$(e).clone();copy.find('.in-situ-annotation,.inline-note-ref').remove();return copy.text();
 });
 assert.deepEqual(inline(page),inline(source),id+': inline emphasis lost');
 const expected=chapters.flatMap(c=>c.utterances.map(u=>u.id));
 assert.deepEqual(page('.utterance').toArray().map(e=>page(e).attr('id')),expected,id+': fixed IDs changed');
 assert.equal(page('.in-situ-annotation').length>=expected.length,true,id+': not every utterance has a note');
 assert.equal(page('.note.annotation-converted').length,expected.length,id+': visible duplicate note panel');
 assert.equal(page('.en .inline-note-ref').length,0,id+': legacy footnote references remain');
 assert.equal(page('.editorial-annotation').length,0,id+': redundant audio hint remains');
 if(id==='slavoj-zizek-signs-from-the-future'){
  assert.equal(chapters.length,11);assert.equal(expected.length,61);
  for(const chapter of chapters){
   const digest=fingerprint(JSON.stringify({
    title:chapter.title,timeRange:chapter.timeRange,summary:chapter.summary,
    utterances:chapter.utterances.map(u=>[u.id,u.speaker.name,u.time,u.english,u.japanese,u.annotations.map(a=>[a.phrase,a.explanation])])
   }));
   assert.equal(digest,historicChecksums[chapter.id],chapter.id+': migrated transcript or annotation changed unexpectedly');
  }
 }
 console.log(id+': '+chapters.length+' chapters, '+expected.length+' stable utterance IDs; source content and inline notes matched');
}

const index=load(await readFile('dist/index.html','utf8'));
assert.equal(index('.genre-tile').length,6);
const sample=load(await readFile('dist/read/slavoj-zizek-signs-from-the-future/index.html','utf8'));
assert.equal(sample('#original-player').attr('src'),'https://www.youtube-nocookie.com/embed/j7pEsBbGg5A');
assert.equal(sample('[data-video-seek]').length,11);
assert.equal(sample('[data-utterance-play]').length,61);
assert.equal(sample('[data-mode]').length,3);
assert.equal(sample('[data-reveal]').length,61);
assert.ok(sample('#mobile-pin-video').length);
assert.equal(sample('section.sec#ch1 [data-video-seek]').attr('data-video-seek'),'21');
assert.ok(sample('a[href="/topics/psychoanalysis/"]').length);
assert.ok(sample('a[href="/people/slavoj-zizek/"]').length);
const genre=load(await readFile('dist/genres/film-culture/index.html','utf8'));
assert.ok(genre('a[href="/read/slavoj-zizek-signs-from-the-future/?chapter=ch8"]').length);
const topic=load(await readFile('dist/topics/psychoanalysis/index.html','utf8'));
assert.ok(topic('a[href="/read/slavoj-zizek-signs-from-the-future/?chapter=ch2"]').length);
const person=load(await readFile('dist/people/slavoj-zizek/index.html','utf8'));
assert.ok(person('a[href="/read/slavoj-zizek-signs-from-the-future/"]').length);
// Validate all local generated navigation targets and fragments. Skip the legacy importer.
async function walk(dir){const fs=await readdir(dir,{withFileTypes:true});return (await Promise.all(fs.map(f=>f.isDirectory()?walk(dir+'/'+f.name):[dir+'/'+f.name]))).flat();}
const pages=(await walk('dist')).filter(p=>p.endsWith('/index.html')&&!p.includes('/workspace/'));
const byPath=new Map();for(const p of pages){const url='/'+p.slice(5,-'index.html'.length);byPath.set(url,load(await readFile(p,'utf8')));}
for(const [url,$] of byPath)for(const a of $('a[href]').toArray()){const href=$(a).attr('href');if(!href||(!href.startsWith('/')&&!href.startsWith('#'))||href.startsWith('//'))continue;const u=new URL(href,'https://archive.local'+url);const target=byPath.get(u.pathname);assert.ok(target,'Broken internal link '+url+' -> '+href);if(u.hash)assert.ok(target('[id]').toArray().some(e=>target(e).attr('id')===decodeURIComponent(u.hash.slice(1))),'Broken anchor '+url+' -> '+href);}
const words=byPath.get('/words/');const concepts=byPath.get('/concepts/');assert.ok(words('.word-card').length>50);assert.ok(concepts('.word-card').length>=10);
const firstLink=sample('.en strong.key a[data-word]').first().attr('href');assert.ok(firstLink&&byPath.has(firstLink));assert.ok(byPath.get(firstLink)('.occurrence a[href="/read/slavoj-zizek-signs-from-the-future/#ch1-line-1"]').length);
assert.ok(byPath.get('/concepts/surplus-enjoyment/')('.occurrence').length);assert.equal(sample('.editorial-annotation').length,0);assert.equal(sample('.note.annotation-converted').length,61);assert.equal(sample('.en .in-situ-annotation').length>=61,true);
console.log('Knowledge indexes: '+words('.word-card').length+' expressions, '+concepts('.word-card').length+' concepts and references');
console.log('Discovery routes, video source and internal links verified: '+pages.length+' static pages');

const catalog=JSON.parse(await readFile('dist/catalog.json','utf8'));
assert.equal(catalog.documents.length,sources.length);
// The owner explicitly requested the removed article be rebuilt from the actual transcript source.
const rebuilt=catalog.documents.find(d=>d.id==='slavoj-zizek-how-to-become-free');
assert.ok(rebuilt,'Authorized transcript-grounded replacement missing from catalog');
assert.equal(rebuilt.chapters.length,12,'Replacement must cover the lecture in twelve sourced sections');
assert.equal(rebuilt.utteranceCount,36,'Replacement should retain 36 distinct bilingual reading blocks');
assert.equal(rebuilt.videoId,'4YSXNotY8QU','The original video source was lost');
assert.equal(rebuilt.provenance.transcript,'unverified','Do not claim verified audio/transcription');
const replacementPage=byPath.get('/read/slavoj-zizek-how-to-become-free/');
assert.ok(replacementPage,'Rebuilt article route missing');
assert.equal(replacementPage('section.sec').length,12);
assert.equal(replacementPage('.utterance').length,36);
assert.equal(replacementPage('.in-situ-annotation').length>=36,true);
assert.equal(replacementPage('.utterance .speaker-zizek').length,2,'Only two short direct transcript excerpts are published');
assert.equal(replacementPage('.utterance .speaker-host').length,34,'Original editorial guidance must be separately attributed');
assert.ok(replacementPage('.hero a[href="https://www.zizek.org/talk/slavoj-zizek-how-to-become-free"]').length,'Full source transcript link missing from article header');
assert.ok(replacementPage('a[href="https://www.youtube.com/watch?v=4YSXNotY8QU"]').length,'Original video link missing');
assert.equal(replacementPage('.chapter-end-nav').length,0,'Normal full reading should not show chapter-end buttons');
assert.equal(replacementPage('.chapter-trail').length,12);
assert.equal(replacementPage('.source-transcript a[href*="zizek.org/talk/slavoj-zizek-how-to-become-free?t="]').length,12,'Each chapter needs a direct original transcript jump');
const firstDoc=catalog.documents.find(d=>d.id==='slavoj-zizek-signs-from-the-future');assert.equal(firstDoc.chapters.length,11);assert.equal(firstDoc.provenance.rights,'unverified');
assert.equal(sample('.chapter-end-nav').length,0,'Normal article must not contain legacy chapter-end navigation');
assert.equal(sample('.chapter-trail').length,11,'Chapter-only trails must exist for all chapters');
assert.ok(sample('section#ch1 .chapter-trail a[href="/read/slavoj-zizek-signs-from-the-future/?chapter=ch2"]').length);
assert.ok(sample('section#ch2 .chapter-trail a[href="/read/slavoj-zizek-signs-from-the-future/?chapter=ch3"]').length,
 'Chapter mode must keep next-chapter navigation regardless of related documents');
assert.ok(sample('.provenance-grid').length);
assert.ok(catalog.documents.every(d=>!('bodyHtml' in d)));
