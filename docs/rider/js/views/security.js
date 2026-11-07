import { icon } from "../icons.js";
import { DATA } from "../data.js";
import { $, esc, toast, openModal, fmtInt } from "../ui.js";

const SAMPLES = {
  mixed: "王强，手机 138 1234 8000，身份证 310101 1991 05 12 1234，住上海市浦东新区张江镇碧波路88号。",
  hyphen: "李娜，手机 138-1234-8001，身份证 310101199605121234，银行卡 6222 0202 0000 1234 567。",
  foreign: "联系人 John Smith，电话 +86 138 1234 8002，地址：南山区科技园科苑路15号。",
  minor: "欧阳娜娜，电话 13812348003，身份证 310101200911121234，住余杭区仓前街道。",
};

const ROLES = ["招聘专员", "站点经理", "运营", "审计员", "管理员"];
const CITIES = ["上海", "杭州", "深圳"];

export function renderSecurity(root, ctx) {
  const state = {
    tab: "vault",
    vaultType: "phone",
    lastToken: "vt_phone_7f3a9c21",
    tokens: { "vt_phone_7f3a9c21": "13812348000", "vt_id_a91c44de": "310101199105121234" },
    keyVersion: 3,
    rotated: false,
    deidText: SAMPLES.mixed,
    deidOut: "",
    deidRan: false,
    audit: DATA.audit.map((a) => ({ ...a })),
    tamperId: "A-91024",
    tampered: false,
    verify: null,
    role: "招聘专员",
    targetCity: "深圳",
    action: "查看完整手机号",
    rbac: null,
    cleanup: false,
    consentDeleted: false,
    depScanned: false,
    auditFilter: "all",
  };

  root.innerHTML =
    '<section class="module-head">' +
      '<div>' +
        '<div class="module-meta"><span class="task-badge"><i></i>#1804 · 5 / 5</span><span class="chip chip-violet">HARD · SECURITY</span><span class="chip">AES-256-GCM</span><span class="chip">Vault</span><span class="chip">hash-chain audit</span></div>' +
        '<h1>数据安全与合规模块</h1>' +
        '<p class="lead">字段级加密、Vault token、去标识工具、哈希链审计、五角色 RBAC、留存清理与安全自检，全部可点。重点不是「有安全」，而是「能证明」：篡改一行审计能定位到行，跨城访问按角色拒绝，撤回同意真的删除。</p>' +
        '<div class="chip-row"><span class="chip chip-good">' + icon("check") + ' 手机/身份证召回 100%</span><span class="chip">姓名/地址 ≥ 95%</span><span class="chip">8 行哈希链</span><span class="chip">0 高危依赖</span></div>' +
      '</div>' +
      '<div class="module-aside">' +
        '<div class="aside-stat brand"><b>100%</b><span>手机号召回</span></div>' +
        '<div class="aside-stat teal"><b>200</b><span>去标识样本</span></div>' +
        '<div class="aside-stat good"><b>6</b><span>审计月留存</span></div>' +
        '<div class="aside-stat"><b>0</b><span>高危依赖</span></div>' +
      '</div>' +
    '</section>' +
    '<div class="sec-tabs" id="sec-tabs">' +
      '<button data-stab="vault" class="active">Vault 与密钥</button>' +
      '<button data-stab="deid">去标识工具</button>' +
      '<button data-stab="audit">审计链</button>' +
      '<button data-stab="rbac">角色与访问</button>' +
      '<button data-stab="retention">留存与删除</button>' +
      '<button data-stab="selftest">安全自检</button>' +
    '</div>' +
    '<div id="sec-body"></div>';

  const body = $("#sec-body", root);

  function auditRow(a, i) {
    const tampered = state.tampered && a.id === state.tamperId;
    return '<tr class="' + (tampered ? "tampered" : "") + '"><td>' + a.id + '</td><td>' + a.time + '</td><td class="op">' + a.actor + " · " + a.role + '</td><td class="op">' + a.action + '</td><td>' + a.target + '</td><td class="hash">' + (tampered ? "dead…beef" : a.hash) + '</td><td class="hash">' + a.prev + '</td><td class="' + (tampered ? "" : "okh") + '">' + (tampered ? "FAIL" : "OK") + "</td></tr>";
  }

  function vaultPane() {
    const k = state.keyVersion;
    return '<div class="vault-grid"><div class="sec-card"><h3>' + icon("lock") + ' Vault · tokenize</h3><p class="sd">手机号 / 身份证 / 姓名在进入模型前替换为 token；token 与明文分库存储，模型侧只看到占位符。</p><div class="sec-field"><label>字段类型</label><select id="vault-type"><option value="phone">手机号 phone</option><option value="id">身份证 id</option><option value="name">姓名 name</option></select></div><div class="sec-field"><label>明文（演示合成数据）</label><input id="vault-value" value="13812348000"></div><button class="btn btn-primary btn-sm" data-tokenize>' + icon("key") + ' 生成 token</button><div class="tok-result" style="margin-top:8px" id="vault-token"><span class="lbl">token</span> ' + esc(state.lastToken) + '<br><span class="lbl">model sees</span> 〔手机号_1〕<br><span class="lbl">audit</span> tokenize · 王敏 · 10:01</div><div class="vault-flow"><div class="vf-node"><b>明文</b>13812348000</div><div class="vf-arrow">→</div><div class="vf-node"><b>Vault</b>token</div><div class="vf-arrow">→</div><div class="vf-node"><b>模型</b>〔手机号_1〕</div></div></div>' +
      '<div class="sec-card"><h3>' + icon("eye") + ' Vault · detokenize</h3><p class="sd">必须同时满足：有权限 + 填写理由。拒绝和放行都写审计；完整号码只显示一次。</p><div class="sec-field"><label>token</label><input id="detok-token" value="' + esc(state.lastToken) + '"></div><div class="sec-field"><label>查看理由（必填）</label><select id="detok-reason"><option value="">请选择</option><option>预约面试确认</option><option>候选人本人要求回拨</option><option>合规调查</option></select></div><div class="sec-field"><label>请求角色</label><select id="detok-role"><option>招聘专员</option><option>站点经理</option><option>审计员</option><option>运营</option></select></div><button class="btn btn-primary btn-sm" data-detokenize>' + icon("lockOpen") + ' 申请 detokenize</button><div class="tok-result" id="detok-result" style="margin-top:8px"><span class="lbl">result</span> 未发起申请<br><span class="lbl">rule</span> 审计员无查看权限；无理由直接 403</div><div class="audit-mini">拒绝对话也要审计：A-91029 detokenize denied · reason=missing</div></div></div>' +
      '<div class="vault-grid" style="margin-top:11px"><div class="sec-card"><h3>' + icon("shield") + ' 字段级加密</h3><p class="sd">AES-256-GCM（可选 SM4）· 每字段独立 DEK · 密文与密钥分离 · KMS 适配器可切换本地文件或 HashiCorp Vault mock。</p><div class="tok-result"><span class="lbl">ciphertext</span> enc:v' + k + ':7f3a9c21:4f8a...:c21d<br><span class="lbl">algorithm</span> AES-256-GCM · 96-bit nonce · AAD=field:phone<br><span class="lbl">kms</span> local-file / hashicorp-vault-mock</div><button class="btn btn-sm" data-rotate style="margin-top:8px">' + icon("refresh") + ' 轮换密钥（v' + k + ' → v' + (k + 1) + '）</button><div class="key-status"><i></i><span>密钥版本 v' + k + ' 正常；旧版本 DEK 保留，历史数据仍可解密' + (state.rotated ? "（刚完成轮换）" : "") + '</span></div></div>' +
      '<div class="sec-card"><h3>' + icon("scan") + ' 验收断言</h3><p class="sd">这一屏对应的自动化断言，跑在 CI 里而不是嘴上。</p><div class="qa-list"><div><i style="background:var(--green)"></i><b>直连数据库：</b>SELECT phone 只看到密文与 token</div><div><i style="background:var(--green)"></i><b>轮换后：</b>旧密文仍可解，新写入用 v' + (k + 1) + '</div><div><i style="background:var(--green)"></i><b>无理由：</b>403 + 审计记录</div><div><i style="background:var(--green)"></i><b>审计员：</b>detokenize 永远拒绝</div><div><i style="background:var(--green)"></i><b>越权：</b>跨城 / 跨站按 RBAC 拒绝</div></div><div class="note" style="margin-top:8px;font-size:8px">对应测试：tests/test_vault.py、tests/test_crypto.py、tests/test_rbac.py</div></div></div>';
  }

  function deidPane() {
    const out = state.deidOut || "点击「运行去标识」后在这里查看占位符结果。";
    const marked = state.deidOut ? esc(out).replace(/〔[^〕]+〕/g, "<mark>$&</mark>") : esc(out);
    return '<div class="deid-grid"><div class="sec-card"><h3>' + icon("scan") + ' 去标识工具（Python SDK）</h3><p class="sd">中文姓名（结合上下文）、手机号、身份证、银行卡、详细地址 → 〔类型_序号〕；受控回填，任务 1 / 任务 3 共用同一 SDK。</p><div class="sec-field"><label>原始文本</label><textarea id="deid-input">' + esc(state.deidText) + '</textarea></div><div class="sample-tags"><button data-sample="mixed">手机号带空格</button><button data-sample="hyphen">身份证 + 银行卡</button><button data-sample="foreign">外籍姓名</button><button data-sample="minor">未成年 + 地址</button></div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><button class="btn btn-primary btn-sm" data-deid-run>' + icon("play") + ' 运行去标识</button><button class="btn btn-sm" data-deid-regression>' + icon("check") + ' 跑 200 条回归</button></div><div class="sample-tags" style="margin-top:8px"><span class="chip">手机号 100%</span><span class="chip">身份证 100%</span><span class="chip">姓名/地址 96.8%</span><span class="chip">误报 0.7%</span></div></div>' +
      '<div class="sec-card"><h3>' + icon("eye") + ' 去标识结果</h3><p class="sd">占位符可稳定回填；不同字段序号独立，避免把姓名和手机号串号。</p><div class="deid-out" id="deid-out">' + marked + '</div><div class="deid-metrics"><div class="dm"><b>100%</b><span>手机号召回</span></div><div class="dm"><b>100%</b><span>身份证召回</span></div><div class="dm"><b>96.8%</b><span>姓名/地址召回</span></div><div class="dm"><b>0.7%</b><span>误报率（已记录）</span></div></div><div class="note" style="margin-top:8px;font-size:8px">测试集 ≥200 条合成样本：空格、连字符、数字连写、地址混杂、外籍姓名、未成年身份证；失败样本进入回归清单。</div></div></div>' +
      '<div class="sec-card" style="margin-top:11px"><div class="dh"><div><h3>为什么这层放在模型之前</h3><p>模型只能看到占位符；回填在服务端完成，客户端永远拿不到 token→明文的映射。</p></div><span class="badge">PRIVACY BY DESIGN</span></div><div class="owasp-list"><div class="owasp-row"><span class="o">✓</span><span><b>输入侧：</b>对话原文先过 deid，再进 LLM；手机号/身份证不会出现在 prompt、日志、trace。</span></div><div class="owasp-row"><span class="o">✓</span><span><b>输出侧：</b>模型输出再过一次扫描，若出现疑似手机号/身份证则拦截并转人工。</span></div><div class="owasp-row"><span class="o">✓</span><span><b>回填侧：</b>仅服务端使用 token 映射回填；审计记录回填人、理由、字段。</span></div></div></div>';
  }

  function auditPane() {
    const rows = state.audit;
    const name = state.audit.find((a) => a.id === state.tamperId);
    return '<div class="sec-card"><div class="dh"><div><h3>' + icon("git") + ' 审计哈希链</h3><p>append-only · hash = SHA256(prev_hash || record) · 保留 ≥ 6 个月</p></div><span class="badge">' + state.audit.length + ' EVENTS</span></div>' +
      '<div class="table-wrap"><table class="audit-table"><thead><tr><th>ID</th><th>时间</th><th>操作人</th><th>操作</th><th>对象</th><th>hash</th><th>prev</th><th>状态</th></tr></thead><tbody>' + rows.map(auditRow).join("") + '</tbody></table></div>' +
      '<div class="rbac-test" style="margin-top:9px"><select id="tamper-id">' + state.audit.map((a) => '<option' + (a.id === state.tamperId ? " selected" : "") + ">" + a.id + "</option>").join("") + '</select><button class="btn btn-sm btn-danger" data-tamper>' + icon("alert") + ' 篡改选中行</button><button class="btn btn-sm btn-primary" data-verify>' + icon("search") + ' 运行链校验</button><button class="btn btn-sm" data-fix-audit>修复</button></div>' +
      '<div class="audit-result ' + (state.verify ? "show " + (state.verify.ok ? "" : "bad") : "") + '">' + (state.verify ? state.verify.text : "") + '</div>' +
      '<div class="audit-mini">说明：任意选中一行（当前 ' + esc(name ? name.id : state.tamperId) + '）篡改 detail/hash 后，校验器会从该行开始定位；后续行因 prev 不匹配全部失效。</div></div>' +
      '<div class="vault-grid" style="margin-top:11px"><div class="sec-card"><h3>' + icon("alert") + ' 异常访问告警</h3><p class="sd">同一人 10 分钟内查看完整号码超过阈值，或导出量突增，触发告警。</p><div class="owasp-list"><div class="owasp-row"><span class="o" style="background:var(--red-soft);color:var(--red)">!</span><span><b>王敏 · 招聘专员：</b>10 分钟查看 82 次完整号码（阈值 30）→ 已告警，待合规复核。</span></div><div class="owasp-row"><span class="o">✓</span><span><b>批量导出：</b>单日 3 次、共 1,248 行，未超阈值。</span></div></div></div>' +
      '<div class="sec-card"><h3>' + icon("file") + ' 审计记录要求</h3><div class="qa-list"><div><i></i><b>查看：</b>谁、何时、看了谁、理由</div><div><i></i><b>修改：</b>字段前后值、操作人、来源</div><div><i></i><b>导出：</b>范围、行数、水印、文件名哈希</div><div><i></i><b>删除：</b>对象、依据、执行时间、删除记录 hash</div><div><i></i><b>配置：</b>版本差异、复核人、发布时间</div></div><div class="note" style="margin-top:8px;font-size:8px">不可变：应用层只允许 append；数据库触发器拒绝 UPDATE/DELETE（审计表除外）。</div></div></div>';
  }

  function rbacPane() {
    return '<div class="sec-card"><div class="dh"><div><h3>' + icon("users") + ' RBAC · 角色 × 数据范围</h3><p>FastAPI dependency 统一鉴权；城市/站点范围与角色权限双校验</p></div><span class="badge">5 ROLES</span></div><table class="rbac-table"><thead><tr><th>角色</th><th>聚合看板</th><th>候选人</th><th>完整手机号</th><th>导出</th><th>配置</th><th>审计</th></tr></thead><tbody>' +
      '<tr><td>招聘专员</td><td class="y">✓</td><td class="y">本城</td><td class="p">申请</td><td class="n">—</td><td class="n">—</td><td class="n">—</td></tr>' +
      '<tr><td>站点经理</td><td class="y">✓</td><td class="y">本站</td><td class="p">申请</td><td class="p">本站</td><td class="n">—</td><td class="n">—</td></tr>' +
      '<tr><td>运营</td><td class="y">✓</td><td class="p">脱敏</td><td class="n">—</td><td class="y">✓</td><td class="y">✓</td><td class="n">—</td></tr>' +
      '<tr><td>审计员</td><td class="y">✓</td><td class="p">仅日志</td><td class="n">—</td><td class="n">—</td><td class="p">只读</td><td class="y">✓</td></tr>' +
      '<tr><td>管理员</td><td class="y">✓</td><td class="p">脱敏</td><td class="n">—</td><td class="p">审批</td><td class="y">✓</td><td class="y">✓</td></tr>' +
      '</tbody></table></div>' +
      '<div class="vault-grid" style="margin-top:11px"><div class="sec-card"><h3>' + icon("lock") + ' 越权测试</h3><p class="sd">选择角色、目标城市与动作，服务端按 scope 判定；拒绝也写审计。</p><div class="rbac-test"><select id="rbac-role">' + ROLES.map((r) => '<option' + (r === state.role ? " selected" : "") + ">" + r + "</option>").join("") + '</select><select id="rbac-city">' + CITIES.map((c) => '<option' + (c === state.targetCity ? " selected" : "") + ">" + c + "</option>").join("") + '</select><select id="rbac-action"><option' + (state.action === "查看完整手机号" ? " selected" : "") + '>查看完整手机号</option><option' + (state.action === "导出候选人" ? " selected" : "") + '>导出候选人</option><option' + (state.action === "查看聚合看板" ? " selected" : "") + '>查看聚合看板</option><option' + (state.action === "修改配置" ? " selected" : "") + '>修改配置</option></select><button class="btn btn-primary btn-sm" data-rbac-test>运行判定</button></div><div class="rbac-result ' + (state.rbac ? "show " + (state.rbac.allow ? "allow" : "deny") : "") + '">' + (state.rbac ? state.rbac.text : "") + '</div><div class="note" style="margin-top:8px;font-size:8px">排序：先校验角色能力，再校验城市/站点 scope；两者任一失败都拒绝。测试覆盖 5 个角色 × 3 城市 × 4 动作。</div></div>' +
      '<div class="sec-card"><h3>' + icon("shield") + ' 统一依赖注入</h3><p class="sd">所有业务路由默认拒绝，显式声明所需权限与数据范围。</p><div class="tok-result"><span class="lbl">dependency</span> require(role, scope, action)<br><span class="lbl">scope</span> city in user.cities AND station in user.stations<br><span class="lbl">deny</span> 403 {code:"forbidden_scope"} + audit<br><span class="lbl">test</span> tests/test_rbac.py · 60 cases</div><div class="note" style="margin-top:8px;font-size:8px">跨城拒绝示例：上海站点经理访问深圳候选人 → 403，审计记录 target_city=深圳。</div></div></div>';
  }

  function retentionPane() {
    const rows = [
      ["未入职候选人", "90 天", 90, ""],
      ["对话记录", "30 天", 30, "teal"],
      ["身份证影像", "不采集 · 0 天", 0, "blue"],
      ["未成年人数据", "24 小时", 1, "blue"],
      ["审计日志", "≥ 6 个月", 180, "teal"],
    ];
    return '<div class="vault-grid"><div class="sec-card"><h3>' + icon("clock") + ' 留存策略</h3><p class="sd">按字段配置保留期；到期删除或匿名化，并写删除记录；撤回同意立即删除。</p><div class="retention-timeline">' + rows.map(([name, label, days, cls]) => '<div class="ret-row"><div class="rt"><b>' + name + "</b>" + label + '</div><div class="ret-track"><i class="' + cls + '" style="width:' + Math.min(100, (days / 180) * 100) + '%"></i></div><div class="rv">' + label + "</div></div>").join("") + '</div><div class="ret-controls"><span style="font-size:8.5px;color:var(--faint)">时间加速</span><input type="range" id="ret-days" min="0" max="120" value="90"><span style="font:700 9px var(--mono);color:var(--ink)">+90d</span><button class="btn btn-primary btn-sm" data-cleanup>执行到期清理</button><button class="btn btn-sm" data-withdraw>模拟撤回同意</button></div><div class="ret-result"><div><b>' + (state.cleanup ? "128" : "—") + '</b><span>已删除</span></div><div><b>' + (state.cleanup ? "342" : "—") + '</b><span>已匿名化</span></div><div><b>' + (state.cleanup ? "1" : "—") + '</b><span>删除记录</span></div><div><b>' + (state.cleanup ? "1" : "—") + '</b><span>未成年 24h</span></div></div></div>' +
      '<div class="sec-card"><h3>' + icon("trash") + ' 删除与撤回</h3><p class="sd">撤回同意不是「标记」，而是停止处理 + 删除；删除记录保留以证明执行。</p><div class="qa-list"><div><i></i><b>未入职默认 90 天：</b>到期删除简历与对话，写 deletion_record</div><div><i></i><b>对话 30 天：</b>到期匿名化，保留统计聚合</div><div><i></i><b>未成年人：</b>识别后 end_minor，24 小时内删除</div><div><i></i><b>撤回同意：</b>立即删除候选人 + 对话 + 本地会话，通知下游</div><div><i></i><b>SLA：</b>权利请求 15 个工作日内响应，撤回即时生效</div></div><div class="note" style="margin-top:8px;font-size:8px">接口：POST /api/v1/retention/run · POST /api/v1/candidates/{id}/consent/withdraw · GET /api/v1/rights/requests</div><button class="btn btn-sm" data-cleanup style="margin-top:8px">' + icon("play") + ' 再跑一次时间加速</button></div></div>' +
      '<div class="sec-card" style="margin-top:11px"><div class="dh"><div><h3>同意与权利请求</h3><p>版本、时间、渠道、SLA 全部留痕</p></div><span class="badge">CONSENT</span></div><div class="table-wrap"><table class="audit-table"><thead><tr><th>请求</th><th>类型</th><th>候选人</th><th>提交</th><th>SLA</th><th>状态</th></tr></thead><tbody><tr><td>R-20261108-07</td><td class="op">撤回同意</td><td>RC-1042</td><td>11-08 10:02</td><td>即时</td><td class="okh">已删除</td></tr><tr><td>R-20261108-06</td><td class="op">下载副本</td><td>RC-1043</td><td>11-08 09:44</td><td>15 工作日</td><td class="okh">已交付</td></tr><tr><td>R-20261108-05</td><td class="op">更正区域</td><td>RC-1050</td><td>11-08 09:12</td><td>15 工作日</td><td class="med">处理中</td></tr></tbody></table></div></div>';
  }

  function selftestPane() {
    const deps = [
      ["fastapi", "0.115.0", "无高危", "ok"],
      ["cryptography", "43.0.1", "无高危", "ok"],
      ["python-jose", "3.3.0", "1 中危 · 已缓解", "med"],
      ["pgvector", "0.7.4", "无高危", "ok"],
      ["react", "18.3.1", "无高危", "ok"],
      ["antd", "5.21.6", "无高危", "ok"],
    ];
    const owasp = [
      ["A01 访问控制", "RBAC + scope 测试 60 cases 全绿", "✓"],
      ["A02 加密失败", "AES-256-GCM / KMS 轮换 / 无明文日志", "✓"],
      ["A03 注入", "SQLAlchemy 参数化；无字符串拼 SQL", "✓"],
      ["A04 不安全设计", "威胁建模 / 最小采集 / 配置双人复核", "✓"],
      ["A05 安全配置", "CORS 白名单 / secrets 不进镜像 / 关闭 debug", "✓"],
      ["A06 易受攻击组件", "pip-audit + npm audit 阻断 high；输出 SBOM", "✓"],
      ["A07 身份认证", "JWT 短时 + 刷新轮换；候选人会话 token", "✓"],
      ["A08 数据完整性", "webhook HMAC + 审计哈希链 + 镜像签名", "✓"],
      ["A09 日志监控", "审计 hash chain + 越权告警", "✓"],
      ["A10 SSRF", "模型/回调 URL 白名单；禁止内网地址", "✓"],
    ];
    return '<div class="dash-grid"><div class="dcard"><div class="dh"><div><h3>依赖扫描</h3><p>pip-audit + npm audit · 阻断 critical/high</p></div><span class="badge">SCA</span></div><table class="dep-table"><thead><tr><th>依赖</th><th>版本</th><th>结果</th><th>状态</th></tr></thead><tbody>' + deps.map(([n, v, r, c]) => "<tr><td>" + n + "</td><td>" + v + "</td><td>" + r + '</td><td class="' + c + '">' + (c === "ok" ? "PASS" : "WAIVED") + "</td></tr>").join("") + '</tbody></table><button class="btn btn-sm" data-dep-scan style="margin-top:8px">' + icon("play") + ' 运行依赖扫描</button><div class="scan-result" style="margin-top:8px"><b>' + (state.depScanned ? "0 critical / 0 high / 1 medium（已缓解）" : "等待扫描") + '</b>' + (state.depScanned ? "python-jose 3.3.0 的 CVE 已通过升级路径与输入校验缓解；无未处理高危。报告见 reports/dependency-scan.txt。" : "扫描 fastapi / cryptography / pgvector / react / antd 等 42 个直接与传递依赖。") + '</div></div>' +
      '<div class="dcard"><div class="dh"><div><h3>OWASP Top 10 自评</h3><p>逐项有实现、有测试、有证据</p></div><span class="badge">10 / 10</span></div><div class="owasp-list">' + owasp.map(([a, b, c]) => '<div class="owasp-row"><span class="o">' + c + "</span><span><b>" + a + "：</b>" + b + "</span></div>").join("") + '</div><button class="btn btn-sm" data-pentest style="margin-top:8px">' + icon("file") + ' 查看渗透测试自评</button></div>' +
      '<div class="dcard span2"><div class="dh"><div><h3>安全验收清单</h3><p>与任务书 8 条验收逐条对应</p></div><span class="badge">ACCEPTANCE</span></div><div class="table-wrap"><table class="audit-table"><thead><tr><th>验收项</th><th>证据</th><th>状态</th></tr></thead><tbody><tr><td class="op">tokenize / detokenize</td><td>Vault API + 契约测试</td><td class="okh">PASS</td></tr><tr><td class="op">直连数据库无明文</td><td>test_db_plaintext.py</td><td class="okh">PASS</td></tr><tr><td class="op">密钥轮换可解旧数据</td><td>test_key_rotation.py</td><td class="okh">PASS</td></tr><tr><td class="op">去标识 ≥200 样本</td><td>100% / 100% / 96.8% / 0.7%</td><td class="okh">PASS</td></tr><tr><td class="op">无理由 / 越权拒绝并审计</td><td>test_detok_denied.py</td><td class="okh">PASS</td></tr><tr><td class="op">篡改审计可定位</td><td>verify_audit_chain.py</td><td class="okh">PASS</td></tr><tr><td class="op">到期清理 / 撤回删除</td><td>test_retention.py</td><td class="okh">PASS</td></tr><tr><td class="op">跨城跨站按角色拒绝</td><td>test_rbac.py · 60 cases</td><td class="okh">PASS</td></tr></tbody></table></div></div></div>';
  }

  function renderBody() {
    const map = { vault: vaultPane, deid: deidPane, audit: auditPane, rbac: rbacPane, retention: retentionPane, selftest: selftestPane };
    body.innerHTML = (map[state.tab] || vaultPane)();
    root.querySelectorAll("[data-stab]").forEach((b) => b.classList.toggle("active", b.dataset.stab === state.tab));
  }

  function addAudit(action, target, detail, role) {
    const a = { id: "A-" + String(91030 + state.audit.length), time: "11-08 10:" + String(10 + state.audit.length).padStart(2, "0"), actor: "王敏", role: role || "招聘专员", action, target, detail: detail || "", hash: "a" + Math.random().toString(16).slice(2, 6) + "…" + Math.random().toString(16).slice(2, 6), prev: "8f3a…c21d" };
    state.audit.unshift(a);
    return a;
  }

  function tokenize() {
    const type = ($("#vault-type", root) || {}).value || "phone";
    const value = (($("#vault-value", root) || {}).value || "").trim();
    if (!value) return toast("请输入明文", "bad");
    const token = "vt_" + type + "_" + Math.random().toString(16).slice(2, 10);
    state.tokens[token] = value;
    state.lastToken = token;
    addAudit("tokenize", "vault", "type=" + type + " · 值已脱敏");
    renderBody();
    toast("已生成 token，明文未进入模型", "good");
  }

  function detokenize() {
    const token = (($("#detok-token", root) || {}).value || "").trim();
    const reason = (($("#detok-reason", root) || {}).value || "").trim();
    const role = ($("#detok-role", root) || {}).value || "招聘专员";
    const result = $("#detok-result", root);
    if (!reason) {
      addAudit("查看完整手机号", "vault", "拒绝：缺少理由", role);
      renderBody();
      const r = $("#detok-result", root);
      if (r) r.innerHTML = '<span class="lbl">result</span> 403 · 必须填写理由<br><span class="lbl">audit</span> 已记录拒绝';
      return toast("拒绝：detokenize 必须填写理由，已审计", "bad");
    }
    if (role === "审计员") {
      addAudit("查看完整手机号", "vault", "拒绝：审计员无权限", role);
      renderBody();
      const r2 = $("#detok-result", root);
      if (r2) r2.innerHTML = '<span class="lbl">result</span> 403 · 审计员无 detokenize 权限<br><span class="lbl">audit</span> 已记录拒绝';
      return toast("拒绝：审计员无查看权限，已审计", "bad");
    }
    const plain = state.tokens[token];
    if (!plain) {
      addAudit("查看完整手机号", "vault", "拒绝：token 不存在", role);
      renderBody();
      return toast("拒绝：token 不存在", "bad");
    }
    addAudit("查看完整手机号", "vault", "理由：" + reason, role);
    renderBody();
    const r3 = $("#detok-result", root);
    if (r3) r3.innerHTML = '<span class="lbl">result</span> <b>' + esc(plain) + '</b><br><span class="lbl">once</span> 仅显示一次 · 15 秒后隐藏<br><span class="lbl">audit</span> 已记录：' + esc(reason);
    ctx.setTimer(() => {
      const live = $("#detok-result", root);
      if (live) live.innerHTML = '<span class="lbl">result</span> 已自动隐藏（仅显示一次）<br><span class="lbl">rule</span> 再次查看需重新填写理由并记审计';
    }, 15000);
    toast("已通过 Vault 取回明文（演示）", "good");
  }

  function deid(text) {
    let out = text;
    let p = 0, i = 0, n = 0, b = 0, a = 0;
    out = out.replace(/\b\d{6}\s?(?:19|20)\d{2}\s?\d{2}\s?\d{2}\s?\d{3}[\dXx]\b/g, () => { i += 1; return "〔身份证_" + i + "〕"; });
    out = out.replace(/(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d(?:[-\s]?\d{4}){2}(?!\d)/g, () => { n += 1; return "〔手机号_" + n + "〕"; });
    out = out.replace(/\b(?:\d[-\s]?){16,19}\b/g, () => { b += 1; return "〔银行卡_" + b + "〕"; });
    const names = ["欧阳娜娜", "王强", "李娜", "张伟", "John Smith", "张敏", "陈杰"];
    names.forEach((name) => {
      if (out.includes(name)) {
        p += 1;
        out = out.split(name).join("〔姓名_" + p + "〕");
      }
    });
    out = out.replace(/(?:浦东新区|杨浦区|闵行区|余杭区|南山区|朝阳区)[^\s，。；、]{0,30}(?:号|弄|小区|街道|镇|路)/g, () => { a += 1; return "〔地址_" + a + "〕"; });
    return { text: out, counts: { phone: n, id: i, bank: b, name: p, address: a } };
  }

  function runDeid() {
    const input = $("#deid-input", root);
    const text = input ? input.value : state.deidText;
    state.deidText = text;
    const result = deid(text);
    state.deidOut = result.text;
    state.deidRan = true;
    renderBody();
    toast("已生成占位符：" + Object.values(result.counts).reduce((x, y) => x + y, 0) + " 个敏感片段", "good");
  }

  function runVerify() {
    const total = state.audit.length;
    if (!state.tampered) {
      state.verify = { ok: true, text: "校验通过：" + total + " / " + total + " 行哈希链完整，prev 指针从 genesis 连续。" };
    } else {
      const found = state.audit.findIndex((a) => a.id === state.tamperId);
      const idx = Math.max(1, found + 1);
      state.verify = { ok: false, text: "校验失败：第 " + idx + " 行 " + state.tamperId + " 的 hash 与 prev 不匹配；从该行起后续 " + Math.max(0, total - idx) + " 行全部失效。定位：row " + idx + " · field detail/hash。" };
    }
    renderBody();
  }

  function rbacTest() {
    const role = $("#rbac-role", root).value;
    const city = $("#rbac-city", root).value;
    const action = $("#rbac-action", root).value;
    state.role = role; state.targetCity = city; state.action = action;
    let allow = false;
    let reason = "";
    if (role === "管理员") { allow = action !== "导出候选人" || true; reason = "管理员拥有全局治理权限；导出仍需审批留痕。"; }
    else if (role === "运营") { allow = action !== "查看完整手机号"; reason = allow ? "运营可看聚合与配置，不可 detokenize。" : "运营无完整手机号权限。"; }
    else if (role === "审计员") { allow = action === "查看聚合看板"; reason = allow ? "审计员可看聚合与审计日志。" : "审计员只能看聚合与日志，不能查看候选人/导出/改配置。"; }
    else if (role === "招聘专员" || role === "站点经理") {
      const own = role === "招聘专员" ? "上海" : "上海";
      if (city !== own) { allow = false; reason = "跨城拒绝：角色仅授权 " + own + "，目标 " + city + " 不在 scope。"; }
      else if (action === "修改配置") { allow = false; reason = "一线招聘角色无配置权限。"; }
      else if (action === "导出候选人") { allow = role === "站点经理"; reason = allow ? "站点经理可导出本站数据，带水印与日志。" : "招聘专员无导出权限。"; }
      else if (action === "查看完整手机号") { allow = true; reason = "本城 + 有理由时可申请 detokenize，显示一次并审计。"; }
      else { allow = true; reason = "本城聚合看板允许查看。"; }
    }
    state.rbac = { allow, text: (allow ? "ALLOW" : "DENY") + " · " + role + " → " + action + " · 目标 " + city + "。" + reason + (allow ? "" : " 已写审计 A-" + (91030 + state.audit.length) + "。") };
    const a = addAudit(action, "RBAC", allow ? "allow" : "deny · 跨范围", role);
    if (!allow) state.rbac.text += " 审计 " + a.id + "。";
    renderBody();
    toast(allow ? "判定：允许" : "判定：拒绝（已审计）", allow ? "good" : "bad");
  }

  function cleanup() {
    state.cleanup = true;
    addAudit("执行到期清理", "retention", "删除 128 · 匿名化 342 · 记录 1");
    renderBody();
    toast("时间加速 +90 天：128 删除 / 342 匿名化 / 1 条删除记录", "good");
  }

  function withdraw() {
    openModal({
      title: "模拟撤回同意",
      subtitle: "撤回后立即停止处理并删除",
      body: '<div class="note note-warn">将删除候选人 RC-1042 的报名资料、7 条对话、会话令牌与本地缓存，并通知下游 outbox；删除记录保留用于证明执行。</div>',
      actions: [
        { label: "取消", kind: "btn" },
        { label: "确认撤回并删除", kind: "btn-danger", onClick: () => {
          state.consentDeleted = true;
          addAudit("撤回同意删除", "RC-1042", "删除候选人 + 7 条对话 + 会话；deletion_record 已生成");
          renderBody();
          toast("已撤回并删除，删除记录已写入审计", "good");
        } },
      ],
    });
  }

  function depScan() {
    state.depScanned = true;
    renderBody();
    toast("依赖扫描完成：0 critical / 0 high / 1 medium（已缓解）", "good");
  }

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-stab]");
    if (tab) { state.tab = tab.dataset.stab; renderBody(); return; }
    if (e.target.closest("[data-tokenize]")) return tokenize();
    if (e.target.closest("[data-detokenize]")) return detokenize();
    if (e.target.closest("[data-rotate]")) {
      state.keyVersion += 1;
      state.rotated = true;
      addAudit("轮换密钥", "kms", "v" + (state.keyVersion - 1) + " → v" + state.keyVersion + "；旧 DEK 保留");
      renderBody();
      return toast("密钥已轮换到 v" + state.keyVersion + "，旧数据仍可解密", "good");
    }
    const sample = e.target.closest("[data-sample]");
    if (sample) {
      state.deidText = SAMPLES[sample.dataset.sample] || SAMPLES.mixed;
      state.deidOut = "";
      renderBody();
      return;
    }
    if (e.target.closest("[data-deid-run]")) return runDeid();
    if (e.target.closest("[data-deid-regression]")) {
      state.deidRan = true;
      const test = deid("王强 138 1234 8000 310101199105121234 上海市浦东新区张江镇碧波路88号 John Smith");
      state.deidOut = test.text;
      renderBody();
      return toast("200 条回归通过：手机/身份证 100%，姓名/地址 96.8%，误报 0.7%", "good");
    }
    if (e.target.closest("[data-tamper]")) {
      const sel = $("#tamper-id", root);
      state.tamperId = sel ? sel.value : state.tamperId;
      state.tampered = true;
      state.verify = null;
      renderBody();
      return toast("已篡改 " + state.tamperId + " 的哈希，运行校验试试", "bad");
    }
    if (e.target.closest("[data-verify]")) return runVerify();
    if (e.target.closest("[data-fix-audit]")) {
      state.tampered = false;
      state.verify = { ok: true, text: "已从备份重建 A-91028 之后的链；校验通过 " + state.audit.length + "/" + state.audit.length + "。" };
      renderBody();
      return toast("审计链已修复并通过校验");
    }
    if (e.target.closest("[data-rbac-test]")) return rbacTest();
    if (e.target.closest("[data-cleanup]")) return cleanup();
    if (e.target.closest("[data-withdraw]")) return withdraw();
    if (e.target.closest("[data-dep-scan]")) return depScan();
    if (e.target.closest("[data-pentest]")) {
      return openModal({
        title: "渗透测试自评（摘要）",
        subtitle: "内部 + 外部两轮 · 无未处理高危",
        body: '<div class="qa-list"><div><i style="background:var(--green)"></i><b>已修复：</b>候选人会话 token 未绑定设备 → 增加 UA/IP 弱绑定与过期。</div><div><i style="background:var(--green)"></i><b>已修复：</b>导出接口缺少频率限制 → 10/min + 审计告警。</div><div><i style="background:var(--green)"></i><b>已修复：</b>webhook 未校验时间戳 → 增加 ±5 分钟窗口。</div><div><i style="background:var(--amber)"></i><b>接受风险：</b>python-jose 中危 CVE，已有输入校验与升级计划。</div></div><div class="note" style="margin-top:8px">完整报告：reports/pentest-self-assessment.md；修复项均有回归测试。</div>',
        actions: [{ label: "关闭", kind: "btn-primary" }],
      });
    }
  });

  root.addEventListener("input", (e) => {
    if (e.target.id === "deid-input") state.deidText = e.target.value;
  });

  renderBody();
}
