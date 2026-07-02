---
title: UE 网络同步可视化图谱(冷启动来源)
type: source-summary
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[property-replication-dataflow]], [[rpc-flow]], [[three-sync-approaches]], [[native-vs-repgraph-vs-iris]], [[unetdriver]], [[uactorchannel]], [[fReplayout]], [[movement-prediction]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# UE 网络同步可视化图谱

## 来源

- **文件**:`knowledge/game-dev/ue_networking_overview.html`
- **类型**:交互式 Canvas 可视化图谱(非文章)
- **⚠️ 冷启动破例**:本来源位于 `knowledge/` 而非 `raw/`,违反 SCHEMA §1 的"来源只能是 raw/"约定。本次作为 LLM Wiki 冷启动测试破例引用一次,后续来源必须放入 `raw/`。

## 这篇资料是什么

一个单文件 HTML 应用,用 Canvas 渲染 **9 个视图**,覆盖 UE 网络同步的全部核心机制。每个节点带三层信息:
- `h` — 标题
- `src` — 源码路径(精确到行号)
- `desc` — 机制说明(含源码实证)

本质是**源码导航地图**:不是讲概念,而是讲"每个机制在引擎源码的哪个文件、哪个函数、走什么数据流"。

## 9 个视图概览

| 视图 | 主题 | 核心数据流/结构 |
|---|---|---|
| `overview` | 三种同步方案总览 | Native / ReplicationGraph / Iris 横向分支 |
| `native` | 原生同步完整数据流 | `UPROPERTY(Replicated)` → `PreReplication` → `ServerReplicateActors` → `ReplicateActor` → `FRepLayout` diff → `FOutBunch` → `SendBunch` → `FlushNet` → UDP → 客户端 `ProcessBunch` |
| `repgraph` | ReplicationGraph 空间分片 | `InitGlobalGraphNodes` → `RouteAddNetworkActorToNodes` → 4 种 Node(Grid/Dormancy/AlwaysRelevant/DynamicFreq) → `GatherActorListsForConnection` → 复用原生 UActorChannel |
| `iris` | Iris 数据驱动同步 | `BeginReplication` → `FReplicationStateDescriptor`(编译期生成) → `MarkDirty` + `ChangeMask` → `PreSendUpdate`(Poll/Filter/Prioritize) → `ReplicationWriter` → `DataStreamManager` |
| `rpc` | RPC 三方向数据流 | `CallRemoteFunction` → `ProcessRemoteFunction` → `ProcessRemoteFunctionForChannelPrivate` → `FRepLayout::SendPropertiesForRPC` → Bunch |
| `proprep` | 属性同步完整链路 | `UPROPERTY(Replicated)` → `FRepLayout::InitFromClass` → `DiffProperties`(对比 Shadow State) → `SendProperties`(只写脏 handle) → 客户端 `ReceiveProperties` → `OnRep_XXX` |
| `seq_proprep` | 属性同步三端时序 | Authority / AutonomousProxy / SimulatedProxy,`COND_OwnerOnly` 分发差异 |
| `seq_rpc` | RPC 三方向时序 | Server RPC(上传+Validate防作弊) / Client RPC(私密下发) / Multicast RPC(队列合批优化) |
| `seq_move` | 移动预测与服务器修正 | `FSavedMove` → 本地预测 → `ServerMove` → `MoveAutonomous` → `ServerCheckClientError` → `ClientAdjustPosition` → 回滚重放 + SimulatedProxy 插值 |

## 关键洞察

### 1. ReplicationGraph 只解决"选谁",不解决"怎么发"
RepGraph 通过空间分片把 ConsiderList 从 O(N) 降到 O(k),但 **Gather 出来的候选列表仍然走原生 `UActorChannel::ReplicateActor` → `FRepLayout::SendProperties` → `SendBunch` 全套底层**。它解决的是 N×M 的 N,不是序列化本身。

### 2. Iris 才是从根本上重写
Iris 用 `FReplicationStateDescriptor`(编译期生成、无运行时反射)+ `ChangeMask`(Push Model 位图)+ `ReplicationWriter`(脱离 ActorChannel/FOutBunch) **完全绕开了原生同步体系**。原生最贵的 `DiffProperties` 对比 Shadow State 在 Iris 里被 ChangeMask 位图取代——O(属性数) 变成 O(脏位数)。

### 3. 三端网络时序的根本分工
- **Authority**:唯一权威,用同样输入验证客户端结果,出错强制拉回
- **AutonomousProxy**:立即执行(0 延迟感) + 异步等服务端确认 + 出错回滚重放(输入不丢)
- **SimulatedProxy**:无输入权,收 100ms 前快照,通过 `SmoothClientPosition` 插值平滑

这套叫 **Client-side Prediction + Server Reconciliation**,从 Quake III 沿用至今。

### 4. 不可靠 Multicast 的合批优化
源码实证:`QueueBunch = (!Bunch.bReliable && Function->FunctionFlags & FUNC_NetMulticast)`。不可靠 Multicast 不立即发,入队 `QueuedExportBunches`,等下一次 Actor 属性同步时一起发——省 Bunch header + 增加 UDP 合批率。

### 5. ACK 是捎带的
UE 的 UDP 包永远是复合包(一个 Packet 里可能塞属性同步 Bunch + 多个 RPC Bunch)。ACK 不独立发包,而是**捎带在下一个 Packet 头里**(PacketId + AckBits)。

## 派生的 Wiki 页面

本次摄入联动生成:
- 概念:[[property-replication-dataflow]]、[[rpc-flow]]、[[three-sync-approaches]]
- 实体:[[unetdriver]]、[[uactorchannel]]、[[fReplayout]]
- 对比:[[native-vs-repgraph-vs-iris]]

## 局限

- 这篇资料是**机制地图**,不是入门教程。需要先对 UE 网络有基础理解。
- 9 个视图覆盖的是 UE5.4 为止的现状,Iris 部分(Experimental)可能在未来版本变化。
- 没有覆盖:网络预测的具体数学(ClientAdjustPosition 的阈值算法)、Dedicated Server 部署、ListenServer 特殊路径。

> ✅ 更新([2026-07-02] ingest 批量摄入):`seq_move` 视图提到的移动预测流程已在 [[movement-prediction]] 展开(来源 [[src-cmc-movement]])。但 **ClientAdjustPosition 的具体阈值数学仍是缺口**,两份来源都未给出。
>
> ℹ️ **冷启动破例已可解除**:本来源内容对应的正规 raw 文件 `raw/articles/UE_Networking_Visualization.html` 现已存在(与冷启动引用的 `knowledge/game-dev/ue_networking_overview.html` 同源)。后续如重新校订网络同步页面,应将 `sources` 改指该 raw 文件,不再引用 `knowledge/`。
