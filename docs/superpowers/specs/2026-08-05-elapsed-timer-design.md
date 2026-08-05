# URL-configurable elapsed timer design

## Goal

Add a standalone static timer at `/elapsed/` that can be embedded in Obsidian and configured entirely through URL query parameters.

## URL contract

Example:

```text
/elapsed/?date=2026-01-05T20:00:00&title=TIFS投稿已经&display=both&units=ymdhms&theme=light&color=blue
```

- `date`: required local date-time in `YYYY-MM-DDTHH:mm:ss` form.
- `title`: optional arbitrary text. It is rendered verbatim as text and defaults to `事件`.
- `display`: `calendar` (default), `days`, or `both`.
- `units`: ordered subset of `ymdhms`; defaults to `ymdhms`.
- `theme`: `auto` (default), `light`, or `dark`.
- `color`: `blue` (default), `green`, `orange`, or `purple`.

Unknown parameters are ignored. Invalid optional values fall back to their defaults. A missing or invalid `date` displays a concise usage message instead of starting the timer.

## Time semantics

The date is interpreted in the browser's local time zone. Calendar mode reports complete calendar years, months, and days followed by hours, minutes, and seconds. It must handle leap years and month-end clamping. Days mode reports complete elapsed 24-hour periods followed by the hour, minute, and second remainder. Future targets count down; after the target is crossed, the page automatically changes to elapsed mode.

Each tick is computed from the current system time rather than accumulated intervals. Updates align to second boundaries so a suspended iframe immediately catches up when resumed.

## Visual design

The supplied 1768×402 screenshot is the visual reference and has the same aspect ratio as a 1060×240 iframe. The page has a plain background and a centered three-level hierarchy: custom title, oversized timer line, and formatted source/target date. Past events use an upward arrow and future events a downward arrow. `display=both` adds a small `累计 N 天` line without competing with the main timer.

The main line uses tabular numerals and a seven-segment-inspired treatment without copying the reference site's font or assets. It scales to avoid horizontal scrolling, wraps only on narrow screens, follows light/dark preferences in `auto`, supports four accent colors, and respects reduced-motion preferences. A small neutral status mark appears in the lower-right corner without external links.

## Architecture

- `elapsed/index.html`: semantic standalone markup and error state.
- `elapsed/timer.css`: responsive screenshot-derived presentation and themes.
- `elapsed/timer-core.mjs`: pure parsing, parameter normalization, and duration calculations.
- `elapsed/timer.js`: DOM rendering and aligned scheduling.
- `test/elapsed_timer.test.mjs`: Node built-in tests for pure behavior.

The page has no Jekyll layout, third-party runtime, analytics, cookies, network requests, or dependency on the homepage theme.

## Validation

Automated tests cover parsing, leap years, month ends, calendar/days modes, future/past direction, units, defaults, and hostile title strings. Docker validation builds the complete Jekyll site and serves `/elapsed/`. Browser validation covers light/dark rendering, all display modes, the invalid-date state, a 1060×240 viewport, and a narrow viewport.
