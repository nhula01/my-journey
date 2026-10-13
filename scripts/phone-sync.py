"""Transfer password-app food submissions to the Weight project for chat analysis.

Credentials live only in ignored .journey/phone-sync.json. No OpenAI API key.
"""
import argparse
import json
import mimetypes
import os
import re
import urllib.request
import urllib.error
from pathlib import Path
from journal import read, JOURNAL

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/'.journey/phone-sync.json'
INBOX=ROOT/'.journey/phone-inbox'

def request(route,method='GET',data=None,content_type='application/json'):
    config=json.loads(CONFIG.read_text())
    if not config['url'].startswith('https://') or not config['url'].endswith('.chatgpt.site'):
        raise ValueError('Unexpected app origin.')
    body=json.dumps(data).encode() if data is not None and content_type=='application/json' else data
    req=urllib.request.Request(config['url']+'/api/project-sync'+route,data=body,method=method,headers={'Authorization':'Bearer '+config['key'],'Content-Type':content_type,'User-Agent':'MyJourney-ProjectSync/1.0','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=45) as response:
        return response.read()

def pull():
    payload=json.loads(request(''))
    INBOX.mkdir(parents=True,exist_ok=True)
    incoming=[]
    for entry in payload.get('food',[]):
        identity=entry.get('id','')
        if not re.fullmatch(r'food-[a-f0-9-]{36}',identity):raise ValueError('Invalid inbox ID.')
        extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}.get(entry.get('contentType'))
        if not extension:raise ValueError('Unexpected photo type.')
        filename=identity+'.'+extension
        photo=INBOX/filename
        if not photo.exists():
            raw=request('/photo/'+identity)
            if len(raw)>4_000_000:raise ValueError('Inbox photo is too large.')
            photo.write_bytes(raw)
        record={**entry,'photoFile':str(photo),'private':True,'analysisStatus':'pending'}
        (INBOX/(identity+'.json')).write_text(json.dumps(record,indent=2)+'\n')
        incoming.append(identity)
    (INBOX/'workouts.json').write_text(json.dumps(payload.get('workouts',[]),indent=2)+'\n')
    (INBOX/'pending.json').write_text(json.dumps({'food':incoming,'workouts':len(payload.get('workouts',[]))},indent=2)+'\n')
    print(f'Inbox: {len(incoming)} food photo(s) awaiting analysis; {len(payload.get("workouts",[]))} workout snapshot(s).')

def push():
    journal=read()
    snapshot={key:journal[key] for key in ('version','updatedAt','goals','meals','measurements','reflections','activities') if key in journal}
    request('/journal','PUT',snapshot)
    for meal in snapshot.get('meals',[]):
        for photo in meal.get('photos',[]):
            filename=photo['path'].removeprefix('photos/')
            if not re.fullmatch(r'[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)',filename,re.I):raise ValueError('Invalid journal photo name.')
            local=JOURNAL.parent/'photos'/filename
            if not local.is_file():raise ValueError('A journal photo is missing.')
            content=local.read_bytes()
            if len(content)>4_000_000:raise ValueError('A journal photo is too large.')
            boundary='journey-'+os.urandom(12).hex()
            body=(f'--{boundary}\r\nContent-Disposition: form-data; name="filename"\r\n\r\n{filename}\r\n--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="{filename}"\r\nContent-Type: {mimetypes.guess_type(filename)[0]}\r\n\r\n').encode()+content+f'\r\n--{boundary}--\r\n'.encode()
            request('/journal-photo','POST',body,'multipart/form-data; boundary='+boundary)
    print('Journal and referenced food photos synced to the password app.')

def acknowledge(identity,meal_id):
    journal=read()
    if not any(meal['id']==meal_id for meal in journal['meals']):raise ValueError('Save the analyzed meal through scripts/journal.py first.')
    request('/acknowledge','POST',{'id':identity,'mealId':meal_id})
    print('Submission marked analyzed in the app.')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action',choices=['pull','push','acknowledge'])
    parser.add_argument('--id');parser.add_argument('--meal-id')
    args=parser.parse_args()
    try:
        if args.action=='pull':pull()
        elif args.action=='push':push()
        else:acknowledge(args.id,args.meal_id)
    except (OSError,ValueError,KeyError,urllib.error.URLError) as error:
        # Do not print request objects, headers, credential files or tokens.
        print(f'Phone sync failed ({type(error).__name__}). Check the app connection and retry.')
        raise SystemExit(1)
