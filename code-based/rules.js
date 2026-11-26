/* Smart Campus Room Availability Checker - rule engine (Practice #12, code-based track).
   Pure, deterministic functions with no DOM access:
   validation (AC1, AC2, AC6) -> availability calculation (AC3, AC4) -> result object (AC5).
   Works in the browser (window.RoomRules) and in Node.js (module.exports). */
(function (root) {
  'use strict';

  const MAX_DURATION = 120; // minutes (AC2)
  const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
  const WHOLE_NUMBER = /^\d{1,4}$/;

  // Fictional, read-only booking data for Room B-204 (campus local time, Asia/Almaty).
  const BOOKINGS = Object.freeze([
    Object.freeze({ id: 'BK-1', start: '2026-12-01T09:00', end: '2026-12-01T10:30', title: 'Algorithms seminar' }),
    Object.freeze({ id: 'BK-2', start: '2026-12-01T12:00', end: '2026-12-01T13:00', title: 'Study group' }),
    Object.freeze({ id: 'BK-3', start: '2026-12-01T15:00', end: '2026-12-01T16:00', title: 'Club meeting' })
  ]);

  // 'YYYY-MM-DDTHH:MM' -> minutes since 1970-01-01 (wall-clock value, no time-zone shift).
  // Returns null for anything that is not a real calendar date and time.
  function toMinutes(value) {
    const m = DATE_TIME.exec(String(value));
    if (!m) return null;
    const [y, mo, d, h, mi] = m.slice(1).map(Number);
    if (mo < 1 || mo > 12 || h > 23 || mi > 59) return null;
    const ms = Date.UTC(y, mo - 1, d, h, mi);
    if (new Date(ms).getUTCDate() !== d) return null; // e.g. 2026-02-30
    return ms / 60000;
  }

  function hhmm(value) {
    return String(value).slice(11, 16);
  }

  // AC1, AC2, AC6 - returns null when the input is valid, otherwise { reason, message }.
  function validate(input, nowIso) {
    const start = toMinutes(input.start);
    if (start === null) {
      return { reason: 'INVALID_START', message: 'Enter a valid start date and time.' };
    }
    if (start <= toMinutes(nowIso)) {
      return { reason: 'START_IN_PAST', message: 'Start time must be in the future.' };
    }
    const raw = String(input.duration ?? '').trim();
    const minutes = Number(raw);
    if (!WHOLE_NUMBER.test(raw) || minutes < 1 || minutes > MAX_DURATION) {
      return { reason: 'INVALID_DURATION', message: 'Duration must be a whole number of minutes from 1 to 120.' };
    }
    return null;
  }

  // AC3 - half-open intervals [start, end): touching end points do not overlap.
  function findConflict(startMin, endMin, bookings) {
    return bookings.find(b => startMin < toMinutes(b.end) && endMin > toMinutes(b.start)) || null;
  }

  // Main contract: input {start, duration, blocked} -> {available, valid, reason, message}.
  // Bookings are only read, never changed (AC5).
  function checkAvailability(input, bookings, nowIso) {
    const err = validate(input, nowIso);                        // AC1, AC2, AC6
    if (err) return { available: false, valid: false, reason: err.reason, message: err.message };
    if (input.blocked === true) {                               // AC4
      return { available: false, valid: true, reason: 'ROOM_BLOCKED',
        message: 'Unavailable: the room is blocked (e.g. maintenance).' };
    }
    const s = toMinutes(input.start);
    const e = s + Number(input.duration);
    const c = findConflict(s, e, bookings);                     // AC3
    if (c) {
      return { available: false, valid: true, reason: 'OVERLAP',
        message: `Unavailable: overlaps existing booking ${c.id} (${hhmm(c.start)}-${hhmm(c.end)}).` };
    }
    return { available: true, valid: true, reason: 'OK',
      message: 'Available: the room is free for the selected interval.' };
  }

  const api = { MAX_DURATION, BOOKINGS, toMinutes, validate, findConflict, checkAvailability };
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  } else {
    root.RoomRules = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
