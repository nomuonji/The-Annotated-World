#!/usr/bin/env python3
"""Reusable source-quote/editor-note video renderer. Editorial baseline: Pilot 012.

This does not download, synthesize, license, or authenticate any source recordings.
You must supply source-checked quotes, two consistent-role audio sets, attributed
photos and rights-cleared music. Never automatically publish its outputs.
"""
from __future__ import annotations
import json
import math
import subprocess
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
from pydub import AudioSegment

FW, FH, FPS = 720, 1280, 20
SR = 48000
ROOT = Path(__file__).resolve().parents[2]


def shell(*args):
    subprocess.run(args, check=True)


def font(size, japanese=False, bold=True):
    candidates = (
        ['/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
         '/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc',
         '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']
        if japanese else
        ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
         '/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf',
         '/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf']
    )
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    try:
        out = subprocess.check_output(
            ['fc-match', '-f', '%{file}\n',
             'Noto Sans CJK JP' if japanese else 'DejaVu Sans'],
            text=True).strip().splitlines()[0]
        return ImageFont.truetype(out, size)
    except Exception as ex:
        raise RuntimeError('Missing usable Latin/Japanese fonts: install fonts-noto-cjk') from ex


def cover(img: Image.Image, size: tuple[int, int], focus=(.5, .42)):
    w, h = size
    scale = max(w / img.width, h / img.height)
    resized = img.resize((math.ceil(img.width * scale), math.ceil(img.height * scale)),
                         Image.Resampling.LANCZOS)
    x = max(0, min(resized.width - w, int(resized.width * focus[0] - w / 2)))
    y = max(0, min(resized.height - h, int(resized.height * focus[1] - h / 2)))
    return resized.crop((x, y, x+w, y+h))


def lines(draw, text, typeface, width, japanese):
    if japanese:
        tokens = list(text)
        joiner = ''
    else:
        tokens = text.split()
        joiner = ' '
    result = []
    line = ''
    for token in tokens:
        candidate = (line + joiner + token) if line else token
        if line and draw.textlength(candidate, font=typeface) > width:
            result.append(line)
            line = token
        else:
            line = candidate
    if line:
        result.append(line)
    return result


def fitted_lines(draw, text, width, japanese, max_lines=2, upper=43, lower=26):
    for size in range(upper, lower-1, -1):
        typeface = font(size, japanese)
        result = lines(draw, text, typeface, width, japanese)
        if len(result) <= max_lines:
            return result, typeface
    raise ValueError('Caption exceeds two lines on mobile: split the cue: ' + text[:100])


def text_with_highlight(draw, rows, x, y, typeface, highlight, fg, accent, japanese=False):
    sep = '' if japanese else ' '
    combined = sep.join(rows)
    left = combined.casefold().find((highlight or '').casefold()) if highlight else -1
    right = left + len(highlight or '')
    offset = 0
    for row in rows:
        xx = x
        for j, ch in enumerate(row):
            color = accent if left >= 0 and left <= offset + j < right else fg
            draw.text((round(xx), y), ch, font=typeface, fill=color,
                      stroke_width=1, stroke_fill=(5, 16, 22))
            xx += draw.textlength(ch, font=typeface)
        offset += len(row) + len(sep)
        y += typeface.size + 9
    return y


def timestamp(t):
    millis = round(t * 1000)
    hours, millis = divmod(millis, 3600000)
    mins, millis = divmod(millis, 60000)
    seconds, millis = divmod(millis, 1000)
    return f'{hours:02}:{mins:02}:{seconds:02},{millis:03}'


def create_frame(brief, segment, cue, all_images):
    quote = segment['role'] == 'QUOTE'
    src = all_images[segment['asset']]
    frame = ImageEnhance.Contrast(cover(src, (FW, FH))).enhance(1.05).convert('RGBA')
    shade = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    shader = ImageDraw.Draw(shade)
    for y in range(FH):
        a = 52 if y < 180 else (10 if y < 650 else min(187, round((y-650)*.37)))
        shader.line((0, y, FW, y), fill=(3, 12, 19, a) if quote else (5, 23, 29, a))
    frame = Image.alpha_composite(frame, shade)
    overlay = Image.new('RGBA', (FW, FH), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    if quote:
        d.rounded_rectangle((32, 36, 678, 150), radius=14, fill=(9, 19, 27, 210))
        portrait = cover(all_images[brief['speaker']['portrait']], (80, 80))
        overlay.paste(portrait, (48, 51))
        d.text((142, 42), brief['speaker']['name'], font=font(34), fill=(255, 246, 218))
        d.text((146, 88), brief['speaker']['voiceDisclosure'],
               font=font(17, True), fill=(231, 228, 217))
        d.text((146, 120), 'SOURCE ' + str(segment['sourceTime']),
               font=font(16), fill=(244, 198, 123))
        erows, ef = fitted_lines(d, cue['en'], 585, False, upper=43)
        jrows, jf = fitted_lines(d, cue['ja'], 585, True, upper=34, lower=27)
        size = len(erows) * (ef.size + 9) + len(jrows) * (jf.size + 9) + 20
        bottom = 1007
        top = bottom - size
        if top < 735:
            raise ValueError('Quote caption card too tall; split cue ' + segment['id'])
        d.rounded_rectangle((32, top-20, 676, bottom+16), radius=14,
                            fill=(5, 16, 24, 200))
        d.rectangle((34, top-5, 40, bottom+2), fill=(248, 195, 106))
        y = text_with_highlight(d, erows, 52, top, ef, cue.get('hiEN', ''),
                                (253, 251, 244), (255, 211, 113))
        text_with_highlight(d, jrows, 52, y+8, jf, cue.get('hiJA', ''),
                            (246, 248, 244), (255, 211, 113), True)
    else:
        d.rounded_rectangle((32, 36, 678, 146), radius=16, fill=(4, 42, 47, 218))
        d.rectangle((33, 51, 40, 137), fill=(75, 232, 203))
        d.text((57, 46), brief['editor']['name'], font=font(29), fill=(246, 255, 249))
        label = '出典紹介' if segment['role'] == 'CONTEXT' else brief['editor'].get('label', '編者註')
        d.text((61, 96), label + ' / 日本語の編者ナレーション',
               font=font(21, True), fill=(168, 248, 226))
        d.rounded_rectangle((41, 204, 672, 303), radius=14, fill=(5, 34, 40, 202))
        title_lines, tf = fitted_lines(d, segment['noteTitle'], 570, True, upper=30, lower=23)
        d.text((59, 218), title_lines[0], font=tf, fill=(254, 254, 249))
        erows, evidf = fitted_lines(d, segment['evidence'], 576, True, upper=20, lower=14)
        for j, line in enumerate(erows[:2]):
            d.text((59, 265+j*25), line, font=evidf, fill=(174, 236, 224))
        jrows, jf = fitted_lines(d, cue['ja'], 576, True, upper=40, lower=27)
        size = len(jrows) * (jf.size+12) + 10
        bottom = 992
        top = bottom - size
        d.rounded_rectangle((35, top-22, 675, bottom+18),
                            radius=14, fill=(6, 33, 38, 209))
        d.rectangle((35, top-5, 42, bottom+3), fill=(88, 228, 206))
        for j,line in enumerate(jrows):
            d.text((54, top+j*(jf.size+12)), line, font=jf, fill=(251, 254, 251))
    frame.alpha_composite(overlay)
    return frame.convert('RGB')


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Usage: python tools/annotated-short/render.py productions/<slug>/brief.json')
    brief_path = Path(sys.argv[1]).resolve()
    shell('node', str(ROOT/'scripts/annotated-short.mjs'), 'validate',
          str(brief_path), '--media', '--source')
    brief = json.loads(brief_path.read_text(encoding='utf-8'))
    root = brief_path.parent
    out = root/'output'
    out.mkdir(exist_ok=True)
    work = out/'work'
    work.mkdir(exist_ok=True)
    image_paths = {brief['speaker']['portrait']} | {s['asset'] for s in brief['segments']}
    all_images = {name: Image.open(root/name).convert('RGB') for name in image_paths}
    clip_data = []
    voice = AudioSegment.silent(duration=0, frame_rate=SR).set_channels(2)
    for i, seg in enumerate(brief['segments']):
        part = AudioSegment.from_file(root/seg['audio']).set_frame_rate(SR).set_channels(2)
        if part.dBFS == float('-inf'):
            raise ValueError('Silent narration: ' + seg['audio'])
        part += min(7.0, max(-7.0, -18.5-part.dBFS))
        part = part.fade_in(18).fade_out(45)
        start = len(voice) / 1000
        voice += part
        end = len(voice) / 1000
        clip_data.append({'role':seg['role'], 'id':seg['id'], 'start':start,
                          'end':end, 'audio':seg['audio'],
                          'voiceId': brief['speaker']['voiceId'] if seg['role']=='QUOTE'
                          else brief['editor']['voiceId']})
        role_changes = (i+1 < len(brief['segments']) and
                        brief['segments'][i+1]['role'] != seg['role'])
        gap = 180 if role_changes else 100
        voice += AudioSegment.silent(duration=gap, frame_rate=SR).set_channels(2)
    if len(voice) < 2000:
        raise ValueError('Unusually short source voice sequence')
    voice.export(out/'voice-only.wav', format='wav')
    bgm = AudioSegment.from_file(root/brief['music']['path']).set_frame_rate(SR).set_channels(2)
    if bgm.dBFS == float('-inf'):
        raise ValueError('BGM is silent; supply audible music')
    bgm = (bgm * math.ceil(len(voice)/len(bgm)))[:len(voice)]
    bgm += voice.dBFS - bgm.dBFS - 4.5
    # Duck background by role only (not by arbitrary high-frequency sound effects).
    music = AudioSegment.silent(duration=0, frame_rate=SR).set_channels(2)
    last = 0
    for slot in clip_data:
        start = round(slot['start']*1000)
        end = round(slot['end']*1000)
        music += bgm[last:start]
        music += bgm[start:end].apply_gain(-1.8 if slot['role']=='QUOTE' else -1.1)
        last = end
    music += bgm[last:len(voice)]
    final = voice.overlay(music)
    if final.max_dBFS > -1.2:
        final = final.apply_gain(-1.2-final.max_dBFS)
    final.export(out/'mix.wav', format='wav')
    music.export(out/'music-only.wav', format='wav')
    cues = []
    for i, (seg, slot) in enumerate(zip(brief['segments'], clip_data)):
        weights = [max(1.0, len(c.get('en') or c['ja']))**.9 for c in seg['cues']]
        total = sum(weights)
        t = slot['start']
        for j,(c,w) in enumerate(zip(seg['cues'],weights)):
            dur = (slot['end']-slot['start'])*w/total
            cues.append({'id':seg['id'], 'role':seg['role'], 'segmentIndex':i,
                         'cueIndex':j,'start':round(t,5), 'end':round(t+dur,5),
                         'en':c.get('en',''), 'ja':c['ja']})
            t += dur
    if len(cues) < 5:
        raise ValueError('Expected several caption units, not a title slide')
    frames = []
    for i,c in enumerate(cues):
        seg = brief['segments'][c['segmentIndex']]
        frame = create_frame(brief, seg, seg['cues'][c['cueIndex']], all_images)
        filename = work/f'frame-{i:03d}.jpg'
        frame.save(filename, quality=89)
        frames.append(filename)
    concat = work/'concat.txt'
    with concat.open('w', encoding='utf-8') as f:
        for i,(c,filename) in enumerate(zip(cues,frames)):
            f.write("file '"+str(filename).replace("'","'\\''")+"'\n")
            next_start = cues[i+1]['start'] if i+1<len(cues) else len(voice)/1000
            duration = next_start-c['start']
            if duration <= 0:
                raise ValueError('Caption order/time is not strictly increasing')
            f.write(f'duration {duration:.6f}\n')
        f.write("file '"+str(frames[-1])+"'\n")
    picture = work/'picture.mp4'
    output = out/'annotated-short.mp4'
    shell('ffmpeg','-y','-hide_banner','-loglevel','error','-safe','0',
          '-f','concat','-i',str(concat),'-r',str(FPS),'-c:v','libx264',
          '-preset','veryfast','-crf','23','-pix_fmt','yuv420p',str(picture))
    shell('ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(picture),
          '-i',str(out/'mix.wav'),'-map','0:v','-map','1:a','-c:v','copy',
          '-c:a','aac','-ar',str(SR),'-ac','2','-b:a','192k',
          '-shortest','-movflags','+faststart',str(output))
    with (out/'captions.srt').open('w',encoding='utf-8') as f:
        for i,c in enumerate(cues,1):
            en = c['en']+'\n' if c['role']=='QUOTE' else ''
            label = '['+brief['speaker']['name']+'の原文朗読]' if c['role']=='QUOTE' else '[The Annotated World・編者註]'
            f.write(f'{i}\n{timestamp(c["start"])} --> {timestamp(c["end"])}\n'
                    f'{label}\n{en}{c["ja"]}\n\n')
    (out/'timeline.json').write_text(json.dumps(clip_data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (out/'cues.json').write_text(json.dumps(cues,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    sample_seconds = min(18, len(voice)/1000)
    for source,name in [(out/'music-only.wav','music-only-preview.mp3'),
                        (out/'mix.wav','full-mix-preview.mp3')]:
        shell('ffmpeg','-y','-hide_banner','-loglevel','error','-i',str(source),
              '-t',f'{sample_seconds:.3f}','-c:a','libmp3lame','-q:a','3',str(out/name))
    thumbs=[]
    for i,fp in enumerate(frames):
        if i % max(1,len(frames)//10):
            continue
        im=Image.open(fp)
        im.thumbnail((180,320))
        thumbs.append(im.copy())
    columns=5
    contact=Image.new('RGB',(columns*190,math.ceil(len(thumbs)/columns)*338),(16,22,28))
    for i,im in enumerate(thumbs):
        contact.paste(im,((i%columns)*190+5,(i//columns)*338+5))
    contact.save(out/'contact-sheet.jpg',quality=88)
    shell('ffmpeg','-v','error','-i',str(output),'-f','null','-')
    print(json.dumps({'result':str(output),'durationSec':len(voice)/1000,
                      'segments':len(clip_data),'captionCues':len(cues),
                      'narrationRmsDbfs':round(voice.dBFS,2),
                      'musicRmsDbfs':round(music.dBFS,2),
                      'mixPeakDbfs':round(final.max_dBFS,2),
                      'originalAudioChecked':brief['source']['originalAudioChecked'],
                      'publicationApproved':brief['publication']['approved']},
                     ensure_ascii=False, indent=2))


if __name__=='__main__':
    main()
