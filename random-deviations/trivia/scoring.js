(function(root){
  'use strict';
  function isPoints(value,limit=1000000){return typeof value==='number'&&Number.isFinite(value)&&Math.abs(value)<=limit&&Math.abs(value*100-Math.round(value*100))<1e-7;}
  const cents=value=>Math.round(value*100);
  function remaining(question,multiplier,ledger){
    const awarded=ledger.filter(l=>l.q===question.id&&l.delta>0).reduce((sum,l)=>sum+cents(l.delta),0);
    return Math.max(0,cents(question.points*multiplier)-awarded)/100;
  }
  function award(teams,ledger,question,multiplier,amounts,batch){
    const ids=new Set(teams.map(t=>t.id));
    if(Object.keys(amounts).some(id=>!ids.has(id)))throw Error('Unknown team.');
    const entries=teams.map(t=>({q:question.id,team:t.id,delta:amounts[t.id]??0,batch}));
    if(entries.some(l=>!isPoints(l.delta,10000)||l.delta<0))throw Error('Use nonnegative points with at most two decimal places.');
    const total=entries.reduce((sum,l)=>sum+cents(l.delta),0);
    if(!total)throw Error('Enter points for at least one team.');
    if(total>cents(remaining(question,multiplier,ledger)))throw Error('The split exceeds this question’s remaining points.');
    const next=teams.map(t=>({...t,score:(cents(t.score)+cents(amounts[t.id]??0))/100}));
    if(next.some(t=>!isPoints(t.score)))throw Error('That score is too large.');
    return {teams:next,ledger:[...ledger,...entries.filter(l=>l.delta>0)]};
  }
  function undo(teams,ledger,questionId){
    const last=ledger.filter(l=>l.q===questionId).at(-1);
    if(!last)return {teams,ledger};
    const removed=last.batch?ledger.filter(l=>l.q===questionId&&l.batch===last.batch):[last];
    const next=teams.map(t=>({...t,score:(cents(t.score)-removed.filter(l=>l.team===t.id).reduce((sum,l)=>sum+cents(l.delta),0))/100}));
    return {teams:next,ledger:ledger.filter(l=>!removed.includes(l))};
  }
  const api={isPoints,remaining,award,undo};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TriviaScoring=api;
})(typeof globalThis!=='undefined'?globalThis:this);
