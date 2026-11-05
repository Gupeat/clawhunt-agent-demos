(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;
  const $$ = H.$$;

  const ORDER = {
    orderNo: "SO-2026-1107",
    contractNo: "CT-2026-1107",
    invoiceNo: "INV-2026-1107",
    buyer: "Northwind Retail LLC",
    buyerTaxId: "US-88-1234567",
    destination: "Los Angeles, US",
    incoterm: "FOB Ningbo",
    orderDate: "2026-10-27",
    shipDate: "2026-11-07",
    currency: "USD",
    payment: 1804,
    lines: [
      { sku: "RED-M", desc: "棉质圆领T恤 红色 M", hs: "6109.10", conf: 0.97, qty: 120, unit: "PCS", price: 4.80, net: 21.6, gross: 26.4 },
      { sku: "RED-L", desc: "棉质圆领T恤 红色 L", hs: "6109.10", conf: 0.95, qty: 80, unit: "PCS", price: 4.80, net: 14.4, gross: 17.6 },
      { sku: "SET-BLUE-2P", desc: "蓝色T恤两件套（M+L）", hs: "6109.10", conf: 0.93, qty: 40, unit: "SET", price: 9.60, net: 14.4, gross: 17.6, split: "40 SET → 80 PCS" },
      { sku: "CAP-NAVY", desc: "棒球帽 藏青", hs: "6505.00", conf: 0.90, qty: 200, unit: "PCS", price: 2.30, net: 11.0, gross: 13.8 }
    ]
  };

  const INVOICE_LINES = [
    { sku: "RED-M", qty: 120, price: 4.80, amount: 576 },
    { sku: "RED-L", qty: 80, price: 4.80, amount: 384 },
    { sku: "BLUE-M", qty: 40, price: 4.80, amount: 192 },
    { sku: "BLUE-L", qty: 40, price: 4.80, amount: 192 },
    { sku: "CAP-NAVY", qty: 200, price: 2.30, amount: 460 }
  ];

  const INVOICE_HEAD = [
    { label: "买方名称", contract: "Northwind Retail LLC", invoice: "Northwind Retail Ltd", ok: false, note: "主体后缀不一致，不能自动改" },
    { label: "买方税号", contract: "US-88-1234567", invoice: "（空）", ok: false, note: "税号缺失，要求供应商重开" },
    { label: "币种", contract: "USD", invoice: "USD", ok: true, note: "一致" },
    { label: "发票总额", contract: "USD 1,804.00", invoice: "USD 1,804.00", ok: true, note: "一致" }
  ];

  const DOCS = [
    { dir: "01_order", file: "PO-2026-1107.pdf", label: "采购订单", gate: null },
    { dir: "02_contract", file: "CT-2026-1107.pdf", label: "销售合同", gate: null },
    { dir: "03_shipment", file: "SHIP-2026-1107.xlsx", label: "出货单/装箱单", gate: "erp" },
    { dir: "04_customs", file: "declaration-draft.json", label: "报关草稿（未提交）", gate: null },
    { dir: "05_invoice", file: "INV-2026-1107.pdf", label: "商业发票", gate: "invoice" },
    { dir: "06_payment", file: "PAY-2026-1107.pdf", label: "收款回单", gate: null },
    { dir: "", file: "manifest.json", label: "归档清单", gate: "manifest" }
  ];

  const state = { grossFilled: false, invoiceConfirmed: false, rejected: false, tab: "order" };

  function usd(value) { return "$" + Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function cny(value) { return "¥" + Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(value) { return Number(value).toFixed(2); }
  function contractTotal() { return ORDER.lines.reduce(function (sum, line) { return sum + line.qty * line.price; }, 0); }
  function invoiceTotal() { return INVOICE_LINES.reduce(function (sum, line) { return sum + line.amount; }, 0); }
  function netTotal() { return ORDER.lines.reduce(function (sum, line) { return sum + line.net; }, 0); }
  function grossTotal() { return ORDER.lines.reduce(function (sum, line) { return sum + line.gross; }, 0); }
  function grossAfterFill() { return grossTotal(); }

  function totalFields() { return 28; }
  function invoiceDiffCount() { return INVOICE_HEAD.filter(function (h) { return !h.ok; }).length; }
  function missingFieldCount() { return state.grossFilled ? 0 : 1; }
  function consistentCount() {
    return 25 + (state.grossFilled ? 1 : 0) + (state.invoiceConfirmed ? 2 : 0);
  }

  function flowSteps() {
    return [
      { n: 1, label: "订单 / 合同", desc: "已生成合同与 HS 候选", status: "done" },
      { n: 2, label: "ERP 回填", desc: state.grossFilled ? "字段已闭合" : "CAP-NAVY 毛重缺失", status: state.grossFilled ? "done" : "current" },
      { n: 3, label: "发票核对", desc: state.invoiceConfirmed ? "差异已确认" : state.rejected ? "已退回供应商" : "2 项差异待确认", status: state.invoiceConfirmed ? "done" : (state.grossFilled && !state.rejected ? "current" : "pending") },
      { n: 4, label: "归档 / 平衡", desc: archiveComplete() ? "7 类文件 + 清单" : "等待前置门", status: archiveComplete() ? "done" : "pending" }
    ];
  }

  function archiveComplete() { return state.grossFilled && state.invoiceConfirmed; }

  function renderFlow() {
    $("#flowbar").innerHTML = flowSteps().map(function (step) {
      return '<div class="flowstep ' + step.status + '"><b>0' + step.n + " " + step.label + "</b>" +
        '<span class="tiny">' + step.desc + "</span></div>";
    }).join("");
    const gate = $("#gate-badge");
    if (state.invoiceConfirmed) { gate.textContent = "已确认 · 可归档"; gate.className = "badge good"; }
    else if (state.rejected) { gate.textContent = "已退回 · 流程暂停"; gate.className = "badge bad"; }
    else if (state.grossFilled) { gate.textContent = "待财务确认"; gate.className = "badge warn"; }
    else { gate.textContent = "待回填 · 待确认"; gate.className = "badge warn"; }
    $("#flow-note").textContent = state.invoiceConfirmed
      ? "流程完成：字段 28/28 闭合，审计记录已写入，可归档。"
      : state.grossFilled
        ? "ERP 字段已闭合；发票有 2 项差异，等待财务/报关负责人确认。"
        : "流程停在 ERP 回填：CAP-NAVY 毛重缺失，禁止按比例/同款推算。";
    $("#kpi-consistent").textContent = consistentCount() + "/28";
  }

  function renderOrder() {
    const total = contractTotal();
    $("#order-head").innerHTML = [
      ["订单号", ORDER.orderNo], ["合同号", ORDER.contractNo], ["买方", ORDER.buyer + " / " + ORDER.buyerTaxId],
      ["贸易术语", ORDER.incoterm], ["目的港", ORDER.destination], ["合同总额", "USD " + usd(total).slice(1)]
    ].map(function (row) { return "<tr><th>" + row[0] + "</th><td>" + H.escape(row[1]) + "</td></tr>"; }).join("");
    $("#order-lines").innerHTML = ORDER.lines.map(function (line) {
      return "<tr><td><b>" + line.sku + "</b><br><span class=\"tiny\">" + H.escape(line.desc) + "</span></td><td>" + line.qty + " " + line.unit + "</td><td>" + usd(line.price) + "</td><td class=\"mono\">" + usd(line.qty * line.price) + "</td></tr>";
    }).join("") + '<tr><th>合计</th><th>—</th><th>—</th><th class="mono">' + usd(total) + "</th></tr>";
    $("#contract-total").textContent = usd(total);
    $("#hs-body").innerHTML = ORDER.lines.map(function (line) {
      const action = line.conf >= 0.95 ? '<span class="badge good">自动候选</span>' : '<span class="badge warn">人工复核</span>';
      return "<tr><td><b>" + line.sku + "</b><br><span class=\"tiny\">" + H.escape(line.desc) + "</span></td><td class=\"mono\">" + line.hs + "</td><td>" + H.fmtPct(line.conf) + "</td><td>" + action + "</td></tr>";
    }).join("");
    $("#contract-preview").textContent = [
      "销售合同 " + ORDER.contractNo,
      "买方：" + ORDER.buyer + "（税号 " + ORDER.buyerTaxId + "）",
      "卖方：Ningbo Sample Trading Co., Ltd.（合成）",
      "贸易术语：" + ORDER.incoterm + " / 目的港：" + ORDER.destination,
      "金额：USD " + total.toFixed(2) + "（" + ORDER.lines.length + " 个订单行）",
      "单据：商业发票、装箱单、报关单、提单按约定提交。",
      "责任边界：卖方负责出口报关资料；进口清关与税费由买方承担。",
      "特别条款：HS 归类以双方确认的申报要素为准；本演示不构成归类意见。"
    ].join("\n");
  }

  function erpRows() {
    return [
      { key: "RED-M", contract: "120 PCS", erp: "120 PCS", split: "—", net: "21.6 kg", gross: "26.4 kg", hs: "6109.10", status: "一致", tone: "good" },
      { key: "RED-L", contract: "80 PCS", erp: "80 PCS", split: "—", net: "14.4 kg", gross: "17.6 kg", hs: "6109.10", status: "一致", tone: "good" },
      { key: "SET-BLUE-2P", contract: "40 SET", erp: "40 SET", split: "40 SET → 80 PCS", net: "14.4 kg", gross: "17.6 kg", hs: "6109.10", status: "拆分后一致", tone: "info" },
      { key: "CAP-NAVY", contract: "200 PCS", erp: "200 PCS", split: "—", net: "11.0 kg", gross: state.grossFilled ? "13.8 kg" : "", hs: "6505.00", status: state.grossFilled ? "人工回填" : "毛重缺失", tone: state.grossFilled ? "warn" : "bad" }
    ];
  }

  function renderErp() {
    $("#erp-body").innerHTML = erpRows().map(function (row) {
      const gross = row.gross ? H.escape(row.gross) : '<span class="badge bad">缺失</span>';
      return "<tr><td><b>" + row.key + "</b></td><td>" + row.contract + "</td><td>" + row.erp + "</td><td>" + H.escape(row.split) + "</td><td>" + row.net + "</td><td>" + gross + "</td><td class=\"mono\">" + row.hs + "</td><td><span class=\"badge " + row.tone + "\">" + row.status + "</span></td></tr>";
    }).join("");
    $("#erp-badge").textContent = state.grossFilled ? "字段已闭合" : "1 字段缺失";
    $("#erp-badge").className = "badge " + (state.grossFilled ? "good" : "warn");
    const visualRows = ORDER.lines.map(function (line) {
      const gross = line.sku === "CAP-NAVY" && !state.grossFilled ? '<td class="miss">（空）</td>' : "<td>" + line.gross.toFixed(1) + " kg</td>";
      return "<tr><td>" + line.sku + "</td><td>" + line.qty + " " + line.unit + "</td><td>" + line.net.toFixed(1) + " kg</td>" + gross + "<td>" + line.hs + "</td></tr>";
    }).join("");
    $("#visual-table").innerHTML = "<thead><tr><th>SKU</th><th>数量</th><th>净重</th><th>毛重</th><th>HS</th></tr></thead><tbody>" + visualRows + "</tbody>";
    $("#visual-badge").textContent = state.grossFilled ? "已回填 13.8 kg" : "待补 1 字段";
    $("#visual-badge").className = "badge " + (state.grossFilled ? "good" : "info");
    $("#visual-scan").textContent = state.grossFilled
      ? "视觉定位：CAP-NAVY 毛重 13.8 kg 已由操作员确认；来源为 ERP 出货单单元格，未做任何推算。"
      : "视觉定位：CAP-NAVY 行“毛重”单元格为空；相邻行有毛重，但不得按比例推算。";
    const fillBtn = $("#visual-fill");
    fillBtn.disabled = state.grossFilled;
    fillBtn.textContent = state.grossFilled ? "已人工确认" : "人工确认视觉回填 13.8 kg";
    const checks = [
      ["数量 / 单位", "4/4 行", true, "含 1 个组合 SKU 拆分"],
      ["净重合计", netTotal().toFixed(1) + " kg", true, "与订单行相加一致"],
      ["毛重合计", state.grossFilled ? grossAfterFill().toFixed(1) + " kg" : "61.6 / 75.4 kg", !!state.grossFilled, state.grossFilled ? "与订单行相加一致" : "缺 CAP-NAVY 13.8 kg"],
      ["HS 候选", "4/4 有候选", true, "3 个自动 + 1 个复核，保留依据"],
      ["组合拆分", "40 SET → 80 PCS", true, "发票按拆分后行匹配"],
      ["字段一致", consistentCount() + "/28", state.grossFilled, state.grossFilled ? "人工回填后闭合" : "停在缺失字段，不继续申报"]
    ];
    $("#erp-check-body").innerHTML = checks.map(function (c) {
      return "<tr><td>" + c[0] + "</td><td>" + (c[2] ? '<span class="diff-ok">' + c[1] + "</span>" : '<span class="diff-bad">' + c[1] + "</span>") + "</td><td>" + c[3] + "</td></tr>";
    }).join("");
  }

  function renderInvoice() {
    $("#invoice-head").innerHTML = INVOICE_HEAD.map(function (row) {
      return "<tr" + (row.ok ? "" : ' class="warn"') + "><td>" + row.label + "</td><td>" + H.escape(row.contract) + "</td><td>" + H.escape(row.invoice) + "</td><td>" + (row.ok ? '<span class="diff-ok">一致</span>' : '<span class="diff-bad">差异</span>') + "<br><span class='tiny'>" + H.escape(row.note) + "</span></td></tr>";
    }).join("");
    $("#invoice-lines").innerHTML = INVOICE_LINES.map(function (line) {
      return "<tr><td>" + line.sku + "</td><td>" + line.qty + " PCS</td><td>" + usd(line.price) + "</td><td class='mono'>" + usd(line.amount) + '</td><td><span class="diff-ok">匹配</span></td></tr>';
    }).join("") + '<tr><th>合计</th><th>480 PCS</th><th>—</th><th class="mono">' + usd(invoiceTotal()) + "</th><th>" + (invoiceTotal() === contractTotal() ? '<span class="diff-ok">金额一致</span>' : '<span class="diff-bad">金额不一致</span>') + "</th></tr>";
    const badge = $("#invoice-badge");
    if (state.invoiceConfirmed) { badge.textContent = "差异已确认 · 已留痕"; badge.className = "badge good"; }
    else if (state.rejected) { badge.textContent = "已退回供应商"; badge.className = "badge bad"; }
    else { badge.textContent = "2 项差异待确认"; badge.className = "badge bad"; }
    $("#confirm-invoice").disabled = state.invoiceConfirmed || state.rejected;
    $("#reject-invoice").disabled = state.invoiceConfirmed || state.rejected;
    $("#confirm-note").disabled = state.invoiceConfirmed || state.rejected;
    if (state.invoiceConfirmed) {
      $("#gate-text").textContent = "已由财务/报关负责人确认：以合同主体 LLC 为准，供应商重开发票后归档；确认记录已写入审计日志。";
      $("#gate-log").innerHTML = '<span class="diff-ok">审计记录：2026-11-07 15:42 CST · 操作人 财务复核（演示） · 差异 2 项 · 处理：供应商重开</span>';
    } else if (state.rejected) {
      $("#gate-text").textContent = "已退回供应商重开发票；流程暂停，不允许归档或继续申报。";
      $("#gate-log").innerHTML = '<span class="diff-bad">审计记录：2026-11-07 15:43 CST · 操作人 财务复核（演示） · 结果：退回</span>';
    } else {
      $("#gate-text").textContent = "发票买方为 “Northwind Retail Ltd”，合同为 “Northwind Retail LLC”；发票税号为空。不能自动改发票，也不能直接归档。";
      $("#gate-log").textContent = "确认动作会写入审计日志；真实环境应由财务/报关负责人操作，并保留更正后的发票。";
    }
  }

  function docStatus(doc) {
    if (doc.gate === "erp") return state.grossFilled;
    if (doc.gate === "invoice") return state.invoiceConfirmed;
    if (doc.gate === "manifest") return archiveComplete();
    return true;
  }

  function docHash(doc) {
    return "sha256:" + H.hash(ORDER.orderNo + "|" + doc.file).toString(16).padStart(16, "0");
  }

  function renderArchive() {
    const lines = ["<div>2026/11/SO-2026-1107/</div>"];
    DOCS.forEach(function (doc, index) {
      const ok = docStatus(doc);
      const prefix = index === DOCS.length - 1 ? "└─ " : "├─ ";
      const path = doc.dir ? doc.dir + "/" + doc.file : doc.file;
      const status = ok ? '<span class="ok">✓</span>' : '<span class="missing">缺失</span>';
      const pad = "&nbsp;".repeat(Math.max(1, 44 - path.length));
      lines.push("<div>" + prefix + H.escape(path) + pad + status + "&nbsp;&nbsp;" + H.escape(doc.label) + "</div>");
    });
    $("#doc-tree").innerHTML = lines.join("");
    $("#archive-badge").textContent = archiveComplete() ? "7/7 已齐 · 可归档" : "待前置门";
    $("#archive-badge").className = "badge " + (archiveComplete() ? "good" : "warn");
    const balance = contractTotal() - invoiceTotal();
    $("#bal-contract").textContent = usd(contractTotal());
    $("#bal-invoice").textContent = usd(invoiceTotal());
    $("#bal-diff").textContent = usd(balance);
    $("#bal-payment").textContent = usd(ORDER.payment);
    const checks = [
      ["单据齐备", archiveComplete() ? "7/7" : "待补", archiveComplete(), "订单/合同/出货/发票/收款/草稿/清单"],
      ["字段一致", consistentCount() + "/28", state.invoiceConfirmed, "人工确认后计入"],
      ["金额平衡", balance === 0 ? "合同 − 发票 = 0.00" : "有差异", balance === 0, "另与收款 1,804.00 对齐"],
      ["人工确认", state.invoiceConfirmed ? "已记录" : "未完成", state.invoiceConfirmed, "操作人/时间/原因"],
      ["未申报提醒", "仅草稿", true, "不代点税局/单一窗口"]
    ];
    $("#archive-checks").innerHTML = checks.map(function (c) {
      return "<tr><td>" + c[0] + "</td><td>" + (c[2] ? '<span class="diff-ok">' + c[1] + "</span>" : '<span class="diff-bad">' + c[1] + "</span>") + "</td><td>" + c[3] + "</td></tr>";
    }).join("");
    $("#download-manifest").disabled = !archiveComplete();
    $("#download-manifest").textContent = archiveComplete() ? "下载归档清单 JSON" : "归档完成后下载清单";
  }

  function replayData() {
    const fields = 50 * 28;
    const issues = [
      { type: "毛重缺失", count: 3, example: "CAP / 帽子行毛重空", action: "视觉回填 + 人工确认" },
      { type: "发票买方名称", count: 2, example: "Ltd vs LLC", action: "退回重开 / 财务确认" },
      { type: "税号缺失", count: 1, example: "发票税号空", action: "重开发票" }
    ];
    const intercepted = issues.reduce(function (sum, item) { return sum + item.count; }, 0);
    const auto = fields - intercepted;
    return { fields: fields, auto: auto, intercepted: intercepted, rate: auto / fields * 100, issues: issues };
  }

  function renderReplay() {
    const data = replayData();
    $("#replay-consistent").textContent = data.auto + "/1,400";
    $("#replay-badge").textContent = data.rate.toFixed(2) + "%";
    $("#replay-badge").className = "badge " + (data.rate >= 99.5 ? "good" : "bad");
    $("#replay-body").innerHTML = data.issues.map(function (item) {
      return "<tr><td>" + H.escape(item.type) + "</td><td>" + item.count + "</td><td>" + H.escape(item.example) + "</td><td>" + H.escape(item.action) + "</td></tr>";
    }).join("");
    const bar = $("#replay-bar");
    bar.style.width = "0%";
    setTimeout(function () { bar.style.width = "100%"; }, 60);
  }

  function renderAll() {
    renderFlow();
    renderOrder();
    renderErp();
    renderInvoice();
    renderArchive();
  }

  function switchTab(name) {
    state.tab = name;
    $$(".tab").forEach(function (tab) { tab.classList.toggle("active", tab.getAttribute("data-tab") === name); });
    $$(".tabpane").forEach(function (pane) { pane.classList.toggle("active", pane.id === "pane-" + name); });
  }

  function visualFill() {
    if (state.grossFilled) return;
    state.grossFilled = true;
    renderAll();
    H.toast("已人工确认毛重 13.8 kg；下一步核对发票差异");
    setTimeout(function () { switchTab("invoice"); }, 260);
  }

  function confirmInvoice() {
    if (!state.grossFilled) { H.toast("先完成 ERP 缺失字段回填"); return; }
    if (state.invoiceConfirmed) return;
    const note = $("#confirm-note").value.trim();
    if (note.length < 6) { H.toast("请填写确认原因（至少 6 个字）"); return; }
    state.invoiceConfirmed = true;
    state.rejected = false;
    renderAll();
    H.toast("已记录人工确认；归档清单已生成");
    setTimeout(function () { switchTab("archive"); }, 260);
  }

  function rejectInvoice() {
    if (!state.grossFilled) { H.toast("先完成 ERP 缺失字段回填"); return; }
    state.rejected = true;
    state.invoiceConfirmed = false;
    renderAll();
    H.toast("已退回供应商；流程暂停，不允许归档");
  }

  function runAll() {
    state.grossFilled = false;
    state.invoiceConfirmed = false;
    state.rejected = false;
    renderAll();
    switchTab("erp");
    H.toast("已运行：流程停在 ERP 缺失字段");
  }

  function resetFlow() {
    state.grossFilled = false;
    state.invoiceConfirmed = false;
    state.rejected = false;
    renderAll();
    switchTab("order");
    H.toast("已重置到初始状态");
  }

  function manifest() {
    const docs = DOCS.map(function (doc) {
      return {
        path: "2026/11/SO-2026-1107/" + (doc.dir ? doc.dir + "/" : "") + doc.file,
        label: doc.label,
        sha256: docHash(doc),
        present: docStatus(doc)
      };
    });
    return {
      order_no: ORDER.orderNo,
      contract_no: ORDER.contractNo,
      invoice_no: ORDER.invoiceNo,
      buyer: ORDER.buyer,
      buyer_tax_id: ORDER.buyerTaxId,
      currency: ORDER.currency,
      contract_total: contractTotal(),
      invoice_total: invoiceTotal(),
      payment_total: ORDER.payment,
      balance: contractTotal() - invoiceTotal(),
      field_consistency: consistentCount() + "/28",
      human_confirmation: state.invoiceConfirmed ? { status: "confirmed", note: $("#confirm-note").value.trim(), at: "2026-11-07 15:42 CST" } : { status: "pending" },
      complete: archiveComplete(),
      documents: docs
    };
  }

  function downloadManifest() {
    if (!archiveComplete()) { H.toast("归档未完成，暂不能下载正式清单"); return; }
    const blob = new Blob([JSON.stringify(manifest(), null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SO-2026-1107-manifest.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    H.toast("归档清单已生成");
  }

  function runChecks() {
    const replay = replayData();
    const manifestNow = manifest();
    const checks = [
      H.check("合同金额可复算", contractTotal() === 1804 && usd(contractTotal()).replace(".00", "") === "$1,804", "USD 1,804.00"),
      H.check("发票金额与合同一致", invoiceTotal() === contractTotal(), "1,804.00 = 1,804.00"),
      H.check("组合 SKU 拆分正确", ORDER.lines[2].split === "40 SET → 80 PCS", "40 SET → 80 PCS"),
      H.check("净重合计与订单行一致", netTotal().toFixed(1) === "61.4", "61.4 kg"),
      H.check("毛重合计可闭合", grossAfterFill().toFixed(1) === "75.4", "75.4 kg（回填后）"),
      H.check("缺失毛重被硬拦截", missingFieldCount() === 1, "自动化状态 → 1 项待回填"),
      H.check("发票差异被识别", invoiceDiffCount() === 2, "买方名称 + 税号"),
      H.check("金额平衡为零", contractTotal() - invoiceTotal() === 0, "合同 − 发票 = 0.00"),
      H.check("归档清单含 7 类文件", manifestNow.documents.length === 7 && manifestNow.documents.every(function (d) { return d.sha256.indexOf("sha256:") === 0; }), "7 个 SHA-256"),
      H.check("50 票回放 ≥ 99.5%", replay.intercepted === 6 && replay.rate >= 99.5, replay.auto + "/" + replay.fields + " · " + replay.rate.toFixed(2) + "%")
    ];
    H.renderChecks("#checklist", checks);
    return checks;
  }

  function bind() {
    $$(".tab").forEach(function (tab) { H.on(tab, "click", function () { switchTab(tab.getAttribute("data-tab")); }); });
    H.on($("#run-all"), "click", runAll);
    H.on($("#reset-flow"), "click", resetFlow);
    H.on($("#visual-fill"), "click", visualFill);
    H.on($("#confirm-invoice"), "click", confirmInvoice);
    H.on($("#reject-invoice"), "click", rejectInvoice);
    H.on($("#download-manifest"), "click", downloadManifest);
    H.on($("#run-replay"), "click", function () { renderReplay(); H.toast("已按 50 票口径重新回放"); });
    H.on($("#run-checks"), "click", function () { runChecks(); H.toast("自检已重新运行"); });
  }

  bind();
  renderAll();
  renderReplay();
  runChecks();
})();