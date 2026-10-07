'use strict';
// NIH's published model runs in an isolated context: no network or file APIs.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
function calculate(input) {
  for (const key of ['weight','height','age','pal','goalWeight','days']) {
    if (!Number.isFinite(input[key]) || input[key] <= 0) throw new Error(`Invalid ${key}.`);
  }
  if (input.age < 18 || input.age > 120 || !['male','female'].includes(input.sex) || input.pal<1.4 || input.pal>2.5 || input.days>3650 || input.goalWeight/(input.height/100)**2<18.5) throw new Error('Inputs are outside the adult planning range.');
  const context = vm.createContext({input}, {codeGeneration:{strings:false,wasm:false}});
  vm.runInContext(`
    const definitions = {};
    const resolved = {};
    const services = {factory(name,args) {definitions[name] = args;}};
    const console = {log() {}};
    function resolve(name) {
      if (resolved[name]) return resolved[name];
      const args=definitions[name];
      if (!args) throw new Error('Unknown model dependency');
      return resolved[name]=args.at(-1)(...args.slice(0,-1).map(resolve));
    }
  `,context,{timeout:1000});
  for (const file of ['baseline','bodychange','dailyparams','bodymodel','intervention']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname,'nih-model',file+'.js'),'utf8'),context,{timeout:1000,filename:file+'.js'});
  }
  return vm.runInContext(`
    const Baseline=resolve('Baseline'), BodyModel=resolve('BodyModel'), Intervention=resolve('Intervention');
    const baseline=new Baseline(input.sex==='male',input.age,input.height,input.weight,undefined,undefined,input.pal);
    // Override the original constructor's false-sex fallback explicitly.
    baseline.isMale=input.sex==='male';
    baseline.rmrCalc=false;
    baseline.bfpCalc=true;
    const intervention=Intervention.forgoal(baseline,input.goalWeight,input.days,0,0,.001);
    const final=BodyModel.projectFromBaselineViaIntervention(baseline,intervention,input.days+1);
    ({maintainCurrent:baseline.getMaintCals(),loseTowardGoal:intervention.calories,
      maintainGoal:input.weight===input.goalWeight?baseline.getMaintCals():final.cals4balance(baseline,baseline.getActivityParam()),
      predictedWeight:BodyModel.projectFromBaselineViaIntervention(baseline,intervention,input.days).getWeight(baseline),
      restingCalories:baseline.getRMR()});
  `,context,{timeout:10000});
}
module.exports = {calculate};
if (require.main===module) {
  try {const input=JSON.parse(fs.readFileSync(0,'utf8'));console.log(JSON.stringify(calculate(input),null,2));}
  catch(error) {console.error(String(error));process.exitCode=1;}
}
