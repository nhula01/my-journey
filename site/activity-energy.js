/* Population-average MET estimates, not wearable measurements or a fat-burn calculation. */
'use strict';
const ActivityEnergy=(()=>{
  const source='https://pacompendium.com/';
  function estimate(kind,minutes,weight,walkingMET=3.8){
    if(!Number.isFinite(minutes)||minutes<=0||minutes>180||!Number.isFinite(weight)||weight<1||weight>500)return null;
    // 02054: multi-exercise resistance session (including its ordinary rests).
    // Core is allocated the same session average, not a measured plank-specific cost.
    // 17355: level treadmill 3.0–3.4 mph; easy walking uses 17151 / 2.3 MET.
    const met=['strength','hold'].includes(kind)?3.5:kind==='cardio'?walkingMET:2.3;
    if(![2.8,3.8,4.8].includes(walkingMET))return null;
    const gross=met*weight*minutes/60,active=(met-1)*weight*minutes/60;
    return {active,gross,met,minutes,weight,source:'estimate',sourceURL:source};
  }
  function latestWeight(measurements,date){return measurements.filter(m=>m.date<=date&&Number.isFinite(m.weight)).sort((a,b)=>b.date.localeCompare(a.date))[0]||null;}
  function sum(records){return records.reduce((total,r)=>({active:total.active+(r?.active||0),gross:total.gross+(r?.gross||0),minutes:total.minutes+(r?.minutes||0)}),{active:0,gross:0,minutes:0});}
  return {estimate,latestWeight,sum};
})();
if(typeof module!=='undefined')module.exports=ActivityEnergy;
