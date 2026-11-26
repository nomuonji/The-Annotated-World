import {getCollection,type CollectionEntry} from 'astro:content';
export const genres=[{"id":"philosophy","name":"Philosophy","ja":"哲学・思想・精神分析","number":"01","color":"#344f68"},{"id":"literature","name":"Literature","ja":"文学・作家・言葉","number":"02","color":"#775c49"},{"id":"film-culture","name":"Film & Culture","ja":"映画・芸術・文化批評","number":"03","color":"#864e4b"},{"id":"society","name":"Society","ja":"社会・政治・経済","number":"04","color":"#53624c"},{"id":"technology","name":"Technology","ja":"AI・科学・未来社会","number":"05","color":"#445c81"},{"id":"internet","name":"Internet","ja":"海外ネット文化・ミーム","number":"06","color":"#6d557a"}] as const;
export type Doc=CollectionEntry<'documents'>;
export type Chapter=Doc['data']['chapterIndex'][number];
// Omit only the known promotional suffix from on-screen headings, never from source metadata.
export const displayDocumentTitle=(title:string)=>title.replace(/\s*[—–―]\s*ノンストップ英語学習・完全対訳教材$/u,'');
export const documentUrl=(d:Doc)=>'/read/'+d.id+'/';
export const chapterUrl=(d:Doc,c:Chapter)=>documentUrl(d)+'#'+c.anchor;
// Explicit chapter-only reading mode: the old #anchor URL keeps its full-document meaning.
export const chapterReadingUrl=(d:Doc,c:Chapter)=>documentUrl(d)+'?chapter='+encodeURIComponent(c.anchor);
export const genreUrl=(id:string)=>'/genres/'+id+'/';
export const topicUrl=(id:string)=>'/topics/'+id+'/';
export const personUrl=(id:string)=>'/people/'+id+'/';
export const genreById=(id:string|null)=>genres.find(g=>g.id===id);
export async function documents(){return (await getCollection('documents')).sort((a,b)=>b.data.date.localeCompare(a.data.date)||a.id.localeCompare(b.id));}
export function docTopics(d:Doc){return [...new Map([...d.data.topics,...d.data.chapterIndex.flatMap(c=>c.topics)].map(t=>[t.id,t])).values()];}
export function genreDocs(ds:Doc[],id:string){return ds.filter(d=>d.data.genre===id||d.data.chapterIndex.some(c=>c.genres.includes(id as Chapter['genres'][number])));}
export function genreChapters(ds:Doc[],id:string){return ds.flatMap(d=>d.data.chapterIndex.filter(c=>c.genres.includes(id as Chapter['genres'][number])).map(c=>({d,c})));}
export function topics(ds:Doc[]){const map=new Map<string,{id:string;name:string;count:number;chapters:number}>();for(const d of ds){for(const t of docTopics(d)){const e=map.get(t.id);if(e&&e.name!==t.name)throw Error('Conflicting topic name: '+t.id);const n=d.data.chapterIndex.filter(c=>c.topics.some(x=>x.id===t.id)).length;map.set(t.id,{...t,count:(e?.count||0)+1,chapters:(e?.chapters||0)+n});}}return [...map.values()].sort((a,b)=>b.count-a.count||b.chapters-a.chapters||a.id.localeCompare(b.id));}
export function people(ds:Doc[]){const map=new Map<string,{id:string;name:string;ja:string;count:number}>();for(const d of ds){for(const p of d.data.people){const e=map.get(p.id);if(e&&e.name!==p.name)throw Error('Conflicting person name: '+p.id);map.set(p.id,{...p,count:(e?.count||0)+1});}}return [...map.values()].sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));}
export function related(ds:Doc[],current:Doc){const ids=new Set(docTopics(current).map(t=>t.id));const ps=new Set(current.data.people.map(p=>p.id));const gs=new Set([current.data.genre,...current.data.chapterIndex.flatMap(c=>c.genres)].filter(Boolean));return ds.filter(d=>d.id!==current.id).map(d=>{const shared=docTopics(d).filter(t=>ids.has(t.id));const samePerson=d.data.people.find(p=>ps.has(p.id));const sameGenre=d.data.genre?gs.has(d.data.genre):false;return {d,score:shared.length*4+(samePerson?5:0)+(sameGenre?2:0),reason:samePerson?'同じ人物：'+samePerson.name:shared.length?'共通テーマ：'+shared.map(t=>t.name).slice(0,3).join('・'):'同じ分野'};}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||b.d.data.date.localeCompare(a.d.data.date)).slice(0,6);}
export function searchText(d:Doc){return [d.data.title,d.data.author,d.data.description,d.data.category,genreById(d.data.genre)?.name,genreById(d.data.genre)?.ja,...d.data.people.flatMap(p=>[p.name,p.ja]),...docTopics(d).map(t=>t.name),...d.data.chapterIndex.map(c=>c.title+' '+c.description)].join(' ').toLowerCase();}

export function durationSeconds(value:string){
 const match=value.match(/(?:(\d+)\s*時間)?\s*(?:(\d+)\s*分)\s*(?:(\d+)\s*秒)?/);
 if(!match)return null;const [h,m,s]=match.slice(1).map(x=>Number(x||0));return h*3600+m*60+s;
}
export function chapterSeconds(d:Doc,c:Chapter){
 const next=d.data.chapterIndex[c.order];const end=next?.seconds??(next?null:durationSeconds(d.data.duration));return c.seconds!==null&&end!==null&&end>c.seconds?end-c.seconds:null;
}
export function chapterSearchText(d:Doc,c:Chapter){return [d.data.title,d.data.author,...d.data.people.flatMap(p=>[p.name,p.ja]),c.title,c.description,...c.topics.map(t=>t.name),...c.genres.map(id=>genreById(id)?.ja),d.data.difficulty,...d.data.englishFeatures,d.data.series].join(' ').toLowerCase();}
export function timeBand(seconds:number|null){return seconds===null?'unknown':seconds<=5*60?'5':seconds<=15*60?'15':seconds<=30*60?'30':'long';}
