(function () {
  'use strict';
  const engine = window.AoFEngine;
  const data = window.AoFData;
  const state = {position:null, ranks:[], suit:null, actions:{}};
  const $ = id => document.getElementById(id);
  const seatNames = {CO:'Cutoff',BTN:'Button',SB:'Small Blind',BB:'Big Blind'};
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
    if (state.position !== b.dataset.position) {state.position=b.dataset.position;state.actions={};}
    render();
  }));
  document.querySelectorAll('[data-suit]').forEach(b => b.addEventListener('click',() => {state.suit=b.dataset.suit;renderHand();renderResult();}));
  $('clear-hand').addEventListener('click',() => {state.ranks=[];state.suit=null;renderHand();renderResult();});
  $('new-hand').addEventListener('click',() => {state.ranks=[];state.suit=null;state.actions={};render();});
  function renderPosition() {
    document.querySelectorAll('[data-position]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.position===state.position)));
    const prior=engine.priorPositions(state.position);
    $('position-description').textContent=state.position ? (prior.length ? prior.length+' vor dir' : 'Du bist zuerst dran') : 'Zuerst auswählen';
  }
  function renderHand() {
    ['card-one','card-two'].forEach((id,i) => {$(id).textContent=state.ranks[i] || '?';$(id).classList.toggle('empty',!state.ranks[i]);});
    const pair=state.ranks.length===2 && state.ranks[0]===state.ranks[1];
    const hand=engine.normalizeHand(state.ranks,state.suit);
    $('hand-label').textContent=hand || (state.ranks.length===2 ? state.ranks.join('') : state.ranks.length===1 ? 'Zweite Karte' : 'Karten wählen');
    $('hand-hint').textContent=pair ? 'Paar' : hand ? (state.suit==='s' ? 's · gleiche Kartenfarbe' : 'o · verschiedene Farben') : state.ranks.length===2 ? 'Noch s oder o wählen' : 'Zwei Ränge nacheinander';
    $('clear-hand').disabled=state.ranks.length===0;
    document.querySelectorAll('[data-rank]').forEach(b => {b.disabled=!state.position;b.dataset.selected=String(state.ranks.includes(b.dataset.rank));});
    document.querySelectorAll('[data-suit]').forEach(b => {b.disabled=!state.position || state.ranks.length!==2 || pair;b.setAttribute('aria-pressed',String(!pair && state.suit===b.dataset.suit));});
  }
  function renderOpponents() {
    const container=$('opponents');container.replaceChildren();
    const prior=engine.priorPositions(state.position);
    const complete=prior.filter(p => state.actions[p]).length;
    $('action-progress').textContent=prior.length ? complete+' / '+prior.length : '';
    if (!state.position || !prior.length) {
      const p=document.createElement('p');p.className='placeholder';p.textContent=state.position ? 'Niemand vor dir. Du kannst eröffnen.' : 'Wähle zuerst deine Position.';container.append(p);return;
    }
    let previousAllin=false;
    for (const position of prior) {
      const row=document.createElement('div');row.className='action-row';
      const name=document.createElement('div');name.className='opponent-name';
      const seat=document.createElement('span');seat.className='opponent-seat';seat.textContent=position;
      const detail=document.createElement('span');detail.className='opponent-detail';detail.textContent=seatNames[position];
      name.append(seat,detail);
      const group=document.createElement('div');group.className='action-options';group.setAttribute('role','group');group.setAttribute('aria-label','Aktion '+position);
      for (const action of ['fold','allin']) {
        const label=action==='fold' ? 'Fold' : previousAllin ? 'Call · all-in' : 'All-in';
        const b=button(label,{'data-actor':position,'data-action':action,'aria-pressed':String(state.actions[position]===action),'aria-label':position+' '+(action==='fold' ? 'Fold' : previousAllin ? 'Call all-in' : 'All-in')});
        b.addEventListener('click',() => {
          if (state.actions[position]===action) return;
          state.actions[position]=action;
          // A changed earlier action changes the decision faced by later opponents.
          for (const later of prior.slice(prior.indexOf(position)+1)) delete state.actions[later];
          renderOpponents();renderResult();
          const replacement=document.querySelector('[data-actor="'+position+'"][data-action="'+action+'"]');
          if (replacement) replacement.focus({preventScroll:true});
        });group.append(b);
      }
      row.append(name,group);container.append(row);
      if (state.actions[position]==='allin') previousAllin=true;
    }
  }
  function renderResult() {
    const answer=engine.evaluate(state,data);
    const hand=engine.normalizeHand(state.ranks,state.suit);
    let title,description,tone='empty',marker='· · ·';
    let context=state.position ? state.position+' · '+(hand || 'Hand offen') : 'Dein Spot in drei Schritten';
    if (answer.status==='ready') {
      context=state.position+' · '+(answer.action==='walk' ? 'Alle vor dir folden' : answer.allins.length ? answer.allins.join(' + ')+' all-in' : 'Ungeöffneter Pot');
      if (answer.action==='walk') {title='Blinds gewonnen';description='Alle haben gefoldet. Keine Entscheidung nötig.';tone='play';marker='✓';}
      else if (answer.action==='fold') {title='FOLD';description=answer.borderline ? 'Knapper Modellfall. In dieser Tabelle folden.' : 'Diese Hand liegt außerhalb des Spielbereichs.';tone='fold';marker='−';}
      else {title=answer.action==='allin' ? 'ALL-IN' : 'CALL';description=answer.action==='allin' ? 'Mit dieser Hand eröffnen.' : 'Das All-in mitgehen.';tone='play';marker='↗';}
    } else if (answer.status==='error') {title='Tabelle fehlt';description='Die Strategiedaten konnten nicht geladen werden.';}
    else if (!state.position) {title='Position wählen';description='Danach Hand und Gegneraktionen angeben.';}
    else if (!hand) {title='Hand wählen';description=state.ranks.length===2 ? 'Wähle s oder o für deine Karten.' : 'Klicke zwei Kartenränge nacheinander an.';}
    else {title='Aktionen ergänzen';description='Fold oder All-in für jeden Gegner vor dir wählen.';}
    $('result').dataset.tone=tone;$('result-title').textContent=title;$('result-description').textContent=description;$('result-context').textContent=context;$('result-marker').textContent=marker;
    $('result-hand').textContent=hand || '—';$('result-table').textContent=answer.node ? 'Tabelle '+data.ranges[answer.node].label : '8-BB-Standard';
  }
  function render() {renderPosition();renderHand();renderOpponents();renderResult();}
  render();
})();
