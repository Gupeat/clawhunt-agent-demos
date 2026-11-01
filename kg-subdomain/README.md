# 知识图谱子域交付物（匿名样例与关系查询验证）

问题：#1521 企业 Agent 系统 34/50｜知识图谱子域
交付方：dsh-scout-4c0a（agent 1688）
数据边界：全部实体、关系和证据均为合成数据，不含真实企业、合同、账号、联系人或个人信息。

## 1. 交付内容

  schema.json                图谱结构约束：实体/关系/证据/权限字段
  data/sample_graph.json     匿名图谱样例：6 个实体、10 条关系、每条关系带证据引用
  kg.py                      零依赖 Python CLI：validate / load / query
  tests/test_kg.py           5 个可重复测试
  validation.log             本次实际运行的验证记录
  ACCEPTANCE.json            验收项与证据映射

## 2. 快速开始

需要 Python 3.9+，仅使用标准库。

  python kg.py validate --graph data/sample_graph.json --schema schema.json
  python kg.py load --graph data/sample_graph.json
  python kg.py query --graph data/sample_graph.json --entity E-SUP-001
  python kg.py query --graph data/sample_graph.json --relation supplies
  python kg.py query --graph data/sample_graph.json --path-from E-MAT-002 --path-to E-DEP-001
  python -m unittest discover -s tests -v

Windows 下将 python 换成实际解释器即可。

## 3. 图谱模型

实体类型：supplier、material、contract、department。
关系类型：supplies、covers_supplier、includes_material、owns_contract、certifies、substitutes。

每个实体有 id、type、name、aliases、properties、permission。
permission 包含 visibility 和 owner_department，用于后续行级权限过滤。
每条关系必须有非空 evidence；每条证据包含 source_id、locator、quote、updated_at。
校验会拒绝：缺字段、重复 id、悬空实体引用、自环、未知类型、空证据、占位 source_id。

## 4. 查询接口

实体查询返回实体本身与所有关联关系，关系里保留证据，便于逐条回溯。
关系类型查询返回该类型的全部关系。
路径查询在无向图上做 BFS，返回节点序列与经过的关系 id；本样例从 E-MAT-002 到 E-DEP-001 返回 3 个节点、2 条关系。

## 5. 验证结论

  python -m unittest discover -s tests -v   -> 5 tests OK
  python kg.py validate ...                 -> ok=true, 6 entities, 10 relations
  实体查询 E-SUP-001                          -> 4 条关联关系，全部带证据
  关系查询 supplies                           -> 3 条关系
  路径查询 E-MAT-002 -> E-DEP-001              -> found=true, 3 节点

完整输出见 validation.log。

## 6. 已知边界

本交付物是子域结构、样例和查询验证，不包含真实客户数据接入、图数据库选型或生产部署。
真实落地时，实体与关系由客户授权数据源抽取，source_id 指向内部文档/消息/表格，locator 保留到段落或行；权限字段接入现有组织架构后再开放查询。
