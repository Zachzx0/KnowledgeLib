---
title: UActorChannel
type: entity
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[fReplayout]], [[property-replication-dataflow]], [[rpc-flow]], [[src-ue-networking-overview]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# UActorChannel

UE 原生同步的**单 Actor 同步通道**。一个 Actor 对应一个 UActorChannel(每 Connection 独立),承担"把这个 Actor 的状态序列化成 Bunch 并发送/接收"的全部职责。

## 源码位置

- `Runtime/Engine/Classes/Engine/ActorChannel.h`(声明 `:178` ProcessBunch、`:194` ReplicateActor)
- `Runtime/Engine/Private/DataChannel.cpp`(实现)

## 核心方法

### `ReplicateActor()`(服务端 → 客户端)
单 Actor 单次同步的核心,步骤:
1. **首次同步** → 序列化 Actor 类信息(生成通道,发 Actor GUID + Location)
2. 收集 Actor 及其所有 `ReplicatedSubObjects`(Component)
3. 每个 UObject 调 `FObjectReplicator::ReplicateProperties`
4. 用 [[fReplayout|FRepLayout]] diff 出脏字段
5. `WriteContentBlockPayload` 写入 Bunch
6. `SendBunch`

### `ProcessBunch()`(客户端收包)
客户端解 Bunch:
- 首次 → `ReadContentBlockPayload` 生成 Actor
- 后续 → `FRepLayout::ReceiveProperties` 反序列化并**直接写内存**
- 触发 `OnRep_XXX` 回调
- RPC → 查 `ClassCache` 找 UFunction → `ProcessEvent`

### `SendBunch()`
把 Bunch 塞进 `UNetConnection` SendBuffer:
- 可靠 Bunch 存入 `OutRec` 链表,直到 ACK 才释放
- 大 Bunch 自动拆成 `PartialBunch`(bPartial=1)
- `bMerge=true` 允许与前一个 Bunch 合并省 header

## Bunch 结构

一个 `FOutBunch` = 一次逻辑消息(一次属性更新 / 一个 RPC)。Header 包含:
- `ChannelIndex`
- `bReliable`
- `bOpen` / `bClose`
- `PacketID`

多个 Bunch 被 `UNetConnection::PrepareWriteBitsToSendBuffer` 打包成一个 UDP Packet。RPC Bunch 内部结构:
```
[ContentBlockHeader | FieldHeader | Payload]
```
- `ContentBlockHeader`:目标 SubObject GUID / bStablyNamed
- `FieldHeader`:`FieldNetIndex`(RPC 在类中的编号)
- `Payload`:参数序列化后的 bit 流

## 关键设计

### "一个 Actor 一个 Channel"
这是原生方案的**根本约束**。Iris 通过 `FNetRefHandle` + `UObjectReplicationBridge` 取代了这个模型——不再受 128 通道限制,可以桥接任意 UObject,而非 Actor 中心。

### 与 ReplicationGraph 的关系
[[three-sync-approaches|ReplicationGraph]] **只替换了"选谁同步"**,Gather 出来的候选列表仍然走 `UActorChannel::ReplicateActor` 全套底层。也就是说,RepGraph 场景下 UActorChannel 依然存在并工作。

## 关联

- 被 [[unetdriver]] 创建并管理
- 用 [[fReplayout]] 做实际序列化
- 被 [[property-replication-dataflow]] 和 [[rpc-flow]] 作为核心节点
