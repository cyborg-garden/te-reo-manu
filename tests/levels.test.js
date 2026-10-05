// Run with: node --test tests/*.test.js
// Loads the game engine (not the page wiring) and checks the level rules.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const engine = src.slice(0, src.indexOf('// ==================== STANDALONE BOOT'));
const ctx = {};
vm.runInNewContext(engine + '\nthis.GAME_DATA = GAME_DATA; this.GameEngine = GameEngine;', ctx);
const { GAME_DATA, GameEngine: G } = ctx;
const T = GAME_DATA.syllable_types;

function score(seq, q, used) {
  if (G.composeProblem(seq, q, used)) return 0;
  return G.composeScore(seq, G.composeRank(q, 'tui'), 'tui');
}
const passes = (seq, q, used) => score(seq, q, used) >= G.COMPOSE_PASS;

test('L3: the right answer depends on the syllable before it', () => {
  for (const from of T) assert.ok(G.contrastPairs(from, 'tui').length >= 3, from);
  // Every fixed preference order over the five types (120 of them), which
  // ignores what was just sung, must miss something in every level.
  const orders = [];
  (function perm(rest, acc) { if (!rest.length) { orders.push(acc); return; } rest.forEach((t, i) => perm(rest.filter((_, j) => j !== i), acc.concat(t))); })(T, []);
  for (let run = 0; run < 200; run++) {
    const qs = G.generateQuestions(3);
    assert.strictEqual(qs.length, GAME_DATA.level_config[2].total);
    for (const q of qs) {
      // Every pair is reversed after some other syllable.
      const other = q.choices.find(c => c !== q.answer);
      assert.ok(T.some(f => f !== q.from && G.contrastWins(f, other, q.answer, 'tui')));
    }
    for (const t of T) {
      const offered = qs.filter(q => q.choices.includes(t));
      assert.ok(!offered.length || offered.some(q => q.answer !== t), `always ${t} would win`);
    }
    for (const o of orders) {
      const right = qs.filter(q => o.indexOf(q.answer) < o.indexOf(q.choices.find(c => c !== q.answer))).length;
      assert.ok(right < qs.length, `order ${o} gets every question`);
    }
  }
});

test('L4: one syllable repeated never scores', () => {
  for (const len of [5, 6, 7]) for (const include of ['H', 'HF', 'T', 'R']) {
    const q = { type: 'compose', length: len, include };
    for (const t of T) assert.strictEqual(passes(Array(len).fill(t), q), false, `${t} x${len}`);
    // Two syllables alternating, or long runs of one, do not score either.
    assert.strictEqual(passes(Array.from({ length: len }, (_, i) => i % 2 ? include : 'LF'), q), false);
    assert.ok(G.composeProblem(['LF', 'LF', 'LF', 'LF', 'H', include === 'H' ? 'R' : include], q));
  }
});

test('L4: the same phrase cannot win twice in a level', () => {
  const q1 = { type: 'compose', length: 5, include: 'H' };
  const q2 = { type: 'compose', length: 5, include: 'H' };
  const best = G.composeRank(q1, 'tui').best;
  assert.ok(passes(best, q1, []));
  assert.strictEqual(passes(best, q2, [best.join('-')]), false);
});

test('L4: no one phrase passes every question kind', () => {
  // A phrase reused across questions needs every required syllable; that
  // costs too much plausibility to clear the bar.
  for (const len of [5, 6, 7]) {
    const qs = ['H', 'HF', 'T', 'R'].map(include => ({ type: 'compose', length: len, include }));
    const all = [];
    (function walk(s) { if (s.length === len) { all.push(s.slice()); return; } for (const t of T) { s.push(t); walk(s); s.pop(); } })([]);
    const universal = all.filter(s => qs.every(q => passes(s, q)));
    assert.strictEqual(universal.length, 0, `len ${len}: ${universal.map(s => s.join('-')).slice(0, 3)}`);
  }
});

test('L4: using the learned structure wins', () => {
  // Runs of one type joined through LF: what L3 teaches.
  assert.ok(passes(['LF', 'LF', 'LF', 'H', 'H', 'T'], { length: 6, include: 'T' }));
  assert.ok(passes(['LF', 'LF', 'H', 'H', 'LF', 'R', 'R'], { length: 7, include: 'R' }));
  // The same syllables in an order a tūī rarely uses do not.
  assert.strictEqual(passes(['T', 'H', 'LF', 'R', 'H', 'LF'], { length: 6, include: 'T' }), false);
});

test('L5: answers are spread over A and B, and regions vary', () => {
  for (let run = 0; run < 200; run++) {
    const qs = G.generateQuestions(5);
    assert.strictEqual(qs.length, GAME_DATA.level_config[4].total);
    const first = qs.filter(q => G.dialectAnswer(q) === q.regions[0]).length;
    assert.strictEqual(first, qs.length / 2, 'answer position balanced');
    const uses = {};
    qs.forEach(q => q.regions.forEach(r => { uses[r] = (uses[r] || 0) + 1; }));
    assert.ok(Object.keys(uses).length >= 6, `regions ${Object.keys(uses)}`);
    assert.ok(Math.max(...Object.values(uses)) <= 3);
    assert.ok(qs.some(q => q.ask === 'H') && qs.some(q => q.ask !== 'H'), 'both question kinds');
  }
});

test('L2: one question per sample, each sample once', () => {
  const qs = G.generateQuestions(2);
  assert.strictEqual(new Set(qs.map(q => q.audio)).size, qs.length);
  assert.ok(GAME_DATA.sample_pad > 0);
});
