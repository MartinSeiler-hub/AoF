(function (root) {
  'use strict';
  function evaluateScenarios(input, model, engine) {
    const state=input || {};
    if (!engine.POSITIONS.includes(state.position)) return [];
    const prior=engine.priorPositions(state.position);
    return Array.from({length:2 ** prior.length},(_,combination) => {
      const actions=Object.fromEntries(prior.map((position,index) => [position,combination & (1 << (prior.length-index-1)) ? 'allin' : 'fold']));
      const answer=engine.evaluate({position:state.position,ranks:state.ranks,suit:state.suit,actions},model);
      return {actions,answer};
    });
  }
  if (typeof module !== 'undefined' && module.exports) {module.exports={evaluateScenarios};return;}
  const engine = root.AoFEngine;
  const data = root.AoFData;
  const state = {buyIn:data.defaultBuyIn, position:null, ranks:[], suit:null};
  const $ = id => document.getElementById(id);
  const selectedStake = () => data.buyIns.find(stake => stake.id===state.buyIn);
  const selectedModel = () => data.models[selectedStake().model];
  const number = value => String(value).replace('.',',');
  for (const stake of data.buyIns) {
    const option=document.createElement('option');option.value=stake.id;option.textContent='$'+stake.amountUSD;
    $('buy-in').append(option);
  }
  $('buy-in').value=state.buyIn;
  $('buy-in').addEventListener('change',() => {state.buyIn=$('buy-in').value;renderFormat();renderResult();});
  function renderFormat() {
    const stake=selectedStake(),model=selectedModel();
    $('game-format').textContent=model.stackBB+' BB · SB '+number(model.smallBlindBB);
    $('game-format').title='$'+stake.smallBlindUSD+' / $'+stake.bigBlindUSD;
  }
  function button(text, attrs) {
    const element = document.createElement('button');element.type='button';element.textContent=text;
    for (const [key,value] of Object.entries(attrs || {})) element.setAttribute(key,value);
    return element;
  }
  for (const rank of engine.RANKS) {
    const rankNames = {A:'Ass',K:'König',Q:'Dame',J:'Bube',T:'Zehn'};
    const b = button(rank,{'data-rank':rank,'aria-label':'Karte '+(rankNames[rank] || rank)});
    b.addEventListener('click',() => {
      if (state.ranks.length === 2) {state.ranks=[];state.suit=null;}
      state.ranks.push(rank);
      if (state.ranks.length === 2 && state.ranks[0] === state.ranks[1]) state.suit=null;
      renderHand();renderResult();
    });
    $('ranks').append(b);
  }
  document.querySelectorAll('[data-position]').forEach(b => b.addEventListener('click',() => {
    state.position=b.dataset.position;
    render();
  }));
  document.querySelectorAll('[data-suit]').forEach(b => b.addEventListener('click',() => {state.suit=b.dataset.suit;renderHand();renderResult();}));
  $('clear-hand').addEventListener('click',() => {state.ranks=[];state.suit=null;renderHand();renderResult();});
  $('new-hand').addEventListener('click',() => {state.ranks=[];state.suit=null;render();});
  function renderPosition() {
    document.querySelectorAll('[data-position]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.position===state.position)));
  }
  function renderHand() {
    ['card-one','card-two'].forEach((id,i) => {$(id).textContent=state.ranks[i] || '?';$(id).classList.toggle('empty',!state.ranks[i]);});
    const pair=state.ranks.length===2 && state.ranks[0]===state.ranks[1];
    const hand=engine.normalizeHand(state.ranks,state.suit);
    $('hand-label').textContent=hand || (state.ranks.length===2 ? 's / o?' : '—');
    $('clear-hand').disabled=state.ranks.length===0;
    document.querySelectorAll('[data-rank]').forEach(b => {b.disabled=!state.position;b.dataset.selected=String(state.ranks.includes(b.dataset.rank));});
    document.querySelectorAll('[data-suit]').forEach(b => {b.disabled=!state.position || state.ranks.length!==2 || pair;b.setAttribute('aria-pressed',String(!pair && state.suit===b.dataset.suit));});
  }
  function renderResult() {
    const model=selectedModel();
    const hand=engine.normalizeHand(state.ranks,state.suit);
    const prior=engine.priorPositions(state.position);
    const scenarios=evaluateScenarios(state,model,engine);
    $('scenario-context').textContent=state.position ? state.position+(hand ? ' · '+hand : '') : '';
    const status=!state.position ? 'Position wählen' : hand ? '' : state.ranks.length===2 ? 's oder o wählen' : state.ranks.length===1 ? 'Zweite Karte wählen' : 'Hand wählen';
    $('scenario-status').textContent=status;$('scenario-status').hidden=!status;
    $('scenario-table').hidden=!state.position;
    const header=$('scenario-head');header.replaceChildren();
    for (const label of [...(prior.length ? prior : ['Vor dir']),'Du']) {
      const cell=document.createElement('th');cell.scope='col';cell.textContent=label;header.append(cell);
    }
    const body=$('scenario-rows');body.replaceChildren();
    for (const {actions,answer} of scenarios) {
      const row=document.createElement('tr');row.dataset.scenario=prior.map(p=>actions[p]==='allin' ? 'a' : 'f').join('') || 'open';
      let previousAllin=false;
      for (const position of prior) {
        const cell=document.createElement('td');
        const allin=actions[position]==='allin';
        cell.textContent=allin ? previousAllin ? 'Call' : 'All-in' : 'Fold';
        cell.className=allin ? 'scenario-allin' : 'scenario-fold';
        if (allin && previousAllin) cell.setAttribute('aria-label',position+' callt all-in');
        row.append(cell);previousAllin=previousAllin || allin;
      }
      if (!prior.length) {const cell=document.createElement('td');cell.textContent='Niemand';row.append(cell);}
      const cell=document.createElement('td'),badge=document.createElement('span');badge.className='decision';
      const action=answer.status==='ready' ? answer.action : answer.status==='error' ? 'error' : 'empty';
      badge.dataset.action=action;
      badge.textContent={allin:'ALL-IN',call:'CALL',fold:'FOLD',walk:'Blinds',empty:'—',error:'Fehlt'}[action];
      const detail=action==='walk' ? 'Blinds gewonnen: alle vor dir folden.' : action==='error' ? 'Tabelle fehlt. Bitte neu laden.' : action==='empty' ? status : (answer.borderline ? 'Knapper Modellfall. ' : '')+'Tabelle '+model.ranges[answer.node].label;
      badge.title=detail;badge.setAttribute('aria-label',badge.textContent+'. '+detail);
      cell.className='scenario-decision';cell.append(badge);row.append(cell);body.append(row);
    }
  }
  function render() {renderPosition();renderHand();renderResult();}
  renderFormat();render();
})(typeof globalThis !== 'undefined' ? globalThis : this);
