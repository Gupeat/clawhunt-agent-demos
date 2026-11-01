(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;
  const $$ = H.$$;

  const CRAFT_LABELS = { jewelry: "珠宝 · 花丝镶嵌", wood: "红木 · 榫卯雕刻" };
  const STYLE_LABELS = { oriental: "东方雅致", modern: "现代几何", festive: "节庆礼赠" };
  const PALETTES = {
    oriental: { bg: "#f4ece1", main: "#b0793d", accent: "#0d6b63", ink: "#2d2118", soft: "#e5d2b9" },
    modern: { bg: "#eef4f5", main: "#336c78", accent: "#c17a3f", ink: "#122b35", soft: "#c9dde0" },
    festive: { bg: "#fbefea", main: "#a83b35", accent: "#b8882d", ink: "#3a1714", soft: "#efd3c4" }
  };

  const FORMS = {
    jewelry: [
      { key: "wall", label: "最小壁厚", unit: "mm", min: 0.2, max: 4, step: 0.1, value: 1.2 },
      { key: "gap", label: "镶嵌间隙", unit: "mm", min: 0, max: 2, step: 0.05, value: 0.3 },
      { key: "finish", label: "表面粗糙度 Ra", unit: "μm", min: 0.1, max: 5, step: 0.1, value: 0.8 },
      { key: "porosity", label: "允许孔隙等级", unit: "级", min: 0, max: 5, step: 1, value: 1 }
    ],
    wood: [
      { key: "moisture", label: "木材含水率", unit: "%", min: 4, max: 20, step: 0.5, value: 8 },
      { key: "joint", label: "榫卯配合间隙", unit: "mm", min: 0, max: 2, step: 0.05, value: 0.2 },
      { key: "carve", label: "雕刻深度", unit: "mm", min: 0.5, max: 12, step: 0.5, value: 2.5 },
      { key: "coats", label: "面漆遍数", unit: "遍", min: 1, max: 8, step: 1, value: 3 }
    ]
  };

  const RULES = {
    jewelry: [
      { id: "wall", field: "wall", label: "最小壁厚", op: ">=", pass: 1.0, warn: 0.8, unit: "mm", advice: "壁厚低于 1.0mm 时铸造易缺料；加厚或改分件结构。" },
      { id: "gap", field: "gap", label: "镶嵌间隙", op: "<=", pass: 0.4, warn: 0.6, unit: "mm", advice: "间隙超过 0.4mm 易藏污、松动；收紧镶口或加垫片。" },
      { id: "finish", field: "finish", label: "表面粗糙度", op: "<=", pass: 1.6, warn: 2.4, unit: "μm", advice: "Ra 超标时需增加抛光工序或调整铸造参数。" },
      { id: "porosity", field: "porosity", label: "允许孔隙等级", op: "<=", pass: 2, warn: 3, unit: "级", advice: "孔隙等级偏高，建议改浇口/温度曲线并做抽检切片。" }
    ],
    wood: [
      { id: "moisture", field: "moisture", label: "木材含水率", op: "between", passMin: 6, passMax: 12, warnMin: 5, warnMax: 14, unit: "%", advice: "含水率偏离 6–12% 易开裂/变形；先平衡窑干再开料。" },
      { id: "joint", field: "joint", label: "榫卯配合间隙", op: "<=", pass: 0.3, warn: 0.5, unit: "mm", advice: "配合过松影响结构；过紧会劈裂，建议留 0.2–0.3mm。" },
      { id: "carve", field: "carve", label: "雕刻深度", op: "<=", pass: 4, warn: 6, unit: "mm", advice: "深雕需降低进给并增加支撑，避免崩边。" },
      { id: "coats", field: "coats", label: "面漆遍数", op: ">=", pass: 3, warn: 2, unit: "遍", advice: "少于 3 遍时耐磨和防潮不足；补涂并延长固化。" }
    ]
  };

  const STAGES = [
    { key: "presale", label: "预售与需求确认" },
    { key: "process", label: "工艺单" },
    { key: "dispatch", label: "工厂派单" },
    { key: "qc", label: "质检" },
    { key: "shipping", label: "发货" },
    { key: "settled", label: "结算" }
  ];

  const MODULES = [
    { id: "kb", label: "知识库" },
    { id: "agent", label: "智能体" },
    { id: "workflow", label: "流程" },
    { id: "showcase", label: "展示" },
    { id: "crm", label: "经营分析" },
    { id: "global", label: "出海内容" }
  ];

  const INDUSTRIES = [
    { id: "jewelry", name: "珠宝首饰", note: "花丝/镶嵌/定制", fde: "概念到打样的工艺单闭环" },
    { id: "wood", name: "红木家居", note: "榫卯/雕刻/整木", fde: "木材稳定性与交期协同" },
    { id: "ceramic", name: "陶瓷器物", note: "器型/釉色/小批量", fde: "器型库与窑变内容资产" },
    { id: "tea", name: "茶叶农特", note: "产区/等级/溯源", fde: "产区知识库与渠道问答" },
    { id: "tourism", name: "文旅非遗", note: "路线/体验/授权", fde: "线路智能体与授权内容" },
    { id: "food", name: "地方食品", note: "配方/标签/渠道", fde: "标签合规与经销问答" }
  ];

  const CHARACTERS = [
    { name: "远视", role: "观察者", note: "记录细节，不替消费者下结论。" },
    { name: "远听", role: "倾听者", note: "收集反馈，不冒充传统/宗教形象。" }
  ];
  const IP_NOTICE = "原创演示形象；不主张任何传统纹样、宗教符号或既有 IP 的排他权；对外授权前完成近似检索和法务复核。";
  const IP_STAGES = ["剧本", "分镜", "角色资产", "视频", "配音", "字幕", "审核"];

  const state = {
    concept: { craft: "jewelry", style: "oriental", locked: false, generated: true },
    c2m: { stage: 0, amount: 12800, events: [] },
    service: "jewelry",
    ip: { stage: 0 },
    mfg: { craft: "jewelry" }
  };

  function defaultsFor(craft) {
    const values = {};
    FORMS[craft].forEach(function (field) { values[field.key] = field.value; });
    return values;
  }

  function readValues(craft) {
    const values = {};
    FORMS[craft].forEach(function (field) {
      const input = document.querySelector('[data-field="' + field.key + '"]');
      values[field.key] = input ? Number(input.value) : field.value;
    });
    return values;
  }

  function statusFor(rule, value) {
    if (rule.op === "between") {
      if (value >= rule.passMin && value <= rule.passMax) return "pass";
      if (value >= rule.warnMin && value <= rule.warnMax) return "warn";
      return "fail";
    }
    if (rule.op === ">=") {
      if (value >= rule.pass) return "pass";
      if (value >= rule.warn) return "warn";
      return "fail";
    }
    if (rule.op === "<=") {
      if (value <= rule.pass) return "pass";
      if (value <= rule.warn) return "warn";
      return "fail";
    }
    return "fail";
  }

  function ruleText(rule) {
    if (rule.op === "between") return "建议 " + rule.passMin + "–" + rule.passMax + rule.unit;
    return (rule.op === ">=" ? "≥ " : "≤ ") + rule.pass + " " + rule.unit;
  }

  function evaluateRules(craft, values) {
    return RULES[craft].map(function (rule) {
      const value = Number(values[rule.field]);
      return { rule: rule, value: value, status: statusFor(rule, value) };
    });
  }

  function splitCommission(amount) {
    const safe = Number.isFinite(amount) && amount > 0 ? amount : 0;
    const designer = Math.round(safe * 0.12 * 100) / 100;
    const platform = Math.round(safe * 0.08 * 100) / 100;
    const maker = Math.round((safe - designer - platform) * 100) / 100;
    return { designer: designer, platform: platform, maker: maker, total: Math.round((designer + platform + maker) * 100) / 100 };
  }

  function money(amount) {
    return "¥" + Number(amount).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function nextStageIndex(index) {
    return Math.min(index + 1, STAGES.length - 1);
  }

  function conceptSvg(craft, style) {
    const p = PALETTES[style];
    const seed = H.hash(craft + "|" + style);
    const petals = [];
    const count = 8 + (seed % 4);
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count;
      const x = 320 + Math.cos(angle) * 54;
      const y = 184 + Math.sin(angle) * 54;
      petals.push('<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="15" fill="' + (i % 2 ? p.accent : p.main) + '" opacity=".82"/>');
    }
    const jewel = '<svg viewBox="0 0 640 360" role="img" aria-label="合成珠宝概念稿">' +
      '<defs><linearGradient id="jg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + p.bg + '"/><stop offset="1" stop-color="' + p.soft + '"/></linearGradient></defs>' +
      '<rect width="640" height="360" rx="16" fill="url(#jg)"/>' +
      '<path d="M70 76 Q320 18 570 76" fill="none" stroke="' + p.ink + '" stroke-width="2" stroke-dasharray="2 7" opacity=".55"/>' +
      '<circle cx="320" cy="184" r="122" fill="none" stroke="' + p.main + '" stroke-width="1.5" opacity=".55"/>' +
      '<circle cx="320" cy="184" r="102" fill="none" stroke="' + p.accent + '" stroke-width="1" opacity=".5"/>' +
      petals.join("") +
      '<circle cx="320" cy="184" r="48" fill="' + p.bg + '" stroke="' + p.main + '" stroke-width="2"/>' +
      '<path d="M320 146 l18 38 -18 38 -18 -38 Z" fill="' + p.accent + '" opacity=".9"/>' +
      '<circle cx="320" cy="184" r="8" fill="' + p.main + '"/>' +
      '<path d="M320 290 v 26 M306 304 l14 18 14 -18" fill="none" stroke="' + p.main + '" stroke-width="2"/>' +
      '<text x="44" y="322" fill="' + p.ink + '" font-family="Segoe UI, sans-serif" font-size="12" opacity=".6">SYNTHETIC CONCEPT · NOT A PRODUCTION DRAWING</text>' +
      '</svg>';
    const lines = [];
    for (let i = 0; i < 6; i += 1) {
      lines.push('<line x1="' + (110 + i * 84) + '" y1="112" x2="' + (110 + i * 84) + '" y2="264" stroke="' + p.main + '" stroke-width="2" opacity=".72"/>');
      lines.push('<line x1="86" y1="' + (130 + i * 30) + '" x2="554" y2="' + (130 + i * 30) + '" stroke="' + p.accent + '" stroke-width="2" opacity=".5"/>');
    }
    const wood = '<svg viewBox="0 0 640 360" role="img" aria-label="合成红木概念稿">' +
      '<rect width="640" height="360" rx="16" fill="' + p.bg + '"/>' +
      '<rect x="62" y="68" width="516" height="224" rx="8" fill="none" stroke="' + p.ink + '" stroke-width="4" opacity=".8"/>' +
      '<rect x="82" y="88" width="476" height="184" rx="4" fill="none" stroke="' + p.main + '" stroke-width="2"/>' +
      lines.join("") +
      '<circle cx="320" cy="180" r="54" fill="' + p.bg + '" stroke="' + p.main + '" stroke-width="2"/>' +
      '<circle cx="320" cy="180" r="34" fill="none" stroke="' + p.accent + '" stroke-width="2" stroke-dasharray="4 5"/>' +
      '<path d="M276 180 Q320 124 364 180 Q320 236 276 180" fill="none" stroke="' + p.ink + '" stroke-width="2"/>' +
      '<text x="82" y="318" fill="' + p.ink + '" font-family="Segoe UI, sans-serif" font-size="12" opacity=".6">SYNTHETIC CONCEPT · JOINERY / CARVING STUDY</text>' +
      '</svg>';
    return craft === "jewelry" ? jewel : wood;
  }

  function renderConcept() {
    const craft = state.concept.craft;
    const style = state.concept.style;
    $("#concept-preview").innerHTML = conceptSvg(craft, style);
    $("#concept-caption").textContent = CRAFT_LABELS[craft] + " · " + STYLE_LABELS[style] + " · 合成概念稿（非生产图纸）";
    $("#concept-tag").textContent = state.concept.locked ? "LOCKED" : "SYNTHETIC · AI FIRST-PASS";
    $("#concept-tag").className = "badge " + (state.concept.locked ? "good" : "");
  }

  function licenseValid(value) {
    return !!(value && value.source && value.source !== "missing" && value.id && value.id.trim().length >= 4 && value.territory && value.territory !== "missing" && value.derivative && value.derivative !== "missing");
  }

  function readLicense() {
    return {
      source: $("#license-source").value,
      id: $("#license-id").value,
      territory: $("#license-territory").value,
      derivative: $("#license-derivative").value
    };
  }

  function checkLicense() {
    const valid = licenseValid(readLicense());
    const badge = $("#license-status");
    badge.textContent = valid ? "授权字段完整" : "缺必填项";
    badge.className = "badge " + (valid ? "good" : "warn");
    $("#lock-concept").disabled = !valid || state.concept.locked;
    return valid;
  }

  function generateConcept() {
    state.concept.craft = $("#craft-select").value;
    state.concept.style = $("#style-select").value;
    state.concept.locked = false;
    state.concept.generated = true;
    $("#lock-concept").textContent = "锁定概念";
    renderConcept();
    checkLicense();
    H.toast("已生成合成概念稿；请校验授权字段");
  }

  function lockConcept() {
    if (!checkLicense()) { H.toast("授权字段不完整，不能锁定"); return; }
    state.concept.locked = true;
    $("#lock-concept").disabled = true;
    $("#lock-concept").textContent = "已锁定";
    renderConcept();
    H.toast("概念已锁定，可进入工艺单");
  }

  function renderMfgForm() {
    const craft = state.mfg.craft;
    $("#mfg-form").innerHTML = FORMS[craft].map(function (field) {
      return '<label class="field"><span>' + H.escape(field.label) + "（" + field.unit + "）</span><input type=\"number\" data-field=\"" + field.key + "\" min=\"" + field.min + "\" max=\"" + field.max + "\" step=\"" + field.step + "\" value=\"" + field.value + "\"></label>";
    }).join("");
    $("#rule-json").textContent = JSON.stringify({ version: "2026.11", craft: CRAFT_LABELS[craft], rules: RULES[craft] }, null, 2);
  }

  function renderAssessment() {
    const craft = state.mfg.craft;
    const values = readValues(craft);
    const results = evaluateRules(craft, values);
    const worst = results.some(function (r) { return r.status === "fail"; }) ? "fail" : results.some(function (r) { return r.status === "warn"; }) ? "warn" : "pass";
    const summary = $("#mfg-summary");
    summary.textContent = worst === "fail" ? "不可直接投产" : worst === "warn" ? "有条件通过" : "可进入打样";
    summary.className = "badge " + (worst === "pass" ? "good" : worst === "warn" ? "warn" : "bad");
    $("#mfg-meta").textContent = CRAFT_LABELS[craft] + " · 规则 v2026.11";
    $("#mfg-rows").innerHTML = results.map(function (r) {
      const cls = r.status === "pass" ? "good" : r.status === "warn" ? "warn" : "bad";
      const badge = r.status === "pass" ? "PASS" : r.status === "warn" ? "WARN" : "FAIL";
      return "<tr><td><b>" + H.escape(r.rule.label) + "</b><br><span class=\"tiny\">" + H.escape(ruleText(r.rule)) + "</span></td><td>" + H.escape(String(r.value)) + " " + r.rule.unit + "</td><td><span class=\"badge " + cls + "\">" + badge + "</span></td><td class=\"tiny\">" + H.escape(r.status === "pass" ? "满足当前阈值" : r.rule.advice) + "</td></tr>";
    }).join("");
    const issues = results.filter(function (r) { return r.status !== "pass"; });
    $("#mfg-advice").innerHTML = issues.length
      ? '<div class="note ' + (worst === "fail" ? "bad" : "warn") + '"><b>先改这几项：</b>' + issues.map(function (r) { return H.escape(r.rule.label) + "：" + H.escape(r.rule.advice); }).join("<br>") + "</div>"
      : '<div class="note"><b>初判通过：</b>所有阈值满足；仍需工艺师复核结构强度、批量一致性和打样结果。</div>';
  }

  function setMfgCraft(craft) {
    state.mfg.craft = craft;
    renderMfgForm();
    renderAssessment();
  }

  function c2mStatus() {
    return STAGES[state.c2m.stage].label;
  }

  function renderC2M() {
    const stage = state.c2m.stage;
    $("#c2m-stages").innerHTML = STAGES.map(function (s, index) {
      const cls = index < stage ? "done" : index === stage ? "current" : "";
      return '<div class="step ' + cls + '">' + (index + 1) + ". " + H.escape(s.label) + "</div>";
    }).join("");
    const badge = $("#c2m-status");
    badge.textContent = c2mStatus();
    badge.className = "badge " + (stage >= STAGES.length - 1 ? "good" : "info");
    $("#c2m-hint").textContent = "当前阶段：" + c2mStatus();
    $("#c2m-advance").disabled = stage >= STAGES.length - 1;
    const split = splitCommission(state.c2m.amount);
    $("#c2m-ledger").innerHTML = [
      ["设计师", "12%", split.designer],
      ["平台", "8%", split.platform],
      ["工坊", "80% · 尾差校正", split.maker]
    ].map(function (row) {
      return '<div class="ledger-row"><span>' + row[0] + " <span class=\"muted\">" + row[1] + "</span></span><b>" + money(row[2]) + "</b></div>";
    }).join("") + '<div class="ledger-row"><span><b>合计</b></span><b>' + money(split.total) + "</b></div>";
    $("#c2m-events").innerHTML = state.c2m.events.length
      ? state.c2m.events.slice(0, 4).map(function (event) { return '<div class="checkrow pass"><span class="dot">✓</span><span>' + H.escape(event) + "</span><span class=\"detail\">ledger</span></div>"; }).join("")
      : '<p class="tiny">推进阶段后会记录事件；每步都可回放到当前状态。</p>';
  }

  function advanceC2M() {
    if (state.c2m.stage >= STAGES.length - 1) return;
    state.c2m.stage = nextStageIndex(state.c2m.stage);
    state.c2m.events.unshift("进入阶段 " + (state.c2m.stage + 1) + " · " + c2mStatus());
    renderC2M();
    H.toast("已进入：" + c2mStatus());
  }

  function resetC2M() {
    state.c2m.stage = 0;
    state.c2m.amount = 12800;
    state.c2m.events = [];
    $("#c2m-amount").value = "12800";
    renderC2M();
    H.toast("订单已重置");
  }

  function renderService() {
    $("#service-grid").innerHTML = INDUSTRIES.map(function (ind) {
      const selected = state.service === ind.id;
      return '<button type="button" class="card tight" data-industry="' + ind.id + '" style="text-align:left;font:inherit;cursor:pointer;' + (selected ? "border-color:var(--accent);box-shadow:0 0 0 2px rgba(8,127,140,.13)" : "") + '">' +
        '<div class="row between"><span class="badge ' + (selected ? "good" : "") + '">' + H.escape(ind.name) + "</span><span class=\"tiny\">" + H.escape(ind.note) + "</span></div>" +
        '<p class="sub mt8">' + H.escape(ind.fde) + "</p>" +
        '<div class="row mt8">' + MODULES.slice(0, 4).map(function (m) { return '<span class="tag">' + H.escape(m.label) + "</span>"; }).join("") + "</div>" +
        "</button>";
    }).join("");
    const ind = INDUSTRIES.find(function (i) { return i.id === state.service; }) || INDUSTRIES[0];
    $("#service-json").textContent = JSON.stringify({
      industry: ind.id,
      industry_name: ind.name,
      config_version: "2026.11",
      enabled_components: MODULES.map(function (m) { return { id: m.id, label: m.label, status: "configured" }; }),
      fde_playbook: ["discovery", "data_and_api_inventory", "component_config", "acceptance_script"],
      data_boundary: "dedicated_namespace; no_cross_industry_retrieval",
      acceptance: ["business_action", "failure_path", "rollback"]
    }, null, 2);
  }

  function renderIp() {
    $("#ip-pipeline").innerHTML = IP_STAGES.map(function (label, index) {
      const cls = index < state.ip.stage ? "done" : index === state.ip.stage ? "current" : "";
      return '<div class="step ' + cls + '">' + H.escape(label) + "</div>";
    }).join("");
    $("#ip-status").textContent = IP_STAGES[state.ip.stage];
    $("#ip-status").className = "badge " + (state.ip.stage === IP_STAGES.length - 1 ? "good" : "info");
    $("#ip-advance").disabled = state.ip.stage >= IP_STAGES.length - 1;
  }

  function advanceIp() {
    if (state.ip.stage >= IP_STAGES.length - 1) return;
    state.ip.stage += 1;
    renderIp();
    H.toast("内容管线：" + IP_STAGES[state.ip.stage]);
  }

  function buildChecks() {
    const valid = licenseValid({ source: "self-made", id: "LIC-DEMO-2026-001", territory: "cn", derivative: "yes" });
    const invalid = licenseValid({ source: "missing", id: "", territory: "missing", derivative: "missing" });
    const rulesComplete = ["jewelry", "wood"].every(function (craft) {
      return RULES[craft].length === 4 && RULES[craft].every(function (r) { return r.id && r.field && r.op && r.advice; });
    });
    const mfgValues = defaultsFor("jewelry");
    const deterministic = JSON.stringify(evaluateRules("jewelry", mfgValues)) === JSON.stringify(evaluateRules("jewelry", mfgValues));
    const thin = evaluateRules("jewelry", Object.assign({}, mfgValues, { wall: 0.6 }));
    const thinFails = thin.some(function (r) { return r.rule.id === "wall" && r.status === "fail"; });
    const split = splitCommission(12800);
    const splitSums = Math.abs(split.designer + split.platform + split.maker - 12800) < 0.005 && split.maker > 0;
    const monotonic = nextStageIndex(0) === 1 && nextStageIndex(5) === 5;
    const industryConfigs = INDUSTRIES.length === 6 && INDUSTRIES.every(function (ind) { return ind.id && ind.name && ind.fde; }) && MODULES.length === 6;
    const ipOriginal = CHARACTERS.length === 2 && IP_NOTICE.indexOf("原创") !== -1 && IP_NOTICE.indexOf("不主张") !== -1;
    return [
      H.check("授权字段缺一不可", valid && !invalid, "source/id/territory/derivative"),
      H.check("工艺规则配置完整", rulesComplete, "2 条工艺线 × 4 条规则"),
      H.check("同一输入判定确定", deterministic, "两次序列化一致"),
      H.check("薄壁件会被判 FAIL", thinFails, "壁厚 0.6mm < 0.8mm"),
      H.check("C2M 分成三项合计等于成交额", splitSums, money(split.total)),
      H.check("订单阶段只前进不回退", monotonic, "0→1，末阶段封顶"),
      H.check("六行业配置各有六组件", industryConfigs, INDUSTRIES.length + " × " + MODULES.length),
      H.check("双角色为原创且不主张排他", ipOriginal, "远视 / 远听")
    ];
  }

  function runChecks() {
    const checks = buildChecks();
    H.renderChecks("#check-list", checks);
    $("#check-count").textContent = String(checks.length);
    H.toast(checks.filter(function (c) { return c.pass; }).length + "/" + checks.length + " 项通过");
  }

  function activatePane(id) {
    $$(".tab").forEach(function (tab) {
      const active = tab.getAttribute("data-pane") === id;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    $$(".tabpane").forEach(function (pane) {
      pane.classList.toggle("active", pane.id === id);
    });
  }

  function init() {
    renderConcept();
    renderMfgForm();
    renderAssessment();
    renderC2M();
    renderService();
    renderIp();
    runChecks();

    $$(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () { activatePane(tab.getAttribute("data-pane")); });
    });

    $("#generate-concept").addEventListener("click", generateConcept);
    $("#validate-license").addEventListener("click", function () { checkLicense(); });
    $("#lock-concept").addEventListener("click", lockConcept);
    ["license-source", "license-id", "license-territory", "license-derivative"].forEach(function (id) {
      $("#" + id).addEventListener("input", function () {
        state.concept.locked = false;
        $("#lock-concept").textContent = "锁定概念";
        checkLicense();
        renderConcept();
      });
      $("#" + id).addEventListener("change", function () {
        state.concept.locked = false;
        $("#lock-concept").textContent = "锁定概念";
        checkLicense();
        renderConcept();
      });
    });

    $("#mfg-craft").addEventListener("change", function (event) { setMfgCraft(event.target.value); });
    $("#run-mfg").addEventListener("click", renderAssessment);
    $("#mfg-form").addEventListener("input", renderAssessment);

    $("#c2m-advance").addEventListener("click", advanceC2M);
    $("#c2m-reset").addEventListener("click", resetC2M);
    $("#c2m-amount").addEventListener("input", function (event) {
      const value = Number(event.target.value);
      state.c2m.amount = Number.isFinite(value) && value > 0 ? value : 0;
      renderC2M();
    });

    $("#service-grid").addEventListener("click", function (event) {
      const card = event.target.closest("[data-industry]");
      if (!card) return;
      state.service = card.getAttribute("data-industry");
      renderService();
      H.toast("已切换行业配置：" + state.service);
    });

    $("#ip-advance").addEventListener("click", advanceIp);
    $("#run-checks").addEventListener("click", runChecks);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
