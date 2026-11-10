import assert from 'node:assert/strict';

// Finite, hand-declared witnesses for the revision plan; not a general verifier.
const report = (id, observation) => console.log(JSON.stringify({id, observation, result: 'PASS'}));
const subset = (a, b) => [...a].every(x => b.has(x));

const safe = new Set(['', 'req', 'req ok']);
const silent = new Set(['', 'req']);
assert(subset(silent, safe));
// After req, a tau self-loop plus an ok edge has the same finite visible
// language as the non-looping machine, but has an outcome-free infinite run.
const looping = new Set(['', 'req', 'req ok']);
assert.deepEqual(looping, safe);
const loopEdges = [['pending', 'tau', 'pending'], ['pending', 'ok', 'done']];
assert(loopEdges.some(([s,a,t]) => s === 'pending' && a === 'ok' && t === 'done'));
assert(loopEdges.some(([s,a,t]) => s === 'pending' && a === 'tau' && t === 'pending'));
report('AR-P1', {scope:'illustrative sets and edges, not an NS evaluation', silentTraceContained:true, loopingFiniteLanguageEqual:true, outcomeAndLoopEdgesPresent:true});

// For the following one-duty ultimately periodic runs, no outcome occurs.
// F G Wait(e) holds exactly when the cycle continuously waits on the same e.
const stableExternalWait = cycle => cycle[0] !== null && cycle.every(e => e === cycle[0]);
assert(stableExternalWait(['fsync:one']));
assert(!stableExternalWait([null]));
assert(!stableExternalWait(['fsync:one', null, 'fsync:two', null]));
const alternating = ['fsync:one', null, 'fsync:two', null];
assert(alternating.some(Boolean)); // Recurring wait visits alone are insufficient.
report('AR-P2', {scope:'illustrative periodic-wait predicate, not a runtime NS check', constantWaitPredicate:true, noWaitPredicate:false, alternatingWaitPredicate:false});

// A = {epsilon}; B allows no input. Raw N accepts i. Its restricted
// language equals B's, and relative reception is vacuous. A connector
// delivering i violates scope, but the ordinary B-product suppresses i.
const rawInputs = ['', 'i'];
const restrictedInputs = rawInputs.filter(x => x === '');
assert.deepEqual(restrictedInputs, ['']);
const ordinaryProductDeliveries = rawInputs.filter(x => x !== '' && restrictedInputs.includes(x));
assert.equal(ordinaryProductDeliveries.length, 0);
assert(rawInputs.includes('i') && !restrictedInputs.includes('i'));
report('AR-P3', {slotConformance:true, ordinarySlotProductMissesFirstInvalidInput:true, rawDeliveryViolation:'i'});

const before = [{id:'Impl(store)', operands:'old'}];
const after = [{id:'Impl(store)', operands:'changed'}];
const intersectionByName = after.filter(q => before.some(p => p.id === q.id));
const newNames = after.filter(q => !before.some(p => p.id === q.id));
const reusable = after.filter(q => before.some(p => p.id === q.id && p.operands === q.operands));
const recheck = after.filter(q => !reusable.includes(q));
assert.equal(intersectionByName.length, 1);
assert.equal(newNames.length, 0);
assert.equal(reusable.length, 0);
assert.equal(recheck.length, 1);
report('AR-P4', {namePartitionMissesChangedClaim:true, correctedResidualIncludesChangedClaim:true});

const active = supports => new Set(['root', ...supports.filter(([p]) => p === 'root').map(([,q]) => q)]);
const oldActive = active([['root','protected']]);
const newActive = active([]);
assert(oldActive.has('protected') && !newActive.has('protected'));
report('AR-P5', {supportRemovalDropsProtectedActivation:true, preservationMustStartFromOldSubjects:true});

const ids = ['a','b'];
const state = (stage,id) => id === undefined ? stage : `${stage}:${id}`;
const edge = (from,event,to) => ({from,event,to});
const coord = ids.flatMap(i => [
  edge('c0',`req:${i}`,state('c1',i)),
  edge(state('c1',i),`append:${i}`,state('c2',i)),
  edge(state('c2',i),`committed:${i}`,state('c3',i)),
  edge(state('c2',i),`failed:${i}`,state('c4',i)),
  edge(state('c3',i),`ack:${i}`,'cDone'),
  edge(state('c4',i),`fail:${i}`,'cDone'),
]);
const store = ids.flatMap(i => [
  edge('b0',`append:${i}`,state('b1',i)),
  edge(state('b1',i),`cmd_write:${i}`,state('b2',i)),
  edge(state('b2',i),`write_ok:${i}`,state('b3',i)),
  edge(state('b3',i),`cmd_fsync:${i}`,state('b4',i)),
  edge(state('b4',i),`fsync_ok:${i}`,state('b5',i)),
  edge(state('b5',i),`flush_ok:${i}`,state('b6',i)),
  edge(state('b6',i),`committed:${i}`,'bDone'),
  edge(state('b4',i),`fsync_fail:${i}`,state('b7',i)),
  edge(state('b7',i),`flush_fail:${i}`,state('b8',i)),
  edge(state('b8',i),`failed:${i}`,'bDone'),
]);
const shell = ids.flatMap(i => [
  edge('h0',`cmd_write:${i}`,state('hW',i)),
  edge(state('hW',i),`write_ok:${i}`,state('hF',i)),
  edge(state('hF',i),`cmd_fsync:${i}`,state('hPending',i)),
  edge(state('hPending',i),`fsync_ok:${i}`,'hDone'),
  edge(state('hPending',i),`fsync_fail:${i}`,'hDone'),
]);
const participants = {
  req:[0], append:[0,1], committed:[0,1], failed:[0,1], ack:[0], fail:[0],
  cmd_write:[1,2], write_ok:[1,2], cmd_fsync:[1,2], fsync_ok:[1,2], fsync_fail:[1,2],
  flush_ok:[1], flush_fail:[1],
};
const observe = e => {
  const [name,i] = e.split(':');
  if (['req','ack','fail'].includes(name)) return e;
  if (name === 'flush_ok') return `commit_ok:${i}`;
  if (name === 'flush_fail') return `commit_fail:${i}`;
  return null;
};
// Root oracle is declared independently of the connector/store tables.
const rootLanguage = new Set(['']);
for (const i of ids) for (const [commit,outcome] of [['commit_ok','ack'],['commit_fail','fail']]) {
  const path = [`req:${i}`,`${commit}:${i}`,`${outcome}:${i}`];
  for (let n=1;n<=path.length;n++) rootLanguage.add(path.slice(0,n).join(' '));
}
const explore = storeTable => {
  const tables = [coord,storeTable,shell];
  const work = [{q:['c0','b0','h0'],trace:[]}];
  const seen = new Set(), states = new Set(), traces = new Set(), bad = new Set();
  let readyChecks=0, waitStates=0, transientWriteWaitStates=0, indefiniteAllowedFlushWaitStates=0;
  while (work.length) {
    const {q,trace} = work.pop();
    const key = JSON.stringify([q,trace]);
    if (seen.has(key)) continue;
    seen.add(key); states.add(JSON.stringify(q)); traces.add(trace.join(' '));
    if (!rootLanguage.has(trace.join(' '))) bad.add(trace.join(' '));
    const events = new Set(tables.flatMap((es,k) => es.filter(e => e.from === q[k]).map(e => e.event)));
    const next=[];
    for (const event of events) {
      const [name] = event.split(':');
      const ps=participants[name];
      const chosen=ps.map(k => tables[k].find(e => e.from === q[k] && e.event === event));
      if (chosen.some(e => !e)) continue;
      const out=q.slice();
      ps.forEach((k,j) => {out[k]=chosen[j].to;});
      const visible=observe(event);
      next.push({q:out,trace:visible ? [...trace,visible] : trace,event});
    }
    const owed=trace.length>0 && !trace.some(e => /^(ack|fail):/.test(e));
    const writeWait=ids.some(i => q[0]===state('c2',i) && q[1]===state('b2',i) && q[2]===state('hW',i));
    const flushWait=ids.some(i => q[0]===state('c2',i) && q[1]===state('b4',i) && q[2]===state('hPending',i));
    // Both are genuine waits for readiness. H_write makes the first transient;
    // only the matching flush belongs to the contract's indefinite-wait policy.
    const wait=writeWait || flushWait;
    if (wait) waitStates++;
    if (writeWait) transientWriteWaitStates++;
    if (flushWait) indefiniteAllowedFlushWaitStates++;
    if (owed && !wait && storeTable===store) {
      assert(next.some(x => !/^(write_ok|fsync_ok|fsync_fail):/.test(x.event)));
      readyChecks++;
    }
    work.push(...next);
  }
  return {states:states.size,stateHistoryPairs:seen.size,traces:traces.size,bad:[...bad].sort(),readyChecks,waitStates,transientWriteWaitStates,indefiniteAllowedFlushWaitStates};
};
const good=explore(store);
// The four completed branch histories share one raw terminal product state.
assert.equal(good.states,24); assert.equal(good.stateHistoryPairs,27);
assert.equal(good.traces,11); assert.deepEqual(good.bad,[]);
assert.equal(good.waitStates,4);
assert.equal(good.transientWriteWaitStates,2);
assert.equal(good.indefiniteAllowedFlushWaitStates,2);
const mutant=ids.flatMap(i => [edge('b0',`append:${i}`,state('bad',i)),edge(state('bad',i),`committed:${i}`,'bDone')]);
const bad=explore(mutant);
assert.deepEqual(bad.bad,['req:a ack:a','req:b ack:b']);
report('AR-P6',{good,mutant:bad,scope:'two-identifier exact graph product; no physical or universal Wire claim'});

// Exact per-run Ready/NS evaluation for ONE duty on supplied annotated lassos.
// This does not discover executions, validate physical wait annotations,
// establish scheduling/environment premises, or check an arbitrary system.
// It contains no component ownership structure, enabled outcome edge, or
// pending-output list. Structural counterexamples are argued in plan section
// 3.20; the fixtures below test only the supplied formula annotations.
// A lasso is its finite prefix followed by its nonempty cycle forever.
const point = (pending, owned=false, waits=[], outcome=false) => ({pending,owned,waits,outcome});
const evaluateLasso = ({prefix=[],cycle,mayWaitForever=[]}) => {
  assert(cycle.length > 0);
  const represented=[...prefix,...cycle];
  for (const s of represented) {
    assert(s.waits.length === 0 || s.pending);
    assert(!s.outcome || !s.pending);
  }
  const ready=represented.every(s => !s.pending || s.waits.length > 0 || s.owned);
  // F G W_e is true exactly when W_e holds throughout the recurring cycle.
  const persistentAllowed=mayWaitForever.some(e => cycle.every(s => s.waits.includes(e)));
  const recurringOutcome=cycle.some(s => s.outcome);
  // For each pending prefix position, F D may be supplied by a later prefix
  // position or by the cycle. All pending cycle positions see that whole cycle.
  const ns=represented.every((s,k) => !s.pending || persistentAllowed || recurringOutcome ||
    (k < prefix.length && prefix.slice(k).some(t => t.outcome)));
  return {ready,ns};
};
const pending=point(true);
const working=point(true,true);
const waitA=point(true,false,['a']);
const waitB=point(true,false,['b']);
const outcome=point(false,false,[],true);
const finished=point(false);
const cases=[
  {name:'pending_without_owned_or_wait_annotation',cycle:[pending],expected:{ready:false,ns:false}},
  {name:'owned_annotation_without_outcome',cycle:[working],expected:{ready:true,ns:false}},
  {name:'permitted_persistent_wait_annotation',cycle:[waitA],mayWaitForever:['a'],expected:{ready:true,ns:true}},
  {name:'wait_then_owned_annotation_without_outcome',prefix:[waitA],cycle:[working],mayWaitForever:['a'],expected:{ready:true,ns:false}},
  {name:'alternating_wait_and_owned_annotations',cycle:[waitA,working,waitB,working],mayWaitForever:['a','b'],expected:{ready:true,ns:false}},
  {name:'strict_persistent_wait_annotation',cycle:[waitA],expected:{ready:true,ns:false}},
  {name:'strict_transient_wait_then_outcome',prefix:[waitB,working,outcome],cycle:[finished],expected:{ready:true,ns:true}},
  {name:'nonmember_persistent_wait_annotation',cycle:[waitB],mayWaitForever:['a'],expected:{ready:true,ns:false}},
  {name:'owned_annotation_then_permitted_outcome',prefix:[working,outcome],cycle:[finished],expected:{ready:true,ns:true}},
];
const observations=cases.map(fixture => {
  const observed=evaluateLasso(fixture);
  assert.deepEqual(observed,fixture.expected,fixture.name);
  return {name:fixture.name,...observed};
});
report('AR-P7',{scope:'accepted formulas on nine abstract one-duty annotated lassos only; no structural scenarios or alternative semantics implemented',cases:observations});
