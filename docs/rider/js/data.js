/* Synthetic demo data. Every person, phone number and record is fabricated. */
export const DATA = {
  meta: {
    project: "骑手招聘 Agent 化信息收集平台",
    version: "demo-2026.11.08",
    tasks: ["1808", "1807", "1806", "1805", "1804"],
    priceNote: "演示数据 · 不包含真实个人信息",
  },

  stations: [
    { id: "ST-01", name: "张江站", city: "上海", address: "浦东新区张江路 88 号", distance: 2.4, open: 8, capacity: 28, used: 20, slots: ["11-09 10:00", "11-09 14:00", "11-10 09:30", "11-10 15:00"] },
    { id: "ST-02", name: "五角场站", city: "上海", address: "杨浦区淞沪路 199 号", distance: 6.1, open: 22, capacity: 30, used: 8, slots: ["11-09 09:30", "11-09 13:30", "11-10 10:00"] },
    { id: "ST-03", name: "余杭站", city: "杭州", address: "余杭区文一西路 969 号", distance: 1.8, open: 9, capacity: 24, used: 15, slots: ["11-09 10:30", "11-10 09:00", "11-10 14:00"] },
    { id: "ST-04", name: "南山站", city: "深圳", address: "南山区科技园科苑路 15 号", distance: 3.2, open: 3, capacity: 30, used: 27, slots: ["11-09 11:00", "11-09 16:00"] },
    { id: "ST-05", name: "虹桥站", city: "上海", address: "闵行区申长路 688 号", distance: 8.7, open: 14, capacity: 26, used: 12, slots: ["11-09 10:00", "11-10 13:00"] },
  ],

  candidates: [
    { id: "RC-1042", name: "张伟", masked: "张*", phone: "13800000001", maskedPhone: "138****0001", source: "抖音", city: "上海", station: "张江站", status: "complete", intent: 92, updated: "11-08 09:42", job: "全职", birth: "1991-05", area: "浦东新区张江", ebike: "有", start: "11-10 可到岗", exp: "2 年外卖配送", health: "holding", age: 35, note: "有电动车，住张江，通勤 15 分钟；对夜班接受度高。" },
    { id: "RC-1043", name: "李娜", masked: "李*", phone: "13800000002", maskedPhone: "138****0002", source: "58同城", city: "上海", station: "五角场站", status: "booked", intent: 88, updated: "11-08 09:31", job: "兼职", birth: "1996-11", area: "杨浦区五角场", ebike: "有", start: "周末可到岗", exp: "1 年商超配送", health: "processing", age: 30, note: "兼职周末时段，已预约 11-09 09:30 面试。" },
    { id: "RC-1044", name: "王强", masked: "王*", phone: "13800000003", maskedPhone: "138****0003", source: "门店二维码", city: "上海", station: "张江站", status: "interviewed", intent: 84, updated: "11-08 09:18", job: "全职", birth: "1989-02", area: "浦东新区金桥", ebike: "有", start: "随时", exp: "3 年快递", health: "holding", age: 37, note: "面试已完成，站点反馈沟通清晰，待确认入职日期。" },
    { id: "RC-1045", name: "赵敏", masked: "赵*", phone: "13800000004", maskedPhone: "138****0004", source: "快手", city: "杭州", station: "余杭站", status: "collecting", intent: 71, updated: "11-08 09:04", job: "全职", birth: "1998-08", area: "余杭区仓前", ebike: "没有", start: "本月内", exp: "无配送经验", health: "unknown", age: 28, note: "缺车辆与健康证，需推荐租车方案并跟进体检。" },
    { id: "RC-1046", name: "陈杰", masked: "陈*", phone: "13800000005", maskedPhone: "138****0005", source: "转介绍", city: "上海", station: "虹桥站", status: "hired", intent: 96, updated: "11-07 18:22", job: "全职", birth: "1993-06", area: "闵行区虹桥", ebike: "有", start: "已到岗", exp: "4 年配送", health: "holding", age: 33, note: "11-07 已入职，老骑手转介绍。" },
    { id: "RC-1047", name: "刘洋", masked: "刘*", phone: "13800000006", maskedPhone: "138****0006", source: "抖音", city: "深圳", station: "南山站", status: "complete", intent: 79, updated: "11-08 08:55", job: "全职", birth: "1995-12", area: "南山区科技园", ebike: "有", start: "下周", exp: "1 年外卖", health: "holding", age: 31, note: "南山站名额紧张，建议优先安排 11-09 上午面试。" },
    { id: "RC-1048", name: "周婷", masked: "周*", phone: "13800000007", maskedPhone: "138****0007", source: "短信召回", city: "上海", station: "五角场站", status: "handoff", intent: 63, updated: "11-08 08:40", job: "兼职", birth: "2000-03", area: "杨浦区控江路", ebike: "没有", start: "未确定", exp: "无", health: "none", age: 26, note: "对收入政策有疑问，已转人工，等待站长回拨。" },
    { id: "RC-1049", name: "吴磊", masked: "吴*", phone: "13800000008", maskedPhone: "138****0008", source: "58同城", city: "杭州", station: "余杭站", status: "rejected", intent: 38, updated: "11-07 17:12", job: "全职", birth: "1987-09", area: "余杭区良渚", ebike: "有", start: "本月内", exp: "无", health: "none", age: 39, note: "标记不合适：通勤距离超过 20 公里，站点无法保障早班到岗。" },
    { id: "RC-1050", name: "郑凯", masked: "郑*", phone: "13800000009", maskedPhone: "138****0009", source: "门店二维码", city: "上海", station: "张江站", status: "booked", intent: 87, updated: "11-08 08:21", job: "全职", birth: "1992-10", area: "浦东新区唐镇", ebike: "有", start: "11-11 可到岗", exp: "2 年同城配送", health: "holding", age: 34, note: "已预约 11-09 14:00，提醒携带健康证。" },
    { id: "RC-1051", name: "孙悦", masked: "孙*", phone: "13800000010", maskedPhone: "138****0010", source: "快手", city: "深圳", station: "南山站", status: "collecting", intent: 66, updated: "11-08 08:10", job: "兼职", birth: "2001-07", area: "南山区西丽", ebike: "有", start: "周末", exp: "无", health: "processing", age: 25, note: "兼职时段时间匹配，待补健康证照片。" },
    { id: "RC-1052", name: "何静", masked: "何*", phone: "13800000011", maskedPhone: "138****0011", source: "转介绍", city: "上海", station: "虹桥站", status: "complete", intent: 90, updated: "11-08 07:58", job: "全职", birth: "1990-04", area: "闵行区七宝", ebike: "有", start: "随时", exp: "5 年配送", health: "holding", age: 36, note: "经验丰富，建议直接进入站长面试。" },
    { id: "RC-1053", name: "林峰", masked: "林*", phone: "13800000012", maskedPhone: "138****0012", source: "短信召回", city: "杭州", station: "余杭站", status: "new", intent: 52, updated: "11-08 07:40", job: "未定", birth: "1994-01", area: "余杭区未来科技城", ebike: "未知", start: "未确定", exp: "无", health: "unknown", age: 32, note: "刚进入线索池，等待 Agent 首轮触达。" },
    { id: "RC-1054", name: "马超", masked: "马*", phone: "13800000013", maskedPhone: "138****0013", source: "抖音", city: "上海", station: "五角场站", status: "booked", intent: 82, updated: "11-08 07:22", job: "全职", birth: "1997-05", area: "杨浦区新江湾城", ebike: "没有", start: "本周", exp: "1 年餐饮", health: "processing", age: 29, note: "无车，已推荐站点合作租车；预约 11-09 13:30。" },
    { id: "RC-1055", name: "高翔", masked: "高*", phone: "13800000014", maskedPhone: "138****0014", source: "58同城", city: "深圳", station: "南山站", status: "complete", intent: 75, updated: "11-08 07:05", job: "全职", birth: "1999-09", area: "南山区蛇口", ebike: "有", start: "下周", exp: "无", health: "holding", age: 27, note: "南山站名额仅剩 3 个，需尽快锁定面试时段。" },
  ],

  kpis: [
    { key: "进线人数", value: 12480, display: "12,480", unit: "", delta: "+12.4%", up: true, spark: [62, 68, 64, 72, 70, 76, 81, 78, 84, 88, 86, 92, 95, 98] },
    { key: "AI 接待率", value: 98.2, display: "98.2", unit: "%", delta: "+1.1pt", up: true, spark: [91, 92, 93, 92, 94, 95, 94, 96, 96, 97, 97, 98, 98, 98] },
    { key: "报名完整率", value: 76.4, display: "76.4", unit: "%", delta: "+4.8pt", up: true, spark: [58, 61, 60, 64, 66, 65, 69, 70, 72, 71, 74, 75, 76, 76] },
    { key: "AI 首响", value: 1.8, display: "1.8", unit: "s", delta: "P95 4.6s", up: false, spark: [2.8, 2.6, 2.5, 2.4, 2.3, 2.1, 2.2, 2.0, 1.9, 1.9, 1.8, 1.8, 1.7, 1.8] },
    { key: "预约到面率", value: 61.3, display: "61.3", unit: "%", delta: "+2.2pt", up: true, spark: [50, 52, 51, 54, 55, 57, 56, 58, 59, 60, 59, 61, 61, 61] },
    { key: "转人工率", value: 7.8, display: "7.8", unit: "%", delta: "-0.9pt", up: true, spark: [12, 11, 11, 10, 10, 9.5, 9.2, 9.0, 8.8, 8.5, 8.2, 8.0, 7.9, 7.8] },
    { key: "入职人数", value: 1126, display: "1,126", unit: "", delta: "+8.6%", up: true, spark: [42, 46, 48, 52, 55, 58, 62, 65, 70, 74, 78, 82, 86, 90] },
  ],

  funnel: [
    { label: "进线", value: 12480, width: 100, rate: "100%" },
    { label: "完成报名", value: 9535, width: 76.4, rate: "76.4%" },
    { label: "预约面试", value: 5841, width: 61.3, rate: "61.3%" },
    { label: "实际到面", value: 3580, width: 61.3, rate: "61.3%" },
    { label: "入职", value: 1126, width: 31.5, rate: "31.5%" },
  ],

  channels: [
    { name: "抖音", leads: 4820, complete: "79.2%", arrive: "64.1%", hired: 438, cpa: "¥ 18.4", trend: "up" },
    { name: "快手", leads: 2910, complete: "74.1%", arrive: "58.7%", hired: 241, cpa: "¥ 21.2", trend: "up" },
    { name: "58同城", leads: 2140, complete: "71.8%", arrive: "55.2%", hired: 176, cpa: "¥ 29.8", trend: "flat" },
    { name: "门店二维码", leads: 1680, complete: "85.4%", arrive: "72.6%", hired: 188, cpa: "¥ 8.6", trend: "up" },
    { name: "老骑手转介绍", leads: 630, complete: "91.2%", arrive: "81.4%", hired: 72, cpa: "¥ 12.0", trend: "up" },
    { name: "短信召回", leads: 300, complete: "48.3%", arrive: "36.2%", hired: 11, cpa: "¥ 41.5", trend: "down" },
  ],

  series: {
    labels: ["10-26", "10-27", "10-28", "10-29", "10-30", "10-31", "11-01", "11-02", "11-03", "11-04", "11-05", "11-06", "11-07", "11-08"],
    leads: [720, 760, 740, 810, 860, 900, 1080, 1040, 980, 1010, 1060, 1120, 1180, 1240],
    complete: [510, 540, 530, 590, 630, 670, 790, 760, 730, 760, 800, 840, 890, 930],
    booked: [300, 320, 310, 350, 380, 400, 470, 460, 440, 460, 490, 510, 540, 570],
  },

  qa: { sampled: 1200, violations: 0, gaps: 3, topGaps: ["杭州余杭：租车补贴口径（v2026-09 未更新）", "深圳南山：夜班时段与保险说明", "上海：健康证办理周期（政策已更新）"] },

  configFields: [
    { key: "name", label: "称呼", required: true, level: "L2", llm: true, retention: "90 天", note: "仅称谓，不采集全名" },
    { key: "birth_ym", label: "出生年月", required: true, level: "L2", llm: false, retention: "90 天", note: "仅年月；未成年直接 end_minor" },
    { key: "area_text", label: "意向区域", required: true, level: "L2", llm: true, retention: "90 天", note: "街道级，不采集门牌" },
    { key: "job_type", label: "岗位意向", required: true, level: "L1", llm: true, retention: "90 天", note: "全职 / 兼职 / 未定" },
    { key: "has_ebike", label: "车辆情况", required: true, level: "L1", llm: true, retention: "90 天", note: "有 / 没有 / 未知" },
    { key: "start_text", label: "到岗时间", required: true, level: "L1", llm: true, retention: "90 天", note: "自然语言归一化" },
    { key: "experience_text", label: "配送经验", required: true, level: "L1", llm: true, retention: "90 天", note: "经验摘要，不写入模型" },
    { key: "phone", label: "手机号", required: true, level: "L3", llm: false, retention: "90 天", note: "Vault token；模型侧仅见占位符", keepAway: true },
  ],

  policies: [
    { city: "上海", version: "v2026-09", title: "上海市骑手招募与用工说明", section: "3.2 收入构成", quote: "骑手收入由基础服务费与订单提成构成，具体标准以站点当期公示为准。平台不承诺固定收入，不收取任何形式的报名费、押金或装备强制费。", disclaimer: "以上为政策摘录，不构成收入承诺；实际以签约主体与站点当期政策为准。" },
    { city: "上海", version: "v2026-09", title: "安全与装备要求", section: "2.1 车辆与头盔", quote: "上路配送须佩戴符合标准的安全头盔，车辆须符合当地电动自行车管理规定；站点可提供合作租车渠道，费用由骑手与租赁方自行结算。", disclaimer: "装备要求以站点当期安全培训为准。" },
    { city: "杭州", version: "v2026-08", title: "杭州市骑手招募与用工说明", section: "4.1 健康证", quote: "从事餐饮配送的骑手须持有效健康证明；新入职骑手可在入职后 7 个工作日内补交，逾期未交将暂停接单。", disclaimer: "健康证办理周期以当地疾控中心为准。" },
  ],

  audit: [
    { id: "A-91021", time: "11-08 09:42:18", actor: "王敏", role: "招聘专员", action: "查看候选人", target: "RC-1042", detail: "脱敏视图", hash: "8f3a…c21d", prev: "0x00…genesis" },
    { id: "A-91022", time: "11-08 09:43:02", actor: "王敏", role: "招聘专员", action: "查看完整手机号", target: "RC-1042", detail: "理由：预约面试确认", hash: "a71e…9b04", prev: "8f3a…c21d" },
    { id: "A-91023", time: "11-08 09:45:11", actor: "李哲", role: "运营负责人", action: "修改配置", target: "cfg-2026.11.08-03", detail: "phone.llm_visible=false", hash: "c02b…77ae", prev: "a71e…9b04" },
    { id: "A-91024", time: "11-08 09:46:30", actor: "李哲", role: "运营负责人", action: "发布配置", target: "cfg-2026.11.08-03", detail: "二次复核通过", hash: "d94f…10cc", prev: "c02b…77ae" },
    { id: "A-91025", time: "11-08 09:50:12", actor: "王敏", role: "招聘专员", action: "导出名单", target: "上海-张江站", detail: "含水印，导出 24 行", hash: "e13c…6a2f", prev: "d94f…10cc" },
    { id: "A-91026", time: "11-08 09:52:44", actor: "赵审计", role: "审计员", action: "导出审计", target: "A-91001..A-91026", detail: "只读", hash: "f7a2…3d81", prev: "e13c…6a2f" },
    { id: "A-91027", time: "11-08 09:55:08", actor: "王敏", role: "招聘专员", action: "查看完整手机号", target: "RC-1047", detail: "理由：站点名额确认", hash: "0b6e…c590", prev: "f7a2…3d81" },
    { id: "A-91028", time: "11-08 09:58:21", actor: "系统", role: "定时任务", action: "留存清理", target: "retention-2026-11-08", detail: "匿名化 142 条 / 删除 38 条", hash: "2d81…e4b7", prev: "0b6e…c590" },
  ],

  deidSamples: [
    {
      label: "地址混写",
      input: "我叫张伟，手机 138 0013 8000，身份证 310101199501011234，住在上海市浦东新区张江路 88 弄 3 号楼 502。",
      output: "我叫〔姓名_1〕，手机〔手机号_1〕，身份证〔身份证_1〕，住在〔地址_1〕。",
      tokens: ["姓名_1", "手机号_1", "身份证_1", "地址_1"],
    },
    {
      label: "中英混排",
      input: "联系人：李娜（Lina Li），电话 +86 139-0000-1234，地址：杭州市余杭区文一西路 969 号 5 幢。",
      output: "联系人：〔姓名_1〕（〔姓名_2〕），电话〔手机号_1〕，地址：〔地址_1〕。",
      tokens: ["姓名_1", "姓名_2", "手机号_1", "地址_1"],
    },
    {
      label: "银行卡",
      input: "王小明 13800001234 银行卡 6222 0202 0000 1234 567 骑手面试。",
      output: "〔姓名_1〕〔手机号_1〕银行卡〔银行卡_1〕骑手面试。",
      tokens: ["姓名_1", "手机号_1", "银行卡_1"],
    },
  ],
};

export const DEMO_NOTE = "所有候选人、手机号、站点与指标均为合成演示数据；不含真实个人信息，也不连接真实客户系统。";
