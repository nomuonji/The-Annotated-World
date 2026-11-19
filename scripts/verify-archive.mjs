import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { load } from 'cheerio';
const dir='src/content/documents';
const entries=(await readdir(dir)).filter(n=>n.endsWith('.html'));
const home=load(await readFile('dist/index.html','utf8'));
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
