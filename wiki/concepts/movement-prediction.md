---
title: 移动预测与服务器校正 (Movement Prediction)
type: concept
sources: [raw/articles/CharacterMovementComponent_移动原理分析.md]
related: [[[charactermovementcomponent]], [[rpc-flow]], [[property-replication-dataflow]], [[three-sync-approaches]], [[src-cmc-movement]]]
created: 2026-07-02
updated: 2026-07-02
confidence: medium
---

# 移动预测与服务器校正

`UCharacterMovementComponent` 的多人同步核心:**客户端预测(Client-Side Prediction)+ 服务器权威校正(Server Reconciliation)+ 回滚重放(Rollback & Replay)**。目标是让本地玩家零延迟感操作,同时服务器保持权威、防作弊。这套范式从 Quake III 沿用至今。

> ⚠️ 本页基于 [[src-cmc-movement]] 的教学伪代码,真实 UE 符号为 `FSavedMove_Character`、`ClientData->SavedMoves`、`ReplicateMoveToServer`、`ServerMoveHandleClientError` 等,与文中 `FSavedMove`/`MoveHistory`/`ClientPredictionUpdate` 不完全对应。机制方向可信。

## 三端角色分工

| 角色 | 行为 |
|---|---|
| **Authority(服务器)** | 唯一权威。用客户端上报的输入重算移动,与客户端结果比对,超差则强制拉回 |
| **AutonomousProxy(本地玩家)** | 立即本地预测执行(0 延迟感) + 保存输入历史 + 异步等服务器确认 + 出错回滚重放 |
| **SimulatedProxy(其他玩家)** | 无输入权,收 ~100ms 前的快照,靠 `SmoothClientPosition` 插值平滑显示 |

这与 [[property-replication-dataflow]] 的三端分发差异是同一套角色模型。

## 完整链路

```
【客户端 AutonomousProxy】
输入 → 保存 SavedMove(记录输入+时间戳+结果) → 加入未确认历史队列
     → 本地立即 PerformMovement(预测执行,画面无延迟)
     → ServerMove RPC 上传(时间戳 + 压缩加速度 + ClientLoc + MoveFlags + MovementMode)

【服务器 Authority】ServerMove_Implementation
  1. IsValidTimeStamp() 校验时间戳
  2. IsMoveValid() 验证移动合法性 → 非法则惩罚/断连(防作弊)
  3. 应用客户端输入 → PerformMovement() 权威重算
  4. 比较 ServerLocation vs ClientLoc:
       超过 PositionTolerance → ClientAdjustPosition RPC 下发校正

【客户端】ClientAdjustPosition_Implementation
  1. 按时间戳找到对应的历史 SavedMove
  2. 回滚到该校正点,丢弃已确认的旧记录
  3. 应用服务器权威位置/速度
  4. 重放(replay)队列里所有"未被确认"的输入 → 追回当前帧
  5. bSmoothCorrections → SmoothCorrection() 平滑过渡,避免瞬移
```

## 关键设计

### 1. 预测的本质是"乐观执行 + 可回滚"
客户端不等服务器,先按输入本地跑;服务器确认没问题就皆大欢喜,出错才回滚重放。**回滚时会重放所有未确认输入**,所以玩家的连续操作不会因一次校正而丢失。

### 2. 校正的触发是"位置超差"
服务器不是每帧都下发校正,而是**只在客户端结果与权威结果的偏差超过 `PositionTolerance` 时**才发 `ClientAdjustPosition`。这省了大量带宽。

> ⚠️ 知识缺口:`ServerCheckClientError` / `ServerMoveHandleClientError` 的**具体误差阈值算法**([[src-ue-networking-overview]] 与本篇都点了名却未给出数学)。这仍是本 Wiki 待补的空白,建议后续找一份源码级剖析。

### 3. 走 RPC 通道
`ServerMove`(Server RPC)、`ClientAdjustPosition`(Client RPC)本质是 [[rpc-flow]] 里的方向性 RPC,复用 `UActorChannel` + `FOutBunch`。移动数据用增量压缩 + 时间戳同步降低带宽。

### 4. 根运动(Root Motion)需专门同步
AutonomousProxy 预测根运动位移并累积,Authority 验证其合法性,不匹配则校正——动画驱动的位移也纳入同一套预测/校正框架。

## 与整体网络架构的关系

移动预测是 UE 原生同步之上的**专用子系统**:属性同步([[property-replication-dataflow]])管一般状态,移动预测管高频、强交互、需零延迟感的位置数据。三代方案背景见 [[three-sync-approaches]]。

## 关联

- [[charactermovementcomponent]] — 承载本机制的组件
- [[rpc-flow]] — `ServerMove`/`ClientAdjustPosition` 的底层通道
- [[property-replication-dataflow]] — 共享三端角色模型
- [[src-cmc-movement]] — 本页来源
