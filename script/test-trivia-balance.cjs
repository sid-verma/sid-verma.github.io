const assert=require('node:assert/strict');
const fs=require('node:fs');
const Balance=require('../random-deviations/trivia/balance.js');
const html=fs.readFileSync('random-deviations/trivia/index.html','utf8');
const pool=JSON.parse(html.match(/<script id="question-pool"[^>]*>([\s\S]*?)<\/script>/)[1]);
const profile=(id,fn)=>({id,ratings:Object.fromEntries(pool.map((c,i)=>[c.id,fn(i)]))});
const rng=seed=>()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
const cases={
  uniform:[profile('a',()=>5),profile('b',()=>5)],
  skew:[profile('a',i=>i===0?10:5),profile('b',()=>5)],
  complementary:[profile('a',i=>i<5?9:2),profile('b',i=>i<5?2:9)],
  dominant:[profile('a',()=>10),profile('b',()=>0)],
  four:[profile('a',i=>i%3?2:9),profile('b',i=>i%2?9:3),profile('c',i=>i<3?10:4),profile('d',()=>5)]
};
let trials=0;
for(const [name,teams] of Object.entries(cases))for(let seed=1;seed<=30;seed++){
  const {bank,report}=Balance.draw(pool,teams,[],rng(seed));
  const questions=bank.flatMap(c=>c.questions);
  assert.equal(questions.length,50);
  assert.equal(new Set(questions.map(q=>q.id)).size,50);
  assert(bank.every(c=>c.questions.length>=1));
  for(const points of [10,20,30,40,50])assert.equal(questions.filter(q=>q.points===points).length,10);
  assert(report.spread<=report.baselineSpread+1e-9);
  if(name==='skew'){
    assert(report.spread<report.baselineSpread);
    assert(bank[0].questions.length<5);
    assert(report.categories[0].weight<report.categories[1].weight);
  }
  if(name==='uniform')assert(bank.every(c=>c.questions.length===5));
  trials++;
}
const minimal=pool.map(c=>({...c,questions:[10,20,30,40,50].map(p=>c.questions.find(q=>q.points===p))}));
assert(Balance.draw(minimal,cases.skew,[],rng(3)).bank.every(c=>c.questions.length===5));
const ordered=Balance.draw(pool,cases.four,[],rng(99));
const reversed=Balance.draw(pool,[...cases.four].reverse(),[],rng(99));
assert.deepEqual(ordered.bank.flatMap(c=>c.questions.map(q=>q.id)),reversed.bank.flatMap(c=>c.questions.map(q=>q.id)));
for(const invalid of [-1,11,NaN,1.5,'8'])assert.throws(()=>Balance.ratings({ratings:{[pool[0].id]:invalid}},pool));
assert(Object.values(Balance.ratings({},pool)).every(x=>x===5));
assert.throws(()=>Balance.draw(pool,[]));
console.log(JSON.stringify({trials,scenarios:Object.keys(cases),constraints:true,teamOrderInvariant:true,legacyDefaults:true,invalidRatingsRejected:true}));
