#!/usr/bin/env python3
"""Create cue-level Kokoro narration in an isolated preview directory. Never publish."""
import argparse, json, hashlib, shutil
from pathlib import Path
import numpy as np
import soundfile as sf
from kokoro import KPipeline
MODEL="hexgrad/Kokoro-82M"
VOICES={"QUOTE":("a","am_michael"),"EDITOR":("j","jf_alpha")}
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def synthesize(cues,out):
    pipes={}; records=[]
    out.mkdir(parents=True,exist_ok=True)
    for role,voice_text,name in cues:
        lang,voice=VOICES[role]
        if lang not in pipes:pipes[lang]=KPipeline(lang_code=lang,repo_id=MODEL,device="cpu")
        path=out/name
        assert not path.exists() and path.parent==out
        chunks=[]
        for result in pipes[lang](voice_text,voice=voice,speed=0.96):
            a=np.asarray(result.audio,dtype=np.float32)
            if a.size:chunks.append(a)
        if not chunks:raise ValueError("No speech: "+name)
        a=np.concatenate(chunks)
        if not np.isfinite(a).all() or len(a)<2400 or np.max(np.abs(a))<0.001:raise ValueError("Invalid audio: "+name)
        sf.write(path,a,24000,subtype="PCM_16")
        records.append({"file":name,"role":role,"voice":voice,"durationSec":len(a)/24000,"sha256":digest(path)})
    return records
def main():
    p=argparse.ArgumentParser();p.add_argument("--brief",type=Path);p.add_argument("--out",type=Path,required=True);p.add_argument("--smoke",action="store_true");args=p.parse_args()
    if args.out.exists():raise ValueError("Output must be new: "+str(args.out))
    out=args.out;out.mkdir(parents=True)
    if args.smoke:
        cues=[("QUOTE","The result is not always what we expected.","en.wav"),("EDITOR","理想と結果は、必ずしも一致しません。","ja.wav")]
        records=synthesize(cues,out/"audio")
    else:
        if not args.brief:raise ValueError("Specify --brief or --smoke")
        b=json.loads(args.brief.read_text());cues=[]
        b["speaker"]["voiceId"]="kokoro:am_michael";b["editor"]["voiceId"]="kokoro:jf_alpha";b["speaker"]["disclosure"]="原文の合成朗読・本人の肉声ではない"
        b["speaker"]["audioKind"]="synthetic";b["publication"]["approved"]=False
        b["deliveryReview"]={"approved":False,"reviewer":None,"evidence":None}
        for s in b["hooks"]+b["body"]:
            q=s["role"]=="QUOTE";role="QUOTE" if q else "EDITOR"
            s["voiceId"]=b["speaker"]["voiceId"] if q else b["editor"]["voiceId"]
            s.pop("audio",None);s["timing"]={"mode":"cue-audio"}
            for i,c in enumerate(s["cues"]):
                name=f'{s["id"]}-{i:02d}.wav'
                c["audio"]="audio/"+name
                text=c["en"] if q else c["ja"]
                cues.append((role,text,name))
        records=synthesize(cues,out/"audio")
        if (args.brief.parent/"assets").is_dir():shutil.copytree(args.brief.parent/"assets",out/"assets")
        (out/"brief.json").write_text(json.dumps(b,ensure_ascii=False,indent=2)+"\n")
    report={"model":MODEL,"license":"Apache-2.0","licenseUrl":"https://huggingface.co/hexgrad/Kokoro-82M","pipelineVersion":"0.9.4","audio":records,"approved":False,"review":"Audio generation and integrity only; actual listening, pronunciation, source and rights review required."}
    (out/"voice-report.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
