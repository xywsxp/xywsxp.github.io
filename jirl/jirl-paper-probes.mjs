import assert from 'node:assert/strict';

// Finite witnesses only: these are not a JIRL implementation or general proofs.
const sub = (a, b) => [...a].every(x => b.has(x));
const close = (roots, rules) => {
  const u = new Set(roots);
  for (;;) {
    const old = u.size;
    for (const [ps, h] of rules) if (sub(ps, u)) u.add(h);
    if (u.size === old) return u;
  }
};
const powers = xs => Array.from({length: 2 ** xs.length}, (_, m) =>
  new Set(xs.filter((_, i) => (m & (2 ** i)) !== 0)));
const consistent = (e, roots, rules, ngs) => {
  const u = close([...roots, ...e], rules);
  return !ngs.some(n => sub(n, u));
};
const emit = (id, expected, observed) => process.stdout.write(
  JSON.stringify({id, expected, observed, result: 'PASS'}) + '\n');

for (let n = 1; n <= 7; n++) {
  const a = Array.from({length: n}, (_, i) => `a${i}`);
  const b = Array.from({length: n}, (_, i) => `b${i}`);
  const rules = a.flatMap((x, i) => [[new Set([x]), `x${i}`], [new Set([b[i]]), `x${i}`]]);
  rules.push([new Set(a.map((_, i) => `x${i}`)), 'z']);
  const supports = powers(a.flatMap((x, i) => [x, b[i]])).filter(e => close(e, rules).has('z'));
  // For a monotone predicate, no single-element deletion succeeding is equivalent to minimality.
  const labels = supports.filter(e => [...e].every(x => !close([...e].filter(y => y !== x), rules).has('z')));
  assert.equal(labels.length, 2 ** n);
  assert(labels.every(e => e.size === n));
}
emit('JIRL-P14', 'Positive OR family has exactly 2^n minimal supports', {testedN: '1..7', lastLabels: 128});

const rs = [[new Set(['a']), 'x'], [new Set(['b']), 'y']];
const ngs = [new Set(['x', 'y'])];
const envs = powers(['a', 'b']);
for (const e of envs) for (const f of envs) {
  if (sub(f, e) && consistent(e, [], rs, ngs)) assert(consistent(f, [], rs, ngs));
}
assert(close(['a'], rs).has('x') && consistent(new Set(['a']), [], rs, ngs));
assert(close(['b'], rs).has('y') && consistent(new Set(['b']), [], rs, ngs));
assert(!consistent(new Set(['a', 'b']), [], rs, ngs));
emit('JIRL-P15', 'Claimwise labels are insufficient for joint consistency', {xLabel: ['a'], yLabel: ['b'], unionConsistent: false});

const cycle = [[new Set(['p']), 'q'], [new Set(['q']), 'p']];
assert.equal(close([], cycle).size, 0);
assert.equal(close(['p'], cycle).size, 2);
const isFixed = u => sub(close(u, cycle), u);
assert(isFixed(new Set()) && isFixed(new Set(['p', 'q'])));
emit('JIRL-P16', 'Least fixed point is unique, fixed points need not be', {least: [], largerFixedPoint: ['p', 'q']});

const branchP = {x: 1, y: 1};
const branchQ = {x: 2, y: 2};
assert(branchP.x === branchP.y && branchQ.x === branchQ.y);
const skew = {x: branchP.x, y: branchQ.y};
assert.notEqual(skew.x, skew.y);
const acyclicP = [['p', 'q']];
const acyclicQ = [['q', 'p']];
const mixed = [...acyclicP, ...acyclicQ];
assert(mixed.some(([x, y]) => mixed.some(([u, v]) => u === y && v === x)));
emit('JIRL-P17', 'Per-lineage or per-edge newest mixtures break coherent invariants', {branches: [branchP, branchQ], skew, unionHasCycle: true});

// Same declared interface, both providers conform, implementation-sensitive consumer differs.
const provider1 = () => 1;
const provider2 = () => 2;
assert(provider1() >= 0 && provider2() >= 0);
const consumer = p => p() === 1 ? 'passed' : 'refuted';
assert.notEqual(consumer(provider1), consumer(provider2));
emit('JIRL-P18', 'Provider conformance alone does not imply exact cold-verdict equality', {sameContract: 'result>=0', old: consumer(provider1), next: consumer(provider2)});

// A safe terminal IA state has no uncontrolled predecessor to an illegal state.
const illegal = new Set(['bad']);
const oh = [['emit', 'output', 'bad'], ['inside', 'internal', 'bad']];
let losing = new Set(illegal);
for (;;) {
  const old = losing.size;
  for (const [s, , t] of oh) if (losing.has(t)) losing.add(s);
  if (losing.size === old) break;
}
assert(!losing.has('terminal'));
assert(losing.has('emit') && losing.has('inside'));
emit('JIRL-P19', 'IA compatibility does not reject safe termination via empty input quantification', {safeTerminalCompatible: true, losing: [...losing]});

// Query collection membership remains an input even when no records matched previously.
const q = xs => xs.filter(x => x === 'tenant');
assert.deepEqual(q([]), []);
assert.deepEqual(q(['irrelevant']), []);
assert.deepEqual(q(['tenant']), ['tenant']);
const cold = xs => q(xs).length === 0 ? 'passed' : 'refuted';
assert.notEqual(cold([]), cold(['tenant']));
emit('JIRL-P20', 'Empty matches do not erase collection dependencies', {before: cold([]), after: cold(['tenant'])});

let cases = 0;
// Exact complete projections: source numeric value, query collection, strengthened threshold.
for (const value of [-1, 0, 1, 2]) for (const threshold of [0, 1]) for (const inventory of [[], ['tenant']]) {
  const old = {value: 0, threshold: 0, inventory: []};
  const next = {value, threshold, inventory};
  const projections = x => [JSON.stringify([x.value, x.threshold]), JSON.stringify(x.inventory)];
  const evals = [p => {const [v, t] = JSON.parse(p); return v >= t ? 'passed' : 'refuted';},
    p => JSON.parse(p).includes('tenant') ? 'refuted' : 'passed'];
  const ps0 = projections(old), ps1 = projections(next);
  const previous = ps0.map((p, i) => evals[i](p));
  const inc = ps1.map((p, i) => p === ps0[i] ? previous[i] : evals[i](p));
  const fresh = ps1.map((p, i) => evals[i](p));
  assert.deepEqual(inc, fresh);
  cases++;
}
emit('JIRL-P21', 'Finite complete-projection cache agrees with cold verdicts', {cases, scope: 'two pure finite check functions, not a general evaluator implementation'});
