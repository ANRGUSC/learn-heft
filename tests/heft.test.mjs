// Tests for the HEFT engine embedded in index.html.
// Run with:  node --test tests/
//
// The engine is the block of pure functions between the ENGINE-START and
// ENGINE-END markers in index.html. It is extracted and evaluated here so the
// single-file app stays single-file while the scheduling logic is still tested.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, '..', 'index.html'), 'utf8');
const m = html.match(/\/\/ ENGINE-START([\s\S]*?)\/\/ ENGINE-END/);
assert.ok(m, 'engine markers not found in index.html');
const { PRESETS, solveHEFT, generateRandomProblem } = new Function(
  m[1] + '\nreturn { PRESETS, solveHEFT, generateRandomProblem };'
)();

const preset = key => {
  const p = PRESETS.find(x => x.key === key);
  assert.ok(p, `preset ${key} missing`);
  return p;
};
const slot = (sol, t) => {
  const a = sol.assigned[t];
  return `P${a.proc + 1}[${a.start},${a.finish}]`;
};
const cand = (sol, t, p) => sol.sched.find(s => s.task === t).cands[p];

// Deterministic PRNG so the property tests are reproducible.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Lecture 21, slides 19-22: example with communication cost 1 ──
test('lecture example 1: averages and upward ranks (slide 20)', () => {
  const sol = solveHEFT(preset('lecture1'));
  assert.deepEqual(sol.avgW, { A: 2.5, B: 3, C: 2.5, D: 2 });
  assert.deepEqual(sol.rank, { A: 9.5, B: 6, C: 5.5, D: 2 });
  assert.deepEqual(sol.rankOrder, ['D', 'B', 'C', 'A']); // exit node first
  assert.deepEqual(sol.order, ['A', 'B', 'C', 'D']);
});

test('lecture example 1: processor selection (slide 21)', () => {
  const sol = solveHEFT(preset('lecture1'));
  // Task A: P1 0+2=2, P2 0+3=3 -> P1
  assert.equal(cand(sol, 'A', 0).eft, 2);
  assert.equal(cand(sol, 'A', 1).eft, 3);
  // Task B: P1 EST 2 EFT 6; P2 EST 3 EFT 5 -> P2
  assert.deepEqual([cand(sol, 'B', 0).est, cand(sol, 'B', 0).eft], [2, 6]);
  assert.deepEqual([cand(sol, 'B', 1).est, cand(sol, 'B', 1).eft], [3, 5]);
  // Task C: P1 EST 2 EFT 5; P2 data ready at 3 but B occupies [3,5) -> EST 5 EFT 7
  assert.deepEqual([cand(sol, 'C', 0).est, cand(sol, 'C', 0).eft], [2, 5]);
  assert.equal(cand(sol, 'C', 1).ready, 3);
  assert.deepEqual([cand(sol, 'C', 1).est, cand(sol, 'C', 1).eft], [5, 7]);
  assert.deepEqual(cand(sol, 'C', 1).blockers.map(b => b.task), ['B']);
  // Task D: P1 EST max(5, 5+1)=6 EFT 7; P2 EST max(5, 6)=6 EFT 9 -> P1
  assert.deepEqual([cand(sol, 'D', 0).est, cand(sol, 'D', 0).eft], [6, 7]);
  assert.deepEqual([cand(sol, 'D', 1).est, cand(sol, 'D', 1).eft], [6, 9]);
});

test('lecture example 1: final schedule and makespan (slide 22)', () => {
  const sol = solveHEFT(preset('lecture1'));
  assert.equal(slot(sol, 'A'), 'P1[0,2]');
  assert.equal(slot(sol, 'B'), 'P2[3,5]');
  assert.equal(slot(sol, 'C'), 'P1[2,5]');
  assert.equal(slot(sol, 'D'), 'P1[6,7]');
  assert.equal(sol.makespan, 7);
});

// ── Lecture 21, slide 23: same problem with communication cost 2 ──
test('lecture example 2: comm = 2, EFT tie goes to the lower processor ID', () => {
  const sol = solveHEFT(preset('lecture2'));
  assert.deepEqual(sol.rank, { A: 11.5, B: 7, C: 6.5, D: 2 });
  assert.deepEqual(sol.order, ['A', 'B', 'C', 'D']);
  const b = sol.sched.find(s => s.task === 'B');
  assert.deepEqual(b.cands.map(c => c.eft), [6, 6]); // tie
  assert.equal(b.tie, true);
  assert.equal(b.chosen, 0);                          // lower processor ID
  assert.equal(slot(sol, 'A'), 'P1[0,2]');
  assert.equal(slot(sol, 'B'), 'P1[2,6]');
  assert.equal(slot(sol, 'C'), 'P2[4,6]');
  assert.equal(slot(sol, 'D'), 'P1[8,9]');
  assert.equal(sol.makespan, 9);
});

// ── Insertion policy (slide 18: "checking any idle gaps") ──
test('insertion example: a low-rank task is placed in an earlier idle gap', () => {
  const sol = solveHEFT(preset('insertion'));
  assert.deepEqual(sol.order, ['A', 'B', 'C', 'E', 'D']);
  const e = cand(sol, 'E', 1);
  assert.ok(e.gap, 'E on P2 should use an idle gap');
  assert.equal(slot(sol, 'E'), 'P2[0,1]');   // before B, which runs on P2 during [3,5)
  assert.equal(slot(sol, 'B'), 'P2[3,5]');
  assert.equal(sol.makespan, 7);
});

// ── Every preset must be a well-formed problem ──
test('presets are well formed', () => {
  assert.ok(PRESETS.length >= 8);
  for (const p of PRESETS) {
    for (const t of p.tasks) assert.equal(p.compute[t].length, p.nP, `${p.key}:${t}`);
    for (const [u, v] of p.edges) assert.ok(p.comm[`${u}-${v}`] > 0, `${p.key}:${u}-${v}`);
    checkSchedule(p, solveHEFT(p));
  }
});

// Independent check that a solution is a valid insertion-based HEFT schedule.
function checkSchedule(prob, sol) {
  const { tasks, edges, compute, comm, nP } = prob;
  const tag = prob.key || 'random';

  // 1. Upward ranks satisfy the recurrence; priority order is non-increasing.
  for (const t of tasks) {
    const succs = edges.filter(e => e[0] === t).map(e => e[1]);
    const w = compute[t].reduce((a, b) => a + b, 0) / nP;
    const best = succs.length ? Math.max(...succs.map(s => comm[`${t}-${s}`] + sol.rank[s])) : 0;
    assert.ok(Math.abs(sol.rank[t] - (w + best)) < 1e-9, `${tag}: rank(${t})`);
  }
  assert.deepEqual([...sol.order].sort(), [...tasks].sort(), `${tag}: order is a permutation`);
  for (let i = 1; i < sol.order.length; i++) {
    assert.ok(sol.rank[sol.order[i - 1]] >= sol.rank[sol.order[i]] - 1e-9, `${tag}: order by rank`);
  }
  // Predecessors always come earlier in the priority order.
  for (const [u, v] of edges) assert.ok(sol.order.indexOf(u) < sol.order.indexOf(v), `${tag}: topological`);

  // 2. Replay the schedule with a brute-force earliest-slot search (all times are integers).
  const busy = Array.from({ length: nP }, () => []);
  const placed = {};
  sol.sched.forEach((step, i) => {
    assert.equal(step.task, sol.order[i], `${tag}: schedule follows priority order`);
    const efts = [];
    for (let p = 0; p < nP; p++) {
      let ready = 0;
      for (const [u, v] of edges) {
        if (v !== step.task) continue;
        ready = Math.max(ready, placed[u].finish + (placed[u].proc === p ? 0 : comm[`${u}-${v}`]));
      }
      const dur = compute[step.task][p];
      let s = ready;
      while (busy[p].some(iv => s < iv.end && iv.start < s + dur)) s++;
      assert.equal(step.cands[p].ready, ready, `${tag}: ready(${step.task},P${p + 1})`);
      assert.equal(step.cands[p].est, s, `${tag}: EST(${step.task},P${p + 1})`);
      assert.equal(step.cands[p].eft, s + dur, `${tag}: EFT(${step.task},P${p + 1})`);
      efts.push(s + dur);
    }
    const min = Math.min(...efts);
    assert.equal(step.chosen, efts.indexOf(min), `${tag}: min EFT, tie -> lower processor ID`);
    assert.equal(step.tie, efts.filter(x => x === min).length > 1, `${tag}: tie flag`);
    const a = sol.assigned[step.task];
    assert.deepEqual([a.proc, a.finish], [step.chosen, min], `${tag}: assignment`);
    assert.equal(a.finish - a.start, compute[step.task][a.proc]);
    busy[a.proc].push({ start: a.start, end: a.finish });
    placed[step.task] = a;
  });
  assert.equal(sol.makespan, Math.max(...tasks.map(t => sol.assigned[t].finish)), `${tag}: makespan`);
}

test('random problems: valid schedules, clean numbers, no rank ties', () => {
  const rnd = mulberry32(250);
  let multiProc = 0, total = 0;
  for (const nP of [2, 3]) {
    for (const n of [3, 4, 5, 6, 7]) {
      for (let k = 0; k < 150; k++) {
        const prob = generateRandomProblem(n, nP, rnd);
        total++;
        assert.equal(prob.tasks.length, n);
        assert.equal(prob.nP, nP);
        const sol = solveHEFT(prob);
        checkSchedule(prob, sol);
        // Averages are multiples of 0.5 (2 processors) or whole numbers (3 processors).
        for (const t of prob.tasks) assert.ok(Number.isInteger(sol.avgW[t] * 2), `avg ${sol.avgW[t]}`);
        assert.equal(sol.rankTies, false, 'generator should avoid rank ties');
        // Single entry task (A) and single exit task (last letter), as in the lecture.
        const hasPred = new Set(prob.edges.map(e => e[1]));
        const hasSucc = new Set(prob.edges.map(e => e[0]));
        assert.deepEqual(prob.tasks.filter(t => !hasPred.has(t)), [prob.tasks[0]]);
        assert.deepEqual(prob.tasks.filter(t => !hasSucc.has(t)), [prob.tasks[n - 1]]);
        if (new Set(prob.tasks.map(t => sol.assigned[t].proc)).size > 1) multiProc++;
      }
    }
  }
  assert.equal(multiProc, total, 'every generated problem should use more than one processor');
});
