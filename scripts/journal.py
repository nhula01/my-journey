"""Validated, private project records for food logged in the project chat."""
import argparse
import json
import math
import os
import re
import sys
from datetime import date, datetime, timezone
from pathlib import Path

JOURNAL = Path(__file__).resolve().parents[1] / '.journey' / 'journal.json'
KEYS = ('calories', 'protein', 'carbs', 'fat', 'fiber')

def blank():
    return {'version': 1, 'updatedAt': None, 'goals': {}, 'meals': [], 'measurements': [], 'reflections': [], 'activities': [], 'practices': [], 'pianoLearning': [], 'pianoFocus': {}}

def text(value, name, required=False, maximum=12000):
    if not isinstance(value, str) or len(value)>maximum or (required and not value.strip()):
        raise ValueError(f'Invalid {name}.')

def day(value):
    if not isinstance(value, str) or date.fromisoformat(value).isoformat()!=value:
        raise ValueError('Use a valid YYYY-MM-DD date.')

def numeric(value, name, minimum=0, maximum=20000):
    if isinstance(value, bool) or not isinstance(value, (int,float)) or not math.isfinite(value) or not minimum<=value<=maximum:
        raise ValueError(f'Invalid {name}.')

def suggestions(items):
    if not isinstance(items, list) or len(items)>20:
        raise ValueError('Invalid suggestions.')
    for item in items:
        if not isinstance(item,dict): raise ValueError('Invalid suggestion.')
        text(item.get('title'),'suggestion title',True,500)
        text(item.get('detail'),'suggestion detail',True)

def validate_url(value):
    from urllib.parse import urlsplit
    text(value,'source URL',True)
    parsed=urlsplit(value)
    if parsed.scheme not in ('https','http') or not parsed.netloc:
        raise ValueError('Use an HTTP or HTTPS source URL.')

def validate_next_move(plan):
    if plan is None: return
    if not isinstance(plan,dict): raise ValueError('Invalid next learning step.')
    for key in ('topic','why','learn','exercise','success'): text(plan.get(key),key,True)
    if plan.get('resourceURL'): validate_url(plan['resourceURL'])
    if plan.get('resourceTitle'): text(plan['resourceTitle'],'resource title',True,500)

def validate(data):
    if not isinstance(data,dict) or data.get('version')!=1:
        raise ValueError('Expected journal version 1.')
    goals=data.get('goals')
    if not isinstance(goals,dict): raise ValueError('Invalid goals.')
    for key in (*KEYS,'weight','height'):
        if goals.get(key) is not None: numeric(goals[key], key, .1, 20000 if key in KEYS else 500)
    if goals.get('energyPlan') is not None:
        plan=goals['energyPlan']
        if not isinstance(plan,dict): raise ValueError('Invalid calorie plan.')
        for key in ('maintainCurrent','loseTowardGoal','maintainGoal'):
            if plan.get(key) is not None: numeric(plan[key],key,1,20000)
        for key in ('inputWeight','goalWeight','height'):
            numeric(plan.get(key),key,1,500)
        numeric(plan.get('age'),'age',18,120)
        if plan.get('sex') not in ('male','female'): raise ValueError('Invalid sex for calorie calculation.')
        text(plan.get('activity'),'activity',True,500)
        day(plan.get('deadline'))
        for key in ('summary','method','sourceURL'): text(plan.get(key,''),key)
    if goals.get('deadline'): day(goals['deadline'])
    if goals.get('note'): text(goals['note'],'goal note')
    data.setdefault('activities', [])
    data.setdefault('practices', [])
    data.setdefault('pianoLearning', [])
    data.setdefault('pianoFocus', {})
    if not isinstance(data['pianoFocus'],dict): raise ValueError('Invalid current piano focus.')
    if data['pianoFocus']:
        text(data['pianoFocus'].get('piece'),'current piece',True,500)
        validate_next_move(data['pianoFocus'].get('nextMove'))
    for group in ('meals','measurements','reflections','activities','practices','pianoLearning'):
        if not isinstance(data.get(group),list) or len(data[group])>10000:
            raise ValueError(f'Invalid {group}.')
        seen=set()
        for item in data[group]:
            if not isinstance(item,dict): raise ValueError(f'Invalid {group} entry.')
            day(item.get('date'))
            identity=item.get('id') if group in ('meals','activities','practices','pianoLearning') else item['date']
            text(identity,'entry identity',True,500)
            if identity in seen: raise ValueError(f'Duplicate {group} identity: {identity}.')
            seen.add(identity)
            if group=='meals':
                text(item.get('title'),'meal title',True,500)
                text(item.get('description',''),'description')
                for key in ('analysis','assumptions'): text(item.get(key,''),key)
                if item.get('time') and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',item['time']): raise ValueError('Invalid meal time.')
                text(item.get('mealType','Meal'),'meal type',True,100)
                nutrition=item.get('nutrition',{})
                if not isinstance(nutrition,dict) or any(k not in KEYS for k in nutrition): raise ValueError('Invalid nutrition keys.')
                for key,n in nutrition.items():
                    if n is None: continue
                    if not isinstance(n,dict) or n.get('source') not in ('estimate','label','user'): raise ValueError(f'Invalid {key} source.')
                    maximum=20000 if key=='calories' else 2000
                    numeric(n.get('value'),key,0,maximum)
                    low,high=n.get('low',n['value']),n.get('high',n['value'])
                    numeric(low,key+' low',0,maximum);numeric(high,key+' high',0,maximum)
                    if not low<=n['value']<=high: raise ValueError(f'Invalid {key} range.')
                photos=item.get('photos',[])
                if not isinstance(photos,list) or len(photos)>4: raise ValueError('Invalid meal photos.')
                for photo in photos:
                    if not isinstance(photo,dict) or not re.fullmatch(r'photos/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp)',photo.get('path',''),re.I): raise ValueError('Invalid local photo path.')
                    text(photo.get('alt',''),'photo description',False,500)
                suggestions(item.get('suggestions',[]))
            elif group=='pianoLearning':
                text(item.get('title'),'learning title',True,500)
                text(item.get('piece',''),'piece',False,500)
                text(item.get('learned'),'what was learned',True)
                for key in ('tried','outcome'): text(item.get(key,''),key)
                if item.get('scoreURL'): validate_url(item['scoreURL'])
                if item.get('practiceMinutes') is not None: numeric(item['practiceMinutes'],'practice time',1,1440)
                help_items=item.get('help',[])
                if not isinstance(help_items,list) or len(help_items)>30: raise ValueError('Invalid learning sources.')
                for help_item in help_items:
                    if not isinstance(help_item,dict): raise ValueError('Invalid learning source.')
                    for key in ('title','tip'): text(help_item.get(key),key,True)
                    for key in ('type','contributor'): text(help_item.get(key,''),key,False,500)
                    if help_item.get('url'): validate_url(help_item['url'])
                    if help_item.get('evidence','reported') not in ('reported','verified'): raise ValueError('Invalid source evidence.')
                validate_next_move(item.get('nextMove'))
            elif group=='practices':
                text(item.get('title'),'recording title',True,500)
                if not re.fullmatch(r'[A-Za-z0-9_-]{11}',item.get('videoId','')): raise ValueError('Invalid YouTube video ID.')
                if item.get('kind') not in ('practice','reference'): raise ValueError('Invalid recording kind.')
                for key in ('piece','focus','context'): text(item.get(key,''),key)
                if item.get('practiceMinutes') is not None: numeric(item['practiceMinutes'],'practice time',1,1440)
                if item.get('durationSeconds') is not None: numeric(item['durationSeconds'],'video duration',1,86400)
                review=item.get('review')
                if review is not None:
                    if not isinstance(review,dict) or review.get('status') not in ('pending','visual-only','complete'): raise ValueError('Invalid review status.')
                    text(review.get('scope'),'review scope',True)
                    text(review.get('summary',''),'review summary')
                    observations=review.get('observations',[])
                    if not isinstance(observations,list) or len(observations)>30: raise ValueError('Invalid review observations.')
                    for observation in observations:
                        text(observation.get('detail'),'observation',True)
                        if observation.get('seconds') is not None: numeric(observation['seconds'],'timestamp',0,item.get('durationSeconds',86400))
                plan=item.get('nextPractice')
                if plan is not None:
                    if not isinstance(plan,dict): raise ValueError('Invalid practice plan.')
                    text(plan.get('priority'),'next priority',True,500)
                    text(plan.get('success'),'success check',True)
                    text(plan.get('study',''),'study next')
                    steps=plan.get('steps',[])
                    if not isinstance(steps,list) or len(steps)>10: raise ValueError('Invalid practice steps.')
                    for step in steps:
                        text(step.get('title'),'step title',True,500)
                        text(step.get('detail'),'step detail',True)
                        if step.get('minutes') is not None: numeric(step['minutes'],'step time',1,1440)
            elif group=='activities':
                text(item.get('title'),'exercise title',True,500)
                if item.get('minutes') is not None: numeric(item['minutes'],'exercise minutes',1,1440)
                if item.get('minutes') is None and item.get('caloriesBurned') is None: raise ValueError('Supply exercise duration or reported calorie burn.')
                if item.get('caloriesBurned') is not None:
                    numeric(item['caloriesBurned'],'exercise calories',0,20000)
                    if item.get('source') not in ('device','estimate','user'): raise ValueError('Invalid exercise calorie source.')
                text(item.get('notes',''),'exercise notes')
            elif group=='measurements':
                if item.get('weight') is not None: numeric(item['weight'],'weight',1,500)
                if item.get('waist') is not None: numeric(item['waist'],'waist',1,300)
            else:
                text(item.get('summary',''),'reflection summary')
                text(item.get('question',''),'reflection question')
                suggestions(item.get('suggestions',[]))
    return data

def read(path=JOURNAL):
    return validate(json.loads(path.read_text())) if path.exists() else blank()

def merge(data, kind, record):
    # A correction uses the existing meal id/date; it replaces, never double-counts.
    if kind=='goals': data['goals'].update(record)
    elif kind=='pianoFocus': data['pianoFocus']=record
    else:
        identity='id' if kind in ('meals','activities','practices','pianoLearning') else 'date'
        rows=data[kind]
        existing=next((i for i,row in enumerate(rows) if row.get(identity)==record.get(identity)),None)
        if existing is None: rows.append(record)
        else: rows[existing]=record
    data['updatedAt']=datetime.now(timezone.utc).isoformat()
    return validate(data)

def write(data, path=JOURNAL):
    validate(data)
    path.parent.mkdir(parents=True,exist_ok=True)
    temporary=path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
    os.replace(temporary,path)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('kind',choices=['meals','measurements','reflections','goals','activities','practices','pianoLearning','pianoFocus','validate'])
    parser.add_argument('input',nargs='?',help='JSON file; omit to read a record from stdin')
    args=parser.parse_args()
    data=read()
    if args.kind!='validate':
        record=json.loads(Path(args.input).read_text() if args.input else sys.stdin.read())
        if not isinstance(record,dict): raise ValueError('Expected a JSON object.')
        write(merge(data,args.kind,record))
    print(f'Journal valid: {len(data["meals"])} meals, {len(data["measurements"])} measurements.')

if __name__=='__main__':
    try: main()
    except (ValueError,TypeError,OSError) as error:
        print(str(error),file=sys.stderr)
        sys.exit(1)
