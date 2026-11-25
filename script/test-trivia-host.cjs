const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_CHROME});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',dialog=>dialog.accept());
    await page.goto(process.env.QUIZ_URL||'http://127.0.0.1:4012/random-deviations/trivia/');
    await page.locator('#shuffle').click(); // Missing ratings sends host to team setup.
    await page.getByRole('heading',{name:'Host desk',exact:true}).waitFor();
    assert.equal(await page.locator('[data-rating]').count(),10);
    const before=await page.locator('[data-radar-profile]').getAttribute('points');
    await page.locator('#teamname').fill('Alpha');
    await page.locator('#rating-0').press('Home');
    assert.equal(await page.locator('#rating-value-0').innerText(),'0');
    await page.locator('#rating-0').press('End');
    assert.equal(await page.locator('#rating-value-0').innerText(),'10');
    assert.notEqual(await page.locator('[data-radar-profile]').getAttribute('points'),before);
    await page.getByRole('button',{name:'Save team',exact:true}).click();
    await page.getByRole('button',{name:'Add team',exact:true}).click();
    await page.locator('#teamname').fill('Bravo');
    await page.getByRole('button',{name:'Save team',exact:true}).click();
    await page.locator('#teamselect').selectOption('t1');
    assert.equal(await page.locator('#rating-0').inputValue(),'10');
    for(const width of [390,768,1440]){
      await page.setViewportSize({width,height:900});
      await page.locator('[data-radar-profile]').waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
      await page.screenshot({path:`/tmp/trivia-host-${width}.png`});
    }
    await page.locator('#balancedshuffle').click();
    await page.locator('.category').first().waitFor();
    const snapshot=await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')));
    assert(snapshot.teams.every(t=>t.ratingsConfirmed));assert.equal(snapshot.teams[0].ratings[Object.keys(snapshot.teams[0].ratings)[0]],10);
    assert.equal(snapshot.quizIds.length,50);
    assert(snapshot.balanceReport.spread<snapshot.balanceReport.baselineSpread);
    const allocated=snapshot.balanceReport.categories.map(c=>c.count);
    assert(allocated.some(n=>n!==5));
    for(let i=0;i<10;i++){
      await page.locator('.category').nth(i).click();
      assert.equal(await page.locator('.balanced-tier .tile').count(),allocated[i]);
      await page.locator('.balanced-tier .tile').first().click();
      await page.locator('.question-screen').waitFor();
      await page.locator('#home').click();
    }
    await page.reload();
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')));
    assert.deepEqual(restored.quizIds,snapshot.quizIds);
    assert.deepEqual(restored.teams,snapshot.teams);
    const migration=await page.evaluate(()=>{
      const old=fresh();old.teams[0].score=70;const loaded=validateGame(old);
      const invalid=JSON.parse(localStorage.getItem('curiosity-club-v1'));invalid.quizIds.pop();
      let rejected=false;try{validateGame(invalid);}catch{rejected=true;}
      return {oldScore:old.teams[0].score,confirmed:old.teams[0].ratingsConfirmed,legacyQuestions:loaded.b.flatMap(c=>c.questions).length,rejected};
    });
    assert.deepEqual(migration,{oldScore:70,confirmed:false,legacyQuestions:50,rejected:true});
    await page.locator('#settings').click();
    assert.equal(await page.locator('#rating-0').inputValue(),'10');
    await page.locator('#teamselect').selectOption('t2');
    assert.equal(await page.locator('#rating-0').inputValue(),'5');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({ratings:true,radar:true,teamIsolation:true,shuffle:true,allocation:allocated,report:snapshot.balanceReport,restore:true,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
