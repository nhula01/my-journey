'use strict';
const Workouts = (() => {
  const start = '2026-10-12';
  const videoURL = 'https://www.nhs.uk/live-well/exercise/strength-and-flex-exercise-plan-how-to-videos/';
  const exercises = {
    walk: {title:'Brisk walk',dose:'15 minutes',steps:['Start with a few easy minutes, then pick up the pace.','Use a pace where you can talk but would find singing difficult.','Finish with a few slower minutes. You can split the walk into shorter outings.'],url:'https://www.cdc.gov/physical-activity-basics/measuring/index.html',link:'Walking pace guide · CDC'},
    warmup: {title:'Easy warm-up',dose:'5 minutes',steps:['Walk slowly or march gently, then gradually increase your pace.','Move your shoulders and arms comfortably before the strength exercises.'],url:videoURL,link:'Watch warm-up video · NHS'},
    legpress: {title:'Seated leg press',dose:'1–2 sets · 8–12 repetitions',steps:['Adjust the seat so your back and hips stay against the pad; feet shoulder-width apart.','Press smoothly without locking your knees.','Return under control through a comfortable range; keep knees aligned with your feet.'],url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/leg-press/vid-20084684',link:'Watch leg-press demonstration · Mayo Clinic'},
    chestpress: {title:'Machine chest press',dose:'1–2 sets · 8–12 repetitions',steps:['Adjust the seat so the handles are near mid-chest. Keep your back against the pad.','Press forward smoothly without locking your elbows.','Return slowly; choose a comfortable range without forcing the shoulders back.'],url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/chest-press/vid-20084687',link:'Watch chest-press demonstration · Mayo Clinic'},
    row: {title:'One-arm dumbbell row',dose:'1–2 sets · 8–12 repetitions per side',steps:['Use a light dumbbell; hinge at your hips with a neutral back and slightly bent knees.','Pull your elbow back beside your torso, keeping your body still.','Lower slowly and repeat on the other side. Ask gym staff to check your setup.'],url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/bent-over-row/vid-20084680',link:'Watch dumbbell-row demonstration · Mayo Clinic'},
    hamstring: {title:'Seated hamstring curl',dose:'1–2 sets · 8–12 repetitions',steps:['Align your knees with the machine pivot; place the lower pad just above your heels.','Secure the thigh pad, then bend your knees to pull the pad down.','Return slowly while keeping your hips against the seat.'],url:'https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/seated-hamstring-curl/vid-20084685',link:'Watch hamstring-curl demonstration · Mayo Clinic'},
    shoulders: {title:'Seated dumbbell shoulder press',dose:'1–2 sets · 8–12 repetitions',steps:['Sit on a bench with back support, feet flat and light dumbbells at shoulder height.','Press upward without arching your lower back.','Lower slowly to a comfortable starting position.'],url:'https://www.acefitness.org/resources/everyone/exercise-library/45/seated-overhead-press/',link:'View shoulder-press demonstration · ACE'},
    plank: {title:'Forearm plank',dose:'1–2 holds · 10–20 seconds',steps:['Place your elbows below your shoulders and brace your torso.','Keep your body aligned without sagging or lifting your hips. Breathe normally.','End the hold before your form slips; shorten the hold if needed.'],url:'https://www.acefitness.org/resources/everyone/exercise-library/32/front-plank/',link:'View plank demonstration · ACE'},
    easy: {title:'Comfortable walk',dose:'20 minutes · optional',steps:['Choose a relaxed pace and an easy route.','Keep this a lighter day. Shorten it or rest if you need recovery.'],url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',link:'Activity guidance · CDC'},
    rest: {title:'Recovery day',dose:'Rest · optional easy movement',steps:['Take a break from strength training.','An easy stroll is optional if you feel fresh.'],url:'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html',link:'Activity guidance · CDC'}
  };
  const roles = {
    warmup: {pattern:'Preparation',muscles:'Whole-body movement',why:'Raise your movement pace gradually and rehearse the range of motion before lifting.',rest:'Easy effort'},
    legpress: {pattern:'Lower-body push',muscles:'Quadriceps · glutes',why:'Train knee and hip extension with a supported setup. This is the main lower-body strength movement.',rest:'90–120 sec'},
    chestpress: {pattern:'Upper-body push',muscles:'Chest · triceps · front shoulders',why:'Build pushing strength; the machine lets you focus on control while learning the movement.',rest:'90–120 sec'},
    row: {pattern:'Upper-body pull',muscles:'Lats · upper back · rear shoulders · biceps',why:'Balance the pressing work with pulling strength. Keep your torso still rather than swinging the weight.',rest:'90–120 sec between sets'},
    hamstring: {pattern:'Knee flexion',muscles:'Hamstrings',why:'Add direct work for the back of the thighs alongside the leg press, which emphasizes the front of the thighs and hips.',rest:'60–90 sec'},
    shoulders: {pattern:'Overhead push',muscles:'Shoulders · triceps',why:'Train controlled overhead strength. It comes after the larger lifts; use a lighter load because pressing muscles have already worked.',rest:'60–90 sec'},
    plank: {pattern:'Core stability',muscles:'Abdominals · trunk stabilizers',why:'Practice keeping the trunk steady while breathing. Short clean holds are more useful than long holds with a sagging back.',rest:'45–60 sec'},
    walk: {pattern:'Aerobic conditioning',muscles:'Cardiovascular focus · legs',why:'Build aerobic fitness at a repeatable pace. On gym days it follows lifting so strength work gets your freshest effort.',rest:'Talk-test pace'},
    easy: {pattern:'Active recovery',muscles:'Light whole-body activity',why:'Keep the movement habit with less effort; this walk is optional and is not counted toward the moderate-intensity target.',rest:'Comfortable conversation'},
    rest: {pattern:'Recovery',muscles:'All trained muscle groups',why:'Leave room for recovery before the next strength session. No hard training is planned today.',rest:'No required workout'}
  };
  const gym = ['warmup','legpress','chestpress','row','hamstring','shoulders','plank','walk'];
  const plans = [
    {title:'Rest & reset',type:'Recovery',duration:'Rest / optional stroll',focus:'Recovery before Monday',why:'A rest day closes the week and gives you a fresh start for Monday. Review how the previous sessions felt; repeat the same loads if they were challenging.',ids:['rest']},
    {title:'Full-body strength',type:'Strength',duration:'40–60 min including walk',focus:'Legs · push · pull · core',why:'Start the week with a repeatable full-body session. Two lifting days fit your current short lifting history without adding hard workouts every day. The same main movements return Thursday so you can practice technique and compare effort.',ids:gym},
    {title:'Aerobic base',type:'Cardio',duration:'15 min',focus:'Cardiorespiratory fitness',why:'Walk at a moderate pace while the muscles trained Monday get a day away from lifting. This adds aerobic work without another demanding strength session.',ids:['walk']},
    {title:'Aerobic base',type:'Cardio',duration:'15 min',focus:'Fitness with manageable fatigue',why:'Keep the cardio habit before Thursday. Stay at the talk-test pace, rather than adding hard intervals that could leave you tired for lifting.',ids:['walk']},
    {title:'Full-body strength',type:'Strength',duration:'40–60 min including walk',focus:'Legs · push · pull · core',why:'Repeat Monday’s movements after two days without lifting those muscles. Repetition builds technique and lets you compare the same loads. Increase only when your form and effort meet the progression rule.',ids:gym},
    {title:'Aerobic base',type:'Cardio',duration:'15 min',focus:'Cardio between strength sessions',why:'Return to moderate walking after Thursday’s lifting. Shorten or ease the walk if leg soreness changes your stride; consistency matters more than forcing the planned minutes.',ids:['walk']},
    {title:'Easy movement',type:'Recovery',duration:'20 min optional',focus:'Low-effort movement',why:'Use a relaxed walk if you feel recovered. Keeping Saturday easy makes room for recovery instead of adding a third hard lifting day immediately.',ids:['easy']}
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
    box.append(el('p','YOUR WEEKLY MOVEMENT','eyebrow'),el('h2','Your training week.'));
    box.append(el('p','A gym starter program for building strength alongside your weight goal. Built from your reported walking and short lifting sessions; your working weights and recovery will guide adjustments.','workout-intro'));
    const overview=el('div',undefined,'training-overview');
    for(const [value,text] of [['2','Full-body sessions / week'],['5','Moderate walking days'],['2','Minimum days without lifting between sessions']]){const card=el('div');card.append(el('strong',value),el('span',text));overview.append(card);}box.append(overview);
    const setup=el('details',undefined,'training-method');setup.open=opened.program===true;setup.ontoggle=()=>{opened.program=setup.open;};setup.append(el('summary','How to use this program & progress'));
    for(const [title,text] of [
      ['Starting volume','For your first two completed strength sessions, do one set per exercise. Add a second set when form is steady and soreness is manageable. A new calendar week does not automatically mean you should advance.'],
      ['Choose your weight','Start light enough to finish 8–12 controlled repetitions with about 2–3 good repetitions still possible. Ask gym staff to show the machine seat, pads and safety settings.'],
      ['Progress one step at a time','When every set reaches 12 repetitions with steady form and 2–3 repetitions left on two completed sessions, try the smallest weight increase and return toward 8 repetitions. For planks, build to 20 seconds with good alignment before adding another hold.'],
      ['Build aerobic volume','Start with 15 minutes on the five walking days (75 minutes/week). If that feels manageable, add 5 minutes to one or two walks at a time toward 30 minutes on each day (150 minutes/week).'],
      ['Adjust to recovery','Keep 60–120 seconds between lifting sets, or longer if needed. Repeat or reduce the load if form slips. Stop an exercise that hurts. Report what you actually completed in chat so the next recommendation uses your real training.']
    ]){const item=el('div');item.append(el('strong',title),el('p',text));setup.append(item);}box.append(setup);
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
      button.append(el('span',label(date,{weekday:'short',day:'numeric'})),el('strong',plan.title),el('small',plan.type,'day-type'),el('small',date<start?'Before plan':`${count}/${plan.ids.length} checked`));
      button.onclick=()=>{selected=date;render(lastDashboardDay);};week.append(button);
    }
    box.append(week);
    if(selected<start){box.append(el('p','This plan starts October 12, 2026. No workouts have been added to earlier days.'));const jump=el('button','Open starter week','secondary');jump.onclick=()=>{selected=start;render(lastDashboardDay);};box.append(jump);return;}
    const plan=plans[weekday(selected)],checks=read(selected),heading=el('div',undefined,'workout-heading');
    const count=plan.ids.filter(id=>checks[id]===true).length;
    heading.append(el('h3',`${label(selected,{weekday:'long',month:'short',day:'numeric'})} · ${plan.title}`),el('span',`${count} of ${plan.ids.length} checked`,'muted'));box.append(heading);
    const purpose=el('div',undefined,'day-purpose');purpose.append(el('p',`${plan.type} · ${plan.duration}`,'eyebrow'),el('strong',plan.focus),el('p',plan.why));box.append(purpose);
    const progress=el('progress');progress.max=plan.ids.length;progress.value=count;progress.setAttribute('aria-label','Workout checklist progress');box.append(progress);
    const list=el('div',undefined,'workout-list');
    for(const id of plan.ids) {
      const item=exercises[id],row=el('article',undefined,'workout-item'),line=el('label',undefined,'workout-check');
      const input=el('input');input.type='checkbox';input.id=`workout-${id}`;input.checked=checks[id]===true;input.disabled=selected>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});
      input.onchange=()=>{checks[id]=input.checked;save(selected,checks);render(lastDashboardDay);document.getElementById(`workout-${id}`).focus();};
      const title=el('span');title.append(el('strong',item.title),el('small',item.dose));line.append(input,title);row.append(line);
      const role=roles[id],meta=el('div',undefined,'exercise-purpose');meta.append(el('span',role.pattern,'exercise-pattern'),el('p',role.muscles,'exercise-muscles'),el('p',role.why),el('small',`Rest / effort: ${role.rest}`));row.append(meta);
      const demo=el('details',undefined,'workout-demo');demo.open=opened[`${selected}:${id}`]===true;const demoKey=`${selected}:${id}`;demo.ontoggle=()=>{opened[demoKey]=demo.open;};demo.append(el('summary','Show demonstration & instructions'));
      const steps=el('ol');item.steps.forEach(step=>steps.append(el('li',step)));demo.append(steps);
      const link=el('a',item.link+' ↗');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';demo.append(link);row.append(demo);list.append(row);
    }
    box.append(list);
    const note=el('p',storageWorks?'Checkmarks stay in this browser on this device. Report completed sessions in chat to add them to your exercise journal.':'Browser storage is unavailable; checkmarks last only for this page session. Report completed sessions in chat to save them.','muted');note.setAttribute('role','status');box.append(note);
    if(inputFuture())box.append(el('p','Future workouts are a preview. Check them off on the day.','muted'));
    box.append(el('p','The schedule is a starting recommendation, not a record of completed training. Review the plan using actual sessions, recovery and weight trends. Workout calories remain separate from your food budget.','workout-guidance'));
    const source=el('a','Weekly activity guidance · CDC ↗');source.href='https://www.cdc.gov/physical-activity-basics/guidelines/adults.html';source.target='_blank';source.rel='noopener noreferrer';box.append(source);const technique=el('a','Strength technique & recovery · Mayo Clinic ↗');technique.href='https://sportsmedicine.mayoclinic.org/news/weight-training-dos-and-donts-of-proper-technique/';technique.target='_blank';technique.rel='noopener noreferrer';technique.className='training-source';box.append(technique);
    function inputFuture(){return selected>new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});}
  }
  return {render};
})();
