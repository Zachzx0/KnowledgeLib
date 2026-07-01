---
title: RPC 数据流 (RPC Flow)
type: concept
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[uactorchannel]], [[fReplayout]], [property-replication-dataflow]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# RPC 数据流

UE 网络中 `UFUNCTION(Server / Client / NetMulticast)` 三种方向 RPC 的完整调用链。原生实现走 `UActorChannel` + `FOutBunch`;Iris 走 `AttachmentReplication` 独立通道。

## 声明侧

```cpp
UFUNCTION(Server, Reliable, WithValidation)
void ServerFire(int32 Dmg);   // UHT 生成 ServerFire_Implementation + thunk

UFUNCTION(Client, Unreliable)
void ClientPlayHitSound();

UFUNCTION(NetMulticast, Unreliable)
void MulticastPlayExplosion(FVector Loc);
```

UHT 生成的 thunk 会先检查 `GetNetMode()`:服务端调 → 直接跳 `_Implementation`(本地执行);客户端调 → 走网络路径。

## 通用调用链

```
游戏代码: Actor->ServerFire(params)
  ↓ 进入 UHT 生成的 thunk
  ↓
AActor::CallRemoteFunction  [Actor.cpp:5242]
  ↓ 枚举 GetNetDriverList 的所有 NetDriver (Game / Demo / Beacon)
  ↓ 对每个调 ProcessRemoteFunction
  ↓
UNetDriver::ProcessRemoteFunction  [NetDriver.cpp:7418]
  ↓ 判定方向:
  ↓   Server RPC   → 找 ServerConnection (客户端唯一)
  ↓   Client RPC   → Actor->GetNetConnection() (OwningConnection)
  ↓   Multicast    → 广播到所有 Client Connection
  ↓ 找不到目标连接 → 静默丢弃
  ↓
InternalProcessRemoteFunctionPrivate  [NetDriver.cpp:2461]
  ↓ 找/新建目标 UActorChannel
  ↓
ProcessRemoteFunctionForChannelPrivate  [NetDriver.cpp:2593]
  ↓ 1. 若 Channel.OpenPacketId==INDEX_NONE → 先 ReplicateActor() 建立通道
  ↓ 2. 新建 FOutBunch Bunch(Ch, 0)
  ↓ 3. 若 FUNC_NetReliable → Bunch.bReliable=1
  ↓ 4. 序列化参数 → FNetBitWriter TempWriter
  ↓ 5. 写 header + payload 到 Bunch
  ↓ 6. Ch->SendBunch(&Bunch, true)
  ↓
FRepLayout::SendPropertiesForRPC
  ↓ RPC 参数当作"临时结构体"逐字段 NetSerialize
  ↓ Object 引用 → FNetworkGUID
  ↓ 引用不到 → 进 Unmapped 队列等 GUID
  ↓
WriteFieldHeaderAndPayload + WriteContentBlockPayload  [DataChannel.cpp]
  ↓ Bunch 结构: [ContentBlockHeader | FieldHeader | Payload]
  ↓   ContentBlockHeader: 目标 SubObject GUID / bStablyNamed
  ↓   FieldHeader:        FieldNetIndex (RPC 在类中的编号)
  ↓   Payload:            参数序列化 bit 流
```

## 三方向差异

### ① Server RPC(客户端 → 服务端)
- **只能从拥有该 Actor 的客户端调用**(AutonomousProxy)。SimulatedProxy 调用会被 `GetNetConnection()` 返回 nullptr 而丢弃
- 典型场景:玩家按开火键 → `ServerFire()` → 服务端权威判定
- **Validate 防作弊**:带 `WithValidation` 的 Server RPC 必须提供 `ServerFire_Validate`。返回 false → 服务器**直接踢出该客户端**
  - 例:客户端上报"扣了敌人 999999 血" → Validate 检查上限 → false → 踢
- Reliable Server RPC 存 `OutRec` 链表,丢包重发;Unreliable 丢了就丢

### ② Client RPC(服务端 → 单个拥有者客户端)
- **只发给该 Actor 的 OwningConnection**,不广播
- SimulatedProxy **永远收不到别人的 Client RPC**——天然数据私密性
- 典型场景:服务器判定"你被击中" → `ClientPlayHitSound()` → 只在受害玩家屏幕播放
- 纯表现层,不改 Replicated 状态

### ③ Multicast RPC(服务端 → 所有相关客户端)
- **遵循网络相关性**:远处客户端若对该 Actor 无 Channel,就收不到
- 服务端发起时**自己也执行一次** Implementation(NM_ListenServer 场景)
- ⚡ **合批优化**(NetDriver.cpp:2820):
  ```cpp
  QueueBunch = (!Bunch.bReliable && Function->FunctionFlags & FUNC_NetMulticast)
  ```
  不可靠 Multicast 不立即发,入队 `QueuedExportBunches`,等下一次 Actor 属性同步时合批发出——省 Bunch header + 增加 UDP 合批率
- ⚠️ **Multicast 可能因相关性丢失**。若需所有玩家状态一致,推荐:服务端改 Replicated 属性 + Multicast 只做特效

## 客户端解包

```
UIpNetDriver::TickDispatch → UNetConnection::ReceivedRawPacket
  ↓ 解 PacketHeader → 拆 Bunch
  ↓
UActorChannel::ReceivedRawBunch → ProcessBunch  [ActorChannel.h:178]
  ↓ 读 ContentBlockHeader → 找目标 SubObject
  ↓ 读 FieldHeader → ClassCache 查到 UFunction
  ↓ FRepLayout::ReceivePropertiesForRPC 反序列化参数
  ↓
Object->ProcessEvent(Function, Parms)
  ↓ 真正调用 ServerXXX_Implementation / ClientXXX_Implementation
```

## 关键事实

- **UE 的 UDP 包永远是复合包**:一个 Packet 里可能塞属性同步 Bunch + 多个 RPC Bunch
- **ACK 是捎带的**:不独立发包,而是在下一个 Packet 头里(PacketId + AckBits)
- **大 Bunch 自动拆分**:`PartialBunch`(bPartial=1)
- **可靠 Bunch 存 OutRec**:直到 ACK 才释放,丢包自动重发

## 关联实体

- [[unetdriver]] — RPC 派发中枢
- [[uactorchannel]] — RPC 打包与解包通道
- [[fReplayout]] — `SendPropertiesForRPC` 参数序列化
- 与 [[property-replication-dataflow]] 共用底层 FRepLayout 与 Bunch 机制
