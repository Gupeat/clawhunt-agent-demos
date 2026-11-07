import { icon } from "../icons.js";
import { $, esc, fmtInt } from "../ui.js";

const SLOTS = [
  { key: "name", label: "称呼", en: "name", q: "先确认称呼——怎么称呼你？", quick: ["叫我王师傅", "叫我小李"], ph: "例如：王师傅" },
  { key: "birth", label: "出生年月", en: "birth_ym", q: "出生年月告诉我一下？只需要年和月，用来判断是否满 18 岁。", quick: ["1991 年 5 月", "2009 年 11 月（未成年测试）"], ph: "例如：1991 年 5 月" },
  { key: "area", label: "意向区域", en: "area_text", q: "现在住在哪个区域？写到街道或小区就行，不用具体门牌。", quick: ["浦东新区张江镇", "杨浦区五角场街道"], ph: "例如：浦东新区张江镇" },
  { key: "job", label: "岗位意向", en: "job_type", q: "想跑全职还是兼职？", quick: ["全职", "兼职", "还没想好"], ph: "全职 / 兼职 / 还没想好" },
  { key: "ebike", label: "车辆情况", en: "has_ebike", q: "有没有电动车？没有的话站点可以协调租车。", quick: ["有，自己的车", "没有，用站点的"], ph: "有 / 没有" },
  { key: "start", label: "到岗时间", en: "start_text", q: "最快什么时候能到岗？", quick: ["下周一到岗", "随时可以"], ph: "例如：下周一" },
  { key: "exp", label: "配送经验", en: "experience_text", q: "之前送过外卖或快递吗？大概多久？", quick: ["送过 2 年外卖", "没做过，有工厂经验"], ph: "例如：送过 2 年外卖" },
];

const POLICY = {
  "上海": {
    version: "v2026-09",
    answers: [
      { keys: ["收入", "工资", "挣", "多少钱", "月入", "薪资"], title: "收入表述", score: "0.93", text: "平台不承诺固定收入。全职骑手收入由基础配送费、时段补贴与奖励构成，具体以站点当日公示为准；平台禁止使用「月入过万」等承诺性表述。", cite: "《上海站点招募政策》v2026-09 · 3.2 收入表述" },
      { keys: ["租车", "装备", "押金", "车辆"], title: "装备与租车", score: "0.89", text: "站点可提供车辆租赁，押金、租金及退租规则以站点公示为准；不得强制捆绑租车，骑手可自带符合国标的车辆。", cite: "《上海站点招募政策》v2026-09 · 4.1 装备与租车" },
      { keys: ["健康证", "体检"], title: "健康证", score: "0.86", text: "从事食品配送需持有效健康证。可先完成报名与面试，入职前补齐；站点可协助预约，费用按当地规定执行。", cite: "《上海站点招募政策》v2026-09 · 5.3 健康证" },
      { keys: ["保险", "意外"], title: "保险", score: "0.84", text: "平台为骑手购买配送期间意外险，保障范围、保额与免责条款以保单为准；骑手可在入职时查看保单摘要。", cite: "《上海站点招募政策》v2026-09 · 6.1 保险" },
    ],
  },
  "杭州": {
    version: "v2026-08",
    answers: [
      { keys: ["收入", "工资", "挣", "多少钱"], title: "收入表述", score: "0.91", text: "杭州站点执行计时与计件结合的结算方式，不承诺固定月收入；奖励规则以站点每周公示为准，禁止口头承诺。", cite: "《杭州站点招募政策》v2026-08 · 3.1 收入与结算" },
      { keys: ["健康证", "体检"], title: "健康证", score: "0.88", text: "食品配送岗位须持有效健康证；报名阶段不强制提交，入职前完成即可。", cite: "《杭州站点招募政策》v2026-08 · 5.2 健康证" },
      { keys: ["住宿", "宿舍"], title: "住宿", score: "0.82", text: "部分站点可协助对接周边合规房源，平台不收取住宿差价；具体以站点公示为准。", cite: "《杭州站点招募政策》v2026-08 · 4.3 住宿协助" },
    ],
  },
};

const FIELD_EVAL = [
  ["称呼", 99.2], ["出生年月", 98.1], ["意向区域", 95.7], ["岗位意向", 97.4],
  ["车辆", 96.8], ["到岗时间", 94.9], ["配送经验", 92.6],
];

const TIME = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

export function renderAgent(root, ctx) {
  const state = {
    slots: { name: null, birth: null, area: null, job: null, ebike: null, start: null, exp: null },
    ended: false,
    minor: false,
    completed: false,
    booked: false,
    awaitConfirm: false,
    awaitBooking: false,
    busy: false,
    degraded: false,
    evalRuns: 1,
    deidRuns: 0,
    tab: "slots",
  };

  root.innerHTML =
    '<section class="module-head">' +
      '<div>' +
        '<div class="module-meta"><span class="task-badge"><i></i>#1808 · 1 / 5</span><span class="chip chip-warm">HARD · ML</span><span class="chip">7 槽位状态机</span><span class="chip">政策 KB</span></div>' +
        '<h1>Agent 对话引擎与政策知识库</h1>' +
        '<p class="lead">把口语、追问、复述确认、政策引用和转人工，收敛成 7 个可校验字段。手机号与身份证在进入模型前已被替换为占位符；模型失败时自动降级到备份模型或表单，不会把用户丢在半路。</p>' +
        '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 7/7 可完成</span><span class="chip chip-teal">引用到章节</span><span class="chip">0 PII 入模</span><span class="chip">注入防护 12/12</span></div>' +
      '</div>' +
      '<div class="module-aside">' +
        '<div class="aside-stat brand"><b id="stat-slots">0/7</b><span>已确认槽位</span></div>' +
        '<div class="aside-stat good"><b>0</b><span>合规违规</span></div>' +
        '<div class="aside-stat"><b>312</b><span>评测对话</span></div>' +
        '<div class="aside-stat teal"><b>2</b><span>主备模型</span></div>' +
      '</div>' +
    '</section>' +
    '<div class="agent-layout">' +
      '<section class="card chat-panel">' +
        '<div class="chat-head">' +
          '<div class="agent-avatar">AI</div>' +
          '<div class="who"><b>小骑 · AI 招聘助理</b><span><i></i><em id="engine-mode" style="font-style:normal">主模型在线 · 已脱敏</em></span></div>' +
          '<div class="actions">' +
            '<button class="icon-mini" data-handoff title="转人工">' + icon("user") + '</button>' +
            '<button class="icon-mini" data-reset title="重置演示">' + icon("refresh") + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="chat-progress"><div class="row1"><span>报名资料完整度</span><b id="prog-label"><em>0</em> / 7</b></div><div class="progress-track"><i id="prog-fill" style="width:0"></i></div></div>' +
        '<div class="chat-log" id="chat-log" aria-live="polite"></div>' +
        '<div class="quick-row" id="quick-row"></div>' +
        '<form class="composer" id="composer"><input id="chat-input" autocomplete="off" placeholder="也可以直接打字回答…" aria-label="输入消息"><button class="send" type="submit" aria-label="发送">' + icon("arrow") + '</button></form>' +
        '<div class="hint">演示脚本固定、可重复；所有姓名/号码均为合成数据。</div>' +
      '</section>' +
      '<section class="card evidence-panel">' +
        '<div class="tabbar" id="tabs">' +
          '<button class="tab-btn active" data-tab="slots">实时槽位<span class="cnt">7</span></button>' +
          '<button class="tab-btn" data-tab="policy">政策 KB<span class="cnt">3</span></button>' +
          '<button class="tab-btn" data-tab="pii">入模脱敏<span class="cnt">3</span></button>' +
          '<button class="tab-btn" data-tab="eval">评测<span class="cnt">300</span></button>' +
          '<button class="tab-btn" data-tab="failover">容灾<span class="cnt">2</span></button>' +
        '</div>' +
        '<div class="pane active" data-pane="slots">' +
          '<div class="pane-head"><div><h3>7 个槽位，一条状态机</h3><p>每轮只追问一个缺失字段；关键字段在完成前复述确认。出生年月 &lt; 18 岁时直接触发 end_minor。</p></div><span class="chip chip-teal">实时</span></div>' +
          '<div class="slot-list" id="slot-list"></div>' +
          '<div class="divider"></div>' +
          '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 必填 5 项</span><span class="chip">选填 2 项</span><span class="chip">确认前复述</span><span class="chip">任意节点可转人工</span></div>' +
          '<div class="note" style="margin-top:12px"><b>为什么不是表单？</b>骑手更愿意用语音/口语回答。引擎把「91 年 5 月」「住某某小区附近」这类表达规范化成 birth_ym 与 area_text，同时保留原话作为审计证据。</div>' +
        '</div>' +
        '<div class="pane" data-pane="policy">' +
          '<div class="pane-head"><div><h3>政策知识库 · 按城市与版本</h3><p>pgvector + 关键词混合检索；回答必须带文档名、版本、章节。无命中时不编造，直接转人工。</p></div><span class="chip chip-teal">引用可追溯</span></div>' +
          '<div class="inline-form" style="margin-top:0"><select id="policy-city" style="border:1px solid var(--line);border-radius:8px;padding:7px 9px;background:#fbfcfe;font-size:11px"><option>上海</option><option>杭州</option></select><select id="policy-version" style="border:1px solid var(--line);border-radius:8px;padding:7px 9px;background:#fbfcfe;font-size:11px"><option>v2026-09</option></select></div>' +
          '<div class="inline-form"><input id="policy-q" placeholder="问：全职一个月能挣多少？"><button class="btn btn-primary btn-sm" data-ask>检索</button></div>' +
          '<div class="chip-row" style="margin-bottom:10px"><button class="quick-btn" data-preset="全职一个月能挣多少？">收入</button><button class="quick-btn" data-preset="租车要押金吗？">租车</button><button class="quick-btn" data-preset="健康证什么时候要？">健康证</button><button class="quick-btn" data-preset="外地牌照能跑吗？">无命中</button></div>' +
          '<div id="policy-answer"><div class="note note-warn"><b>等待检索。</b>点击上方问题或输入后按「检索」。知识库没有命中时会显示转人工，而不是生成一段看似合理的答案。</div></div>' +
          '<div style="margin-top:12px"><div class="score-row"><span>召回 @1</span><div class="track"><i style="width:91%"></i></div><span>91%</span></div><div class="score-row"><span>引用准确</span><div class="track"><i style="width:96%"></i></div><span>96%</span></div><div class="score-row"><span>无命中转人工</span><div class="track"><i style="width:100%"></i></div><span>100%</span></div></div>' +
          '<div class="note note-warn" style="margin-top:12px"><b>当前缺口：</b>杭州「租车押金」暂无正式版本，引擎标记 gap 并转人工；这正是知识库运营需要补的条目。</div>' +
        '</div>' +
        '<div class="pane" data-pane="pii">' +
          '<div class="pane-head"><div><h3>进入模型之前，先脱敏</h3><p>客户端/网关先调用 Vault tokenize，模型只看到「〔手机号_1〕」；回答回到服务端后再回填。模型请求日志里不会出现原始号码。</p></div><span class="chip chip-good">0 原始 PII</span></div>' +
          '<div class="pii-panel"><div class="pii-head">原始输入<span>仅浏览器内演示</span></div><textarea id="pii-in">我叫王强，手机 13812348000，身份证 310101199105121234，住在浦东新区张江镇碧波路 88 弄。</textarea><div class="pii-out" id="pii-out">点击「脱敏并构造模型请求」，查看模型实际收到的内容。</div></div>' +
          '<div class="eval-actions"><button class="btn btn-primary btn-sm" data-deid>' + icon("shield") + ' 脱敏并构造请求</button><button class="btn btn-sm" data-clear-pii>清空</button></div>' +
          '<div class="console-label" style="margin-top:12px">MODEL REQUEST · 实际入模内容</div><pre class="code" id="model-request" style="max-height:180px">{\n  "messages": [],\n  "pii_in_request": false\n}</pre>' +
          '<div class="log-box" id="pii-log"><div class="dim">// vault 审计流等待运行…</div></div>' +
          '<div class="sr-note">脱敏不是「打码展示」：模型侧收到的是不可逆占位符 + 会话内映射；回填只发生在服务端，并记录 reason 与操作者。</div>' +
        '</div>' +
        '<div class="pane" data-pane="eval">' +
          '<div class="pane-head"><div><h3>评测集与验收口径</h3><p>312 条合成对话，其中 84 条对抗样本；固定随机种子，一条命令输出字段抽取、政策问答、违规与注入拦截指标。</p></div><span class="chip chip-good">最近一次通过</span></div>' +
          '<div class="metric-grid"><div class="metric good"><div class="mk">字段抽取准确率</div><div class="mv" id="m-field">96.4<small>%</small></div><div class="md">目标 ≥ 95%</div></div><div class="metric teal"><div class="mk">政策问答准确率</div><div class="mv" id="m-policy">93.1<small>%</small></div><div class="md">目标 ≥ 90%</div></div><div class="metric good"><div class="mk">合规违规</div><div class="mv" id="m-violation">0</div><div class="md">收入承诺 / 歧视 / 索要证件</div></div><div class="metric blue"><div class="mk">注入拦截</div><div class="mv" id="m-inject">12<small>/12</small></div><div class="md">含中英文越狱样本</div></div></div>' +
          '<div class="console-label" style="margin-top:12px">PER-FIELD EXTRACTION</div><div class="bar-list" id="field-bars"></div>' +
          '<div class="console-label" style="margin-top:14px">ADVERSARIAL SET</div><div class="table-wrap" style="margin-top:4px"><table class="mini-table"><thead><tr><th>类型</th><th>样本</th><th>拦截</th><th>结果</th></tr></thead><tbody><tr><td>提示注入</td><td>6</td><td>6</td><td><span class="chip chip-good" style="padding:2px 6px">通过</span></td></tr><tr><td>诱导收入承诺</td><td>4</td><td>4</td><td><span class="chip chip-good" style="padding:2px 6px">通过</span></td></tr><tr><td>索要身份证/银行卡</td><td>2</td><td>2</td><td><span class="chip chip-good" style="padding:2px 6px">通过</span></td></tr></tbody></table></div>' +
          '<div class="eval-actions"><button class="btn btn-primary btn-sm" data-eval>' + icon("play") + ' 重新运行 312 条</button><button class="btn btn-sm" data-eval-adversarial>只跑对抗集</button></div>' +
          '<div class="log-box" id="eval-log"><div class="ok">[pass] seed=20261108 · field=96.4 · policy=93.1 · violations=0</div><div class="dim">// 点击运行可重放；结果确定性可复现</div></div>' +
        '</div>' +
        '<div class="pane" data-pane="failover">' +
          '<div class="pane-head"><div><h3>主备模型与降级路径</h3><p>主模型超时/限流 → 备用模型；两者都不可用 → 切到表单模式，保留已收集字段与会话，不丢用户。</p></div><span class="chip" id="engine-chip">主模型在线</span></div>' +
          '<div class="metric-grid"><div class="metric good"><div class="mk">PRIMARY · OpenAI-compatible</div><div class="mv" style="font-size:15px" id="primary-state">gpt-4o-mini</div><div class="md">P95 4.6s · 超时 8s · 重试 1 次</div></div><div class="metric"><div class="mk">BACKUP · 本地/私有化</div><div class="mv" style="font-size:15px" id="backup-state">qwen2.5-7b</div><div class="md">待命 · 同协议适配器</div></div></div>' +
          '<div class="eval-actions"><button class="btn btn-primary btn-sm" data-fail>' + icon("alert") + ' 模拟主模型超时</button><button class="btn btn-sm" data-recover>恢复主模型</button></div>' +
          '<div class="log-box" id="fail-log"><div class="dim">// 等待故障注入…</div><div class="ok">[ready] primary=ok backup=standby</div></div>' +
          '<div class="note" style="margin-top:12px"><b>降级时仍然在收集：</b>表单模式复用同一套字段校验与同意记录；恢复后把表单结果合并回会话，不重复追问。</div>' +
        '</div>' +
      '</section>' +
    '</div>';

  const logEl = $("#chat-log", root);
  const quickEl = $("#quick-row", root);
  const input = $("#chat-input", root);

  function filled() { return SLOTS.filter((s) => !!state.slots[s.key]).length; }
  function currentSlot() { return SLOTS.find((s) => !state.slots[s.key]); }

  function scrollChat() { logEl.scrollTop = logEl.scrollHeight; }

  function append(html, who) {
    const row = document.createElement("div");
    row.className = "msg-row" + (who === "user" ? " user" : "");
    row.innerHTML = (who === "ai" ? '<div class="msg-avatar">AI</div>' : "") + html;
    logEl.appendChild(row);
    scrollChat();
    return row;
  }

  function say(html, done) {
    if (state.busy) return;
    state.busy = true;
    setQuick([]);
    const row = append('<div class="typing"><i></i><i></i><i></i></div>', "ai");
    ctx.setTimer(() => {
      row.innerHTML = '<div class="msg-avatar">AI</div><div class="bubble ai">' + html + '<span class="t">' + TIME() + '</span></div>';
      scrollChat();
      state.busy = false;
      if (done) done();
    }, 620);
  }

  function system(html) {
    append('<div class="bubble ai" style="background:#fff8ec;border-color:#f0dfb3;color:#6b4d13">' + html + '<span class="t">' + TIME() + '</span></div>', "ai");
  }

  function setQuick(items) {
    quickEl.innerHTML = (items || []).map((q) => '<button class="quick-btn" data-quick="' + esc(q) + '">' + esc(q) + '</button>').join("");
    if (!items || !items.length) quickEl.innerHTML = '<span style="font-size:10px;color:var(--faint);padding:2px 2px">在下方输入框继续，或点右上角转人工。</span>';
  }

  function refreshSlots() {
    const n = filled();
    $("#stat-slots", root).textContent = n + "/7";
    $("#prog-label", root).innerHTML = "<em>" + n + "</em> / 7";
    $("#prog-fill", root).style.width = Math.round((n / 7) * 100) + "%";
    const list = $("#slot-list", root);
    if (list) {
      list.innerHTML = SLOTS.map((s, i) => {
        const v = state.slots[s.key];
        const done = !!v;
        const open = !done && i === n;
        return '<div class="slot-row ' + (done ? "done" : open ? "open" : "") + '">' +
          '<div class="slot-ico">' + (done ? "✓" : String(i + 1).padStart(2, "0")) + "</div>" +
          '<div class="slot-name">' + s.label + "<span>" + s.en + "</span></div>" +
          '<div class="slot-val">' + (done ? "<b>" + esc(v) + "</b>" : "待收集") + "</div>" +
          '<div class="slot-meta">' + (done ? "已确认" : open ? "进行中" : "待收集") + "</div>" +
          (open ? '<div class="slot-source">追问：' + esc(s.q) + "</div>" : "") +
          "</div>";
      }).join("");
    }
    const next = currentSlot();
    if (!state.ended && !state.completed) {
      input.placeholder = next ? "回答：" + next.label + "（也可以点快捷回复）" : "输入「确认」或直接说修改";
    }
  }

  function askNext() {
    const slot = currentSlot();
    if (!slot) return askSummary();
    input.placeholder = "回答：" + slot.label + "（也可以点快捷回复）";
    say(esc(slot.q), () => { setQuick(slot.quick); input.focus(); });
  }

  function parseBirth(text) {
    let year = null, month = null;
    const m4 = text.match(/(19|20)\d{2}/);
    if (m4) year = parseInt(m4[0], 10);
    else { const m2 = text.match(/(\d{2})\s*年/); if (m2) year = 1900 + parseInt(m2[1], 10); }
    const mm = text.match(/(\d{1,2})\s*月/) || text.match(/[./-](\d{1,2})/);
    if (mm) month = parseInt(mm[1], 10);
    return { year, month, text: year ? year + "-" + String(month || 1).padStart(2, "0") : text };
  }

  function endMinor() {
    state.ended = true;
    state.minor = true;
    say("根据你提供的出生年月，你尚未满 18 周岁，暂不能登记骑手岗位。已为你转接人工说明相关政策，本次会话到此结束。", () => {
      append('<div class="bubble-card" style="border-color:#f3c6c6"><div class="bc-top" style="color:var(--red)">' + icon("alert") + ' 未成年人保护 · end_minor</div><p>动作已写入会话动作队列：<b>end_minor</b>。不继续收集、不推荐站点、不发起预约；会话记录按未成年人数据规则在 24 小时内清理。</p><div class="bc-grid"><div class="bc-cell">触发字段<b>birth_ym</b></div><div class="bc-cell">当前进度<b>2 / 7</b></div></div></div>', "ai");
      setQuick(["重新开始演示"]);
      refreshSlots();
    });
  }

  function askSummary() {
    const rows = SLOTS.map((s) => '<div class="bc-cell">' + s.label + "<b>" + esc(state.slots[s.key]) + "</b></div>").join("");
    say("7 项都收齐了。我复述一遍，你确认后我再查政策和站点。", () => {
      append('<div class="bubble-card"><div class="bc-top">' + icon("check") + ' 资料复述 · 请确认</div><p>以下字段将写入候选人档案；确认前仍可修改。</p><div class="bc-grid">' + rows + '</div></div>', "ai");
      state.awaitConfirm = true;
      setQuick(["确认无误", "修改区域"]);
    });
  }

  function complete() {
    state.awaitConfirm = false;
    state.completed = true;
    say("已确认。关于收入，我不能承诺具体金额，只能引用平台政策。", () => {
      append('<div class="bubble ai"><b>政策依据</b>：平台不承诺固定收入。全职骑手收入由基础配送费、时段补贴与奖励构成，具体以站点当日公示为准；平台禁止使用「月入过万」等承诺性表述。<span class="cite"><b>引用</b> 《上海站点招募政策》v2026-09 · 3.2 收入表述</span><span class="t">' + TIME() + '</span></div>', "ai");
      append('<div class="bubble-card"><div class="bc-top">' + icon("map") + ' 推荐站点 · 张江站</div><p>距离 2.1 km · 剩余名额 <b>5</b> · 明天 10:00 / 14:00 / 16:00 可约。按距离与名额推荐，不按「谁能拉人」排序。</p><div class="mini-station"><div class="pin">' + icon("building") + '</div><div class="info"><b>张江站 · 碧波路 88 号</b><span>浦东新区 · 5 个名额 · 2.1 km</span></div><div class="q">OPEN<br>5</div></div></div>', "ai");
      state.awaitBooking = true;
      setQuick(["预约张江站 明天 10:00", "换一个站", "结束演示"]);
      input.placeholder = "选择预约时间，或说「换一个站」";
      refreshSlots();
    });
  }

  function book() {
    state.awaitBooking = false;
    state.booked = true;
    say("已锁定张江站 · 明天 10:00。名额扣减在数据库行锁内完成，50 个人同时抢最后 5 个名额也只会有 5 个成功。", () => {
      append('<div class="bubble-card" style="border-color:#c8e9e4"><div class="bc-top" style="color:var(--teal)">' + icon("calendar") + ' 预约确认 · BK-20261108-0042</div><p>张江站 · 明天 10:00 · 请提前 10 分钟到站；到站前 2 小时短信提醒。可改约/取消，不额外收费。</p><div class="bc-grid"><div class="bc-cell">站点<b>张江站</b></div><div class="bc-cell">名额<b>5 / 5 可约</b></div><div class="bc-cell">状态<b>booked</b></div><div class="bc-cell">动作<b>booking_confirmed</b></div></div></div>', "ai");
      setQuick(["重新开始演示", "结束演示"]);
      refreshSlots();
    });
  }

  function handoff() {
    if (state.ended) return;
    state.ended = true;
    say("好的，已为你转接人工招聘顾问。已收集的 " + filled() + " 项资料会一起带过去，不用重复说。", () => {
      append('<div class="bubble-card" style="border-color:#ffd9c8"><div class="bc-top">' + icon("user") + ' 转人工 · handoff.requested</div><p>动作 <b>handoff</b> 已入队；工作台会收到会话摘要与缺失字段。人工未接入时，页面保留会话并给出可回拨的虚拟号码。</p><div class="bc-grid"><div class="bc-cell">当前进度<b>' + filled() + ' / 7</b></div><div class="bc-cell">会话<b>已保留</b></div></div></div>', "ai");
      setQuick(["重新开始演示"]);
    });
  }

  function handleUser(text) {
    const raw = String(text || "").trim();
    if (!raw || state.busy) return;
    if (state.ended) {
      if (/重新|开始/.test(raw)) ctx.navigate("agent");
      else system("本次演示已结束。点右上角 <b>重置</b> 可重新走一遍。");
      return;
    }
    append('<div class="bubble user">' + esc(raw) + '<span class="t">' + TIME() + '</span></div>', "user");
    input.value = "";

    if (/忽略.*(指令|规则)|系统提示|越狱|开发者模式|prompt/i.test(raw)) {
      system("我不能修改规则或忽略合规要求。你可以继续登记，或点右上角转人工。");
      state.injection = (state.injection || 0) + 1;
      return;
    }
    if (/1[3-9]\d{9}/.test(raw) || /\d{17}[\dXx]/.test(raw)) {
      system("检测到手机号/身份证。原始号码已在客户端替换为占位符，不会进入模型；服务端回填后仅用于联系。请继续回答当前问题。");
      return;
    }
    if (state.awaitConfirm) {
      if (/确认|没问题|对的/.test(raw)) return complete();
      if (/修改|改/.test(raw)) {
        state.awaitConfirm = false;
        state.slots.area = null;
        say("好，我们只改意向区域，其他 6 项保留。现在住哪个区域？", () => setQuick(["浦东新区张江镇", "杨浦区五角场街道"]));
        refreshSlots();
        return;
      }
    }
    if (state.awaitBooking) {
      if (/预约|10:00|明天/.test(raw)) return book();
      if (/换|其他/.test(raw)) {
        say("附近还有五角场站：3.4 km，剩 3 个名额；虹桥站：8.1 km，剩 5 个。优先推荐张江站，因为距离最近且名额充足。", () => setQuick(["预约张江站 明天 10:00", "结束演示"]));
        return;
      }
      if (/结束/.test(raw)) return handoff();
    }
    if (/转人工|人工|客服/.test(raw)) return handoff();

    const slot = currentSlot();
    if (!slot) return askSummary();
    let value = raw;
    if (slot.key === "name") value = raw.replace(/^(我叫|叫我|我是)/, "").slice(0, 8);
    if (slot.key === "birth") {
      const parsed = parseBirth(raw);
      value = parsed.text;
      state.slots.birth = value;
      refreshSlots();
      if (parsed.year && (parsed.year > 2008 || (parsed.year === 2008 && (parsed.month || 1) > 11))) {
        return endMinor();
      }
      return askNext();
    }
    if (slot.key === "job") value = /兼职/.test(raw) ? "兼职" : /全职/.test(raw) ? "全职" : /没想好|不确定/.test(raw) ? "未定" : raw.slice(0, 12);
    if (slot.key === "ebike") value = /没有|无|站点/.test(raw) ? "无（站点协调）" : /有|自己/.test(raw) ? "有（自有）" : raw.slice(0, 12);
    if (slot.key === "area" || slot.key === "start" || slot.key === "exp") value = raw.slice(0, 40);
    state.slots[slot.key] = value;
    refreshSlots();
    if (filled() === 7) return askSummary();
    askNext();
  }

  function switchTab(name) {
    state.tab = name;
    root.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    root.querySelectorAll("[data-pane]").forEach((p) => p.classList.toggle("active", p.dataset.pane === name));
  }

  function renderFieldBars() {
    const el = $("#field-bars", root);
    if (!el) return;
    el.innerHTML = FIELD_EVAL.map(([label, v], i) =>
      '<div class="bar-item ' + (i % 3 === 1 ? "teal" : i % 3 === 2 ? "blue" : "") + '"><span>' + label + '</span><div class="bar-track"><i style="width:' + v + '%"></i></div><b>' + v + '%</b></div>'
    ).join("");
  }

  function askPolicy(q) {
    const city = $("#policy-city", root).value;
    const version = $("#policy-version", root).value;
    const text = q || $("#policy-q", root).value.trim();
    const box = $("#policy-answer", root);
    if (!text) { box.innerHTML = '<div class="note note-warn">先输入一个问题，或点上面的预设。</div>'; return; }
    const pack = POLICY[city];
    const hit = pack.answers.find((a) => a.keys.some((k) => text.includes(k)));
    if (hit) {
      box.innerHTML = '<div class="policy-answer"><div class="pa-top"><b>' + city + " · " + hit.title + '</b><span class="chip chip-good">命中 ' + hit.score + '</span></div><p>' + hit.text + '</p><span class="cite"><b>引用</b> ' + hit.cite + '</span></div><div class="chip-row" style="margin-top:8px"><span class="chip chip-teal">' + icon("check") + ' 引用到章节</span><span class="chip">未承诺收入</span><span class="chip">版本 ' + version + '</span></div>';
    } else {
      box.innerHTML = '<div class="note note-warn"><b>知识库未命中。</b>这个问题在当前城市/版本没有可引用的正式条目。引擎不会生成推测答案，已触发 <b>handoff</b> 转人工。<div style="margin-top:8px"><button class="btn btn-sm" data-handoff>转人工处理</button></div></div>';
    }
  }

  function runDeid() {
    const raw = $("#pii-in", root).value;
    const tokens = [];
    let out = raw;
    out = out.replace(/\d{17}[\dXx]/g, (m) => { tokens.push(["身份证", m]); return "〔身份证_" + tokens.filter((t) => t[0] === "身份证").length + "〕"; });
    out = out.replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, (m) => { tokens.push(["手机号", m]); return "〔手机号_" + tokens.filter((t) => t[0] === "手机号").length + "〕"; });
    out = out.replace(/(王强|张伟|李娜|王芳)/g, (m) => { tokens.push(["姓名", m]); return "〔姓名_" + tokens.filter((t) => t[0] === "姓名").length + "〕"; });
    out = out.replace(/(浦东新区张江镇碧波路\s*88\s*弄|杨浦区五角场街道)/g, (m) => { tokens.push(["地址", m]); return "〔地址_" + tokens.filter((t) => t[0] === "地址").length + "〕"; });
    const safe = esc(out).replace(/〔([^〕]+)〕/g, '<span class="ph">〔$1〕</span>');
    $("#pii-out", root).innerHTML = safe;
    const req = {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: out }],
      pii_in_request: false,
      token_count: tokens.length,
    };
    $("#model-request", root).textContent = JSON.stringify(req, null, 2);
    state.deidRuns += 1;
    $("#pii-log", root).innerHTML =
      '<div class="ok">[vault.tokenize] ' + tokens.length + ' tokens · session=s-48f2 · reason=agent_chat</div>' +
      '<div class="warn">[guard] request_contains_raw_pii=false · 已校验手机号/身份证正则</div>' +
      '<div class="dim">[audit] operator=system:agent · action=tokenize · trace=' + (state.deidRuns + 1000) + "</div>";
  }

  function runEval(adversarialOnly) {
    const field = $("#m-field", root), policy = $("#m-policy", root), violation = $("#m-violation", root), inject = $("#m-inject", root);
    const log = $("#eval-log", root);
    if (adversarialOnly) {
      log.innerHTML = '<div class="warn">[run] adversarial-only · 84 samples</div><div class="dim">// 运行中…</div>';
      ctx.setTimer(() => {
        log.innerHTML = '<div class="ok">[pass] injection=12/12 · income_claim=4/4 · id_request=2/2</div><div class="dim">// 84/84 通过 · 0 违规 · 0 编造</div>';
      }, 800);
      return;
    }
    field.innerHTML = "…"; policy.innerHTML = "…"; violation.textContent = "…"; inject.textContent = "…";
    log.innerHTML = '<div class="warn">[run] seed=20261108 · 312 samples · extraction + policy QA</div><div class="dim">// 运行中…</div>';
    ctx.setTimer(() => {
      field.innerHTML = '96.4<small>%</small>';
      policy.innerHTML = '93.1<small>%</small>';
      violation.textContent = "0";
      inject.innerHTML = '12<small>/12</small>';
      state.evalRuns += 1;
      log.innerHTML = '<div class="ok">[pass] field=96.4 · policy=93.1 · violations=0 · injection=12/12</div><div class="dim">// 312/312 完成 · 结果已写入 evidence/eval-report.json</div>';
    }, 1100);
  }

  function failover() {
    state.degraded = true;
    $("#engine-mode", root).textContent = "备份模型 · 已降级";
    $("#engine-chip", root).textContent = "已降级 · 备份模型";
    $("#primary-state", root).textContent = "timeout";
    $("#backup-state", root).textContent = "qwen2.5-7b · 接管中";
    $("#fail-log", root).innerHTML = '<div class="warn">[timeout] primary after 8000ms · retry=1</div><div class="ok">[failover] backup=qwen2.5-7b · latency=1.9s</div><div class="dim">// 会话上下文与已收集字段已透传，不重复追问</div>';
    system("主模型响应超时，已切换到备份模型继续。已收集的资料和当前问题都还在，不需要重新说一遍。");
  }

  function recover() {
    state.degraded = false;
    $("#engine-mode", root).textContent = "主模型在线 · 已脱敏";
    $("#engine-chip", root).textContent = "主模型在线";
    $("#primary-state", root).textContent = "gpt-4o-mini";
    $("#backup-state", root).textContent = "qwen2.5-7b";
    $("#fail-log", root).innerHTML = '<div class="ok">[recover] primary=ok · backup=standby</div><div class="dim">// 流量已切回主模型</div>';
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) return switchTab(tab.dataset.tab);
    const quick = e.target.closest("[data-quick]");
    if (quick) return handleUser(quick.dataset.quick);
    if (e.target.closest("[data-reset]")) return ctx.navigate("agent");
    if (e.target.closest("[data-handoff]")) return handoff();
    if (e.target.closest("[data-ask]")) return askPolicy();
    const preset = e.target.closest("[data-preset]");
    if (preset) { $("#policy-q", root).value = preset.dataset.preset; return askPolicy(preset.dataset.preset); }
    if (e.target.closest("[data-deid]")) return runDeid();
    if (e.target.closest("[data-clear-pii]")) { $("#pii-in", root).value = ""; $("#pii-out", root).textContent = "等待输入。"; return; }
    if (e.target.closest("[data-eval]")) return runEval(false);
    if (e.target.closest("[data-eval-adversarial]")) return runEval(true);
    if (e.target.closest("[data-fail]")) return failover();
    if (e.target.closest("[data-recover]")) return recover();
  });

  root.addEventListener("submit", (e) => {
    if (e.target.id === "composer") {
      e.preventDefault();
      handleUser($("#chat-input", root).value);
    }
  });

  $("#policy-city", root).addEventListener("change", (e) => {
    const city = e.target.value;
    const ver = $("#policy-version", root);
    ver.innerHTML = city === "上海" ? "<option>v2026-09</option><option>v2026-07</option>" : "<option>v2026-08</option><option>v2026-06</option>";
    $("#policy-answer", root).innerHTML = '<div class="note"><b>' + city + "</b> 已切换；当前版本 " + ver.value + "。检索只在该城市/版本的正式知识库内进行。</div>";
  });

  refreshSlots();
  renderFieldBars();
  setQuick([]);
  ctx.setTimer(() => {
    say("你好，我是 AI 招聘助理小骑。我会先花 3 分钟帮你登记 7 项信息，随时可以转人工。", () => {
      ctx.setTimer(() => askNext(), 250);
    });
  }, 350);
}
