import { icon } from "../icons.js";
import { DATA } from "../data.js";
import { $, esc, toast, openModal, statusTag, sourceColor, initials, fmtInt } from "../ui.js";

const TABS = [
  { id: "candidates", label: "我的候选人", icon: "users", badge: "14" },
  { id: "leads", label: "线索池与分配", icon: "layers", badge: "88" },
  { id: "calendar", label: "面试日历", icon: "calendar", badge: "9" },
  { id: "quota", label: "站点与名额", icon: "building", badge: "5" },
];

const STATE_FLOW = ["new", "collecting", "complete", "booked", "interviewed", "hired"];
const ALLOWED = {
  new: ["collecting", "rejected", "handoff"],
  collecting: ["complete", "rejected", "handoff"],
  complete: ["booked", "rejected", "handoff"],
  booked: ["interviewed", "rejected", "handoff"],
  interviewed: ["hired", "rejected"],
  hired: [],
  rejected: ["collecting"],
  handoff: ["collecting", "rejected"],
};

export function renderWorkbench(root, ctx) {
  const state = {
    tab: "candidates",
    query: "",
    status: "all",
    source: "all",
    drawerId: null,
    revealed: null,
    revealTimer: null,
    imported: false,
    importPct: 0,
    loadRunning: false,
    loadDone: false,
    events: [
      { id: "evt_01HX9A2", type: "candidate.completed", target: "RC-1042", t: "09:42:18" },
      { id: "evt_01HX9A7", type: "booking.created", target: "BK-20261108-0038", t: "09:31:04" },
      { id: "evt_01HX9B1", type: "handoff.requested", target: "RC-1048", t: "08:40:12" },
    ],
    candidates: DATA.candidates.map((c) => ({ ...c })),
  };

  root.innerHTML =
    '<section class="module-head">' +
      '<div>' +
        '<div class="module-meta"><span class="task-badge"><i></i>#1806 · 3 / 5</span><span class="chip chip-violet">HARD · BACKEND + PC</span><span class="chip">FastAPI</span><span class="chip">React + AntD</span><span class="chip">Outbox + HMAC</span></div>' +
        '<h1>招聘工作台与业务服务</h1>' +
        '<p class="lead">候选人状态机、线索去重分配、站点名额与并发预约、事件 outbox + webhook HMAC，全部收在一个可点的 PC 工作台里。手机号默认脱敏；看完整号码必须填理由、走 Vault、只显示一次。</p>' +
        '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 50 并发 · 5 名额 · 0 超卖</span><span class="chip">100 条导入去重</span><span class="chip">每状态变更都有事件</span><span class="chip">水印截图</span></div>' +
      '</div>' +
      '<div class="module-aside">' +
        '<div class="aside-stat brand"><b>50</b><span>并发预约</span></div>' +
        '<div class="aside-stat teal"><b>5/5</b><span>名额准确</span></div>' +
        '<div class="aside-stat good"><b>0</b><span>超卖</span></div>' +
        '<div class="aside-stat"><b>HMAC</b><span>签名 + 重试</span></div>' +
      '</div>' +
    '</section>' +
    '<div class="wb" style="position:relative">' +
      '<aside class="wb-side">' +
        '<div class="wb-brand"><div class="bm">骑</div><div><b>骑遇 · 招聘工作台</b><span>RIDERHIRE OPS</span></div></div>' +
        '<div class="wb-label">Workspace</div>' +
        '<nav class="wb-nav" id="wb-nav">' + TABS.map((t) => '<button data-tab="' + t.id + '"' + (t.id === "candidates" ? ' class="active"' : "") + '>' + icon(t.icon) + "<span>" + t.label + '</span><span class="badge-n">' + t.badge + "</span></button>").join("") + "</nav>" +
        '<div class="wb-label">System</div>' +
        '<nav class="wb-nav"><button data-tab="leads">' + icon("git") + '<span>事件 Outbox</span><span class="badge-n">3</span></button><button data-tab="quota">' + icon("shield") + '<span>权限与审计</span><span class="badge-n">RBAC</span></button></nav>' +
        '<div class="wb-user"><div class="ua">王</div><div><b>王敏</b><span>招聘专员 · 上海 / 张江</span></div></div>' +
      '</aside>' +
      '<div class="wb-main" style="position:relative">' +
        '<div class="wm-overlay" aria-hidden="true"><span style="left:8%;top:18%">王敏 · 招聘专员 · 2026-11-08</span><span style="left:42%;top:46%">王敏 · 招聘专员 · 2026-11-08</span><span style="left:18%;top:78%">王敏 · 招聘专员 · 2026-11-08</span></div>' +
        '<div class="wb-top">' +
          '<div class="crumb">工作台 / <b id="wb-crumb">我的候选人</b></div>' +
          '<div class="search">' + icon("search") + '<input id="wb-search" placeholder="搜索姓名 / 编号 / 手机尾号" autocomplete="off"></div>' +
          '<div class="wm">水印：<b>王敏 · E-1024</b><br>2026-11-08 · 仅限内部</div>' +
        '</div>' +
        '<div class="wb-content" id="wb-content"></div>' +
      '</div>' +
      '<div class="drawer-backdrop" id="wb-backdrop"></div>' +
      '<aside class="drawer" id="wb-drawer" aria-label="候选人详情"></aside>' +
    '</div>';

  const content = $("#wb-content", root);
  const drawer = $("#wb-drawer", root);
  const backdrop = $("#wb-backdrop", root);

  function emit(type, target) {
    const now = new Date();
    const t = [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":");
    state.events.unshift({ id: "evt_local_" + String(state.events.length + 1).padStart(3, "0"), type, target, t });
    state.events = state.events.slice(0, 7);
  }

  function find(id) { return state.candidates.find((c) => c.id === id); }

  function stats() {
    const total = state.candidates.length;
    const booked = state.candidates.filter((c) => c.status === "booked").length;
    const complete = state.candidates.filter((c) => ["complete", "booked", "interviewed", "hired"].includes(c.status)).length;
    const handoff = state.candidates.filter((c) => c.status === "handoff").length;
    return { total, booked, complete, handoff };
  }

  function rows() {
    const q = state.query.trim().toLowerCase();
    const list = state.candidates.filter((c) => {
      if (state.status !== "all" && c.status !== state.status) return false;
      if (state.source !== "all" && c.source !== state.source) return false;
      if (!q) return true;
      return [c.name, c.masked, c.id, c.maskedPhone, c.phone].join(" ").toLowerCase().includes(q);
    });
    if (!list.length) return '<tr><td colspan="7"><div class="wb-empty">没有匹配的候选人。试试清空筛选。</div></td></tr>';
    return list.map((c) => {
      const intentCls = c.intent >= 80 ? "" : c.intent >= 60 ? "mid" : "low";
      return '<tr data-cid="' + c.id + '">' +
        '<td><div class="cname"><div class="cav">' + initials(c.name) + '</div><div><b>' + esc(c.masked) + '</b><span>' + c.id + "</span></div></div></td>" +
        '<td><div class="src"><i style="background:' + sourceColor(c.source) + '"></i>' + esc(c.source) + "</div></td>" +
        '<td>' + esc(c.station) + "</td>" +
        '<td>' + statusTag(c.status) + "</td>" +
        '<td><div class="intent ' + intentCls + '"><span class="dot"></span>' + c.intent + "</div></td>" +
        '<td style="font-family:var(--mono);font-size:8.5px">' + esc(c.maskedPhone) + "</td>" +
        '<td style="color:var(--faint);font-size:8.5px">' + esc(c.updated) + '</td>' +
      "</tr>";
    }).join("");
  }

  function candidatesPane() {
    const s = stats();
    return '<div class="wb-head"><div><h2>我的候选人</h2><p>默认脱敏 · 完整号码按理由查看 · 所有状态变更写事件</p></div><div class="actions"><button class="btn btn-sm" data-goto="leads">' + icon("upload") + ' 导入线索</button><button class="btn btn-primary btn-sm" data-new-candidate>' + icon("plus") + ' 手工登记</button></div></div>' +
      '<div class="wb-stats">' +
        '<div class="wb-stat"><div class="k">我的候选人</div><div class="v">' + s.total + '</div></div>' +
        '<div class="wb-stat"><div class="k">已预约 / 待面</div><div class="v">' + s.booked + ' <small>人</small></div></div>' +
        '<div class="wb-stat"><div class="k">资料完整</div><div class="v">' + s.complete + ' <small>人</small></div></div>' +
        '<div class="wb-stat"><div class="k">待人工跟进</div><div class="v" style="color:var(--amber)">' + s.handoff + ' <small>人</small></div></div>' +
      '</div>' +
      '<div class="wb-tools"><div class="filter">状态<select id="wb-status"><option value="all">全部</option>' + Object.keys({ new: 1, collecting: 1, complete: 1, booked: 1, interviewed: 1, hired: 1, rejected: 1, handoff: 1 }).map((k) => '<option value="' + k + '"' + (state.status === k ? " selected" : "") + ">" + k + "</option>").join("") + '</select></div>' +
      '<div class="filter">渠道<select id="wb-source"><option value="all">全部</option>' + ["抖音", "快手", "58同城", "门店二维码", "转介绍", "短信召回"].map((s) => '<option' + (state.source === s ? " selected" : "") + ">" + s + "</option>").join("") + '</select></div>' +
      '<span class="spacer"></span><span class="chip">手机号默认 138****0001</span></div>' +
      '<div class="cand-table"><table><thead><tr><th>候选人</th><th>渠道</th><th>意向站点</th><th>状态</th><th>意向度</th><th>手机号</th><th>更新</th></tr></thead><tbody id="wb-rows">' + rows() + "</tbody></table></div>" +
      '<div class="wb-foot"><div class="legend"><span><i></i> 新线索</span><span><i style="background:var(--amber)"></i> 待跟进</span><span><i style="background:var(--red)"></i> 需人工</span></div><span>共 ' + state.candidates.length + ' 条 · 每分钟同步</span></div>' +
      '<div class="dcard" style="margin-top:10px"><div class="dh"><div><h3>事件 Outbox</h3><p>状态变更 / 预约 / 转人工 均写入 outbox，由 worker 以 HMAC-SHA256 投递</p></div><span class="badge">LIVE</span></div><div class="qa-list">' + state.events.slice(0, 4).map((e) => '<div><i style="background:var(--teal)"></i><b>' + e.type + '</b> · ' + e.target + ' <span style="margin-left:auto;font-family:var(--mono);color:var(--faint)">' + e.t + "</span></div>").join("") + "</div></div>";
  }

  function leadsPane() {
    return '<div class="wb-head"><div><h2>线索池与分配</h2><p>Excel / CSV / API 三路导入 · 按手机号 token 去重 · 站点 / 区域 / 轮询三种分配</p></div><div class="actions"><button class="btn btn-primary btn-sm" data-import>' + icon("upload") + ' 导入 100 条合成线索</button></div></div>' +
      '<div class="import-zone" data-import>' + icon("upload") + '<b>拖入 Excel / CSV，或点击选择文件</b><p>模板字段：姓名、手机号、意向城市、意向站点、来源渠道。手机号只在导入瞬间进入 Vault。</p><div class="import-progress"><i id="wb-import-bar" style="width:' + state.importPct + '%"></i></div></div>' +
      '<div class="import-stats"><div><b id="wb-import-total">' + (state.imported ? "100" : "0") + '</b><span>导入行数</span></div><div><b id="wb-import-dup" style="color:var(--amber)">' + (state.imported ? "12" : "0") + '</b><span>重复 / 无效</span></div><div><b id="wb-import-ok" style="color:var(--green)">' + (state.imported ? "88" : "0") + '</b><span>去重后有效</span></div></div>' +
      '<div class="dcard" style="margin-top:10px"><div class="dh"><div><h3>候选人状态机</h3><p>服务端只接受白名单转换；非法转换返回 409 并记录 attempt</p></div><span class="badge">8 STATES</span></div><div class="stateflow">' + Object.keys({ new: 1, collecting: 1, complete: 1, booked: 1, interviewed: 1, hired: 1, rejected: 1, handoff: 1 }).map((k, i) => '<div class="state-node ' + (i === 0 ? "hot" : i === 5 ? "good" : "") + '"><b>' + k + '</b><span>' + (i === 0 ? "入口" : i === 5 ? "终态" : "可流转") + "</span></div>").join("") + "</div></div>" +
      '<div class="dcard" style="margin-top:9px"><div class="dh"><div><h3>分配策略</h3><p>站点优先 → 区域兜底 → 轮询；每次分配写 candidate.assigned 事件</p></div></div><div class="profile-grid"><div class="profile-cell"><div class="pk">策略 A</div><div class="pv">意向站点优先</div></div><div class="profile-cell"><div class="pk">策略 B</div><div class="pv">同城区域兜底</div></div><div class="profile-cell"><div class="pk">策略 C</div><div class="pv">站点轮询 · 负载均衡</div></div><div class="profile-cell"><div class="pk">幂等键</div><div class="pv">source_row_hash</div></div></div></div>';
  }

  function calendarPane() {
    const days = ["11-09 周一", "11-10 周二", "11-11 周三", "11-12 周四", "11-13 周五"];
    const blocks = [
      ['<div class="cal-block c"><b>09:30 李娜</b><br>五角场 · 面试</div>', '<div class="cal-block b"><b>10:00 张伟</b><br>张江 · 面试</div>', "", '<div class="cal-block"><b>14:00 郑凯</b><br>张江 · 面试</div>', ""],
      ["", '<div class="cal-block c"><b>13:30 马超</b><br>五角场 · 面试</div>', "", "", '<div class="cal-block b"><b>10:30 何静</b><br>虹桥 · 面试</div>'],
      ['<div class="cal-block b"><b>09:00 高翔</b><br>南山 · 面试</div>', "", "", '<div class="cal-block c"><b>15:00 王强</b><br>张江 · 入职</div>', ""],
      ["", '<div class="cal-block"><b>11:00 陈杰</b><br>虹桥 · 入职</div>', "", "", '<div class="cal-block b"><b>14:00 刘洋</b><br>南山 · 面试</div>'],
      ['<div class="cal-block c"><b>10:00 孙悦</b><br>南山 · 面试</div>', "", "", '<div class="cal-block b"><b>13:00 周婷</b><br>五角场 · 转人工</div>', ""],
    ];
    return '<div class="wb-head"><div><h2>面试日历</h2><p>日 / 周视图 · 名额与面试官冲突校验 · 到面提醒</p></div><div class="actions"><button class="btn btn-sm">' + icon("chevronLeft") + '</button><button class="btn btn-sm">本周</button><button class="btn btn-sm">' + icon("chevron") + "</button></div></div>" +
      '<div class="cal-grid">' + days.map((d, i) => '<div class="cal-col"><div class="ch">' + d + "</div>" + blocks.map((row) => row[i]).join("") + "</div>").join("") + "</div>" +
      '<div class="note" style="margin-top:9px"><b>冲突校验：</b>同一面试官同一时段只能约 1 人；站点当日到面上限 12 人。冲突时返回 409，并建议最近可约时段。</div>';
  }

  function quotaPane() {
    return '<div class="wb-head"><div><h2>站点与名额</h2><p>名额实时扣减 · 50 并发抢最后 5 个名额 · 数据库行锁 + 唯一约束</p></div><span class="chip chip-good">' + icon("lock") + " 无超卖</span></div>" +
      '<div class="load-panel"><h3>并发预约压测</h3><p>模拟 50 个请求同时抢张江站最后 5 个名额。期望：5 成功、45 拒绝、0 超卖。压测脚本在仓库 scripts/load_booking.py。</p><div class="lp-row"><button class="btn btn-primary btn-sm" data-load>' + icon("play") + ' 运行 50 并发压测</button><span id="wb-load-state" style="font-size:8.5px;color:#9fb2c9">' + (state.loadDone ? "已跑通 · 5 / 5" : "等待运行") + '</span></div><div class="load-result"><div><b id="wb-load-req">0</b><span>请求</span></div><div><b id="wb-load-ok">0</b><span>成功</span></div><div><b id="wb-load-rej">0</b><span>拒绝</span></div><div><b id="wb-load-over">0</b><span>超卖</span></div></div><div class="load-log" id="wb-load-log">' + (state.loadDone ? "[done] 50 requests / 5 success / 45 rejected / 0 oversold\n[row-lock] SELECT ... FOR UPDATE SKIP LOCKED\n[unique] (station_id, slot_start) 约束兜底" : "点击运行后，这里会打印事务与行锁日志。") + "</div></div>" +
      '<div class="quota-grid">' + DATA.stations.map((s) => {
        const pct = Math.round((s.used / s.capacity) * 100);
        return '<div class="quota-card"><div class="qt"><b>' + s.name + '</b><span>' + s.city + '</span></div><div class="qbar"><i class="' + (s.open <= 5 ? "hot" : "") + '" style="width:' + pct + '%"></i></div><div class="qmeta"><span>已用 ' + s.used + " / " + s.capacity + "</span><b>余 " + s.open + "</b></div></div>";
      }).join("") + "</div>" +
      '<div class="note" style="margin-top:9px"><b>预约事务：</b>校验名额 → 行锁 → 扣减 → 写 booking → 发 outbox，全部在同一事务；失败回滚，不会出现「确认了但没名额」。</div>';
  }

  function renderMain() {
    const map = { candidates: candidatesPane, leads: leadsPane, calendar: calendarPane, quota: quotaPane };
    content.innerHTML = (map[state.tab] || candidatesPane)();
    $("#wb-crumb", root).textContent = (TABS.find((t) => t.id === state.tab) || TABS[0]).label;
    root.querySelectorAll("#wb-nav [data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === state.tab));
    const search = $("#wb-search", root);
    if (search) search.style.display = state.tab === "candidates" ? "" : "none";
  }

  function drawerBody(c) {
    const revealed = state.revealed === c.id;
    const transitions = ALLOWED[c.status] || [];
    return '<div class="drawer-head"><div class="dh"><h3>' + esc(c.masked) + " " + statusTag(c.status) + '</h3><p>' + c.id + " · " + esc(c.city) + " / " + esc(c.station) + " · 更新 " + esc(c.updated) + '</p></div><button class="drawer-close" data-close-drawer>' + icon("x") + "</button></div>" +
      '<div class="drawer-body">' +
        '<div class="drawer-sec"><h4>AI 画像 <span>7 / 7 · 复核通过</span></h4><div class="profile-grid">' +
          '<div class="profile-cell"><div class="pk">称呼</div><div class="pv">' + esc(c.masked) + ' <span class="ok">✓</span></div></div>' +
          '<div class="profile-cell"><div class="pk">出生年月</div><div class="pv">' + esc(c.birth) + ' <span class="ok">✓</span></div></div>' +
          '<div class="profile-cell"><div class="pk">意向区域</div><div class="pv">' + esc(c.area) + '</div></div>' +
          '<div class="profile-cell"><div class="pk">岗位意向</div><div class="pv">' + esc(c.job) + '</div></div>' +
          '<div class="profile-cell"><div class="pk">车辆</div><div class="pv">' + esc(c.ebike) + '</div></div>' +
          '<div class="profile-cell"><div class="pk">到岗</div><div class="pv">' + esc(c.start) + '</div></div>' +
        '</div><div class="qual-row"><span class="qi">✓</span><span><b>符合：</b>年龄 18–45，区域在站点 10km 内，有配送经验。</span></div>' +
        (c.ebike === "没有" ? '<div class="qual-row warn"><span class="qi">!</span><span><b>需跟进：</b>无电动车，先确认站点合作租车方案再约面试。</span></div>' : "") +
        '<div class="qual-row"><span class="qi">✓</span><span><b>建议：</b>' + esc(c.note) + '</span></div></div>' +
        '<div class="drawer-sec"><h4>联系方式 <span>默认脱敏</span></h4><div class="reveal-box"><div class="reveal-label">手机号</div><div class="num ' + (revealed ? "" : "blur") + '" id="wb-phone">' + (revealed ? esc(c.phone) : esc(c.maskedPhone)) + '</div>' +
          (revealed ? '<div class="audit-mini">已显示一次 · 15 秒后自动隐藏 · 不写浏览器缓存</div>' : '<button class="btn btn-sm" data-reveal="' + c.id + '" style="margin-top:6px">' + icon("eye") + ' 查看完整号码</button>') +
        '</div><div class="audit-mini">2026-11-08 09:43 · 王敏 查看完整手机号 · 理由：预约面试确认 · A-91022</div></div>' +
        '<div class="drawer-sec"><h4>对话摘要 <span>Agent 生成 · 已去标识</span></h4><div class="convo"><b>候选人：</b>想找张江附近的活，有车，下周一能到。<br><b>AI：</b>已记录 7 项；讲解了收入构成（引用上海 v2026-09 · 3.2），未承诺固定收入；推荐张江站。<br><b>下一步：</b>确认面试时间，提醒带健康证。</div><div class="audit-mini">session_summary · 1.2KB · 无原始手机号 / 身份证</div></div>' +
        '<div class="drawer-sec"><h4>状态机 <span>当前 ' + c.status + '</span></h4><div class="chip-row">' + transitions.map((s) => '<button class="chip" data-to-status="' + s + '">→ ' + s + "</button>").join("") + '</div><div class="audit-mini">非法转换会被服务端 409 拒绝；本演示可点下方测试。</div><button class="btn btn-sm" data-illegal="' + c.id + '" style="margin-top:6px">' + icon("alert") + ' 测试非法转换 new → hired</button></div>' +
        '<div class="drawer-sec"><h4>审计 <span>hash chain</span></h4><div class="audit-mini">A-91021 查看候选人 · 09:42:18<br>A-91022 查看完整手机号 · 09:43:02<br>A-91023 更新状态 · 09:44:10</div></div>' +
      '</div>' +
      '<div class="drawer-actions"><button class="btn wide" data-confirm-interview="' + c.id + '">' + icon("calendar") + ' 确认面试 · 预约名额</button><button class="btn" data-handoff="' + c.id + '">转人工</button><button class="btn btn-danger" data-reject="' + c.id + '">标记不合适</button></div>';
  }

  function openDrawer(id) {
    const c = find(id);
    if (!c) return;
    state.drawerId = id;
    drawer.innerHTML = drawerBody(c);
    backdrop.classList.add("open");
    drawer.classList.add("open");
  }

  function closeDrawer() {
    state.drawerId = null;
    backdrop.classList.remove("open");
    drawer.classList.remove("open");
  }

  function refreshDrawer() {
    if (!state.drawerId) return;
    const c = find(state.drawerId);
    if (c) drawer.innerHTML = drawerBody(c);
  }

  function transition(c, next) {
    if (!(ALLOWED[c.status] || []).includes(next)) {
      toast("非法状态转换：" + c.status + " → " + next + "（服务端会返回 409）", "bad");
      emit("state.transition_rejected", c.id + " " + c.status + "→" + next);
      return false;
    }
    c.status = next;
    emit("candidate.updated", c.id + " " + next);
    renderMain();
    refreshDrawer();
    toast("状态已更新为 " + next + " · 已写 outbox", "good");
    return true;
  }

  function reveal(id) {
    const c = find(id);
    if (!c) return;
    openModal({
      title: "查看完整手机号",
      subtitle: "需要理由 · 走 Vault detokenize · 本次显示一次",
      body: '<div class="note note-warn">' + icon("shield") + ' 完整号码会在 15 秒后自动隐藏，不写入浏览器缓存；本次查看会写入审计。</div><label style="display:block;font-size:11px;color:var(--muted);margin:10px 0 5px">查看理由（必填）</label><select id="reveal-reason" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;font:12px var(--font)"><option value="">请选择</option><option>预约面试确认</option><option>候选人本人要求回拨</option><option>站点紧急联络</option></select>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "验证并显示", kind: "btn-primary", close: false, onClick: (close) => {
          const reason = (document.getElementById("reveal-reason") || {}).value;
          if (!reason) return toast("必须填写查看理由", "bad");
          state.revealed = id;
          refreshDrawer();
          close();
          toast("已通过 Vault 取回号码 · 15 秒后隐藏", "good");
          state.revealTimer = ctx.setTimer(() => { if (state.revealed === id) { state.revealed = null; refreshDrawer(); } }, 15000);
        } },
      ],
    });
  }

  function reject(id) {
    const c = find(id);
    if (!c) return;
    openModal({
      title: "标记不合适",
      subtitle: "必须填写原因；原因会进入候选人档案与审计",
      body: '<textarea id="reject-reason" placeholder="例如：通勤距离超过 20 公里，站点无法保障早班到岗。" style="width:100%;min-height:90px;border:1px solid var(--line);border-radius:9px;padding:9px;font:12px/1.55 var(--font);resize:vertical"></textarea><div class="note" style="margin-top:8px">不建议写主观评价；只写可复核的事实，避免歧视性表述。</div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "确认标记", kind: "btn-danger", close: false, onClick: (close) => {
          const el = document.getElementById("reject-reason");
          const reason = el ? el.value.trim() : "";
          if (reason.length < 4) return toast("必须填写至少 4 个字的具体原因", "bad");
          c.status = "rejected";
          emit("candidate.rejected", c.id);
          renderMain(); refreshDrawer();
          close();
          toast("已标记不合适并记录原因", "good");
        } },
      ],
    });
  }

  function importLeads() {
    if (state.importPct > 0 && !state.imported) return;
    state.imported = false;
    state.importPct = 0;
    const bar = $("#wb-import-bar", root);
    const total = $("#wb-import-total", root);
    const dup = $("#wb-import-dup", root);
    const ok = $("#wb-import-ok", root);
    let step = 0;
    const tick = () => {
      step += 1;
      state.importPct = Math.min(100, step * 10);
      if (bar) bar.style.width = state.importPct + "%";
      if (total) total.textContent = String(Math.round(100 * state.importPct / 100));
      if (dup) dup.textContent = String(Math.round(12 * state.importPct / 100));
      if (ok) ok.textContent = String(Math.round(88 * state.importPct / 100));
      if (state.importPct < 100) ctx.setTimer(tick, 90);
      else {
        state.imported = true;
        emit("candidate.imported", "batch_20261108 · 100 rows / 88 valid");
        toast("导入完成：100 行 → 去重 12 → 有效 88，已按站点分配", "good");
        renderMain();
      }
    };
    tick();
  }

  function runLoad() {
    if (state.loadRunning) return;
    state.loadRunning = true;
    const req = $("#wb-load-req", root), ok = $("#wb-load-ok", root), rej = $("#wb-load-rej", root), over = $("#wb-load-over", root), log = $("#wb-load-log", root), st = $("#wb-load-state", root);
    let i = 0;
    if (log) log.textContent = "";
    const lines = ["[start] 50 concurrent booking requests -> ST-01 / 5 slots", "[tx] BEGIN; SELECT open_quota FROM station WHERE id='ST-01' FOR UPDATE;", "[lock] serialized by row lock; unique(station_id, slot_start) as second guard", "[done] 5 confirmed; 45 rejected quota_exhausted; 0 oversold"];
    const timer = ctx.setTimer(function tick() {
      i += 1;
      if (req) req.textContent = String(i * 5);
      if (ok) ok.textContent = String(Math.min(5, Math.round((i / 10) * 5)));
      if (rej) rej.textContent = String(Math.max(0, i * 5 - Math.min(5, Math.round((i / 10) * 5))));
      if (log && lines[Math.min(lines.length - 1, Math.floor(i / 3))]) log.textContent += (log.textContent ? "\n" : "") + lines[Math.min(lines.length - 1, Math.floor(i / 3))];
      if (i < 10) return ctx.setTimer(tick, 130);
      state.loadRunning = false;
      state.loadDone = true;
      if (ok) ok.textContent = "5";
      if (rej) rej.textContent = "45";
      if (over) over.textContent = "0";
      if (st) st.textContent = "已跑通 · 5 / 5";
      if (log) log.textContent = lines.join("\n");
      emit("booking.quota_test", "ST-01 · 50req / 5ok / 45rej / 0oversold");
      toast("并发压测通过：50 请求 · 5 成功 · 45 拒绝 · 0 超卖", "good");
    }, 130);
    void timer;
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { state.tab = tab.dataset.tab; renderMain(); return; }
    const row = e.target.closest("tr[data-cid]");
    if (row) return openDrawer(row.dataset.cid);
    if (e.target.closest("[data-close-drawer]") || e.target === backdrop) return closeDrawer();
    const revealEl = e.target.closest("[data-reveal]");
    if (revealEl) return reveal(revealEl.dataset.reveal);
    const rejectEl = e.target.closest("[data-reject]");
    if (rejectEl) return reject(rejectEl.dataset.reject);
    const handoffEl = e.target.closest("[data-handoff]");
    if (handoffEl) { const c = find(handoffEl.dataset.handoff); if (c) transition(c, "handoff"); return; }
    const interviewEl = e.target.closest("[data-confirm-interview]");
    if (interviewEl) { const c = find(interviewEl.dataset.confirmInterview); if (c) transition(c, "booked"); return; }
    const illegalEl = e.target.closest("[data-illegal]");
    if (illegalEl) { const c = find(illegalEl.dataset.illegal); if (c) { toast("服务端拒绝：new → hired 不在白名单（409）", "bad"); emit("state.transition_rejected", c.id + " new→hired"); } return; }
    const toStatus = e.target.closest("[data-to-status]");
    if (toStatus) { const c = find(state.drawerId); if (c) transition(c, toStatus.dataset.toStatus); return; }
    if (e.target.closest("[data-import]")) return importLeads();
    if (e.target.closest("[data-load]")) return runLoad();
    if (e.target.closest("[data-goto]")) { state.tab = e.target.closest("[data-goto]").dataset.goto; return renderMain(); }
    if (e.target.closest("[data-new-candidate]")) return toast("演示：手工登记表单会复用 Agent 的 7 项校验");
  });

  root.addEventListener("input", (e) => {
    if (e.target.id === "wb-search") {
      state.query = e.target.value;
      const tbody = $("#wb-rows", root);
      if (tbody) tbody.innerHTML = rows();
    }
  });

  root.addEventListener("change", (e) => {
    if (e.target.id === "wb-status") { state.status = e.target.value; renderMain(); }
    if (e.target.id === "wb-source") { state.source = e.target.value; renderMain(); }
  });

  ctx.onCleanup(() => { if (state.revealTimer) ctx.clearTimer(state.revealTimer); });
  renderMain();
}
