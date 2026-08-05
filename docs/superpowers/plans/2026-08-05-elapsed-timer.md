# URL-configurable Elapsed Timer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone, URL-configurable elapsed/countdown timer at `/elapsed/` for embedding in Obsidian.

**Architecture:** Keep date and parameter behavior in a pure ES module so Node's built-in test runner can verify it without a browser. Keep rendering and aligned scheduling in a small DOM adapter, with standalone semantic HTML and responsive CSS that do not inherit the Jekyll theme.

**Tech Stack:** HTML5, CSS, browser JavaScript ES modules, Node 20 built-in `node:test`, Jekyll/Docker.

---

### Task 1: Core date parsing and duration behavior

**Files:**
- Create: `test/elapsed_timer.test.mjs`
- Create: `elapsed/timer-core.mjs`

- [ ] Write failing tests that import `parseLocalDateTime`, `calculateDuration`, and `normalizeOptions`, covering strict local parsing, leap days, month-end clamping, past/future direction, total days, unit normalization, defaults, and literal hostile titles.
- [ ] Run `node --test test/elapsed_timer.test.mjs` and verify it fails because `elapsed/timer-core.mjs` does not exist.
- [ ] Implement strict parsing with a component round-trip check, calendar-unit stepping with clamped month/year additions, millisecond remainder decomposition, total complete 24-hour days, and whitelist-based option normalization.
- [ ] Run `node --test test/elapsed_timer.test.mjs` and verify all tests pass with no warnings.

### Task 2: Standalone timer page

**Files:**
- Create: `elapsed/index.html`
- Create: `elapsed/timer.js`
- Create: `elapsed/timer.css`
- Modify: `test/elapsed_timer.test.mjs`

- [ ] Add a failing markup contract test that checks for the title, main timer, total-days line, date label, status icon, error panel, module script, and stylesheet hooks.
- [ ] Run `node --test test/elapsed_timer.test.mjs` and verify the markup contract fails because `elapsed/index.html` is absent.
- [ ] Add semantic markup with hidden error and timer states; import the runtime module with `type="module"`.
- [ ] Implement URL parsing, safe `textContent` rendering, `calendar`/`days`/`both` layouts, past/future arrows, localized date labels, and a timeout aligned to the next second boundary.
- [ ] Implement the screenshot-derived 1060×240 layout, tabular numerals, responsive scaling, auto/light/dark themes, four accent colors, narrow-screen wrapping, and reduced-motion behavior.
- [ ] Run `node --test test/elapsed_timer.test.mjs` and verify all tests pass.

### Task 3: Site and Docker validation

**Files:**
- Verify generated output: `_site/elapsed/index.html`

- [ ] Run the project's Prettier check against the new source files and fix only new-file formatting issues.
- [ ] Run `docker compose run --rm jekyll bundle exec jekyll build --trace` and verify exit code 0.
- [ ] Confirm `_site/elapsed/index.html`, `_site/elapsed/timer.css`, `_site/elapsed/timer-core.mjs`, and `_site/elapsed/timer.js` exist.
- [ ] Start `docker compose up -d` and verify `http://127.0.0.1:8080/elapsed/` responds successfully.
- [ ] Browser-test `calendar`, `days`, and `both`, invalid date input, light/dark themes, 1060×240, and a narrow viewport; inspect console errors.
- [ ] Run the unit tests and Jekyll build once more, inspect `git diff --check`, and review `git status` to ensure pre-existing unrelated changes remain untouched.
