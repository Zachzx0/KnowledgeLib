---
title: Wiki 活动日志
type: log
sources: []
related: []
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# Wiki 活动日志

> Append-only — 每次操作(ingest / query / lint)追加一条,格式:
> `## [YYYY-MM-DD] ingest|query|lint | <标题>`

## [2026-07-02] ingest | UE 网络同步可视化图谱(冷启动)

- **来源**:`knowledge/game-dev/ue_networking_overview.html`
- **⚠️ 冷启动破例**:来源位于 `knowledge/` 而非 `raw/`,违反 SCHEMA §1 约定,本次作为测试破例引用一次
- **生成页面**(8 个):
  - source-summary:[[src-ue-networking-overview]]
  - entities:[[unetdriver]]、[[uactorchannel]]、[[fReplayout]]
  - concepts:[[property-replication-dataflow]]、[[rpc-flow]]、[[three-sync-approaches]]
  - comparisons:[[native-vs-repgraph-vs-iris]]
- **更新**:[[index.md]] 填入 8 个条目
- **关键洞察沉淀**:
  1. ReplicationGraph 只解决"选谁",底层序列化复用原生
  2. Iris 才是从根本重写(编译期 Descriptor + ChangeMask + 脱离 ActorChannel)
  3. 三端时序:AutonomousProxy 预测+回滚 / SimulatedProxy 插值 / Authority 权威验证
  4. 不可靠 Multicast 入队合批优化(NetDriver.cpp:2820)
  5. ACK 捎带在下一个 Packet 头里,不独立发包
- **未覆盖**:移动预测的数学阈值算法、Dedicated Server 部署、ListenServer 特殊路径

## [2026-07-02] lint | 首次健康检查(8 页)

- **范围**:8 个内容页 + index/log/overview/SCHEMA
- **通过项**:双链目标全部存在、无内容矛盾、无过时结论、frontmatter 字段齐全
- **发现问题**(3 项,未擅自修复):
  1. ⚠️ related 字段格式不一致:7 个页面混用 `[[xxx]]` 与 `[xxx]`,违反 SCHEMA §2
  2. ⚠️ 双向链接不对称:src-ue-networking-overview 指向 7 页,但被指页面 related 未回指
  3. ℹ️ SCHEMA.md 示例用 `[[property-replication]]`,实际页面叫 `property-replication-dataflow`
- **缺失概念候选**:ChangeMask / FReplicationStateDescriptor / UNetConnection / FObjectReplicator / FOutBunch / FSavedMove
- **孤岛页面**:无(overview 按设计无入链,不算)
- **处理建议**:格式问题可直接修复;缺失概念等用户决定是否建独立页

## [2026-07-02] ingest | 批量摄入 5 份 raw 素材(角色移动 + AI 决策)

- **来源**(5 份,均在 `raw/articles/`):
  - `CharacterMovementComponent_移动原理分析.md`(伪代码,置信度 medium)
  - `How To Optimize Navmesh Generation.md`
  - `GOAP可视化学习.html`、`StateTree_Learn.html`、`Utility_AI_Learn.html`(三份可运行交互 demo)
- **生成页面**(12 个):
  - source-summary:[[src-cmc-movement]]、[[src-navmesh-optimization]]、[[src-goap-demo]]、[[src-statetree-demo]]、[[src-utility-ai-demo]]
  - concepts:[[movement-prediction]]、[[navmesh-generation]]、[[goap]]、[[statetree]]、[[utility-ai]]
  - entities:[[charactermovementcomponent]]
  - comparisons:[[ai-decision-models]]
- **联动更新**:
  - [[rpc-flow]]、[[property-replication-dataflow]] 加入 [[movement-prediction]] 双链(ServerMove/ClientAdjustPosition 走 RPC + 共享三端角色模型)
  - [[src-ue-networking-overview]] 标注:移动预测缺口已由 [[movement-prediction]] 部分填补;冷启动破例可解除(raw 版 `UE_Networking_Visualization.html` 已存在)
  - [[index.md]] 重构为按领域分组(网络同步 / 角色移动导航 / AI 决策)
- **关键洞察沉淀**:
  1. CMC 的 MovementMode 是硬编码 FSM,是 [[statetree]] 数据驱动思路的对照物
  2. 移动预测 = 客户端预测 + 服务器校正 + 回滚重放,复用 [[rpc-flow]] 通道,与属性同步共享三端角色模型
  3. 五大 AI 决策模型可组合而非互斥:Utility 选目标 + GOAP 规划路径([[src-goap-demo]] 实证)
  4. 决策层(做什么/去哪)与运动层([[charactermovementcomponent]] + [[navmesh-generation]])解耦
  5. GOAP demo 用的是 Dijkstra 无启发式,非经典 A*
- **⚠️ 存疑/缺口**:
  - CMC 来源是教学伪代码,符号名与真实 UE 源码不符(标注 confidence: medium)
  - ClientAdjustPosition/ServerCheckClientError 的**具体误差阈值数学**仍未覆盖(跨两份来源的持续空白)
- **未处理**:`raw/articles/UE_Networking_Visualization.html` 未重新摄入(内容已被冷启动 8 页覆盖),仅记录其作为正规 raw 源的存在

## [2026-07-02] lint-fix | 修复首次 lint 的 3 项遗留问题

- **① related 格式统一**:将 5 个页面(`unetdriver`、`uactorchannel`、`fReplayout`、`native-vs-repgraph-vs-iris`、`three-sync-approaches`)中残留的单括号 `[xxx]` 全部改为 SCHEMA §2 规范的 `[[xxx]]`。全库复查:0 残留。
- **② 双链回指补齐**:确立规则「来源页 `related` = 其派生页(该页 `sources` 含此 raw 文件);派生页回指来源」。据此:
  - 网络同步 7 页(`property-replication-dataflow`/`rpc-flow`/`three-sync-approaches`/`native-vs-repgraph-vs-iris`/`unetdriver`/`uactorchannel`/`fReplayout`)全部回指 [[src-ue-networking-overview]]
  - `ai-decision-models` 回指 [[src-goap-demo]]/[[src-statetree-demo]]/[[src-utility-ai-demo]]
  - `charactermovementcomponent`、`movement-prediction` 回指 [[src-cmc-movement]];并把 [[src-cmc-movement]] 的 related 收窄为其两个派生页(跨域的 rpc-flow/property-replication 仅保留正文内链)
- **③ SCHEMA.md 示例命名**:示例中的 `property-replication` 全部更正为实际页名 `property-replication-dataflow`(frontmatter 示例、文件名示例、目录说明、index 示例、双链示例共 5 处)。
- **结果**:read_lints 通过;格式与双向对称问题清零。

## [2026-07-02] schema | 新增 `raw/AIGen/` 子目录

- 在 `raw/` 下新增 `AIGen/` 目录,用于存储所有 AI Agent 生成的内容(如 HTML 可视化、代码输出、交互 demo 等)
- 权限遵循 `raw/` 层规则:LLM 只读,AI Agent 写入
- 同步更新 `SCHEMA.md` §1 和 `CODEBUDDY.md` 快速上手节

## [2026-07-02] schema | 建立 Wiki 到 HTML 查看器的桥接

- 新增 `tools/sync-wiki-to-knowledge.js`:扫描 `wiki/**/*.md`,解析 frontmatter,生成前端 snippets
- 新增生成文件 `js/wiki-data.js`:内嵌 Wiki Markdown 内容,解决 `file://` 下无法 fetch Markdown 的问题
- 更新 `knowledge/index.json`:将 Wiki 条目与既有 HTML 知识片段混合索引
- 更新 `index.html` / `js/data.js` / `js/app.js`:加载 Wiki 运行时数据,混合展示,并在详情区渲染 Markdown
- 新增 Wiki 专用分类与双链点击跳转支持

