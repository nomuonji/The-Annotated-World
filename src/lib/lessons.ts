import {getCollection} from 'astro:content';
export async function publishedLessons(){
 const entries=await getCollection('lessons',({data})=>!data.draft);
 const ids=new Set<string>();
 for(const {data} of entries){if(ids.has(data.id))throw Error('Duplicate lesson ID: '+data.id);ids.add(data.id);}
 return entries.sort((a,b)=>b.data.publishedAt.localeCompare(a.data.publishedAt)||a.data.id.localeCompare(b.data.id));
}
export const lessonUrl=(id:string)=>'/read/'+id+'/';
export function originalAt(source:string,time:string){if(!source)return '';const u=new URL(source);if(time&&['www.youtube.com','youtube.com','m.youtube.com','youtu.be'].includes(u.hostname))u.searchParams.set('t',String(time.split(':').reduce((n,x)=>n*60+Number(x),0))+'s');return u.href;}
export function highlightParts(en:string,keys:string[]){const parts:{text:string;marked:boolean}[]=[];let pos=0;const lower=en.toLowerCase();while(pos<en.length){let at=-1,len=0;for(const key of keys){const hit=lower.indexOf(key.toLowerCase(),pos);if(hit>=0&&(at<0||hit<at||(hit===at&&key.length>len))){at=hit;len=key.length;}}if(at<0){parts.push({text:en.slice(pos),marked:false});break;}if(at>pos)parts.push({text:en.slice(pos,at),marked:false});parts.push({text:en.slice(at,at+len),marked:true});pos=at+len;}return parts;}