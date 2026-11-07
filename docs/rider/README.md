# 骑遇 RiderHire OS · 骑手招聘 Agent 化信息收集平台（演示）

这是 ClawHunt #1804–#1808 五个交付物的可点通静态演示。一套共用接口契约，五个模块各自对应一个验收面；所有姓名、手机号、身份证、站点、名额、事件、指标均为合成数据，不接真实模型、不接真实客户系统。

- 总览：https://gupeat.github.io/clawhunt-agent-demos/rider/?m=overview
- 源码：https://github.com/Gupeat/clawhunt-agent-demos/tree/main/docs/rider
- 本地：在仓库根目录运行 `python -m http.server 8799`，打开 http://127.0.0.1:8799/docs/rider/

## 五个模块

| 模块 | 对应任务 | 直接入口 | 页面内可核对的验收点 |
|---|---|---|---|
| Agent 对话引擎与政策知识库 | #1808 | [agent](https://gupeat.github.io/clawhunt-agent-demos/rider/?m=agent) | 7 槽位状态机；逐项追问；关键字段复述确认；政策引用到文档/版本/章节；无命中转人工；未成年 → `end_minor`；手机号/身份证先去标识再进模型（占位符展示 + `pii_in_request=false`）；注入攻击拒绝；主备模型降级与恢复；312 条合成评测（字段 96.4%、政策 93.1%、0 违规） |
| 求职者 H5 / 小程序 | #1807 | [h5](https://gupeat.github.io/clawhunt-agent-demos/rider/?m=h5) | 渠道参数 → 同意门 → 7 项 → 政策 → 选站 → 预约 → 结果完整漏斗；拒绝同意不创建会话；AI 身份每屏可见；4 项个人信息自助；375/390/414 与 150% 字号无横向溢出；断网 10 秒恢复会话与进度；一键 E2E 自检 14 项 |
| 招聘工作台与业务服务 | #1806 | [workbench](https://gupeat.github.io/clawhunt-agent-demos/rider/?m=workbench) | 100 条导入去重 12 条；候选人状态机与非法迁移 409；50 并发抢 5 个名额=5 成功/45 拒绝/0 超卖；事件 Outbox + HMAC；手机号默认脱敏、看全号必须填理由并调用 Vault；标记不合适必须填理由；水印；导出审计 |
| 管理驾驶舱与配置后台 | #1805 | [dashboard](https://gupeat.github.io/clawhunt-agent-demos/rider/?m=dashboard) | 7 KPI 与内置 SQL 对账 7/7；聚合接口 PII 扫描 0 泄露；渠道/城市/站点/日期筛选；配置草稿 → 第二人复核 → 发布；版本差异与一键回滚；LLM 不可见字段在配置 JSON 中带 `keep_away=true` 并锁定；导出水印 + 导出日志 |
| 数据安全与合规 | #1804 | [security](https://gupeat.github.io/clawhunt-agent-demos/rider/?m=security) | AES-256-GCM 字段加密与密钥轮换；Vault tokenize/detokenize（无理由/越权均拒绝并审计）；去标识 200 条回归（手机/身份证 100%、姓名/地址 96.8%、误报 0.7%）；哈希链审计篡改定位；五角色跨城/跨站拒绝；留存清理 128 删除/342 匿名化/删除记录；同意撤回删除；OWASP 10 项自检 + 依赖扫描 |

## 这套演示在证明什么

不是复述需求，而是把每个「验收项」变成可点、可复跑、可检查的证据：

1. **Agent 不是聊天壳**：槽位、状态、政策引用、去标识、降级、评测是同一条链路上的不同证据面。
2. **前端不是截图**：H5 的同意门、漏斗、断网恢复、字号/宽度适配都能在浏览器里逐步操作。
3. **后端边界可验证**：去重、状态机、并发名额、Outbox/HMAC、脱敏与水印都有确定性的交互结果。
4. **指标可对账**：驾驶舱的 7 个 KPI 不是写死的数，页面内给出对账口径与 SQL 自检结果。
5. **安全是可证明的**：不是「我们很安全」，而是篡改一行审计能定位、无理由解密会失败、跨城访问会被拒绝、过期数据会被清掉。

## 边界与真实落地

这是**交互与验收口径的静态演示**，不是已接入甲方系统的生产部署。真实落地按共用接口契约实现：

- Python 3.12 + FastAPI，PostgreSQL 16 + pgvector，Redis 7.2/Valkey，React + Ant Design（H5 可用 Taro 小程序）；
- `/api/v1` REST、OpenAPI、契约测试、Docker Compose 一键起；
- OpenAI 兼容模型可配置，默认带本地 mock；模型请求前文本去标识；
- 真实数据接入时替换合成数据源，补齐鉴权、持久化、对象存储、监控与告警。

## 验证

静态页面通过 Edge DevTools Protocol 跑过交互回归：六个视图 0 console error；Agent 22 项断言、H5 漏斗、工作台并发/状态机、驾驶舱 SQL/配置发布、安全 Vault/审计/RBAC/去标识均通过。交互回归脚本与截图保存在本地 `.shots/`（不随静态演示发布），页面本身不加载任何外部依赖。