---
title: FRepLayout
type: entity
sources: [knowledge/game-dev/ue_networking_overview.html]
related: [[[unetdriver]], [[uactorchannel]], [[property-replication-dataflow]], [[rpc-flow]], [[src-ue-networking-overview]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# FRepLayout

UE 原生同步的**属性布局描述符 + 序列化引擎**。基于反射在类首次被同步时一次性生成,缓存永久。之后每帧的 diff、序列化、反序列化、RPC 参数打包都查这份 Layout 表。

## 源码位置

- `Runtime/Engine/Private/Net/RepLayout.cpp`

## 初始化 `InitFromClass`

类首次被同步时构建。扫描所有 `UPROPERTY(Replicated)`:
- 生成 `FRepLayoutCmd` 序列(每个 Cmd 描述 offset + size + property + CmdType)
- 展开数组和嵌套结构
- 建立 handle 编号(同一 UClass 服务器和客户端 Layout 一致,编号相同)

## 核心方法

### `DiffProperties`(原生同步最贵的一步)
- 每个 UObject 的 `FObjectReplicator` 保存一份 `FRepShadowDataBuffer`——上次成功发送的所有属性值副本
- 每帧 diff:逐 `FRepLayoutCmd` 比对当前值 vs Shadow → 生成 `ChangedPropertyTracker`(dirty handle 列表)
- **复杂度 O(属性数)**——这是原生方案的瓶颈
- ⚠️ [[three-sync-approaches|Iris]] 的 Push Model + ChangeMask 就是为消灭这一步

### `SendProperties`(只写脏字段)
对每个 dirty handle 写:
- handle 编号(VarInt 压缩,1-2 字节)
- 值(用属性对应的 `NetSerialize`)
  - Vector → `SerializeCompressedVector`(16-bit 量化)
  - Rotator → 压缩到 8-bit
- 末尾写 Terminator (0)

**没变的属性完全不写字节**——这是 UE4/5 相对 UE3 的关键带宽优化(UE3 用属性名 hash 作 tag,很浪费)。

### `SendPropertiesForRPC`
RPC 参数被当作一个"临时结构体",逐字段调 `NetSerialize`。和属性同步共用同一套 RepLayout。特殊处理:
- Object 引用转成 `FNetworkGUID`
- 引用不到时进 `Unmapped` 队列等 GUID 到达

### `ReceiveProperties`(客户端反序列化)
读 handle 循环:
- 读 handle 编号(0=终止)
- 用同一份 `FRepLayoutCmd` 找到属性 offset
- `NetSerialize` 反序列化
- **直接写目标 UObject 内存**

## 关键演进:Iris 的替代方案

| 维度 | 原生 FRepLayout | Iris |
|---|---|---|
| 属性布局 | 运行时反射生成 | `FReplicationStateDescriptor` 编译期生成 |
| 脏检测 | `DiffProperties` 对比 Shadow State(O(属性数)) | `ChangeMask` 位图(O(脏位数)) |
| 序列化 | 每字段写 handle + 值 | 只写 ChangeMask 位段 + 数据(连 handle 都不写) |
| 通道绑定 | 依附于 `UActorChannel` | 脱离 ActorChannel,走 `ReplicationWriter` |

## 关联

- 被 [[uactorchannel]] 持有并调用
- 被 [[property-replication-dataflow]] 作为脏检测 + 序列化核心
- 被 [[rpc-flow]] 作为 RPC 参数序列化器
