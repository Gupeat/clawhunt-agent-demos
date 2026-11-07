/* Small DOM + SVG helpers. No dependencies. */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const esc = (value) => String(value == null ? "" : value)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
export const on = (target, event, handler, opts) => {
  if (!target) return () => {};
  target.addEventListener(event, handler, opts);
  return () => target.removeEventListener(event, handler, opts);
};
export const delegate = (root, selector, event, handler) => {
  if (!root) return () => {};
  const fn = (e) => {
    const target = e.target.closest(selector);
    if (target && root.contains(target)) handler(e, target);
  };
  root.addEventListener(event, fn);
  return () => root.removeEventListener(event, fn);
};
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
export const uid = (prefix = "id") => prefix + "-" + Math.random().toString(36).slice(2, 8);
export const fmtInt = (n) => Number(n).toLocaleString("en-US");
export const fmtPct = (n, d = 1) => Number(n).toFixed(d) + "%";
export const fmtTime = (date = new Date()) => date.toTimeString().slice(0, 5);
export const escapeAttr = (s) => esc(s).replace(/\n/g, " ");

export function toast(message, kind = "") {
  const root = document.getElementById("toast-root");
  if (!root) return;
  const node = document.createElement("div");
  node.className = "toast " + kind;
  node.textContent = message;
  root.appendChild(node);
  requestAnimationFrame(() => node.classList.add("show"));
  setTimeout(() => {
    node.classList.remove("show");
    setTimeout(() => node.remove(), 250);
  }, 2600);
}

export function openModal({ title, subtitle = "", body = "", actions = [], width = "", dismissible = true, onMount = null }) {
  const root = document.getElementById("modal-root");
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = '<div class="modal" role="dialog" aria-modal="true" ' + (width ? 'style="width:min(' + width + ',100%)"' : "") + '>' +
    '<div class="modal-head"><div class="mh"><h3>' + esc(title) + '</h3>' + (subtitle ? '<p>' + esc(subtitle) + '</p>' : "") + '</div>' +
    '<button class="icon-btn" data-close aria-label="关闭" style="padding:4px 7px">✕</button></div>' +
    '<div class="modal-body">' + body + '</div>' +
    (actions.length ? '<div class="modal-foot">' + actions.map((a, i) => '<button class="btn ' + (a.kind || "") + '" data-act="' + i + '">' + esc(a.label) + '</button>').join("") + '</div>' : "") +
    '</div>';
  root.appendChild(backdrop);
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => backdrop.classList.add("open"));
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    backdrop.classList.remove("open");
    document.body.style.overflow = prevOverflow;
    setTimeout(() => backdrop.remove(), 200);
  };
  backdrop.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  if (dismissible) backdrop.addEventListener("click", (e) => { if (e.target === backdrop) close(); });
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  const origClose = close;
  const wrappedClose = () => { document.removeEventListener("keydown", onKey); origClose(); };
  backdrop.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
    const a = actions[Number(b.dataset.act)];
    if (a && a.onClick) a.onClick(wrappedClose, backdrop);
    if (!a || a.close !== false) wrappedClose();
  }));
  if (onMount) onMount(backdrop, wrappedClose);
  return { root: backdrop, close: wrappedClose };
}

export function sparkline(values, color = "#ff5a1f", width = 150, height = 30) {
  if (!values || !values.length) return "";
  const min = Math.min(...values), max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1 || 1);
  const pts = values.map((v, i) => [i * step, height - 3 - ((v - min) / span) * (height - 7)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + " L" + width + " " + height + " L0 " + height + " Z";
  const gid = uid("sg");
  return '<svg class="spark" viewBox="0 0 ' + width + " " + height + '" preserveAspectRatio="none" aria-hidden="true">' +
    '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".22"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + area + '" fill="url(#' + gid + ')"/>' +
    '<path d="' + line + '" fill="none" stroke="' + color + '" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
}

export function lineChart({ series = [], labels = [], width = 620, height = 190, colors = ["#ff5a1f", "#2563eb", "#0f9f8f"], fillFirst = true, yMax = null, yTicks = 4 }) {
  const padL = 38, padR = 8, padT = 10, padB = 26;
  const w = width - padL - padR, h = height - padT - padB;
  const all = series.flatMap((s) => s.values || []);
  const max = yMax || Math.max(1, ...all) * 1.12;
  const stepX = w / Math.max(1, labels.length - 1);
  const y = (v) => padT + h - (v / max) * h;
  let grid = "", axis = "";
  for (let i = 0; i <= yTicks; i++) {
    const yy = padT + (h / yTicks) * i;
    const val = Math.round(max - (max / yTicks) * i);
    grid += '<line x1="' + padL + '" y1="' + yy + '" x2="' + (width - padR) + '" y2="' + yy + '" stroke="#eef1f6" stroke-width="1"/>';
    axis += '<text x="' + (padL - 6) + '" y="' + (yy + 3) + '" text-anchor="end" font-size="7" fill="#9aa6b6">' + fmtInt(val) + '</text>';
  }
  labels.forEach((lab, i) => {
    const xx = padL + i * stepX;
    axis += '<text x="' + xx + '" y="' + (height - 8) + '" text-anchor="middle" font-size="7" fill="#9aa6b6">' + esc(lab) + '</text>';
  });
  let paths = "";
  series.forEach((s, si) => {
    const color = s.color || colors[si % colors.length];
    const pts = (s.values || []).map((v, i) => [padL + i * stepX, y(v)]);
    if (!pts.length) return;
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    if (si === 0 && fillFirst) {
      const gid = uid("lg");
      paths += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + color + '" stop-opacity=".18"/><stop offset="1" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>';
      paths += '<path d="' + d + " L" + pts[pts.length - 1][0] + " " + (padT + h) + " L" + pts[0][0] + " " + (padT + h) + ' Z" fill="url(#' + gid + ')"/>';
    }
    paths += '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    pts.forEach((p, i) => {
      if (i === pts.length - 1) paths += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="3" fill="#fff" stroke="' + color + '" stroke-width="1.8"/>';
    });
  });
  return '<svg class="chart-svg" viewBox="0 0 ' + width + " " + height + '" role="img" aria-label="趋势图">' + grid + axis + paths + '</svg>';
}

export function downloadText(filename, text, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["\ufeff" + text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast("已复制到剪贴板", "good");
  } catch {
    toast("复制失败，请手动选择文本");
  }
}

export const STATUS = {
  new: { label: "新线索", cls: "st-new" },
  collecting: { label: "收集中", cls: "st-collecting" },
  complete: { label: "已完整", cls: "st-complete" },
  booked: { label: "已预约", cls: "st-booked" },
  interviewed: { label: "已到面", cls: "st-interviewed" },
  hired: { label: "已入职", cls: "st-hired" },
  rejected: { label: "不合适", cls: "st-rejected" },
  handoff: { label: "转人工", cls: "st-handoff" },
};
export const statusTag = (status) => {
  const s = STATUS[status] || STATUS.new;
  return '<span class="tag-status ' + s.cls + '">' + s.label + '</span>';
};
export const sourceColor = (source) => {
  const map = { "抖音": "#111", "快手": "#ff5a1f", "58同城": "#2563eb", "门店二维码": "#0f9f8f", "转介绍": "#6d4aff", "短信召回": "#b7791f" };
  return map[source] || "#5d6b7e";
};
export const initials = (name) => String(name || "?").slice(0, 1);
