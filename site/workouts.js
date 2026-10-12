'use strict';
const Workouts = (() => {
  const D=WorkoutData;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const weekday=date=>new Date(date+'T12:00:00Z').getUTCDay();
  const label=(date,options)=>new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{...options,timeZone:'UTC'});
  const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});
  let selected,lastDashboardDay,renderedSettings,sets=1,cardioLevel=0,storageWorks=true,memory={},openExercise=null,restEnd=null,restTimer=null;
  function read(key){if(key in memory)return memory[key];try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{storageWorks=false;return {};}}
  function save(key,value){memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{storageWorks=false;}}
  const prefs=read('my-journey-workout-settings-v2');sets=prefs.sets===2?2:1;cardioLevel=[0,1,2].includes(prefs.cardioLevel)?prefs.cardioLevel:0;
  const checkKey=date=>`my-journey-workout-v2:${date}:${sets}:${cardioLevel}`;
  function link(title,url){const a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function stopTimer(){if(restTimer)clearInterval(restTimer);restTimer=null;restEnd=null;}
  function timerBox(box){const timer=el('div',undefined,'rest-clock');timer.id='workout-rest-clock';timer.hidden=true;const text=el('span');text.setAttribute('role','status');const stop=el('button','Stop timer','secondary');stop.onclick=()=>{stopTimer();timer.hidden=true;};timer.append(text,stop);box.append(timer);}
  function startRest(seconds){stopTimer();const timer=document.getElementById('workout-rest-clock');timer.hidden=false;restEnd=Date.now()+seconds*1000;const update=()=>{const remaining=Math.max(0,Math.ceil((restEnd-Date.now())/1000));timer.querySelector('span').textContent=remaining?`Rest · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} remaining`:'Rest finished. Continue when you feel ready.';if(!remaining){clearInterval(restTimer);restTimer=null;}};update();restTimer=setInterval(update,500);}
  function settings(box){
    const controls=el('div',undefined,'workout-settings');
    for(const [name,value,options,update] of [
      ['Strength volume',sets,[[1,'Start · 1 set'],[2,'Build · 2 sets']],v=>sets=Number(v)],
      ['Walking volume',cardioLevel,[[0,'Start · 65 min/week'],[1,'Build · 105 min/week'],[2,'Goal · 150 min/week']],v=>cardioLevel=Number(v)]
    ]){const lab=el('label',name);const select=el('select');select.setAttribute('aria-label',name);for(const [v,title]of options){const opt=el('option',title);opt.value=v;select.append(opt);}select.value=value;select.onchange=()=>{update(select.value);save('my-journey-workout-settings-v2',{sets,cardioLevel});render(lastDashboardDay,true);};lab.append(select);controls.append(lab);}box.append(controls,el('p','Start with one set for your first two completed gym sessions. Build only when your form and recovery feel manageable. Changing volume gives you a separate checklist for that prescription.','workout-setting-note'));
  }
  function research(box){const detail=el('details',undefined,'workout-research');detail.append(el('summary','Why this plan · research & progression'));detail.append(el('p',`Sources reviewed ${D.reviewed}. This is a practical starter prescription assembled from the guidance below; the exact exercises and minute allowances are planning choices, not a tested one-hour protocol.`));const items=[
    ['Two full-body days','Train legs, hips, chest, back, shoulders, arms and core on Monday and Thursday. Repeating the movements builds technique and gives at least two days away from lifting between sessions. Machines and free weights both work; equipment choice here favors straightforward setup.'],
    ['Make sets challenging, not maximal','Use a load that allows 8–12 controlled repetitions with about 2–3 more good reps possible. Avoid testing a maximum or forcing repetitions after form breaks down.'],
    ['Add reps before weight','Once all sets reach 12 clean reps with 2–3 left on two completed sessions, try the smallest weight increase. Return toward 8 reps. For planks, build clean holds toward 20 seconds before adding a second hold.'],
    ['Stay inside an hour','The build plan allows 32 minutes for six strength exercises, including rests and light rehearsal sets. Warm-up, cardio, cool-down and five minutes for changing stations bring it to 55–60 minutes. If equipment queues or video study take longer, shorten the final cardio block; keep the rest and technique work.'],
    ['Increase walking gradually','The first week has 65 moderate minutes. Use Build when that feels comfortable, and work toward the 150-minute goal as tolerance improves. Easy warm-ups, cool-downs and the optional recovery walk are excluded from those moderate-minute totals.'],
    ['Use actual outcomes','Check off only what you completed. Tell me your weights, reps and how the session felt in chat so the next plan reflects your training. Workout burn is not automatically added to your calorie budget.']
  ];for(const [title,text]of items){const item=el('div');item.append(el('strong',title),el('p',text));detail.append(item);}for(const source of D.sources){const item=el('p');item.append(link(source.title+' ↗',source.url),el('span',` — ${source.detail}`));detail.append(item);}box.append(detail);}
  function embed(item,container){
    const frame=el('iframe');frame.src=`https://www.youtube.com/embed/${item.video.id}?rel=0&playsinline=1`;
    frame.title=`${item.video.creator}: ${item.video.title}`;frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';container.replaceChildren(frame);
  }
  function render(dashboardDay,force=false){
    const box=document.getElementById('workout-plan');if(!box)return;
    if(selected&&dashboardDay===lastDashboardDay&&!force&&renderedSettings===`${sets}:${cardioLevel}`)return;
    if(!selected||dashboardDay!==lastDashboardDay){selected=dashboardDay;lastDashboardDay=dashboardDay;}
    stopTimer();openExercise=null;renderedSettings=`${sets}:${cardioLevel}`;box.replaceChildren();
    const intro=el('div',undefined,'workout-title');intro.append(el('p','YOUR GYM PLAN','eyebrow'),el('h2','Train with a purpose.'),el('p','Two full-body strength days, steady cardio, and room to recover. Every session fits within an hour; recovery days can be much shorter.','workout-intro'));box.append(intro);
    const overview=el('div',undefined,'training-overview');for(const [v,t]of [['2','Strength days / week'],['60','Minutes maximum / session'],['5','Moderate walking days']]){const n=el('div');n.append(el('strong',v),el('span',t));overview.append(n);}box.append(overview);settings(box);
    const toolbar=el('div',undefined,'workout-toolbar'),back=el('button','← Previous week','secondary'),next=el('button','Next week →','secondary'),now=el('button','Today','secondary');back.disabled=addDays(selected,-7)<D.start;back.onclick=()=>{selected=addDays(selected,-7);render(lastDashboardDay,true);};next.onclick=()=>{selected=addDays(selected,7);render(lastDashboardDay,true);};now.onclick=()=>{selected=today();render(lastDashboardDay,true);};toolbar.append(back,el('span',label(selected,{month:'long',year:'numeric'})),now,next);box.append(toolbar);
    const week=el('div',undefined,'workout-week'),monday=addDays(selected,-((weekday(selected)+6)%7));
    for(let i=0;i<7;i++){const date=addDays(monday,i),plan=D.days[weekday(date)],button=el('button',undefined,'workout-day');button.disabled=date<D.start;button.setAttribute('aria-pressed',String(date===selected));button.dataset.workoutDate=date;button.append(el('span',label(date,{weekday:'short',day:'numeric'})),el('strong',plan.title),el('small',`${D.total(plan,sets,cardioLevel)} min · ${plan.type}`,'day-type'),el('small','','workout-day-progress'));button.onclick=()=>{selected=date;render(lastDashboardDay,true);};week.append(button);}box.append(week);
    if(selected<D.start){box.append(el('p','The plan starts October 12, 2026. Earlier days keep their actual exercise logs.'));research(box);return;}
    const day=D.days[weekday(selected)],checks=read(checkKey(selected)),total=D.total(day,sets,cardioLevel),heading=el('div',undefined,'workout-heading');heading.append(el('h3',`${label(selected,{weekday:'long',month:'short',day:'numeric'})} · ${day.title}`),el('span',`${total} min planned`,'workout-duration'));box.append(heading);
    const purpose=el('div',undefined,'day-purpose');purpose.append(el('strong',day.focus),el('p',day.why));box.append(purpose);
    const timeline=el('div',undefined,'workout-timeline');
    const blocks=day.type==='Strength'?[[5,'Warm up'],[day.ids.filter(id=>['strength','hold'].includes(D.exercises[id].kind)).reduce((n,id)=>n+D.minutes(id,day.type,sets,cardioLevel),0),'Strength + rests'],[D.minutes('walk',day.type,sets,cardioLevel),'Cardio'],[3,'Cool down'],[5,'Change stations']]:day.type==='Cardio'?[[5,'Warm up'],[D.minutes('walk',day.type,sets,cardioLevel),'Brisk walk'],[3,'Cool down'],[2,'Setup']]:day.ids.length?[[20,'Optional easy walk']]:[[0,'Rest day']];
    blocks.forEach(([n,text])=>{const part=el('div');part.append(el('strong',`${n} min`),el('span',text));timeline.append(part);});box.append(timeline);
    if(day.type==='Strength')box.append(el('p',`${60-total} minutes left for extra setup or watching a demo. If the gym is busy, shorten the final walk to finish by 60 minutes; don’t rush reps or rests. Time blocks are estimates, not a countdown you must beat.`,'workout-setting-note'));
    const progress=el('progress');progress.id='workout-progress';progress.max=Math.max(1,day.ids.length);progress.setAttribute('aria-label','Workout checklist progress');const countText=el('p','','workout-progress-text');countText.id='workout-count';if(day.ids.length)box.append(progress,countText);timerBox(box);
    const list=el('div',undefined,'workout-list');
    day.ids.forEach((id,index)=>{
      const item=D.exercises[id],minutes=D.minutes(id,day.type,sets,cardioLevel),card=el('article',undefined,'workout-item');card.dataset.exercise=id;
      const line=el('label',undefined,'workout-check'),check=el('input');check.type='checkbox';check.id=`workout-${id}`;check.checked=checks[id]===true;check.disabled=selected>today();const title=el('span');title.append(el('strong',`${String(index+1).padStart(2,'0')} · ${item.title}`),el('small',item.kind==='strength'?`${sets} set${sets===1?'':'s'} × ${item.reps}`:item.kind==='hold'?`${sets} hold${sets===1?'':'s'} × ${item.reps}`:`${minutes} minutes`));line.append(check,title,el('span',`~${minutes} min`,'exercise-time'));card.append(line);
      check.onchange=()=>{checks[id]=check.checked;save(checkKey(selected),checks);updateProgress();};
      const body=el('div',undefined,'exercise-body'),map=el('figure',undefined,'muscle-figure'),image=el('img');image.src=`workout-muscles/${id}.svg`;image.alt=item.imageAlt;image.width=340;image.height=330;image.loading='lazy';map.append(image,el('figcaption','Coral: focus · green: assisting regions'));body.append(map);
      const info=el('div',undefined,'exercise-info');info.append(el('span',item.pattern,'exercise-pattern'),el('p',item.primary,'exercise-muscles'),el('p',`Also involved: ${item.secondary}`,'exercise-secondary'),el('p',item.why));
      const actions=el('div',undefined,'exercise-actions'),watch=el('button','▶ Watch demonstration','demo-button');watch.setAttribute('aria-expanded','false');watch.setAttribute('aria-controls',`demo-${id}`);actions.append(watch);
      if(item.rest){const rest=el('button',`Rest ${item.rest}s`,'secondary');rest.onclick=()=>startRest(item.rest);actions.append(rest);}info.append(actions);body.append(info);card.append(body);
      const demo=el('div',undefined,'exercise-demo-panel');demo.id=`demo-${id}`;demo.hidden=true;const video=el('div',undefined,'exercise-video');demo.append(video,el('p',`${item.video.title} · ${item.video.creator}`,'video-credit'));const steps=el('ol');item.steps.forEach(step=>steps.append(el('li',step)));demo.append(steps);const source=el('details',undefined,'exercise-source');source.append(el('summary','Technique source'),link('Read the source ↗',item.source));demo.append(source);card.append(demo);
      watch.onclick=()=>{const opening=demo.hidden;if(openExercise){openExercise.panel.hidden=true;openExercise.video.replaceChildren();openExercise.button.setAttribute('aria-expanded','false');openExercise.button.textContent='▶ Watch demonstration';}openExercise=null;if(opening){demo.hidden=false;watch.setAttribute('aria-expanded','true');watch.textContent='Close demonstration';embed(item,video);openExercise={panel:demo,video,button:watch};}};
      list.append(card);
    });box.append(list);
    if(!day.ids.length)box.append(el('p','No exercises to check off today. Rest, or take an easy stroll if you want.','rest-day-note'));
    const persistence=el('p','','workout-setting-note');persistence.id='workout-storage-note';persistence.setAttribute('role','status');box.append(persistence);
    if(selected>today())box.append(el('p','Preview only · check off future sessions on the day.','workout-setting-note'));
    research(box);updateProgress();
    function updateProgress(){const current=read(checkKey(selected)),count=day.ids.filter(id=>current[id]===true).length;progress.value=count;countText.textContent=`${count} of ${day.ids.length} activities checked`;for(const button of week.children){const date=button.dataset.workoutDate,p=D.days[weekday(date)],c=read(checkKey(date));button.querySelector('.workout-day-progress').textContent=date<D.start?'Before plan':p.ids.length?`${p.ids.filter(id=>c[id]===true).length}/${p.ids.length} checked`:'No workout required';}persistence.textContent=storageWorks?'Checkmarks save in this browser on this device. Report completed sessions in chat to save them in your exercise journal.':'Browser storage is unavailable. Checkmarks last for this page session; report workouts in chat to save them.';}
  }
  return {render};
})();
