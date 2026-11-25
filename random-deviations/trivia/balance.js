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
    const weights=source.map(c=>{
      const values=profiles.map(r=>r[c.id]);
      return 1/(1+3*(Math.max(...values)-Math.min(...values))/10);
    });
    const sumWeights=weights.reduce((a,b)=>a+b,0);
    let allocation=source.map(()=>tiers.map(()=>1));
    function metrics(a){
      const categoryPoints=a.map(row=>row.reduce((s,n,i)=>s+n*tiers[i],0));
      const total=categoryPoints.reduce((a,b)=>a+b,0);
      const opportunity=profiles.map(profile=>source.reduce((sum,c,i)=>sum+categoryPoints[i]*profile[c.id]/10,0)/total);
      const mean=opportunity.reduce((a,b)=>a+b,0)/opportunity.length;
      return {spread:Math.max(...opportunity)-Math.min(...opportunity),variance:opportunity.reduce((s,x)=>s+(x-mean)**2,0),penalty:categoryPoints.reduce((s,p,i)=>s+(p/total-weights[i]/sumWeights)**2,0),categoryPoints,opportunity};
    }
    function better(a,b){for(const key of ['spread','variance','penalty']){if(a[key]<b[key]-1e-10)return true;if(a[key]>b[key]+1e-10)return false;}return false;}
    const baseline=metrics(allocation);let best=baseline;
    // Transfer one question within a tier: preserve difficulty and total points.
    // Coverage never falls below one question per category; pool capacities apply.
    for(let attempt=0;attempt<2500;attempt++){
      const swap=attempt%3===0;
      const tier=Math.floor(rng()*tiers.length);
      const donors=source.map((_,i)=>i).filter(i=>allocation[i][tier]>0&&(swap||allocation[i].reduce((a,b)=>a+b,0)>1));
      if(!donors.length)continue;
      const from=choose(donors,rng);
      const targets=source.map((_,i)=>i).filter(i=>i!==from&&allocation[i][tier]<buckets[i][tier].length);
      if(!targets.length)continue;
      let roll=rng()*targets.reduce((sum,i)=>sum+weights[i],0),to=targets.at(-1);
      for(const i of targets){roll-=weights[i];if(roll<0){to=i;break;}}
      let other=-1;
      if(swap){
        const alternatives=tiers.map((_,j)=>j).filter(j=>j!==tier&&allocation[to][j]>0&&allocation[from][j]<buckets[from][j].length);
        if(!alternatives.length)continue;
        other=choose(alternatives,rng);
        allocation[to][other]--;allocation[from][other]++;
      }
      allocation[from][tier]--;allocation[to][tier]++;
      const candidate=metrics(allocation);
      if(better(candidate,best))best=candidate;
      else {allocation[from][tier]++;allocation[to][tier]--;if(other>=0){allocation[to][other]++;allocation[from][other]--;}}
    }
    const old=new Set(current.flatMap(c=>c.questions.map(q=>q.id)));
    const bank=source.map((c,i)=>({...c,questions:tiers.flatMap((_,j)=>{
      // Prefer unseen clues; never duplicate a question in a quiz.
      const available=[...buckets[i][j]],picked=[];
      while(picked.length<allocation[i][j]){
        const fresh=available.filter(q=>!old.has(q.id));
        const q=choose(fresh.length?fresh:available,rng);picked.push(q);available.splice(available.indexOf(q),1);
      }
      return picked;
    })}));
    return {bank,report:{policy:'inverse-skew-v1',baselineSpread:baseline.spread,spread:best.spread,teams:teams.map((t,i)=>({id:t.id,opportunity:best.opportunity[i]})),categories:source.map((c,i)=>({id:c.id,weight:weights[i],count:bank[i].questions.length,points:best.categoryPoints[i]}))}};
  }
  const api={ratings,draw};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.TriviaBalance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
