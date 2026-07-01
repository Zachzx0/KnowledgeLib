---
title: 属性同步数据流 (Property Replication Dataflow)
type: concept
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[uactorchannel]], [[fReplayout]], [rpc-flow], [three-sync-approaches]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# 属性同步数据流

UE 原生同步中,`UPROPERTY(Replicated)` 属性从服务器变更到客户端 `OnRep_XXX` 回调的完整链路。

## 声明侧

```cpp
// 类声明
UPROPERTY(ReplicatedUsing=OnRep_HP)
float HP;

// GetLifetimeReplicatedProps 注册
DOREPLIFETIME(AMyActor, HP);
// 可加条件
DOREPLIFETIME_CONDITION(AMyActor, SecretData, COND_OwnerOnly);
```

`FRepLayout::InitFromClass` 类首次同步时反射扫描,生成 `FRepLayoutCmd` 序列,缓存永久。

## 服务端发送链路

```
游戏代码改属性 (HP -= 10)
  ↓ 只有 Authority 端能改,客户端改了下一次同步会被覆盖
  ↓ Push Model 项目需调 MARK_PROPERTY_DIRTY_FROM_NAME
UWorld::Tick → UNetDriver::TickFlush → ServerReplicateActors  [NetDriver.cpp:1520]
  ↓ 默认约 30Hz (NetServerMaxTickRate)
  ↓
BuildConsiderList  [NetDriver.cpp:2009]
  ↓ 从 NetworkObjects 筛:不 Dormant 且 NextUpdateTime 到期
  ↓ 这份列表被所有 Connection 共享
  ↓
For each UNetConnection:
  IsNetRelevantFor(ViewerPawn, ViewerLoc)  — 剔除不相关
  PrioritizeActors  [NetDriver.cpp:2012]   — NetPriority × (1/DistanceSq) × TimeSinceLast
  按带宽预算截取前 K 个
  ↓
UActorChannel::ReplicateActor()  [ActorChannel.h:194]
  ↓ 首次同步 → 序列化 Actor 类 GUID + Location
  ↓ 收集 Actor + 所有 ReplicatedSubObjects
  ↓ 每个 UObject 一次 FObjectReplicator::ReplicateProperties
  ↓
FRepLayout::DiffProperties  [RepLayout.cpp]
  ↓ 对比 FRepShadowDataBuffer (上次发送的 Shadow State)
  ↓ 逐 FRepLayoutCmd 比对 → dirty handle 列表
  ↓ ⚠️ 原生方案最贵的一步 O(属性数)
  ↓
FRepLayout::SendProperties
  ↓ 每个 dirty handle: 编号(VarInt) + 值(NetSerialize)
  ↓ Vector 走 SerializeCompressedVector (16-bit 量化)
  ↓ 末尾写 Terminator (0)
  ↓
FOutBunch → UChannel::SendBunch → UNetConnection::FlushNet
  ↓ 多个 Bunch 打包成一个 UDP Packet
  ↓ ACK 捎带在下一个 Packet 头里
  ↓
ISocketSubsystem::SendTo  → UDP
```

## 客户端接收链路

```
UIpNetDriver::TickDispatch → UNetConnection::ReceivedRawPacket
  ↓ 解 PacketHeader (PacketId + AckBits)
  ↓ 拆出 Bunch,按 ChannelIndex 派发
  ↓
UActorChannel::ReceivedBunch → ProcessBunch  [ActorChannel.h:178]
  ↓ 首次 → ReadContentBlockPayload 生成 Actor
  ↓ 后续 → FRepLayout::ReceiveProperties
  ↓
ReceiveProperties:
  读 handle (0=终止)
  用同一份 FRepLayoutCmd 找 offset
  NetSerialize 反序列化
  直接写目标 UObject 内存  ← ⚠️ 直接写内存
  ↓
触发 OnRep_XXX (若声明了 ReplicatedUsing)
  ↓ ⚠️ 即使值和之前一样也会触发(除非 REPNOTIFY_OnChanged)
  ↓ OnRep 参数可拿到旧值
```

## 关键设计

### Shadow State + Handle 编号
- 没变的属性完全不写字节
- 变了也只写 handle(1-2 字节)而非属性名
- 同一 UClass 服务器客户端 Layout 一致,handle 编号相同

### 三端分发差异(时序视图)
对同一 Actor 同一时刻:
- **AutonomousProxy 连接**:拿到 `COND_OwnerOnly` / `COND_ReplayOrOwner` 属性(更多字段)
- **SimulatedProxy 连接**:`COND_OwnerOnly` 属性被过滤(敏感数据如金币/装备详情不发)
- **Authority**:不收属性同步,只发

### 客户端处理差异
- **AutonomousProxy**:本地预测 + 收服务器数据用于纠错/rollback。OnRep 常做视觉确认
- **SimulatedProxy**:无输入权,收服务器数据直接展示 + 插值(`SmoothClientPosition`)

## Iris 的根本改进

| 环节 | 原生 | Iris |
|---|---|---|
| 脏检测 | `DiffProperties` 对比 Shadow State(O(属性数)) | `ChangeMask` 位图(O(脏位数)) |
| 序列化 | 每字段写 handle + 值 | 只写 ChangeMask 位段 + 数据(连 handle 都不写) |
| 触发方式 | Poll(每帧 diff) | Push Model(`MARK_PROPERTY_DIRTY` 设位) |

详见 [[three-sync-approaches]]。

## 关联实体

- [[unetdriver]] — 主循环入口
- [[uactorchannel]] — 单 Actor 同步通道
- [[fReplayout]] — 属性布局 + 序列化引擎
