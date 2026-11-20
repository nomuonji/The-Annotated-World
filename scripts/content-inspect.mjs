import {readdir,readFile} from 'node:fs/promises';
import {load} from 'cheerio';
const dir='src/content/documents',args=process.argv.slice(2),strict=args.includes('--check'),selected=args.find(a=>!a.startsWith('--'));
const all=await readdir(dir),ids=all.filter(f=>f.endsWith('.html')).map(f=>f.slice(0,-5)).sort();
if(selected&&!ids.includes(selected))throw Error('Unknown document: '+selected);
const readJson=async file=>{try{return JSON.parse(await readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const problems=[],warnings=[],catalog=[],topicMap=new Map(),personMap=new Map(),sourceMap=new Map();
const err=(id,msg)=>problems.push(id+': '+msg),warn=(id,msg)=>warnings.push(id+': '+msg);
const genres=new Set(['philosophy','literature','film-culture','society','technology','internet']);
const legacy='slavoj-zizek-signs-from-the-future';
// Imported sources are preserved verbatim; every newly authored document must use inline v1.
const legacyNoteSources=new Set(['slavoj-zizek-signs-from-the-future','slavoj-zizek-how-to-become-free']);
const timeOf=t=>{const m=t.match(/\b(\d{1,3}:\d{2}(?::\d{2})?)\b/);if(!m)return null;const a=m[1].split(':').map(Number);return a.slice(1).some(n=>n>=60)?NaN:a.reduce((n,x)=>n*60+x,0);};
const sourceKey=s=>{try{const u=new URL(s),host=u.hostname.toLowerCase(),v=host==='youtu.be'?u.pathname.split('/')[1]:['www.youtube.com','youtube.com','m.youtube.com'].includes(host)?u.searchParams.get('v')||u.pathname.match(/^\/(?:shorts|live|embed)\/([^/]+)/)?.[1]:null;if(v&&/^[A-Za-z0-9_-]{11}$/.test(v))return 'youtube:'+v;u.hash='';return u.href;}catch{return '';}}
function register(map,item,id){if(!item||typeof item.id!=='string'||!(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).test(item.id)||typeof item.name!=='string'||!item.name.trim()){err(id,'invalid topic/person: '+JSON.stringify(item));return;}const existing=map.get(item.id);if(existing&&existing!==item.name)err(id,'inconsistent label for '+item.id+': '+existing+' / '+item.name);map.set(item.id,item.name);}
for(const file of all.filter(f=>/\.(meta|annotations)\.json$/.test(f))){const id=file.replace(/\.(meta|annotations)\.json$/,'');if(!ids.includes(id))err(id,'orphan sidecar '+file);}
for(const id of ids){
 const $=load(await readFile(dir+'/'+id+'.html','utf8')),main=$('main.page'),meta=await readJson(dir+'/'+id+'.meta.json'),annotations=await readJson(dir+'/'+id+'.annotations.json')||{};
 const missing=msg=>id===legacy?warn(id,msg):err(id,msg);
 if(!legacyNoteSources.has(id)&&Object.keys(annotations).length)err(id,'new document cannot use legacy supplemental annotations.json; use phrase-anchored .note');
 if(main.length!==1||main.find('.hero h1').length!==1)err(id,'one main.page and hero heading required');
 if(!meta)missing('metadata sidecar missing');
 if(!genres.has(meta?.genre))missing('primary genre missing/invalid');
 if(!meta?.format)missing('format missing');
 if(!meta?.people?.length)warn(id,'people unspecified (acceptable if not applicable)');
 if(meta?.difficulty&&!['B1','B2','C1','C2'].includes(meta.difficulty))err(id,'invalid difficulty');
 for(const p of meta?.people||[])register(personMap,p,id);
 for(const t of meta?.topics||[])register(topicMap,t,id);
 const prov=meta?.provenance;
 if(!prov||!prov.basis||!prov.sourceUrl)missing('provenance, basis or source missing');
 else{if(!['original','licensed','public-domain','unverified'].includes(prov.rights))err(id,'invalid rights status');if(prov.rights==='unverified')missing('publication rights unverified');if(!['full','excerpt','unverified'].includes(prov.coverage)||!['verified','unverified','not-applicable'].includes(prov.transcript)||!['verified','unverified'].includes(prov.translation))err(id,'invalid provenance status');if(prov.coverage==='full'&&prov.transcript==='unverified')err(id,'full coverage cannot be asserted with unverified transcript');if(prov.transcript==='unverified'||prov.translation==='unverified')warn(id,'transcript or translation review unverified');}
 const link=main.find('.meta-item').filter((_,el)=>$(el).find('dt').text().trim()==='元動画').find('a').first().attr('href')||'';
 const source=prov?.sourceUrl||link,key=sourceKey(source);
 if(!key)missing('valid original source URL missing');else{if(sourceMap.has(key))err(id,'duplicate source with '+sourceMap.get(key)+'; extend existing document or document an explicitly approved exception');sourceMap.set(key,id);}
 if(link&&prov?.sourceUrl&&sourceKey(link)!==sourceKey(prov.sourceUrl))err(id,'source metadata and HTML disagree');
 const anchors=new Set(),blocks=new Map(),idsInHtml=new Set(),chapters=[];let previous=-1,count=0;
 for(const el of main.find('[id]').toArray()){const a=$(el).attr('id');if(idsInHtml.has(a))err(id,'duplicate source anchor '+a);idsInHtml.add(a);}
 for(const el of main.find('section.sec').toArray()){
  const c=$(el),anchor=c.attr('id'),title=c.find('.sec-header h2').text().trim();
  if(!anchor||!title||anchors.has(anchor))err(id,'missing or duplicate chapter anchor/title');anchors.add(anchor);
  const cm=meta?.chapterMetadata?.[anchor];if(!cm?.genres?.length||!cm?.topics?.length)missing('chapter metadata incomplete: '+anchor);
  for(const g of cm?.genres||[])if(!genres.has(g))err(id,'unknown chapter genre '+g);
  for(const t of cm?.topics||[])register(topicMap,t,id);
  const start=timeOf(c.find('.sec-time').first().text());if(Number.isNaN(start))err(id,'invalid chapter time '+anchor);
  const items=c.find('.utterance').toArray();if(!items.length)err(id,'empty chapter '+anchor);
  for(const [i,node] of items.entries()){const b=$(node),k=anchor+'-line-'+(i+1);count++;if(idsInHtml.has(k))err(id,'reserved generated anchor '+k);const en=b.find('.en').text(),ja=b.find('.ja').text();for(const sel of ['.speaker-line','.en','.ja','.note'])if(b.find(sel).length!==1||!b.find(sel).text().trim())err(id,k+' missing '+sel);
   const time=timeOf(b.find('.speaker-line').text());if(key.startsWith('youtube:')&&(time===null||Number.isNaN(time)))err(id,k+' missing/invalid playback timestamp');
   if(time!==null&&Number.isFinite(time)){if(time<previous)err(id,k+' non-monotonic timestamp');previous=time;}
   if(!legacyNoteSources.has(id)){
    const rawNote=b.find('.note').first();
    if(rawNote.find('.note-label').length)err(id,k+' legacy point/note label forbidden; only inline comments');
    if(b.find('.en .inline-note-ref').length||rawNote.find('.inline-note-item').length)err(id,k+' legacy numbered footnote forbidden');
    const items=rawNote.children('strong').toArray();
    if(!items.length)err(id,k+' each inline annotation requires its exact quoted English phrase');
    for(const element of items){
     const phrase=$(element).text().trim();
     let body='';
     for(let node=element.next;node&&!(node.type==='tag'&&node.name==='strong');node=node.next)body+=$(node).text();
     if(phrase.length<4||!en.toLocaleLowerCase().includes(phrase.toLocaleLowerCase()))err(id,k+' annotation anchor not verbatim source English: '+phrase);
     if(!/^\s*：\s*\S/u.test(body))err(id,k+' annotation requires colon and nonempty explanation: '+phrase);
    }
   }
   blocks.set(k,{en,ja,time,terms:b.find('.en strong.key').toArray().map(x=>$(x).text())});
  }
  chapters.push({anchor,title,startSeconds:start,utterances:items.length});
 }
 if(!chapters.length)err(id,'no chapters');
 for(const k of Object.keys(meta?.chapterMetadata||{}))if(!anchors.has(k))err(id,'unknown chapter metadata '+k);
 for(const a of main.find('.toc a[href^="#"]').toArray()){const href=$(a).attr('href').slice(1);if(!anchors.has(href))err(id,'broken chapter TOC link '+href);}
 for(const [anchor,items] of Object.entries(annotations)){const b=blocks.get(anchor);if(!b){err(id,'annotation anchor unknown '+anchor);continue;}if(!Array.isArray(items)){err(id,'annotations must be an array '+anchor);continue;}for(const a of items){if(!['syntax','sound','alignment'].includes(a.kind)||!a.quote||!a.explanation||!b.en.includes(a.quote))err(id,'invalid annotation or quote '+anchor);if(a.parts&&(!Array.isArray(a.parts)||a.parts.map(x=>x.text).join('')!==a.quote))err(id,'annotation parts mismatch '+anchor);if(a.translation&&!b.ja.includes(a.translation))err(id,'annotation translation mismatch '+anchor);}}
 catalog.push({id,title:main.find('.hero h1').text().trim(),source,genre:meta?.genre||null,chapterCount:chapters.length,utteranceCount:count,chapters,provenance:prov||null, ...(selected===id?{utterances:[...blocks].map(([anchor,b])=>({anchor,...b}))}:{})});
}
const concepts=await readJson('src/data/concepts.json')||[];const conceptIds=new Set();for(const c of concepts){if(conceptIds.has(c.id)||!Array.isArray(c.aliases)||!c.aliases.length||c.aliases.some(a=>typeof a!=='string'||!a.trim()))err('concept registry','invalid or duplicate concept '+c.id);conceptIds.add(c.id);}
const report={documents:selected?catalog.filter(d=>d.id===selected):catalog,topics:[...topicMap].map(([id,name])=>({id,name})),people:[...personMap].map(([id,name])=>({id,name})),concepts:concepts.map(({id,name,ja,kind,aliases})=>({id,name,ja,kind,aliases})),warnings,errors:problems};
console.log(JSON.stringify(strict?{documents:catalog.map(({id,chapterCount,utteranceCount})=>({id,chapterCount,utteranceCount})),warnings,errors:problems}:report,null,2));
if(strict&&problems.length)process.exitCode=1;
