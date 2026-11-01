(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;
  const EVIDENCE_BASE = "https://github.com/Gupeat/clawhunt-agent-demos/tree/main/docs/shopping";

  const PRODUCTS = [
    {
      id: "kb-001",
      brand: "Aster & Co.",
      name: "清透防晒乳 SPF50+ PA++++",
      category: "sunscreen",
      categoryLabel: "防晒",
      price: 129,
      quality: 92,
      safetyRisk: "low",
      complianceRisk: "pass",
      confidence: 0.90,
      claims: ["无香精", "油皮友好", "成膜快"],
      summary: "轻薄的合成防晒样本，适合通勤场景；需要两小时左右补涂。",
      reasons: ["SPF/PA 标注完整", "无香精，降低刺激概率", "来源与更新时间可追溯"],
      cautions: ["敏感肌仍建议先做耳后试用", "户外暴晒需补涂并配合硬防晒"],
      updated: "2026-10-28",
      sources: ["kb-001 · 合成商品档案", "品牌公开成分表模板（演示占位）"]
    },
    {
      id: "kb-002",
      brand: "Verdant Lab",
      name: "舒缓修护精华（无香精）",
      category: "serum",
      categoryLabel: "精华",
      price: 199,
      quality: 89,
      safetyRisk: "low",
      complianceRisk: "pass",
      confidence: 0.87,
      claims: ["无香精", "泛醇", "神经酰胺"],
      summary: "偏修护路线的合成精华样本，适合屏障不稳定期的精简护肤。",
      reasons: ["无香精、成分表相对精简", "修护成分有明确标注", "适合先做小面积试用"],
      cautions: ["不能替代药物或皮肤科诊疗", "不要与高浓度酸类叠加"],
      updated: "2026-10-27",
      sources: ["kb-002 · 合成商品档案", "成分表模板（演示占位）"]
    },
    {
      id: "kb-003",
      brand: "NutriCore",
      name: "每日益生菌冲剂",
      category: "probiotic",
      categoryLabel: "益生菌",
      price: 159,
      quality: 74,
      safetyRisk: "medium",
      complianceRisk: "high",
      confidence: 0.71,
      claims: ["多菌株", "常温保存", "改善肠道"],
      summary: "合成益生菌样本；宣传页出现“改善肠道/增强免疫”等易越界表述，需按食品合规口径改写。",
      reasons: ["菌株编号有标注", "独立小袋，便于记录用量", "保质期与储存条件明确"],
      cautions: ["食品不得宣称治疗或替代药物", "免疫低下/孕期/儿童先咨询专业人士", "活菌数受储存条件影响"],
      updated: "2026-10-25",
      sources: ["kb-003 · 合成商品档案", "食品标签模板（演示占位）"]
    },
    {
      id: "kb-004",
      brand: "Lumen Home",
      name: "厨房清洁喷雾",
      category: "cleaning",
      categoryLabel: "清洁",
      price: 79,
      quality: 80,
      safetyRisk: "medium",
      complianceRisk: "pass",
      confidence: 0.82,
      claims: ["去油", "无磷", "柠檬香"],
      summary: "合成清洁剂样本；去油能力明确，但含表面活性剂，需注意通风与混用风险。",
      reasons: ["成分与使用说明完整", "无磷配方", "价格透明"],
      cautions: ["不要与含氯清洁剂混用", "远离儿童，使用时通风", "不适用于食品直接接触面"],
      updated: "2026-10-26",
      sources: ["kb-004 · 合成商品档案", "安全技术说明书模板（演示占位）"]
    },
    {
      id: "kb-005",
      brand: "Hearth & Grain",
      name: "秋季分享礼盒",
      category: "gift",
      categoryLabel: "礼盒",
      price: 239,
      quality: 86,
      safetyRisk: "low",
      complianceRisk: "pass",
      confidence: 0.84,
      claims: ["独立包装", "可追溯原料", "素食友好"],
      summary: "合成礼盒样本，适合作为通用分享礼；含坚果，需在购买前确认过敏原。",
      reasons: ["过敏原标注清晰", "独立包装便于分享", "来源与保质期可追溯"],
      cautions: ["含坚果，过敏人群慎选", "礼盒不等同于保健功效", "按收礼人饮食禁忌确认"],
      updated: "2026-10-24",
      sources: ["kb-005 · 合成商品档案", "过敏原标签模板（演示占位）"]
    }
  ];

  const EXAMPLES = [
    "油皮夏天通勤，防晒怎么选？",
    "敏感肌想找无香精精华",
    "给父母买益生菌，宣传靠谱吗？",
    "厨房清洁剂安全吗？",
    "300 元以内送同事的礼盒"
  ];

  let lastQuery = "";
  let lastResponse = null;

  function citationList(product) {
    return product.sources.map(function (label, index) {
      return { label: label, url: EVIDENCE_BASE + "#kb" };
    });
  }

  function riskClass(risk) {
    return risk === "high" ? "risk-high" : risk === "medium" ? "risk-medium" : "risk-low";
  }

  function riskLabel(risk) {
    return risk === "high" ? "高风险" : risk === "medium" ? "中风险" : "低风险";
  }

  function classify(query) {
    const q = query.toLowerCase();
    if (/防晒|spf|pa\+|通勤/.test(q)) return "sunscreen";
    if (/精华|敏感|泛红|屏障|修护/.test(q)) return "serum";
    if (/益生菌|肠道|免疫|父母|老人/.test(q)) return "probiotic";
    if (/清洁|厨房|去油|消毒/.test(q)) return "cleaning";
    if (/礼盒|礼物|送同事|送礼/.test(q)) return "gift";
    return "general";
  }

  function scoreProduct(product) {
    const safety = product.safetyRisk === "low" ? 15 : product.safetyRisk === "medium" ? 5 : -15;
    const compliance = product.complianceRisk === "pass" ? 12 : product.complianceRisk === "medium" ? 0 : -24;
    return Math.round(product.quality * 0.55 + safety + compliance + product.confidence * 10);
  }

  function selectProducts(intent) {
    let pool = PRODUCTS.filter(function (p) { return p.category === intent; });
    if (!pool.length) {
      pool = PRODUCTS.slice().sort(function (a, b) { return scoreProduct(b) - scoreProduct(a); }).slice(0, 3);
    }
    return pool.sort(function (a, b) { return scoreProduct(b) - scoreProduct(a); }).slice(0, 3);
  }

  function answerFor(intent) {
    return {
      sunscreen: "通勤防晒先看 SPF/PA、肤感和补涂成本。油皮可选无香精、成膜快、不厚重的合成样本；户外活动要补涂并配合遮阳。",
      serum: "敏感肌选精华先做精简和斑贴测试，优先无香精、成分表清晰、带修护成分的样本；不要同时叠加强酸或高浓度活性物。",
      probiotic: "挑益生菌先看菌株编号、活菌数、储存条件和保质期。食品不得宣称治疗或替代药物；有基础病、孕期或儿童使用前先问专业人士。",
      cleaning: "厨房清洁优先看成分、使用说明和混用禁忌。含氯产品不要与酸性清洁剂混用；使用时通风，远离儿童。",
      gift: "送礼先确认收礼人的饮食禁忌和场景。礼盒的价值在“合适”，不是把保健品当作功效承诺。",
      general: "先明确品类、预算和使用场景，再比较质量、安全、合规与来源。没有 citation 的结论不会进入推荐。"
    }[intent];
  }

  function buildResponse(query) {
    const intent = classify(query);
    const selected = selectProducts(intent);
    const citations = [];
    const riskFlags = [];
    selected.forEach(function (p) {
      p.sources.forEach(function (label) {
        citations.push({ label: label, url: EVIDENCE_BASE + "#kb" });
      });
      if (p.complianceRisk === "high") riskFlags.push(p.id + ": marketing claim requires rewrite");
      if (p.safetyRisk !== "low") riskFlags.push(p.id + ": safety caution required");
    });
    const avgConfidence = selected.length
      ? selected.reduce(function (sum, p) { return sum + p.confidence; }, 0) / selected.length
      : 0;
    return {
      trace_id: "TRC-" + H.hash(query + "|shopping").toString(16).slice(0, 10).toUpperCase(),
      query: query,
      locale: "zh-CN",
      intent: intent,
      answer: answerFor(intent),
      recommendation: selected.map(function (p) {
        return {
          product_id: p.id,
          brand: p.brand,
          name: p.name,
          category: p.categoryLabel,
          price_cny: p.price,
          quality_score: p.quality,
          quality_grade: p.quality >= 90 ? "A" : p.quality >= 80 ? "B" : "C",
          safety_risk: p.safetyRisk,
          compliance_risk: p.complianceRisk,
          confidence: p.confidence,
          reasons: p.reasons,
          cautions: p.cautions,
          citations: citationList(p),
          updated_at: p.updated
        };
      }),
      risk_flags: riskFlags,
      citations: citations,
      confidence: Number(avgConfidence.toFixed(2)),
      disclaimer: "合成知识库演示，不构成医疗建议；购买前请核对官方备案、成分表与检测来源。"
    };
  }

  function renderChat() {
    const host = $("#chatlog");
    host.innerHTML = "";
    pushBubble("agent", "你好，我是购物知识助手。可以问我“值不值得买、安不安全、宣传是否合规”。我只基于合成知识库回答，不替品牌做承诺。");
    if (lastResponse) {
      pushBubble("candidate", lastQuery);
      pushBubble("agent", lastResponse.answer + " 主要推荐 " + lastResponse.recommendation.map(function (r) { return r.brand + " " + r.name; }).join("、") + "。");
    }
    host.scrollTop = host.scrollHeight;
  }

  function pushBubble(role, text) {
    const host = $("#chatlog");
    const node = document.createElement("div");
    node.className = "msg " + role;
    node.textContent = text;
    host.appendChild(node);
  }

  function renderChips() {
    const host = $("#query-chips");
    host.innerHTML = EXAMPLES.map(function (q) {
      return '<button class="btn small" type="button" data-query="' + H.escape(q) + '">' + H.escape(q) + "</button>";
    }).join("");
  }

  function renderRecommendations() {
    const host = $("#recommendations");
    if (!lastResponse) { host.innerHTML = ""; return; }
    host.innerHTML = lastResponse.recommendation.map(function (r) {
      return '<article class="card tight">' +
        '<div class="row between"><span class="badge info">' + H.escape(r.brand) + '</span><span class="' + riskClass(r.safety_risk) + '">' + riskLabel(r.safety_risk) + "</span></div>" +
        '<h3 class="mt12">' + H.escape(r.name) + "</h3>" +
        '<p class="sub">' + H.escape(r.category) + ' · ' + H.escape(r.quality_grade) + " 级质量 · 置信度 " + Math.round(r.confidence * 100) + "%</p>" +
        '<div class="row mt8"><span class="tag on">¥' + r.price_cny + '</span><span class="tag">合规 ' + H.escape(r.compliance_risk) + '</span><span class="tag">' + H.escape(r.product_id) + "</span></div>" +
        '<div class="note mt12"><b>适合：</b>' + H.escape(r.reasons.join("；")) + "</div>" +
        '<p class="tiny mt8"><b>注意：</b>' + H.escape(r.cautions.join("；")) + "</p>" +
        '<p class="tiny mt8">来源 ' + r.citations.length + " 条 · 更新 " + H.escape(r.updated_at) + "</p>" +
        "</article>";
    }).join("");
    $("#recommendation-title").textContent = "推荐结论 · " + lastQuery;
    $("#recommendation-sub").textContent = "同一查询的结构化输出：质量 " + lastResponse.recommendation.map(function (r) { return r.quality_grade; }).join("/") + "，平均置信度 " + Math.round(lastResponse.confidence * 100) + "%。";
  }

  function renderApi() {
    if (!lastResponse) return;
    $("#api-json").textContent = JSON.stringify(lastResponse, null, 2);
    const riskCount = lastResponse.risk_flags.length;
    $("#api-meta").innerHTML = '<span class="badge info">' + H.escape(lastResponse.trace_id) + '</span>' +
      '<span class="badge ' + (riskCount ? "warn" : "good") + '">' + riskCount + " risk flags</span>" +
      '<span class="badge">confidence ' + lastResponse.confidence.toFixed(2) + "</span>";
  }

  function renderKb() {
    $("#kb-count").textContent = String(PRODUCTS.length);
    $("#kb-body").innerHTML = PRODUCTS.map(function (p) {
      return "<tr><td><b>" + H.escape(p.brand) + "</b><br><span class=\"tiny\">" + H.escape(p.name) + "</span></td>" +
        "<td>" + p.quality + " / " + (p.quality >= 90 ? "A" : p.quality >= 80 ? "B" : "C") + "</td>" +
        '<td class="' + riskClass(p.safetyRisk) + '">' + riskLabel(p.safetyRisk) + "</td>" +
        "<td>" + (p.complianceRisk === "pass" ? '<span class="badge good">PASS</span>' : '<span class="badge bad">需改写</span>') + "</td>" +
        "<td>" + Math.round(p.confidence * 100) + "%</td></tr>";
    }).join("");
  }

  function ask(query) {
    const text = String(query || "").trim();
    if (!text) { H.toast("先输入一个问题"); return; }
    if (stateGuard(text)) return;
    lastQuery = text;
    lastResponse = buildResponse(text);
    renderChat();
    renderRecommendations();
    renderApi();
  }

  function stateGuard(text) {
    return text.length > 180;
  }

  function renderScan(result) {
    const host = $("#scan-result");
    const score = $("#scan-score");
    score.textContent = result.severity === "high" ? "高风险 · " + result.score + "/100" : result.severity === "medium" ? "中风险 · " + result.score + "/100" : "低风险 · " + result.score + "/100";
    score.className = "badge " + (result.severity === "high" ? "bad" : result.severity === "medium" ? "warn" : "good");
    host.innerHTML = result.findings.length ? result.findings.map(function (f) {
      return '<div class="note ' + (f.severity === "high" ? "bad" : f.severity === "medium" ? "warn" : "") + '"><b>' + H.escape(f.label) + "（" + f.severity + "）</b>：命中「" + H.escape(f.matches.join("、")) + "」<br><span class=\"small\">" + H.escape(f.advice) + "</span></div>";
    }).join("") + '<div class="note mt12"><b>合规改写示例：</b>' + H.escape(result.rewrite) + "</div>" : '<div class="note">未命中规则；仍需法务/平台审核与证据核验。</div>';
  }

  function scanCopy(text) {
    const rules = [
      { id: "absolute", label: "绝对化用语", severity: "high", re: /(全网第一|第一品牌|最好|最强|顶级|100%|绝对|永久|唯一|史上|零风险|无副作用)/g, advice: "删除绝对化/排他性表述，改为可验证、可限定的描述，例如“本批次送检结果见报告”。" },
      { id: "medical", label: "医疗/功效断言", severity: "high", re: /(根治|治疗|治愈|消炎|抗癌|降血糖|替代药物|医学修复|药效|不反复)/g, advice: "化妆品/食品不得宣称医疗作用；删除治疗、根治、替代药物等表述，必要时改为“使用感受因人而异”。" },
      { id: "evidence", label: "证据表述", severity: "medium", re: /(临床验证|临床证明|权威认证|专利|99%|检测报告)/g, advice: "保留可核验的报告编号、机构、样本量和适用范围；无法提供原始证据时删除具体数字与认证暗示。" },
      { id: "urgency", label: "时限/稀缺承诺", severity: "low", re: /(仅限今天|最后一天|马上恢复|立即见效|7 天|三天)/g, advice: "保留真实活动期限并标注规则；不要用无法兑现的倒计时或效果时间承诺。" }
    ];
    const findings = [];
    let score = 100;
    rules.forEach(function (rule) {
      const matches = Array.from(new Set(String(text).match(rule.re) || []));
      if (!matches.length) return;
      findings.push({ label: rule.label, severity: rule.severity, matches: matches, advice: rule.advice });
      score -= rule.severity === "high" ? 24 : rule.severity === "medium" ? 12 : 5;
    });
    score = Math.max(0, score);
    const severity = findings.some(function (f) { return f.severity === "high"; }) ? "high" : findings.length ? "medium" : "low";
    const rewrite = "示例改写：本产品含【已标注成分】，适合【明确人群】日常使用；实际感受因人而异。检测/认证信息请以【报告编号、机构、样本量】为准，活动规则见详情页。";
    return { score: score, severity: severity, findings: findings, rewrite: rewrite };
  }

  function buildChecks() {
    const ids = new Set(PRODUCTS.map(function (p) { return p.id; }));
    const traceable = PRODUCTS.every(function (p) { return p.sources.length > 0 && p.updated && citationList(p).every(function (c) { return c.url; }); });
    const badScan = scanCopy("全网第一，7 天根治，临床验证 99% 有效");
    const q = "油皮夏天通勤，防晒怎么选？";
    const deterministic = JSON.stringify(buildResponse(q)) === JSON.stringify(buildResponse(q));
    const response = buildResponse(q);
    const contract = ["trace_id", "query", "answer", "recommendation", "citations", "confidence", "disclaimer"].every(function (field) { return field in response; });
    const piiFree = !/\+?\d{8,}|@[A-Za-z]|身份证|手机号/.test(JSON.stringify(PRODUCTS));
    const disclaimer = response.disclaimer.indexOf("不构成医疗建议") !== -1;
    return [
      H.check("知识库条目 ID 唯一", ids.size === PRODUCTS.length, ids.size + "/" + PRODUCTS.length),
      H.check("每条推荐都有来源、更新时间和 URL", traceable, "citation 全量"),
      H.check("高风险宣称必须被规则引擎拦截", badScan.findings.length >= 2 && badScan.severity === "high", badScan.findings.length + " 类命中"),
      H.check("同一查询输出确定", deterministic, "两次序列化一致"),
      H.check("B 端契约字段完整", contract, "7/7 字段"),
      H.check("合成 fixture 不含手机号/邮箱等 PII", piiFree, "fixture scan"),
      H.check("医疗免责声明始终随答案返回", disclaimer, "disclaimer present")
    ];
  }

  function runChecks() {
    const checks = buildChecks();
    H.renderChecks("#check-list", checks);
    $("#check-count").textContent = String(checks.length);
    H.toast(checks.filter(function (c) { return c.pass; }).length + "/" + checks.length + " 项通过");
  }

  function init() {
    renderKb();
    renderChips();
    renderChat();
    scanCopy($("#copy-input").value); // keep result visible before first scan? no: call below after render
    lastQuery = "油皮夏天通勤，防晒怎么选？";
    lastResponse = buildResponse(lastQuery);
    renderChat();
    renderRecommendations();
    renderApi();
    renderScan(scanCopy($("#copy-input").value));
    runChecks();

    $("#query-form").addEventListener("submit", function (event) {
      event.preventDefault();
      ask($("#query-input").value);
    });
    $("#query-chips").addEventListener("click", function (event) {
      const btn = event.target.closest("[data-query]");
      if (!btn) return;
      $("#query-input").value = btn.getAttribute("data-query");
      ask(btn.getAttribute("data-query"));
    });
    $("#scan-copy").addEventListener("click", function () { renderScan(scanCopy($("#copy-input").value)); H.toast("文案扫描完成"); });
    $("#reset-copy").addEventListener("click", function () {
      $("#copy-input").value = "全网第一的敏感肌修护精华，7 天根治泛红，临床验证 99% 有效，权威认证，永久不反复。原价 999，仅限今天。";
      renderScan(scanCopy($("#copy-input").value));
    });
    $("#run-checks").addEventListener("click", runChecks);
    $("#copy-json").addEventListener("click", function () {
      const text = $("#api-json").textContent;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { H.toast("JSON 已复制"); }, function () { H.toast("复制失败，请手动选择"); });
      } else {
        H.toast("当前浏览器不支持自动复制");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
