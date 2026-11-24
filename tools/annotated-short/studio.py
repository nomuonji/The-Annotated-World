#!/usr/bin/env python3
"""Pilot 013 design system. Render source-checked, role-separated clips; never publish."""
import argparse, json, math, subprocess, sys
from functools import lru_cache
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from pydub import AudioSegment

ROOT=Path(__file__).resolve().parents[2]
CAT=json.loads((ROOT/'templates/annotated-short/studio-catalog.json').read_text())
W,H,FPS=720,1280,24
BG,PAPER,INK,GOLD,TEAL,GRAY=('#121C22','#F3EDE1','#19272B','#F5CA78','#34655B','#C1C8C6')
SR=48000
def run(*args): subprocess.run(args,check=True)
@lru_cache(None)
def ft(face,size):
    names={'en':'DejaVuSans.ttf','b':'DejaVuSans-Bold.ttf','s':'DejaVuSerif.ttf','j':'NotoSansCJK-Regular.ttc','jb':'NotoSansCJK-Bold.ttc','js':'NotoSerifCJK-Bold.ttc'}
    for directory in ['/usr/share/fonts/truetype/dejavu','/usr/share/fonts/opentype/noto','/usr/share/fonts/truetype/noto']:
        p=Path(directory)/names[face]
        if p.exists(): return ImageFont.truetype(str(p),size)
    raise RuntimeError('Install DejaVu and Noto Sans/Serif CJK: '+names[face])
def text(d,x,y,s,face,size,color): d.text((x,y),s,font=ft(face,size),fill=color)
def wrap(d,s,f,w,jp):
    a=list(s) if jp else s.split(); sep='' if jp else ' '; rows=[]; line=''
    for token in a:
        cand=line+sep+token if line else token
        if line and d.textlength(cand,font=f)>w:
            if jp and token in '。、！？）」』】〉》：；' and len(line)>1:
                rows.append(line[:-1]);line=line[-1]+token
            else: rows.append(line);line=token
        else: line=cand
    return rows+([line] if line else [])
def block(d,s,x,y,w,face,size,minimum,col,hi='',accent=GOLD,jp=False,maxrows=2,lead=1.2):
    for sz in range(size,minimum-1,-1):
        f=ft(face,sz);rows=wrap(d,s,f,w,jp)
        if len(rows)<=maxrows and all(d.textlength(r,font=f)<=w for r in rows): break
    else: raise ValueError('Split overlong caption/visual label: '+s)
    sep='' if jp else ' ';pos=sep.join(rows).casefold().find(hi.casefold()) if hi else -1;off=0
    for row in rows:
        lo=max(0,pos-off);end=min(len(row),pos+len(hi)-off)
        if pos<0 or end<=lo or lo>=len(row): d.text((x,y),row,font=f,fill=col)
        else:
            for a,b,c in [(0,lo,col),(lo,end,accent),(end,len(row),col)]:
                if a<b: d.text((x+d.textlength(row[:a],font=f),y),row[a:b],font=f,fill=c)
        y+=round(sz*lead);off+=len(row)+len(sep)
    return y
def rule(d,y,c): d.line((48,y,620,y),fill=c,width=2)
def audio(path):
    a=AudioSegment.from_file(path).set_frame_rate(SR).set_channels(2).set_sample_width(2)
    if len(a)<80 or not math.isfinite(a.dBFS): raise ValueError('Silent/short audio: '+str(path))
    return a
def silence(ms): return AudioSegment.silent(duration=ms,frame_rate=SR).set_channels(2).set_sample_width(2)
def normalize(a): return a.apply_gain(min(12,max(-12,-18.4-a.dBFS))).fade_in(8).fade_out(20)
def timeline(b,root,hook):
    voice=silence(0);cues=[];segments=[hook]+b['body']
    for i,s in enumerate(segments):
        start=len(voice);tim=s['timing'];cuts=[];units=s['cues']
        if tim['mode']=='measured':
            a=audio(root/s['audio']);a0=round(tim['start']*1000);a1=round(tim['end']*1000)
            if a1>len(a): raise ValueError('trim exceeds audio: '+s['id'])
            voice+=normalize(a[a0:a1])
            cuts=[round(v*1000)-a0 for v in [tim['start'],*tim['cuts'],tim['end']]]
        else:
            cuts=[0]
            for c in units:
                voice+=normalize(audio(root/c['audio']));cuts.append(len(voice)-start)
        role_change=i+1<len(segments) and segments[i+1]['role']!=s['role']
        gap=(180 if role_change else (700 if i==len(segments)-1 else 80))+s.get('holdMs',0)
        voice+=silence(gap)
        for j,c in enumerate(units):
            lo,hi=cuts[j:j+2]
            if hi-lo<80: raise ValueError('cue too short: '+s['id'])
            cues.append({**c,'segmentId':s['id'],'role':s['role'],'segmentIndex':i,'cueIndex':j,'start':(start+lo)/1000,'speechEnd':(start+hi)/1000,'end':(start+hi+(gap if j==len(units)-1 else 0))/1000,'timingMode':tim['mode'],'timingEvidence':tim.get('evidence','separate cue recording')})
    return voice,cues,segments
def soundtrack(voice,cues,segments,motif):
    n=len(voice.get_array_of_samples())//2;music=np.zeros(n,np.float32);sfx=np.zeros(n,np.float32)
    def tone(buf,at,f,dur,amp,decay):
        i=round(at*SR);count=min(n-i,round(dur*SR))
        if count<=0:return
        x=np.arange(count)/SR
        buf[i:i+count]+=amp*(np.sin(2*np.pi*f*x)+.29*np.sin(4*np.pi*f*x)+.09*np.sin(6*np.pi*f*x))*np.minimum(1,x/.012)*np.exp(-x/decay)
    chords=motif['chords']
    for k,at in enumerate(np.arange(0,n/SR,motif['beat'])):
        ch=chords[(k//8)%len(chords)];tone(music,at,ch[k%3+1],.95,.14,.49)
        if k%2==0:tone(music,at,ch[0]/2,.7,.27,.32)
        if k%8==0:
            for f in ch[1:]:tone(music,at,f,1.3,.065,.49)
    if segments[-1]['visual']['pattern']=='closing':
        at=cues[-1]['speechEnd'];start=max(0,round(at*SR))
        music[start:]*=0.28
        for f in chords[0][1:]:tone(music,at,f,1.8,.09,.6)
    music*=np.minimum(1,np.arange(n)/(SR*.15))*np.minimum(1,(n-np.arange(n))/(SR*.55))
    music*=10**(-25/20)/max(1e-8,np.sqrt(np.mean(music**2)))
    gain=np.ones(n,np.float32)
    for c in cues:
        a,z=round(c['start']*SR),round(c['speechEnd']*SR)
        gain[a:z]=.80 if c['role']=='QUOTE' else .95
    # Smooth transitions rather than abrupt gain steps.
    smooth=round(.04*SR)
    for at in np.flatnonzero(np.diff(gain))+1:
        z=min(n,at+smooth);gain[at:z]=np.linspace(gain[at-1],gain[at],z-at)
    music*=gain
    first={}
    for c in cues:first.setdefault(c['segmentIndex'],c['start'])
    for i,s in enumerate(segments):
        effect=s.get('effect','none')
        for f in {'note-entry':[392,523.25],'reversal':[196,146.83],'resolution':[261.63,392]}.get(effect,[]):
            tone(sfx,first[i],f,.3,.017,.10)
    v=np.array(voice.get_array_of_samples(),np.float32).reshape(-1,2)/32768
    x=v+(music+sfx)[:,None];gain_final=min(1,10**(-1.2/20)/max(1e-8,np.max(np.abs(x))))
    def pcm(a):return AudioSegment((np.clip(a,-1,1)*32767).astype('<i2').tobytes(),frame_rate=SR,sample_width=2,channels=2)
    return pcm(x*gain_final),pcm(np.repeat(music[:,None],2,axis=1)*gain_final),pcm(np.repeat(sfx[:,None],2,axis=1)*gain_final),gain_final
class Visual:
    def __init__(self,root,segment,b):
        self.s=segment;self.v=segment['visual'];self.b=b;self.frames=[];self.photo=None;self.raw=None
        if self.v['pattern'] in ['portrait','archive']:
            p=root/self.v['asset']
            if p.suffix.lower() in ['.mp4','.mov','.webm','.mkv']:
                # Decode authorized moving footage to the pattern's frame area at render FPS.
                h=510 if segment['role']=='QUOTE' else 530
                self.raw=subprocess.Popen(['ffmpeg','-v','error','-ss',str(self.v.get('inSec',0)),'-i',str(p),'-an','-vf',f'fps={FPS},scale=720:{h}:force_original_aspect_ratio=increase,crop=720:{h}','-f','rawvideo','-pix_fmt','rgb24','-'],stdout=subprocess.PIPE);self.raw_size=(720,h);self.last=None
            else:self.photo=Image.open(p).convert('RGB')
        self.portrait=Image.open(root/b['speaker']['portrait']).convert('RGB') if segment['role']=='QUOTE' and self.v['pattern']=='archive' else None
    def close(self):
        if self.raw:
            self.raw.stdout.close();self.raw.terminate();self.raw.wait()
    def picture(self,progress,size):
        if self.raw:
            data=self.raw.stdout.read(self.raw_size[0]*self.raw_size[1]*3)
            if len(data)==self.raw_size[0]*self.raw_size[1]*3:self.last=Image.frombytes('RGB',self.raw_size,data)
            if self.last is None:raise ValueError('no video frames: '+self.s['id'])
            return self.last
        w,h=size;z=1.035+.08*max(0,min(1,progress));pw,ph=round(w*z),round(h*z)
        image=ImageOps.fit(self.photo,(pw,ph),centering=tuple(self.v.get('focus',[.56,.38])))
        return image.crop(((pw-w)//2,(ph-h)//2,(pw-w)//2+w,(ph-h)//2+h))
    def caption(self,c):
        q=self.s['role']=='QUOTE';im=Image.new('RGBA',(W,H),(0,0,0,0) if q else PAPER);d=ImageDraw.Draw(im)
        if q:
            d.rectangle((0,0,W,132),fill=BG);d.rectangle((0,642,W,H),fill=BG);d.rectangle((0,609,W,642),fill=(18,28,34,225))
            text(d,48,29,'THE ANNOTATED WORLD','b',18,GOLD)
            y=block(d,self.b['speaker']['name'].upper(),48,58,570,'b',32,21,PAPER,maxrows=1)
            block(d,self.b['speaker']['disclosure'],48,104,570,'j',17,13,GRAY,jp=True,maxrows=1)
            block(d,self.v['dateLabel'],48,612,570,'j',16,12,GRAY,jp=True,maxrows=1)
            y=block(d,c['en'],48,685,570,'b',45,27,PAPER,c.get('hiEN',''),maxrows=2)
            rule(d,y+13,'#536066');y=block(d,c['ja'],48,y+30,570,'j',33,26,PAPER,c.get('hiJA',''),jp=True,maxrows=2,lead=1.34)
            if y>1080:raise ValueError('caption outside safe area')
        else:
            text(d,48,30,'THE ANNOTATED WORLD','b',18,TEAL);text(d,48,66,'出典紹介' if self.s['role']=='CONTEXT' else ('原語を読む' if self.v['pattern']=='language' else '編者註'),'jb',32,INK);rule(d,132,TEAL)
            rule(d,742,TEAL)
            y=block(d,c['ja'],48,790,570,'jb',38,29,INK,jp=True,maxrows=4,lead=1.38)
            if y>1090:raise ValueError('note caption outside safe area')
        return im
    def frame(self,c,fg,progress,sec):
        q=self.s['role']=='QUOTE';v=self.v;pattern=v['pattern']
        if q:
            base=Image.new('RGB',(W,H),BG);base.paste(self.picture(progress,(720,510)),(0,132));base.paste(fg,(0,0),fg)
            if self.portrait:
                base.paste(ImageOps.fit(self.portrait,(64,64)),(620,49))
            return base
        base=fg.convert('RGB');d=ImageDraw.Draw(base)
        if pattern=='archive':
            base.paste(self.picture(progress,(720,530)),(0,152));d=ImageDraw.Draw(base)
            block(d,v['dateLabel'],48,692,570,'j',19,13,TEAL,jp=True,maxrows=1)
        elif pattern=='closing':
            if sec>=c['speechEnd']:
                base=Image.new('RGB',(W,H),BG);d=ImageDraw.Draw(base)
                d.line((295,390,425,390),fill=GOLD,width=3)
                block(d,v['headline'],64,470,550,'js',64,34,PAPER,jp=True,maxrows=3,lead=1.4)
                text(d,64,990,'THE ANNOTATED WORLD','b',20,GOLD)
            else:
                block(d,v['headline'],48,300,570,'js',65,34,INK,jp=True,maxrows=3,lead=1.4)
        elif pattern=='language':
            block(d,v['term'],48,220,570,'b',72,35,TEAL,maxrows=2)
            rule(d,390,TEAL)
            block(d,v['meaning'],48,425,570,'js',53,30,INK,jp=True,maxrows=2)
            block(d,v['detail'],48,610,570,'j',27,20,TEAL,jp=True,maxrows=2)
        elif pattern in ('branch','sequence'):
            items=v['items'];schedule=v.get('revealAtCue',[0,0,0])
            count=sum(n<=c['cueIndex'] for n in schedule)
            positions=[(48,200,570),(48,390,270),(348,390,270)] if pattern=='branch' else [(48,190,570),(48,355,570),(48,520,570)]
            for i,(x,y,w) in enumerate(positions):
                if i>=count:continue
                if i and pattern=='sequence':d.line((72,y-24,72,y-5),fill=TEAL,width=3)
                if i and pattern=='branch':d.line((330,320,x+w//2,380),fill=TEAL,width=3)
                d.rounded_rectangle((x,y,x+w,y+128),radius=10,outline=TEAL,width=2)
                block(d,items[i]['label'],x+14,y+9,w-28,'j',22,16,TEAL,jp=True,maxrows=1)
                block(d,items[i]['text'],x+14,y+43,w-28,'jb',37,24,INK,jp=True,maxrows=2)
        elif pattern in ('title','concept'):
            block(d,v.get('kicker','CONTEXT'),48,200,570,'b',40,22,TEAL,maxrows=1)
            jp=any(ord(ch)>255 for ch in v['headline'])
            block(d,v['headline'],48,290,570,'js' if jp else 'b',95,37,INK,jp=jp,maxrows=2,lead=1.25)
            block(d,v.get('detail',''),48,590,570,'j',28,22,TEAL,jp=True,maxrows=2)
        else:
            a,b=v['items']
            text(d,48,184,a['label'],'b',27,TEAL)
            block(d,a['text'],48,235,570,'js',55,32,INK,jp=True,maxrows=2)
            schedule=v.get('revealAtCue')
            if schedule and c['cueIndex']<schedule[1]:return base
            if pattern=='timeline':
                d.line((72,385,72,505),fill=TEAL,width=4);d.polygon([(60,500),(84,500),(72,518)],fill=TEAL)
            else:rule(d,378,TEAL)
            text(d,48,430 if pattern=='contrast' else 530,b['label'],'jb',25,TEAL)
            block(d,b['text'],48,480 if pattern=='contrast' else 570,570,'js',48,30,INK if schedule or progress>=.44 else '#89928D',jp=True,maxrows=2)
            block(d,v.get('detail',''),48,680,570,'j',23,17,TEAL,jp=True,maxrows=1)
        return base
def ts(t):
    ms=round(t*1000);h,ms=divmod(ms,3600000);m,ms=divmod(ms,60000);s,ms=divmod(ms,1000)
    return f'{h:02}:{m:02}:{s:02},{ms:03}'
def render(b,root,hook):
    out=root/'output'/hook['id'];out.mkdir(parents=True,exist_ok=True)
    voice,cues,segments=timeline(b,root,hook)
    mix,music,sfx,gain=soundtrack(voice,cues,segments,CAT['audio']['motifs'][b['music']['motif']])
    for name,a in [('voice-only',voice),('music-only',music),('effects-only',sfx),('mix',mix)]:a.export(out/(name+'.wav'),format='wav')
    total=len(voice)/1000
    visuals=[];thumbs=[];i=0;last=-1
    proc=subprocess.Popen(['ffmpeg','-y','-hide_banner','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-i',str(out/'mix.wav'),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',str(out/'annotated-short.mp4')],stdin=subprocess.PIPE)
    try:
        visuals=[Visual(root,s,b) for s in segments]
        starts={};ends={}
        for c in cues:starts.setdefault(c['segmentIndex'],c['start']);ends[c['segmentIndex']]=c['end']
        for f in range(math.ceil(total*FPS)):
            sec=f/FPS
            while i+1<len(cues) and sec>=cues[i]['end']:i+=1
            c=cues[i];k=c['segmentIndex'];v=visuals[k];changed=i!=last
            if changed:fg=v.caption(c);last=i
            progress=(sec-starts[k])/max(.08,ends[k]-starts[k]);base=v.frame(c,fg,progress,sec)
            d=ImageDraw.Draw(base);q=c['role']=='QUOTE';color=GOLD if q else TEAL
            d.line((48,1095,620,1095),fill='#536066' if q else '#CBC9BC',width=2);d.line((48,1095,48+round(572*sec/total),1095),fill=color,width=3)
            if changed or (v.v['pattern']=='closing' and sec>=c['speechEnd'] and sec-1/FPS<c['speechEnd']):thumbs.append(base.resize((180,320)))
            proc.stdin.write(base.tobytes())
        proc.stdin.close()
        if proc.wait()!=0:raise RuntimeError('ffmpeg failed')
    finally:
        if proc.poll() is None:proc.kill();proc.wait()
        for v in visuals:v.close()
    sheet=Image.new('RGB',(5*190,math.ceil(len(thumbs)/5)*330),'#E0DED6')
    for i,im in enumerate(thumbs):sheet.paste(im,((i%5)*190+5,(i//5)*330+5))
    sheet.save(out/'contact-sheet.jpg',quality=91);thumbs[0].save(out/'first-frame-phone.png')
    (out/'timeline.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2))
    (out/'captions.srt').write_text('\n'.join(f'{i+1}\n{ts(c["start"])} --> {ts(c["speechEnd"])}\n'+(c['en']+'\n' if c.get('en') else '')+c['ja']+'\n' for i,c in enumerate(cues)))
    report={'hook':hook['id'],'durationSec':total,'cueCount':len(cues),'voiceRms':voice.dBFS,'musicRms':music.dBFS,'mixPeak':mix.max_dBFS,'finalGain':gain,'sourceChecked':b['source']['originalAudioChecked'],'publicationApproved':False,'review':'Technical checks only; listen and verify all frames, timing, rights and editorial quality.'}
    (out/'report.json').write_text(json.dumps(report,indent=2))
    run('ffmpeg','-v','error','-i',str(out/'annotated-short.mp4'),'-f','null','-')
    print(json.dumps(report))
def main():
    p=argparse.ArgumentParser();p.add_argument('brief',type=Path);p.add_argument('--all',action='store_true');args=p.parse_args()
    path=args.brief.resolve();run('node',str(ROOT/'scripts/short-studio.mjs'),'check',str(path),'--media')
    b=json.loads(path.read_text());hooks=b['hooks'] if args.all else [h for h in b['hooks'] if h['id']==b['selectedHook']]
    for h in hooks:render(b,path.parent,h)
if __name__=='__main__':main()
