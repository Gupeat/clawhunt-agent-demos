(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;
  const $$ = H.$$;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const RAW = [
    { name: " 张伟 ", email: "Zhang.Wei@Example.com ", phone: "+86 138-0013-8000", date: "2026/10/3", amount: "￥1,280.00", city: "上海市", status: "已付款" },
    { name: "李娜", email: "li.na@example.com", phone: "13800138001", date: "2026-10-05", amount: "$980.00", city: "上海", status: "已付款" },
    { name: "王强", email: "wang.qiang@example.com", phone: "+8613900138002", date: "10/12/2026", amount: "980 元", city: "北京市", status: "待发货" },
    { name: "张伟", email: "zhang.wei@example.com", phone: "13800138000", date: "2026-10-03", amount: "¥1,280.00", city: "上海", status: "已付款" },
    { name: " 陈晨", email: "chen.chen@example.com", phone: "139-0013-8003", date: "2026.10.07", amount: "1,580.50", city: "杭州", status: "已付款" },
    { name: "刘洋", email: "liu.yang@example", phone: "13700138004", date: "2026-10-08", amount: "$1,200", city: "深圳", status: "待发货" },
    { name: "赵敏", email: "", phone: "13600138005", date: "2026-13-02", amount: "¥760", city: "广州市", status: "" },
    { name: "孙悦", email: "sun.yue@example.com", phone: "13500138006", date: "2026-10-10", amount: "", city: "成都", status: "已付款" },
    { name: "周杰", email: "zhou.jie@example.com", phone: "+86 134 0013 8007", date: "2026-10-11", amount: "￥2,099.00", city: " 深圳市", status: "已付款" },
    { name: "吴磊", email: "wu.lei@example.com", phone: "13300138008", date: "2026/10/13", amount: "1,099", city: "北京", status: "已退款" },
    { name: "郑爽", email: "zheng.shuang@example.com", phone: "13200138009", date: "2026-10-15", amount: "￥3,200", city: "杭州", status: "待发货" },
    { name: "冯欣", email: "feng.xin@example.com", phone: "13100138010", date: "2026-10-15", amount: "￥880", city: "苏州", status: "已付款" }
  ];

  const CITY_MAP = {
    "上海": "上海", "上海市": "上海", "shanghai": "上海",
    "北京": "北京", "北京市": "北京", "beijing": "北京",
    "深圳": "深圳", "深圳市": "深圳", "shenzhen": "深圳",
    "广州": "广州", "广州市": "广州", "guangzhou": "广州",
    "杭州": "杭州", "杭州市": "杭州", "hangzhou": "杭州",
    "成都": "成都", "成都市": "成都", "chengdu": "成都",
    "苏州": "苏州", "苏州市": "苏州", "suzhou": "苏州"
  };

  const DEFAULTS = { trim: true, phone: true, date: true, money: true, email: true, dedupe: true, keep: true };

  let sourceRows = RAW.slice();
  let sourceLabel = "12 行合成样例";
  let last = null;

  function str(value) { return String(value == null ? "" : value); }
  function trim(value) { return str(value).trim(); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function normalizeEmail(value) {
    const raw = trim(value);
    if (!raw) return { value: "", valid: false, reason: "邮箱缺失", changed: false };
    const valueLc = raw.toLowerCase();
    return { value: valueLc, valid: EMAIL_RE.test(valueLc), reason: EMAIL_RE.test(valueLc) ? "" : "邮箱格式不合法", changed: valueLc !== str(value) };
  }

  function normalizePhone(value) {
    const raw = trim(value);
    let digits = raw.replace(/[^0-9]/g, "");
    if (digits.indexOf("0086") === 0) digits = digits.slice(4);
    if (digits.length === 13 && digits.indexOf("86") === 0) digits = digits.slice(2);
    const valid = /^1[3-9]\d{9}$/.test(digits);
    if (!valid) return { value: raw, valid: false, digits: digits, reason: raw ? "手机号不是 11 位有效号码" : "手机号缺失", changed: false };
    const pretty = "+86 " + digits.slice(0, 3) + " " + digits.slice(3, 7) + " " + digits.slice(7);
    return { value: pretty, valid: true, digits: digits, reason: "", changed: pretty !== raw };
  }

  function normalizeDate(value) {
    const raw = trim(value);
    if (!raw) return { value: "", valid: false, reason: "日期缺失", changed: false };
    let m = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    let y; let mo; let d;
    if (m) { y = Number(m[1]); mo = Number(m[2]); d = Number(m[3]); }
    else {
      m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (m) { mo = Number(m[1]); d = Number(m[2]); y = Number(m[3]); }
    }
    if (!m) return { value: raw, valid: false, reason: "日期格式无法识别", changed: false };
    const dt = new Date(Date.UTC(y, mo - 1, d));
    const valid = dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
    if (!valid) return { value: raw, valid: false, reason: "日期不存在（月/日越界）", changed: false };
    const iso = y + "-" + pad2(mo) + "-" + pad2(d);
    return { value: iso, valid: true, reason: "", changed: iso !== raw };
  }

  function normalizeMoney(value) {
    const raw = trim(value);
    if (!raw) return { value: "", valid: false, reason: "金额缺失", changed: false };
    const cleaned = raw.replace(/[￥¥$,\s]/g, "").replace(/元$/, "");
    const num = Number(cleaned);
    if (!isFinite(num)) return { value: raw, valid: false, reason: "金额不是数字", changed: false };
    const rounded = Math.round(num * 100) / 100;
    return { value: rounded, valid: true, reason: "", changed: rounded !== num || raw !== cleaned };
  }

  function normalizeCity(value) {
    const raw = trim(value);
    if (!raw) return { value: "", valid: false, reason: "城市缺失", changed: false };
    const mapped = CITY_MAP[raw.toLowerCase()] || CITY_MAP[raw] || raw;
    return { value: mapped, valid: true, reason: "", changed: mapped !== raw };
  }

  function fmtMoney(value) {
    if (typeof value !== "number" || !isFinite(value)) return "—";
    return "¥" + value.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function csvCell(value) {
    return '"' + str(value).replace(/"/g, '""') + '"';
  }

  function buildCsv(result) {
    const lines = ["source_row,customer_name,email,phone,order_date,amount_cny,city,status,row_state,issue_summary"];
    result.rows.filter(function (row) { return row.included; }).forEach(function (row) {
      lines.push([
        row.row, row.name, row.email, row.phone, row.date,
        typeof row.amount === "number" ? row.amount.toFixed(2) : "",
        row.city, row.status,
        row.state === "ok" ? "ready" : "needs_review",
        row.issueList.map(function (i) { return i.field + ": " + i.reason; }).join(" | ")
      ].map(csvCell).join(","));
    });
    return "\ufeff" + lines.join("\r\n") + "\r\n";
  }

  function cleanRows(rawRows, opts) {
    const rows = [];
    const issues = [];
    const seen = new Set();

    rawRows.forEach(function (raw, index) {
      const rowNo = index + 2;
      const name = opts.trim ? trim(raw.name) : str(raw.name);
      const email = normalizeEmail(raw.email);
      const phone = normalizePhone(raw.phone);
      const date = normalizeDate(raw.date);
      const amount = normalizeMoney(raw.amount);
      const city = normalizeCity(raw.city);
      const statusRaw = opts.trim ? trim(raw.status) : str(raw.status);
      const status = statusRaw || "待确认";
      const issueList = [];

      function issue(field, value, reason, action) {
        const item = { row: rowNo, field: field, value: str(value), reason: reason, action: action };
        issueList.push(item);
        issues.push(item);
      }

      if (!name) issue("客户", raw.name, "客户名称缺失", "人工补充或退回来源");
      if (!email.valid) issue("邮箱", raw.email, email.reason, email.value ? "核对邮箱拼写，不自动补全域名" : "向来源方补要邮箱");
      if (!phone.valid) issue("手机", raw.phone, phone.reason, phone.digits ? "人工核对号码，不强行补位" : "向来源方补要手机号");
      if (!date.valid) issue("日期", raw.date, date.reason, "按原始订单凭证确认日期");
      if (!amount.valid) issue("金额", raw.amount, amount.reason, "回查订单/支付记录，不按 0 处理");
      if (!statusRaw) issue("状态", raw.status, "订单状态缺失", "按支付/发货记录人工确认");

      const emailKey = email.valid ? email.value : "";
      let state = issueList.length ? "review" : "ok";
      let excluded = false;
      if (opts.dedupe && emailKey) {
        if (seen.has(emailKey)) {
          issue("去重", raw.email, "邮箱与更早行重复", "保留首条；核对是否为重复订单");
          state = "duplicate";
          excluded = true;
        } else {
          seen.add(emailKey);
        }
      }

      const changed = [];
      if (opts.trim && name !== str(raw.name)) changed.push("name");
      if (email.changed) changed.push("email");
      if (opts.phone && phone.valid && phone.changed) changed.push("phone");
      if (opts.date && date.valid && date.changed) changed.push("date");
      if (opts.money && amount.valid && amount.changed) changed.push("amount");
      if (city.changed) changed.push("city");
      if (status !== statusRaw) changed.push("status");

      const row = {
        row: rowNo,
        raw: raw,
        name: name,
        email: email.value,
        emailValid: email.valid,
        phone: opts.phone && phone.valid ? phone.value : str(raw.phone).trim(),
        phoneValid: phone.valid,
        date: opts.date && date.valid ? date.value : str(raw.date).trim(),
        dateValid: date.valid,
        amount: opts.money && amount.valid ? amount.value : str(raw.amount).trim(),
        amountValid: amount.valid,
        city: city.value,
        status: status,
        statusMissing: !statusRaw,
        state: state,
        excluded: excluded,
        issueList: issueList,
        changed: changed,
        included: !excluded && (state === "ok" || !!opts.keep)
      };
      rows.push(row);
    });

    const ready = rows.filter(function (r) { return r.state === "ok"; }).length;
    const review = rows.filter(function (r) { return r.state === "review"; }).length;
    const duplicate = rows.filter(function (r) { return r.state === "duplicate"; }).length;
    const included = rows.filter(function (r) { return r.included; }).length;
    const changed = rows.reduce(function (sum, r) { return sum + r.changed.length; }, 0);
    return { rows: rows, issues: issues, ready: ready, review: review, duplicate: duplicate, included: included, changed: changed, opts: opts };
  }

  function currentOpts() {
    const opts = {};
    $$("#rules input[data-rule]").forEach(function (el) { opts[el.getAttribute("data-rule")] = el.checked; });
    return opts;
  }

  function stateBadge(row) {
    if (row.state === "duplicate") return '<span class="badge warn">重复 · 已排除</span>';
    if (row.state === "review") return '<span class="badge bad">需确认</span>';
    return '<span class="badge good">可交付</span>';
  }

  function cellClass(row, field, invalid) {
    if (invalid) return "cell-bad";
    if (row.changed.indexOf(field) >= 0) return "cell-fixed";
    return "";
  }

  function renderTable(result) {
    $("#result-body").innerHTML = result.rows.map(function (row) {
      const issueText = row.issueList.map(function (i) { return i.field + "：" + i.reason; }).join("；");
      return '<tr title="' + H.escape(issueText || "无异常") + '">' +
        '<td class="mono">' + row.row + "</td>" +
        '<td class="' + cellClass(row, "name", false) + '">' + H.escape(row.name || "（空）") + "</td>" +
        '<td class="' + cellClass(row, "email", !row.emailValid) + '">' + H.escape(row.email || "（空）") + "</td>" +
        '<td class="' + cellClass(row, "phone", !row.phoneValid) + '">' + H.escape(row.phone || "（空）") + "</td>" +
        '<td class="' + cellClass(row, "date", !row.dateValid) + '">' + H.escape(row.date || "（空）") + "</td>" +
        '<td class="' + cellClass(row, "amount", !row.amountValid) + '">' + (typeof row.amount === "number" ? fmtMoney(row.amount) : H.escape(row.amount || "（空）")) + "</td>" +
        '<td class="' + cellClass(row, "city", false) + '">' + H.escape(row.city || "（空）") + "</td>" +
        '<td class="' + cellClass(row, "status", row.statusMissing) + '">' + H.escape(row.status) + "</td>" +
        '<td class="tag-row">' + stateBadge(row) + "</td>" +
        "</tr>";
    }).join("");
  }

  function renderIssues(result) {
    $("#issue-count").textContent = result.issues.length + " 条";
    const affected = result.rows.filter(function (r) { return r.state !== "ok"; }).length;
    $("#issue-sub").textContent = "影响 " + affected + " 行；其中重复 " + result.duplicate + " 行，需人工确认 " + result.review + " 行。";
    $("#issue-body").innerHTML = result.issues.length ? result.issues.map(function (i) {
      return "<tr>" +
        '<td class="mono">' + i.row + "</td>" +
        '<td class="issue-field">' + H.escape(i.field) + "</td>" +
        '<td class="mono">' + H.escape(i.value || "（空）") + "</td>" +
        "<td>" + H.escape(i.reason) + "</td>" +
        "<td>" + H.escape(i.action) + "</td>" +
        "</tr>";
    }).join("") : '<tr><td colspan="5" class="muted">当前规则下没有异常。</td></tr>';
  }

  function buildNotes(result) {
    const opts = result.opts;
    const rules = [];
    if (opts.trim) rules.push("文本去首尾空格");
    if (opts.phone) rules.push("手机号统一 +86 格式");
    if (opts.date) rules.push("日期统一 YYYY-MM-DD");
    if (opts.money) rules.push("金额去币种/千分位并保留两位小数");
    if (opts.dedupe) rules.push("按邮箱保留首条");
    if (opts.keep) rules.push("异常行保留在交付表并标记");
    return [
      "表格清洗交付说明",
      "1. 源数据：" + sourceLabel + "，共 " + result.rows.length + " 行、7 个字段；原始数据未修改。",
      "2. 处理规则：" + rules.join("；") + "。",
      "3. 处理结果：进入交付 " + result.included + " 行；其中可直接入库 " + result.ready + " 行，需人工确认 " + result.review + " 行，重复排除 " + result.duplicate + " 行；字段修正 " + result.changed + " 处。",
      "4. 异常清单：" + result.issues.length + " 条字段级问题，已单列在“异常清单”中；重复行不合并金额。",
      "5. 交付物：清洗后 CSV（UTF-8 BOM，英文 snake_case 字段）+ 本说明 + 异常清单。",
      "6. 需要你确认：币种是否均为人民币；缺失邮箱/日期/金额的来源；重复行是否确认为同一订单；异常行是退回还是保留待确认。",
      "7. 演示边界：本页为纯前端合成样例，不上传文件、不连接业务系统；真实交付会先在你的 10 行样例上试洗并双方确认口径。"
    ].join("\n");
  }

  function render(result) {
    last = result;
    $("#kpi-raw").textContent = result.rows.length;
    $("#kpi-clean").textContent = result.ready;
    $("#kpi-issues").textContent = result.review + result.duplicate;
    $("#kpi-fixed").textContent = result.changed;
    $("#output-count").textContent = "进入交付 " + result.included + " 行";
    $("#result-sub").textContent = sourceLabel + " · " + (result.opts.dedupe ? "按邮箱去重" : "未去重") + " · " + (result.opts.keep ? "异常行保留" : "仅输出通过行");
    $("#run-state").textContent = "已处理 " + result.rows.length + " 行";
    $("#run-state").className = "badge good";
    renderTable(result);
    renderIssues(result);
    $("#notes-box").textContent = buildNotes(result);
    setDownloadLink();
  }

  function run(opts) {
    render(cleanRows(sourceRows, opts || currentOpts()));
  }

  function setDownloadLink() {
    const btn = $("#download-csv");
    if (!last) return;
    const blob = new Blob([buildCsv(last)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    if (btn._url) URL.revokeObjectURL(btn._url);
    btn._url = url;
  }

  function download() {
    if (!last) return;
    setDownloadLink();
    const a = document.createElement("a");
    a.href = $("#download-csv")._url;
    a.download = "cleaned-orders.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    H.toast("已生成 CSV；原始文件未被修改");
  }

  function parseCsvLine(line) {
    const cells = [];
    let cur = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (quoted) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i += 1; }
        else if (ch === '"') quoted = false;
        else cur += ch;
      } else if (ch === '"') quoted = true;
      else if (ch === ",") { cells.push(cur); cur = ""; }
      else cur += ch;
    }
    cells.push(cur);
    return cells;
  }

  function parseCsv(text) {
    const lines = String(text || "").replace(/^\ufeff/, "").split(/\r?\n/).filter(function (line) { return line.trim() !== ""; });
    if (lines.length < 2) throw new Error("CSV 至少需要表头和一行数据");
    const headers = parseCsvLine(lines[0]).map(function (h) { return h.trim().toLowerCase(); });
    const map = {};
    const aliases = {
      name: ["客户名称", "客户", "姓名", "name", "customer", "customer_name"],
      email: ["邮箱", "email", "e-mail"],
      phone: ["电话", "手机", "手机号", "phone", "mobile"],
      date: ["下单日期", "日期", "date", "order_date"],
      amount: ["金额", "amount", "amount_cny", "价格"],
      city: ["城市", "city"],
      status: ["状态", "status"]
    };
    headers.forEach(function (h, index) {
      Object.keys(aliases).forEach(function (key) {
        if (aliases[key].indexOf(h) >= 0) map[key] = index;
      });
    });
    if (map.email == null && map.name == null) throw new Error("未找到“客户名称/姓名”或“邮箱”列");
    return lines.slice(1).map(function (line) {
      const cells = parseCsvLine(line);
      const row = {};
      Object.keys(aliases).forEach(function (key) {
        row[key] = map[key] == null ? "" : str(cells[map[key]]).trim();
      });
      return row;
    });
  }

  function runChecks() {
    const result = cleanRows(RAW, Object.assign({}, DEFAULTS));
    const csvLines = buildCsv(result).replace(/^\ufeff/, "").trim().split(/\r?\n/);
    const checks = [
      H.check("原始样例未被改写", RAW.length === 12 && RAW[0].name === " 张伟 " && RAW[0].amount === "￥1,280.00", "12 行只读"),
      H.check("手机号统一为 +86 格式", normalizePhone("+86 138-0013-8000").value === "+86 138 0013 8000", "含分隔符"),
      H.check("非法手机号不强行补位", !normalizePhone("12345").valid, "拒绝 5 位号码"),
      H.check("日期支持 4 种输入", normalizeDate("2026/10/3").value === "2026-10-03" && normalizeDate("10/12/2026").value === "2026-10-12", "斜杠/美式"),
      H.check("非法日期不静默修正", !normalizeDate("2026-13-02").valid, "13 月保留异常"),
      H.check("金额去除币种和千分位", normalizeMoney("￥1,280.50").value === 1280.5, "￥1,280.50"),
      H.check("邮箱不自动补全域名", !normalizeEmail("liu.yang@example").valid, "@example 判非法"),
      H.check("按邮箱只标记 1 行重复", result.duplicate === 1 && result.included === 11, "12 行 → 交付 11 行"),
      H.check("可交付行金额均为数字", result.rows.filter(function (r) { return r.state === "ok"; }).every(function (r) { return typeof r.amount === "number"; }), "8 行通过"),
      H.check("CSV 行数与交付行一致", csvLines.length === result.included + 1, "表头 + " + result.included + " 行")
    ];
    H.renderChecks("#checklist", checks);
    return checks;
  }

  function switchTab(name) {
    $$(".tab").forEach(function (t) { t.classList.toggle("active", t.getAttribute("data-tab") === name); });
    $$(".tabpane").forEach(function (p) { p.classList.toggle("active", p.id === "pane-" + name); });
  }

  function bind() {
    $$("#rules input[data-rule]").forEach(function (el) {
      H.on(el, "change", function () { run(); });
    });
    H.on($("#run-clean"), "click", function () { run(); H.toast("已按当前规则重算"); });
    H.on($("#reset-sample"), "click", function () {
      sourceRows = RAW.slice();
      sourceLabel = "12 行合成样例";
      $("#csv-file").value = "";
      run(DEFAULTS);
      H.toast("已恢复样例数据");
    });
    H.on($("#download-csv"), "click", download);
    H.on($("#copy-notes"), "click", copyNotes);
    H.on($("#copy-notes-2"), "click", copyNotes);
    H.on($("#run-checks"), "click", function () { runChecks(); H.toast("自检已重新运行"); });
    $$(".tab").forEach(function (tab) { H.on(tab, "click", function () { switchTab(tab.getAttribute("data-tab")); }); });
    H.on($("#csv-file"), "change", function (event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      file.text().then(function (text) {
        sourceRows = parseCsv(text);
        sourceLabel = "导入 " + file.name + " · " + sourceRows.length + " 行";
        run();
        H.toast("已导入 " + sourceRows.length + " 行，原始文件未修改");
      }).catch(function (err) {
        H.toast(err.message || "CSV 解析失败");
      });
    });
  }

  function copyNotes() {
    if (!last) return;
    const text = buildNotes(last);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { H.toast("处理说明已复制"); }).catch(function () { H.toast("复制失败，可手动选择文本"); });
    } else {
      H.toast("当前浏览器不支持一键复制");
    }
  }

  bind();
  run(DEFAULTS);
  runChecks();
})();