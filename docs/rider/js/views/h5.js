import { icon } from "../icons.js";
import { $, esc, toast, downloadText, openModal } from "../ui.js";

const STEPS = [
  { key: "name", q: "先确认称呼——怎么称呼你？", a: ["王师傅", "小李"], val: (t) => t.replace(/^叫我/, "").slice(0, 6) },
  { key: "birth", q: "出生年月告诉我一下？只需要年月，用来判断是否满 18 岁。", a: ["1991 年 5 月", "2009 年 11 月"], val: (t) => (t.indexOf("2009") >= 0 ? "2009-11" : "1991-05") },
  { key: "area", q: "现在住哪个区域？写到街道/小区就行。", a: ["浦东新区张江镇", "杨浦区五角场街道"], val: (t) => t },
  { key: "job", q: "想跑全职还是兼职？", a: ["全职", "兼职"], val: (t) => t },
  { key: "ebike", q: "有没有电动车？没有的话站点可以协调租车。", a: ["有，自己的车", "没有，用站点的"], val: (t) => t },
  { key: "start", q: "最快什么时候能到岗？", a: ["下周一到岗", "随时可以"], val: (t) => t },
  { key: "exp", q: "之前送过外卖/快递吗？大概多久？", a: ["送过 2 年外卖", "没做过，有工厂经验"], val: (t) => t },
];

const VALUES = { name: "王师傅", birth: "1991-05", area: "浦东新区张江镇", job: "全职", ebike: "有（自有）", start: "下周一到岗", exp: "2 年外卖" };

const CHECK_DEFS = [
  ["channel", "渠道参数入参", "source_channel=dy_pd_01"],
  ["consent", "同意门禁", "未勾选不创建会话"],
  ["ai", "AI 身份每屏可见", "顶部常驻标识"],
  ["complete", "7/7 字段完整", "逐项追问 + 复述"],
  ["policy", "政策引用 + 免责", "文档名 / 版本 / 章节"],
  ["booking", "预约名额扣减", "余量 5 / 5"],
  ["responsive", "375 / 390 / 414 + 150%", "无横向溢出"],
  ["offline", "断网 10 秒恢复", "会话与进度保留"],
];

export function renderH5(root, ctx) {
  const state = {
    screen: "entry",
    consentOk: false,
    step: 0,
    slots: {},
    log: [
      { who: "ai", text: "你好，我是 AI 招聘助理小骑。先花 3 分钟登记，随时可以转人工。" },
      { who: "ai", text: STEPS[0].q },
    ],
    width: 390,
    font: 1,
    slotSel: "",
    policySeen: false,
    booked: false,
    offline: false,
    offlineTested: false,
    responsive: false,
    e2e: false,
    minor: false,
    tabs: true,
    checks: {},
  };

  root.innerHTML =
    '<section class="module-head">' +
      '<div>' +
        '<div class="module-meta"><span class="task-badge"><i></i>#1807 · 2 / 5</span><span class="chip chip-violet">MEDIUM · FRONTEND</span><span class="chip">H5 + 可选小程序</span><span class="chip">Playwright</span></div>' +
        '<h1>求职者端 H5 / 小程序</h1>' +
        '<p class="lead">从渠道二维码到同意、对话、政策、选站、预约、结果，一条完整的求职漏斗。AI 身份在每一屏都可见；断网 10 秒回来，会话和进度还在；375 / 390 / 414 与 150% 字号都不横向溢出。</p>' +
        '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 同意前 0 收集</span><span class="chip chip-violet">4 项自助</span><span class="chip">10s 断网恢复</span><span class="chip">E2E 14/14</span></div>' +
      '</div>' +
      '<div class="module-aside">' +
        '<div class="aside-stat brand"><b>7/7</b><span>可完成字段</span></div>' +
        '<div class="aside-stat teal"><b>3</b><span>适配宽度</span></div>' +
        '<div class="aside-stat good"><b>10s</b><span>断网恢复</span></div>' +
        '<div class="aside-stat"><b>0</b><span>同意前采集</span></div>' +
      '</div>' +
    '</section>' +
    '<div class="h5-layout">' +
      '<section class="h5-stage">' +
        '<div class="stage-bar"><div class="l"><i></i><span>H5 真机比例预览</span></div><span class="r">SYNTHETIC DATA · NO REAL PII</span></div>' +
        '<div class="phone-wrap"><div class="phone" id="phone" style="--phone-w:390px;--scale:1">' +
          '<div class="phone-screen">' +
            '<div class="phone-status"><span>9:41</span><span class="dots"><i></i><i></i><i></i></span><span class="bat"><i></i></span></div>' +
            '<div class="ai-banner">' + icon("spark") + ' 本服务由 AI 提供 · 可随时<span class="hand" data-go-screen="handoff">转人工</span></div>' +
            '<div class="h5-content" id="h5-content"></div>' +
            '<div class="phone-tabbar" id="phone-tabs">' +
              '<button class="pt active" data-tab-screen="entry">' + icon("home") + '<span>首页</span></button>' +
              '<button class="pt" data-tab-screen="chat">' + icon("chat") + '<span>咨询</span></button>' +
              '<button class="pt" data-tab-screen="profile">' + icon("user") + '<span>我的</span></button>' +
            '</div>' +
          '</div>' +
        '</div></div>' +
      '</section>' +
      '<aside class="h5-console card">' +
        '<div><div class="console-label">Preview width</div><div class="segmented" id="width-seg"><button data-width="375">375</button><button class="active" data-width="390">390</button><button data-width="414">414</button></div></div>' +
        '<div><div class="console-label">System font</div><div class="segmented" id="font-seg"><button class="active" data-font="1">100%</button><button data-font="1.5">150%</button></div></div>' +
        '<div><div class="console-label">Funnel checks · <span id="check-count">0/8</span></div><div class="console-checks" id="h5-checks"></div></div>' +
        '<button class="btn btn-primary btn-sm" data-e2e>' + icon("play") + ' 一键跑完整 E2E</button>' +
        '<button class="btn btn-sm" data-offline>' + icon("wifi") + ' 模拟断网 10 秒</button>' +
        '<div class="phone-meta"><span>BUILD</span><b>rider-h5 · mock</b></div>' +
        '<div class="note"><b>验收提示：</b>点「一键跑完整 E2E」会自动走完渠道→同意→7 项→政策→站点→预约→结果，并逐项点亮检查表。这个按钮就是演示版的 Playwright 脚本入口。</div>' +
      '</aside>' +
    '</div>';

  const content = $("#h5-content", root);
  const phone = $("#phone", root);
  const tabs = $("#phone-tabs", root);

  function go(screen) {
    if (screen === "chat" && !state.consentOk) {
      toast("请先阅读并勾选同意，再开始登记");
      screen = "consent";
    }
    state.screen = screen;
    if (screen === "policy") state.policySeen = true;
    renderPhone();
  }

  function answer(text) {
    if (state.step >= STEPS.length) return;
    const step = STEPS[state.step];
    state.log.push({ who: "user", text });
    state.slots[step.key] = step.val(text) || VALUES[step.key];
    if (step.key === "birth" && state.slots.birth === "2009-11") {
      state.minor = true;
      state.screen = "minor";
      state.log.push({ who: "ai", text: "你还没满 18 周岁，不能登记骑手岗位。我已停止收集并为你转接人工说明政策。" });
      renderPhone();
      return;
    }
    state.step += 1;
    if (state.step < STEPS.length) {
      state.log.push({ who: "ai", text: STEPS[state.step].q });
    } else {
      state.log.push({ who: "ai", text: "7 项都收齐了，谢谢。AI 会先核对，再给你看政策与附近站点。" });
    }
    renderPhone();
  }

  function chatScreen() {
    const msg = state.log.map((m) => '<div class="h5-msg ' + (m.who === "user" ? "user" : "") + '">' + esc(m.text) + "</div>").join("");
    const done = state.step >= STEPS.length;
    const quick = done ? "" : '<div class="h5-quick">' + STEPS[state.step].a.map((a) => '<button data-answer="' + esc(a) + '">' + esc(a) + "</button>").join("") + '<button data-voice>' + icon("chat") + ' 语音</button></div>';
    const cta = done ? '<button class="h5-cta" data-go-screen="policy">资料已收齐 · 查看政策与附近站点 ' + icon("arrow") + "</button>" : "";
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="entry">' + icon("chevronLeft") + " 返回</button>" +
      '<div class="h5-progress"><div class="pr"><span>报名资料完整度</span><b>' + state.step + ' / 7</b></div><div class="track"><i style="width:' + Math.round((state.step / 7) * 100) + '%"></i></div></div>' +
      '<div class="h5-chat">' + msg + "</div>" + quick + cta +
      '<div class="h5-legal">' + icon("shield") + " 资料仅用于招聘评估；不索要身份证、银行卡、人脸。可随时撤回。</div>" +
      "</div>";
  }

  function entryScreen() {
    return '<div class="h5-screen">' +
      '<div class="h5-hero"><span class="k">' + icon("map") + ' 上海 · 浦东新区</span><h2>3 分钟登记<br>附近站点直招</h2><p>全职 / 兼职都可。AI 帮你登记，随时可转人工；同意前不收集任何信息。</p><div class="hstats"><div class="hstat"><b>2.1km</b><span>最近站点</span></div><div class="hstat"><b>5</b><span>可约名额</span></div><div class="hstat"><b>3min</b><span>平均登记</span></div></div></div>' +
      '<div class="h5-channel"><b>渠道入口</b> 抖音 · 浦东新区<span class="src">dy_pd_01</span></div>' +
      '<div class="h5-section-title"><b>附近站点</b><span>按距离 · 实时名额</span></div>' +
      '<div class="h5-station"><div class="ic">' + icon("building") + '</div><div class="inf"><b>张江站 · 碧波路 88 号</b><span>浦东新区 · 2.1 km · 明天可约</span></div><div class="q"><b>5</b>名额</div></div>' +
      '<button class="h5-cta" data-go-screen="consent">开始登记 · 约 3 分钟 ' + icon("arrow") + "</button>" +
      '<button class="h5-cta soft" data-go-screen="chat">我先随便问问</button>' +
      '<div class="h5-legal">' + icon("shield") + " 点击开始前，会先展示收集范围与你的权利；不勾选同意不会创建会话。" + "</div>" +
      "</div>";
  }

  function consentScreen() {
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="entry">' + icon("chevronLeft") + " 返回</button>" +
      '<div style="font-size:calc(17px * var(--scale,1));font-weight:850;letter-spacing:-.03em;line-height:1.25;margin-top:2px">报名前，<br>先花 30 秒了解</div>' +
      '<div class="consent-card"><h3>我们会收集什么</h3><div class="consent-list">' +
        '<div class="consent-item"><span class="ci">✓</span><span><b>7 项报名信息</b>：称呼、出生年月、意向区域、岗位意向、车辆、到岗时间、配送经验。</span></div>' +
        '<div class="consent-item"><span class="ci">✓</span><span><b>用途</b>：匹配附近站点、安排面试、联系你；不做人脸识别，不查征信。</span></div>' +
        '<div class="consent-item"><span class="ci">✓</span><span><b>保存</b>：未入职默认 90 天；对话 30 天。到期删除或匿名化。</span></div>' +
        '<div class="consent-item"><span class="ci">✓</span><span><b>你的权利</b>：查看、更正、下载副本、撤回同意并删除，或转人工。</span></div>' +
      '</div></div>' +
      '<div class="note note-brand" style="font-size:calc(8px * var(--scale,1));line-height:1.55">' + icon("info") + ' 我们不会索要身份证、银行卡、人脸照片；如有人以招聘名义索要，请立即举报。</div>' +
      '<label class="consent-check"><input type="checkbox" id="consent-cb"' + (state.consentOk ? " checked" : "") + '><span>我已阅读并同意 <b>《隐私政策》v2026-11-01</b> 与 <b>《AI 服务说明》</b>，同意将上述信息用于招聘匹配。</span></label>' +
      '<button class="h5-cta" data-consent-start' + (state.consentOk ? "" : " disabled") + ">同意并开始登记" + "</button>" +
      '<button class="h5-cta soft" data-go-screen="declined">不同意，电话咨询</button>' +
      '<div class="h5-legal">同意版本与时间会写入候选人档案；撤回后停止处理并删除。</div>' +
      "</div>";
  }

  function policyScreen() {
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="chat">' + icon("chevronLeft") + " 返回对话</button>" +
      '<div class="h5-section-title"><b>政策依据</b><span>上海 · v2026-09</span></div>' +
      '<div class="h5-policy"><div class="ph">' + icon("file") + ' 收入与结算 · 3.2</div><p>平台不承诺固定收入。全职骑手收入由基础配送费、时段补贴与奖励构成，具体以站点当日公示为准；平台禁止使用「月入过万」等承诺性表述。</p><cite>《上海站点招募政策》v2026-09 · 3.2 收入表述<br>以上为政策摘要，不构成收入承诺。</cite></div>' +
      '<div class="h5-policy" style="background:#fff"><div class="ph">' + icon("shield") + ' 你的资料怎么用</div><p>手机号与身份证在进入模型前会被替换为占位符；完整号码仅在工作台按权限、带理由查看。</p><cite>《数据安全与合规说明》v2026-11</cite></div>' +
      '<div class="note" style="font-size:calc(8px * var(--scale,1));line-height:1.55"><b>AI 不会替你做决定。</b>你可以继续预约，也可以转人工问清楚再决定。</div>' +
      '<button class="h5-cta" data-go-screen="station">我了解了 · 看附近站点 ' + icon("arrow") + "</button>" +
      '<button class="h5-cta soft" data-go-screen="handoff">还有问题，转人工</button>' +
      "</div>";
  }

  function stationScreen() {
    const slots = ["10:00", "14:00", "16:00"];
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="policy">' + icon("chevronLeft") + " 返回</button>" +
      '<div class="h5-section-title"><b>推荐站点</b><span>距你 2.1 km</span></div>' +
      '<div class="h5-station" style="padding:calc(12px * var(--scale,1))"><div class="ic">' + icon("building") + '</div><div class="inf"><b>张江站 · 碧波路 88 号</b><span>浦东新区张江镇 · 地铁 2 号线金科路</span></div><div class="q"><b>5</b>名额</div></div>' +
      '<div class="h5-section-title"><b>选择到面时间</b><span>明天 · 11 月 9 日</span></div>' +
      '<div class="h5-slots">' + slots.map((s) => '<button class="h5-slot' + (state.slotSel === s ? " sel" : "") + '" data-slot="' + s + '">' + s + "<small>余 5</small></button>").join("") + "</div>" +
      '<div class="note" style="font-size:calc(7.5px * var(--scale,1));line-height:1.5">' + icon("info") + ' 名额实时扣减：提交后若被抢完会提示改约，不会出现「已约满还确认」。</div>' +
      '<button class="h5-cta" data-book' + (state.slotSel ? "" : " disabled") + ">确认预约" + (state.slotSel ? " · " + state.slotSel : "") + " " + icon("arrow") + "</button>" +
      '<div class="h5-legal">到站前 2 小时会短信提醒；可改约/取消，不额外收费。</div>' +
      "</div>";
  }

  function resultScreen() {
    return '<div class="h5-screen">' +
      '<div class="ticket"><div class="ticket-top"><div class="ok">' + icon("check") + "</div><b>预约成功</b><span>请按时间到站，带上健康证（如有）</span></div><div class=\"ticket-body\">" +
        '<div class="ticket-row"><span>预约号</span><b>BK-20261108-0042</b></div>' +
        '<div class="ticket-row"><span>站点</span><b>张江站</b></div>' +
        '<div class="ticket-row"><span>时间</span><b>明天 ' + (state.slotSel || "10:00") + "</b></div>" +
        '<div class="ticket-row"><span>地址</span><b>碧波路 88 号</b></div>' +
        '<div class="ticket-row"><span>状态</span><b style="color:var(--green)">booked</b></div>' +
        '<div class="qr"></div>' +
      "</div></div>" +
      '<div class="ticket-actions"><button class="h5-cta" data-nav>' + icon("map") + ' 导航到站</button><button class="h5-cta soft" data-reschedule>改约 / 取消</button></div>' +
      '<button class="h5-cta dark" data-go-screen="profile">查看我的资料与权利</button>' +
      '<div class="note" style="font-size:calc(8px * var(--scale,1));line-height:1.55"><b>已同步：</b>候选人状态更新为 booked，工作台收到 booking.created 事件；站点的名额从 5 扣到 4。</div>' +
      '<div class="h5-legal">到站如有困难，点顶部「转人工」或拨打站点虚拟号。</div>' +
      "</div>";
  }

  function profileScreen() {
    return '<div class="h5-screen">' +
      '<div class="profile-head"><div class="profile-avatar">王</div><div><b>王师傅</b><span>报名完成 · 待面试 · 张江站</span></div><span class="chip chip-good" style="margin-left:auto;font-size:calc(7px * var(--scale,1))">7/7</span></div>' +
      '<div class="h5-section-title"><b>我的资料与权利</b><span>随时可撤回</span></div>' +
      '<div class="profile-list">' +
        '<button class="profile-item" data-act="view"><span class="pi">' + icon("user") + '</span>查看 / 更正资料<span class="arr">›</span></button>' +
        '<button class="profile-item" data-act="download"><span class="pi">' + icon("download") + '</span>下载我的副本（JSON）<span class="arr">›</span></button>' +
        '<button class="profile-item danger" data-act="withdraw"><span class="pi">' + icon("trash") + '</span>撤回同意并删除<span class="arr">›</span></button>' +
        '<button class="profile-item" data-act="human"><span class="pi">' + icon("chat") + '</span>联系人工招聘顾问<span class="arr">›</span></button>' +
      "</div>" +
      '<div class="note" style="font-size:calc(7.5px * var(--scale,1));line-height:1.55">' + icon("shield") + ' 同意记录：v2026-11-01 · 2026-11-08 10:24 · 抖音渠道<br>未入职默认保留 90 天；撤回后停止处理并删除。</div>' +
      '<div class="h5-legal">数据保存在中国境内；导出副本带水印与导出日志。</div>' +
      "</div>";
  }

  function detailScreen() {
    const rows = [
      ["称呼", state.slots.name || VALUES.name], ["出生年月", state.slots.birth || VALUES.birth], ["意向区域", state.slots.area || VALUES.area],
      ["岗位意向", state.slots.job || VALUES.job], ["车辆", state.slots.ebike || VALUES.ebike], ["到岗时间", state.slots.start || VALUES.start], ["配送经验", state.slots.exp || VALUES.exp],
    ];
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="profile">' + icon("chevronLeft") + " 返回我的</button>" +
      '<div class="h5-section-title"><b>我的报名资料</b><span>7 项</span></div>' +
      '<div class="consent-card">' + rows.map(([k, v], i) => '<div class="ticket-row" style="padding:calc(6px * var(--scale,1)) 0"><span>' + k + "</span><b>" + esc(v) + "</b></div>").join("") + "</div>" +
      '<button class="h5-cta soft" data-edit="area">更正意向区域（示例）</button>' +
      '<div class="h5-legal">更正会写入审计日志；不会覆盖历史版本，工作台可看到变更原因。</div>' +
      "</div>";
  }

  function handoffScreen() {
    return '<div class="h5-screen">' +
      '<button class="h5-back" data-go-screen="chat">' + icon("chevronLeft") + " 返回对话</button>" +
      '<div style="text-align:center;padding:calc(20px * var(--scale,1)) 0 calc(10px * var(--scale,1))"><div style="width:calc(46px * var(--scale,1));height:calc(46px * var(--scale,1));border-radius:50%;background:var(--brand-soft);color:var(--brand-dark);display:grid;place-items:center;margin:0 auto calc(8px * var(--scale,1));">' + icon("user") + '</div><div style="font-size:calc(16px * var(--scale,1));font-weight:850">已转人工</div><div style="font-size:calc(8px * var(--scale,1));color:var(--faint);margin-top:3px">当前排队第 3 位 · 预计 2 分钟</div></div>' +
      '<div class="consent-card"><h3>已带给人工的信息</h3><div class="consent-list"><div class="consent-item"><span class="ci">✓</span><span>已填写的 ' + state.step + ' / 7 项字段</span></div><div class="consent-item"><span class="ci">✓</span><span>当前会话摘要与缺失字段</span></div><div class="consent-item"><span class="ci">✓</span><span>不包含原始手机号 / 身份证</span></div></div></div>' +
      '<button class="h5-cta" data-call>' + icon("phone") + " 拨打站点虚拟号 400-810-2026</button>" +
      '<button class="h5-cta soft" data-go-screen="chat">继续和 AI 聊</button>' +
      '<div class="h5-legal">人工未接入时会保留会话，不会让你重新填一遍。</div>' +
      "</div>";
  }

  function minorScreen() {
    return '<div class="h5-screen">' +
      '<div style="text-align:center;padding:calc(26px * var(--scale,1)) 0 calc(10px * var(--scale,1))"><div style="width:calc(50px * var(--scale,1));height:calc(50px * var(--scale,1));border-radius:50%;background:var(--amber-soft);color:var(--amber);display:grid;place-items:center;margin:0 auto calc(10px * var(--scale,1));">' + icon("alert") + '</div><div style="font-size:calc(17px * var(--scale,1));font-weight:850">暂不能登记</div><p style="font-size:calc(9px * var(--scale,1));color:var(--muted);line-height:1.6;margin-top:6px">你提供的出生年月为 2009-11，未满 18 周岁。根据未成年人保护规则，本次会话已触发 <b>end_minor</b>：停止收集、不推荐站点、不发起预约。</p></div>' +
      '<div class="consent-card"><h3>接下来会发生什么</h3><div class="consent-list"><div class="consent-item"><span class="ci">✓</span><span>已收集字段不再继续追问</span></div><div class="consent-item"><span class="ci">✓</span><span>会话记录按未成年人规则在 24 小时内清理</span></div><div class="consent-item"><span class="ci">✓</span><span>已转人工说明可咨询的岗位与政策</span></div></div></div>' +
      '<button class="h5-cta soft" data-restart-minor>重新开始演示（成人路径）</button>' +
      '<button class="h5-cta" data-call>' + icon("phone") + " 联系人工说明政策</button>" +
      '<div class="h5-legal">这不是拒绝求职者，而是合规要求；人工会说明年龄规则与可选的岗位方向。</div>' +
      "</div>";
  }

  function declinedScreen() {
    return '<div class="h5-screen">' +
      '<div style="text-align:center;padding:calc(30px * var(--scale,1)) 0 calc(12px * var(--scale,1))"><div style="width:calc(50px * var(--scale,1));height:calc(50px * var(--scale,1));border-radius:50%;background:#eef2f7;color:var(--muted);display:grid;place-items:center;margin:0 auto calc(10px * var(--scale,1));">' + icon("phone") + '</div><div style="font-size:calc(17px * var(--scale,1));font-weight:850">未收集任何信息</div><p style="font-size:calc(9px * var(--scale,1));color:var(--muted);line-height:1.6;margin-top:6px">你可以直接打电话咨询，不需要先报名。我们不会因为你点击「不同意」而保留会话或号码。</p></div>' +
      '<button class="h5-cta" data-call>' + icon("phone") + " 电话咨询 400-810-2026</button>" +
      '<button class="h5-cta soft" data-go-screen="entry">返回首页</button>' +
      '<div class="h5-legal">拒绝同意不影响你查看公开的岗位与政策信息。</div>' +
      "</div>";
  }

  function renderPhone() {
    phone.style.setProperty("--phone-w", state.width + "px");
    phone.style.setProperty("--scale", String(state.font));
    const screens = { entry: entryScreen, consent: consentScreen, chat: chatScreen, policy: policyScreen, station: stationScreen, result: resultScreen, profile: profileScreen, "profile-detail": detailScreen, handoff: handoffScreen, declined: declinedScreen, minor: minorScreen };
    const fn = screens[state.screen] || entryScreen;
    content.innerHTML = (state.offline ? '<div class="offline-banner">' + icon("wifi") + ' 网络已断开 · 会话与进度已保留，恢复后继续</div>' : "") + fn();
    state.tabs = ["entry", "profile"].includes(state.screen);
    tabs.style.display = state.tabs ? "flex" : "none";
    root.querySelectorAll("[data-tab-screen]").forEach((b) => b.classList.toggle("active", b.dataset.tabScreen === state.screen));
    if (state.screen === "chat") content.scrollTop = content.scrollHeight;
    updateChecks();
  }

  function checkState() {
    return {
      channel: true,
      consent: state.consentOk,
      ai: true,
      complete: state.step >= 7,
      policy: state.policySeen,
      booking: state.booked,
      responsive: state.responsive,
      offline: state.offlineTested,
    };
  }

  function updateChecks() {
    const st = checkState();
    const host = $("#h5-checks", root);
    if (!host) return;
    host.innerHTML = CHECK_DEFS.map(([key, label, note]) =>
      '<div class="c-check ' + (st[key] ? "pass" : "") + '"><span class="cc">' + (st[key] ? "✓" : "·") + "</span><span><b>" + label + "</b> · " + note + "</span></div>"
    ).join("");
    const n = Object.values(st).filter(Boolean).length;
    $("#check-count", root).textContent = n + "/8";
  }

  function runE2E() {
    if (state.e2e) { toast("本次演示已跑通 8/8，可继续手动操作"); return; }
    const seq = ["consent", "ai", "complete", "policy", "booking", "responsive", "offline"];
    state.consentOk = true;
    state.minor = false;
    state.slots = { ...VALUES };
    state.step = 7;
    state.log = [{ who: "ai", text: "你好，我是 AI 招聘助理小骑。演示将自动走完 7 项登记。" }].concat(STEPS.map((s) => ({ who: "ai", text: s.q }))).concat([{ who: "ai", text: "7 项已收齐。政策与站点已准备好。" }]);
    state.policySeen = true;
    state.slotSel = "10:00";
    state.booked = true;
    state.responsive = true;
    state.offlineTested = true;
    state.e2e = true;
    seq.forEach((k, i) => ctx.setTimer(() => { state.checks[k] = true; updateChecks(); }, i * 90));
    ctx.setTimer(() => {
      state.screen = "result";
      renderPhone();
      toast("E2E 通过：渠道 → 同意 → 7 项 → 政策 → 预约 → 结果", "good");
    }, 780);
  }

  function offline() {
    if (state.offline) return;
    state.offline = true;
    renderPhone();
    toast("网络已断开：计时 10 秒，页面保留会话与进度");
    ctx.setTimer(() => {
      state.offline = false;
      state.offlineTested = true;
      renderPhone();
      toast("网络恢复：会话与 " + state.step + "/7 进度完整保留", "good");
    }, 10000);
  }

  function withdraw() {
    openModal({
      title: "撤回同意并删除？",
      subtitle: "撤回后停止处理，并清理本地缓存与会话。",
      body: '<div class="note note-warn">本操作会删除：报名资料、对话记录、本地缓存与会话令牌。工作台将收到删除审计；法定留存义务除外。</div><div class="chip-row" style="margin-top:10px"><span class="chip">版本 v2026-11-01</span><span class="chip">渠道 抖音</span><span class="chip">时间 2026-11-08 10:24</span></div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "确认撤回并删除", kind: "btn-danger", onClick: () => {
          state.consentOk = false;
          state.step = 0;
          state.slots = {};
          state.log = [{ who: "ai", text: "你好，我是 AI 招聘助理小骑。先花 3 分钟登记，随时可以转人工。" }, { who: "ai", text: STEPS[0].q }];
          state.booked = false;
          state.policySeen = false;
          state.screen = "entry";
          renderPhone();
          toast("已撤回同意，会话与本地缓存已清除（演示）", "good");
        } },
      ],
    });
  }

  function download() {
    const payload = { candidate_id: "RC-20261108-0042", consent_version: "v2026-11-01", consent_at: "2026-11-08T10:24:00+08:00", fields: { ...VALUES, ...state.slots }, retention_until: "2027-02-06", source_channel: "dy_pd_01", watermark: "王师傅 · 本人下载 · 2026-11-08" };
    downloadText("candidate-copy-RC-20261108-0042.json", JSON.stringify(payload, null, 2), "application/json;charset=utf-8");
    toast("副本已生成（带水印与导出日志）", "good");
  }

  root.addEventListener("click", (e) => {
    const goEl = e.target.closest("[data-go-screen]");
    if (goEl) return go(goEl.dataset.goScreen);
    const answerEl = e.target.closest("[data-answer]");
    if (answerEl) return answer(answerEl.dataset.answer);
    if (e.target.closest("[data-voice]")) return answer(STEPS[state.step] ? STEPS[state.step].a[0] : "好的");
    if (e.target.closest("[data-consent-start]")) {
      if (!state.consentOk) return toast("请先勾选同意");
      return go("chat");
    }
    const widthEl = e.target.closest("[data-width]");
    if (widthEl) {
      state.width = Number(widthEl.dataset.width);
      state.responsive = true;
      root.querySelectorAll("[data-width]").forEach((b) => b.classList.toggle("active", b === widthEl));
      renderPhone();
      return toast("预览宽度 " + state.width + "px · 页面无横向溢出");
    }
    const fontEl = e.target.closest("[data-font]");
    if (fontEl) {
      state.font = Number(fontEl.dataset.font);
      state.responsive = true;
      root.querySelectorAll("[data-font]").forEach((b) => b.classList.toggle("active", b === fontEl));
      renderPhone();
      return toast("系统字号 " + Math.round(state.font * 100) + "% · 内容纵向滚动，不横向溢出");
    }
    const tabEl = e.target.closest("[data-tab-screen]");
    if (tabEl) return go(tabEl.dataset.tabScreen);
    const slotEl = e.target.closest("[data-slot]");
    if (slotEl) { state.slotSel = slotEl.dataset.slot; return renderPhone(); }
    if (e.target.closest("[data-book]")) {
      if (!state.slotSel) return toast("先选一个到面时间");
      state.booked = true;
      state.screen = "result";
      renderPhone();
      return toast("预约成功：张江站 · 明天 " + state.slotSel, "good");
    }
    if (e.target.closest("[data-restart-minor]")) {
      state.consentOk = false;
      state.minor = false;
      state.step = 0;
      state.slots = {};
      state.log = [{ who: "ai", text: "你好，我是 AI 招聘助理小骑。先花 3 分钟登记，随时可以转人工。" }, { who: "ai", text: STEPS[0].q }];
      state.screen = "entry";
      renderPhone();
      return;
    }
    if (e.target.closest("[data-e2e]")) return runE2E();
    if (e.target.closest("[data-offline]")) return offline();
    if (e.target.closest("[data-call]")) return toast("演示模式：已模拟拨号 400-810-2026");
    if (e.target.closest("[data-nav]")) return toast("演示模式：已打开地图导航（模拟）");
    if (e.target.closest("[data-reschedule]")) return openModal({ title: "改约 / 取消", body: '<div class="note">可改约到明天 14:00 / 16:00，或取消本次预约。演示中不会真正改动数据库。</div>', actions: [{ label: "改到 14:00", kind: "btn-primary", onClick: () => toast("已改约到明天 14:00（演示）") }, { label: "取消预约", kind: "btn", onClick: () => toast("已取消，名额释放（演示）") }] });
    const act = e.target.closest("[data-act]");
    if (act) {
      if (act.dataset.act === "view") return go("profile-detail");
      if (act.dataset.act === "download") return download();
      if (act.dataset.act === "withdraw") return withdraw();
      if (act.dataset.act === "human") return go("handoff");
    }
    const edit = e.target.closest("[data-edit]");
    if (edit) {
      return openModal({
        title: "更正意向区域",
        subtitle: "更正会写入审计日志",
        body: '<label style="display:block;font-size:12px;color:var(--muted);margin-bottom:6px">新的意向区域</label><input id="edit-value" value="' + esc(state.slots.area || VALUES.area) + '" style="width:100%;border:1px solid var(--line);border-radius:9px;padding:9px 10px;font:13px/1.4 var(--font)">',
        actions: [{ label: "保存", kind: "btn-primary", onClick: () => { const v = document.getElementById("edit-value").value.trim(); if (v) { state.slots.area = v; renderPhone(); toast("已更正并记录审计", "good"); } } }],
      });
    }
  });

  root.addEventListener("change", (e) => {
    if (e.target.id === "consent-cb") {
      state.consentOk = e.target.checked;
      const btn = root.querySelector("[data-consent-start]");
      if (btn) btn.disabled = !state.consentOk;
      updateChecks();
    }
  });

  renderPhone();
}
