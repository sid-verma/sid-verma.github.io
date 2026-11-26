/* Pure, testable selection policy. Ratings estimate opportunity, not win odds. */
(function(root){
  'use strict';
  const tiers=[10,20,30,40,50];
  function ratings(team,categories){
    if(team.ratings!==undefined&&(!team.ratings||typeof team.ratings!=='object'||Array.isArray(team.ratings)))throw Error('Invalid team ratings.');
    return Object.fromEntries(categories.map(c=>{
      const value=team.ratings?.[c.id]??5;
      if(!Number.isInteger(value)||value<0||value>10)throw Error('Team ratings must be whole numbers from 0 to 10.');
      return[c.id,value];
    }));
  }
  function random(){const word=new Uint32Array(1);crypto.getRandomValues(word);return word[0]/4294967296;}
  function choose(values,rng){return values[Math.floor(rng()*values.length)];}
  function draw(source,teams,current=[],rng=random){
    if(!source.length||!teams.length)throw Error('Add at least one team before shuffling.');
    const profiles=teams.map(t=>ratings(t,source));
    const buckets=source.map(c=>tiers.map(p=>c.questions.filter(q=>q.points===p)));
    if(buckets.some(row=>row.some(bucket=>!bucket.length)))throw Error('Every category needs every point level.');
    const averages=source.map(c=>profiles.reduce((sum,r)=>sum+r[c.id],0)/profiles.length);
    // Neutral (5) or stronger keeps every tier; weaker means trim from the top.
    const caps=averages.map(mean=>Math.max(1,Math.min(5,Math.ceil(mean))));
    const weights=source.map(c=>{
      const values=profiles.map(r=>r[c.id]);
      return 1/(1+3*(Math.max(...values)-Math.min(...values))/10);
    });
    const targets=caps.map((cap,i)=>tiers.slice(0,cap).reduce((a,b)=>a+b,0)*weights[i]);
    const sumWeights=targets.reduce((a,b)=>a+b,0);
    const allocation=[...caps];
    function metrics(a){
      const categoryPoints=a.map(count=>tiers.slice(0,count).reduce((s,p)=>s+p,0));
      const total=categoryPoints.reduce((a,b)=>a+b,0);
      const opportunity=profiles.map(profile=>source.reduce((sum,c,i)=>sum+categoryPoints[i]*profile[c.id]/10,0)/total);
      const mean=opportunity.reduce((a,b)=>a+b,0)/opportunity.length;
      return {spread:Math.max(...opportunity)-Math.min(...opportunity),variance:opportunity.reduce((s,x)=>s+(x-mean)**2,0),penalty:categoryPoints.reduce((s,p,i)=>s+(p/total-targets[i]/sumWeights)**2,0),categoryPoints,opportunity};
    }
    function better(a,b){for(const key of ['spread','variance','penalty']){if(a[key]<b[key]-1e-10)return true;if(a[key]>b[key]+1e-10)return false;}return false;}
    const baseline=metrics(allocation),fullBaseline=metrics(source.map(()=>5));let best=baseline;
    // Never transfer or duplicate a slot. At most forty top-tier removals exist.
    for(let attempt=0;attempt<40;attempt++){
      let selected=-1,next=best;
      for(let i=0;i<source.length;i++){
        if(allocation[i]<=1)continue;
        allocation[i]--;const candidate=metrics(allocation);allocation[i]++;
        if(better(candidate,next)){selected=i;next=candidate;}
      }
      if(selected<0)break;
      allocation[selected]--;best=next;
    }
    const old=new Set(current.flatMap(c=>c.questions.map(q=>q.id)));
    const bank=source.map((c,i)=>({...c,questions:tiers.flatMap((_,j)=>{
      // Prefer unseen clues; never duplicate a question in a quiz.
      if(j>=allocation[i])return [];
      const available=buckets[i][j],fresh=available.filter(q=>!old.has(q.id));
      return [choose(fresh.length?fresh:available,rng)];
    })}));
    return {bank,report:{policy:'prefix-average-inverse-v2',baselineSpread:baseline.spread,fullBaselineSpread:fullBaseline.spread,spread:best.spread,questions:bank.reduce((n,c)=>n+c.questions.length,0),teams:teams.map((t,i)=>({id:t.id,opportunity:best.opportunity[i]})),categories:source.map((c,i)=>({id:c.id,average:averages[i],maximumTier:tiers[caps[i]-1],weight:weights[i],count:bank[i].questions.length,points:best.categoryPoints[i]}))}};
  }
  function validateSelection(bank){
    for(const c of bank){
      const points=c.questions.map(q=>q.points).sort((a,b)=>a-b);
      if(!points.length||points.length>5||points.some((p,i)=>p!==tiers[i]))throw Error('Each category must have one question per active tier, starting at 10 points with no gaps.');
    }
    return bank;
  }
  function migrateSelection(source,selected,used){
    return source.map(c=>{
      const previous=selected.find(x=>x.id===c.id)?.questions||[];
      if(!previous.length)throw Error('Each category needs an active question.');
      const top=Math.max(...previous.map(q=>q.points));
      return {...c,questions:tiers.filter(p=>p<=top).map(p=>previous.find(q=>q.points===p&&used[q.id])||previous.find(q=>q.points===p)||c.questions.find(q=>q.points===p))};
    });
  }
  const api={ratings,draw,validateSelection,migrateSelection};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TriviaBalance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
