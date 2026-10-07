'use strict';
const page = document.body.dataset.page;
const $ = selector => document.querySelector(selector);
const form = $('#entry-form');
let db, entries = [], selectedPhotos = [], editId = '', analysisAvailable = false;
const today = () => new Date().toLocaleDateString('en-CA');
const status = message => { $('#status').textContent = message; };
const node = (tag, text, className) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (className) e.className = className; return e; };
const number = value => value === '' || value === undefined ? null : Number(value);
const mean = values => values.length ? values.reduce((a,b) => a+b,0)/values.length : null;
const display = value => value === null ? '—' : Number(value.toFixed(1)).toString();
const transaction = (mode, action) => new Promise((resolve,reject) => {
  const tx = db.transaction('entries',mode); const request = action(tx.objectStore('entries'));
  tx.oncomplete = () => resolve(request?.result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Storage transaction cancelled.'));
});
async function openDB() {
  db = await new Promise((resolve,reject) => { const r = indexedDB.open('my-journey',1); r.onupgradeneeded = () => r.result.createObjectStore('entries',{keyPath:'id'}); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}
function stat(value,label) { const box=node('div',undefined,'stat'); box.append(node('strong',value),node('span',label)); return box; }
function summarize() {
  const own = entries.filter(e=>e.type===page).sort((a,b)=>a.date.localeCompare(b.date));
  const stats = $('#stats'); stats.replaceChildren();
  const days = new Set(own.map(e=>e.date)).size;
  if(page==='weight') {
    const weights=own.filter(e=>e.weight!==null); const latest=weights.at(-1)?.weight??null;
    const change=weights.length>1? latest-weights[0].weight:null;
    stats.append(stat(`${display(latest)}${latest===null?'':' kg'}`,'LATEST RECORDED WEIGHT'),stat(`${change>0?'+':''}${display(change)}${change===null?'':' kg'}`,'CHANGE SINCE FIRST RECORD'),stat(String(days),'DAYS LOGGED'),stat(String(own.reduce((n,e)=>n+e.photos.length,0)),'FOOD PHOTOGRAPHS'));
    const recent=weights.filter(e=>e.date>=new Date(Date.now()-6*86400000).toLocaleDateString('en-CA') && e.date<=today());
    const avg=mean(recent.map(e=>e.weight));
    $('#trend').textContent=avg===null?'Add measurements to see your trend. Missing days are never counted as zero.':`Average of recorded weights in the last 7 calendar days: ${display(avg)} kg (${recent.length} measurement${recent.length===1?'':'s'}).`;
    chart(weights,'weight','kg');
  } else {
    const total=own.reduce((n,e)=>n+e.minutes,0);
    stats.append(stat(String(days),'PRACTICE DAYS'),stat(`${total} min`,'TOTAL PRACTICE'),stat(`${display(mean(own.map(e=>e.minutes)))} min`,'AVERAGE SESSION'),stat(String(new Set(own.map(e=>e.piece.toLowerCase())).size),'PIECES & EXERCISES'));
    $('#trend').textContent='Tempo belongs to its piece and technique. Record clean BPM to compare like-for-like sessions in your journal.';
    const daily = [...new Set(own.map(e=>e.date))].map(date=>({date,minutes:own.filter(e=>e.date===date).reduce((n,e)=>n+e.minutes,0)})); chart(daily,'minutes','min');
  }
}
function chart(records,key,unit) {
  const container=$('#chart'); container.replaceChildren();
  if(!records.length){container.append(node('div','Your first entry starts the story. No sample data, just your progress.','chart-empty'));return;}
  const svgNS='http://www.w3.org/2000/svg'; const svg=document.createElementNS(svgNS,'svg'); svg.setAttribute('viewBox','0 0 900 200');svg.setAttribute('role','img');
  svg.setAttribute('aria-label',records.map(e=>`${e.date}: ${e[key]} ${unit}`).join('; '));
  const vals=records.map(e=>e[key]),lo=Math.min(...vals)-1,hi=Math.max(...vals)+1;
  const times=records.map(e=>Date.parse(e.date)); const first=times[0],last=times.at(-1);
  const points=records.map((e,i)=>[last===first?450:60+(times[i]-first)/(last-first)*800,160-(e[key]-lo)/(hi-lo)*130]);
  for(let i=0;i<3;i++){let line=document.createElementNS(svgNS,'line');Object.entries({x1:60,x2:860,y1:30+i*65,y2:30+i*65,stroke:'#d5d7ca','stroke-dasharray':'3 5'}).forEach(([k,v])=>line.setAttribute(k,v));svg.append(line);const t=document.createElementNS(svgNS,'text');t.setAttribute('x','0');t.setAttribute('y',35+i*65);t.setAttribute('fill','#747b71');t.setAttribute('font-size','11');t.textContent=display(hi-i*(hi-lo)/2);svg.append(t);}
  const line=document.createElementNS(svgNS,'polyline');line.setAttribute('points',points.map(p=>p.join(',')).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#687b59');line.setAttribute('stroke-width','2');svg.append(line);
  points.forEach(([x,y],i)=>{const c=document.createElementNS(svgNS,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','4');c.setAttribute('fill','#687b59');const t=document.createElementNS(svgNS,'title');t.textContent=`${records[i].date}: ${records[i][key]} ${unit}`;c.append(t);svg.append(c);});
  [[60,records[0].date],[780,records.at(-1).date]].forEach(([x,date])=>{const t=document.createElementNS(svgNS,'text');t.setAttribute('x',x);t.setAttribute('y','192');t.setAttribute('fill','#747b71');t.setAttribute('font-size','11');t.textContent=date;svg.append(t);});container.append(svg);
}
function photosView(container,photos,editable=false){container.replaceChildren();photos.forEach((photo,i)=>{const box=node('div');const img=node('img');img.src=photo.data;img.alt=photo.name||'Food photograph';box.append(img);if(editable){const b=node('button','Remove','secondary');b.type='button';b.onclick=()=>{selectedPhotos.splice(i,1);photosView(container,selectedPhotos,true);};box.append(b);}container.append(box);});}
function render() {
  summarize(); const list=$('#entries'); list.replaceChildren();const query=$('#search').value.toLowerCase();
  const visible=entries.filter(e=>e.type===page && JSON.stringify({...e,photos:[]}).toLowerCase().includes(query)).sort((a,b)=>b.date.localeCompare(a.date)||b.updatedAt.localeCompare(a.updatedAt));
  if(!visible.length){list.append(node('p',query?'No entries match your search.':'Your notebook is waiting. Start with today.','empty'));return;}
  visible.forEach(e=>{const card=node('article',undefined,'record');card.append(node('span',new Date(e.date+'T12:00:00').toLocaleDateString(undefined,{month:'long',day:'numeric',year:'numeric'}),'date'));
    if(page==='weight'){card.append(node('h3',e.weight===null?'A day of nourishment':`${e.weight} kg`),node('p',[e.waist===null?null:`Waist ${e.waist} cm`,e.movement===null?null:`Movement ${e.movement} min`,e.calories===null?null:`${e.calories} kcal recorded`,e.protein===null?null:`Protein ${e.protein} g`].filter(Boolean).join(' · '),'muted'),node('p',e.meals));if(e.notes)card.append(node('p',e.notes));const p=node('div',undefined,'photos');photosView(p,e.photos);card.append(p);}
    else {card.append(node('h3',e.piece),node('p',`${e.minutes} min · ${e.technique}${e.bpm===null?'':` · ${e.bpm} BPM`}`,'muted'),node('p',e.learning));if(e.next)card.append(node('p',`Next time: ${e.next}`));}
    if(e.analysis)card.append(node('div',`AI reflection · ${new Date(e.analysisAt).toLocaleDateString()}\n${e.analysis}`,'analysis'));
    const actions=node('div',undefined,'actions');const edit=node('button','Edit','secondary');edit.onclick=()=>editEntry(e);const del=node('button','Delete','secondary');del.onclick=async()=>{if(del.dataset.confirm!=='yes'){del.dataset.confirm='yes';del.textContent='Confirm delete';status('Click Confirm delete to remove this entry and its photos. Export a backup first if you want to keep it.');return;}try{await transaction('readwrite',s=>s.delete(e.id));if(editId===e.id)reset();await refresh();status('Entry deleted.');}catch(error){status(error.message);}};actions.append(edit,del);
    if(page==='weight'){const analyze=node('button','Analyze meals & progress ↗','secondary');analyze.onclick=()=>analyzeEntry(e,analyze);actions.append(analyze);}card.append(actions);list.append(card);
  });
}
async function refresh(){entries=await transaction('readonly',s=>s.getAll());render();}
function reset(){form.reset();form.elements.date.value=today();editId='';selectedPhotos=[];$('#cancel-edit').hidden=true;if($('#photo-preview'))photosView($('#photo-preview'),[]);}
function editEntry(e){reset();editId=e.id;for(const [key,value] of Object.entries(e)){if(form.elements.namedItem(key)&&key!=='photos')form.elements.namedItem(key).value=value??'';}selectedPhotos=[...(e.photos||[])];if($('#photo-preview'))photosView($('#photo-preview'),selectedPhotos,true);$('#cancel-edit').hidden=false;$('#entry').scrollIntoView({behavior:'smooth'});status('Editing entry. Save to apply your changes.');}
async function analyzeEntry(e,button){
  if(!analysisAvailable){status('AI analysis is not connected on this static website. Run python3 scripts/server.py with OPENAI_API_KEY set, then open http://127.0.0.1:8008. Export/import your backup to move entries between the hosted and local journals.');return;}
  button.disabled=true;status('Reviewing your recorded metrics and meal photos…');
  try {const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({entry:e,history:entries.filter(x=>x.type==='weight'&&x.date<=e.date).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30).map(({photos,analysis,...rest})=>rest)})});const data=await response.json();if(!response.ok)throw new Error(data.error||'Analysis failed.');const current=await transaction('readonly',s=>s.get(e.id));if(!current)return;if(current.updatedAt!==e.updatedAt)throw new Error('Entry changed during analysis. Analyze the updated entry again.');await transaction('readwrite',s=>s.put({...current,analysis:data.analysis,analysisAt:new Date().toISOString()}));await refresh();status('AI reflection saved with this entry.');}catch(error){status(error.message);}finally{button.disabled=false;}
}
form.onsubmit=async event=>{event.preventDefault();const button=form.querySelector('button[type=submit]');button.disabled=true;try{const data=Object.fromEntries(new FormData(form));const old=entries.find(e=>e.id===editId);const e={id:editId||crypto.randomUUID(),type:page,date:data.date,updatedAt:new Date().toISOString()};if(e.date>today())throw new Error('Choose today or a past date for your daily record.');
  if(page==='weight'){Object.assign(e,{weight:number(data.weight),waist:number(data.waist),movement:number(data.movement),calories:number(data.calories),protein:number(data.protein),meals:data.meals.trim(),notes:data.notes.trim(),photos:[...selectedPhotos]});if(!e.meals)throw new Error('Describe your meals before saving.');if(entries.some(x=>x.type==='weight'&&x.date===e.date&&x.id!==e.id))throw new Error('A health entry exists for this date. Edit it to add more meals.');}
  else Object.assign(e,{minutes:number(data.minutes),piece:data.piece.trim(),technique:data.technique,bpm:number(data.bpm),learning:data.learning.trim(),next:data.next.trim()});
  const auto=data.autoAnalyze==='on';await transaction('readwrite',s=>s.put(e));reset();await refresh();status(old?'Entry updated. Previous analysis was cleared so it does not describe old data.':'Entry saved on this device.');if(auto)await analyzeEntry(e,button);
}catch(error){status(`Could not save: ${error.message}`);}finally{button.disabled=false;}};
$('#cancel-edit').onclick=reset;$('#search').oninput=render;
if($('#photos'))$('#photos').onchange=async event=>{try{const files=[...event.target.files];if(files.length+selectedPhotos.length>4)throw new Error('Keep up to 4 photos per entry.');const additions=[];for(const file of files){if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024)throw new Error('Choose JPG, PNG or WebP images under 10 MB each.');const img=await createImageBitmap(file);const canvas=document.createElement('canvas');const scale=Math.min(1,1400/Math.max(img.width,img.height));canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);img.close();additions.push({name:file.name,data:canvas.toDataURL('image/jpeg',.8)});}selectedPhotos.push(...additions);photosView($('#photo-preview'),selectedPhotos,true);}catch(error){status(error.message);}finally{event.target.value='';}};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify({format:'my-journey',version:1,exportedAt:new Date().toISOString(),entries},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=node('a');a.href=url;a.download=`my-journey-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status('Backup exported, including both journals and photos. Keep this file private.');};
function validateBackup(data){
  if(data.format!=='my-journey'||data.version!==1||!Array.isArray(data.entries)||data.entries.length>10000)throw new Error('Choose a My Journey version 1 backup.');
  const ids=new Set();for(const e of data.entries){if(typeof e.id!=='string'||!e.id||ids.has(e.id)||!['weight','piano'].includes(e.type)||!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))||new Date(e.date).toISOString().slice(0,10)!==e.date||!Number.isFinite(Date.parse(e.updatedAt)))throw new Error('Invalid entry in backup.');ids.add(e.id);
  const numeric=(key,min,max,required=false)=>{if(e[key]===null&&!required)return;if(typeof e[key]!=='number'||!Number.isFinite(e[key])||e[key]<min||e[key]>max)throw new Error(`Invalid ${key} in backup.`);};
  const string=(key,required=false,max=12000)=>{if(typeof e[key]!=='string'||e[key].length>max||(required&&!e[key].trim()))throw new Error(`Invalid ${key} in backup.`);};
  if(e.type==='weight'){string('meals',true);string('notes');numeric('weight',1,500);numeric('waist',1,300);numeric('movement',0,1440);numeric('calories',0,20000);numeric('protein',0,2000);if(!Array.isArray(e.photos)||e.photos.length>4||e.photos.some(p=>typeof p.name!=='string'||p.name.length>500||typeof p.data!=='string'||p.data.length>4e6||!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(p.data)))throw new Error('Invalid photos in backup.');}
  else{numeric('minutes',1,1440,true);numeric('bpm',1,400);string('piece',true,500);string('technique',true,100);string('learning',true);string('next');}
  if(e.analysis!==undefined){string('analysis',false,30000);if(!Number.isFinite(Date.parse(e.analysisAt)))throw new Error('Invalid analysis date.');}}
  return data.entries;
}
$('#import').onchange=async event=>{try{const file=event.target.files[0];if(!file)return;if(file.size>100*1024*1024)throw new Error('Backup exceeds 100 MB.');const imported=validateBackup(JSON.parse(await file.text()));const byId=new Map(entries.map(e=>[e.id,e]));for(const e of imported){const old=byId.get(e.id);if(!old||e.updatedAt>old.updatedAt)byId.set(e.id,e);}const healthDates=new Set();for(const e of byId.values()){if(e.type==='weight'){if(healthDates.has(e.date))throw new Error('Two health entries share a date. Resolve the duplicate in the source journal before importing.');healthDates.add(e.date);}}await transaction('readwrite',s=>{for(const e of byId.values())s.put(e);});reset();await refresh();status(`Imported ${imported.length} entries. The newest version of each entry was kept.`);}catch(error){status(`Import failed: ${error.message}`);}finally{event.target.value='';}};
(async()=>{try{await openDB();reset();await refresh();if(['localhost','127.0.0.1'].includes(location.hostname)){try{const r=await fetch('/api/status');analysisAvailable=r.ok&&(await r.json()).configured;}catch{}}}catch(error){form.querySelector('button[type=submit]').disabled=true;status(`Browser storage is unavailable: ${error.message}. Enable storage for this site to use your journal.`);}})();
