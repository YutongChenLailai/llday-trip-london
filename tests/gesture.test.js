import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aimFromHand, releaseReady, handState, nearestPlace } from '../src/gesture.js';
test('aim remains inside map and mirrors camera coordinates', () => {
  assert.deepEqual(aimFromHand(-1, 2), {x:.04, y:.94});
  const p = Array.from({length:21}, () => ({x:.2,y:.3}));
  p[9] = {x:.2,y:.5};
  assert.equal(handState(p).x, .8);
  assert.equal(handState(p).pinch, 0);
});
test('release needs a held dart, a deliberate pinch duration and throwing motion', () => {
  assert.equal(releaseReady(true,.8,250,.5), true);
  assert.equal(releaseReady(false,.8,250,.5), false);
  assert.equal(releaseReady(true,.5,250,.5), false);
  assert.equal(releaseReady(true,.8,50,.5), false);
  assert.equal(releaseReady(true,.8,250,.05), false);
});
test('landing chooses nearby suggestion without changing actual coordinate', () => {
  assert.equal(nearestPlace(51.5,-.12,[{name:'A',lat:51.5,lng:-.12},{name:'B',lat:51.6,lng:0}]).name,'A');
});
