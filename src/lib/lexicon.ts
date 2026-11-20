import {createHash} from 'node:crypto';
import {load} from 'cheerio';
import {documentUrl,type Doc} from './discovery';
import definitions from '../data/concepts.json';
export const fold=(s:string)=>s.normalize('NFKC').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim().toLowerCase();
export const termId=(s:string)=>{const key=fold(s);return (key.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,52)||'expression')+'-'+createHash('sha256').update(key).digest('hex').slice(0,12);};
export const termUrl=(s:string)=>'/words/'+termId(s)+'/';
export const conceptUrl=(id:string)=>'/concepts/'+id+'/';
export type Concept=typeof definitions[number];
export type Occurrence={documentId:string;documentTitle:string;chapterTitle:string;chapterAnchor:string;anchor:string;time:string;en:string;ja:string;note:string;topics:string[];termNote?:string};
export type Term={id:string;label:string;key:string;occurrences:Occurrence[]};
export type ConceptEntry=Concept&{occurrences:Occurrence[]};
export function containsPhrase(text:string,phrase:string){const t=fold(text),p=fold(phrase);if(!p)return false;const escaped=p.replace(/[.*+?^$${}()|[\]\\]/g,'\\$&');return new RegExp('(?:^|[^a-z0-9])'+escaped+'(?:$|[^a-z0-9])','i').test(t);}
export function matchingConcepts(en:string){return definitions.filter(c=>c.aliases.some(a=>containsPhrase(en,a)));}
export function findTerms(en:string,marked:string[],labels:string[]){const map=new Map<string,string>();for(const label of marked){const key=fold(label);if(key)map.set(key,label.trim());}for(const raw of labels){const label=raw.replace(/\s*[（(][^）)]*[ぁ-んァ-ヶ一-龯][^）)]*[）)]\s*$/u,'').trim();if(/[a-z]/i.test(label)&&containsPhrase(en,label)&&label.length<=120&&!map.has(fold(label)))map.set(fold(label),label);}return [...map.values()];}
// Resolve a term to one annotation only. English display forms can differ
// from the source note's headword (sticking out → stick out, stole → steal).
function noteHeadword(label:string){
 return fold(label.replace(/\s*[（(][^）)]*[ぁ-んァ-ヶ一-龯][^）)]*[）)]\s*$/u,''));
}
function lemmaWord(word:string){
 const irregular:Record<string,string>={stole:'steal',stolen:'steal',went:'go',gone:'go',was:'be',were:'be',did:'do',done:'do',had:'have',has:'have',saw:'see',seen:'see',took:'take',taken:'take'};
 if(irregular[word])return irregular[word];
 if(/^[a-z]{5,}ing$/.test(word)){
  const stem=word.slice(0,-3);
  return stem.length>2&&stem.at(-1)===stem.at(-2)?stem.slice(0,-1):stem;
 }
 if(/^[a-z]{5,}ied$/.test(word))return word.slice(0,-3)+'y';
 if(/^[a-z]{5,}ed$/.test(word)){
  const stem=word.slice(0,-2);
  return stem.length>2&&stem.at(-1)===stem.at(-2)?stem.slice(0,-1):stem;
 }
 if(/^[a-z]{5,}ies$/.test(word))return word.slice(0,-3)+'y';
 if(/^[a-z]{5,}s$/.test(word)&&!word.endsWith('ss'))return word.slice(0,-1);
 return word;
}
function lemmaPhrase(value:string){return value.split(/\s+/).map(lemmaWord).join(' ');}
export function noteFor($:ReturnType<typeof load>,noteNode:ReturnType<ReturnType<typeof load>>,term:string){
 const clicked=fold(term);
 const notes=noteNode.find('strong').toArray().map(el=>{
  const label=$(el).text().trim(),key=noteHeadword(label);
  let content=label;
  for(let n=el.next;n;n=n.next){if(n.type==='tag'&&n.name==='strong')break;content+=$(n).text();}
  return {key,content:content.trim()};
 });
 const exact=notes.find(note=>note.key===clicked);
 if(exact)return exact.content;
 // Only complete phrase matches are accepted; never fall back to the full
 // utterance's note text, which includes unrelated vocabulary explanations.
 const base=lemmaPhrase(clicked);
 return notes.find(note=>note.key&&lemmaPhrase(note.key)===base)?.content||'';
}
export function buildLexicon(ds:Doc[]){
 const words=new Map<string,Term>(),entities=new Map<string,ConceptEntry>();
 for(const d of ds){const $=load(d.data.bodyHtml,null,false);
 for(const c of d.data.chapterIndex){const section=$('section.sec').filter((_,e)=>$(e).attr('id')===c.anchor);
 section.find('.utterance').each((i,e)=>{const b=$(e),en=b.find('.en').text().trim(),ja=b.find('.ja').text().trim(),noteNode=b.find('.note').first(),note=noteNode.text().replace(/^ポイント\s*/,'').trim();
 const item:Occurrence={documentId:d.id,documentTitle:d.data.title,chapterTitle:c.title,chapterAnchor:c.anchor,anchor:b.attr('id')||c.anchor+'-line-'+(i+1),time:b.find('.speaker-line').text().match(/\b\d{1,3}:\d{2}(?::\d{2})?\b/)?.[0]||'',en,ja,note,topics:c.topics.map(t=>t.id)};
 const terms=findTerms(en,b.find('.en strong.key').toArray().map(x=>$(x).text()),noteNode.find('strong').toArray().map(x=>$(x).text()));
 for(const label of terms){const key=fold(label);let entry=words.get(key);if(!entry){entry={id:termId(label),label,key,occurrences:[]};words.set(key,entry);}entry.occurrences.push({...item,termNote:noteFor($,noteNode,label)});}
 for(const concept of matchingConcepts(en)){let entry=entities.get(concept.id);if(!entry){entry={...concept,occurrences:[]};entities.set(concept.id,entry);}entry.occurrences.push(item);}
 });}}
 return {terms:[...words.values()].sort((a,b)=>a.label.localeCompare(b.label,'en')),concepts:[...entities.values()].sort((a,b)=>a.name.localeCompare(b.name,'en'))};
}
export function occurrenceUrl(o:Occurrence){return '/read/'+o.documentId+'/#'+o.anchor;}
export function snippet(en:string,needle:string){const at=fold(en).indexOf(fold(needle));const begin=Math.max(0,(at<0?0:at)-90),end=Math.min(en.length,Math.max(0,at)+needle.length+125);return (begin?'…':'')+en.slice(begin,end).trim()+(end<en.length?'…':'');}
export function documentCount(items:Occurrence[]){return new Set(items.map(o=>o.documentId)).size;}
