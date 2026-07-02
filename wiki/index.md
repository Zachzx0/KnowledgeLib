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

### 网络同步
- [[property-replication-dataflow]] — UPROPERTY(Replicated) 从服务端变更到客户端 OnRep 的完整链路
- [[rpc-flow]] — Server / Client / Multicast 三方向 RPC 的调用链与防作弊/合批机制
- [[three-sync-approaches]] — 原生 / ReplicationGraph / Iris 三代方案的演进与分工
- [[movement-prediction]] — 客户端预测 + 服务器校正 + 回滚重放(CMC 的网络核心)

### 角色移动 / 导航
- [[navmesh-generation]] — Recast navmesh 体素化生成原理与运行时优化策略

### AI 决策
- [[goap]] — 目标导向行动规划:描述动作,规划器自动搜动作链
- [[statetree]] — UE5 层级状态决策模型(FSM + 行为树融合)
- [[utility-ai]] — 效用决策:每帧给行为打分,选最高分

## 实体 Entities

- [[unetdriver]] — 网络驱动顶层类,ServerReplicateActors 主循环 + RPC 派发
- [[uactorchannel]] — 单 Actor 同步通道,ReplicateActor / ProcessBunch / SendBunch
- [[fReplayout]] — 反射生成的属性布局 + DiffProperties / SendProperties 序列化引擎
- [[charactermovementcomponent]] — 角色移动核心组件,MovementMode FSM + 物理模拟 + 网络预测

## 来源摘要 Source Summaries

- [[src-ue-networking-overview]] — UE 网络同步可视化图谱(9 视图,冷启动破例引用 knowledge/)
- [[src-cmc-movement]] — CharacterMovementComponent 移动原理分析(伪代码,置信度 medium)
- [[src-navmesh-optimization]] — 运行时动态 navmesh 生成的 CPU 优化清单
- [[src-goap-demo]] — GOAP 交互式 demo(内含可运行 Dijkstra 规划器)
- [[src-statetree-demo]] — StateTree 可视化 demo(巡逻守卫 AI)
- [[src-utility-ai-demo]] — Utility AI 交互式 demo(地牢冒险者效用评分)

## 对比分析 Comparisons

- [[native-vs-repgraph-vs-iris]] — 三种同步方案横向对比表(复杂度/策略/底层复用/迁移路径)
- [[ai-decision-models]] — FSM / 行为树 / StateTree / GOAP / Utility AI 五模型横向对比
