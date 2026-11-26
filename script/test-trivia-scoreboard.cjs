const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_CHROME});
  try{
    const page=await browser.newPage({reducedMotion:'reduce'}),errors=[],results=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.QUIZ_URL||'http://127.0.0.1:4000/random-deviations/trivia/');
    await page.locator('.teamname').waitFor();
    for(const width of [320,390,768,1440,1920])for(const count of [1,2,4,6,8]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(count=>{
        const names=['Alpha','Bravo','A very long team name at 32 chars','Delta','Echo','Foxtrot','Golf','Hotel'];
        const scores=[0,12345.75,-999999.99,1000000,125,42,10,-1.25];
        state.teams=Array.from({length:count},(_,i)=>({id:'t'+i,name:names[i],score:scores[i]}));scorePage=0;leaderboard();
      },count);
      const check=await page.evaluate(()=>{
        const family=getComputedStyle(document.querySelector('.category h2')).fontFamily;
        return [...document.querySelectorAll('.team')].map(team=>{
          const name=team.querySelector('.teamname'),score=team.querySelector('.score'),n=name.getBoundingClientRect(),s=score.getBoundingClientRect(),t=team.getBoundingClientRect();
          const ns=getComputedStyle(name),ss=getComputedStyle(score);
          return {id:team.dataset.team,family:ns.fontFamily===family&&ss.fontFamily===family,weight:ns.fontWeight==='800'&&ss.fontWeight==='800',shadow:ss.textShadow,nameSize:parseFloat(ns.fontSize),scoreSize:parseFloat(ss.fontSize),noOverlap:n.right<=s.left+1,contained:n.left>=t.left&&s.right<=t.right&&n.top>=t.top&&n.bottom<=t.bottom+1&&s.top>=t.top&&s.bottom<=t.bottom+1,scoreComplete:score.scrollWidth<=score.clientWidth+1,title:name.title};
        });
      });
      for(const item of check){assert(item.family&&item.weight);assert.equal(item.shadow,'none');assert(item.noOverlap&&item.contained&&item.scoreComplete,JSON.stringify({width,count,...item}));}
      if(count===1&&width>=768)assert(check[0].nameSize>=32&&check[0].scoreSize>=32);
      if(count===8){
        const first=check[0].id;await page.locator('#scorenext').click();
        assert.notEqual(await page.locator('.team').first().getAttribute('data-team'),first);
        assert(await page.locator('.team .score').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>0));
      }
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      results.push({width,count,sizes:check.map(x=>[x.nameSize,x.scoreSize])});
    }
    for(const width of [390,1440]){
      await page.setViewportSize({width,height:900});
      await page.evaluate(()=>{state.teams=[{id:'a',name:'Team Alpha',score:140},{id:'b',name:'Team Bravo',score:85}];scorePage=0;leaderboard();});
      await page.screenshot({path:`/tmp/trivia-scoreboard-${width}.png`,animations:'disabled'});
    }
    assert.deepEqual(errors,[]);console.log(JSON.stringify({results,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
