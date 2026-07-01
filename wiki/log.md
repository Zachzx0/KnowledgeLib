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
