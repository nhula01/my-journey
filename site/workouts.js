'use strict';
const Workouts = (() => {
  const start = '2026-10-12';
  const strengthURL = 'https://www.nhs.uk/live-well/exercise/strength-exercises/';
  const videoURL = 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/';
  const exercises = {
    walk: {title:'Brisk walk',dose:'15 minutes',steps:['Start with a few easy minutes, then pick up the pace.','Use a pace where you can talk but would find singing difficult.','Finish with a few slower minutes. You can split the walk into shorter outings.'],url:'https://www.cdc.gov/physical-activity-basics/measuring/index.html',link:'Walking pace guide · CDC'},
    warmup: {title:'Easy warm-up',dose:'5 minutes',steps:['Walk slowly or march gently, then gradually increase your pace.','Move your shoulders and arms comfortably before the strength exercises.'],url:videoURL,link:'Watch warm-up video · NHS'},
    chair: {title:'Chair sit-to-stand',dose:'1 set · 5–8 repetitions',steps:['Use a firm, stable chair; feet about hip-width apart.','Lean forward slightly and rise through your legs.','Lower slowly back to the seat. Use your hands if needed.'],image:'STRENGTH_EXERCISES-_Sit-to-stand',alt:'NHS illustration showing sitting, rising from a chair and standing.',url:videoURL,link:'Watch sit-to-stand video · NHS'},
    push: {title:'Wall push-up',dose:'1 set · 5–10 repetitions',steps:['Place your palms on a wall at chest height.','Keep your body straight while bending your elbows to approach the wall.','Press away slowly. Stand closer to make it easier.'],image:'STRENGTH_EXERCISES-_wall_press-up',alt:'NHS illustration of a wall push-up with hands at chest height.',url:videoURL,link:'Watch standing press-up video · NHS'},
    calf: {title:'Supported calf raise',dose:'1 set · 8–10 repetitions',steps:['Hold a stable chair for balance.','Lift both heels, pause briefly, then lower with control.'],image:'STRENGTH_EXERCISES-_calf-raises',alt:'NHS illustration showing heels flat and raised while holding a chair.',url:strengthURL,link:'View calf-raise demonstration · NHS'},
    curl: {title:'Light biceps curl',dose:'1 set · 8 repetitions',steps:['Use light dumbbells or two small filled water bottles.','Keep elbows beside your body; curl up, then lower slowly.'],image:'STRENGTH_EXERCISES-_Bicep_curls',alt:'NHS illustration of the start, lift and lowering of a biceps curl.',url:strengthURL,link:'View curl demonstration · NHS'},
    easy: {title:'Comfortable walk',dose:'20 minutes · optional',steps:['Choose a relaxed pace and an easy route.','Keep this a lighter day. Shorten it or rest if you need recovery.'],url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',link:'Activity guidance · CDC'},
    rest: {title:'Recovery day',dose:'Rest · optional easy movement',steps:['Take a break from strength training.','An easy stroll is optional if you feel fresh.'],url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',link:'Activity guidance · CDC'}
  };
  const plans = [
    {title:'Recovery',ids:['rest']},
    {title:'Walk + strength',ids:['walk','warmup','chair','push','calf','curl']},
    {title:'Walking',ids:['walk']},
    {title:'Walking',ids:['walk']},
    {title:'Walk + strength',ids:['walk','warmup','chair','push','calf','curl']},
    {title:'Walking',ids:['walk']},
    {title:'Easy movement',ids:['easy']}
  ];
  const el = (tag,text,cls) => {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const addDays = (date,days) => {const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
  const weekday = date => new Date(date+'T12:00:00Z').getUTCDay();
  const label = (date,options) => new Date(date+'T12:00:00Z').toLocaleDateString(undefined,{...options,timeZone:'UTC'});
  const key = date => `my-journey-workout-v1:${date}`;
  let selected, lastDashboardDay, memory={}, opened={}, storageWorks=true;
  function read(date) {if(!storageWorks)return memory[date]||{};try {const data=JSON.parse(localStorage.getItem(key(date))||'{}');return data&&typeof data==='object'&&!Array.isArray(data)?data:{};}catch {storageWorks=false;return memory[date]||{};}}
  function save(date,data) {memory[date]=data;try{localStorage.setItem(key(date),JSON.stringify(data));}catch{storageWorks=false;}}
  function render(dashboardDay) {
    const box=document.getElementById('workout-plan');if(!box)return;
    if(!selected||dashboardDay!==lastDashboardDay){selected=dashboardDay;lastDashboardDay=dashboardDay;}
    box.replaceChildren();
    box.append(el('p','YOUR WEEKLY MOVEMENT','eyebrow'),el('h2','A little stronger, day by day.'));
    box.append(el('p','Starter plan based on your walking and short lifting sessions. Assumes no movement limitations and a home setup with a stable chair, wall and light bottles. Start with one easy set; rest 60–90 seconds between exercises.','workout-intro'));
    const toolbar=el('div',undefined,'workout-toolbar');
    const back=el('button','← Previous week','secondary'), next=el('button','Next week →','secondary');
    back.disabled=addDays(selected,-7)<start;
    back.onclick=()=>{selected=addDays(selected,-7);render(lastDashboardDay);};next.onclick=()=>{selected=addDays(selected,7);render(lastDashboardDay);};
    toolbar.append(back,el('span',label(selected,{month:'long',year:'numeric'})),next);box.append(toolbar);
    const week=el('div',undefined,'workout-week');const monday=addDays(selected,-((weekday(selected)+6)%7));
    for(let i=0;i<7;i++) {
      const date=addDays(monday,i),plan=plans[weekday(date)],button=el('button',undefined,'workout-day');
      button.disabled=date<start;button.setAttribute('aria-pressed',String(date===selected));
      const count=plan.ids.filter(id=>read(date)[id]===true).length;
      button.append(el('span',label(date,{weekday:'short',day:'numeric'})),el('strong',plan.title),el('small',date<start?'Before plan':`${count}/${plan.ids.length} checked`));
      button.onclick=()=>{selected=date;render(lastDashboardDay);};week.append(button);
    }
    box.append(week);
    if(selected<start){box.append(el('p','This plan starts October 12, 2026. No workouts have been added to earlier days.'));const jump=el('button','Open starter week','secondary');jump.onclick=()=>{selected=start;render(lastDashboardDay);};box.append(jump);return;}
    const plan=plans[weekday(selected)],checks=read(selected),heading=el('div',undefined,'workout-heading');
    const count=plan.ids.filter(id=>checks[id]===true).length;
    heading.append(el('h3',`${label(selected,{weekday:'long',month:'short',day:'numeric'})} · ${plan.title}`),el('span',`${count} of ${plan.ids.length} checked`,'muted'));box.append(heading);
    const progress=el('progress');progress.max=plan.ids.length;progress.value=count;progress.setAttribute('aria-label','Workout checklist progress');box.append(progress);
    const list=el('div',undefined,'workout-list');
    for(const id of plan.ids) {
      const item=exercises[id],row=el('article',undefined,'workout-item'),line=el('label',undefined,'workout-check');
      const input=el('input');input.type='checkbox';input.id=`workout-${id}`;input.checked=checks[id]===true;input.disabled=selected>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});
      input.onchange=()=>{checks[id]=input.checked;save(selected,checks);render(lastDashboardDay);document.getElementById(`workout-${id}`).focus();};
      const title=el('span');title.append(el('strong',item.title),el('small',item.dose));line.append(input,title);row.append(line);
      const demo=el('details',undefined,'workout-demo');demo.open=opened[`${selected}:${id}`]===true;const demoKey=`${selected}:${id}`;demo.ontoggle=()=>{opened[demoKey]=demo.open;};demo.append(el('summary','Show demonstration & instructions'));
      if(item.image){const image=el('img');image.src=`https://assets.nhs.uk/nhsuk-cms/images/${item.image}.width-320.jpg`;image.alt=item.alt;image.loading='lazy';image.onerror=()=>{image.remove();};demo.append(image,el('small','Illustration: NHS','muted'));}
      const steps=el('ol');item.steps.forEach(step=>steps.append(el('li',step)));demo.append(steps);
      const link=el('a',item.link+' ↗');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';demo.append(link);row.append(demo);list.append(row);
    }
    box.append(list);
    const note=el('p',storageWorks?'Checkmarks stay in this browser on this device. Report completed sessions in chat to add them to your exercise journal.':'Browser storage is unavailable; checkmarks last only for this page session. Report completed sessions in chat to save them.','muted');note.setAttribute('role','status');box.append(note);
    if(inputFuture())box.append(el('p','Future workouts are a preview. Check them off on the day.','muted'));
    box.append(el('p','This starter week has 75 minutes of brisk walking plus optional easy movement. Build gradually toward 150 moderate minutes per week and strength work for all major muscle groups on at least two days. Add a suitable pulling/back exercise once your equipment is confirmed. Keep repetitions controlled and stop if an exercise hurts.','workout-guidance'));
    const source=el('a','Weekly activity guidance · CDC ↗');source.href='https://www.cdc.gov/physical-activity-basics/guidelines/adults.html';source.target='_blank';source.rel='noopener noreferrer';box.append(source);
    function inputFuture(){return selected>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});}
  }
  return {render};
})();
