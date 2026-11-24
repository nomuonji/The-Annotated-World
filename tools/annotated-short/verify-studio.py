#!/usr/bin/env python3
"""Integration smoke: real source JSON, synthetic technical fixtures, both variants, invalid source/timing."""
import json, subprocess, tempfile, sys
from pathlib import Path
from PIL import Image
from pydub.generators import Sine
ROOT=Path(__file__).resolve().parents[2]
CLI=ROOT/'scripts/short-studio.mjs'
def call(*args,ok=True):
    r=subprocess.run(args,capture_output=True,text=True)
    if (r.returncode==0)!=ok:raise AssertionError(r.stdout+r.stderr)
    return r.stdout
with tempfile.TemporaryDirectory() as tmp:
    root=Path(tmp);p=root/'brief.json';b=json.loads((ROOT/'templates/annotated-short/studio-brief.example.json').read_text())
    p.write_text(json.dumps(b))
    result=json.loads(call('node',str(CLI),'discover',b['source']['slug']))
    assert result['candidates'] and all(x['utteranceId'] for x in result['candidates'])
    call('node',str(CLI),'check',str(p))
    call('node',str(CLI),'check',str(p),'--publish',ok=False)
    original=b['hooks'][0]['en'];b['hooks'][0]['en']='Invented quotation.';p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),ok=False);b['hooks'][0]['en']=original
    # Exercise actual trim/cuts and rejection of unordered timing; no human speech is simulated as genuine.
    s=b['hooks'][0];s['audio']='audio/measured.wav';s['timing']={'mode':'measured','evidence':'manual-listening','start':0,'end':0.8,'cuts':[0.2]}
    p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),ok=False);s['timing']['cuts']=[]
    # Exercise new visual paths on actual rendered frames. Synthetic tones remain technical fixtures.
    note=next(s for s in b['body'] if s['id']=='note')
    note['visual']={'pattern':'branch','items':[{'label':'出発点','text':'革命'},{'label':'期待','text':'解放'},{'label':'帰結','text':'体制'}],'revealAtCue':[0,1,1]}
    note['holdMs']=300
    marx=next(s for s in b['body'] if s['id']=='marx')
    marx['visual']={'pattern':'sequence','items':[{'label':'主張','text':'世界を変える'},{'label':'帰結','text':'変革の結果'},{'label':'問い','text':'解釈し直す'}],'revealAtCue':[0,1,1]}
    close={'id':'close','role':'ANNOTATION','voiceId':b['editor']['voiceId'],'ja':'その先まで考える。','evidence':'編者の結語','visual':{'pattern':'closing','headline':'その先まで考える。'},'holdMs':750,'timing':{'mode':'cue-audio'},'cues':[{'ja':'その先まで考える。','audio':'audio/close.wav'}]}
    b['body'].append(close)
    # Language pattern uses a word actually present in the selected quote.
    q=next(s for s in b['body'] if s['id']=='philosophy')
    language={'id':'language','role':'ANNOTATION','voiceId':b['editor']['voiceId'],'ja':'哲学が必要だという主張。','evidence':'教材原文','visual':{'pattern':'language','term':'philosophy','termRef':q['sourceRef'],'meaning':'哲学','detail':'変革の帰結を考える','value':'原典の論旨との接続'},'timing':{'mode':'cue-audio'},'cues':[{'ja':'哲学が必要だという主張。','audio':'audio/language.wav'}]}
    # Replace the existing intervening note in a second pass? Keep alternating roles by using the language card as that note.
    # Preserve sequence coverage via the context segment.
    context=b['body'][0];context['visual']=marx['visual'];context['visual']['revealAtCue']=[0,0,len(context['cues'])-1]
    b['body'][b['body'].index(marx)]=language
    p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p))
    language['visual']['term']='nonexistent invented term';p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),ok=False);language['visual']['term']='philosophy'
    for seg in b['hooks']+b['body']:
        if seg['visual']['pattern'] in ['portrait','archive']:
            f=root/seg['visual']['asset'];f.parent.mkdir(parents=True,exist_ok=True);Image.new('RGB',(720,720),'#596963').save(f)
        files=[seg['audio']] if seg['timing']['mode']=='measured' else [c['audio'] for c in seg['cues']]
        for name in files:
            f=root/name;f.parent.mkdir(parents=True,exist_ok=True);Sine(440).to_audio_segment(duration=900 if seg['timing']['mode']=='measured' else 320).apply_gain(-14).export(f,format='wav')
    # A synthetic reading may use the reviewed site text without downloading the recording.
    # Test real media fixtures, stale text pin, rights and original-audio gates independently.
    import hashlib
    docroot=ROOT/'src/content/documents'/b['source']['slug']
    def git_blob(p):
        data=p.read_bytes();return hashlib.sha1(b'blob '+str(len(data)).encode()+b'\x00'+data).hexdigest()
    doc=json.loads((docroot/'document.json').read_text())
    review={'basis':'site-content','note':'Synthetic fixture review of site text; no publication intended','documentBlob':git_blob(docroot/'document.json'),'chapterBlobs':{ch:git_blob(docroot/'chapters'/f'{ch}.json') for ch in {s['sourceRef']['chapterId'] for s in b['hooks']+b['body'] if s['role']=='QUOTE'}},'transcriptProvenance':doc['provenance']['transcript'],'rightsProvenance':doc['provenance']['rights']}
    b['source']['articleReview']=review
    b['source']['rightsReviewed']=True;b['music']['rightsReviewed']=True;b['publication']['approved']=True;b['source']['originalAudioChecked']=False
    for s in b['hooks']+b['body']:
        if s['visual']['pattern'] in ['portrait','archive']:s['visual']['rightsReviewed']=True
    p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),'--publish')
    b['source']['rightsReviewed']=False;p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),'--publish',ok=False);b['source']['rightsReviewed']=True
    saved=review['documentBlob'];review['documentBlob']='0'*40;p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),'--publish',ok=False);review['documentBlob']=saved
    b['speaker']['audioKind']='original';p.write_text(json.dumps(b));call('node',str(CLI),'check',str(p),'--publish',ok=False);b['speaker']['audioKind']='synthetic'
    b['publication']['approved']=False;b['source']['rightsReviewed']=False
    p.write_text(json.dumps(b))
    call(sys.executable,str(ROOT/'tools/annotated-short/studio.py'),str(p),'--all')
    for h in b['hooks']:
        out=root/'output'/h['id'];c=json.loads((out/'timeline.json').read_text());r=json.loads((out/'report.json').read_text())
        assert all(y['start']>=x['end']-0.0001 for x,y in zip(c,c[1:]))
        assert c[0]['role']=='QUOTE' and c[-1]['role']=='ANNOTATION' and c[-1]['end']-c[-1]['speechEnd']>=.75 and r['mixPeak']<=-1.1
        assert (out/'annotated-short.mp4').stat().st_size>1000 and (out/'contact-sheet.jpg').stat().st_size>1000
        assert (out/'first-frame-phone.png').exists()
    print('Studio integration: source, invalid cases, two real media renders, timeline and mix PASS')
