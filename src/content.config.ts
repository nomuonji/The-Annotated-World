import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load } from 'cheerio';

const directory=join(process.cwd(),'src/content/documents');
const allowedTags=new Set(['a','br','dd','div','dl','dt','em','footer','h1','h2','header','li','nav','ol','p','section','span','strong','h3','h4','ul','blockquote','code','sup','sub','b','i']);
const allowedAttrs=new Set(['aria-label','class','href','id','lang','rel','target']);
const safeHref=(value:string)=>/^#[a-zA-Z0-9_-]+$/.test(value)||(/^https:\/\//i.test(value)&&!/[\s\u0000-\u001f]/.test(value));
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const genreId=z.enum(['philosophy','literature','film-culture','society','technology','internet']);
const topic=z.object({id:slug,name:z.string().trim().min(1)});
const person=z.object({id:slug,name:z.string().trim().min(1),ja:z.string().default('')});
const metadata=z.object({genre:genreId.optional(),format:z.string().optional(),people:z.array(person).default([]),topics:z.array(topic).default([]),chapterMetadata:z.record(z.string(),z.object({genres:z.array(genreId).default([]),topics:z.array(topic).default([])})).default({})});
function youtubeId(url:string){try{const u=new URL(url);const host=u.hostname.toLowerCase();const value=host==='youtu.be'?u.pathname.split('/')[1]:['www.youtube.com','youtube.com','m.youtube.com'].includes(host)?(u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]):null;return value&&/^[A-Za-z0-9_-]{11}$/.test(value)?value:'';}catch{return '';}}
const documents=defineCollection({
 loader:async()=>{
 const files=(await readdir(directory)).filter(f=>f.endsWith('.html')).sort();
 return Promise.all(files.map(async name=>{
  const id=name.slice(0,-5);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id))throw Error('Invalid document filename: '+name);
  const raw=await readFile(join(directory,name),'utf8');
  const $=load(raw);
  const main=$('main.page');
  if(main.length!==1||main.find('.hero h1').length!==1)throw Error(name+': expected one main.page and one .hero h1');
  main.find('*').each((_,el)=>{
    if(!allowedTags.has(el.name))throw Error(name+': unexpected element '+el.name);
    for(const [key,value] of Object.entries(el.attribs)){
     if(!allowedAttrs.has(key))throw Error(name+': unsafe attribute '+key);
     if(key==='href'&&!safeHref(value))throw Error(name+': unsafe link '+value);
     if(key==='target'&&value!=='_blank')throw Error(name+': unexpected link target');
    }
    if(el.name==='a'&&el.attribs.target==='_blank'&&!/\bnoopener\b/.test(el.attribs.rel||''))throw Error(name+': missing noopener');
  });
  const chapters=main.find('section.sec');
  const utterances=main.find('.utterance');
  if(!chapters.length||!utterances.length)throw Error(name+': no reading content');
  chapters.each((_,el)=>{if(!$(el).find('.sec-header h2').text().trim()||!$(el).find('.utterance').length)throw Error(name+': incomplete chapter');});
  utterances.each((_,el)=>{for(const selector of ['.en','.ja','.note'])if($(el).find(selector).length!==1||!$(el).find(selector).text().trim())throw Error(name+': incomplete bilingual block '+selector);});
  const fields=new Map<string,string>();main.find('.meta-item').each((_,el)=>{fields.set($(el).find('dt').text().trim(),$(el).find('dd').text().trim());});
  let extra:z.infer<typeof metadata>;
  try{extra=metadata.parse(JSON.parse(await readFile(join(directory,id+'.meta.json'),'utf8')));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;extra=metadata.parse({});}
  const chapterIds=new Set<string>();
  const chapterIndex=chapters.toArray().map((el,i)=>{
   const item=$(el),anchor=item.attr('id')||'';
   if(!/^[a-zA-Z0-9_-]+$/.test(anchor)||chapterIds.has(anchor))throw Error(name+': missing/duplicate chapter anchor '+anchor);
   chapterIds.add(anchor);
   const time=item.find('.sec-time').first().text().trim().match(/\b\d{1,3}:\d{2}(?::\d{2})?\b/)?.[0]||'';
   const annotation=extra.chapterMetadata[anchor];
   return {anchor,title:item.find('.sec-header h2').first().text().trim().replace(/^\d+[.．]\s*/,''),time,seconds:time?time.split(':').reduce((n,x)=>n*60+Number(x),0):null,description:item.find('.sec-sub').first().text().trim(),genres:annotation?.genres||[],topics:annotation?.topics||[],order:i+1};
  });
  for(const key of Object.keys(extra.chapterMetadata))if(!chapterIds.has(key))throw Error(name+': unknown chapter metadata '+key);
  const source=main.find('.meta-item').filter((_,el)=>$(el).find('dt').text().trim()==='元動画').find('a').first().attr('href')||'';
  const headline=main.find('.hero h1').text().trim();
  const meta=main.find('.hero-meta').text().trim();
  const date=meta.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  return {id,title:headline.split(' — ')[0],headline,description:main.find('.deck').text().trim(),meta,author:fields.get('話者')||'',duration:fields.get('収録時間')||'',date:date?date[1]+'-'+date[2].padStart(2,'0')+'-'+date[3].padStart(2,'0'):'',category:extra.format||$('meta[name="aw:category"]').attr('content')?.trim()||'資料',genre:extra.genre||null,people:extra.people,topics:extra.topics,chapterIndex,videoId:youtubeId(source),source,chapterCount:chapters.length,utteranceCount:utterances.length,bodyHtml:main.html()||''};
 }));
 },
 schema:z.object({title:z.string().min(1),headline:z.string().min(1),description:z.string(),meta:z.string(),author:z.string(),duration:z.string(),date:z.string(),category:z.string(),genre:genreId.nullable(),people:z.array(person),topics:z.array(topic),chapterIndex:z.array(z.object({anchor:z.string(),title:z.string(),time:z.string(),seconds:z.number().nullable(),description:z.string(),genres:z.array(genreId),topics:z.array(topic),order:z.number()})),videoId:z.string(),source:z.string(),chapterCount:z.number().int().positive(),utteranceCount:z.number().int().positive(),bodyHtml:z.string().min(1)})
});
export const collections={documents};