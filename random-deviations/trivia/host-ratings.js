'use strict';
function teamRatingsPanel(team){
  const profile=TriviaBalance.ratings(team,pool);
  return `<section class="team-ratings" aria-labelledby="ratings-title"><h2 id="ratings-title">Category strengths</h2><p>Rate this team from 0 (weakest) to 10 (strongest). The starting value, 5, is neutral. Save each team before shuffling.</p><div class="ratings-grid"><div id="team-radar"></div><div class="rating-sliders">${pool.map((c,i)=>`<label for="rating-${i}"><span>${i+1}. ${esc(c.name)} <output id="rating-value-${i}" for="rating-${i}">${profile[c.id]}</output></span><input id="rating-${i}" data-rating="${esc(c.id)}" type="range" min="0" max="10" step="1" value="${profile[c.id]}" aria-valuetext="${profile[c.id]} out of 10"></label>`).join('')}</div></div><p id="ratings-progress" role="status">${state.teams.filter(t=>t.ratingsConfirmed).length} of ${state.teams.length} teams saved with ratings.</p></section>`;
}
function readTeamRatings(){return Object.fromEntries([...document.querySelectorAll('[data-rating]')].map(input=>[input.dataset.rating,Number(input.value)]));}
function updateTeamRadar(){
  const values=readTeamRatings(),n=pool.length,cx=110,cy=110,radius=78;
  const point=(i,value)=>{const angle=-Math.PI/2+i*2*Math.PI/n;return[cx+Math.cos(angle)*radius*value/10,cy+Math.sin(angle)*radius*value/10];};
  const polygon=value=>pool.map((_,i)=>point(i,value).join(',')).join(' ');
  const name=$('teamname')?.value||selectedTeam().name;
  $('team-radar').innerHTML=`<svg viewBox="0 0 220 220" role="img" aria-labelledby="radar-title radar-desc"><title id="radar-title">${esc(name)} category strength radar</title><desc id="radar-desc">${pool.map((c,i)=>`${i+1}: ${esc(c.name)}, ${values[c.id]} out of 10`).join('; ')}. Each axis corresponds to a numbered category slider.</desc>${[2,4,6,8,10].map(value=>`<polygon points="${polygon(value)}" fill="none" stroke="#b9b7ad" stroke-width="0.7"/>`).join('')}${pool.map((_,i)=>{const [x,y]=point(i,10),[tx,ty]=point(i,12);return `<line x1="110" y1="110" x2="${x}" y2="${y}" stroke="#d5d0bf"/><text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-size="10">${i+1}</text>`;}).join('')}<polygon data-radar-profile points="${pool.map((c,i)=>point(i,values[c.id]).join(',')).join(' ')}" fill="#294e8538" stroke="#294e85" stroke-width="2"/></svg><p>0 at center · 10 at outer ring</p>`;
}
function wireTeamRatings(){
  document.querySelectorAll('[data-rating]').forEach((input,i)=>input.addEventListener('input',()=>{
    $('rating-value-'+i).textContent=input.value;input.setAttribute('aria-valuetext',input.value+' out of 10');
    $('ratings-progress').textContent='Unsaved ratings — save this team to apply them.';
    updateTeamRadar();
  }));
  $('teamname').addEventListener('input',updateTeamRadar);
  updateTeamRadar();
}
function balanceSummary(){
  const report=state.balanceReport;
  return `<section class="balance-summary"><h2>Balanced shuffle</h2><p>Save every team’s ratings, then draw 50 questions. Category counts can vary; each point level still has 10 questions. Categories with sharply uneven team strengths receive lower inverse weight.</p>${report?`<p>Last shuffle’s estimated opportunity spread: <strong>${(report.spread*100).toFixed(1)} percentage points</strong> (equal-category baseline: ${(report.baselineSpread*100).toFixed(1)}). Changing ratings takes effect on the next shuffle.</p>`:''}<p>Ratings estimate opportunity, not win probabilities. They cannot guarantee equal outcomes.</p><button type="button" id="balancedshuffle" class="primary">Shuffle Questions</button></section>`;
}
function renderBalancedBoard(category,main){
  const names=['Warm-up','Find the link','Dig deeper','A twist','Deep cut'];
  main.innerHTML=`<section class="board-screen"><div class="board-heading"><h1>${esc(category.name)}</h1><p>${category.questions.length} questions · balanced allocation</p></div><div class="balanced-grid">${[10,20,30,40,50].map((points,i)=>`<section class="balanced-tier"><h2>${points}<span>${names[i]}</span></h2>${category.questions.filter(q=>q.points===points).map((q,j)=>`<button class="tile ${state.used[q.id]?'used':''}" data-q="${esc(q.id)}" aria-label="${points} points, question ${j+1}${state.used[q.id]?', completed — review':''}"><strong>${points}</strong><span>${state.used[q.id]?'✅ Completed':'Question '+(j+1)}</span></button>`).join('')||'<p class="empty-tier">No questions this tier</p>'}</section>`).join('')}</div></section>`;
  main.querySelectorAll('[data-q]').forEach(button=>button.onclick=()=>go({screen:'question',cat:category.id,q:button.dataset.q,pane:'clue'}));
}
