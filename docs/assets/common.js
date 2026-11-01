/* Shared helpers for the ClawHunt static demos. Runs entirely in the browser. */
(function () {
  "use strict";
  const D = {};
  D.$ = (sel, root) => (root || document).querySelector(sel);
  D.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  D.on = (target, event, handler) => target && target.addEventListener(event, handler);
  D.escape = (value) => String(value == null ? "" : value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  D.hash = (str) => {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < String(str).length; i++) {
      h ^= String(str).charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  };
  D.rng = (seed) => {
    let state = (D.hash(seed) || 1) >>> 0;
    return function () {
      state ^= state << 13; state >>>= 0;
      state ^= state >>> 17;
      state ^= state << 5; state >>>= 0;
      return state / 4294967296;
    };
  };
  D.pick = (arr, rand) => arr[Math.floor((rand || Math.random)() * arr.length) % arr.length];
  D.fmtPct = (n, digits) => (Number(n) * 100).toFixed(digits == null ? 1 : digits) + "%";
  D.fmtMoney = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  D.nowStamp = () => "2026-11-01 15:30 UTC";
  D.stamp = () => new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
  D.check = (name, pass, detail) => ({ name, pass: !!pass, detail: detail || "" });
  D.renderChecks = (target, checks) => {
    const host = typeof target === "string" ? D.$(target) : target;
    if (!host) return checks;
    host.innerHTML = checks.map((c) =>
      '<div class="checkrow ' + (c.pass ? "pass" : "fail") + '">' +
      '<span class="dot">' + (c.pass ? "✓" : "!") + "</span>" +
      '<span>' + D.escape(c.name) + "</span>" +
      '<span class="detail">' + D.escape(c.detail) + "</span></div>"
    ).join("");
    const summary = D.$("[data-check-summary]", host.parentElement || document);
    if (summary) {
      const passed = checks.filter((c) => c.pass).length;
      summary.textContent = passed + "/" + checks.length + " 通过";
      summary.className = "badge " + (passed === checks.length ? "good" : "bad");
    }
    return checks;
  };
  D.toast = (message) => {
    let node = D.$("#demo-toast");
    if (!node) {
      node = document.createElement("div");
      node.id = "demo-toast";
      node.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:99;background:#10202f;color:#fff;padding:10px 14px;border-radius:9px;font:13px/1.4 Segoe UI,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2);opacity:0;transition:opacity .2s";
      document.body.appendChild(node);
    }
    node.textContent = message;
    node.style.opacity = "1";
    clearTimeout(node._timer);
    node._timer = setTimeout(() => { node.style.opacity = "0"; }, 2400);
  };
  D.qsParam = (name) => new URLSearchParams(location.search).get(name);
  window.D = D;
})();
