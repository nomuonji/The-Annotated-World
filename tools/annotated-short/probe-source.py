#!/usr/bin/env python3
"""Direct YouTube existing English captions probe. Only hashes and matching metadata leave memory."""
import argparse, hashlib, json, re, unicodedata, html
from pathlib import Path
from youtube_transcript_api import YouTubeTranscriptApi
def norm(s):
    return " ".join(re.findall(r"[\w]+",unicodedata.normalize("NFKC",html.unescape(s)).casefold()))
def main():
    p=argparse.ArgumentParser();p.add_argument("brief",type=Path);p.add_argument("--report",type=Path,required=True);a=p.parse_args()
    b=json.loads(a.brief.read_text())
    m=re.fullmatch(r"https://www\.youtube\.com/watch\?v=([A-Za-z0-9_-]{11})",b["source"]["url"])
    if not m:raise ValueError("Expected exact YouTube source video URL")
    vid=m.group(1);report={"videoId":vid,"transport":"youtube-direct","recordingVerified":False,"rightsApproved":False,"status":"unverified"}
    try:
        tracks=YouTubeTranscriptApi().list(vid)
        track=tracks.find_transcript(["en","en-US","en-GB"])
        if not track.language_code.startswith("en"):raise ValueError("Not English track")
        data=track.fetch().to_raw_data()
        if not data:raise ValueError("Empty track")
        raw=json.dumps(data,ensure_ascii=False,separators=(",",":")).encode()
        report.update({"status":"candidate_received","language":track.language_code,"isGenerated":track.is_generated,"cueCount":len(data),"endSec":data[-1]["start"]+data[-1]["duration"],"normalizedApiPayloadSha256":hashlib.sha256(raw).hexdigest()})
        matches=[]
        for s in b["hooks"]+b["body"]:
            if s["role"]!="QUOTE":continue
            m0=re.search(r"\d\d:\d\d:\d\d",s["sourceRef"]["time"]);hh,mm,ss=map(int,m0.group().split(":"));t=hh*3600+mm*60+ss
            nearby=" ".join(x["text"] for x in data if t-20<=x["start"]<=t+180)
            matches.append({"segment":s["id"],"exactNormalizedMatch":norm(s["en"]) in norm(nearby)})
        report["matches"]=matches;report["status"]="caption_matches" if all(x["exactNormalizedMatch"] for x in matches) else "caption_differences"
    except Exception as e:
        report.update({"status":"unavailable","errorType":type(e).__name__})
    a.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":main()
