// Run with NODE_PATH pointing to Playwright and QUIZ_CHROME to Chrome if needed.
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.QUIZ_CHROME});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(pathToFileURL(path.resolve(process.env.QUIZ_FILE || 'random-deviations/trivia/index.html')).href);
    assert.equal(await page.locator('.category').count(),10);
    for(let i=0;i<10;i++) {
      await page.locator('.category').nth(i).click();
      assert.equal(await page.locator('.tile').count(),5);
      await page.locator('#home').click();
    }
    const layouts=[];
    for(const [width,height] of [[1440,900],[768,1024],[390,844],[320,568]]) {
      await page.setViewportSize({width,height});
      await page.waitForFunction(()=>[...document.querySelectorAll('.cover img')].every(i=>i.complete&&i.naturalWidth>0));
      const result=await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,categories:document.querySelectorAll('.category').length}));
      assert.equal(result.overflow,false);
      layouts.push(result);
    }
    await page.setViewportSize({width:1440,height:900});
    await page.locator('.category').first().click();
    await page.locator('.tile').first().click();
    assert.equal(await page.locator('.answer-screen').count(),0);
    await page.getByRole('button',{name:'Ready to check →',exact:true}).click();
    await page.getByRole('heading',{name:'Answers locked in?'}).waitFor();
    assert.equal(await page.locator('#reveal').isDisabled(),true);
    assert.equal(await page.locator('.answer-screen').count(),0);
    await page.locator('#reveal').click();
    await page.locator('.answer-screen').waitFor();
    await page.locator('#award').click();
    const scores=await page.locator('.team .score').allTextContents();
    assert(scores.some(score=>Number(score)>0));
    await page.locator('#complete').click();
    await page.reload();
    assert.deepEqual(await page.locator('.team .score').allTextContents(),scores);
    await page.locator('.category').first().click();
    assert.equal(await page.locator('.tile.used').count(),1);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({layouts,errors,categories:10,tilesPerCategory:5,safetyReveal:true,scoring:true,persistence:true},null,2));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
