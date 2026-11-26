'use strict';
function splitAwardForm(question){
  const remaining=TriviaScoring.remaining(question,state.multiplier,state.ledger),logs=state.ledger.filter(l=>l.q===question.id);
  if(!state.teams.some(t=>t.id===awardTeamId))awardTeamId=state.teams[0].id;
  return `<section class="reveal-award" aria-label="Award question points"><div class="reveal-award-actions"><button class="primary" id="award" aria-expanded="${!!view.awardOpen}" aria-controls="award-split-panel" ${remaining<=0?'disabled':''}>Award points</button><button id="undo" ${logs.length?'':'disabled'}>Undo last award</button><span id="award-budget">${remaining} of ${question.points*state.multiplier} points remaining</span></div><form id="award-split-panel" ${view.awardOpen?'':'hidden'}><p>Split the remaining points between teams, or give partial credit to one team. Up to two decimal places.</p><div class="split-team-inputs">${state.teams.map((team,i)=>`<label for="split-${i}">${esc(team.name)}<input id="split-${i}" data-split-team="${esc(team.id)}" type="number" min="0" max="${remaining}" step="0.01" value="${esc(view.awardDraft?.[team.id]??(team.id===awardTeamId?remaining:0))}" required></label>`).join('')}</div><p id="split-total" role="status"></p><div><button id="applyaward" class="primary" type="submit">Apply split</button><button id="cancelaward" type="button">Cancel</button></div></form>${logs.length?`<p class="award-history">Awarded: ${logs.map(l=>`${esc(state.teams.find(t=>t.id===l.team)?.name||'Team')} +${l.delta}`).join(' · ')}</p>`:''}</section>`;
}
function wireSplitAward(question){
  const form=$('award-split-panel'),toggle=$('award');
  function update(){
    const amounts=[...form.querySelectorAll('[data-split-team]')].map(input=>Number(input.value));
    const total=amounts.reduce((sum,value)=>sum+Math.round(value*100),0)/100;
    $('split-total').textContent=`Split total: ${Number.isFinite(total)?total:'—'} / ${TriviaScoring.remaining(question,state.multiplier,state.ledger)} available points`;
  }
  toggle.onclick=()=>{form.hidden=!form.hidden;view.awardOpen=!form.hidden;toggle.setAttribute('aria-expanded',String(!form.hidden));if(!form.hidden){update();form.querySelector('input').focus();}};
  $('cancelaward').onclick=()=>{form.hidden=true;view.awardOpen=false;delete view.awardDraft;toggle.setAttribute('aria-expanded','false');toggle.focus();};
  form.addEventListener('input',()=>{view.awardDraft=Object.fromEntries([...form.querySelectorAll('[data-split-team]')].map(input=>[input.dataset.splitTeam,input.value]));update();});
  form.onsubmit=event=>{
    event.preventDefault();
    const amounts=Object.fromEntries([...form.querySelectorAll('[data-split-team]')].map(input=>[input.dataset.splitTeam,Number(input.value)]));
    try{
      const result=TriviaScoring.award(state.teams,state.ledger,question,state.multiplier,amounts,crypto.randomUUID());
      state.teams=result.teams;state.ledger=result.ledger;state.used[question.id]=true;
      const first=state.teams.find(t=>amounts[t.id]>0);awardTeamId=first.id;
      scorePage=Math.floor(orderedTeams().findIndex(t=>t.id===first.id)/slots());
      view.awardOpen=false;delete view.awardDraft;save();render();announce('Points awarded: '+state.teams.filter(t=>amounts[t.id]>0).map(t=>`${t.name} +${amounts[t.id]}`).join(', '));
    }catch(error){$('split-total').textContent=error.message;}
  };
  $('undo').onclick=()=>{const result=TriviaScoring.undo(state.teams,state.ledger,question.id);state.teams=result.teams;state.ledger=result.ledger;view.awardOpen=false;delete view.awardDraft;save();render();announce('Last award transaction undone.');};
  if(view.awardOpen)update();
}
function renderUnifiedAnswer(category,question){
  const images=gallery(question)||'<div class="reveal-image-empty">No answer image for this question.</div>';
  $('main').innerHTML=`<section class="frame answer-screen answer-unified" data-reveal-width="${innerWidth}"><div class="frame-meta"><span class="eyebrow">Answer · ${question.points} points</span><div class="meta-actions"><button id="showsources">Sources</button><button id="showguide">Scoring guide</button></div></div><div class="screen-body"><div class="reveal-pair"><article class="reveal-answer"><h1 class="answer">${esc(question.answer)}</h1></article><aside class="reveal-image" aria-label="Answer image">${images}</aside></div><section class="reveal-clues" aria-label="How the clues connect"><h2>How the clues connect</h2><p>${esc(question.explanation)}</p><ol class="links">${clueLinks(question).join('')}</ol></section>${splitAwardForm(question)}</div><div class="screen-controls"><button id="reviewclue">Review question</button><button class="primary" id="complete">Board →</button></div></section>`;
  wireGallery();wireSplitAward(question);
  $('complete').onclick=()=>finish(question,category);
  $('reviewclue').onclick=()=>openText('Question',question.clue);
  $('showsources').onclick=()=>openSources(question);
  $('showguide').onclick=()=>openText('Accepted answer & scoring',guide(question));
}
