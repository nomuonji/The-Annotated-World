import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import {loadStructuredDocuments} from './lib/document-source.mjs';
import { load } from 'cheerio';

const allowedTags=new Set(['a','br','dd','div','dl','dt','em','footer','h1','h2','header','li','nav','ol','p','section','span','strong','h3','h4','ul','blockquote','code','sup','sub','b','i']);
const allowedAttrs=new Set(['aria-label','class','href','id','lang','rel','target','data-note-id']);
const safeHref=(value:string)=>/^#[a-zA-Z0-9_-]+$/.test(value)||(/^https:\/\//i.test(value)&&!/[\s\u0000-\u001f]/.test(value));
const slug=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const genreId=z.enum(['philosophy','literature','film-culture','society','technology','internet']);
const topic=z.object({id:slug,name:z.string().trim().min(1)});
const person=z.object({id:slug,name:z.string().trim().min(1),ja:z.string().default('')});
const provenance=z.object({coverage:z.enum(['full','excerpt','unverified']),transcript:z.enum(['verified','unverified','not-applicable']),translation:z.enum(['verified','unverified']),rights:z.enum(['original','licensed','public-domain','unverified']),basis:z.string().trim().min(1),sourceUrl:z.url().refine(s=>s.startsWith('https://'),'HTTPS source required')});
const metadata=z.object({provenance:provenance.optional(),genre:genreId.optional(),format:z.string().optional(),difficulty:z.enum(['B1','B2','C1','C2']).optional(),englishFeatures:z.array(z.string().trim().min(1)).default([]),series:z.string().trim().min(1).optional(),people:z.array(person).default([]),topics:z.array(topic).default([]),chapterMetadata:z.record(z.string(),z.object({genres:z.array(genreId).default([]),topics:z.array(topic).default([])})).default({})});
function youtubeId(url:string){try{const u=new URL(url);const host=u.hostname.toLowerCase();const value=host==='youtu.be'?u.pathname.split('/')[1]:['www.youtube.com','youtube.com','m.youtube.com'].includes(host)?(u.pathname==='/watch'?u.searchParams.get('v'):u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]):null;return value&&/^[A-Za-z0-9_-]{11}$/.test(value)?value:'';}catch{return '';}}
const documents=defineCollection({
 loader:async()=>{
  const sources=await loadStructuredDocuments();
  return sources.map(({id,document,chapters,bodyHtml})=>{
   const $=load('<main class="page">'+bodyHtml+'</main>');
   const main=$('main.page');
   if(main.length!==1||main.find('.hero h1').length!==1)throw Error(id+': incomplete document');
   // All formatting remains a restricted HTML subset; imported content cannot inject scripts or attributes.
   main.find('*').each((_,el)=>{
    if(!allowedTags.has(el.name))throw Error(id+': unexpected element '+el.name);
    for(const [key,value] of Object.entries(el.attribs)){
     if(!allowedAttrs.has(key))throw Error(id+': unsafe attribute '+key);
     if(key==='href'&&!safeHref(value))throw Error(id+': unsafe link '+value);
     if(key==='target'&&value!=='_blank')throw Error(id+': unexpected link target');
    }
    if(el.name==='a'&&el.attribs.target==='_blank'&&!/\\bnoopener\\b/.test(el.attribs.rel||''))throw Error(id+': missing noopener');
   });
   const extra=metadata.parse(document);
   const chapterIndex=chapters.map((chapter,i)=>{
    const time=chapter.timeRange.match(/\\b\\d{1,3}:\\d{2}:\\d{2}\\b/)?.[0]||'';
    return {anchor:chapter.id,title:chapter.title.replace(/^\\d+[.．]\\s*/,''),time,seconds:time?time.split(':').reduce((n,x)=>n*60+Number(x),0):null,description:chapter.summary,genres:chapter.genres.map(g=>genreId.parse(g)),topics:chapter.topics.map(t=>topic.parse(t)),order:i+1};
   });
   const facts=new Map(document.facts.map(f=>[f.label,f.value]));
   const embeddedSource=document.facts.find(f=>f.label==='元動画')?.url||'';
   const source=embeddedSource||extra.provenance?.sourceUrl||'';
   if(embeddedSource&&extra.provenance&&youtubeId(embeddedSource)!==youtubeId(extra.provenance.sourceUrl))throw Error(id+': source IDs disagree');
   const date=document.heroMeta.match(/(\\d{4})年(\\d{1,2})月(\\d{1,2})日/);
   return {
    id,title:document.title.split(' — ')[0],headline:document.title,description:document.description,
    meta:document.heroMeta,author:facts.get('話者')||'',duration:facts.get('収録時間')||'',
    date:date?date[1]+'-'+date[2].padStart(2,'0')+'-'+date[3].padStart(2,'0'):'',
    provenance:extra.provenance||null,category:extra.format||'資料',genre:extra.genre||null,difficulty:extra.difficulty||null,
    englishFeatures:extra.englishFeatures,series:extra.series||null,people:extra.people,topics:extra.topics,
    chapterIndex,videoId:youtubeId(source),source,chapterCount:chapters.length,
    utteranceCount:chapters.reduce((n,c)=>n+c.utterances.length,0),bodyHtml:main.html()||''
   };
  });
 },
 schema:z.object({title:z.string().min(1),headline:z.string().min(1),description:z.string(),meta:z.string(),author:z.string(),duration:z.string(),date:z.string(),provenance:provenance.nullable(),category:z.string(),genre:genreId.nullable(),difficulty:z.enum(['B1','B2','C1','C2']).nullable(),englishFeatures:z.array(z.string()),series:z.string().nullable(),people:z.array(person),topics:z.array(topic),chapterIndex:z.array(z.object({anchor:z.string(),title:z.string(),time:z.string(),seconds:z.number().nullable(),description:z.string(),genres:z.array(genreId),topics:z.array(topic),order:z.number()})),videoId:z.string(),source:z.string(),chapterCount:z.number().int().positive(),utteranceCount:z.number().int().positive(),bodyHtml:z.string().min(1)})
});
export const collections={documents};