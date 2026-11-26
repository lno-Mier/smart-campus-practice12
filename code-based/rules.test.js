// Unit tests for the rule engine: node --test (Node.js built-in test runner, no dependencies).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { BOOKINGS, checkAvailability } = require('./rules.js');

const NOW = '2026-11-26T15:00'; // fixed clock -> deterministic results
const check = (start, duration, blocked = false) =>
  checkAvailability({ start, duration, blocked }, BOOKINGS, NOW);
const snapshot = JSON.stringify(BOOKINGS);

test('T1 valid free interval -> Available', () => {
  assert.deepEqual(check('2026-12-01T13:30', 60),
    { available: true, valid: true, reason: 'OK', message: 'Available: the room is free for the selected interval.' });
});
test('T2 overlap with existing booking -> Unavailable', () => {
  const r = check('2026-12-01T09:30', 60);
  assert.equal(r.available, false);
  assert.equal(r.reason, 'OVERLAP');
  assert.equal(r.message, 'Unavailable: overlaps existing booking BK-1 (09:00-10:30).');
});
test('T3 blocked room -> Unavailable', () => {
  const r = check('2026-12-01T13:30', 60, true);
  assert.equal(r.available, false);
  assert.equal(r.reason, 'ROOM_BLOCKED');
});
test('T4 duration = 0 -> validation error', () => {
  const r = check('2026-12-01T13:30', 0);
  assert.equal(r.valid, false);
  assert.equal(r.reason, 'INVALID_DURATION');
});
test('T5 duration = 121 -> validation error', () => {
  assert.equal(check('2026-12-01T13:30', 121).reason, 'INVALID_DURATION');
});
test('T6 past start time -> validation error', () => {
  const r = check('2026-11-20T10:00', 60);
  assert.equal(r.reason, 'START_IN_PAST');
  assert.equal(r.message, 'Start time must be in the future.');
});
test('T7 adjacent non-overlapping interval -> Available', () => {
  assert.equal(check('2026-12-01T10:30', 90).reason, 'OK'); // 10:30-12:00 touches BK-1 and BK-2
});
test('T8 booking data unchanged after checks', () => {
  assert.equal(JSON.stringify(BOOKINGS), snapshot);
  assert.ok(Object.isFrozen(BOOKINGS) && BOOKINGS.every(Object.isFrozen));
});
test('extra: duration 120 boundary accepted, 1 accepted', () => {
  assert.equal(check('2026-12-01T13:00', 120).reason, 'OK');      // 13:00-15:00 touches BK-2 and BK-3
  assert.equal(check('2026-12-01T13:30', 120).reason, 'OVERLAP'); // valid input, reaches the overlap rule (BK-3)
  assert.equal(check('2026-12-01T13:30', 1).reason, 'OK');
});
test('extra: empty / non-numeric / fractional input -> understandable error', () => {
  assert.equal(check('', 60).reason, 'INVALID_START');
  assert.equal(check('2026-12-01T13:30', '').reason, 'INVALID_DURATION');
  assert.equal(check('2026-12-01T13:30', 'abc').reason, 'INVALID_DURATION');
  assert.equal(check('2026-12-01T13:30', '1.5').reason, 'INVALID_DURATION');
  assert.match(check('2026-12-01T13:30', '1.5').message, /whole number of minutes/);
});
