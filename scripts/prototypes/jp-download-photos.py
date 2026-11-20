import json, time, requests, urllib.parse
from pathlib import Path
from PIL import Image
assets=[
("marx","Karl Marx.jpg","PD"),
("hegel","Hegel portrait by Schlesinger 1831.jpg","PD"),
("ww1","The British Army on the Western Front, 1914-1918 Q1426.jpg","PD"),
("lenin","After Lenin Speech 1920.jpg","PD"),
("stalin","Stalin face.jpg","PD"),
("terror","Execution of Louis XVI.jpg","PD"),
("robot","Robot arm works on a small component in a lab setting.jpg","CC BY 2.0"),
]
p=Path("downloaded");p.mkdir(exist_ok=True)
meta=[]
for key,name,lic in assets:
    url="https://commons.wikimedia.org/wiki/Special:Redirect/file/"+urllib.parse.quote(name)+"?width=1100"
    path=p/(key+".jpg")
    ok=False
    for retry in range(4):
        try:
            r=requests.get(url,timeout=90,headers={"User-Agent":"AnnotatedWorldEducationalPrototype/0.1 (Wikimedia Commons licensed source images; project attribution)"})
            r.raise_for_status()
            path.write_bytes(r.content)
            im=Image.open(path).convert("RGB"); im.thumbnail((1200,1200));im.save(path,quality=88)
            print(key,im.size,len(r.content),url,flush=True)
            ok=True
            break
        except Exception as e:
            print("failure",key,retry,str(e)[:300],flush=True);time.sleep(3)
    if not ok:raise RuntimeError("Cannot fetch verified source "+key)
    meta.append({"id":key,"title":name,"license":lic,"commons":"https://commons.wikimedia.org/wiki/File:"+name.replace(" ","_"),"width":im.width,"height":im.height})
(p/"sources.json").write_text(json.dumps(meta,indent=2,ensure_ascii=False),encoding="utf8")
