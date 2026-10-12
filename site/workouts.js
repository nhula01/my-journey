'use strict';
const Workouts = (() => {
  const D=WorkoutData;
  const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const addDays=(date,n)=>{const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);};
  const weekday=date=>new Date(date+'T12:00:00Z').getUTCDay();
  const label=(date,options)=>new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{...options,timeZone:'UTC'});
  const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});
  let selected,lastDashboardDay,renderedSettings,sets=3,cardioLevel=0,storageWorks=true,memory={},goalData={},openExercise=null,restEnd=null,restTimer=null;
  function read(key){if(key in memory)return memory[key];try{const value=JSON.parse(localStorage.getItem(key)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}catch{storageWorks=false;return {};}}
  function save(key,value){memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{storageWorks=false;}}
  const prefs=read('my-journey-workout-settings-v3');sets=prefs.sets===2?2:3;cardioLevel=[0,1,2].includes(prefs.cardioLevel)?prefs.cardioLevel:0;
  const checkKey=date=>`my-journey-workout-v3:${date}:${sets}:${cardioLevel}`;
  function link(title,url){const a=el('a',title);a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
  function stopTimer(){if(restTimer)clearInterval(restTimer);restTimer=null;restEnd=null;}
  function timerBox(box){const timer=el('div',undefined,'rest-clock');timer.id='workout-rest-clock';timer.hidden=true;const text=el('span');text.setAttribute('role','status');const stop=el('button','Stop timer','secondary');stop.onclick=()=>{stopTimer();timer.hidden=true;};timer.append(text,stop);box.append(timer);}
  function startRest(seconds){stopTimer();const timer=document.getElementById('workout-rest-clock');timer.hidden=false;restEnd=Date.now()+seconds*1000;const update=()=>{const remaining=Math.max(0,Math.ceil((restEnd-Date.now())/1000));timer.querySelector('span').textContent=remaining?`Rest · ${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')} remaining`:'Rest finished. Continue when you feel ready.';if(!remaining){clearInterval(restTimer);restTimer=null;}};update();restTimer=setInterval(update,500);}
  function settings(box){
    const controls=el('div',undefined,'workout-settings');
    for(const [name,value,options,update] of [
      ['Strength volume',sets,[[3,'Main plan · 3 / 2 sets'],[2,'Lighter week · 2 sets']],v=>sets=Number(v)],
      ['Walking volume',cardioLevel,[[0,'Start · 60 min/week'],[1,'Build · 90 min/week'],[2,'Goal · 150 min/week']],v=>cardioLevel=Number(v)]
    ]){const lab=el('label',name);const select=el('select');select.setAttribute('aria-label',name);for(const [v,title]of options){const opt=el('option',title);opt.value=v;select.append(opt);}select.value=value;select.onchange=()=>{update(select.value);save('my-journey-workout-settings-v3',{sets,cardioLevel});render(lastDashboardDay,true);};lab.append(select);controls.append(lab);}box.append(controls,el('p','Main plan: 3 sets per big lift and 2 sets per assistance/core exercise. Use the lighter-week option if recovery or performance drops. Increase cardio gradually. A set means a group of repetitions, followed by rest.','workout-setting-note'));
  }
  function research(box){const detail=el('details',undefined,'workout-research');detail.append(el('summary','Why this plan · research & progression'));detail.append(el('p',`Sources reviewed ${D.reviewed}. This is a practical prescription for a regular lifter with one year of experience assembled from the guidance below; the exact exercises and minute allowances are planning choices, not a tested one-hour protocol.`));const items=[
    ['Three full-body days','Lift Monday, Wednesday and Friday, with at least a day without lifting between sessions. Main plan: nine weekly sets each of leg press, chest press and row; six each of hamstring curl, shoulder press and plank. This is a manageable starting volume for your reported experience, with room to review after actual sessions.'],
    ['Make sets challenging, not maximal','Use a load that allows 8–12 controlled repetitions with about 1–3 more clean repetitions possible. Avoid testing a maximum or forcing repetitions after form breaks down.'],
    ['Add reps before weight','Once all sets reach 12 clean reps with 1–3 left on two completed sessions, try the smallest weight increase. Return toward 8 reps. For planks, build clean holds from 10–20 seconds toward 30 seconds while keeping two holds; do not add time if your alignment slips.'],
    ['Stay inside an hour','The main plan allows 41 minutes for six strength exercises, including rests and light rehearsal sets. Five minutes warm-up, five moderate walking, three cool-down and five changing stations bring it to 59 minutes. If equipment queues or video study take longer, shorten the final cardio block. If you would still exceed the hour, omit the last assistance exercise; keep the needed rest and technique work.'],
    ['Increase walking gradually','Start has 60 moderate minutes per week, Build has 90, and Goal has 150. Choose the appropriate level using your current cardio tolerance; do not advance just because time has passed. Easy warm-ups, cool-downs and the optional recovery walk are excluded from those moderate-minute totals.'],
    ['Use actual outcomes','Check off only what you completed. Tell me your weights, reps and how the session felt in chat so the next plan reflects your training. Workout burn is not automatically added to your calorie budget.']
  ];for(const [title,text]of items){const item=el('div');item.append(el('strong',title),el('p',text));detail.append(item);}for(const source of D.sources){const item=el('p');item.append(link(source.title+' ↗',source.url),el('span',` — ${source.detail}`));detail.append(item);}box.append(detail);}
  function renderBodyGoal(box){
    const plan=goalData.trainingPlan;if(!plan)return;
    const goal=el('div',undefined,'body-goal');goal.append(el('p','YOUR BODY-COMPOSITION GOAL','eyebrow'),el('strong',plan.objective));
    const grid=el('div',undefined,'body-goal-grid');
    for(const [title,text]of [
      ['Fat-loss pace','About 0.4–0.7 kg/week as a planning range. Judge the 2–4-week trend, not a single day.'],
      ['Muscle & strength','Maintain working weights and aim to add clean reps or small load increases when recovery allows.'],
      ['Protein',goalData.protein?`${goalData.protein} g/day remains your current starting target. Review it with recovery and dietary intake.`:'Set a protein target with your food plan.'],
      ['Track progress','Record consistent weigh-ins, waist measurements and the loads/reps you complete. A smaller waist with stable strength is useful progress.']
    ]){const card=el('div');card.append(el('strong',title),el('p',text));grid.append(card);}goal.append(grid);
    const deadline=goalData.deadline?label(goalData.deadline,{month:'short',day:'numeric',year:'numeric'}):'your existing deadline';
    goal.append(el('p',`Your saved ${goalData.weight||'current'} kg goal by ${deadline} remains in place. At the ${plan.inputWeight} kg used for this plan, that deadline implies an ambitious pace. For this muscle-focused phase, prioritize a sustainable trend rather than forcing the date.`, 'workout-setting-note'));
    goal.append(el('p',`Your existing ${goalData.calories||'agreed'}-kcal target has not been changed. It was based on a provisional activity estimate excluding deliberate exercise. Review it against hunger, performance, recovery and weight trend; a large deficit can limit muscle growth.`, 'workout-setting-note'));
    box.append(goal);
  }
  function embed(item,container){
    const frame=el('iframe');frame.src=`https://www.youtube.com/embed/${item.video.id}?rel=0&playsinline=1`;
    frame.title=`${item.video.creator}: ${item.video.title}`;frame.allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';container.replaceChildren(frame);
  }
  function render(dashboardDay,force=false,incomingGoals){
    const box=document.getElementById('workout-plan');if(!box)return;if(incomingGoals)goalData=incomingGoals;const settingsKey=`${sets}:${cardioLevel}:${JSON.stringify(goalData)}`;
    if(selected&&dashboardDay===lastDashboardDay&&!force&&renderedSettings===settingsKey)return;
    if(!selected||dashboardDay!==lastDashboardDay){selected=dashboardDay;lastDashboardDay=dashboardDay;}
    stopTimer();openExercise=null;renderedSettings=settingsKey;box.replaceChildren();
    const intro=el('div',undefined,'workout-title');intro.append(el('p','YOUR GYM PLAN','eyebrow'),el('h2','Lose fat. Build a stronger body.'),el('p','For your year of lifting experience: progressive full-body training three days a week, cardio between sessions, and Sunday recovery. Preserve strength while losing fat; muscle growth is possible but depends on your calorie deficit and recovery.','workout-intro'));box.append(intro);
    const overview=el('div',undefined,'training-overview');for(const [v,t]of [['3','Strength days / week'],['60','Minutes maximum / session'],['3','Dedicated cardio days']]){const n=el('div');n.append(el('strong',v),el('span',t));overview.append(n);}box.append(overview);renderBodyGoal(box);settings(box);
    const toolbar=el('div',undefined,'workout-toolbar'),back=el('button','← Previous week','secondary'),next=el('button','Next week →','secondary'),now=el('button','Today','secondary');back.disabled=addDays(selected,-7)<D.start;back.onclick=()=>{selected=addDays(selected,-7);render(lastDashboardDay,true);};next.onclick=()=>{selected=addDays(selected,7);render(lastDashboardDay,true);};now.onclick=()=>{selected=today();render(lastDashboardDay,true);};toolbar.append(back,el('span',label(selected,{month:'long',year:'numeric'})),now,next);box.append(toolbar);
    const week=el('div',undefined,'workout-week'),monday=addDays(selected,-((weekday(selected)+6)%7));
    for(let i=0;i<7;i++){const date=addDays(monday,i),plan=D.days[weekday(date)],button=el('button',undefined,'workout-day');button.disabled=date<D.start;button.setAttribute('aria-pressed',String(date===selected));button.dataset.workoutDate=date;button.append(el('span',label(date,{weekday:'short',day:'numeric'})),el('strong',plan.title),el('small',`${D.total(plan,sets,cardioLevel)} min · ${plan.type}`,'day-type'),el('small','','workout-day-progress'));button.onclick=()=>{selected=date;render(lastDashboardDay,true);};week.append(button);}box.append(week);
    if(selected<D.start){box.append(el('p','The plan starts October 12, 2026. Earlier days keep their actual exercise logs.'));research(box);return;}
    const day=D.days[weekday(selected)],checks=read(checkKey(selected)),total=D.total(day,sets,cardioLevel),heading=el('div',undefined,'workout-heading');heading.append(el('h3',`${label(selected,{weekday:'long',month:'short',day:'numeric'})} · ${day.title}`),el('span',`${total} min planned`,'workout-duration'));box.append(heading);
    const purpose=el('div',undefined,'day-purpose');purpose.append(el('strong',day.focus),el('p',day.why));box.append(purpose);
    const timeline=el('div',undefined,'workout-timeline');
    const blocks=day.type==='Strength'?[[5,'Warm up'],[day.ids.filter(id=>['strength','hold'].includes(D.exercises[id].kind)).reduce((n,id)=>n+D.minutes(id,day.type,sets,cardioLevel),0),'Strength + rests'],[D.minutes('walk',day.type,sets,cardioLevel),'Cardio'],[3,'Cool down'],[5,'Change stations']]:day.type==='Cardio'?[[5,'Warm up'],[D.minutes('walk',day.type,sets,cardioLevel),'Brisk walk'],[3,'Cool down'],[2,'Setup']]:day.ids.length?[[20,'Optional easy walk']]:[[0,'Rest day']];
    blocks.forEach(([n,text])=>{const part=el('div');part.append(el('strong',`${n} min`),el('span',text));timeline.append(part);});box.append(timeline);
    if(day.type==='Strength')box.append(el('p',`${60-total} minutes left for extra setup or watching a demo. If the gym is busy, shorten the final walk; if needed, omit the last assistance exercise to finish by 60 minutes. Don’t rush reps or rests. Time blocks are estimates, not a countdown you must beat.`,'workout-setting-note'));
    const progress=el('progress');progress.id='workout-progress';progress.max=Math.max(1,day.ids.length);progress.setAttribute('aria-label','Workout checklist progress');const countText=el('p','','workout-progress-text');countText.id='workout-count';if(day.ids.length)box.append(progress,countText);timerBox(box);
    const list=el('div',undefined,'workout-list');
    day.ids.forEach((id,index)=>{
      const item=D.exercises[id],workingSets=D.prescribedSets(id,sets),minutes=D.minutes(id,day.type,sets,cardioLevel),card=el('article',undefined,'workout-item');card.dataset.exercise=id;
      const line=el('label',undefined,'workout-check'),check=el('input');check.type='checkbox';check.id=`workout-${id}`;check.checked=checks[id]===true;check.disabled=selected>today();const title=el('span');title.append(el('strong',`${String(index+1).padStart(2,'0')} · ${item.title}`),el('small',item.kind==='strength'?`${workingSets} sets · ${item.reps} per set`:item.kind==='hold'?`${workingSets} holds · ${item.reps} each`:`${minutes} minutes`));line.append(check,title,el('span',`~${minutes} min`,'exercise-time'));card.append(line);
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
