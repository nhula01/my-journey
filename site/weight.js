'use strict';
const $ = selector => document.querySelector(selector);
const N = Nutrition;
const local = ['localhost','127.0.0.1'].includes(location.hostname);
const journalURL = local ? '/api/journal' : 'journal.json';
let journal = {version:1,updatedAt:null,goals:{},meals:[],measurements:[],reflections:[]};
let loading = false;
const today = () => new Date().toLocaleDateString('en-CA',{timeZone:'America/Phoenix'});
const node = (tag,text,cls) => {const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
const fmt = value => value === null || value === undefined ? '—' : Math.round(value).toLocaleString();
const decimal = value => value === null || value === undefined ? '—' : Number(value.toFixed(1)).toString();
const status = message => {$('#status').textContent=message;};
function rangeText(total,unit) {
  if(total.value===null) return 'Awaiting food analysis';
  if(total.estimated && total.low!==total.high) return `Estimated range: ${fmt(total.low)}–${fmt(total.high)} ${unit}`;
  return total.estimated?'Estimated from your food log':'From recorded portions and nutrition';
}
function empty(container,title,body) {const box=node('div',undefined,'dashboard-empty');box.append(node('strong',title),node('span',body));container.append(box);}
function stat(value,label,note) {const e=node('div',undefined,'stat');e.append(node('strong',value),node('span',label));if(note)e.append(node('br'),node('small',note));return e;}
function render() {
  const day=$('#day').value;
  const meals=journal.meals.filter(m=>m.date===day).sort((a,b)=>(a.time||'').localeCompare(b.time||'')||a.id.localeCompare(b.id));
  const totals=N.daily(journal.meals,day),cal=totals.calories;
  const goals=journal.goals||{};
  renderEnergyPlan(goals,day);
  const exercise=$('#exercise-summary');exercise.replaceChildren();
  const sessions=(journal.activities||[]).filter(a=>a.date===day);
  const exerciseMinutes=sessions.reduce((sum,a)=>sum+(Number.isFinite(a.minutes)?a.minutes:0),0);
  const unknownDuration=sessions.some(a=>!Number.isFinite(a.minutes));
  exercise.append(node('p','EXERCISE TODAY','eyebrow'),node('strong',sessions.length?`${exerciseMinutes} minutes logged${unknownDuration?' + activity with unknown duration':''}`:'No exercise logged yet'));
  sessions.forEach(a=>exercise.append(node('p',`${a.title} · ${Number.isFinite(a.minutes)?`${a.minutes} min`:'duration not provided'}${Number.isFinite(a.caloriesBurned)?` · ${a.source==='estimate'?'≈ ':''}${fmt(a.caloriesBurned)} kcal (${a.source})`:''}`)));
  exercise.append(node('p','Log workouts here in chat. Exercise is recorded separately; burn estimates are not automatically added to your food budget.','muted'));
  const calorieValue=$('#calorie-value');calorieValue.replaceChildren(node('span',`${cal.estimated?'≈ ':''}${fmt(cal.value)}`,'energy-number'),node('span','kcal logged'));
  $('#calorie-range').textContent=rangeText(cal,'kcal');
  const b=N.budget(cal.value,goals.calories);
  $('#calorie-budget').textContent=goals.calories ? `Daily target: ${fmt(goals.calories)} kcal${b ? b.remaining>=0 ? ` · ${fmt(b.remaining)} kcal remaining` : ` · ${fmt(-b.remaining)} kcal above target` : ''}` : 'Daily target not set';
  $('#ring-value').textContent=b?`${fmt(b.percent)}%`:'—';
  $('#ring-label').textContent=b?'of daily target':goals.calories?'awaiting meals':'target unset';
  $('#calorie-ring').style.setProperty('--progress',`${b?Math.min(b.percent,100)*3.6:0}deg`);
  $('#calorie-ring').setAttribute('aria-label',b?`${fmt(b.percent)} percent of calorie target`:'No calorie progress available');
  $('#nutrition-coverage').textContent=meals.length ? `${meals.length} meal${meals.length===1?'':'s'} logged · Calories available for ${cal.known}/${meals.length} · ${cal.known<meals.length?'Partial total; some meals await analysis.':'Total includes only logged food.'}` : 'No food logged for this day. Share your first meal here in the project.';
  const macros=$('#macros');macros.replaceChildren();
  [['protein','PROTEIN'],['carbs','CARBS'],['fat','FAT'],['fiber','FIBER']].forEach(([key,label])=>{
    const t=totals[key],goal=goals[key],card=node('article',undefined,'macro-card');
    const amount=node('div',`${t.estimated?'≈ ':''}${fmt(t.value)}`,'macro-value');amount.append(node('small',' g'));
    const track=node('div',undefined,'macro-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label',`${label} daily target`);if(goal){track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(goal));if(t.value!==null){track.setAttribute('aria-valuenow',String(Math.min(goal,t.value)));track.setAttribute('aria-valuetext',`${decimal(t.value)} g logged of ${fmt(goal)} g target`);}}const fill=node('span');fill.style.width=`${goal&&t.value!==null?Math.min(100,t.value/goal*100):0}%`;track.append(fill);
    card.append(node('p',label,'eyebrow'),amount,track,node('p',goal?`Target ${fmt(goal)} g`:'Target not set','muted'),node('p',rangeText(t,'g'),'muted'));
    if(goal&&t.value!==null){const remaining=goal-t.value;card.append(node('p',`${t.estimated?'≈ ':''}${decimal(Math.abs(remaining))} g ${remaining>=0?'remaining':'above starting target'}`,'macro-remaining'));}
    if(meals.length && t.known<meals.length)card.append(node('p',`Available for ${t.known}/${meals.length} meals`,'muted'));
    macros.append(card);
  });
  const macroNote=$('#macro-target-note');if(macroNote)macroNote.textContent=goals.macroPlan?'Starting targets for your calorie budget and lifting. Protein supports training; carb and fat targets are flexible. Aim for fiber gradually. Fiber is included in total carbs. Targets can be adjusted as your logs build up.':'';
  const w=N.weightSummary(journal.measurements,day);
  const stats=$('#supporting-stats');stats.replaceChildren(
    stat(w.latest?`${decimal(w.latest.weight)} kg`:'—','LATEST WEIGHT',w.latest?.date),
    stat(w.average===null?'—':`${decimal(w.average)} kg`,'7-DAY AVERAGE',w.count?`${w.count} recorded weigh-in${w.count===1?'':'s'}`:'Awaiting measurements'),
    stat(w.change===null?'—':`${w.change>0?'+':''}${decimal(w.change)} kg`,'CHANGE SINCE FIRST RECORD'),
    stat(goals.weight?`${decimal(goals.weight)} kg`:'—','GOAL WEIGHT',goals.weight?'Provisional goal':'Set your goal here in chat'),
    stat(w.latest&&goals.height?decimal(w.latest.weight/(goals.height/100)**2):'—','BMI',goals.height?`At ${goals.height} cm · adult screening measure`:'Awaiting height'),
    stat(goals.weight&&w.latest?`${decimal(Math.max(0,w.latest.weight-goals.weight))} kg`:'—','TO YOUR GOAL')
  );
  const goal=$('#weight-goal');goal.replaceChildren();
  if(goals.weight&&goals.deadline){
    const deadline=new Date(goals.deadline+'T12:00:00Z').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
    const days=Math.round((Date.parse(goals.deadline)-Date.parse(today()))/86400000);
    goal.append(node('p','YOUR SHORT-TERM GOAL','eyebrow'),node('h3',`${decimal(goals.weight)} kg by ${deadline}`),node('p',days>=0?`${days} days until your goal date. We’ll track the trend as you log meals and weigh-ins.`:'Your goal date has passed. Share your latest weight and next goal here in chat.'));
    if(goals.height){const cutoff=25*(goals.height/100)**2;goal.append(node('p',`At ${goals.height} cm, the adult BMI overweight cutoff (25) corresponds to ${decimal(cutoff)} kg. The working goal is just below that cutoff; BMI is a screening measure for adults 20 and older.`,'muted'));}
    const info=node('a','About adult BMI categories');info.href='https://www.cdc.gov/bmi/adult-calculator/bmi-categories.html';info.className='muted';goal.append(info);
  }else goal.append(node('p','Share your weight goal here in chat to track it alongside your nutrition.','muted'));
  const log=$('#food-log');log.replaceChildren();$('#meal-count').textContent=`${meals.length} meal${meals.length===1?'':'s'}`;
  if(!meals.length)empty(log,'Your next meal starts here.','Send a photo or describe what you ate in the project’s chat. Your analyzed meals will appear here.');
  meals.forEach(m=>{
    const card=node('article',undefined,'food-card');const top=node('div',undefined,'meal-top');
    top.append(node('span',[m.mealType||'Meal',m.time].filter(Boolean).join(' · '),'eyebrow'));
    const estimated=N.KEYS.some(key=>m.nutrition?.[key]?.source==='estimate');top.append(node('span',estimated?'ESTIMATED':'RECORDED','badge'));
    card.append(top,node('h3',m.title),node('p',m.description));
    const photos=node('div',undefined,'photos');(m.photos||[]).forEach(p=>{const img=node('img');img.alt=p.alt||m.title;img.loading='lazy';
      // Only local project photos are shown; never load arbitrary remote URLs.
      if(local && /^photos\/[A-Za-z0-9._-]+\.(jpg|jpeg|png|webp)$/i.test(p.path)){img.src='/journal-photos/'+p.path.slice(7);photos.append(img);}
    });if(photos.childNodes.length)card.append(photos);
    card.append(node('p',N.KEYS.map(key=>{const n=m.nutrition?.[key];return `${key[0].toUpperCase()+key.slice(1)} ${n?`${n.source==='estimate'?'≈ ':''}${fmt(n.value)}${key==='calories'?' kcal':' g'}`:'—'}`;}).join(' · '),'meal-macros'));
    if(m.assumptions)card.append(node('p',m.assumptions,'uncertainty'));
    if(m.analysis)card.append(node('p',m.analysis));
    log.append(card);
  });
  const suggestions=$('#suggestions');suggestions.replaceChildren();
  const reflection=journal.reflections.find(r=>r.date===day);
  const advice=[...(reflection?.suggestions||[]),...meals.flatMap(m=>(m.suggestions||[]).map(s=>({...s,meal:m.title})))];
  if(reflection?.summary)suggestions.append(node('p',reflection.summary));
  if(!advice.length)empty(suggestions,'A reflection, after your first log.','Once you share food, I’ll suggest a specific change based on what you ate and the portions you recorded.');
  advice.forEach(s=>{const e=node('article',undefined,'suggestion');if(s.meal)e.append(node('p',s.meal,'eyebrow'));e.append(node('h3',s.title),node('p',s.detail));suggestions.append(e);});
  if(reflection?.question)suggestions.append(node('p',reflection.question,'muted'));
  $('#next-day').disabled=day>=today();
  renderChart();
}
function renderEnergyPlan(goals,day) {
  const cards=$('#energy-plan-cards');cards.replaceChildren();
  const plan=goals.energyPlan;
  const latest=N.weightSummary(journal.measurements,day).latest;
  const stale=!!plan && ((latest && plan.inputWeight!==latest.weight) || plan.height!==goals.height || plan.goalWeight!==goals.weight || plan.deadline!==goals.deadline);
  const usable=plan && !stale;
  const items=[
    ['maintainCurrent','MAINTAIN CURRENT WEIGHT',latest?`Stay around ${decimal(latest.weight)} kg`:'Stay at your current weight'],
    ['loseTowardGoal','REACH YOUR GOAL',goals.weight?`Lose toward ${decimal(goals.weight)} kg`:'Daily intake for weight loss'],
    ['maintainGoal','MAINTAIN GOAL WEIGHT',goals.weight?`Stay around ${decimal(goals.weight)} kg`:'Keep your goal weight']
  ];
  items.forEach(([key,title,subtitle])=>{
    const card=node('article',undefined,'energy-plan-card');
    const value=usable&&Number.isFinite(plan[key])?plan[key]:null;
    const amount=node('div',value===null?'—':`≈ ${fmt(value)}`,'energy-plan-value');amount.append(node('small',' kcal / day'));
    card.append(node('p',title,'eyebrow'),amount,node('p',key==='loseTowardGoal'&&goals.deadline?`${subtitle} by ${new Date(goals.deadline+'T12:00:00Z').toLocaleDateString(undefined,{month:'short',day:'numeric',timeZone:'UTC'})}`:subtitle),node('p',value===null?(stale?'Needs an updated estimate':'Awaiting your age, sex & activity'):'Estimated daily intake','muted'));
    cards.append(card);
  });
  $('#energy-plan-note').textContent=stale?'Your weight or goal has changed since this estimate. Share updated details here in chat to refresh your calorie needs.':usable?(plan.summary||'Calorie needs are estimates. We’ll adjust them using your recorded intake and weight trend.'):'Share your age, sex used for the calculation, and usual activity here in chat. I’ll estimate calories for maintaining your current weight, losing toward your goal, and maintaining your goal weight.';
  if(usable&&plan.sourceURL){const link=node('a',' Calculation source');try{const url=new URL(plan.sourceURL);if(url.protocol==='https:'){link.href=url.href;$('#energy-plan-note').append(link);}}catch{}}
}

function renderChart() {
  const key=$('#chart-metric').value,day=$('#day').value,unit=key==='weight'?'kg':key==='calories'?'kcal':'g';
  let records;
  if(key==='weight')records=journal.measurements.filter(m=>m.date<=day&&Number.isFinite(m.weight)).map(m=>({date:m.date,value:m.weight}));
  else records=[...new Set(journal.meals.filter(m=>m.date<=day).map(m=>m.date))].map(date=>{const total=N.daily(journal.meals,date)[key];return {date,value:total.value,partial:total.known<total.meals};}).filter(r=>r.value!==null);
  records.sort((a,b)=>a.date.localeCompare(b.date));records=records.slice(-30);
  const box=$('#chart');box.replaceChildren();
  $('#trend').textContent=key==='weight'?'Recorded weigh-ins only; missing days stay blank.':'Logged-food totals only. Hollow points mark days with meals still awaiting nutrition analysis. These are not necessarily complete days of eating.';
  if(!records.length){empty(box,'Progress takes a few entries.','Your recorded measurements and meal nutrition will build this chart over time.');return;}
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 900 200');svg.setAttribute('role','img');svg.setAttribute('aria-label',records.map(r=>`${r.date}: ${decimal(r.value)} ${unit}${r.partial?' (partial)':''}`).join('; '));
  const make=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));if(text)e.textContent=text;return e;};
  const values=records.map(r=>r.value),min=key==='weight'?Math.min(...values)-1:0,max=Math.max(...values)+(key==='weight'?1:Math.max(1,Math.max(...values)*.1));
  const dates=records.map(r=>Date.parse(r.date)),span=dates.at(-1)-dates[0];
  for(let i=0;i<3;i++){const y=25+i*65;svg.append(make('line',{x1:65,x2:865,y1:y,y2:y,stroke:'#d5d7ca','stroke-dasharray':'3 5'}),make('text',{x:0,y:y+4,fill:'#747b71','font-size':11},key==='weight'?decimal(max-i*(max-min)/2):fmt(max-i*(max-min)/2)));}
  const points=records.map((r,i)=>[span?65+(dates[i]-dates[0])/span*800:465,155-(r.value-min)/(max-min)*130]);
  svg.append(make('polyline',{points:points.map(p=>p.join(',')).join(' '),fill:'none',stroke:'#687b59','stroke-width':2}));
  points.forEach(([x,y],i)=>{const c=make('circle',{cx:x,cy:y,r:4,fill:records[i].partial?'#fbfaf5':'#687b59',stroke:'#687b59','stroke-width':2});c.append(make('title',{},`${records[i].date}: ${decimal(records[i].value)} ${unit}${records[i].partial?' (partial)':''}`));svg.append(c);});
  svg.append(make('text',{x:65,y:190,fill:'#747b71','font-size':11},records[0].date),make('text',{x:780,y:190,fill:'#747b71','font-size':11},records.at(-1).date));box.append(svg);
}
async function refresh() {
  if(loading)return;loading=true;$('#refresh').disabled=true;
  try{const response=await fetch(journalURL,{cache:'no-store'});if(!response.ok)throw new Error(`Journal returned HTTP ${response.status}.`);const data=await response.json();if(data.version!==1||!Array.isArray(data.meals)||!Array.isArray(data.measurements)||!Array.isArray(data.reflections)||!data.goals)throw new Error('Unexpected journal format.');journal=data;render();
    $('#sync-status').textContent=local?(data.updatedAt?`Updated ${new Date(data.updatedAt).toLocaleString()}`:'Ready for your first food log'):'Published snapshot · chat updates appear locally';status('');
  }catch(error){$('#sync-status').textContent='Journal could not refresh';status(`${error.message} Your last loaded dashboard is still shown.`);}finally{loading=false;$('#refresh').disabled=false;}
}
function shiftDay(offset){const date=new Date($('#day').value+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+offset);$('#day').value=date.toISOString().slice(0,10);render();}
$('#day').value=today();$('#day').max=today();$('#day').onchange=()=>{if(!$('#day').value||$('#day').value>today())$('#day').value=today();render();};$('#previous-day').onclick=()=>shiftDay(-1);$('#next-day').onclick=()=>shiftDay(1);$('#today').onclick=()=>{$('#day').value=today();render();};$('#refresh').onclick=refresh;$('#chart-metric').onchange=renderChart;
render();refresh();setInterval(()=>{if(!document.hidden)refresh();},30000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
