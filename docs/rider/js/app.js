import { DATA } from "./data.js";
import { LOGO, icon } from "./icons.js";
import { $, esc, openModal } from "./ui.js";
import { renderOverview } from "./views/overview.js";
import { renderAgent } from "./views/agent.js";
import { renderH5 } from "./views/h5.js";
import { renderWorkbench } from "./views/workbench.js";
import { renderDashboard } from "./views/dashboard.js";
import { renderSecurity } from "./views/security.js";

const ROUTES = {
  overview: { label: "总览", num: "00", render: renderOverview, title: "骑遇 RiderHire OS · 交付总览" },
  agent: { label: "Agent 引擎", num: "01", render: renderAgent, title: "Agent 对话引擎 · 骑遇" },
  h5: { label: "求职者 H5", num: "02", render: renderH5, title: "求职者 H5 · 骑遇" },
  workbench: { label: "招聘工作台", num: "03", render: renderWorkbench, title: "招聘工作台 · 骑遇" },
  dashboard: { label: "管理驾驶舱", num: "04", render: renderDashboard, title: "管理驾驶舱 · 骑遇" },
  security: { label: "安全合规", num: "05", render: renderSecurity, title: "数据安全与合规 · 骑遇" },
};
const ALIASES = { "0": "overview", "1": "agent", "2": "h5", "3": "workbench", "4": "dashboard", "5": "security", "chat": "agent", "mobile": "h5", "admin": "dashboard", "vault": "security" };

let cleanups = [];
let timers = new Set();
let currentModule = "overview";

function routeFromUrl() {
  const url = new URL(location.href);
  const raw = (url.searchParams.get("m") || "overview").toLowerCase();
  const module = ALIASES[raw] || (ROUTES[raw] ? raw : "overview");
  return { module, scene: url.searchParams.get("scene"), url };
}

function topbarHTML(active) {
  return '<div class="topbar-inner wrap">' +
    '<a class="brand" href="?m=overview" data-route="overview" aria-label="骑遇 RiderHire OS 总览">' +
      '<span class="brand-mark">' + LOGO + '</span>' +
      '<span class="brand-text"><b>骑遇</b><em>RIDERHIRE OS</em></span>' +
    '</a>' +
    '<nav class="nav" aria-label="演示模块">' +
      Object.entries(ROUTES).map(([key, r]) =>
        '<a class="nav-link' + (key === active ? " active" : "") + '" href="?m=' + key + '" data-route="' + key + '"' + (key === active ? ' aria-current="page"' : "") + '>' +
        '<span class="n">' + r.num + '</span>' + r.label + '</a>').join("") +
    '</nav>' +
    '<div class="top-meta">' +
      '<span class="pill pill-quiet">5 个交付物 · 1 套契约</span>' +
      '<span class="pill pill-live"><i></i>合成数据</span>' +
      '<a class="icon-btn" href="https://github.com/Gupeat/clawhunt-agent-demos" target="_blank" rel="noopener" title="GitHub 源码">' + icon("external") + '<span class="hide-sm">源码</span></a>' +
    '</div></div>';
}

function footerHTML() {
  return '<div class="footer-inner wrap">' +
    '<div class="fl"><b>骑遇 RiderHire OS</b><span class="dot"></span><span>骑手招聘 Agent 化信息收集平台 · 投标演示</span><span class="dot"></span><span>2026-11-08</span></div>' +
    '<div class="fl"><span>静态托管 GitHub Pages · 电脑关机仍可访问</span><span class="dot"></span><a href="https://github.com/Gupeat/clawhunt-agent-demos" target="_blank" rel="noopener">源码仓库 ↗</a><span class="dot"></span><a href="../">演示中心</a></div>' +
    '</div>';
}

function renderTopbar(active) {
  const bar = $("#topbar");
  bar.innerHTML = topbarHTML(active);
  bar.querySelectorAll("[data-route]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigate(link.dataset.route);
    });
  });
}

function clearView() {
  cleanups.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  cleanups = [];
  timers.forEach((id) => clearTimeout(id));
  timers.clear();
}

export function navigate(module, scene = null, { push = true } = {}) {
  const target = ROUTES[module] ? module : "overview";
  const url = new URL(location.href);
  url.searchParams.set("m", target);
  if (scene) url.searchParams.set("scene", scene); else url.searchParams.delete("scene");
  if (push) history.pushState({ m: target, scene }, "", url.pathname + url.search + url.hash);
  render(target, scene);
}

function render(module, scene) {
  currentModule = module;
  clearView();
  renderTopbar(module);
  const view = $("#view");
  const route = ROUTES[module];
  document.title = route.title;
  view.innerHTML = "";
  view.scrollTop = 0;
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  const page = document.createElement("div");
  page.className = "page";
  page.dataset.module = module;
  view.appendChild(page);
  const ctx = {
    scene,
    module,
    params: new URL(location.href).searchParams,
    navigate,
    openModal,
    toast: (msg, kind) => window.RIDER_DEMO.toast(msg, kind),
    onCleanup(fn) { cleanups.push(fn); },
    setTimer(fn, ms) { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; },
    clearTimer(id) { clearTimeout(id); timers.delete(id); },
    goScene(nextScene) { navigate(module, nextScene); },
  };
  try {
    route.render(page, ctx);
  } catch (err) {
    console.error("Render failed:", err);
    page.innerHTML = '<div class="wrap"><div class="card" style="padding:24px"><h2 style="font-size:20px">页面渲染失败</h2><p class="muted" style="margin-top:8px">' + esc(err && err.message ? err.message : String(err)) + '</p><p class="muted" style="margin-top:8px">请刷新页面或返回 <a href="?m=overview" style="text-decoration:underline">总览</a>。</p></div></div>';
  }
}

window.addEventListener("popstate", () => {
  const { module, scene } = routeFromUrl();
  render(module, scene);
});

document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go) {
    e.preventDefault();
    navigate(go.dataset.go, go.dataset.scene || null);
  }
});

const boot = routeFromUrl();
$("#footer").innerHTML = footerHTML();
render(boot.module, boot.scene);
window.RIDER_DEMO = {
  version: DATA.meta.version,
  navigate,
  toast: (msg, kind) => import("./ui.js").then((m) => m.toast(msg, kind)),
  routes: ROUTES,
  data: DATA,
  current: () => currentModule,
};
window.__RIDER_READY__ = true;
