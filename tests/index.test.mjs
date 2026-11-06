import test from 'node:test';
import assert from 'node:assert/strict';
import { createHistory } from '../dist/esm/index.js';

test('back forward and clamped navigation have stable entry keys', () => {
  const h = createHistory({ location: '/' });
  const a = h.push('/a', { n: 1 });
  h.push('/b');
  assert.deepEqual(h.back(), a);
  assert.equal(h.forward().location, '/b');
  assert.equal(h.go(999).location, '/b');
  assert.equal(h.go(-999).location, '/');
  assert.deepEqual([h.snapshot().canBack, h.snapshot().canForward], [false, true]);
});
test('branching truncates forward entries and capacity evicts oldest', () => {
  const h = createHistory({ location: '/' }, { capacity: 2 });
  h.push('/a');
  h.push('/b');
  assert.deepEqual(
    h.snapshot().entries.map((e) => e.location),
    ['/a', '/b'],
  );
  h.back();
  h.push('/c');
  assert.deepEqual(
    h.snapshot().entries.map((e) => e.location),
    ['/a', '/c'],
  );
  assert.equal(h.snapshot().canForward, false);
});
test('replace preserves key, index and forward branch', () => {
  const h = createHistory({ location: '/' });
  const a = h.push('/a');
  h.push('/b');
  h.back();
  assert.equal(h.replace('/new', 3).key, a.key);
  assert.equal(h.forward().location, '/b');
});
test('duplicate policies are explicit current-location decisions', () => {
  const ignore = createHistory({ location: '/', state: 1 }, { duplicate: 'ignore' });
  assert.equal(ignore.push('/', 2).state, 1);
  assert.equal(ignore.snapshot().entries.length, 1);
  const replace = createHistory({ location: '/', state: 1 }, { duplicate: 'replace' });
  assert.deepEqual(replace.push('/', 2), { key: '1', location: '/', state: 2 });
  const allow = createHistory({ location: '/' });
  allow.push('/');
  assert.equal(allow.snapshot().entries.length, 2);
});
test('deep serializable state is detached on input and every output', () => {
  const state = { nested: [{ a: 1 }] };
  const h = createHistory({ location: '/', state });
  state.nested[0].a = 9;
  const entry = h.go(0);
  assert.deepEqual(entry.state, { nested: [{ a: 1 }] });
  entry.state.nested[0].a = 7;
  h.snapshot().entries[0].state.nested.push(5);
  assert.deepEqual(h.go(0).state, { nested: [{ a: 1 }] });
});
test('invalid serializable values fail atomically including cycles and holes', () => {
  const h = createHistory({ location: '/' });
  const circular = {};
  circular.self = circular;
  for (const state of [circular, { n: NaN }, { x: undefined }, new Date(), [, 1], () => 1]) {
    assert.throws(() => h.push('/bad', state), TypeError);
  }
  assert.equal(h.snapshot().entries.length, 1);
  assert.equal(h.push('/ok').key, '2');
});
test('invalid bounds and deltas reject without navigation', () => {
  assert.throws(() => createHistory({ location: '/' }, { capacity: 0 }), RangeError);
  assert.throws(() => createHistory({ location: '/' }, { duplicate: 'bogus' }), TypeError);
  assert.throws(() => createHistory({ location: '' }), TypeError);
  const h = createHistory({ location: '/' }, { capacity: 1 });
  assert.throws(() => h.go(0.5), TypeError);
  h.push('/a');
  assert.equal(h.back().location, '/a');
});
