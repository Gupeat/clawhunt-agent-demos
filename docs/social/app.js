/* Social matrix demo: simulated publishing, deterministic synthetic data, no network calls. */
(function () {
  "use strict";
  var D = window.D;
  var $ = D.$;
  var $$ = D.$$;
  var escape = D.escape;
  var check = D.check;
  var toast = D.toast;
  var NL = String.fromCharCode(10);

  var MOCK_ONLY = true;
  var COST = { dev: 300, content: 225, review: 200, tools: 25 };
  var DAYS = [
    { date: "11-02", wd: "周一" }, { date: "11-03", wd: "周二" }, { date: "11-04", wd: "周三" },
    { date: "11-05", wd: "周四" }, { date: "11-06", wd: "周五" }, { date: "11-07", wd: "周六" },
    { date: "11-08", wd: "周日" }
  ];
  var ACCOUNTS = [
    { id: "us", name: "Northwind Home US", short: "US", market: "美国", lang: "EN", handle: "@NorthwindHomeUS", audience: "关注室内空气与家居维护的家庭", followers: "12.4K", auth: "已授权（模拟）" },
    { id: "de", name: "Northwind Outdoor DE", short: "DE", market: "德国", lang: "DE", handle: "@NorthwindOutdoorDE", audience: "周末徒步与轻户外人群", followers: "8.1K", auth: "已授权（模拟）" },
    { id: "uk", name: "Northwind Pets UK", short: "UK", market: "英国", lang: "EN", handle: "@NorthwindPetsUK", audience: "养猫狗的家庭", followers: "5.7K", auth: "已授权（模拟）" }
  ];
  var CTA = {
    us: "Save this for your next home check.",
    de: "Für den nächsten Check speichern.",
    uk: "Save this before your next walk."
  };
  var TAGS = {
    us: ["#HomeAirCheck", "#FilterCare", "#IndoorAir"],
    de: ["#Regenjacke", "#Wandern", "#LeaveNoTrace"],
    uk: ["#DogCare", "#PetSafety", "#UKPets"]
  };
  var TOPICS = {
    us: [
      { title: "滤芯该换了吗？3 个信号", hook: "不用拆机，也能先做一次滤芯自检。", points: "看风量、异味和滤芯计时器；出现其中两项，再安排更换。", format: "图文", media: "1 张主图 + 3 张细节图（合成）" },
      { title: "卧室空气，为什么半夜更闷？", hook: "关窗开净化器，不等于空气在循环。", points: "出风口避开床头，睡前 30 分钟开高档，入睡后切到睡眠档。", format: "短视频脚本", media: "30 秒竖屏脚本（合成）" },
      { title: "养宠家庭的 HEPA 选购清单", hook: "先看 CADR，再看毛发拦截和噪音。", points: "别只看“除毛”字样，确认滤网等级、适用面积和更换成本。", format: "图文", media: "对比卡片 2 张（合成）" },
      { title: "梅雨季，净化器别一直开最大档", hook: "湿度高时，先控湿，再谈颗粒物。", points: "连续高湿会缩短滤芯寿命；配合除湿，按房间面积选档。", format: "图文", media: "1 张湿度示意图（合成）" },
      { title: "开放式厨房的油烟，净化器放哪？", hook: "放在灶台正上方，不是唯一答案。", points: "避开人行走道，离墙 30cm，先用油烟机做源头捕集。", format: "图文", media: "平面摆放示意图（合成）" },
      { title: "小户型净化器摆放，别贴墙", hook: "贴墙会挡住进风，净化效率打折。", points: "留出 20–30cm 进风空间，放在人常待的区域。", format: "短视频脚本", media: "15 秒前后对比脚本（合成）" },
      { title: "周日 10 分钟维护清单", hook: "擦外壳、查滤芯、清传感器。", points: "传感器积灰会误判空气质量；按说明书干擦，不水洗。", format: "清单", media: "1 张清单卡片（合成）" }
    ],
    de: [
      { title: "Regenjacke: 3 Zeichen, dass die Membran müde wird", hook: "Nicht jede Undichtigkeit ist ein Riss.", points: "Ärmel und Schultern mit Wasser testen; wird es innen feucht, ist die Membran hin.", format: "图文", media: "1 Titelbild + 2 Detailfotos (synthetisch)" },
      { title: "Tagesrucksack richtig packen", hook: "Der Schwerpunkt nah am Rücken spart Schultern.", points: "Wasserflasche mittig, Regenjacke oben, Erste Hilfe unten.", format: "短视频脚本", media: "20-Sekunden-Reel (synthetisch)" },
      { title: "Wandern bei Dauerregen: Abbruchkriterien", hook: "Nicht die Ausrüstung, die Bedingungen entscheiden.", points: "Bei Sicht unter 50 m oder unklarer Bachquerung umkehren.", format: "图文", media: "1 Wetterkarte (synthetisch)" },
      { title: "Schuhe trocknen ohne Heizung", hook: "Direkte Hitze zerstört Kleber und Leder.", points: "Zeitungspapier und Luftzirkulation; nicht auf die Heizung stellen.", format: "图文", media: "1 Schritt-für-Schritt-Karte (synthetisch)" },
      { title: "Zwiebelprinzip für 8 °C und Regen", hook: "Drei dünne Lagen schlagen eine dicke.", points: "Merino, Fleece, Shell; trockene Reserve im Rucksack.", format: "图文", media: "3 Layer-Grafik (synthetisch)" },
      { title: "Leave no trace: 5 Dinge, die zurückbleiben dürfen", hook: "Nur Fußspuren, sonst nichts.", points: "Müll mitnehmen, Wege nicht abkürzen, Wildtiere nicht füttern.", format: "图文", media: "1 Infografik (synthetisch)" },
      { title: "Wochenend-Route: 10-Punkte-Check", hook: "Vor der Abfahrt 10 Minuten investieren.", points: "Wetter, Route, Rückkehrzeit, Notfallkontakt und Wasser prüfen.", format: "清单", media: "1 druckbare Checkliste (synthetisch)" }
    ],
    uk: [
      { title: "Dog paw check after a hot walk", hook: "If the pavement is too hot for your hand, it is too hot for paws.", points: "Check pads for cuts and heat; walk early or late in the day.", format: "图文", media: "1 paw-check card (synthetic)" },
      { title: "Cat carrier: less stress in 3 steps", hook: "Leave the carrier out, not only when the vet calls.", points: "Feed near it, add a familiar blanket, cover it during travel.", format: "短视频脚本", media: "25-second vertical script (synthetic)" },
      { title: "Home grooming without the drama", hook: "Short sessions beat one long battle.", points: "Brush, treat, pause; stop before your pet is over threshold.", format: "图文", media: "1 step card + 1 photo (synthetic)" },
      { title: "Lead pulling: reward the check-in", hook: "Stop moving when the lead tightens.", points: "Reward eye contact and a loose lead; practise in quiet areas first.", format: "短视频脚本", media: "20-second training clip (synthetic)" },
      { title: "Pet-safe plants: the short list", hook: "Not every “pet friendly” label is reliable.", points: "Check the scientific name; lilies are dangerous to cats.", format: "图文", media: "1 plant checklist (synthetic)" },
      { title: "Weekend dog walk kit", hook: "Water, bowl, poo bags, towel, ID tag.", points: "Add a basic pet first-aid item for longer routes.", format: "清单", media: "1 kit layout photo (synthetic)" },
      { title: "Vet visit checklist", hook: "Bring the questions, not just the pet.", points: "Symptoms, diet, meds, insurance; write down the vet's plan.", format: "图文", media: "1 checklist card (synthetic)" }
    ]
  };
  var STATUS = {
    pending: { label: "待审核", cls: "" },
    approved: { label: "已批准", cls: "info" },
    published: { label: "已模拟发布", cls: "good" },
    failed: { label: "发布失败", cls: "bad" },
    rejected: { label: "已退回", cls: "warn" }
  };
  var INITIAL = { d1: "published", d2: "published", d3: "failed", d4: "approved", d6: "approved" };

  function accountOf(id) {
    return ACCOUNTS.filter(function (a) { return a.id === id; })[0];
  }
  function statusBadge(status) {
    var m = STATUS[status] || STATUS.pending;
    return '<span class="badge ' + m.cls + '">' + m.label + "</span>";
  }
  function metricsFor(draft, mode) {
    var rand = D.rng(draft.id + "|" + mode);
    var reach = 2800 + Math.floor(rand() * 4800);
    var clicks = Math.floor(reach * (0.018 + rand() * 0.025));
    var leads = Math.max(1, Math.floor(clicks * (0.015 + rand() * 0.035)));
    return { reach: reach, clicks: clicks, leads: leads };
  }
  function buildDrafts() {
    var seq = 0;
    var rows = [];
    for (var day = 0; day < DAYS.length; day++) {
      for (var ai = 0; ai < ACCOUNTS.length; ai++) {
        var account = ACCOUNTS[ai];
        var topic = TOPICS[account.id][day];
        var id = "d" + (++seq);
        var draft = {
          id: id, day: day, date: DAYS[day].date, accountId: account.id,
          title: topic.title, hook: topic.hook, points: topic.points, format: topic.format,
          media: topic.media, tags: TAGS[account.id], cta: CTA[account.id],
          body: topic.hook + " " + topic.points + " " + CTA[account.id],
          status: "pending", attempts: 0, metrics: null, error: null,
          approvedAt: null, publishedAt: null, retryNote: "",
          idempotencyKey: "pub_" + ("00000000" + D.hash(account.id + "|" + day + "|" + topic.title).toString(16)).slice(-8),
          scheduled: "2026-" + DAYS[day].date + " " + (account.id === "us" ? "10:30" : account.id === "de" ? "14:00" : "17:30") + " UTC"
        };
        var init = INITIAL[id] || "pending";
        if (init === "published") {
          draft.status = "published";
          draft.approvedAt = "2026-11-02 09:50 UTC";
          draft.publishedAt = id === "d1" ? "2026-11-02 10:15 UTC" : "2026-11-02 14:10 UTC";
          draft.attempts = 1;
          draft.metrics = metricsFor(draft, "seed");
        } else if (init === "failed") {
          draft.status = "failed";
          draft.approvedAt = "2026-11-02 09:50 UTC";
          draft.attempts = 3;
          draft.error = {
            code: "429",
            message: "Meta Graph API rate limit (code 4 / subcode 2207051)：自动重试 3 次仍失败，已进入人工队列。",
            at: "2026-11-02 17:40 UTC"
          };
        } else if (init === "approved") {
          draft.status = "approved";
          draft.approvedAt = "2026-11-05 17:10 UTC";
        }
        rows.push(draft);
      }
    }
    return rows;
  }

  var state = { drafts: buildDrafts(), selectedId: null };
  state.selectedId = (state.drafts.filter(function (d) { return d.status === "approved"; })[0] || state.drafts[0]).id;

  function findDraft(id) {
    return state.drafts.filter(function (d) { return d.id === id; })[0];
  }
  function canPublish(draft) { return !!draft && draft.status === "approved"; }
  function retryKey(id) {
    var d = findDraft(id);
    return d ? d.idempotencyKey : "";
  }
  function scanCompliance(text) {
    var t = String(text).toLowerCase();
    var hits = [];
    if (/治愈|根治|治疗|cure|heal|heilt|heilen/.test(t)) hits.push("医疗承诺");
    if (/100%|永久|最强|全网最低|guaranteed|garantiert|immer/.test(t)) hits.push("绝对化用语");
    if (/保证|承诺|零风险|立刻见效|guaranteed results/.test(t)) hits.push("结果保证");
    if (/[0-9]+([.][0-9]+)?%/.test(t)) hits.push("未标来源数据");
    if (/密码|api key|access token/.test(t)) hits.push("敏感信息");
    return hits;
  }
  function complianceRows(draft) {
    var hits = scanCompliance(draft.title + " " + draft.body + " " + draft.tags.join(" "));
    var approved = draft.status === "approved" || draft.status === "published" || draft.status === "failed";
    return [
      { ok: hits.indexOf("医疗承诺") < 0, name: "医疗 / 功效承诺", detail: "通过" },
      { ok: hits.indexOf("绝对化用语") < 0 && hits.indexOf("结果保证") < 0, name: "绝对化 / 结果保证", detail: "通过" },
      { ok: hits.indexOf("未标来源数据") < 0, name: "数据 / 引用可核验", detail: "无未标来源数字" },
      { ok: draft.media.indexOf("合成") >= 0 || draft.media.indexOf("synthetic") >= 0, name: "素材授权", detail: "仅用合成素材" },
      { ok: approved, name: "人工批准记录", detail: approved ? "ops-lead · " + draft.approvedAt : "待人工点击批准" }
    ];
  }

  function renderKpis() {
    var published = state.drafts.filter(function (d) { return d.status === "published"; });
    var failed = state.drafts.filter(function (d) { return d.status === "failed"; });
    var pending = state.drafts.filter(function (d) { return d.status === "pending"; });
    $("#kpi-drafts").textContent = String(state.drafts.length);
    $("#cal-count").textContent = "已模拟发布 " + published.length + " / " + state.drafts.length;
    $("#cal-failed").textContent = "失败 " + failed.length;
    $("#cal-failed").className = "badge " + (failed.length ? "bad" : "good");
    $("#failure-count").textContent = failed.length + " 条";
    $("#failure-count").className = "badge " + (failed.length ? "bad" : "good");
    var node = $("#pipeline-state");
    if (failed.length) {
      node.textContent = "失败待恢复 " + failed.length;
      node.className = "badge warn";
    } else if (pending.length) {
      node.textContent = "待人工批准 " + pending.length;
      node.className = "badge info";
    } else {
      node.textContent = "全部已处理";
      node.className = "badge good";
    }
  }

  function draftCard(draft) {
    var account = accountOf(draft.accountId);
    var active = draft.id === state.selectedId ? " selected" : "";
    return '<button class="draft-card ' + draft.status + active + '" data-draft="' + draft.id + '">' +
      '<span class="tiny">' + account.short + " · " + escape(draft.format) + "</span>" +
      "<b>" + escape(draft.title) + "</b>" +
      statusBadge(draft.status) + "</button>";
  }
  function renderCalendar() {
    var html = '<div class="cal-cell cal-head">账号 / 日期</div>';
    DAYS.forEach(function (day) {
      html += '<div class="cal-cell cal-head"><b>' + day.date + "</b>" + day.wd + "</div>";
    });
    ACCOUNTS.forEach(function (account) {
      html += '<div class="cal-cell cal-account"><b>' + account.short + " · " + escape(account.name) + "</b>" +
        '<span class="tiny">' + account.lang + " · " + account.market + "</span></div>";
      for (var day = 0; day < DAYS.length; day++) {
        var draft = state.drafts.filter(function (d) { return d.accountId === account.id && d.day === day; })[0];
        html += '<div class="cal-cell">' + (draft ? draftCard(draft) : "") + "</div>";
      }
    });
    $("#calendar").innerHTML = html;
    $("#cal-sub").textContent = "所有指标为合成数据；排期 " + DAYS[0].date + " 至 " + DAYS[6].date + "，点击卡片审阅。";
  }

  function renderReview() {
    var draft = findDraft(state.selectedId) || state.drafts[0];
    if (!draft) return;
    var account = accountOf(draft.accountId);
    var rows = complianceRows(draft);
    var passed = rows.filter(function (r) { return r.ok; }).length;
    var actions = "";
    if (draft.status === "pending") {
      actions = '<button class="btn primary" data-action="approve">批准草稿</button>' +
        '<button class="btn" data-action="reject">退回修改</button>';
    } else if (draft.status === "approved") {
      actions = '<button class="btn primary" data-action="publish">模拟发布</button>' +
        '<button class="btn" data-action="fail">注入 429 失败</button>' +
        '<button class="btn" data-action="withdraw">撤回批准</button>';
    } else if (draft.status === "failed") {
      actions = '<button class="btn primary" data-action="retry">重试发布</button>' +
        '<button class="btn" data-action="reject">退回修改</button>';
    } else if (draft.status === "rejected") {
      actions = '<button class="btn" data-action="restore">恢复待审核</button>';
    } else {
      actions = '<button class="btn" data-action="view-feedback">查看数据反馈</button>';
    }
    var result = "待发布";
    if (draft.status === "published") {
      result = "模拟成功 · 曝光 " + draft.metrics.reach.toLocaleString("en-US") + " / 线索 " + draft.metrics.leads;
    } else if (draft.status === "failed") {
      result = "失败 · 待人工重试";
    } else if (draft.status === "approved") {
      result = "已批准 · 等待发布";
    }
    var html = '<div class="row between review-head"><div><div class="tiny">' + escape(account.name) + " · " + account.market + " / " + account.lang + "</div>" +
      '<div style="font-size:15px;font-weight:800;margin-top:2px">' + escape(draft.title) + "</div></div>" + statusBadge(draft.status) + "</div>" +
      '<div class="copy-box review-copy"><div class="hook">' + escape(draft.hook) + "</div>" +
      '<p style="margin:6px 0">' + escape(draft.points) + "</p>" +
      '<p class="tiny" style="margin:0 0 6px">CTA: ' + escape(draft.cta) + "</p>" +
      '<div class="hashtags">' + escape(draft.tags.join(" ")) + "</div></div>" +
      '<div class="meta-list review-meta">' +
      "<div><span>账号 / 市场</span><b>" + escape(account.handle) + " · " + account.market + "</b></div>" +
      "<div><span>格式</span><b>" + escape(draft.format) + "</b></div>" +
      "<div><span>排期</span><b>" + draft.scheduled + "</b></div>" +
      "<div><span>发布结果</span><b>" + escape(result) + "</b></div>" +
      '<div><span>幂等键</span><b class="mono" style="font-size:10px">' + draft.idempotencyKey + "</b></div>" +
      "</div>" +
      '<div class="review-checks"><div class="row between mb8"><b style="font-size:12px">发布前合规扫描</b><span class="badge ' + (passed === rows.length ? "good" : "warn") + '">' + passed + "/" + rows.length + "</span></div>" +
      '<div class="checklist" style="margin:0">' + rows.map(function (r) {
        return '<div class="checkrow ' + (r.ok ? "pass" : "fail") + '"><span class="dot">' + (r.ok ? "✓" : "!") + "</span><span>" + escape(r.name) + '</span><span class="detail">' + escape(r.detail) + "</span></div>";
      }).join("") + "</div>" + "</div>";
    if (draft.status === "failed" && draft.error) {
      html += '<div class="failure-item review-failure"><b>失败原因</b><div class="err">' + escape(draft.error.message) + '</div><span class="tiny">' + escape(draft.error.at) + " · 自动重试 " + draft.attempts + " 次</span></div>";
    }
    if (draft.status === "published" && draft.metrics) {
      html += '<div class="note review-note">已模拟发布，指标为合成数据：曝光 ' + draft.metrics.reach.toLocaleString("en-US") + " · 点击 " + draft.metrics.clicks.toLocaleString("en-US") + " · 内容线索 " + draft.metrics.leads + "。" + (draft.retryNote ? " " + escape(draft.retryNote) : "") + "</div>";
    }
    html += '<div class="action-grid review-actions">' + actions + "</div>" +
      '<p class="tiny review-boundary" style="margin:0">发布动作只改本地状态；不调用 Facebook API。真实上线需页面管理员 OAuth + App Review。</p>';
    $("#review").innerHTML = html;
    $("#review-status").textContent = STATUS[draft.status].label;
    $("#review-status").className = "badge " + STATUS[draft.status].cls;
  }

  function renderFailures() {
    var failed = state.drafts.filter(function (d) { return d.status === "failed"; });
    if (!failed.length) {
      $("#failure-list").innerHTML = '<div class="note">暂无失败。可选中一条“已批准”草稿，点击“注入 429 失败”验证恢复路径。</div>';
      return;
    }
    $("#failure-list").innerHTML = failed.map(function (d) {
      var account = accountOf(d.accountId);
      return '<div class="failure-item"><div class="row between"><b>' + escape(d.title) + '</b><span class="badge bad">第 ' + d.attempts + " 次失败</span></div>" +
        '<div class="tiny">' + escape(account.name) + " · " + d.scheduled + "</div>" +
        '<div class="err">' + escape(d.error ? d.error.code + " · " + d.error.message : "未知错误") + "</div>" +
        '<div class="row between"><span class="mono" style="font-size:10px">' + d.idempotencyKey + '</span><button class="btn small" data-retry="' + d.id + '">人工重试</button></div></div>';
    }).join("");
  }

  function feedbackRows() {
    return ACCOUNTS.map(function (account) {
      var rows = state.drafts.filter(function (d) { return d.accountId === account.id && d.status === "published"; });
      var reach = rows.reduce(function (sum, d) { return sum + d.metrics.reach; }, 0);
      var clicks = rows.reduce(function (sum, d) { return sum + d.metrics.clicks; }, 0);
      var leads = rows.reduce(function (sum, d) { return sum + d.metrics.leads; }, 0);
      return { account: account, published: rows.length, reach: reach, clicks: clicks, leads: leads, ctr: reach ? clicks / reach : 0 };
    });
  }
  function renderFeedback() {
    var rows = feedbackRows();
    var totalLeads = rows.reduce(function (sum, r) { return sum + r.leads; }, 0);
    $("#feedback-body").innerHTML = rows.map(function (r) {
      return "<tr><td><b>" + escape(r.account.name) + "</b><div class='tiny'>" + escape(r.account.handle) + "</div></td>" +
        "<td>" + r.published + "</td><td>" + r.reach.toLocaleString("en-US") + "</td><td>" + r.clicks.toLocaleString("en-US") + "</td><td>" + r.leads + "</td><td>" + (r.reach ? D.fmtPct(r.ctr, 1) : "—") + "</td></tr>";
    }).join("");
    var count = state.drafts.filter(function (d) { return d.status === "published"; }).length;
    $("#feedback-note").textContent = count + " 条已模拟发布；内容线索合计 " + totalLeads + "，为合成平台事件。";
    $("#feedback-badge").textContent = "内容线索 " + totalLeads;
    $("#feedback-badge").className = "badge " + (totalLeads ? "info" : "");
  }
  function renderAccounts() {
    $("#account-body").innerHTML = ACCOUNTS.map(function (a) {
      return "<tr><td><b>" + escape(a.name) + "</b><div class='tiny'>" + escape(a.handle) + " · " + a.followers + " 关注</div></td>" +
        "<td>" + a.market + " / " + a.lang + "<div class='tiny'>" + escape(a.audience) + "</div></td>" +
        '<td><span class="badge good">' + a.auth + "</span></td><td>7 条 / 周</td></tr>";
    }).join("");
  }

  function runChecks() {
    var list = [];
    list.push(check("21 条周计划 = 7 天 × 3 账号", state.drafts.length === 21, state.drafts.length + " 条"));
    var counts = ACCOUNTS.map(function (a) { return state.drafts.filter(function (d) { return d.accountId === a.id; }).length; });
    list.push(check("每个账号 7 条草稿", counts.every(function (n) { return n === 7; }), counts.join(" / ")));
    var complete = state.drafts.every(function (d) { return d.title && d.hook && d.points && d.tags.length && d.format && d.accountId; });
    list.push(check("草稿字段完整", complete, "账号 / 格式 / 标题 / 正文 / 标签"));
    var risky = scanCompliance("这款产品能治愈湿疹，100% 有效，保证全网最低价");
    list.push(check("合规扫描能拦截高风险用词", risky.length >= 3, risky.join("、")));
    list.push(check("发布门只允许已批准草稿", canPublish({ status: "pending" }) === false && canPublish({ status: "approved" }) === true, "pending=false / approved=true"));
    var published = state.drafts.filter(function (d) { return d.status === "published"; });
    var others = state.drafts.filter(function (d) { return d.status !== "published" && d.status !== "failed"; });
    list.push(check("只有已发布条目带指标", published.every(function (d) { return !!d.metrics; }) && others.every(function (d) { return !d.metrics; }), published.length + " 条已发布"));
    var failed = state.drafts.filter(function (d) { return d.status === "failed"; });
    list.push(check("失败项保留错误与重试信息", failed.every(function (d) { return d.error && d.idempotencyKey && d.attempts >= 3; }), failed.length + " 条失败"));
    var keys = state.drafts.map(function (d) { return d.idempotencyKey; });
    var unique = keys.every(function (k, i) { return keys.indexOf(k) === i; });
    list.push(check("幂等键唯一且重试不变", unique && retryKey("d1") === findDraft("d1").idempotencyKey, keys.length + " 个键"));
    var fb = feedbackRows();
    var total = published.reduce(function (s, d) { return s + d.metrics.leads; }, 0);
    var fbLeads = fb.reduce(function (s, r) { return s + r.leads; }, 0);
    list.push(check("反馈只汇总已发布数据", total === fbLeads, "线索 " + total));
    list.push(check("成本拆成开发 / 月运营", COST.dev === 300 && (COST.content + COST.review + COST.tools) === 450 && MOCK_ONLY === true, "开发 $300 + 月运营 $450；0 真实发布"));
    D.renderChecks("#checklist", list);
    return list;
  }

  function renderAll() {
    renderKpis();
    renderCalendar();
    renderReview();
    renderFailures();
    renderFeedback();
    renderAccounts();
    runChecks();
  }

  function approveDraft(draft) {
    if (draft.status !== "pending") return;
    draft.status = "approved";
    draft.approvedAt = "2026-11-05 17:10 UTC";
    toast("已人工批准；现在可以模拟发布");
    renderAll();
  }
  function publishDraft(draft, mode) {
    if (!canPublish(draft)) { toast("发布门：必须先人工批准"); return; }
    draft.status = "published";
    draft.publishedAt = "2026-11-05 17:30 UTC";
    draft.metrics = metricsFor(draft, mode || "publish");
    draft.error = null;
    draft.attempts = 1;
    draft.retryNote = "";
    toast("已模拟发布（不连接真实账号）");
    renderAll();
  }
  function failDraft(draft) {
    if (draft.status !== "approved") return;
    draft.status = "failed";
    draft.attempts = 3;
    draft.metrics = null;
    draft.error = {
      code: "429",
      message: "Meta Graph API rate limit (code 4 / subcode 2207051)：自动重试 3 次仍失败，已进入人工队列。",
      at: "2026-11-05 17:32 UTC"
    };
    toast("已注入 429 限流；草稿保留，可人工重试");
    renderAll();
  }
  function retryDraft(draft) {
    if (draft.status !== "failed") return;
    var key = draft.idempotencyKey;
    draft.status = "published";
    draft.publishedAt = "2026-11-05 17:35 UTC";
    draft.metrics = metricsFor(draft, "retry");
    draft.error = null;
    draft.attempts += 1;
    draft.retryNote = "人工重试成功；复用 " + key;
    toast("重试成功（模拟）；幂等键未变");
    renderAll();
  }
  function rejectDraft(draft) {
    draft.status = "rejected";
    draft.metrics = null;
    toast("已退回修改");
    renderAll();
  }
  function exportFeedback() {
    var rows = state.drafts.filter(function (d) { return d.status === "published"; });
    var lines = [["account", "date", "title", "format", "reach", "clicks", "leads"].join(",")];
    rows.forEach(function (d) {
      var account = accountOf(d.accountId);
      var cells = [account.name, d.date, d.title, d.format, d.metrics.reach, d.metrics.clicks, d.metrics.leads];
      lines.push(cells.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(","));
    });
    var blob = new Blob([lines.join(NL)], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "social-feedback.csv";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    toast("已导出合成反馈 CSV");
  }

  D.on($("#calendar"), "click", function (event) {
    var card = event.target.closest("[data-draft]");
    if (!card) return;
    state.selectedId = card.getAttribute("data-draft");
    renderAll();
  });
  D.on($("#review"), "click", function (event) {
    var button = event.target.closest("[data-action]");
    if (!button) return;
    var draft = findDraft(state.selectedId);
    if (!draft) return;
    var action = button.getAttribute("data-action");
    if (action === "approve") approveDraft(draft);
    else if (action === "publish") publishDraft(draft, "publish");
    else if (action === "fail") failDraft(draft);
    else if (action === "retry") retryDraft(draft);
    else if (action === "reject") rejectDraft(draft);
    else if (action === "withdraw") {
      draft.status = "pending";
      draft.approvedAt = null;
      toast("已撤回批准");
      renderAll();
    } else if (action === "restore") {
      draft.status = "pending";
      toast("已恢复到待审核");
      renderAll();
    } else if (action === "view-feedback") {
      var body = $("#feedback-body");
      if (body) body.closest(".card").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  D.on($("#failure-list"), "click", function (event) {
    var button = event.target.closest("[data-retry]");
    if (!button) return;
    var draft = findDraft(button.getAttribute("data-retry"));
    if (draft) retryDraft(draft);
  });
  D.on($("#run-checks"), "click", function () {
    runChecks();
    toast("自检已重新运行");
  });
  D.on($("#export-feedback"), "click", exportFeedback);

  window.__socialDemo = { state: state, scanCompliance: scanCompliance, canPublish: canPublish, metricsFor: metricsFor, feedbackRows: feedbackRows };
  renderAll();
})();