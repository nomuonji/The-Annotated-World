import {documents,genres,topics,people,docTopics,documentUrl,chapterUrl,chapterSeconds} from '../lib/discovery';
import {buildLexicon} from '../lib/lexicon';
export const prerender=true;
export async function GET(){
 const ds=await documents();const lex=buildLexicon(ds);
 return new Response(JSON.stringify({schemaVersion:1,genres,topics:topics(ds),people:people(ds),concepts:lex.concepts.map(c=>({id:c.id,name:c.name,ja:c.ja,kind:c.kind,aliases:c.aliases,topics:c.topics})),documents:ds.map(d=>({id:d.id,url:documentUrl(d),title:d.data.title,author:d.data.author,date:d.data.date,genre:d.data.genre,format:d.data.category,difficulty:d.data.difficulty,englishFeatures:d.data.englishFeatures,series:d.data.series,source:d.data.source,videoId:d.data.videoId,duration:d.data.duration,provenance:d.data.provenance,people:d.data.people,topics:docTopics(d),utteranceCount:d.data.utteranceCount,chapters:d.data.chapterIndex.map(c=>({anchor:c.anchor,url:chapterUrl(d,c),title:c.title,startSeconds:c.seconds,durationSeconds:chapterSeconds(d,c),genres:c.genres,topics:c.topics}))}))},null,2)+'\n',{headers:{'Content-Type':'application/json; charset=utf-8'}});
}
