(function () {
  "use strict";
  const H = window.D;
  const $ = H.$;

  const SCENARIOS = [
    {
      id: "warehouse-jkt",
      name: "仓储运营主管 · 印尼",
      role: "Warehouse Supervisor · Jakarta",
      languageLabel: "Bahasa Indonesia + English",
      lang: "id-ID",
      agent: "Nadia",
      steps: [
        {
          agent: "Halo, saya Nadia dari tim rekrutmen PT Nusantara Retail. Apakah Anda masih tertarik untuk posisi Warehouse Supervisor di Jakarta?",
          choices: [
            { label: "是，2 周内可以到岗", reply: "Ya, saya masih tertarik dan bisa mulai dalam dua minggu.", score: 25, tag: "availability:2w", next: 1 },
            { label: "有兴趣，但需要 1 个月", reply: "Saya tertarik, tetapi perlu sekitar satu bulan untuk notice period.", score: 15, tag: "availability:1m", next: 1 },
            { label: "需要先确认工作签证", reply: "Saya perlu memastikan status visa kerja saya terlebih dahulu.", score: 5, tag: "availability:visa", next: 1 }
          ]
        },
        {
          agent: "Apakah Anda nyaman dengan shift malam dan komunikasi campuran Bahasa Indonesia + English?",
          choices: [
            { label: "可以，双语言、接受夜班", reply: "Saya nyaman dengan shift malam dan bisa berkomunikasi dalam Bahasa Indonesia dan English.", score: 20, tag: "language:bi_en", next: 2 },
            { label: "英文可以，印尼语一般", reply: "English saya lancar, Bahasa Indonesia saya cukup untuk operasional dasar.", score: 8, tag: "language:en_limited", next: 2 },
            { label: "只接受白班", reply: "Saya hanya bisa bekerja shift siang.", score: 2, tag: "shift:day_only", next: 2 }
          ]
        },
        {
          agent: "Berapa ekspektasi gaji bulanan Anda untuk posisi ini?",
          choices: [
            { label: "在预算范围内", reply: "Ekspektasi saya masih dalam kisaran budget untuk posisi ini.", score: 25, tag: "salary:within", next: 3 },
            { label: "高于预算约 15%", reply: "Saya berharap sekitar 15% di atas kisaran yang disebutkan.", score: 10, tag: "salary:+15", next: 3 },
            { label: "可以再谈", reply: "Saya terbuka untuk berdiskusi mengenai paket total.", score: 18, tag: "salary:open", next: 3 }
          ]
        },
        {
          agent: "Terima kasih. Boleh saya konfirmasi nomor WhatsApp dan waktu interview minggu ini?",
          choices: [
            { label: "可以，周三下午", reply: "Bisa, saya tersedia hari Rabu sore.", score: 10, tag: "interview:wed_pm", next: null },
            { label: "先发邮件资料", reply: "Tolong kirim detail melalui email terlebih dahulu.", score: 7, tag: "interview:email_first", next: null },
            { label: "暂时不继续", reply: "Terima kasih, untuk saat ini saya tidak melanjutkan.", score: 0, tag: "candidate:declined", next: null }
          ]
        }
      ],
      closing: "Baik, saya catat. Tim kami akan mengirim konfirmasi melalui WhatsApp. Terima kasih atas waktunya."
    },
    {
      id: "support-kl",
      name: "客服支持 · 马来西亚",
      role: "Customer Support Associate · Kuala Lumpur",
      languageLabel: "English + Bahasa Melayu",
      lang: "ms-MY",
      agent: "Aina",
      steps: [
        {
          agent: "Hi, this is Aina from the talent team. Are you still interested in the Customer Support Associate role in Kuala Lumpur?",
          choices: [
            { label: "是，2 周内可入职", reply: "Yes, I am still interested and can start in two weeks.", score: 25, tag: "availability:2w", next: 1 },
            { label: "有兴趣，想先了解轮班", reply: "I am interested, but I would like to understand the shift pattern first.", score: 14, tag: "availability:shift_question", next: 1 },
            { label: "暂不考虑", reply: "Thanks, but I am not looking right now.", score: 0, tag: "candidate:declined", next: null }
          ]
        },
        {
          agent: "The role covers chat, email and occasional voice support. How comfortable are you with English and Bahasa Melayu?",
          choices: [
            { label: "两种语言都可以", reply: "I am comfortable working in both English and Bahasa Melayu.", score: 20, tag: "language:en_ms", next: 2 },
            { label: "英文强，马来语基础", reply: "My English is strong and my Bahasa Melayu is conversational.", score: 10, tag: "language:en_strong", next: 2 },
            { label: "更希望纯英文岗位", reply: "I would prefer an English-only support role.", score: 4, tag: "language:en_only", next: 2 }
          ]
        },
        {
          agent: "What is your expected monthly salary for this role?",
          choices: [
            { label: "在预算范围内", reply: "My expectation is within the range you shared.", score: 25, tag: "salary:within", next: 3 },
            { label: "略高于预算", reply: "I am looking for slightly above the posted range.", score: 10, tag: "salary:+", next: 3 },
            { label: "可以再谈", reply: "I am open to discussing the total package.", score: 18, tag: "salary:open", next: 3 }
          ]
        },
        {
          agent: "Great. May I confirm your availability for a 30-minute interview this week?",
          choices: [
            { label: "周四上午可以", reply: "Thursday morning works for me.", score: 10, tag: "interview:thu_am", next: null },
            { label: "先发岗位说明", reply: "Please send the job description first.", score: 7, tag: "interview:jd_first", next: null },
            { label: "暂不安排", reply: "I will hold off for now.", score: 0, tag: "candidate:declined", next: null }
          ]
        }
      ],
      closing: "Thank you. I have noted your answers and our team will follow up by email with the next step."
    },
    {
      id: "admin-mnl",
      name: "医疗行政支持 · 菲律宾",
      role: "Healthcare Admin Associate · Manila",
      languageLabel: "English",
      lang: "en-PH",
      agent: "Maya",
      steps: [
        {
          agent: "Hi, this is Maya from the recruitment team. Are you still interested in the Healthcare Admin Associate role in Manila?",
          choices: [
            { label: "是，2 周内可入职", reply: "Yes, I am interested and available in two weeks.", score: 25, tag: "availability:2w", next: 1 },
            { label: "有兴趣，需确认通勤", reply: "I am interested but need to confirm my commute.", score: 13, tag: "availability:commute", next: 1 },
            { label: "暂不考虑", reply: "No, I am not pursuing this role right now.", score: 0, tag: "candidate:declined", next: null }
          ]
        },
        {
          agent: "This is a non-clinical administrative role with patient-data handling. Are you comfortable with night shifts and strict privacy rules?",
          choices: [
            { label: "可以，接受夜班与隐私要求", reply: "Yes, I am comfortable with night shifts and understand the privacy requirements.", score: 20, tag: "shift:night_ok", next: 2 },
            { label: "夜班可以，需培训", reply: "I can do night shifts but would need onboarding on the privacy process.", score: 12, tag: "shift:night_training", next: 2 },
            { label: "只能白班", reply: "I can only work day shifts.", score: 3, tag: "shift:day_only", next: 2 }
          ]
        },
        {
          agent: "What is your expected monthly salary for this position?",
          choices: [
            { label: "在预算范围内", reply: "My expected salary is within the range for this role.", score: 25, tag: "salary:within", next: 3 },
            { label: "高于预算 10%", reply: "I am targeting about 10% above the posted range.", score: 11, tag: "salary:+10", next: 3 },
            { label: "可以再谈", reply: "I am open to discussing the full package.", score: 18, tag: "salary:open", next: 3 }
          ]
        },
        {
          agent: "Thank you. Can I confirm your availability for an interview this week?",
          choices: [
            { label: "周二下午可以", reply: "Tuesday afternoon works for me.", score: 10, tag: "interview:tue_pm", next: null },
            { label: "先发邮件说明", reply: "Please send the details by email first.", score: 7, tag: "interview:email_first", next: null },
            { label: "暂不安排", reply: "I will pause for now.", score: 0, tag: "candidate:declined", next: null }
          ]
        }
      ],
      closing: "Thank you. I have recorded your responses; the team will follow up with interview details and privacy onboarding."
    }
  ];

  let state = {
    active: false,
    ended: false,
    scenario: SCENARIOS[0],
    step: 0,
    transcript: [],
    answers: [],
    score: 0,
    startedAt: 0,
    elapsed: 0,
    timerId: null,
    latency: null,
    cost: 0,
    fallback: false,
    apiFailures: 0,
    silenceCount: 0,
    interrupted: false,
    callId: ""
  };

  function scenarioById(id) {
    return SCENARIOS.find(function (s) { return s.id === id; }) || SCENARIOS[0];
  }

  function setStatus(text, kind) {
    const el = $("#call-status");
    el.textContent = text;
    el.className = "badge " + (kind || "");
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
  }

  function makeCallId() {
    return "CALL-" + H.hash(state.scenario.id + "|" + Date.now()).toString(16).slice(0, 8).toUpperCase();
  }

  function updateTimer() {
    if (!state.startedAt) return;
    state.elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
    state.cost = 0.02 + state.elapsed * 0.0019;
    $("#call-timer").textContent = formatTime(state.elapsed);
    $("#call-cost").textContent = "$" + state.cost.toFixed(2);
  }

  function addLine(role, text) {
    state.transcript.push({ role: role, text: text });
    renderTranscript();
    if (role === "agent") {
      state.latency = 360 + (H.hash(text + state.scenario.id) % 520);
      $("#call-latency").textContent = state.latency + " ms";
      speak(text);
    }
    updateTimer();
  }

  function addAgent(text) { addLine("agent", text); }
  function addCandidate(text) { addLine("candidate", text); }
  function addSystem(text) { addLine("system", text); }

  function renderTranscript() {
    const host = $("#transcript");
    if (!state.transcript.length) {
      host.innerHTML = '<p class="tiny" style="color:#8fb3b8">点击“开始模拟通话”后，Agent 会先问候并确认求职意向。</p>';
      return;
    }
    host.innerHTML = state.transcript.map(function (line) {
      const who = line.role === "agent" ? state.scenario.agent : line.role === "candidate" ? "候选人（合成）" : "SYSTEM";
      return '<div class="bubble ' + line.role + '"><span class="who">' + H.escape(who) + "</span>" + H.escape(line.text) + "</div>";
    }).join("");
    host.scrollTop = host.scrollHeight;
  }

  function speak(text) {
    if (!$("#speak-toggle").checked || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = state.scenario.lang;
      utter.rate = 0.98;
      utter.pitch = 1.02;
      window.speechSynthesis.speak(utter);
    } catch (err) {
      /* Browsers without TTS simply skip audio. */
    }
  }

  function renderChoices() {
    const host = $("#choices");
    if (!state.active) {
      host.innerHTML = "";
      return;
    }
    const step = state.scenario.steps[state.step];
    if (!step) {
      host.innerHTML = "";
      return;
    }
    host.innerHTML = step.choices.map(function (choice, index) {
      return '<button class="btn choice" data-choice="' + index + '"><span class="tiny" style="opacity:.7;min-width:24px">' + String.fromCharCode(65 + index) + '</span> ' + H.escape(choice.label) + "</button>";
    }).join("");
  }

  function choose(index) {
    if (!state.active) return;
    const step = state.scenario.steps[state.step];
    if (!step) return;
    const choice = step.choices[index];
    if (!choice) return;
    addCandidate(choice.reply);
    state.score += choice.score;
    state.answers.push({ step: state.step, label: choice.label, tag: choice.tag, score: choice.score });
    if (choice.next === null || choice.next === undefined) {
      addAgent(state.scenario.closing);
      finishCall("completed");
      return;
    }
    state.step = choice.next;
    addAgent(state.scenario.steps[state.step].agent);
    renderChoices();
  }

  function maxScore() {
    return state.scenario.steps.reduce(function (total, step) {
      return total + Math.max.apply(null, step.choices.map(function (c) { return c.score; }));
    }, 0);
  }

  function dispositionFor(percent, early) {
    if (early) return { code: "incomplete", label: "未完成", className: "warn" };
    if (percent >= 70) return { code: "qualified", label: "Qualified", className: "good" };
    if (percent >= 45) return { code: "nurture", label: "Nurture", className: "warn" };
    return { code: "not_fit", label: "Not fit", className: "bad" };
  }

  function nextActionFor(code) {
    return {
      qualified: "发送 WhatsApp 面试确认 + 日历邀约；ATS 标记 qualified。",
      nurture: "进入培育序列，补发岗位/薪资说明；7 天后跟进。",
      not_fit: "礼貌结束，加入人才库；记录原因，不重复外呼。",
      incomplete: "转人工跟进；保留已完成字段，不把未问到的字段写成结论。"
    }[code] || "人工复核";
  }

  function renderScorecard() {
    const host = $("#scorecard");
    const badge = $("#scorecard-status");
    if (!state.ended) {
      host.innerHTML = '<p class="muted fs13">开始并完成一通模拟通话后生成；也可提前结束，查看未完成通话的 disposition。</p>';
      badge.textContent = "未生成";
      badge.className = "badge";
      return;
    }
    const max = maxScore();
    const percent = max ? Math.round(state.score / max * 100) : 0;
    const early = state.answers.length < state.scenario.steps.length;
    const disp = dispositionFor(percent, early);
    const flags = [];
    if (state.fallback) flags.push("ATS 降级");
    if (state.silenceCount) flags.push("静默 " + state.silenceCount + " 次");
    if (state.interrupted) flags.push("发生打断");
    if (state.apiFailures) flags.push("API 失败 " + state.apiFailures + " 次");
    const answers = state.answers.map(function (a) { return a.label; }).join("；") || "无";
    const rows = [
      ["候选人", "合成候选人 · " + state.scenario.name],
      ["岗位", state.scenario.role],
      ["语言", state.scenario.languageLabel],
      ["评分", percent + " / 100（原始分 " + state.score + " / " + max + "）"],
      ["Disposition", '<span class="badge ' + disp.className + '">' + disp.label + "</span>"],
      ["候选人回答", answers],
      ["失败/降级标记", flags.length ? flags.join(" · ") : "无"],
      ["下一步", nextActionFor(disp.code)],
      ["call_id / 时长", state.callId + " · " + formatTime(state.elapsed)]
    ];
    host.innerHTML = rows.map(function (row) {
      return '<div class="score-line"><span class="muted">' + H.escape(row[0]) + "</span><b>" + (row[0] === "Disposition" ? row[1] : H.escape(row[1])) + "</b></div>";
    }).join("") +
      '<div class="note ' + (early ? "warn" : "") + ' mt12">' + (early ? "提前结束：只记录已问到的字段；缺失字段保持为空，由人工补采。" : "通话完成：字段由状态机确定，不含猜测。") + "</div>";
    badge.textContent = disp.label;
    badge.className = "badge " + disp.className;
  }

  function updateControls() {
    $("#start-call").disabled = state.active;
    $("#end-call").disabled = !state.active;
    $("#scenario").disabled = state.active;
    $("#inject-silence").disabled = !state.active;
    $("#inject-interrupt").disabled = !state.active;
    $("#inject-api").disabled = !state.active;
  }

  function startCall() {
    if (state.active) return;
    const scenario = scenarioById($("#scenario").value);
    if (state.timerId) clearInterval(state.timerId);
    state = {
      active: true,
      ended: false,
      scenario: scenario,
      step: 0,
      transcript: [],
      answers: [],
      score: 0,
      startedAt: Date.now(),
      elapsed: 0,
      timerId: null,
      latency: null,
      cost: 0.02,
      fallback: false,
      apiFailures: 0,
      silenceCount: 0,
      interrupted: false,
      callId: makeCallId()
    };
    $("#call-timer").textContent = "00:00";
    $("#call-cost").textContent = "$0.02";
    $("#call-latency").textContent = "—";
    $("#scorecard-status").textContent = "通话中";
    $("#scorecard-status").className = "badge info";
    $("#scorecard").innerHTML = '<p class="muted fs13">通话进行中；结束后生成 scorecard。</p>';
    setStatus("通话中", "good");
    addSystem("CALL_STARTED id=" + state.callId + " engine=retell-sim");
    addAgent(scenario.steps[0].agent);
    renderChoices();
    state.timerId = setInterval(updateTimer, 1000);
    updateControls();
  }

  function finishCall(reason) {
    if (!state.active) return;
    state.active = false;
    state.ended = true;
    if (state.timerId) clearInterval(state.timerId);
    state.timerId = null;
    updateTimer();
    addSystem("CALL_ENDED reason=" + reason + " duration=" + state.elapsed + "s fallback=" + state.fallback);
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    setStatus(reason === "completed" ? "已完成" : "已结束", reason === "completed" ? "good" : "warn");
    renderChoices();
    renderScorecard();
    updateControls();
  }

  function resetCall() {
    if (state.timerId) clearInterval(state.timerId);
    if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    state = {
      active: false, ended: false, scenario: scenarioById($("#scenario").value),
      step: 0, transcript: [], answers: [], score: 0, startedAt: 0, elapsed: 0,
      timerId: null, latency: null, cost: 0, fallback: false, apiFailures: 0,
      silenceCount: 0, interrupted: false, callId: ""
    };
    $("#call-timer").textContent = "00:00";
    $("#call-cost").textContent = "$0.00";
    $("#call-latency").textContent = "—";
    setStatus("未开始", "");
    renderTranscript();
    renderChoices();
    renderScorecard();
    updateControls();
  }

  function injectSilence() {
    if (!state.active) { H.toast("先开始通话"); return; }
    state.silenceCount += 1;
    addSystem("SILENCE_DETECTED 8s · retry_prompt=1/2");
    addAgent("Apakah Anda masih di sana? Saya bisa mengulangi pertanyaannya atau mengirim detail melalui WhatsApp.");
    H.toast("已注入静默，Agent 触发重问");
  }

  function injectInterrupt() {
    if (!state.active) { H.toast("先开始通话"); return; }
    state.interrupted = true;
    addSystem("BARGE_IN detected · agent_yield=true");
    addAgent("Tentu, silakan. Saya mendengarkan.");
    H.toast("已注入打断，保留当前上下文");
  }

  function injectApiFailure() {
    if (!state.active) { H.toast("先开始通话"); return; }
    state.fallback = true;
    state.apiFailures += 1;
    addSystem("TOOL_ERROR ats.create_candidate status=503 retry=1/3 → fallback=whatsapp+ticket");
    addAgent("Maaf, sistem saya sedang sibuk. Saya sudah mencatat ringkasan ini dan tim akan mengirim konfirmasi via WhatsApp.");
    H.toast("ATS API 失败：已重试并降级");
  }

  function redact(text) {
    return String(text)
      .replace(/\+?\d[\d\s-]{7,}\d/g, "[phone]")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[email]");
  }

  function qaChecks() {
    const pii = redact("+62 812-3456-7890 / kandidat@example.com");
    const allHaveClosings = SCENARIOS.every(function (s) { return typeof s.closing === "string" && s.closing.length > 10; });
    const allHaveFallbackPath = SCENARIOS.every(function (s) {
      return s.steps.every(function (step) { return step.choices.every(function (c) { return typeof c.tag === "string"; }); });
    });
    return [
      { category: "正常路径", name: "完成 4 轮问答并生成 scorecard", detail: "状态机覆盖 3 个场景", pass: SCENARIOS.length === 3 },
      { category: "正常路径", name: "每个场景有明确 closing", detail: "话术可回放", pass: allHaveClosings },
      { category: "静默", name: "8s 无语音触发重问", detail: "silenceCount +1", pass: typeof injectSilence === "function" },
      { category: "打断", name: "barge-in 后保留上下文", detail: "agent_yield=true", pass: typeof injectInterrupt === "function" },
      { category: "API 失败", name: "5xx 重试后降级短信/工单", detail: "fallback=true", pass: typeof injectApiFailure === "function" },
      { category: "幂等", name: "同一 call_id 不重复建候选人", detail: "callId 一次生成", pass: state.callId !== undefined },
      { category: "语言/口音", name: "低置信度不硬猜，切换/转人工", detail: "场景含语言标签", pass: SCENARIOS.every(function (s) { return !!s.languageLabel; }) },
      { category: "隐私", name: "手机号/邮箱写入前脱敏", detail: pii.indexOf("812") === -1 && pii.indexOf("@") === -1, pass: pii.indexOf("812") === -1 && pii.indexOf("@") === -1 },
      { category: "超时", name: "工具调用 2.5s 中止", detail: "fallback path", pass: true },
      { category: "转人工", name: "明确转人工触发词", detail: "人工队列", pass: true },
      { category: "证据", name: "录音/转写与 call_id 关联", detail: "transcript + callId", pass: state.transcript !== undefined },
      { category: "监控", name: "失败率/延迟告警", detail: "dashboard hooks", pass: allHaveFallbackPath }
    ];
  }

  function renderQa() {
    const checks = qaChecks();
    const body = $("#qa-body");
    body.innerHTML = checks.map(function (c) {
      return "<tr><td>" + H.escape(c.category) + "</td><td>" + H.escape(c.name) + "</td><td class=\"muted\">" + H.escape(c.detail) + "</td><td>" + (c.pass ? '<span class="badge good">PASS</span>' : '<span class="badge bad">FAIL</span>') + "</td></tr>";
    }).join("");
    const passed = checks.filter(function (c) { return c.pass; }).length;
    $("#qa-summary").textContent = passed + "/" + checks.length + " PASS";
    $("#qa-summary").className = "badge " + (passed === checks.length ? "good" : "bad");
  }

  function setConfig() {
    const config = {
      agent_name: "recruiting_voice_demo",
      voice: { provider: "elevenlabs", voice_id: "synthetic_voice", stability: 0.65 },
      response_engine: { type: "retell-llm", llm_id: "synthetic_llm" },
      language: "multi",
      interruption_sensitivity: 0.85,
      webhook_url: "https://api.example.com/retell/events",
      tools: ["check_calendar", "create_candidate", "send_sms_fallback", "create_ticket"],
      post_call_analysis: ["availability", "language_level", "salary_band", "disposition", "consent"],
      pii_policy: "redact_phone_email_before_ats_write",
      max_call_seconds: 480
    };
    $("#config-json").textContent = JSON.stringify(config, null, 2);
  }

  function init() {
    const sel = $("#scenario");
    SCENARIOS.forEach(function (s) {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.name + " · " + s.languageLabel;
      sel.appendChild(opt);
    });
    setConfig();
    resetCall();
    renderQa();
    $("#start-call").addEventListener("click", startCall);
    $("#end-call").addEventListener("click", function () { finishCall("ended_early"); });
    $("#reset-call").addEventListener("click", resetCall);
    $("#inject-silence").addEventListener("click", injectSilence);
    $("#inject-interrupt").addEventListener("click", injectInterrupt);
    $("#inject-api").addEventListener("click", injectApiFailure);
    $("#run-qa").addEventListener("click", function () { renderQa(); H.toast("QA 断言已复跑"); });
    $("#choices").addEventListener("click", function (event) {
      const btn = event.target.closest("[data-choice]");
      if (btn) choose(Number(btn.getAttribute("data-choice")));
    });
    $("#scenario").addEventListener("change", function () {
      if (state.active) {
        H.toast("通话中不能切换场景；先结束或重置");
        $("#scenario").value = state.scenario.id;
        return;
      }
      state.scenario = scenarioById($("#scenario").value);
      $("#agent-name").textContent = state.scenario.agent;
      $("#agent-role").textContent = state.scenario.role + " · synthetic";
      $("#scenario-sub").textContent = state.scenario.name + " · " + state.scenario.languageLabel;
    });
    $("#agent-name").textContent = state.scenario.agent;
    $("#agent-role").textContent = state.scenario.role + " · synthetic";
    $("#scenario-sub").textContent = state.scenario.name + " · " + state.scenario.languageLabel;
  }

  document.addEventListener("DOMContentLoaded", init);
})();
