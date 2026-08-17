const DEFAULT_UNITS = "ymdhms";
const DISPLAY_MODES = new Set(["calendar", "days", "both"]);
const THEMES = new Set(["auto", "light", "dark"]);
const COLORS = new Set(["blue", "green", "orange", "purple"]);
const DAY_MS = 24 * 60 * 60 * 1000;

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addClampedYears(date, amount) {
  const result = new Date(date);
  const month = result.getMonth();
  const day = result.getDate();
  const targetYear = result.getFullYear() + amount;

  result.setDate(1);
  result.setFullYear(targetYear);
  result.setMonth(month);
  result.setDate(Math.min(day, daysInMonth(targetYear, month)));
  return result;
}

function addClampedMonths(date, amount) {
  const result = new Date(date);
  const day = result.getDate();
  const totalMonths = result.getFullYear() * 12 + result.getMonth() + amount;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = totalMonths - targetYear * 12;

  result.setDate(1);
  result.setFullYear(targetYear);
  result.setMonth(targetMonth);
  result.setDate(Math.min(day, daysInMonth(targetYear, targetMonth)));
  return result;
}

function addCalendarDay(date) {
  const result = new Date(date);
  result.setDate(result.getDate() + 1);
  return result;
}

function optionOrDefault(value, allowedValues, fallback) {
  return allowedValues.has(value) ? value : fallback;
}

export function parseLocalDateTime(value) {
  if (typeof value !== "string") return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText, secondText = "0"] = match;
  const parts = [yearText, monthText, dayText, hourText, minuteText, secondText].map(Number);
  const [year, month, day, hour, minute, second] = parts;
  const result = new Date(year, month - 1, day, hour, minute, second, 0);

  const roundTrip = [
    result.getFullYear(),
    result.getMonth() + 1,
    result.getDate(),
    result.getHours(),
    result.getMinutes(),
    result.getSeconds(),
  ];

  return roundTrip.every((part, index) => part === parts[index]) ? result : null;
}

export function normalizeOptions(params) {
  const requestedUnits = params.get("units") ?? DEFAULT_UNITS;
  const firstMinuteOrMonth = requestedUnits.indexOf("m");
  const lastMinuteOrMonth = requestedUnits.lastIndexOf("m");
  const hourIndex = requestedUnits.indexOf("h");
  const hasTwoMValues = firstMinuteOrMonth !== -1 && firstMinuteOrMonth !== lastMinuteOrMonth;
  const hasCalendarContext = requestedUnits.includes("y") || requestedUnits.includes("d");
  const hasMonth =
    hasTwoMValues ||
    (firstMinuteOrMonth !== -1 &&
      hasCalendarContext &&
      (hourIndex === -1 || firstMinuteOrMonth < hourIndex));
  const hasMinute =
    hasTwoMValues ||
    (lastMinuteOrMonth !== -1 &&
      (!hasCalendarContext || (hourIndex !== -1 && lastMinuteOrMonth > hourIndex)));
  const units = [
    requestedUnits.includes("y") ? "y" : "",
    hasMonth ? "m" : "",
    requestedUnits.includes("d") ? "d" : "",
    requestedUnits.includes("h") ? "h" : "",
    hasMinute ? "m" : "",
    requestedUnits.includes("s") ? "s" : "",
  ].join("");
  const requestedTitle = params.get("title") ?? "";

  return {
    title: requestedTitle,
    display: optionOrDefault(params.get("display"), DISPLAY_MODES, "calendar"),
    units: units || DEFAULT_UNITS,
    theme: optionOrDefault(params.get("theme"), THEMES, "auto"),
    color: optionOrDefault(params.get("color"), COLORS, "blue"),
  };
}

function getUnitFlags(units) {
  const hourIndex = units.indexOf("h");
  const firstM = units.indexOf("m");
  const lastM = units.lastIndexOf("m");
  const calendarContext = units.includes("y") || units.includes("d");

  return {
    years: units.includes("y"),
    months: firstM !== -1 && calendarContext && (hourIndex === -1 || firstM < hourIndex),
    days: units.includes("d"),
    hours: hourIndex !== -1,
    minutes:
      lastM !== -1 &&
      (!calendarContext || (hourIndex !== -1 && lastM > hourIndex) || firstM !== lastM),
    seconds: units.includes("s"),
  };
}

function formatClock(clock, flags) {
  const selected = [
    [flags.hours, clock.hours, "时"],
    [flags.minutes, clock.minutes, "分"],
    [flags.seconds, clock.seconds, "秒"],
  ].filter(([enabled]) => enabled);

  if (selected.length === 0) return "";
  if (selected.length === 1) {
    const [, value, suffix] = selected[0];
    return `${value}${suffix}`;
  }

  return selected.map(([, value]) => String(value).padStart(2, "0")).join(":");
}

export function formatPrimaryValue(duration, display, units) {
  const useDays = display === "days";
  const clock = useDays ? duration.dayClock : duration.calendar;
  const flags = getUnitFlags(units);
  const parts = [];

  if (useDays) {
    parts.push(`${duration.totalDays}天`);
  } else {
    const calendarUnits = [
      [flags.years, duration.calendar.years, "年"],
      [flags.months, duration.calendar.months, "月"],
      [flags.days, duration.calendar.days, "天"],
    ];
    let foundNonZero = false;
    for (const [enabled, value, suffix] of calendarUnits) {
      if (!enabled) continue;
      if (value === 0 && !foundNonZero) continue;
      foundNonZero = true;
      parts.push(`${value}${suffix}`);
    }
  }

  const clockText = formatClock(clock, flags);
  if (clockText) parts.push(clockText);
  return parts.join(" ");
}

export function formatTargetDate(date) {
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 - ${hour}:${minute}`;
}

export function formatLocalDayStart(date = new Date()) {
  const year = String(date.getFullYear()).padStart(4, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00`;
}

export function buildTimerUrl(baseUrl, config) {
  const url = new URL(baseUrl);
  url.search = "";
  url.hash = "";

  for (const key of ["date", "title", "display", "units", "theme", "color"]) {
    if (config[key]) url.searchParams.set(key, config[key]);
  }
  url.searchParams.set("controls", "0");
  return url.toString();
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function buildIframeCode(url, width, height) {
  return `<iframe src="${escapeHtmlAttribute(url)}" width="${escapeHtmlAttribute(width)}" height="${escapeHtmlAttribute(height)}" style="border:0;overflow:hidden" loading="lazy"></iframe>`;
}

export function calculateDuration(target, now = new Date()) {
  const targetTime = target.getTime();
  const nowTime = now.getTime();

  if (!Number.isFinite(targetTime) || !Number.isFinite(nowTime)) {
    throw new TypeError("calculateDuration requires valid Date values");
  }

  const direction = targetTime <= nowTime ? "past" : "future";
  const earlier = direction === "past" ? target : now;
  const later = direction === "past" ? now : target;
  const elapsedMs = later.getTime() - earlier.getTime();

  let cursor = new Date(earlier);
  let years = later.getFullYear() - cursor.getFullYear();
  let candidate = addClampedYears(cursor, years);
  if (candidate > later) {
    years -= 1;
    candidate = addClampedYears(cursor, years);
  }
  cursor = candidate;

  let months = (later.getFullYear() - cursor.getFullYear()) * 12 + later.getMonth() - cursor.getMonth();
  candidate = addClampedMonths(cursor, months);
  if (candidate > later) {
    months -= 1;
    candidate = addClampedMonths(cursor, months);
  }
  cursor = candidate;

  let days = 0;
  while (true) {
    const nextDay = addCalendarDay(cursor);
    if (nextDay > later) break;
    cursor = nextDay;
    days += 1;
  }

  let remainderMs = later.getTime() - cursor.getTime();
  const hours = Math.floor(remainderMs / (60 * 60 * 1000));
  remainderMs -= hours * 60 * 60 * 1000;
  const minutes = Math.floor(remainderMs / (60 * 1000));
  remainderMs -= minutes * 60 * 1000;
  const seconds = Math.floor(remainderMs / 1000);

  let dayRemainderMs = elapsedMs % DAY_MS;
  const dayHours = Math.floor(dayRemainderMs / (60 * 60 * 1000));
  dayRemainderMs -= dayHours * 60 * 60 * 1000;
  const dayMinutes = Math.floor(dayRemainderMs / (60 * 1000));
  dayRemainderMs -= dayMinutes * 60 * 1000;

  return {
    direction,
    calendar: { years, months, days, hours, minutes, seconds },
    totalDays: Math.floor(elapsedMs / DAY_MS),
    dayClock: {
      hours: dayHours,
      minutes: dayMinutes,
      seconds: Math.floor(dayRemainderMs / 1000),
    },
  };
}
