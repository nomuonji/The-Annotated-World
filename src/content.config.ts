import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
const id=z.string().regex(/^[a-z0-9][a-z0-9-]*$/);
const text=z.string().trim().min(1);
const block=z.object({id,speaker:z.string().default(''),time:z.string().regex(/^(?:\d{1,3}:)?\d{1,2}:\d{2}$|^$/).default(''),en:text,ja:text,note:z.string().default(''),keys:z.array(text).default([])});
const unique=(items:{id:string}[])=>new Set(items.map(i=>i.id)).size===items.length;
const chapter=z.object({id,title:text,time:z.string().default(''),description:z.string().default(''),blocks:z.array(block).min(1).refine(unique,'Duplicate block IDs')});
const lessons=defineCollection({
 loader:glob({pattern:'*.json',base:'./src/content/lessons'}),
 schema:z.object({
 id,title:text,author:text,category:text,description:text,source:z.string().refine(s=>s===''||/^https:\/\/[^\s/]+(?:\/[^\s]*)?$/.test(s),'HTTPS source required').default(''),duration:z.string().default(''),tags:z.array(text).default([]),
 publishedAt:z.iso.date(),draft:z.boolean().default(true),
 rights:z.object({status:z.enum(['original','licensed','public-domain','unverified']),note:text}),
 chapters:z.array(chapter).min(1).refine(unique,'Duplicate chapter IDs')
 }).superRefine((v,ctx)=>{if(!v.draft&&(v.rights.status==='unverified'||(v.rights.status!=='original'&&!v.source)))ctx.addIssue({code:'custom',path:['rights'],message:'Published lessons require verified rights and a source for non-original content'});})
});
export const collections={lessons};