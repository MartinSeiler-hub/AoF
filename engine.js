(function (root) {
  'use strict';
  const POSITIONS = ['CO', 'BTN', 'SB', 'BB'];
  const RANKS = 'AKQJT98765432';
  const NODES = [['A1'], ['A2', 'B1_BTN'], ['A3', 'B1_SB', 'B3', 'C2'], [null, 'B2', 'B4', 'C3', 'C1', 'C4', 'D1', 'D2']];
  function normalizeHand(ranks, suit) {
    if (!Array.isArray(ranks) || ranks.length !== 2 || ranks.some(r => typeof r !== 'string' || r.length !== 1 || !RANKS.includes(r))) return null;
    const [a,b] = [...ranks].sort((x,y) => RANKS.indexOf(x) - RANKS.indexOf(y));
    if (a === b) return a+b;
    return suit === 's' || suit === 'o' ? a+b+suit : null;
  }
  function priorPositions(position) {
    const index = POSITIONS.indexOf(position);
    return index < 0 ? [] : POSITIONS.slice(0,index);
  }
  function evaluate(input, data) {
    const state = input || {};
    const seat = POSITIONS.indexOf(state.position);
    if (seat < 0) return {status:'incomplete', missing:'position'};
    const actions = state.actions || {};
    const before = priorPositions(state.position);
    if (before.some(p => actions[p] !== 'fold' && actions[p] !== 'allin')) return {status:'incomplete', missing:'actions'};
    const mask = before.reduce((m,p,i) => m | (actions[p] === 'allin' ? (1 << i) : 0),0);
    if (seat === 3 && mask === 0) return {status:'ready', action:'walk', node:null, hand:normalizeHand(state.ranks,state.suit), allins:[], borderline:false};
    const hand = normalizeHand(state.ranks,state.suit);
    if (!hand) return {status:'incomplete', missing:'hand'};
    const node = NODES[seat][mask];
    const range = data && data.ranges && data.ranges[node];
    if (!range || !Array.isArray(range.play) || !Array.isArray(range.borderlineFold)) return {status:'error', missing:'strategy'};
    const play = range.play.includes(hand);
    return {status:'ready',action:play ? (mask === 0 ? 'allin' : 'call') : 'fold',node,hand,allins:before.filter(p => actions[p] === 'allin'),borderline:!play && range.borderlineFold.includes(hand)};
  }
  const api = Object.freeze({POSITIONS,RANKS,normalizeHand,priorPositions,evaluate});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AoFEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
