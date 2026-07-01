---
title: VibeLearn Wiki 索引
type: index
sources: []
related: []
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# VibeLearn Wiki 索引

> LLM 维护 — 每次摄入后更新。本页是 Wiki 的空间目录,新会话先读这里定位。

## 概念 Concepts

- [[property-replication-dataflow]] — UPROPERTY(Replicated) 从服务端变更到客户端 OnRep 的完整链路
- [[rpc-flow]] — Server / Client / Multicast 三方向 RPC 的调用链与防作弊/合批机制
- [[three-sync-approaches]] — 原生 / ReplicationGraph / Iris 三代方案的演进与分工

## 实体 Entities

- [[unetdriver]] — 网络驱动顶层类,ServerReplicateActors 主循环 + RPC 派发
- [[uactorchannel]] — 单 Actor 同步通道,ReplicateActor / ProcessBunch / SendBunch
- [[fReplayout]] — 反射生成的属性布局 + DiffProperties / SendProperties 序列化引擎

## 来源摘要 Source Summaries

- [[src-ue-networking-overview]] — UE 网络同步可视化图谱(9 视图,冷启动破例引用 knowledge/)

## 对比分析 Comparisons

- [[native-vs-repgraph-vs-iris]] — 三种同步方案横向对比表(复杂度/策略/底层复用/迁移路径)
