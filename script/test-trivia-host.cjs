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
    assert(snapshot.quizIds.length<=50&&snapshot.quizIds.length>=10);
    assert(snapshot.balanceReport.spread<snapshot.balanceReport.baselineSpread);
    const allocated=snapshot.balanceReport.categories.map(c=>c.count);
    assert(allocated.some(n=>n!==5));
    for(let i=0;i<10;i++){
      await page.locator('.category').nth(i).click();
      assert.equal(await page.locator('.difficulty-board .tile').count(),allocated[i]);
      assert(await page.locator('.tile').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage.includes('data:image')));
      await page.locator('.difficulty-board .tile').first().click();
      await page.locator('.question-screen').waitFor();
      await page.locator('#home').click();
    }
    await page.reload();
    const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')));
    assert.deepEqual(restored.quizIds,snapshot.quizIds);
    assert.deepEqual(restored.teams,snapshot.teams);
    const migration=await page.evaluate(()=>{
      const old=fresh();old.teams[0].score=70;const loaded=validateGame(old);
      const invalid=JSON.parse(localStorage.getItem('curiosity-club-v1'));invalid.quizIds.shift();
      let rejected=false;try{validateGame(invalid);}catch{rejected=true;}
      const legacy=fresh();legacy.selectionVersion=2;legacy.teams[0].score=70;
      legacy.quizIds=bundledPool.flatMap(c=>[...c.questions.filter(q=>q.points===10).slice(0,2),c.questions.find(q=>q.points===50)].map(q=>q.id));
      legacy.used[legacy.quizIds[1]]=true;const duplicate=legacy.quizIds[1];const migrated=validateGame(legacy);
      return {oldScore:old.teams[0].score,confirmed:old.teams[0].ratingsConfirmed,legacyQuestions:loaded.b.flatMap(c=>c.questions).length,rejected,migratedVersion:legacy.selectionVersion,retainedScore:legacy.teams[0].score,retainedUsed:migrated.b[0].questions[0].id===duplicate};
    });
    assert.deepEqual(migration,{oldScore:70,confirmed:false,legacyQuestions:50,rejected:true,migratedVersion:3,retainedScore:70,retainedUsed:true});
    await page.locator('#settings').click();
    assert.equal(await page.locator('#rating-0').inputValue(),'10');
    await page.locator('#teamselect').selectOption('t2');
    assert.equal(await page.locator('#rating-0').inputValue(),'5');
    // Equal weakness trims only the highest tiers, without adding replacements.
    for(const team of ['t1','t2']){
      await page.locator('#teamselect').selectOption(team);
      await page.locator('#rating-0').press('Home');
      await page.locator('#rating-0').press('ArrowRight');await page.locator('#rating-0').press('ArrowRight');
      await page.getByRole('button',{name:'Save team',exact:true}).click();
    }
    await page.locator('#balancedshuffle').click();await page.locator('.category').first().click();
    assert.equal(await page.locator('.tile').count(),2);assert.equal(await page.locator('.tile-omitted').count(),3);
    assert.deepEqual(await page.locator('.tile strong').allTextContents(),['10','20']);
    await page.screenshot({path:'/tmp/trivia-trimmed-board.png',animations:'disabled'});
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({ratings:true,radar:true,teamIsolation:true,shuffle:true,allocation:allocated,report:snapshot.balanceReport,restore:true,weakCategoryTenTwenty:true,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
