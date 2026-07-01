---
title: UNetDriver
type: entity
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[uactorchannel]], [[fReplayout]], [property-replication-dataflow], [rpc-flow]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# UNetDriver

UE 网络同步的**顶层驱动类**。一个 NetDriver 实例对应一种网络场景(Game NetDriver / Demo NetDriver / Beacon NetDriver),`UNetDriver::ServerReplicateActors` 是服务端每帧同步的入口。

## 源码位置

- `Runtime/Engine/Classes/Engine/NetDriver.h`
- `Runtime/Engine/Private/NetDriver.cpp`(主循环 `:1520`、ConsiderList `:2009`、Prioritize `:2012`、RPC 派发 `:7418`、`InternalProcessRemoteFunctionPrivate` `:2461`、`ProcessRemoteFunctionForChannelPrivate` `:2593`、Multicast 队列 `:2820`)

## 核心职责

### 1. 主循环 `ServerReplicateActors`
服务端每帧调用一次,子步骤:
1. `_PrepConnections` — 更新每个连接的 Viewer(ViewerPawn / ViewerLoc)
2. `_BuildConsiderList` — 从 `NetworkObjects` 收集不 Dormant 且 `NextUpdateTime` 到期的 Actor(**所有 Connection 共享一份**)
3. 遍历每个 Connection:
   - `_PrioritizeActors` — `Actor->NetPriority × (1/DistanceSq) × TimeSinceLastUpdate`
   - `_ProcessPrioritizedActorsRange` — 逐个调用 `UActorChannel::ReplicateActor`

### 2. Connection 管理
持有 `ClientConnections` 数组。每个 `UNetConnection` 持有自己的 `UActorChannel` 数组、Bunch 打包缓冲、可靠性 ACK 记录。

### 3. RPC 派发 `ProcessRemoteFunction`
- Server RPC → 找 `ServerConnection`(客户端唯一那个)
- Client RPC → `Actor->GetNetConnection()`(OwningConnection)
- Multicast → 广播到所有 Client Connection

关键源码(NetDriver.cpp:7418):
```cpp
Driver.NetDriver->ProcessRemoteFunction(this, Function, Parameters, OutParms, Stack, nullptr);
```

### 4. Multicast 合批优化(NetDriver.cpp:2820)
```cpp
QueueBunch = (!Bunch.bReliable && Function->FunctionFlags & FUNC_NetMulticast)
```
不可靠 Multicast 不立即发,入队 `QueuedExportBunches`,等下一次 Actor 属性同步时合批发出。

## 复杂度

**O(N × M)**:N 个 Actor × M 个 Connection,每个都要做 `IsNetRelevantFor` 检查。这是原生方案在大规模场景(如 Fortnite 100 玩家)CPU 爆炸的根因,也是 [[three-sync-approaches|ReplicationGraph]] 要解决的核心问题。

## 关联

- 被 [[property-replication-dataflow]] 作为主循环入口
- 被 [[rpc-flow]] 作为 RPC 派发中枢
- 与 [[uactorchannel]] 是 1:N 关系(一个 NetDriver 管多个 Connection,每个 Connection 管多个 ActorChannel)
- ReplicationGraph 通过实现 `UReplicationDriver` 接口**替换** `ServerReplicateActors`,但 NetDriver 本身仍存在
