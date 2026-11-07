import { DATA } from "../data.js";
import { icon } from "../icons.js";
import { esc, fmtInt } from "../ui.js";

const TASKS = [
  {
    no: "01", task: "#1808", type: "HARD · ML", accent: "#ff5a1f",
    title: "Agent 对话引擎与政策知识库",
    desc: "把口语、追问、政策引用和转人工收敛成 7 个可校验字段；模型请求里永远看不到原始手机号与身份证。",
    evidence: ["7/7 槽位", "引用到章节", "0 PII 入模", "注入防护"],
    route: "agent", link: "?m=agent",
  },
  {
    no: "02", task: "#1807", type: "MEDIUM · FRONTEND", accent: "#6d4aff",
    title: "求职者端 H5 / 小程序",
    desc: "从渠道二维码到同意、对话、政策、选站、预约、结果的一条完整漏斗；断网 10 秒恢复，375/390/414 与 150% 字号都不溢出。",
    evidence: ["同意门禁", "4 项自助", "断网恢复", "Playwright E2E"],
    route: "h5", link: "?m=h5",
  },
  {
    no: "03", task: "#1806", type: "HARD · BACKEND", accent: "#2563eb",
    title: "招聘工作台与业务服务",
    desc: "候选人状态机、线索去重、名额与预约并发、Webhook 幂等、完整手机号查看审批——每一个动作都有审计与证据。",
    evidence: ["50 并发 0 超卖", "状态机", "HMAC 事件", "水印"],
    route: "workbench", link: "?m=workbench",
  },
  {
    no: "04", task: "#1805", type: "MEDIUM · DATA", accent: "#0f9f8f",
    title: "管理驾驶舱与配置后台",
    desc: "7 个 KPI 与 SQL 校验脚本逐项对齐；配置改动必须二次复核，带 diff 与一键回滚，LLM 不可见字段强制 KEEP-AWAY。",
    evidence: ["10k 事件", "7 KPI 对账", "二次复核", "0 PII 聚合"],
    route: "dashboard", link: "?m=dashboard",
  },
  {
    no: "05", task: "#1804", type: "HARD · SECURITY", accent: "#12854a",
    title: "数据安全与合规模块",
    desc: "字段级加密、Vault 令牌化、可控还原、RBAC 与城市/站点边界、哈希链审计、留存到期与撤回同意删除。",
    evidence: ["100% 召回", "哈希链定位", "密钥轮换", "OWASP"],
    route: "security", link: "?m=security",
  },
];

export function renderOverview(root, ctx) {
  root.innerHTML = heroHTML() + statsHTML() + tasksHTML() + archHTML() + matrixHTML() + closeHTML();
  const heroChat = root.querySelector("[data-hero-chat]");
  if (heroChat) {
    const lines = [
      ["ai", "你好，我是 AI 招聘助理小骑。3 分钟帮你登记，随时可以转人工。"],
      ["user", "我在浦东张江，有电动车，想跑全职。"],
      ["ai", "已记下区域、车辆、岗位 3 项。还差到岗时间和配送经验，我接着问。"],
      ["user", "下周能到，之前送过两年外卖。"],
    ];
    let i = 0;
    const add = () => {
      if (i >= lines.length) return;
      const [who, text] = lines[i++];
      heroChat.insertAdjacentHTML("beforeend", '<div class="mini-msg ' + who + '">' + esc(text) + '</div>');
      ctx.setTimer(add, i === 1 ? 500 : 700);
    };
    ctx.setTimer(add, 500);
  }
  root.querySelectorAll("[data-count]").forEach((node) => {
    const target = Number(node.dataset.count);
    const suffix = node.dataset.suffix || "";
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 900);
      node.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString("en-US") + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  root.querySelectorAll("[data-scroll]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(el.dataset.scroll);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function heroHTML() {
  return '<section class="hero">' +
    '<div class="wrap hero-grid">' +
      '<div class="hero-copy">' +
        '<div class="eyebrow light">RIDER RECRUITMENT OS · 5 DELIVERABLES</div>' +
        '<h1>不是五个页面，<br><span class="accent">是一条从投放到入职的证据链。</span></h1>' +
        '<p class="hero-lede">骑手招聘 Agent 化信息收集平台：把 AI 对话、求职者报名、招聘工作台、管理驾驶舱与数据合规，做成一套共用接口契约、又能逐项独立验收的交付物。每一页都能点、能测、能复核。</p>' +
        '<div class="hero-actions">' +
          '<a class="btn btn-primary btn-lg" href="?m=h5">从求职者视角走一遍 ' + icon("arrow") + '</a>' +
          '<a class="btn btn-lg" href="?m=agent">看 Agent 收齐 7 项 ' + icon("chevron") + '</a>' +
          '<a class="btn btn-lg" href="#tasks" data-scroll="#tasks">五个交付物 ' + icon("chevronDown") + '</a>' +
        '</div>' +
        '<div class="hero-points">' +
          '<span><i class="dot"></i><b>7/7</b> 字段完整</span>' +
          '<span><i class="dot"></i><b>0</b> 原始 PII 进入模型</span>' +
          '<span><i class="dot"></i><b>50</b> 并发抢 5 名额不超卖</span>' +
          '<span><i class="dot"></i><b>5/5</b> 交付物共用契约</span>' +
        '</div>' +
      '</div>' +
      '<div class="hero-proof" aria-label="Agent 对话快照">' +
        '<div class="proof-head"><b>LIVE PROOF · 收齐 7 项</b><span class="proof-live"><i></i>DEMO RUNNING</span></div>' +
        '<div class="mini-chat" data-hero-chat></div>' +
        '<div class="mini-progress"><div class="lbl"><span>资料完整度</span><b>7 / 7</b></div><div class="mini-track"><i></i></div></div>' +
        '<div class="proof-grid">' +
          '<div class="proof-stat"><b data-count="7">7</b><span>已确认字段</span></div>' +
          '<div class="proof-stat"><b data-count="300" data-suffix="+">300+</b><span>评测对话</span></div>' +
          '<div class="proof-stat"><b data-count="0">0</b><span>合规违规</span></div>' +
        '</div>' +
        '<div class="proof-foot">' + icon("shield") + '手机号/身份证在进入模型前替换为占位符；页面数据全部为合成。</div>' +
      '</div>' +
    '</div>' +
  '</section>';
}

function statsHTML() {
  const items = [
    { icon: "layers", value: "5", label: "可独立验收的交付物", sub: "同一套接口契约" },
    { icon: "chat", value: "7/7", label: "一次对话收齐字段", sub: "口语 + 追问 + 复述" },
    { icon: "shield", value: "0", label: "真实 PII / 真实资金", sub: "全站合成数据" },
    { icon: "database", value: "10k+", label: "驾驶舱事件对账", sub: "7 个 KPI 逐项 SQL 校验" },
  ];
  return '<section class="wrap"><div class="stat-strip">' + items.map((it) =>
    '<div class="stat-box"><div class="stat-icon">' + icon(it.icon) + '</div><div><b>' + it.value + '</b><span>' + it.label + ' · ' + it.sub + '</span></div></div>'
  ).join("") + '</div></section>';
}

function tasksHTML() {
  return '<section class="wrap section" id="tasks">' +
    '<div class="section-head"><div><div class="eyebrow">Five deliverables</div><h2>五个交付物，五个可复核的证据面</h2><p>不是把需求复述一遍，而是把每个验收点做成页面上可点通的证据。点开任一模块，直接进入对应验收场景。</p></div><span class="chip chip-teal">' + icon("check") + ' 全部可交互</span></div>' +
    '<div class="task-grid">' +
    TASKS.map((t) =>
      '<a class="task-card" style="--accent:' + t.accent + '" href="' + t.link + '">' +
        '<div class="task-top"><span class="task-no">' + t.no + '</span><span class="task-tag">' + t.task + ' · ' + t.type + '</span></div>' +
        '<h3>' + t.title + '</h3>' +
        '<p>' + t.desc + '</p>' +
        '<div class="task-evidence">' + t.evidence.map((e) => '<span>' + e + '</span>').join("") + '</div>' +
        '<span class="task-link">打开对应演示 ' + icon("arrow") + '</span>' +
      '</a>').join("") +
      '<a class="task-card" style="--accent:#5d6b7e" href="?m=security&scene=rbac">' +
        '<div class="task-top"><span class="task-no">BASE</span><span class="task-tag">CONTRACT · V1</span></div>' +
        '<h3>共用接口契约与验收底座</h3>' +
        '<p>Candidate / Station / Booking 字段、REST /api/v1 错误体、Agent session 协议、Vault 与 Webhook 事件——五个模块共用一套契约，避免各做各的。</p>' +
        '<div class="task-evidence"><span>OpenAPI</span><span>契约测试</span><span>合成数据</span><span>一条命令</span></div>' +
        '<span class="task-link">看权限边界 ' + icon("arrow") + '</span>' +
      '</a>' +
    '</div></section>';
}

function archHTML() {
  return '<section class="wrap section"><div class="arch-panel">' +
    '<div class="section-head" style="margin-bottom:0"><div><div class="eyebrow light">Shared architecture</div><h2 style="color:#fff;font-size:24px">一套契约，五个交付物</h2><p style="color:#9eb0c6">前端只认 API 契约；模型只认脱敏后的文本；安全能力以 SDK 方式被 Agent 与工作台复用。</p></div><span class="chip" style="background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.15);color:#dbe7f3">REST /api/v1 · OpenAPI 3.1</span></div>' +
    '<div class="arch">' +
      '<div class="arch-layer"><div class="alabel">01 · 触达</div><div class="arch-node"><b>渠道二维码 / H5</b>source_channel 入参，同意门禁</div><div class="arch-node"><b>小程序（可选）</b>Taro 复用同一套 API</div></div>' +
      '<div class="arch-layer"><div class="alabel">02 · 接入</div><div class="arch-node hot"><b>FastAPI BFF</b>员工 JWT / 候选人会话令牌</div><div class="arch-node"><b>Agent Session</b>messages → reply / progress / actions</div></div>' +
      '<div class="arch-layer"><div class="alabel">03 · 能力</div><div class="arch-node"><b>Agent 引擎</b>7 槽位 · 政策 KB · 降级</div><div class="arch-node"><b>Vault / 脱敏 SDK</b>tokenize / detokenize / reason</div><div class="arch-node"><b>预约与名额</b>行锁 · 不超卖 · Outbox</div></div>' +
      '<div class="arch-layer"><div class="alabel">04 · 数据</div><div class="arch-node"><b>PostgreSQL 16</b>+ pgvector 政策检索</div><div class="arch-node"><b>Redis 7.2</b>会话 / 幂等 / 限流</div><div class="arch-node"><b>审计链</b>append-only · 哈希链</div></div>' +
    '</div>' +
    '<div class="arch-note">' + icon("info") + '<span>演示页是纯静态、确定性的交互原型：所有“运行”都在浏览器内完成，不访问真实客户系统；生产交付按上图落地，接口、测试与部署说明随仓库提供。</span></div>' +
    '</div></section>';
}

function matrixHTML() {
  const rows = [
    ["#1808", "Agent 引擎", "7/7 槽位 · 政策引用 · 0 PII 入模 · 降级/注入", "?m=agent"],
    ["#1807", "求职者 H5", "同意门禁 · 4 项自助 · 断网恢复 · 三档宽度 + 150% 字号", "?m=h5"],
    ["#1806", "招聘工作台", "状态机 · 50 并发不超卖 · HMAC 幂等 · 手机号审批", "?m=workbench"],
    ["#1805", "管理驾驶舱", "7 KPI 对账 · 聚合 0 PII · 二次复核 · KEEP-AWAY", "?m=dashboard"],
    ["#1804", "安全合规", "Vault · 100% 召回 · 哈希链定位 · 留存清理 · RBAC", "?m=security"],
  ];
  return '<section class="wrap section"><div class="section-head"><div><div class="eyebrow">Acceptance map</div><h2>验收点 → 演示入口</h2><p>每个入口都对应任务书里的硬验收，而不是泛泛的产品介绍。</p></div></div>' +
    '<div class="card matrix-card"><div class="table-wrap"><table><thead><tr><th>任务</th><th>交付物</th><th>本页可直接复核的证据</th><th>入口</th></tr></thead><tbody>' +
    rows.map((r) => '<tr><td><b class="mono" style="font-size:11px">' + r[0] + '</b></td><td><b>' + r[1] + '</b></td><td class="muted" style="font-size:12px">' + r[2] + '</td><td><a class="btn btn-sm" href="' + r[3] + '">打开 ' + icon("arrow") + '</a></td></tr>').join("") +
    '</tbody></table></div></div></section>';
}

function closeHTML() {
  return '<section class="wrap section"><div class="card" style="padding:22px;display:grid;grid-template-columns:1.2fr .8fr;gap:22px;align-items:center">' +
    '<div><div class="eyebrow">How to review</div><h2 style="font-size:22px;margin-top:6px">三步验收，不需要装环境</h2><p class="muted" style="font-size:12.5px;margin-top:6px">打开任一模块 → 点页面里的“运行/验收”按钮 → 看右侧证据面板。所有结果可重复，刷新即回到初始状态。</p>' +
      '<div class="chip-row mt12"><span class="chip chip-good">' + icon("check") + ' 静态托管</span><span class="chip">' + icon("wifi") + ' 断网可打开</span><span class="chip">' + icon("shield") + ' 合成数据</span><span class="chip">' + icon("git") + ' 源码公开</span></div></div>' +
    '<div class="note note-brand"><b>先说清楚：</b>这是投标阶段的可交互交付原型，不是已经接入甲方真实账号/生产模型/真实 PII 的系统。真实落地时按共用契约替换数据源，验收脚本与证据记录随仓库交付。</div>' +
    '</div></section>';
}
