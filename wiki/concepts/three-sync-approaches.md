---
title: 三种同步方案总览 (Three Sync Approaches)
type: concept
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[uactorchannel]], [[fReplayout]], [property-replication-dataflow], [native-vs-repgraph-vs-iris]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# 三种同步方案总览

UE 网络同步的三代方案:**原生 Replication**(UE3 沿用)、**ReplicationGraph**(Fortnite 落地)、**Iris**(UE5 新一代 Experimental)。三者对上层 `UPROPERTY(Replicated)` / `UFUNCTION(Server/Client/Multicast)` API **透明**——游戏代码几乎不用改。

## 演进脉络

```
① 原生 (UE3→UE4→UE5)
   UNetDriver + UActorChannel + FRepLayout
   O(N × M) — Actor 多玩家多时 CPU 爆炸
        ↓ 只替换"选谁同步"
② ReplicationGraph (Fortnite)
   UReplicationDriver + UReplicationGraphNode (空间分片)
   O(k × M) — k 远小于 N
   底层序列化/发包仍复用原生
        ↓ 从根本重写序列化
③ Iris (UE5 Experimental)
   UReplicationSystem + FReplicationStateDescriptor + ChangeMask
   脱离 ActorChannel,数据驱动,Push Model
```

## 核心差异

| 维度 | 原生 | ReplicationGraph | Iris |
|---|---|---|---|
| **驱动接口** | `UNetDriver::ServerReplicateActors` | `UReplicationDriver`(替换主循环) | `UReplicationSystem` |
| **复杂度** | O(N × M) | O(k × M) | O(脏位数) |
| **"选谁"策略** | 每 Connection 遍历所有 Actor 算 IsRelevant | 空间格子/休眠/永远相关分片,Gather 出候选 | 可插拔 `NetObjectFilter` |
| **脏检测** | `FRepLayout::DiffProperties` 对比 Shadow State(Poll) | 同原生 | `ChangeMask` 位图(Push Model) |
| **序列化** | `FRepLayout::SendProperties` 写 handle + 值 | 同原生 | `ReplicationWriter` 写 ChangeMask 位段 + 数据 |
| **通道模型** | `UActorChannel`(1 Actor : 1 Channel) | 同原生 | `FNetRefHandle` 脱离 ActorChannel |
| **反射** | 运行时反射生成 FRepLayout | 同原生 | 编译期生成 `FReplicationStateDescriptor` |
| **成熟度** | 生产级,所有产品 | 生产级,Fortnite | Experimental(UE5.4) |

## 关键洞察

### 1. ReplicationGraph 只解决"选谁",不解决"怎么发"
这是理解 RepGraph 性能收益来源的关键。它通过 `GatherActorListsForConnection` 把候选列表从 N 个剪到 k 个,但 Gather 出来的列表仍然走:
```
UActorChannel::ReplicateActor → FRepLayout::SendProperties → SendBunch
```
**底层序列化和发包全套复用原生**。所以 RepGraph 的收益 = N×M 的 N 变小,序列化本身的 O(属性数) diff 成本没动。

### 2. Iris 才是从根本上重写
Iris 三处根本改进:
1. **无运行时反射**:`FReplicationStateDescriptor` 编译期建好,后续 diff/序列化都是 O(1) 查表
2. **Push Model**:`ChangeMask` 位图取代 diff Shadow State。属性 setter 或 `MARK_PROPERTY_DIRTY` 设位,PreSendUpdate 只扫 ChangeMask ≠ 0 的对象
3. **脱离 ActorChannel**:`FNetRefHandle` + `UObjectReplicationBridge` 桥接任意 UObject,不受 128 通道限制

### 3. 三个方案的"分工互补"
- 原生 = 基础设施(所有人共用)
- RepGraph = 策略层优化(选谁),寄生在原生之上
- Iris = 替代层(从驱动到序列化全重写),未来会逐步替代原生

## ReplicationGraph 的 4 种 Node

| Node | 用途 |
|---|---|
| `Node_GridSpatialization2D` | 把地图切成 N×N 格,Gather 时只查 Viewer 周围 3×3 格 |
| `Node_DormancyNode` | 休眠 Actor 只在 `FlushNetDormancy` 唤醒时同步 |
| `Node_AlwaysRelevant_ForConnection` | 每个 Connection 独立,放自己的 PC/Pawn/PlayerState |
| `Node_DynamicSpatialFrequency` | 远处降频(近 30Hz / 中 10Hz / 远 1Hz),类似 LOD |

## Iris 的核心组件

| 组件 | 职责 |
|---|---|
| `UObjectReplicationBridge` | UObject 世界 ↔ Iris `FNetRefHandle` 桥接 |
| `FReplicationStateDescriptor` | 编译期生成的属性布局(含 offset/size/NetSerializer/ChangeMask 位) |
| `ChangeMask` | 每对象一份位图,Push Model 设位 |
| `PreSendUpdate` | Poll 非 Push 属性 + Filter + Prioritize |
| `NetObjectFilter` | 可插拔过滤(空间/兴趣/连接白名单) |
| `NetObjectPrioritizer` | 带宽紧张时排序 |
| `ReplicationWriter` | 写 Bit Stream,绕开 UActorChannel/FOutBunch |
| `DataStreamManager` | 分层数据流,独立可靠性/优先级 |

## 选型建议

| 场景 | 推荐 |
|---|---|
| 小型项目(< 16 玩家,Actor < 1000) | 原生足够 |
| 大型多人(Fortnite 级 100 玩家) | ReplicationGraph |
| 新项目 + 愿踩坑 + 需要极致性能 | Iris(注意 Experimental) |
| 已有项目 + 想升级 | 先上 RepGraph(侵入小),Iris 等成熟 |

详细对比表见 [[native-vs-repgraph-vs-iris]]。

## 关联实体

- [[unetdriver]] — 三方案的宿主(RepGraph 通过 `UReplicationDriver` 接口替换其主循环)
- [[uactorchannel]] — 原生与 RepGraph 共用,Iris 脱离
- [[fReplayout]] — 原生与 RepGraph 共用,Iris 用 `FReplicationStateDescriptor` 替代
- [[property-replication-dataflow]] — 原生方案的详细链路
