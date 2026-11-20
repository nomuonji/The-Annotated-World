export type YoutubeCapture =
 | {provider:'youtube';videoId:string;method:'youtube-captions'|'youtube-auto-captions'|'youtube-audio-asr';language:string;tool:string;capturedAt:string;sha256:string;transport:'youtube-direct'|'savetube-media-proxy';mediaSha256?:string}
 | {provider:'rapidapi';videoId:string;method:'existing-caption-candidate';language:'en';tool:string;capturedAt:string;sha256:string;transport:'rapidapi-caption-proxy';originVerified:false;sourceCueCount?:number;fullCandidateCoverage?:boolean};
export interface Topic{id:string;name:string}
export interface Person{id:string;name:string;ja:string}
export interface Provenance{coverage:'full'|'excerpt'|'unverified';transcript:'verified'|'unverified'|'not-applicable';translation:'verified'|'unverified';rights:'original'|'licensed'|'public-domain'|'unverified';basis:string;sourceUrl:string}
export interface Annotation{id:string;phrase:string;explanation:string}
export interface CaptionCue{index:number;start:number;end:number;text:string}
export interface Utterance{id:string;speaker:{name:string;className:string};time:string;english:string;englishRaw?:string;japanese:string;annotations:Annotation[];sourceCues?:CaptionCue[];sourceFormatting?:string}
export interface Chapter{id:string;title:string;timeRange:string;summary:string;genres:string[];topics:Topic[];utterances:Utterance[];sourceCueCoverage?:{firstIndex:number;lastIndex:number;count:number};translationStatus?:string}
export interface DocumentInfo{youtubeCapture?:YoutubeCapture;title:string;heroMeta:string;description:string;facts:{label:string;value:string;url?:string}[];toc:{title:string;description:string};sources:{title:string;items:{before:string;url:string;label:string;after:string}[]};chapterOrder:string[];genre:string;format:string;difficulty?:'B1'|'B2'|'C1'|'C2';englishFeatures?:string[];series?:string;people:Person[];topics:Topic[];provenance:Provenance}
export const CONTENT_DIR:string;
export function loadStructuredDocuments():Promise<{id:string;document:DocumentInfo;chapters:Chapter[];bodyHtml:string}[]>;
