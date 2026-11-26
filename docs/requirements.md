# Shared requirement / acceptance-criteria sheet (both solutions)

**User story.** As a student, I want to choose a future start time and a duration for Room B-204 so that I can
immediately see whether the room is available and, if not, why.

| ID | Acceptance criterion (identical for both solutions) |
|---|---|
| AC1 | Start time must be in the future. |
| AC2 | Duration must be greater than zero and at most 120 minutes (whole minutes). |
| AC3 | An interval that overlaps an existing booking is Unavailable. |
| AC4 | A blocked room is Unavailable. |
| AC5 | A clear decision is displayed and existing bookings are never changed. |
| AC6 | Invalid input receives understandable feedback. |

## Contract

| Field | Type | Rule |
|---|---|---|
| start (input) | local date-time `YYYY-MM-DDTHH:MM` | Required; must be later than "now" (AC1) |
| duration (input) | integer, minutes | 1..120 (AC2) |
| blocked (input) | boolean | true = room under maintenance (AC4) |
| bookings (input) | list of `{id, start, end, title}` | Fictional, read-only (AC5) |
| available (output) | boolean | true only for reason OK |
| reason (output) | reason code | OK, START_IN_PAST, INVALID_DURATION, ROOM_BLOCKED, OVERLAP (code-based also INVALID_START) |
| message (output) | text shown to the user | Human-readable decision (AC5, AC6) |

Interval model: half-open `[start, end)` - a booking ending at 10:30 does not conflict with one starting at 10:30.
Time zone: campus local time, Asia/Almaty (UTC+05:00).

## Fictional bookings (Room B-204)

| ID | Date | Time | Title |
|---|---|---|---|
| BK-1 | 2026-12-01 | 09:00-10:30 | Algorithms seminar |
| BK-2 | 2026-12-01 | 12:00-13:00 | Study group |
| BK-3 | 2026-12-01 | 15:00-16:00 | Club meeting |

## Common test inputs (prepared before implementation)

| Test | Start | Duration | Blocked | Expected outcome |
|---|---|---|---|---|
| T1 | 2026-12-01 13:30 | 60 | no | Available (OK) |
| T2 | 2026-12-01 09:30 | 60 | no | Unavailable (OVERLAP with BK-1) |
| T3 | 2026-12-01 13:30 | 60 | yes | Unavailable (ROOM_BLOCKED) |
| T4 | 2026-12-01 13:30 | 0 | no | Validation error (INVALID_DURATION) |
| T5 | 2026-12-01 13:30 | 121 | no | Validation error (INVALID_DURATION) |
| T6 | 2026-11-20 10:00 | 60 | no | Validation error (START_IN_PAST) |
| T7 | 2026-12-01 10:30 | 90 | no | Available - 10:30-12:00 touches BK-1 end and BK-2 start |
| T8 | (after T1-T7) | - | - | Booking data unchanged |
