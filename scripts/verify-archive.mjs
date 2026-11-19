import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const dir='src/content/documents';
const entries=(await readdir(dir)).filter(n=>n.endsWith('.html'));
const home=load(await readFile('dist/library/index.html','utf8'));
assert.equal(home('.document-entry').length,entries.length,'Index should list every document exactly once');
for(const file of entries){
 const id=file.slice(0,-5);const raw=await readFile(dir+'/'+file);const source=load(raw.toString('utf8'));
 const page=load(await readFile('dist/read/'+id+'/index.html','utf8'));
 assert.equal(home('.document-entry h3 a').filter((_,e)=>home(e).attr('href')==='/read/'+id+'/').length,1);
 for(const selector of ['.hero h1','.hero-meta','.deck','.meta-strip','.toc-list li','section.sec h2','.speaker-line','.utterance .en','.utterance .ja','.utterance .note','.sources']){
  const extract=($)=>$(selector).toArray().map(e=>$(e).text().trim());
  // The reader contains exactly the source document elements, plus its site chrome.
  assert.deepEqual(extract(page),extract(source),file+': '+selector);
 }
 const inline=($)=>$('.en strong.key,.note strong,.en em').toArray().map(e=>$(e).text());
 assert.deepEqual(inline(page),inline(source),'Inline emphasis lost');
 if(id==='slavoj-zizek-signs-from-the-future'){
  assert.equal(createHash('sha256').update(raw).digest('hex'),'50700dc852923e693d7104111c9c729ccdb82d51c8e5af121b4c539d80fbb701','Original file was modified');
  assert.equal(page('section.sec').length,11);
  assert.equal(page('.utterance').length,61);
 }
 console.log(id+': '+page('section.sec').length+' chapters, '+page('.utterance').length+' utterances, source text and emphasis matched');
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
assert.ok(genre('a[href="/read/slavoj-zizek-signs-from-the-future/#ch8"]').length);
const topic=load(await readFile('dist/topics/psychoanalysis/index.html','utf8'));
assert.ok(topic('a[href="/read/slavoj-zizek-signs-from-the-future/#ch2"]').length);
const person=load(await readFile('dist/people/slavoj-zizek/index.html','utf8'));
assert.ok(person('a[href="/read/slavoj-zizek-signs-from-the-future/"]').length);
// Validate all local generated navigation targets and fragments. Skip the legacy importer.
async function walk(dir){const fs=await readdir(dir,{withFileTypes:true});return (await Promise.all(fs.map(f=>f.isDirectory()?walk(dir+'/'+f.name):[dir+'/'+f.name]))).flat();}
const pages=(await walk('dist')).filter(p=>p.endsWith('/index.html')&&!p.includes('/workspace/'));
const byPath=new Map();for(const p of pages){const url='/'+p.slice(5,-'index.html'.length);byPath.set(url,load(await readFile(p,'utf8')));}
for(const [url,$] of byPath)for(const a of $('a[href]').toArray()){const href=$(a).attr('href');if(!href||(!href.startsWith('/')&&!href.startsWith('#'))||href.startsWith('//'))continue;const u=new URL(href,'https://archive.local'+url);const target=byPath.get(u.pathname);assert.ok(target,'Broken internal link '+url+' -> '+href);if(u.hash)assert.ok(target('[id]').toArray().some(e=>target(e).attr('id')===decodeURIComponent(u.hash.slice(1))),'Broken anchor '+url+' -> '+href);}
console.log('Discovery routes, video source and internal links verified: '+pages.length+' static pages');
