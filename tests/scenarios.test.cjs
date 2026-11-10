const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../engine.js');
const catalogue=require('../strategy-data.js');
const {evaluateScenarios}=require('../app.js');

// Chronological columns: CO, BTN, SB. First action varies slowest.
const expected={
 CO:[['','A1']],
 BTN:[['f','A2'],['a','B1_BTN']],
 SB:[['ff','A3'],['fa','B3'],['af','B1_SB'],['aa','C2']],
 BB:[['fff',null],['ffa','C1'],['faf','B4'],['faa','D1'],['aff','B2'],['afa','C4'],['aaf','C3'],['aaa','D2']]
};
for(const [game,model] of Object.entries(catalogue.models))test(game+': every displayed combination uses the correct reviewed range for all 169 hands',()=>{
 for(const [position,paths] of Object.entries(expected)){
  for(let i=0;i<13;i++)for(let j=0;j<13;j++){
   const a=engine.RANKS[Math.min(i,j)],b=engine.RANKS[Math.max(i,j)];
   const suit=i===j?null:i<j?'s':'o',hand=a+b+(suit||'');
   const rows=evaluateScenarios({position,ranks:[a,b],suit},model,engine);
   assert.equal(rows.length,paths.length);
   assert.equal(new Set(rows.map(row=>JSON.stringify(row.actions))).size,paths.length);
   rows.forEach(({actions,answer},index)=>{
    const [code,node]=paths[index];
    assert.equal(Object.values(actions).map(a=>a==='allin'?'a':'f').join(''),code);
    assert.deepEqual(Object.keys(actions),engine.priorPositions(position));
    assert.equal(answer.status,'ready');assert.equal(answer.node,node);
    const action=node===null?'walk':model.ranges[node].play.includes(hand)?code.includes('a')?'call':'allin':'fold';
    assert.equal(answer.action,action,game+'/'+position+'/'+code+'/'+hand);
    assert.equal(answer.borderline,node!==null&&model.ranges[node].borderlineFold.includes(hand));
   });
  }
 }
});
test('unknown position produces no scenario rows',()=>{
 for(const position of [null,'UTG',''])assert.deepEqual(evaluateScenarios({position},catalogue.models['10bb'],engine),[]);
 assert.deepEqual(evaluateScenarios(null,catalogue.models['10bb'],engine),[]);
});
test('missing hand or s/o never produces play/fold recommendations; the BB walk remains valid',()=>{
 for(const hand of [{ranks:[]},{ranks:['A']},{ranks:['A','K'],suit:null}]){
  const rows=evaluateScenarios({position:'BB',...hand},catalogue.models['10bb'],engine);
  assert.equal(rows.length,8);assert.equal(rows[0].answer.action,'walk');
  assert.ok(rows.slice(1).every(row=>row.answer.status==='incomplete'));
 }
});
test('enumeration keeps the selected position and cards unchanged and does not filter to previous action input',()=>{
 const input={position:'SB',ranks:['A','4'],suit:'s',actions:{CO:'allin',BTN:'allin'}};
 const before=JSON.stringify(input);
 const rows=evaluateScenarios(input,catalogue.models['8bb'],engine);
 assert.equal(rows.length,4);assert.equal(rows[2].answer.node,'B1_SB');assert.equal(rows[2].answer.action,'call');
 assert.equal(JSON.stringify(input),before);
});
test('missing range data reports errors instead of inventing scenario recommendations',()=>{
 const rows=evaluateScenarios({position:'BB',ranks:['A','A']},{},engine);
 assert.equal(rows[0].answer.action,'walk');assert.ok(rows.slice(1).every(row=>row.answer.status==='error'));
});
