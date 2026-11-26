'use strict';
function fitScoreboard(){
  document.querySelectorAll('.scorestrip .team').forEach(team=>{
    const name=team.querySelector('.teamname'),score=team.querySelector('.score'),rank=team.querySelector('.rank');
    if(!name||!score||!rank)return;
    const css=getComputedStyle(team),label=team.querySelector('.team-label');
    const width=team.clientWidth-parseFloat(css.paddingLeft)-parseFloat(css.paddingRight);
    const height=team.clientHeight-parseFloat(css.paddingTop)-parseFloat(css.paddingBottom);
    const maximum=Math.max(8,Math.floor(height));
    // Keep a useful name area while allowing every score digit to remain visible.
    const minimumLabel=rank.offsetWidth+parseFloat(getComputedStyle(label).gap)+Math.min(32,width*.25);
    const scoreWidth=Math.max(16,width-parseFloat(css.gap)-minimumLabel);
    function fit(element,minimum,fits){
      let low=minimum,high=maximum,best=minimum;
      while(low<=high){const size=Math.floor((low+high)/2);element.style.fontSize=size+'px';if(fits()){best=size;low=size+1;}else high=size-1;}
      element.style.fontSize=best+'px';
    }
    fit(score,8,()=>score.offsetWidth<=scoreWidth);
    fit(name,Math.min(12,maximum),()=>name.scrollWidth<=name.clientWidth);
  });
}
if(document.fonts)document.fonts.ready.then(fitScoreboard);
