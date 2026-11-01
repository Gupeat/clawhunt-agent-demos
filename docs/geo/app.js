(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;
  const $$ = H.$$;

  const BRANDS = [
    { id: "northstar", name: "Northstar Cloud", category: "企业级云与数据平台", aliases: ["Northstar Cloud", "Northstar"] },
    { id: "aster", name: "Aster Home", category: "家用空气净化与净水", aliases: ["Aster Home", "Aster"] },
    { id: "lumawear", name: "LumaWear", category: "轻户外服饰", aliases: ["LumaWear", "Luma"] }
  ];

  const PLATFORMS = [
    { id: "doubao", name: "豆包", model: "Doubao 1.5 Pro" },
    { id: "deepseek", name: "DeepSeek", model: "DeepSeek V3.2" },
    { id: "yuanbao", name: "腾讯元宝", model: "Hunyuan Turbo" },
    { id: "kimi", name: "Kimi", model: "Kimi K2" },
    { id: "qwen", name: "通义千问", model: "Qwen3-Max" },
    { id: "wenxin", name: "文心一言", model: "ERNIE 4.5" }
  ];

  const PROMPTS = [
    { id: "p1", text: "2026 年企业级 AI 知识库平台怎么选？", type: "品类" },
    { id: "p2", text: "Northstar Cloud 的数据治理能力怎么样？", type: "品牌" },
    { id: "p3", text: "制造业出海企业如何搭建多语言客户支持？", type: "场景" }
  ];

  let lastResults = [];
  let lastVariance = null;
  let lastContent = null;
  let evidenceIndex = 0;

  function escape(value) { return H.escape(value); }

  function selectedBrand() {
    return BRANDS.find(function (b) { return b.id === $("#brand").value; }) || BRANDS[0];
  }

  function selectedPrompt() {
    return PROMPTS.find(function (p) { return p.id === $("#prompt").value; }) || PROMPTS[0];
  }

  function checkedPlatforms() {
    return PLATFORMS.filter(function (p) {
      const el = document.getElementById("platform-" + p.id);
      return el && el.checked;
    });
  }

  function makeResult(platform, prompt, brand, rep) {
    const seed = platform.id + "|" + prompt.text + "|" + brand.id;
    const base = H.rng(seed);
    const mentioned = base() > 0.18;
    const position = mentioned ? 1 + Math.floor(base() * 5) : null;
    const sentimentRoll = base();
    const sentiment = mentioned
      ? (sentimentRoll > 0.30 ? "positive" : sentimentRoll > 0.12 ? "neutral" : "negative")
      : "n/a";
    const cited = mentioned && base() > 0.28;
    const evidenceId = "GEO-" + H.hash(seed + "|" + rep).toString(16).slice(0, 8).toUpperCase();
    const quote = mentioned
      ? "针对「" + prompt.text + "」，回答把 " + brand.name + " 放在第 " + position + " 个推荐位置，提到其" + brand.category + "能力；该句为合成演示证据，用于验证抽取字段。"
      : "针对「" + prompt.text + "」，回答给出了通用选型框架，但本轮合成样本没有出现目标品牌名；不得据此推导真实平台表现。";
    const shot = H.hash(seed + "|" + rep + "|shot").toString(16).padStart(16, "0");
    return {
      id: evidenceId,
      platform: platform.name,
      model: platform.model,
      prompt: prompt.text,
      brand: brand.name,
      mentioned: mentioned,
      position: position,
      sentiment: sentiment,
      cited: cited,
      quote: quote,
      source_url: cited ? "https://example.com/synthetic-evidence/" + evidenceId.toLowerCase() : "",
      collected_at: "2026-11-01T07:" + String(12 + (rep % 40)).padStart(2, "0") + ":00Z",
      screenshot_sha256: "sha256:" + shot + shot.slice(0, 8),
      account_fingerprint: "acct-" + H.hash(seed + "|acct").toString(16).slice(0, 8),
      raw_response_id: "raw-" + H.hash(seed + "|raw").toString(16).slice(0, 10),
      confidence: 0.90 + (H.hash(seed + "|conf") % 9) / 100
    };
  }

  function computeVarianceFor(platforms, brand, prompt) {
    const rates = [];
    for (let rep = 0; rep < 5; rep += 1) {
      const rows = platforms.map(function (p) { return makeResult(p, prompt, brand, rep); });
      const hit = rows.filter(function (r) { return r.mentioned; }).length;
      rates.push(platforms.length ? (hit / platforms.length) * 100 : 0);
    }
    const mean = rates.reduce(function (a, b) { return a + b; }, 0) / rates.length;
    const variance = rates.reduce(function (a, b) { return a + Math.pow(b - mean, 2); }, 0) / rates.length;
    return { rates: rates, mean: mean, variance: variance, stddev: Math.sqrt(variance) };
  }

  function renderSelects() {
    const brandSel = $("#brand");
    brandSel.innerHTML = "";
    BRANDS.forEach(function (b) {
      const opt = document.createElement("option");
      opt.value = b.id;
      opt.textContent = b.name + " · " + b.category;
      brandSel.appendChild(opt);
    });
    const promptSel = $("#prompt");
    promptSel.innerHTML = "";
    PROMPTS.forEach(function (p) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.text;
      promptSel.appendChild(opt);
    });
    const host = $("#platforms");
    host.innerHTML = PLATFORMS.map(function (p) {
      return '<label><input type="checkbox" id="platform-' + p.id + '" checked> <span>' + escape(p.name) + '</span><span class="tiny" style="margin-left:auto">' + escape(p.model) + "</span></label>";
    }).join("");
  }

  function renderKpis() {
    const total = lastResults.length;
    const mentioned = lastResults.filter(function (r) { return r.mentioned; });
    const mentionRate = total ? mentioned.length / total : 0;
    const avgPos = mentioned.length
      ? mentioned.reduce(function (a, r) { return a + r.position; }, 0) / mentioned.length
      : null;
    const positive = mentioned.filter(function (r) { return r.sentiment === "positive"; }).length;
    const cited = mentioned.filter(function (r) { return r.cited; }).length;
    $("#kpi-mention").textContent = total ? H.fmtPct(mentionRate) : "—";
    $("#kpi-position").textContent = avgPos ? avgPos.toFixed(1) : "—";
    $("#kpi-sentiment").textContent = mentioned.length ? H.fmtPct(positive / mentioned.length) : "—";
    $("#kpi-citation").textContent = mentioned.length ? H.fmtPct(cited / mentioned.length) : "—";
    $("#result-count").textContent = total + " 条";
  }

  function sentimentText(value) {
    return { positive: "正向", neutral: "中性", negative: "负向", "n/a": "未提及" }[value] || value;
  }

  function renderTable() {
    const body = $("#result-body");
    if (!lastResults.length) {
      body.innerHTML = '<tr><td colspan="7" class="muted">尚未运行。点击左侧“运行一次盲测”。</td></tr>';
      return;
    }
    body.innerHTML = lastResults.map(function (r, index) {
      const shortQuote = r.quote.length > 92 ? r.quote.slice(0, 92) + "…" : r.quote;
      return "<tr>" +
        "<td><b>" + escape(r.platform) + "</b><br><span class=\"tiny\">" + escape(r.model) + "</span></td>" +
        "<td>" + (r.mentioned ? '<span class="badge good">提及</span>' : '<span class="badge">未提及</span>') + "</td>" +
        "<td>" + (r.position || "—") + "</td>" +
        "<td>" + escape(sentimentText(r.sentiment)) + "</td>" +
        "<td>" + (r.cited ? '<span class="badge info">有</span>' : '<span class="badge">无</span>') + "</td>" +
        "<td class=\"quote-cell\"><span class=\"quote\">" + escape(shortQuote) + "</span></td>" +
        '<td><button class="btn small" data-evidence="' + index + '">证据</button></td>' +
        "</tr>";
    }).join("");
  }

  function renderEvidence(index) {
    const r = lastResults[index];
    if (!r) return;
    $("#evidence-label").textContent = r.id;
    $("#evidence-card").innerHTML =
      '<div class="row between"><span class="badge ' + (r.mentioned ? "good" : "") + '">' + (r.mentioned ? "品牌被提及" : "未提及") + "</span><span class=\"tiny mono\">" + escape(r.collected_at) + "</span></div>" +
      '<div class="evidence-quote">“' + escape(r.quote) + '”</div>' +
      '<div class="table-wrap"><table><tbody>' +
      "<tr><th>平台 / 模型</th><td>" + escape(r.platform) + " · " + escape(r.model) + "</td></tr>" +
      "<tr><th>位次 / 情感</th><td>" + (r.position || "—") + " · " + escape(sentimentText(r.sentiment)) + "</td></tr>" +
      "<tr><th>来源 URL</th><td>" + (r.source_url ? '<a href="' + escape(r.source_url) + '" target="_blank" rel="noopener">' + escape(r.source_url) + "</a>" : "未引用来源") + "</td></tr>" +
      "<tr><th>截图存证</th><td class=\"mono\">" + escape(r.screenshot_sha256) + "</td></tr>" +
      "<tr><th>账号指纹</th><td class=\"mono\">" + escape(r.account_fingerprint) + "</td></tr>" +
      "<tr><th>原始响应</th><td class=\"mono\">" + escape(r.raw_response_id) + " · 置信度 " + H.fmtPct(r.confidence) + "</td></tr>" +
      "</tbody></table></div>" +
      '<p class="tiny">合成证据：不是从真实平台抓取的内容；生产环境替换为原始对话、截图对象存储 URL、可访问引用链接和采集任务 ID。</p>';
  }

  function renderVariance() {
    const v = lastVariance || computeVarianceFor(checkedPlatforms(), selectedBrand(), selectedPrompt());
    lastVariance = v;
    $("#variance-badge").textContent = "σ " + v.stddev.toFixed(1) + "pp";
    $("#variance-badge").className = "badge " + (v.stddev <= 5 ? "good" : "warn");
    $("#variance-card").innerHTML =
      '<div class="row between"><span class="muted fs13">提及率（5 次独立采样）</span><b class="mono">方差 ' + v.variance.toFixed(1) + " pp²</b></div>" +
      '<div class="bars mt12">' + v.rates.map(function (rate, i) {
        return '<div class="bar-row"><span>第 ' + (i + 1) + " 次</span><div class=\"bar-track\"><i style=\"width:" + Math.max(2, rate) + '%"></i></div><b>' + rate.toFixed(0) + "%</b></div>";
      }).join("") + "</div>" +
      '<div class="note mt12">演示数据为确定性样本，因此 5 次完全一致（σ=0.0pp）。真实采集器用同一口径计算：提及率标准差 ≤ 5pp 才进入候选结果；超过阈值先查账号/地域/版本漂移，不直接下结论。</div>';
  }

  function buildContent(brand, prompt, evidence) {
    const mentioned = evidence.mentioned;
    const summary = mentioned
      ? "在「" + prompt.text + "」的合成盲测回答中，" + brand.name + " 被提及，位次 " + evidence.position + "，情感为" + sentimentText(evidence.sentiment) + "。本文只引用这次留存证据，不扩写未出现的优势。"
      : "在「" + prompt.text + "」的合成盲测回答中，本轮没有出现 " + brand.name + "。内容工厂不会补写品牌优势；建议先补充可被引用的产品参数、案例和作者资历。";
    const faq = [
      { q: prompt.text, a: summary },
      { q: "这条结论的证据在哪里？", a: "证据编号 " + evidence.id + "；留存字段包括原句、模型版本、采集时间、截图哈希和账号指纹。合成演示数据不代表真实平台结果。" }
    ];
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(function (item) {
        return { "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } };
      })
    };
    return {
      title: brand.name + " 在「" + prompt.text + "」中的可见度摘要",
      summary: summary,
      faq: faq,
      schema: schema,
      sources: [{ title: "合成证据 " + evidence.id, url: evidence.source_url || "https://example.com/synthetic-evidence/" + evidence.id.toLowerCase(), synthetic: true }],
      fact_check: ["不把未提及写成正面推荐", "不补写未留存的价格/参数", "来源 URL 必须可访问；合成样例需明确标注"],
      author: "ClawHunt demo content factory",
      generated_at: "2026-11-01T07:30:00Z"
    };
  }

  function renderContent() {
    if (!lastResults.length) {
      $("#content-preview").innerHTML = '<p class="muted fs13">请先运行一次盲测。</p>';
      return;
    }
    const brand = selectedBrand();
    const prompt = selectedPrompt();
    const evidence = lastResults[evidenceIndex] || lastResults[0];
    lastContent = buildContent(brand, prompt, evidence);
    $("#content-preview").innerHTML =
      '<div class="row between"><span class="badge info">草稿 · 待人工复核</span><span class="tiny mono">' + escape(lastContent.generated_at) + "</span></div>" +
      "<h3 class=\"mt12\">" + escape(lastContent.title) + "</h3>" +
      '<p class="sub mt8">' + escape(lastContent.summary) + "</p>" +
      '<div class="divider"></div><div class="stack">' + lastContent.faq.map(function (f) {
        return '<div><b class="fs13">Q：' + escape(f.q) + '</b><p class="sub">A：' + escape(f.a) + "</p></div>";
      }).join("") + "</div>" +
      '<div class="note warn mt12">发布前检查：' + lastContent.fact_check.map(escape).join("；") + "。</div>";
    $("#content-json").textContent = JSON.stringify({ content: lastContent, json_ld: lastContent.schema }, null, 2);
  }

  function buildApi() {
    return {
      data: lastResults.slice(0, 2).map(function (r) {
        return {
          platform: r.platform,
          model: r.model,
          prompt: r.prompt,
          brand: r.brand,
          mentioned: r.mentioned,
          position: r.position,
          sentiment: r.sentiment,
          cited: r.cited,
          evidence_text: r.quote,
          screenshot_url: r.screenshot_sha256,
          source_url: r.source_url || null,
          collected_at: r.collected_at
        };
      }),
      meta: {
        tenant_id: "tenant-demo",
        brand_id: selectedBrand().id,
        prompt_id: selectedPrompt().id,
        total: lastResults.length,
        generated_at: "2026-11-01T07:30:00Z"
      },
      evidence: { raw_response_retained: true, screenshot_retained: true, retention_days: 180 }
    };
  }

  function renderAttribution() {
    if (!lastResults.length) return;
    const mentioned = lastResults.filter(function (r) { return r.mentioned; });
    const citeRate = mentioned.length ? mentioned.filter(function (r) { return r.cited; }).length / mentioned.length : 0;
    const positiveRate = mentioned.length ? mentioned.filter(function (r) { return r.sentiment === "positive"; }).length / mentioned.length : 0;
    const bars = [
      { label: "品牌提及率", value: lastResults.length ? mentioned.length / lastResults.length : 0 },
      { label: "来源引用率", value: citeRate },
      { label: "正向情感率", value: positiveRate },
      { label: "内容资产覆盖", value: 0.75 }
    ];
    $("#attribution-bars").innerHTML = bars.map(function (b) {
      return '<div class="bar-row"><span>' + escape(b.label) + '</span><div class="bar-track"><i style="width:' + Math.max(2, b.value * 100) + '%"></i></div><b>' + H.fmtPct(b.value) + "</b></div>";
    }).join("");
    $("#api-json").textContent = JSON.stringify(buildApi(), null, 2);
  }

  function resetContent() {
    lastContent = null;
    $("#content-preview").innerHTML = '<p class="muted fs13">运行盲测后点击生成；会产出结论前置摘要、FAQ 和 JSON-LD。</p>';
    $("#content-json").textContent = "// JSON-LD / 来源对象会显示在这里";
  }

  function runAudit() {
    const platforms = checkedPlatforms();
    const brand = selectedBrand();
    const prompt = selectedPrompt();
    if (!platforms.length) {
      H.toast("至少选择一个目标平台");
      return;
    }
    lastResults = platforms.map(function (p) { return makeResult(p, prompt, brand, 0); });
    lastVariance = null;
    evidenceIndex = 0;
    $("#run-state").textContent = "已运行";
    $("#run-state").className = "badge good";
    $("#result-sub").textContent = brand.name + " × " + prompt.text + " · " + platforms.length + " 个平台 · 合成采集";
    renderKpis();
    renderTable();
    renderEvidence(0);
    renderAttribution();
    resetContent();
    $("#variance-badge").textContent = "未运行";
    $("#variance-badge").className = "badge";
    $("#variance-card").innerHTML = '<p class="muted fs13">同一 Prompt 重复采集 5 次，计算提及率方差（pp）。目标：≤ 5pp。</p>';
  }

  function showVariance() {
    if (!lastResults.length) {
      H.toast("先运行一次盲测，再做方差测试");
      return;
    }
    renderVariance();
  }

  function generateContent() {
    if (!lastResults.length) {
      H.toast("先运行一次盲测");
      return;
    }
    renderContent();
  }

  function buildChecks() {
    const brand = BRANDS[0];
    const prompt = PROMPTS[0];
    const sample = makeResult(PLATFORMS[0], prompt, brand, 0);
    const varObj = computeVarianceFor(PLATFORMS, brand, prompt);
    const content = buildContent(brand, prompt, sample);
    const api = {
      data: [sample],
      meta: { total: 1 },
      evidence: { raw_response_retained: true }
    };
    const checks = [
      H.check("六个目标平台已配置", PLATFORMS.length === 6, PLATFORMS.length + " platforms"),
      H.check("Prompt 库至少 3 条", PROMPTS.length >= 3, PROMPTS.length + " prompts"),
      H.check("提及判定与原句一致", sample.mentioned === (sample.quote.indexOf(brand.name) >= 0), "quote/brand"),
      H.check("位次在 1–5 或未提及", sample.position === null || (sample.position >= 1 && sample.position <= 5), String(sample.position)),
      H.check("证据字段完整", ["screenshot_sha256", "account_fingerprint", "collected_at", "raw_response_id"].every(function (k) { return !!sample[k]; }), "4 required fields"),
      H.check("重复采集标准差 ≤ 5pp", varObj.stddev <= 5, "σ=" + varObj.stddev.toFixed(1) + "pp"),
      H.check("内容带可访问来源字段", content.sources.length > 0 && content.sources[0].url.indexOf("https://") === 0, "source url"),
      H.check("API 响应契约完整", ["data", "meta", "evidence"].every(function (k) { return k in api; }) && Array.isArray(api.data), "data/meta/evidence")
    ];
    H.renderChecks("#checklist", checks);
    return checks;
  }

  function addPrompt() {
    const input = $("#new-prompt");
    const text = input.value.trim();
    if (text.length < 4) {
      H.toast("Prompt 至少 4 个字");
      return;
    }
    const id = "custom-" + (PROMPTS.length + 1);
    PROMPTS.push({ id: id, text: text, type: "自定义" });
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = text;
    $("#prompt").appendChild(opt);
    $("#prompt").value = id;
    input.value = "";
    runAudit();
    H.toast("已加入本次会话 Prompt 库");
  }

  function init() {
    renderSelects();
    $("#result-body").addEventListener("click", function (event) {
      const btn = event.target.closest("[data-evidence]");
      if (!btn) return;
      evidenceIndex = Number(btn.getAttribute("data-evidence"));
      renderEvidence(evidenceIndex);
      $("#evidence-card").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    $("#run-audit").addEventListener("click", runAudit);
    $("#run-variance").addEventListener("click", showVariance);
    $("#generate-content").addEventListener("click", generateContent);
    $("#run-checks").addEventListener("click", buildChecks);
    $("#add-prompt").addEventListener("click", addPrompt);
    $("#brand").addEventListener("change", runAudit);
    $("#prompt").addEventListener("change", runAudit);
    $("#platforms").addEventListener("change", runAudit);
    runAudit();
    buildChecks();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
