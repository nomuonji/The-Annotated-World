// Export the exact site motion stage to a silent 9:16 MP4. Requires ffmpeg, built site, Chromium.
import {chromium} from 'playwright';
import {spawn,spawnSync} from 'node:child_process';
import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const out=resolve(process.argv[2]||'world-audit/after-hours-003.mp4');
const port=4187,base='http://127.0.0.1:'+port;
const server=spawn(process.execPath,['node_modules/.bin/astro','preview','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'});
const dir=await mkdtemp(join(tmpdir(),'aw-motion-'));let browser;
try{
 let ready=false;for(let i=0;i<60;i++){try{if((await fetch(base)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}if(!ready)throw Error('preview unavailable');
 browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:800,height:1400},deviceScaleFactor:1,reducedMotion:'no-preference'});
 await page.route('**/*',r=>r.request().url().startsWith(base)?r.continue():r.abort());
 await page.goto(base+'/marginalia/motion/');await page.addStyleTag({content:'.aw-motion-layout{display:block!important}.aw-motion-copy,.platform-header,.platform-footer{display:none!important}.aw-motion-stage{width:720px!important;height:1280px!important;max-width:none!important;border:0!important;margin:0!important}.platform-page{padding:0!important;margin:0!important}'});
 const stage=page.locator('#aw-motion-stage');await stage.evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(i=>i.decode()));await document.fonts.ready;});
 const fps=12,seconds=Number(await stage.getAttribute('data-duration'));
 for(let f=0;f<seconds*fps;f++){await stage.evaluate((e,t)=>e.dispatchEvent(new CustomEvent('aw-motion-seek',{detail:t})),f/fps);await stage.screenshot({path:join(dir,'frame-'+String(f).padStart(4,'0')+'.png'),animations:'allow'});}
 await mkdir(resolve(out,'..'),{recursive:true});
 const res=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-framerate',String(fps),'-i',join(dir,'frame-%04d.png'),'-vf','fps=24','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',out],{stdio:'inherit'});if(res.status!==0)throw Error('ffmpeg export failed');
 console.log('Motion exported: '+out+' / '+seconds+'s 720x1280');
}finally{await browser?.close();server.kill();await rm(dir,{recursive:true,force:true});}
