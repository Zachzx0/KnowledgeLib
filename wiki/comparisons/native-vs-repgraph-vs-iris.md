---
title: 三种同步方案横向对比 (Native vs ReplicationGraph vs Iris)
type: comparison
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[uactorchannel]], [[fReplayout]], [[property-replication-dataflow]], [[rpc-flow]], [[three-sync-approaches]], [[src-ue-networking-overview]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# 三种同步方案横向对比

UE 网络同步三代方案的详细对比。定位与演进思路见 [[three-sync-approaches]]。

## 总览对比

| 维度 | 原生 Replication | ReplicationGraph | Iris |
|---|---|---|---|
| **代号** | Native / UNetDriver | RepGraph | Iris |
| **引入版本** | UE3 | UE4.20(Fortnite 试点) | UE5.x(Experimental) |
| **成熟度** | 生产级 | 生产级 | Experimental(UE5.4) |
| **驱动接口** | `UNetDriver::ServerReplicateActors` | `UReplicationDriver`(替换主循环) | `UReplicationSystem` |
| **典型落地点** | 所有 UE3/4 产品 | Fortnite 100 玩家大逃杀 | 尚无大规模生产案例 |

## 复杂度对比

| 指标 | 原生 | RepGraph | Iris |
|---|---|---|---|
| 候选筛选 | O(N × M) 每 Connection 遍历所有 Actor | O(k × M) k = Viewer 周围格子内 Actor | O(脏对象数 × 脏位数) |
| 脏检测 | O(属性数) diff Shadow State | 同原生 O(属性数) | O(脏位数) 扫 ChangeMask |
| 序列化 | 写 handle + 值 | 同原生 | 写 ChangeMask 位段 + 数据(无 handle) |
| 反射开销 | 运行时反射 | 同原生 | 编译期生成 Descriptor,无运行时反射 |

## "选谁同步"策略对比

| 方案 | 策略 |
|---|---|
| **原生** | 每 Connection 遍历 ConsiderList,对每个 Actor 调 `IsNetRelevantFor(ViewerPawn, ViewerLoc)`,然后 `PrioritizeActors`(NetPriority × 距离衰减 × TimeSinceLast) |
| **RepGraph** | 启动时 `InitGlobalGraphNodes` 构建 Graph 拓扑;Actor Spawn 时 `RouteAddNetworkActorToNodes` 路由到 Node;每帧每 Connection 调各 Node 的 `GatherActorListsForConnection` 剪枝 |
| **Iris** | `PreSendUpdate` 中 `NetObjectFilter`(可插拔:空间/兴趣/连接白名单)+ `NetObjectPrioritizer`(SpaceUsage / DistanceSq / RecentActivity 组合) |

## ReplicationGraph 的 Node 类型

| Node | 策略 | 典型 Actor |
|---|---|---|
| `Node_GridSpatialization2D` | 空间格子,Gather 时只查 Viewer 周围 3×3 格 | 静态背景物、NPC |
| `Node_DormancyNode` | 休眠不 poll,`FlushNetDormancy` 唤醒才同步 | 房屋、装饰 |
| `Node_AlwaysRelevant_ForConnection` | 每个 Connection 独立,无脑列入 | 玩家自己的 PC/Pawn/PlayerState |
| `Node_DynamicSpatialFrequency` | 按距离动态调 NetUpdateFrequency | 远处 Actor(近 30Hz / 中 10Hz / 远 1Hz) |

## 底层复用关系

| 层 | 原生 | RepGraph | Iris |
|---|---|---|---|
| 选谁 | `IsNetRelevantFor` | `GatherActorListsForConnection` | `NetObjectFilter` |
| 序列化 | `FRepLayout::SendProperties` | **复用原生** | `ReplicationWriter` + `FNetSerializer` |
| 打包 | `FOutBunch` + `UActorChannel::SendBunch` | **复用原生** | `FNetBitStreamWriter` + `DataStreamManager` |
| 网络 | `UNetConnection::FlushNet` → UDP | **复用原生** | 当前仍走 UNetConnection socket,未来计划完全接管 |

⚠️ **关键事实**:RepGraph 只替换了"选谁"的策略,**底层序列化和发包复用原生全套**。Iris 才是从驱动到序列化全重写。

## 脏检测机制对比

### 原生 / RepGraph:Poll + Shadow State Diff
```
每帧 FObjectReplicator::ReplicateProperties
  → FRepLayout::DiffProperties
  → 逐 FRepLayoutCmd 比对当前值 vs FRepShadowDataBuffer (上次发送副本)
  → 生成 ChangedPropertyTracker (dirty handle 列表)
```
- **复杂度**:O(属性数)
- **瓶颈**:即使属性没变也要逐个比对
- **优化**:Shadow State 只存上次成功发送的值

### Iris:Push Model + ChangeMask
```
属性 setter / MARK_PROPERTY_DIRTY → ChangeMask 对应 bit 置 1
PreSendUpdate → 只扫 ChangeMask ≠ 0 的对象和位
```
- **复杂度**:O(脏位数)
- **优势**:没变完全不扫,变了只扫脏位
- **代价**:需要游戏代码主动调 `MARK_PROPERTY_DIRTY`(或用 Iris 的代码生成 setter)

## 通道模型对比

| 维度 | 原生 / RepGraph | Iris |
|---|---|---|
| 句柄 | `UActorChannel`(1 Actor : 1 Channel per Connection) | `FNetRefHandle`(轻量句柄) |
| 通道限制 | 受 128 通道限制 | 不受 |
| 桥接对象 | 仅 Actor + SubObject | 任意 UObject(`UObjectReplicationBridge::BeginReplication`) |
| 生命周期 | Channel 随 Actor 创建/销毁 | Handle 独立管理 |

## 可扩展性对比

| 扩展点 | 原生 | RepGraph | Iris |
|---|---|---|---|
| 自定义过滤 | 重写 `IsNetRelevantFor` | 自定义 `UReplicationGraphNode` | 自定义 `NetObjectFilter` |
| 自定义优先级 | 改 `NetPriority` | 改 Node 顺序 | 自定义 `NetObjectPrioritizer` |
| 自定义序列化 | `NetSerialize` 回调 | 同原生 | 可插拔 `FNetSerializer`(PackedVector/Quat/Struct...) |
| 多线程 | 不友好(反射 Layout 共享) | 同原生 | 友好(Descriptor 只读,Poll/Filter 可并行) |

## 适用场景

| 场景 | 推荐 | 原因 |
|---|---|---|
| 小型项目(< 16 玩家,Actor < 1000) | 原生 | O(N×M) 可接受,简单稳定 |
| 大型多人射击(100 玩家) | RepGraph | 空间分片把 N 降下来,Fortnite 已验证 |
| 需要极致序列化性能 | Iris | Push Model + 无反射 + 无 ActorChannel |
| 已有 UE4/5 项目升级 | RepGraph | 侵入小,API 透明 |
| 新项目 + 愿踩坑 | Iris | 架构先进,但 Experimental 风险 |

## 迁移路径建议

1. **原生 → RepGraph**:实现 `UReplicationDriver` 子类,定义 Graph 拓扑,在 `InitGlobalGraphNodes` 注册 Node。游戏代码基本不动。
2. **RepGraph → Iris**:用 `UObjectReplicationBridge::BeginReplication` 替换 Actor 的 `SetReplicates(true)`,属性声明从 `UPROPERTY(Replicated)` 迁移到 Iris 的 Descriptor 体系。改动较大。
3. **原生 → Iris**(跳过 RepGraph):同上,但失去了 RepGraph 的空间分片——Iris 自己的 `NetObjectFilter` 可实现等价策略。

## 总结

- **原生** = 基础设施,所有人共用,瓶颈在 O(N×M) 和 O(属性数) diff
- **RepGraph** = 策略层优化,解决 N×M 的 N,底层复用原生
- **Iris** = 替代层,从驱动到序列化全重写,解决 diff 成本和通道限制

RepGraph 是"加法"(寄生在原生上),Iris 是"替代"(最终要取代原生)。短期 RepGraph 是务实选择,长期 Iris 是方向。

## 关联

- 总览概念:[[three-sync-approaches]]
- 原生数据流:[[property-replication-dataflow]]、[[rpc-flow]]
- 核心实体:[[unetdriver]]、[[uactorchannel]]、[[fReplayout]]
