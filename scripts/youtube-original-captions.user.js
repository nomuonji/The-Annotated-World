// ==UserScript==
// @name         The Annotated World - YouTube Original Captions Export
// @namespace    https://github.com/nomuonji/The-Annotated-World
// @version      0.1.0
// @description  Export the existing YouTube caption track in the logged-in browser. No ASR, mirrors, external APIs, or uploads.
// @match        https://www.youtube.com/watch*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  const ID='annotated-world-youtube-caption-export';
  const visibleStatus=(value,error=false)=>{
    const el=document.getElementById(ID+'-status');
    if(el){el.textContent=value;el.style.color=error?'#ffb2b2':'#fff';}
  };
  function videoId(){
    const value=new URL(location.href).searchParams.get('v');
    return /^[A-Za-z0-9_-]{11}$/.test(value||'')?value:null;
  }
  function parsePlayerResponse(){
    const player=document.querySelector('#movie_player');
    const candidates=[
      player?.getPlayerResponse?.(),
      window.ytInitialPlayerResponse,
      window.ytplayer?.config?.args?.player_response,
    ];
    for(const x of candidates){
      if(!x)continue;
      try{const data=typeof x==='string'?JSON.parse(x):x;
      if(data?.videoDetails?.videoId===videoId())return data;}catch{}
    }
    return null;
  }
  function getTrack(){
    const p=parsePlayerResponse();
    if(!p)throw new Error('YouTubeのプレーヤー情報をまだ取得できません。動画ページを再読み込みしてください。');
    const tracks=p.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if(!Array.isArray(tracks)||!tracks.length){
      throw new Error('字幕トラックが見つかりません。YouTubeの「字幕(CC)」メニューで存在を確認してください。');
    }
    const en=tracks.filter(x=>/^en(?:-|$)/i.test(x.languageCode||''));
    if(!en.length)throw new Error('英語字幕が見つかりません。利用可能: '+tracks.map(x=>x.languageCode).join(', '));
    const preferred=en.find(x=>x.kind!=='asr')||en[0];
    const url=new URL(preferred.baseUrl);
    const host=url.hostname.toLowerCase();
    if(url.protocol!=='https:'||!(host==='youtube.com'||host.endsWith('.youtube.com'))){
      throw new Error('YouTube配信元でない字幕URLを拒否しました: '+host);
    }
    return {track:preferred,url,available:tracks.length};
  }
  async function exportTrack(){
    const id=videoId();
    if(!id)throw new Error('動画IDを確認できません。');
    const {track,url,available}=getTrack();
    visibleStatus('YouTube字幕を取得中…');
    let bytes=null,extension=null;
    for(const format of ['json3','vtt']){
      const target=new URL(url);
      target.searchParams.set('fmt',format);
      const res=await fetch(target.toString(),{credentials:'include',referrer:location.href});
      if(!res.ok)continue;
      const raw=new Uint8Array(await res.arrayBuffer());
      if(raw.length<200)continue;
      if(format==='json3'){
        try{const parsed=JSON.parse(new TextDecoder().decode(raw));
          const count=parsed.events?.filter(x=>x.segs?.some(y=>y.utf8?.trim())).length||0;
          if(count<3)continue;
        }catch{continue}
      }else if(!new TextDecoder().decode(raw.slice(0,40)).includes('WEBVTT'))continue;
      bytes=raw;extension=format;break;
    }
    if(!bytes)throw new Error('YouTubeが字幕データを返しませんでした（HTTP成功でも空データの場合あり）。');
    const digest=await crypto.subtle.digest('SHA-256',bytes);
    const sha=[...new Uint8Array(digest)].map(v=>v.toString(16).padStart(2,'0')).join('');
    const filename=id+'_'+track.languageCode+'_'+(track.kind==='asr'?'youtube-auto':'uploader')+'.'+extension;
    const blob=new Blob([bytes],{type:extension==='vtt'?'text/vtt':'application/json'});
    const objectUrl=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=objectUrl;a.download=filename;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);
    console.info('Original YouTube caption evidence:',{videoId:id,
      language:track.languageCode,kind:track.kind||'manual',trackCount:available,
      size:bytes.length,sha256:sha,filename});
    visibleStatus('取得成功: '+filename+'（'+bytes.length+' bytes） SHA256: '+sha.slice(0,12)+'…');
  }
  function mount(){
    if(!videoId())return;
    if(document.getElementById(ID))return;
    const wrap=document.createElement('div');wrap.id=ID;
    Object.assign(wrap.style,{position:'fixed',right:'16px',bottom:'18px',zIndex:'2147483640',
      background:'#1a1a1a',color:'#fff',border:'1px solid #666',borderRadius:'8px',
      padding:'10px',font:'13px/1.5 sans-serif',boxShadow:'0 3px 15px #0007',maxWidth:'360px'});
    const button=document.createElement('button');button.textContent='YouTubeの英語字幕を保存';
    Object.assign(button.style,{font:'600 13px sans-serif',padding:'8px 10px',
      color:'#111',background:'#fff',border:'0',borderRadius:'5px',cursor:'pointer'});
    const status=document.createElement('div');status.id=ID+'-status';status.style.marginTop='6px';
    status.textContent='字幕が存在する場合だけ保存。文字起こしは行いません。';
    button.addEventListener('click',async()=>{
      button.disabled=true;
      try{await exportTrack()}catch(e){visibleStatus(String(e.message||e),true)}
      finally{button.disabled=false}
    });
    wrap.append(button,status);document.body.append(wrap);
  }
  function refresh(){
    if(document.getElementById(ID)&&!videoId())document.getElementById(ID).remove();
    mount();
  }
  document.addEventListener('yt-navigate-finish',refresh);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});
  else refresh();
})();
