from pathlib import Path
import zipfile,json,hashlib,datetime
qa=Path(__file__).parent
expected=json.loads((qa/'served-identities.json').read_text())
results=[]
for path in sorted(qa.glob('*.zip')):
 variant='before' if path.name.startswith('before-') else 'prototype'
 e=next(x for x in expected if x['variant']==variant)
 root=f"http://127.0.0.1:{e['port']}/"
 asset=next(x for x in e['files'] if x['path'].startswith('assets/index') and x['path'].endswith('.js'))
 files=[]
 with zipfile.ZipFile(path) as z:
  for name in z.namelist():
   if name.endswith('.network'):
    for line in z.read(name).decode().splitlines():
     item=json.loads(line)
     if item.get('type')!='resource-snapshot':continue
     snap=item['snapshot'];url=snap['request']['url'];content=snap['response'].get('content',{})
     if url!=root and url!=root+asset['path']:continue
     resource=content.get('_file');body=z.read(resource) if resource in z.namelist() else None
     files.append({'url':url,'status':snap['response']['status'],'resourceBytesRecorded':body is not None,'sha256':hashlib.sha256(body).hexdigest() if body else None})
 result={'trace':path.name,'variant':variant,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'requests':files,'correctOriginAndAssetRequest':any(x['url']==root for x in files) and any(x['url']==root+asset['path'] for x in files),'htmlBytesMatch':any(x['url']==root and x['sha256']==next(f for f in e['files'] if f['path']=='index.html')['sha256'] for x in files)}
 results.append(result)
 if not result['correctOriginAndAssetRequest'] or not result['htmlBytesMatch']:raise RuntimeError(result)
(qa/'trace-source-verification.json').write_text(json.dumps(results,indent=2))
print(json.dumps({'verified':len(results),'allCorrect':all(r['correctOriginAndAssetRequest'] and r['htmlBytesMatch'] for r in results),'javascriptBodyGap':'Some trace network entries omit JS body bytes; exact requested hashed asset path is confirmed, later independent served hash inventory supplies frozen-file identity.'}))
