const test=require('node:test');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const engine=require('../engine.js');
const data=require('../strategy-data.js');
const hashes=require('./reviewed-range-hashes.json');
const cases=[
 ['CO',{},'A1'],
 ['BTN',{CO:'fold'},'A2'],['BTN',{CO:'allin'},'B1_BTN'],
 ['SB',{CO:'fold',BTN:'fold'},'A3'],['SB',{CO:'allin',BTN:'fold'},'B1_SB'],['SB',{CO:'fold',BTN:'allin'},'B3'],['SB',{CO:'allin',BTN:'allin'},'C2'],
 ['BB',{CO:'fold',BTN:'fold',SB:'allin'},'C1'],['BB',{CO:'allin',BTN:'fold',SB:'fold'},'B2'],['BB',{CO:'fold',BTN:'allin',SB:'fold'},'B4'],
 ['BB',{CO:'allin',BTN:'allin',SB:'fold'},'C3'],['BB',{CO:'allin',BTN:'fold',SB:'allin'},'C4'],['BB',{CO:'fold',BTN:'allin',SB:'allin'},'D1'],['BB',{CO:'allin',BTN:'allin',SB:'allin'},'D2']
];
test('reviewed data retains its source identity and every independently exported range hash',()=>{
 assert.equal(data.sourceSha256,'9735d6a275bcb5cacfffb27df93d2b696655c72bb251d7b30664468357e4f2bb');
 assert.equal(Object.keys(data.ranges).length,14);
 for(const [node,range] of Object.entries(data.ranges)){
  const actual=crypto.createHash('sha256').update(JSON.stringify({play:range.play,borderlineFold:range.borderlineFold})).digest('hex');
  assert.equal(actual,hashes[node],node);assert.equal(new Set(range.play).size,range.play.length);assert.ok(!range.play.some(h=>range.borderlineFold.includes(h)));
 }
});
for(const [position,actions,node] of cases) test('all 169 hands map to reviewed table '+node,()=>{
 const ranks=engine.RANKS;
 for(let i=0;i<13;i++)for(let j=0;j<13;j++){
  const hand=i===j ? ranks[i]+ranks[j] : i<j ? ranks[i]+ranks[j]+'s' : ranks[j]+ranks[i]+'o';
  const answer=engine.evaluate({position,actions,ranks:[hand[0],hand[1]],suit:hand[2]},data);
  assert.equal(answer.status,'ready');assert.equal(answer.node,node);assert.equal(answer.hand,hand);
  const expected=data.ranges[node].play.includes(hand) ? Object.values(actions).includes('allin') ? 'call':'allin' : 'fold';
  assert.equal(answer.action,expected,node+': '+hand);assert.equal(answer.borderline,data.ranges[node].borderlineFold.includes(hand));
 }
});
test('BTN and SB use separate call ranges against CO',()=>{
 assert.equal(engine.evaluate({position:'BTN',actions:{CO:'allin'},ranks:['A','4'],suit:'s'},data).action,'fold');
 assert.equal(engine.evaluate({position:'SB',actions:{CO:'allin',BTN:'fold'},ranks:['A','4'],suit:'s'},data).action,'call');
});
test('BB walk is resolved without inventing a hand or an all-in decision',()=>{
 const answer=engine.evaluate({position:'BB',actions:{CO:'fold',BTN:'fold',SB:'fold'},ranks:[],suit:null},data);
 assert.equal(answer.action,'walk');assert.equal(answer.node,null);assert.equal(answer.hand,null);
});
test('missing or invalid position, hand, suit and previous actions never produce a recommendation',()=>{
 const good={position:'BB',actions:{CO:'allin',BTN:'fold',SB:'fold'},ranks:['A','K'],suit:'s'};
 for(const patch of [{position:null},{position:'UTG'},{ranks:['A']},{ranks:['1','A']},{ranks:['AA','K']},{ranks:['A','K','Q']},{suit:null},{suit:'hearts'},{actions:{CO:'allin',BTN:'fold'}},{actions:{CO:'raise',BTN:'fold',SB:'fold'}}]) assert.notEqual(engine.evaluate({...good,...patch},data).status,'ready');
 assert.notEqual(engine.evaluate(null,data).status,'ready');
});
test('card input order is normalized, pair never needs s/o, and suit cannot be guessed',()=>{
 assert.equal(engine.normalizeHand(['K','A'],'s'),'AKs');assert.equal(engine.normalizeHand(['2','Q'],'o'),'Q2o');
 assert.equal(engine.normalizeHand(['T','T'],null),'TT');assert.equal(engine.normalizeHand(['A','K'],null),null);
});
test('only earlier positions can affect the recommendation',()=>{
 assert.deepEqual(engine.priorPositions('CO'),[]);assert.deepEqual(engine.priorPositions('BB'),['CO','BTN','SB']);
 assert.equal(engine.evaluate({position:'CO',ranks:['A','A'],actions:{BB:'allin'}},data).action,'allin');
});
test('missing strategy data cannot accidentally recommend playing',()=>{
 assert.equal(engine.evaluate({position:'CO',ranks:['A','A']},{}).status,'error');
});
