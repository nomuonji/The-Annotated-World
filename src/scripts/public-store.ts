export type Bookmark={lessonId:string;title:string;anchor:string;en:string};
export type ReadingState={prefs:Record<string,boolean>;progress:Record<string,string>;saved:Bookmark[]};
const KEY='aw-public-v1';
const defaults=():ReadingState=>({prefs:{ja:true,note:true,mark:true},progress:{},saved:[]});
export function read():ReadingState{try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(!v)return defaults();return {prefs:{...defaults().prefs,...v.prefs},progress:v.progress||{},saved:Array.isArray(v.saved)?v.saved.filter((b:Bookmark)=>b&&typeof b.lessonId==='string'&&/^[a-z0-9-]+$/.test(b.lessonId)&&typeof b.anchor==='string'&&/^[a-z0-9-]+$/.test(b.anchor)&&typeof b.title==='string'&&typeof b.en==='string'):[]};}catch{return defaults();}}
export function write(s:ReadingState){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{const status=document.getElementById('save-status')||document.createElement('p');status.id='save-status';status.setAttribute('role','status');status.textContent='端末に保存できませんでした。ブラウザの保存設定を確認してください。';document.querySelector('main')?.prepend(status);}}
