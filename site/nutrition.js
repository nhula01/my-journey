/* Shared nutrition arithmetic; unknown values stay unknown, never zero. */
(function(root) {
  'use strict';
  const KEYS = ['calories', 'protein', 'carbs', 'fat', 'fiber'];
  function total(meals, key) {
    const known = meals.map(m => m.nutrition?.[key]).filter(n => n && Number.isFinite(n.value));
    if (!known.length) return { value: null, low: null, high: null, known: 0, meals: meals.length, estimated: false };
    return {
      value: known.reduce((s,n) => s+n.value,0),
      low: known.reduce((s,n) => s+(n.low ?? n.value),0),
      high: known.reduce((s,n) => s+(n.high ?? n.value),0),
      known: known.length, meals: meals.length,
      estimated: known.some(n => n.source === 'estimate')
    };
  }
  function daily(meals, date) {
    const own = meals.filter(m => m.date === date);
    return Object.fromEntries(KEYS.map(key => [key,total(own,key)]));
  }
  function budget(consumed, target) {
    if (consumed === null || !Number.isFinite(target) || target <= 0) return null;
    return {remaining: target-consumed, percent: consumed/target*100};
  }
  function weightSummary(measurements, day) {
    const records = measurements.filter(m => m.date <= day && Number.isFinite(m.weight)).sort((a,b) => a.date.localeCompare(b.date));
    const latest = records.at(-1);
    const cutoff = new Date(day+'T12:00:00Z'); cutoff.setUTCDate(cutoff.getUTCDate()-6);
    const recent = records.filter(m => m.date >= cutoff.toISOString().slice(0,10));
    return {latest:latest ?? null, change:records.length > 1 ? latest.weight-records[0].weight : null, average:recent.length ? recent.reduce((s,m)=>s+m.weight,0)/recent.length : null, count:recent.length};
  }
  const api = {KEYS,total,daily,budget,weightSummary};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Nutrition = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
