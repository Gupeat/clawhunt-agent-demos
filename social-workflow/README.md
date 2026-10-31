# Social matrix workflow demo (#1539)

本地、无网络的 Facebook 多账号内容工作流样例：生成草案 -> 人工审核 -> mock 发布 -> 失败恢复 -> 数据反馈。**不接真实账号，不自动发帖。**

## 快速开始

要求 Python 3.10+，只用标准库。

```bash
cd social-workflow
python workflow.py demo --per-account 2
python -m unittest discover -s tests -v
```

`demo` 会重建 `state/` 和 `out/`，生成 6 条草案，批准 4 条、拒绝 1 条、保留 1 条待审；发布时模拟 1 次限流和 1 次平台删除，再重试可恢复项。最终：
- 3 条发布成功；
- 1 条永久失败（平台已删除，不重复重试）；
- 1 条待人工审核、1 条已拒绝，均不会进入发布。

## 产物

| 文件 | 说明 |
|---|---|
| `state/drafts.json` | 草案及状态、幂等键、尝试次数 |
| `state/review_queue.json` | 待人工审核队列 |
| `state/publish_log.jsonl` | 每次发布/重试的审计日志 |
| `state/published.json` | 幂等发布台账 |
| `out/metrics_feedback.json` | 按账号/草案聚合的反馈数据 |
| `out/validation.log` | demo 运行结果 |
| `out/ACCEPTANCE.json` | 验收映射 |

## 边界

- 所有账号、素材、曝光/互动数据均为合成数据。
- 真实 Facebook/IG/TikTok 账号、授权、发布窗口需甲方提供并确认；本 demo 不接触真实平台。
- 不承诺询盘、线索或成交。
- 不含第三方 API、云资源、模型和素材采购费用，成本口径见 `RUN_COST.md`。
- 失败恢复只重试可重试错误；永久失败会保留在 `failed` 状态，人工处理。

## 测试覆盖

`tests/test_workflow.py` 覆盖：草案数量、未审核不发布、拒绝不发布、限流重试、幂等、永久失败、指标聚合和完整 demo。
