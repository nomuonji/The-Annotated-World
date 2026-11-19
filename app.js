"use strict";
const $=id=>document.getElementById(id);
const STORE="annotated-world-v1";
let state={imports:[],progress:{},bookmarks:{},prefs:{translation:true,notes:true,highlights:true}};
let current=null,chapterIndex=0;
function notify(message){$("status").textContent=message;$("status").hidden=!message;}
function persist(){try{localStorage.setItem(STORE,JSON.stringify(state));return true;}catch{notify("端末への保存ができませんでした。教材はJSONで書き出してバックアップしてください。");return false;}}
const str=v=>typeof v==="string"?v.trim():"";
function https(v){try{const u=new URL(v);return u.protocol==="https:"?u.href:"";}catch{return "";}}
function stamp(v){return str(v).match(/\b\d{1,3}:\d{2}(?::\d{2})?\b/)?.[0]||"";}
function seconds(v){return v?v.split(":").reduce((a,b)=>a*60+Number(b),0):0;}
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return (h>>>0).toString(36);}
function normalize(raw){
 if(!raw||typeof raw!=="object"||!str(raw.title)||!Array.isArray(raw.chapters)||!raw.chapters.length)throw Error("タイトルまたはチャプターがありません。");
 const title=str(raw.title),author=str(raw.author),source=https(raw.source);
 const chapters=raw.chapters.map(c=>{
  if(!c||!str(c.title)||!Array.isArray(c.blocks)||!c.blocks.length)throw Error("章のタイトルまたは発話がありません。");
  return {title:str(c.title),time:str(c.time),description:str(c.description),blocks:c.blocks.map(b=>{
   if(!b||!str(b.en)||!str(b.ja))throw Error("英文・和訳のない発話があります。");
   return {speaker:str(b.speaker),time:stamp(b.time),en:str(b.en),ja:str(b.ja),note:str(b.note),keys:Array.isArray(b.keys)?b.keys.map(str).filter(Boolean).slice(0,100):[]};
  })};
 });
 const id=/^[a-z0-9][a-z0-9_-]{0,95}$/i.test(str(raw.id))?str(raw.id):"import-"+hash(title+"|"+author+"|"+source);
 return {id,title,author,source,category:str(raw.category)||"Unclassified",description:str(raw.description),duration:str(raw.duration),chapters};
}
function load(){
 try{const raw=JSON.parse(localStorage.getItem(STORE)||"null");if(!raw)return;
 state.imports=Array.isArray(raw.imports)?raw.imports.flatMap(x=>{try{return [normalize(x)];}catch{return [];}}).filter(x=>x.id!==window.AW_DEMO.id):[];
 for(const k of ["progress","bookmarks","prefs"])if(raw[k]&&typeof raw[k]==="object"&&!Array.isArray(raw[k]))state[k]=Object.assign(Object.create(null),state[k],raw[k]);
 }catch{notify("以前の保存内容を読み込めませんでした。");}
}
function importHtml(html){
 // Template contents are inert. Never attach imported nodes to the live DOM.
 const template=document.createElement("template");template.innerHTML=html;
 const doc=template.content;
 const t=(root,selector)=>str(root.querySelector(selector)?.textContent);
 const meta=[...doc.querySelectorAll(".meta-item")];
 const val=label=>{const item=meta.find(x=>t(x,"dt")===label);return item?t(item,"dd"):"";};
 const source=meta.find(x=>t(x,"dt")==="元動画")?.querySelector("a")?.getAttribute("href")||"";
 const chapters=[...doc.querySelectorAll("section.sec")].map(c=>({
  title:t(c,".sec-header h2"),time:t(c,".sec-time"),description:t(c,".sec-sub"),
  blocks:[...c.querySelectorAll(".utterance")].map(b=>({speaker:t(b,".speaker-line").split("·")[0].trim(),time:stamp(t(b,".speaker-line")),en:t(b,".en"),ja:t(b,".ja"),note:t(b,".note").replace(/^ポイント\s*/,""),keys:[...b.querySelectorAll(".en strong.key")].map(x=>str(x.textContent))}))
 }));
 return normalize({title:t(doc,".hero h1")||t(doc,"h1")||t(doc,"title"),author:val("話者"),source,category:"Imported",duration:val("収録時間"),description:t(doc,".deck"),chapters});
}
function lessons(){return [window.AW_DEMO,...state.imports];}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
function button(label,fn){const b=el("button","",label);b.type="button";b.addEventListener("click",fn);return b;}
function link(label,url){const a=el("a","",label);a.href=url;a.target="_blank";a.rel="noopener noreferrer";return a;}
function show(id){for(const x of ["library","reader","saved"])$(x).hidden=x!==id;window.scrollTo(0,0);$("main").focus({preventScroll:true});}
function library(){
 current=null;show("library");renderShelf();
}
function renderShelf(){
 const term=$("search").value.trim().toLowerCase();const root=$("shelf");root.replaceChildren();
 for(const lesson of lessons().filter(l=>[l.title,l.author,l.category,l.description].join(" ").toLowerCase().includes(term))){
 const card=el("article","lesson-card");const cover=el("div","cover",lesson.category.slice(0,2).toUpperCase());cover.setAttribute("aria-hidden","true");
 const info=el("div");const progress=state.progress[lesson.id];info.append(el("div","tag",lesson.category.toUpperCase()+" · "+(lesson.id===window.AW_DEMO.id?"ORIGINAL SAMPLE":"PERSONAL IMPORT")),el("h3","",lesson.title),el("p","",lesson.author),el("p","",lesson.description),el("p","",lesson.chapters.length+"章"+(lesson.duration?" · "+lesson.duration:"")+(Number.isInteger(progress)?" · 前回 "+(progress+1)+"章":"")));
 card.append(cover,info,button(Number.isInteger(progress)?"続きから読む":"読む",()=>openLesson(lesson.id)));root.append(card);
 }
 if(!root.children.length)root.append(el("p","","該当する教材がありません。"));
}
function renderPrefs(){for(const k of ["translation","notes","highlights"])$(k).setAttribute("aria-pressed",String(!!state.prefs[k]));}
function marked(block){
 const p=el("p","en");p.lang="en";
 if(!state.prefs.highlights||!block.keys.length){p.textContent=block.en;return p;}
 const lower=block.en.toLowerCase();let pos=0;
 while(pos<block.en.length){
 let found=null;for(const key of block.keys){const at=lower.indexOf(key.toLowerCase(),pos);if(at>=0&&(!found||at<found.at||(at===found.at&&key.length>found.key.length)))found={at,key};}
 if(!found){p.append(document.createTextNode(block.en.slice(pos)));break;}
 p.append(document.createTextNode(block.en.slice(pos,found.at)),el("mark","",block.en.slice(found.at,found.at+found.key.length)));pos=found.at+found.key.length;
 }return p;
}
function keyFor(l,c,b){return [l.id,c,b].join(":");}
function isSaved(key){return Object.hasOwn(state.bookmarks,key)&&state.bookmarks[key]===true;}
function toggleSave(key){if(isSaved(key))delete state.bookmarks[key];else state.bookmarks[key]=true;persist();}
function sourceAt(source,time){try{const u=new URL(source);if(["www.youtube.com","youtube.com","m.youtube.com","youtu.be"].includes(u.hostname)&&time)u.searchParams.set("t",String(seconds(time))+"s");return u.href;}catch{return "";}}
function openLesson(id,index,block){
 const lesson=lessons().find(l=>l.id===id);if(!lesson){library();return;}
 current=lesson;const i=index??state.progress[id]??0;chapterIndex=Number.isInteger(i)?Math.max(0,Math.min(lesson.chapters.length-1,i)):0;
 show("reader");const header=$("readerHeader");header.replaceChildren();header.className="reader-head";
 header.append(el("p","eyebrow",lesson.category.toUpperCase()+" / "+(lesson.id===window.AW_DEMO.id?"ORIGINAL SAMPLE":"PERSONAL IMPORT")),el("h1","reader-title",lesson.title),el("p","",lesson.author),el("p","",lesson.description),el("p","tag",lesson.chapters.length+"章"+(lesson.duration?" · "+lesson.duration:"")));
 const actions=el("div","head-actions");if(lesson.source)actions.append(link("原典を開く ↗",lesson.source));actions.append(button("JSONを書き出す",()=>exportLesson(lesson)));
 if(lesson.id!==window.AW_DEMO.id)actions.append(button("教材を削除",()=>{if(!confirm("この端末から教材と関連する学習記録を削除しますか？"))return;state.imports=state.imports.filter(l=>l.id!==lesson.id);delete state.progress[lesson.id];for(const k of Object.keys(state.bookmarks))if(k.startsWith(lesson.id+":"))delete state.bookmarks[k];persist();library();}));
 header.append(actions);$("chapterDetails").open=!matchMedia("(max-width:720px)").matches;renderChapter(block);
}
function renderChapter(jump){
 if(!current)return;
 const c=current.chapters[chapterIndex];const root=$("chapter");root.replaceChildren();state.progress[current.id]=chapterIndex;persist();renderPrefs();
 $("position").textContent=(chapterIndex+1)+" / "+current.chapters.length+" 章";
 const nav=$("chapters");nav.replaceChildren();current.chapters.forEach((ch,i)=>{const b=button(ch.title,()=>goChapter(i));if(ch.time)b.prepend(el("small","",ch.time));b.setAttribute("aria-current",String(i===chapterIndex));nav.append(b);});
 const h=el("h2","",c.title);h.id="chapterTitle";h.tabIndex=-1;if(c.time)root.append(el("p","eyebrow",c.time));root.append(h,el("p","chapter-sub",c.description));
 c.blocks.forEach((b,i)=>{
 const row=el("section","utterance");row.id="block-"+i;const speaker=el("div","speaker");speaker.append(el("span","",b.speaker),el("span","",b.time));row.append(speaker,marked(b));
 if(state.prefs.translation){const p=el("p","ja",b.ja);p.lang="ja";row.append(p);}
 if(state.prefs.notes&&b.note){const n=el("p","note");n.append(el("span","note-label","LANGUAGE & CONTEXT"),document.createTextNode(b.note));row.append(n);}
 const actions=el("div","block-actions");const k=keyFor(current,chapterIndex,i);const save=button(isSaved(k)?"保存済み":"発話を保存",()=>{toggleSave(k);save.textContent=isSaved(k)?"保存済み":"発話を保存";save.setAttribute("aria-pressed",String(isSaved(k)));});save.setAttribute("aria-pressed",String(isSaved(k)));actions.append(save);if(current.source)actions.append(link(b.time?"原典 "+b.time+" ↗":"原典 ↗",sourceAt(current.source,b.time)));row.append(actions);root.append(row);
 });
 $("prev").disabled=chapterIndex===0;$("next").disabled=chapterIndex===current.chapters.length-1;
 if(Number.isInteger(jump))$( "block-"+jump)?.scrollIntoView({block:"start"});
}
function goChapter(i){if(!current||i<0||i>=current.chapters.length)return;chapterIndex=i;renderChapter();if(matchMedia("(max-width:720px)").matches)$("chapterDetails").open=false;$("chapterTitle").focus({preventScroll:true});$("chapter").scrollIntoView({block:"start"});}
function savedView(){
 current=null;show("saved");const root=$("savedList");root.replaceChildren();
 for(const lesson of lessons())lesson.chapters.forEach((c,ci)=>c.blocks.forEach((b,bi)=>{
 const k=keyFor(lesson,ci,bi);if(!isSaved(k))return;const row=el("article","saved-row");row.append(el("div","tag",lesson.title+" · "+c.title),el("p","",b.en),button("本文を開く",()=>openLesson(lesson.id,ci,bi)),button("保存を解除",()=>{toggleSave(k);savedView();}));root.append(row);
 }));
 if(!root.children.length)root.append(el("p","","読書中に「発話を保存」を押すと、ここで復習できます。"));
}
function exportLesson(lesson){const blob=new Blob([JSON.stringify(lesson,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=el("a");a.href=url;a.download=lesson.id+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$("importFile").addEventListener("change",async event=>{
 const f=event.target.files?.[0];event.target.value="";if(!f)return;
 try{if(f.size>8*1024*1024)throw Error("ファイルは8MB以下にしてください。");const value=await f.text();const lesson=f.name.toLowerCase().endsWith(".json")?normalize(JSON.parse(value)):importHtml(value);
 if(lessons().some(l=>l.id===lesson.id))throw Error("同じ教材IDが存在します。既存の教材を書き出してから削除するか、新しいIDを使ってください。");
 state.imports.push(lesson);const ok=persist();library();if(ok)notify(lesson.title+" を追加しました（"+lesson.chapters.length+"章）。");
 }catch(e){notify("教材を追加できませんでした："+e.message);}
});
for(const k of ["translation","notes","highlights"])$(k).addEventListener("click",()=>{state.prefs[k]=!state.prefs[k];renderChapter();});
$("home").addEventListener("click",library);$("libraryNav").addEventListener("click",library);$("savedNav").addEventListener("click",savedView);$("search").addEventListener("input",renderShelf);$("prev").addEventListener("click",()=>goChapter(chapterIndex-1));$("next").addEventListener("click",()=>goChapter(chapterIndex+1));
load();renderShelf();renderPrefs();