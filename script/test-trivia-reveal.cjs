const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_CHROME});
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(process.env.QUIZ_URL||'http://127.0.0.1:4013/random-deviations/trivia/');
    await page.locator('#settings').click();await page.locator('#addteam').click();
    await page.getByRole('button',{name:'Save team',exact:true}).click();await page.locator('#home').click();
    await page.locator('.category').first().click();
    assert.equal(await page.locator('.tile').count(),5);
    assert(await page.locator('.tile').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage.includes('data:image')));
    await page.screenshot({path:'/tmp/trivia-restored-strips.png'});
    async function reveal(){await page.locator('.tile').first().click();await page.locator('#ready').click();await page.locator('#reveal').click();await page.locator('.answer-unified').waitFor();}
    await reveal();
    const sizes=[];
    for(const [width,height]of [[1440,900],[768,1024],[390,844],[320,568],[844,390]]){
      await page.setViewportSize({width,height});
      await page.waitForFunction(w=>document.querySelector('.answer-unified')?.dataset.revealWidth===String(w),width);
      assert.equal(await page.locator('.answer-screen [role="tablist"]').count(),0);
      assert.equal(await page.locator('.score-pane').count(),0);
      const geometry=await page.evaluate(()=>{
        const left=document.querySelector('.reveal-answer').getBoundingClientRect(),right=document.querySelector('.reveal-image').getBoundingClientRect(),bottom=document.querySelector('.reveal-clues').getBoundingClientRect();
        return {left:left.x,right:right.x,cluesBelow:bottom.y>=left.bottom-1,overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert(geometry.left<geometry.right);assert(geometry.cluesBelow);assert(!geometry.overflow);
      assert(await page.locator('#award').isVisible());
      await page.screenshot({path:`/tmp/trivia-unified-answer-${width}x${height}.png`,animations:'disabled'});
      sizes.push({width,height,...geometry});
    }
    await page.setViewportSize({width:1440,height:900});
    await page.waitForFunction(()=>document.querySelector('.answer-unified')?.dataset.revealWidth==='1440');
    await page.locator('#award').click();
    await page.locator('#split-0').fill('6');await page.locator('#split-1').fill('6');await page.locator('#applyaward').click();
    await page.locator('#split-total').filter({hasText:/exceeds/}).waitFor();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')).teams.map(t=>t.score)),[0,0]);
    await page.locator('#split-0').fill('3.5');await page.locator('#split-1').fill('6.5');
    await page.setViewportSize({width:390,height:844});
    await page.waitForFunction(()=>document.querySelector('.answer-unified')?.dataset.revealWidth==='390');
    assert.equal(await page.locator('#split-0').inputValue(),'3.5');
    await page.locator('#applyaward').click();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')).teams.map(t=>t.score)),[3.5,6.5]);
    assert(await page.locator('#award').isDisabled());
    await page.locator('#undo').click();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')).teams.map(t=>t.score)),[0,0]);
    await page.locator('#award').click();await page.locator('#split-0').fill('3.5');await page.locator('#split-1').fill('6.5');await page.locator('#applyaward').click();
    await page.reload();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')).teams.map(t=>t.score)),[3.5,6.5]);
    await page.locator('.category').first().click();await reveal();
    assert(await page.locator('#award').isDisabled());await page.locator('#undo').click();
    assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('curiosity-club-v1')).teams.map(t=>t.score)),[0,0]);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({strips:true,sizes,splitPoints:true,overAwardRejected:true,undo:true,decimalRestore:true,errors},null,2));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
