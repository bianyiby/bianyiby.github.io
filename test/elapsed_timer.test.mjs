import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import * as timerCore from "../elapsed/timer-core.mjs";

const {
  buildIframeCode,
  buildTimerUrl,
  calculateDuration,
  formatPrimaryValue,
  formatLocalDayStart,
  formatTargetDate,
  normalizeOptions,
  parseLocalDateTime,
} = timerCore;

test("parseLocalDateTime parses an exact local date-time", () => {
  const result = parseLocalDateTime("2026-01-05T20:00:33");

  assert.ok(result instanceof Date);
  assert.deepEqual(
    [
      result.getFullYear(),
      result.getMonth() + 1,
      result.getDate(),
      result.getHours(),
      result.getMinutes(),
      result.getSeconds(),
    ],
    [2026, 1, 5, 20, 0, 33],
  );
});

test("parseLocalDateTime accepts datetime-local minute precision", () => {
  const result = parseLocalDateTime("2026-01-05T20:00");

  assert.ok(result instanceof Date);
  assert.deepEqual(
    [result.getFullYear(), result.getMonth() + 1, result.getDate(), result.getHours(), result.getMinutes(), result.getSeconds()],
    [2026, 1, 5, 20, 0, 0],
  );
});

test("parseLocalDateTime rejects rollovers and incomplete values", () => {
  assert.equal(parseLocalDateTime("2025-02-29T12:00:00"), null);
  assert.equal(parseLocalDateTime("2026-13-01T00:00:00"), null);
  assert.equal(parseLocalDateTime("2026-01-05T20"), null);
  assert.equal(parseLocalDateTime("not-a-date"), null);
});

test("calculateDuration uses clamped calendar years for leap days", () => {
  const start = new Date(2020, 1, 29, 10, 15, 0);
  const now = new Date(2021, 1, 28, 10, 15, 0);

  const result = calculateDuration(start, now);

  assert.equal(result.direction, "past");
  assert.deepEqual(result.calendar, {
    years: 1,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
});

test("calculateDuration handles month-end clamping", () => {
  const start = new Date(2024, 0, 31, 8, 30, 0);
  const now = new Date(2024, 2, 1, 9, 45, 6);

  const result = calculateDuration(start, now);

  assert.deepEqual(result.calendar, {
    years: 0,
    months: 1,
    days: 1,
    hours: 1,
    minutes: 15,
    seconds: 6,
  });
});

test("calculateDuration reports future direction without negative units", () => {
  const now = new Date(2026, 0, 1, 0, 0, 0);
  const target = new Date(2026, 2, 2, 3, 4, 5);

  const result = calculateDuration(target, now);

  assert.equal(result.direction, "future");
  assert.deepEqual(result.calendar, {
    years: 0,
    months: 2,
    days: 1,
    hours: 3,
    minutes: 4,
    seconds: 5,
  });
});

test("calculateDuration reports complete 24-hour days and clock remainder", () => {
  const start = new Date(2026, 0, 1, 0, 0, 0);
  const now = new Date(start.getTime() + (211 * 24 * 60 * 60 + 12 * 60 * 60 + 40 * 60 + 33) * 1000);

  const result = calculateDuration(start, now);

  assert.equal(result.totalDays, 211);
  assert.deepEqual(result.dayClock, {
    hours: 12,
    minutes: 40,
    seconds: 33,
  });
});

test("normalizeOptions applies defaults and canonical unit order", () => {
  const result = normalizeOptions(new URLSearchParams("units=shy&display=unknown&theme=nope&color=red"));

  assert.deepEqual(result, {
    title: "",
    display: "calendar",
    units: "yhs",
    theme: "auto",
    color: "blue",
  });
});

test("normalizeOptions leaves the default title blank", () => {
  assert.equal(normalizeOptions(new URLSearchParams()).title, "");
  assert.equal(normalizeOptions(new URLSearchParams("title=")).title, "");
});

test("normalizeOptions preserves a custom title as literal text", () => {
  const title = '<img src=x onerror="alert(1)"> 🎓 Project Launch';
  const result = normalizeOptions(
    new URLSearchParams({
      title,
      display: "both",
      units: "mdhms",
      theme: "dark",
      color: "purple",
    }),
  );

  assert.deepEqual(result, {
    title,
    display: "both",
    units: "mdhms",
    theme: "dark",
    color: "purple",
  });
});

test("formatPrimaryValue renders calendar and day display modes", () => {
  const duration = {
    calendar: { years: 0, months: 7, days: 0, hours: 12, minutes: 40, seconds: 33 },
    totalDays: 211,
    dayClock: { hours: 12, minutes: 40, seconds: 33 },
  };

  assert.equal(formatPrimaryValue(duration, "calendar", "ymdhms"), "0年 7月 0天 12:40:33");
  assert.equal(formatPrimaryValue(duration, "days", "ymdhms"), "211天 12:40:33");
  assert.equal(formatPrimaryValue(duration, "both", "ymdhms"), "0年 7月 0天 12:40:33");
  assert.equal(formatPrimaryValue(duration, "calendar", "ymdh"), "0年 7月 0天 12时");
});

test("formatTargetDate uses a compact local date-time", () => {
  assert.equal(formatTargetDate(new Date(2026, 0, 5, 20, 0, 33)), "2026年1月5日 - 20:00");
});

test("formatLocalDayStart defaults to local midnight on the opening day", () => {
  assert.equal(typeof timerCore.formatLocalDayStart, "function");
  assert.equal(formatLocalDayStart(new Date(2026, 7, 5, 13, 49, 36)), "2026-08-05T00:00:00");
});

test("standalone markup exposes all rendering hooks", async () => {
  const html = await readFile(new URL("../elapsed/index.html", import.meta.url), "utf8");

  assert.match(html, /<title>Yi Bian \| Time Counter<\/title>/);

  for (const hook of [
    'id="timer"',
    'id="event-title"',
    'id="timer-arrow"',
    'id="timer-value"',
    'id="total-days"',
    'id="target-date"',
    'id="embed-button"',
    'id="embed-dialog"',
    'id="embed-form"',
    'id="embed-code"',
    'id="copy-embed-code"',
    'id="error-panel"',
    'href="./timer.css"',
    'src="./timer.js"',
  ]) {
    assert.match(html, new RegExp(hook));
  }

  assert.doesNotMatch(html, /id="status-mark"/);
  assert.doesNotMatch(html, /配置后复制到 Obsidian 笔记中/);
  assert.match(html, />iframe 代码</);
  assert.doesNotMatch(html, />Obsidian iframe 代码</);
});

test("timer styling matches the homepage font and keeps tabular numerals", async () => {
  const css = await readFile(new URL("../elapsed/timer.css", import.meta.url), "utf8");

  assert.match(css, /--homepage-font:\s*"Trebuchet MS", Helvetica, sans-serif/);
  assert.match(css, /font-family:\s*var\(--homepage-font\)/);
  assert.doesNotMatch(css, /DSEG7 Modern/);
  assert.match(css, /font-variant-numeric:\s*tabular-nums/);
});

test("runtime exposes display mode for stable responsive sizing", async () => {
  const script = await readFile(new URL("../elapsed/timer.js", import.meta.url), "utf8");

  assert.match(script, /root\.dataset\.display\s*=\s*options\.display/);
});

test("buildTimerUrl uses the current bianyiby.github.io timer address", () => {
  const url = buildTimerUrl("https://bianyiby.github.io/elapsed/", {
    date: "2026-01-05T20:00:00",
    title: "TIFS投稿已经",
    display: "both",
    units: "ymdhms",
    theme: "light",
    color: "blue",
  });

  assert.equal(new URL(url).origin, "https://bianyiby.github.io");
  assert.equal(new URL(url).searchParams.get("title"), "TIFS投稿已经");
  assert.equal(new URL(url).searchParams.get("controls"), "0");
});

test("buildIframeCode escapes query separators and configurable dimensions", () => {
  const code = buildIframeCode("https://bianyiby.github.io/elapsed/?date=x&title=y", "100%", "240");

  assert.match(code, /src="https:\/\/bianyiby\.github\.io\/elapsed\/\?date=x&amp;title=y"/);
  assert.match(code, /width="100%"/);
  assert.match(code, /height="240"/);
});
