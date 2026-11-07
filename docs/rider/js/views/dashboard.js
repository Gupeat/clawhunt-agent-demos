import { icon } from "../icons.js";
import { DATA } from "../data.js";
import { $, esc, toast, openModal, downloadText, fmtInt, sparkline, lineChart } from "../ui.js";

const CITIES = ["全部城市", "上海", "杭州", "深圳"];
const CHANNELS = ["全部渠道", "抖音", "快手", "58同城", "门店二维码", "老骑手转介绍", "短信召回"];
const DATES = ["2026-11-08", "2026-11-07", "2026-11-01", "2026-10-26"];

export function renderDashboard(root, ctx) {
  const state = {
    tab: "cockpit",
    filters: { channel: "全部渠道", city: "全部城市", station: "全部站点", date: "2026-11-08" },
    config: DATA.configFields.map((f) => ({ ...f })),
    dirty: false,
    changes: [],
    status: "published",
    version: "v2026.11.08-01",
    versions: [
      { v: "v2026.11.08-01", at: "11-08 09:10", by: "王敏", status: "published" },
      { v: "v2026.11.07-03", at: "11-07 18:42", by: "李静", status: "published" },
      { v: "v2026.11.06-02", at: "11-06 14:20", by: "王敏", status: "archived" },
    ],
    exported: false,
    exportLog: [{ time: "11-08 09:22", who: "王敏", scope: "经营看板 · 全量", rows: "1,248", wm: "已加水印" }],
    sqlChecked: false,
    piiScanned: false,
    lastReviewer: "李静（运营负责人）",
  };

  root.innerHTML =
    '<section class="module-head">' +
      '<div>' +
        '<div class="module-meta"><span class="task-badge"><i></i>#1805 · 4 / 5</span><span class="chip chip-violet">MEDIUM · DATA</span><span class="chip">7 KPI</span><span class="chip">SQL 对账</span><span class="chip">配置双人复核</span></div>' +
        '<h1>管理驾驶舱与配置后台</h1>' +
        '<p class="lead">7 个 KPI 与 SQL 校验脚本逐项对账；所有聚合接口只返回统计值，不返回任何 PII。配置改动必须经过第二人复核，版本差异、发布、一键回滚都留痕。</p>' +
        '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 10k+ 事件对账</span><span class="chip">聚合接口 PII 扫描</span><span class="chip">双人复核</span><span class="chip">导出水印 + 日志</span></div>' +
      '</div>' +
      '<div class="module-aside">' +
        '<div class="aside-stat brand"><b>7/7</b><span>KPI 对账一致</span></div>' +
        '<div class="aside-stat teal"><b>0</b><span>PII 泄露</span></div>' +
        '<div class="aside-stat good"><b>2 人</b><span>发布复核</span></div>' +
        '<div class="aside-stat"><b>10k+</b><span>合成事件</span></div>' +
      '</div>' +
    '</section>' +
    '<div class="dash-tabs" id="dash-tabs"><button data-dtab="cockpit" class="active">经营驾驶舱</button><button data-dtab="config">配置与发布</button><button data-dtab="govern">安全与导出</button></div>' +
    '<div id="dash-body"></div>';

  const body = $("#dash-body", root);

  function filteredChannels() {
    if (state.filters.channel === "全部渠道") return DATA.channels;
    return DATA.channels.filter((c) => c.name === state.filters.channel || (state.filters.channel === "老骑手转介绍" && c.name === "老骑手转介绍"));
  }

  function filteredStations() {
    return DATA.stations.filter((s) => {
      if (state.filters.city !== "全部城市" && s.city !== state.filters.city) return false;
      if (state.filters.station !== "全部站点" && s.name !== state.filters.station) return false;
      return true;
    });
  }

  function factor() {
    const dateFactor = { "2026-11-08": 1, "2026-11-07": 0.93, "2026-11-01": 0.74, "2026-10-26": 0.61 }[state.filters.date] || 1;
    let f = 1;
    if (state.filters.station !== "全部站点") f = 0.22;
    else if (state.filters.city !== "全部城市") f = 0.64;
    else if (state.filters.channel !== "全部渠道") f = 0.39;
    return f * dateFactor;
  }

  function filterNote() {
    const bits = [];
    if (state.filters.channel !== "全部渠道") bits.push("渠道 " + state.filters.channel);
    if (state.filters.city !== "全部城市") bits.push("城市 " + state.filters.city);
    if (state.filters.station !== "全部站点") bits.push("站点 " + state.filters.station);
    bits.push("日期 " + state.filters.date);
    return bits.join(" · ");
  }

  function kpiValue(k) {
    const f = factor();
    if (k.unit === "" && k.key !== "AI 首响") return fmtInt(Math.round(k.value * f));
    return k.display;
  }

  function cockpit() {
    const f = factor();
    const stations = filteredStations();
    const chans = filteredChannels();
    const funnel = DATA.funnel.map((x) => ({ ...x, value: Math.round(x.value * f) }));
    const series = DATA.series;
    const labels = series.labels.filter((_, i) => i % 2 === 0);
    const concurrency = [6, 18, 31, 42, 48, 50, 50, 47, 33, 19, 9, 4];
    return '<div class="dash-top"><div><div style="font-size:17px;font-weight:850;letter-spacing:-.03em">经营驾驶舱</div><p style="font-size:9.5px;color:var(--faint);margin-top:2px">' + esc(filterNote()) + ' · 仅聚合数据</p></div>' +
      '<div class="dash-filters"><select id="f-channel">' + CHANNELS.map((c) => '<option' + (c === state.filters.channel ? " selected" : "") + ">" + c + "</option>").join("") + '</select><select id="f-city">' + CITIES.map((c) => '<option' + (c === state.filters.city ? " selected" : "") + ">" + c + "</option>").join("") + '</select><select id="f-station"><option>全部站点</option>' + DATA.stations.map((s) => '<option' + (s.name === state.filters.station ? " selected" : "") + ">" + s.name + "</option>").join("") + '</select><select id="f-date">' + DATES.map((d) => '<option' + (d === state.filters.date ? " selected" : "") + ">" + d + "</option>").join("") + '</select><button class="btn btn-sm" data-reset-filter>重置</button></div></div>' +
      '<div class="kpi-grid">' + DATA.kpis.map((k, i) => '<article class="kpi-card ' + (k.key === "转人工率" ? "warn" : k.key === "入职人数" ? "good" : "") + '"><div class="kt"><span>' + k.key + '</span><span class="kicon">' + icon(["users", "spark", "check", "clock", "calendar", "chat", "target"][i]) + '</span></div><div class="kv">' + kpiValue(k) + "<small>" + (k.unit || "") + '</small></div><div class="kd"><b class="' + (k.up ? "" : "down") + '">' + (k.delta || "") + '</b><span>vs 上周期</span></div>' + sparkline(k.spark, i === 6 ? "#16a34a" : i === 5 ? "#f59e0b" : "#ff5a1f", 160, 24) + "</article>").join("") + "</div>" +
      '<div class="dash-grid">' +
        '<div class="dcard span2"><div class="dh"><div><h3>转化漏斗</h3><p>进线 → 完成报名 → 预约 → 到面 → 入职</p></div><span class="badge">' + (f === 1 ? "ALL" : "FILTERED") + '</span></div><div class="funnel">' + funnel.map((x) => '<div class="funnel-row"><div class="funnel-label"><b>' + x.label + '</b><span>' + x.rate + '</span></div><div class="funnel-bar"><i style="width:' + x.width + '%"></i></div><div class="funnel-val"><b>' + fmtInt(x.value) + "</b>" + x.rate + "</div></div>").join("") + "</div></div>" +
        '<div class="dcard"><div class="dh"><div><h3>渠道效率</h3><p>报名完整率 / 到面率 / CPA</p></div><span class="badge">' + chans.length + ' 渠道</span></div><table class="channel-table"><thead><tr><th>渠道</th><th>线索</th><th>完整率</th><th>到面率</th><th>入职</th></tr></thead><tbody>' + chans.map((c) => "<tr><td><b>" + c.name + "</b></td><td>" + fmtInt(Math.round(c.leads * f)) + "</td><td>" + c.complete + "</td><td>" + c.arrive + "</td><td>" + c.hired + "</td></tr>").join("") + '</tbody></table><div class="note" style="margin-top:7px;font-size:8px">门店二维码的到面率最高；短信召回最低，建议压缩预算。</div></div>' +
        '<div class="dcard"><div class="dh"><div><h3>站点名额缺口</h3><p>余量 / 容量</p></div><span class="badge">' + stations.length + ' 站点</span></div><div class="station-gap">' + (stations.length ? stations.map((s) => '<div class="gap-row"><div class="gt"><b>' + s.name + '</b><span>余 ' + s.open + " / " + s.capacity + '</span></div><div class="gap-track"><i class="' + (s.open <= 5 ? "bad" : s.open / s.capacity < 0.4 ? "warn" : "") + '" style="width:' + Math.round((s.used / s.capacity) * 100) + '%"></i></div></div>').join("") : '<div class="wb-empty">该城市暂无站点</div>') + '</div><div class="note" style="margin-top:7px;font-size:8px">南山站仅余 3 个名额，建议暂停该站投放或调高预约门槛。</div></div>' +
        '<div class="dcard"><div class="dh"><div><h3>并发曲线</h3><p>预约请求 vs 设计容量</p></div><span class="badge">P95 4.6s</span></div>' + lineChart({ series: [{ name: "请求", values: concurrency, color: "#ff5a1f" }, { name: "容量", values: new Array(concurrency.length).fill(12), color: "#9aa6b6" }], labels: ["0s", "2s", "4s", "6s", "8s", "10s", "12s", "14s", "16s", "18s", "20s", "22s"], height: 170, fillFirst: true, yMax: 56 }) + '<div class="chart-legend"><span><i style="background:#ff5a1f"></i> 请求</span><span><i style="background:#9aa6b6"></i> 设计容量 12</span></div></div>' +
        '<div class="dcard"><div class="dh"><div><h3>AI 质检摘要</h3><p>抽样 ' + DATA.qa.sampled + " · 违规 " + DATA.qa.violations + '</p></div><span class="badge">TODAY</span></div><div class="qa-summary"><div class="qa-cell"><b>' + DATA.qa.sampled + '</b><span>抽样对话</span></div><div class="qa-cell"><b style="color:var(--green)">' + DATA.qa.violations + '</b><span>合规违规</span></div></div><div class="qa-list">' + DATA.qa.topGaps.map((g) => "<div><i></i><span>" + g + "</span></div>").join("") + '</div></div>' +
        '<div class="dcard span3" style="margin-top:0"><div class="dh"><div><h3>口径对账 & 聚合接口 PII 扫描</h3><p>KPI 必须与仓库内 SQL 校验脚本逐项一致；聚合接口任何参数都不能返回 PII</p></div><span class="badge">CI GATE</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><div class="scan-result"><b>' + (state.sqlChecked ? "7 / 7 KPI 与 SQL 一致" : "等待运行 SQL 对账") + '</b>' + (state.sqlChecked ? "总事件 12,480 · 完整 9,535 · 预约 5,841 · 到面 3,580 · 入职 1,126。checksum 与 materialized view 一致。" : "scripts/check_kpi.sql 会重新聚合 10k+ 事件，与看板结果逐项比对。") + '</div><button class="btn btn-sm" data-sql-check style="margin-top:6px">' + icon("database") + ' 运行 SQL 对账</button></div><div><div class="scan-result"><b>' + (state.piiScanned ? "0 个 PII 字段泄露" : "等待 PII 扫描") + '</b>' + (state.piiScanned ? "已尝试 14 组参数（include=phone、name=张伟、phone=138...），响应扫描器全部判定为聚合值。" : "response scanner 会扫描 key、value、文件名、CSV 列，任何手机号/姓名/地址形态直接失败。") + '</div><button class="btn btn-sm" data-pii-scan style="margin-top:6px">' + icon("shield") + ' 运行 PII 扫描</button></div></div></div>' +
      "</div>";
  }

  function configTable() {
    return '<table class="cfg-table"><thead><tr><th>字段</th><th>必填</th><th>层级</th><th>LLM 可见</th><th>保留</th></tr></thead><tbody>' + state.config.map((f) =>
      "<tr><td><div class='fname'>" + f.label + "</div><div class='fkey'>" + f.key + "</div></td>" +
      '<td><label class="switch"><input type="checkbox" data-cfg-toggle="required" data-key="' + f.key + '"' + (f.required ? " checked" : "") + '><span class="sl"></span></label></td>' +
      '<td><select data-cfg-level="' + f.key + '" style="font-size:8px;border:1px solid var(--line);border-radius:4px;padding:2px 3px"><option' + (f.level === "L1" ? " selected" : "") + '>L1</option><option' + (f.level === "L2" ? " selected" : "") + '>L2</option><option' + (f.level === "L3" ? " selected" : "") + '>L3</option></select></td>' +
      '<td><label class="switch"><input type="checkbox" data-cfg-toggle="llm" data-key="' + f.key + '"' + (f.llm ? " checked" : "") + (!f.llm ? " disabled" : "") + '><span class="sl"></span></label>' + (!f.llm ? ' <span class="keep-away">KEEP-AWAY</span>' : "") + "</td>" +
      "<td style='font-size:8px;color:var(--faint)'>" + f.retention + "</td></tr>"
    ).join("") + "</tbody></table>";
  }

  function configJson() {
    const lines = ["{", '  "version": "' + state.version + '",', '  "fields": ['];
    state.config.forEach((f, i) => {
      const obj = { key: f.key, label: f.label, required: f.required, level: f.level, llm_visible: f.llm, retention: f.retention };
      if (f.keepAway || !f.llm) obj.keep_away = true;
      let line = "    " + JSON.stringify(obj) + (i < state.config.length - 1 ? "," : "");
      if (f.keepAway || !f.llm) line = '<span class="warn">' + esc(line) + "</span>";
      else line = esc(line);
      lines.push(line);
    });
    lines.push("  ],", '  "contract_test": "task1 must exclude keep_away fields before model call"', "}");
    return lines.join("\n");
  }

  function diff() {
    if (!state.changes.length) return '<div class="diff"><span class="ctx"># 无未发布变更</span>\n<span class="ctx"># 当前版本 ' + esc(state.version) + "</span></div>";
    return '<div class="diff">' + state.changes.slice(-5).map((c) => '<span class="del">- ' + esc(c[0]) + "</span>\n" + '<span class="add">+ ' + esc(c[1]) + "</span>").join("\n") + "</div>";
  }

  function configPane() {
    const badge = state.status === "published" ? "已发布" : state.status === "pending" ? "待第二人复核" : "草稿";
    return '<div class="dash-top"><div><div style="font-size:17px;font-weight:850;letter-spacing:-.03em">配置与发布</div><p style="font-size:9.5px;color:var(--faint);margin-top:2px">字段 / 对话流 / 政策库 / 站点名额 / 角色权限 · 变更双人复核</p></div><div class="dash-filters"><span class="chip ' + (state.status === "pending" ? "chip-warn" : state.status === "draft" ? "chip-warn" : "chip-good") + '">' + badge + '</span><button class="btn btn-sm" data-cfg-submit' + (state.dirty && state.status !== "pending" ? "" : " disabled") + ">提交第二人复核</button></div></div>" +
      '<div class="cfg-grid"><div class="dcard"><div class="dh"><div><h3>采集字段配置</h3><p>L1 基础 / L2 敏感 / L3 高敏；LLM 不可见字段永远不会进入模型请求</p></div><span class="badge">' + state.config.length + ' FIELDS</span></div>' + configTable() + '<div class="note" style="margin-top:8px"><b>硬约束：</b>任何「LLM 可见=否」字段都会带 <span class="keep-away">KEEP-AWAY</span> 标记并锁定；发布时同步给任务 1 的配置 JSON，任务 1 的契约测试会断言这些字段不进入模型。手机号额外锁定为永不可见。</div></div>' +
      '<div class="cfg-side"><div class="dcard"><div class="dh"><div><h3>发布流程</h3><p>编辑 → 第二人复核 → 发布</p></div></div><div class="cfg-version"><div><b>' + state.version + '</b><span>' + (state.status === "pending" ? "审核人：李静（运营负责人）" : state.status === "published" ? "发布于 11-08 09:10" : "有未发布变更") + '</span></div><span class="st ' + (state.status === "pending" ? "draft" : "") + '">' + badge + '</span></div>' +
        '<div class="chip-row" style="margin-top:7px"><button class="btn btn-sm" data-cfg-approve' + (state.status === "pending" ? "" : " disabled") + '>' + icon("check") + ' 第二人审核通过并发布</button><button class="btn btn-sm" data-cfg-rollback>' + icon("refresh") + ' 回滚</button></div>' +
        '<div class="note" style="margin-top:7px;font-size:8px">审核人不能是本次编辑人；发布后 10 秒内通知任务 1 重新加载配置。</div></div>' +
        '<div class="dcard"><div class="dh"><div><h3>版本差异</h3><p>' + (state.changes.length ? state.changes.length + " 处未发布变更" : "已发布版本") + '</p></div><span class="badge">DIFF</span></div>' + diff() + '</div>' +
        '<div class="dcard"><div class="dh"><div><h3>版本历史</h3><p>发布与回滚都会生成不可变记录</p></div><span class="badge">' + state.versions.length + ' VERSIONS</span></div><div class="cfg-vlist">' + state.versions.map((v) => '<div class="cfg-version"><div><b>' + esc(v.v) + '</b><span>' + esc(v.by + " · " + v.at) + '</span></div><span class="st ' + (v.status === "published" ? "" : "draft") + '">' + esc(v.status) + '</span></div>').join("") + '</div><div class="note" style="margin-top:6px;font-size:8px">回滚不删除历史，而是生成一条新的发布记录；任务 1 收到最新版本号并重新加载。</div></div>' +
        '<div class="dcard"><div class="dh"><div><h3>下发给任务 1 的 JSON</h3><p>不含明文 PII，仅字段策略</p></div><span class="badge">CONTRACT</span></div><pre class="config-json">' + configJson() + '</pre></div>' +
      "</div></div>";
  }

  function governPane() {
    return '<div class="dash-top"><div><div style="font-size:17px;font-weight:850;letter-spacing:-.03em">安全与导出</div><p style="font-size:9.5px;color:var(--faint);margin-top:2px">导出必须带水印 + 日志；聚合接口永不返回 PII</p></div></div>' +
      '<div class="dash-grid"><div class="dcard"><div class="dh"><div><h3>导出预览</h3><p>CSV / Excel · 水印 + 操作人 + 时间</p></div><span class="badge">WATERMARK</span></div><div class="export-preview"><div class="ewm">王敏 · E-1024 · 2026-11-08<br>仅限内部 · 禁止外传</div><div>经营看板 CSV<br><b style="color:var(--ink)">7 KPI · 6 渠道 · 5 站点</b><br><span style="font-size:7px">导出会自动写入导出日志</span></div></div><button class="btn btn-primary btn-sm" data-export style="margin-top:8px">' + icon("download") + ' 导出当前看板（CSV）</button><div class="note" style="margin-top:7px;font-size:8px">导出范围受角色与城市/站点权限限制；文件名带日期与操作人哈希。</div></div>' +
      '<div class="dcard"><div class="dh"><div><h3>导出日志</h3><p>保留 ≥ 6 个月，可审计</p></div><span class="badge">AUDIT</span></div><table class="audit-table"><thead><tr><th>时间</th><th>操作人</th><th>范围</th><th>行数</th><th>水印</th></tr></thead><tbody>' + state.exportLog.map((l) => "<tr><td>" + l.time + "</td><td class='op'>" + l.who + "</td><td>" + l.scope + "</td><td>" + l.rows + "</td><td class='okh'>" + l.wm + "</td></tr>").join("") + '</tbody></table><div class="audit-mini">聚合接口响应扫描：0 个手机号 / 姓名 / 地址字段；所有响应仅含 count、rate、bucket。</div></div>' +
      '<div class="dcard span2"><div class="dh"><div><h3>权限矩阵（摘要）</h3><p>角色 × 数据范围 × 操作</p></div><span class="badge">RBAC</span></div><table class="rbac-table"><thead><tr><th>角色</th><th>查看聚合</th><th>查看候选人</th><th>查看完整手机号</th><th>导出</th><th>配置</th></tr></thead><tbody><tr><td>招聘专员</td><td class="y">✓</td><td class="y">✓</td><td class="p">申请</td><td class="n">—</td><td class="n">—</td></tr><tr><td>站点经理</td><td class="y">✓</td><td class="y">本城</td><td class="p">申请</td><td class="p">本城</td><td class="n">—</td></tr><tr><td>运营</td><td class="y">✓</td><td class="p">脱敏</td><td class="n">—</td><td class="y">✓</td><td class="y">✓</td></tr><tr><td>审计员</td><td class="y">✓</td><td class="p">日志</td><td class="n">—</td><td class="n">—</td><td class="p">只读</td></tr></tbody></table></div></div>';
  }

  function renderBody() {
    const map = { cockpit: cockpit, config: configPane, govern: governPane };
    body.innerHTML = (map[state.tab] || cockpit)();
    root.querySelectorAll("[data-dtab]").forEach((b) => b.classList.toggle("active", b.dataset.dtab === state.tab));
  }

  function submitReview() {
    if (!state.dirty || state.status === "pending") return toast("没有需要提交的变更");
    openModal({
      title: "提交第二人复核",
      subtitle: "同一变更不能由编辑人自己发布",
      body: '<label style="display:block;font-size:11px;color:var(--muted);margin-bottom:5px">复核人</label><select id="reviewer" style="width:100%;border:1px solid var(--line);border-radius:8px;padding:8px;font:12px var(--font)"><option>李静（运营负责人）</option><option>陈涛（数据合规）</option></select><div class="note" style="margin-top:8px">复核人会看到版本差异、受影响字段与 KEEP-AWAY 断言结果。</div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "提交复核", kind: "btn-primary", onClick: () => {
          state.status = "pending";
          state.lastReviewer = (document.getElementById("reviewer") || {}).value || "李静（运营负责人）";
          renderBody();
          toast("已提交复核：等待 " + state.lastReviewer + " 通过", "good");
        } },
      ],
    });
  }

  function approve() {
    if (state.status !== "pending") return;
    openModal({
      title: "第二人复核通过",
      subtitle: "复核人：李静（运营负责人） · 不是本次编辑人",
      body: '<div class="scan-result"><b>复核检查通过</b>4 个字段变更；KEEP-AWAY 断言通过；配置 JSON 可下发；无 PII 字段新增。</div><div class="note" style="margin-top:8px">发布后版本号递增为 v2026.11.08-02，并通知任务 1 重新加载字段策略。</div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "确认发布", kind: "btn-primary", onClick: () => {
          state.status = "published";
          state.version = "v2026.11.08-02";
          state.versions.unshift({ v: state.version, at: "11-08 10:08", by: "李静", status: "published" });
          state.changes = [];
          state.dirty = false;
          renderBody();
          toast("已发布 v2026.11.08-02 · 任务 1 已收到配置通知", "good");
        } },
      ],
    });
  }

  function rollback() {
    openModal({
      title: "回滚配置？",
      subtitle: "回滚会创建新版本，不删除历史",
      body: '<div class="note note-warn">将回滚到 v2026.11.07-03。发布中的任务 1 会收到回滚通知；已收集数据不删除。</div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "确认回滚", kind: "btn-danger", onClick: () => {
          state.version = "v2026.11.07-03";
          state.status = "published";
          state.dirty = false;
          state.changes = [];
          state.versions.unshift({ v: "v2026.11.08-03", at: "11-08 10:12", by: "王敏（回滚发布）", status: "rollback" });
          renderBody();
          toast("已回滚到 v2026.11.07-03 · 生成版本记录 v2026.11.08-03", "good");
        } },
      ],
    });
  }

  function exportCsv() {
    const lines = ["# 骑遇招聘 · 经营看板", "# 导出人：王敏（E-1024） · 2026-11-08 10:16", "# 水印：王敏 · E-1024 · 2026-11-08 · 禁止外传", "指标,数值", ...DATA.kpis.map((k) => [k.key, k.display + k.unit].join(","))];
    downloadText("rider-dashboard-20261108-wangmin.csv", lines.join("\n"), "text/csv;charset=utf-8");
    state.exported = true;
    state.exportLog.unshift({ time: "11-08 10:16", who: "王敏", scope: "经营看板 · 当前筛选", rows: "7 KPI", wm: "已加水印" });
    renderBody();
    toast("已导出 CSV · 水印与导出日志已写入", "good");
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-dtab]");
    if (tab) { state.tab = tab.dataset.dtab; renderBody(); return; }
    if (e.target.closest("[data-reset-filter]")) { state.filters = { channel: "全部渠道", city: "全部城市", station: "全部站点", date: "2026-11-08" }; renderBody(); return; }
    if (e.target.closest("[data-sql-check]")) { state.sqlChecked = true; renderBody(); toast("SQL 对账通过：7/7 指标完全一致", "good"); return; }
    if (e.target.closest("[data-pii-scan]")) { state.piiScanned = true; renderBody(); toast("PII 扫描通过：14 组参数，0 个泄露", "good"); return; }
    if (e.target.closest("[data-cfg-submit]")) return submitReview();
    if (e.target.closest("[data-cfg-approve]")) return approve();
    if (e.target.closest("[data-cfg-rollback]")) return rollback();
    if (e.target.closest("[data-export]")) return exportCsv();
  });

  root.addEventListener("change", (e) => {
    const map = { "f-channel": "channel", "f-city": "city", "f-station": "station", "f-date": "date" };
    if (e.target.id && map[e.target.id]) {
      state.filters[map[e.target.id]] = e.target.value;
      renderBody();
      return;
    }
    const toggle = e.target.closest("[data-cfg-toggle]");
    if (toggle) {
      const f = state.config.find((x) => x.key === toggle.dataset.key);
      if (!f) return;
      const prop = toggle.dataset.cfgToggle;
      if (prop === "llm" && !f.llm) { toggle.checked = false; return toast("该字段锁定：LLM 不可见 (KEEP-AWAY)", "bad"); }
      const before = String(f[prop]);
      f[prop] = toggle.checked;
      state.dirty = true;
      state.status = state.status === "pending" ? "pending" : "draft";
      state.changes.push([f.key + "." + prop + " = " + before, f.key + "." + prop + " = " + String(f[prop])]);
      renderBody();
      return;
    }
    const level = e.target.closest("[data-cfg-level]");
    if (level) {
      const f = state.config.find((x) => x.key === level.dataset.cfgLevel);
      if (!f) return;
      const before = f.level;
      f.level = level.value;
      state.dirty = true;
      state.status = "draft";
      state.changes.push([f.key + ".level = " + before, f.key + ".level = " + f.level]);
      renderBody();
    }
  });

  renderBody();
}
