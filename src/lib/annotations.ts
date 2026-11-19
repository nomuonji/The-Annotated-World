import data from '../data/reader-annotations.json';
type Part={text:string;role:string};
type Annotation={kind:'syntax'|'sound'|'alignment';quote:string;explanation:string;parts?:Part[];translation?:string};
const records=data as unknown as Record<string,Record<string,Annotation[]>>;
export function annotationsFor(doc:string,anchor:string,en:string,ja:string){const list=records[doc]?.[anchor]||[];for(const item of list){if(!en.includes(item.quote))throw Error('Annotation quote not in source: '+doc+' '+anchor);if(item.parts&&item.parts.map(p=>p.text).join('')!==item.quote)throw Error('Annotation segmentation mismatch: '+doc+' '+anchor);if(item.translation&&!ja.includes(item.translation))throw Error('Annotation translation absent: '+doc+' '+anchor);}return list;}
