import re,json,urllib.request, pathlib
URL="https://commons.wikimedia.org/w/index.php?title=TimedText:Abuse_on_the_blockchain_%E2%80%93_Guest_lecture_at_Stanford_University_by_Molly_White_(2022).webm.en.srt&action=raw"
req=urllib.request.Request(URL,headers={"User-Agent":"AnnotatedWorldContentAgent/1.0 (source-licensed educational annotations)"})
raw=urllib.request.urlopen(req,timeout=65).read().decode("utf-8-sig")
m=re.findall(r'(?m)^\s*(\d+)\s*\n(\d\d:\d\d:\d\d[,\.]\d+)\s*-->\s*(\d\d:\d\d:\d\d[,\.]\d+)\s*\n(.*?)(?=\n\s*\n|\Z)',raw,re.S)
if len(m)<350:raise RuntimeError(f"Only {len(m)} caption blocks fetched; refusing partial source")
def seconds(s):a=s.replace(',','.').split(':');return int(a[0])*3600+int(a[1])*60+float(a[2])
cues=[{"index":int(i),"start":seconds(a),"end":seconds(b),"text":" ".join(t.split())}for i,a,b,t in m]
p=pathlib.Path("source-captions");p.mkdir(exist_ok=True)
(p/"full.srt").write_text(raw,encoding="utf8")
(p/"cues.json").write_text(json.dumps(cues,ensure_ascii=False,indent=2),encoding="utf8")
windows=[(0,80),(118,160),(355,490),(490,600),(615,720),(720,850),(940,1070),(1140,1225),(1590,1660),(1700,1800)]
for i,(start,end) in enumerate(windows):
    selection=[x for x in cues if x["start"]>=start and x["start"]<end]
    (p/f"selection-{i:02}.txt").write_text("\n".join(f'{x["index"]:03d} {x["start"]:8.2f}: {x["text"]}' for x in selection),encoding="utf8")
print("Source-caption cues",len(cues),"first",cues[0],"last",cues[-1])
