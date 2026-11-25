const assert = require('node:assert/strict');
const {chromium} = require('playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.QUIZ_CHROME});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    const url=process.env.BLOG_URL || 'http://127.0.0.1:4011/';
    const results=[];
    for(const width of [390,768,1440]) {
      await page.setViewportSize({width,height:900});
      await page.goto(url);
      await page.locator('[data-lw-feed-status]').filter({hasText:/All \d+ posts/}).waitFor();
      const rows=page.locator('[data-lw-post-list] [data-lw-post-row]');
      const total=await rows.count();
      assert(total>=51);
      assert.equal(await rows.filter({visible:true}).count(),total);
      assert.equal((await rows.first().locator('h2').innerText()).trim(),'Random Deviations');
      for(const slug of ['future-of-ai','ml-platform-engineering','causal-discovery'])
        assert.equal(await rows.locator(`a[href="/posts/${slug}/"]`).count(),1);
      const geometry=await page.evaluate(()=>({
        intro:document.querySelector('.lw-home-intro').getBoundingClientRect().top,
        feed:document.querySelector('[data-lw-post-list]').getBoundingClientRect().top,
        catalog:document.querySelector('.lw-bestof').getBoundingClientRect().top,
        overflow:document.documentElement.scrollWidth>innerWidth+1
      }));
      assert(geometry.feed<geometry.catalog);
      assert.equal(geometry.overflow,false);
      assert((await rows.first().boundingBox()).y<900);
      await page.locator('[data-filter-tag="trivia"]').click();
      assert.equal(await rows.filter({visible:true}).count(),1);
      await page.locator('[data-filter-tag="all"]').click();
      assert.equal(await rows.filter({visible:true}).count(),total);
      await page.screenshot({path:`/tmp/homepage-posts-${width}.png`});
      results.push({width,total,latestVisible:true,filter:true});
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({results,errors},null,2));
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
