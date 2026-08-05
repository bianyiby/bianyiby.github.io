import {
  buildIframeCode,
  buildTimerUrl,
  calculateDuration,
  formatLocalDayStart,
  formatPrimaryValue,
  formatTargetDate,
  normalizeOptions,
  parseLocalDateTime,
} from "./timer-core.mjs";

const params = new URLSearchParams(window.location.search);
const options = normalizeOptions(params);
const requestedDate = params.get("date");
const dateValue = requestedDate || formatLocalDayStart();
const target = parseLocalDateTime(dateValue);
const root = document.documentElement;
const timer = document.querySelector("#timer");
const errorPanel = document.querySelector("#error-panel");
const title = document.querySelector("#event-title");
const arrow = document.querySelector("#timer-arrow");
const value = document.querySelector("#timer-value");
const totalDays = document.querySelector("#total-days");
const targetDate = document.querySelector("#target-date");
const screenReaderStatus = document.querySelector("#screen-reader-status");
const embedButton = document.querySelector("#embed-button");
const embedDialog = document.querySelector("#embed-dialog");
const embedForm = document.querySelector("#embed-form");
const embedCode = document.querySelector("#embed-code");
const copyButton = document.querySelector("#copy-embed-code");
const copyStatus = document.querySelector("#copy-status");

root.dataset.theme = options.theme;
root.dataset.color = options.color;
root.dataset.display = options.display;

const formControl = (name) => embedForm.elements.namedItem(name);

function updateEmbedCode() {
  const rawWidth = formControl("width").value.trim();
  const width = /^\d+(?:px|%)?$/.test(rawWidth) ? rawWidth : "100%";
  const rawHeight = Number.parseInt(formControl("height").value, 10);
  const height = String(Math.min(1200, Math.max(160, Number.isFinite(rawHeight) ? rawHeight : 240)));
  const url = buildTimerUrl(window.location.href, {
    date: formControl("date").value,
    title: formControl("title").value,
    display: formControl("display").value,
    units: formControl("units").value,
    theme: formControl("theme").value,
    color: formControl("color").value,
  });

  embedCode.value = buildIframeCode(url, width, height);
  copyStatus.textContent = "";
}

function openEmbedDialog() {
  formControl("date").value = dateValue;
  formControl("title").value = options.title;
  formControl("display").value = options.display;
  formControl("units").value = options.units;
  formControl("theme").value = options.theme;
  formControl("color").value = options.color;
  updateEmbedCode();
  embedDialog.showModal();
}

async function copyEmbedCode() {
  try {
    await navigator.clipboard.writeText(embedCode.value);
    copyStatus.textContent = "已复制";
  } catch {
    embedCode.focus();
    embedCode.select();
    copyStatus.textContent = "请按 Command/Ctrl+C 复制";
  }
}

if (params.get("controls") === "0") {
  embedButton.hidden = true;
} else {
  embedButton.addEventListener("click", openEmbedDialog);
  embedForm.addEventListener("input", updateEmbedCode);
  copyButton.addEventListener("click", copyEmbedCode);
}

if (!target) {
  document.querySelector("#error-message").textContent = requestedDate
    ? "时间格式无效，请使用本地时间 YYYY-MM-DDTHH:mm 或 YYYY-MM-DDTHH:mm:ss。"
    : "缺少 date 参数，请在 URL 中提供本地起始或目标时间。";
  errorPanel.hidden = false;
} else {
  timer.hidden = false;
  title.textContent = options.title;
  title.title = options.title;
  targetDate.dateTime = dateValue;
  targetDate.textContent = formatTargetDate(target);

  const render = () => {
    const duration = calculateDuration(target, new Date());
    const isPast = duration.direction === "past";

    timer.dataset.direction = duration.direction;
    arrow.textContent = isPast ? "↑" : "↓";
    value.textContent = formatPrimaryValue(duration, options.display, options.units);
    totalDays.hidden = options.display !== "both";
    totalDays.textContent = `累计 ${duration.totalDays} 天`;
    screenReaderStatus.textContent = `${options.title}${isPast ? "已经过去" : "还有"}${value.textContent}`;

    window.setTimeout(render, Math.max(50, 1000 - (Date.now() % 1000) + 15));
  };

  render();
}
