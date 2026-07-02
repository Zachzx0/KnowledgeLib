---
title: CharacterMovementComponent 移动原理分析(来源)
type: source-summary
sources: [raw/articles/CharacterMovementComponent_移动原理分析.md]
related: [[[charactermovementcomponent]], [[movement-prediction]]]
created: 2026-07-02
updated: 2026-07-02
confidence: medium
---

# CharacterMovementComponent 移动原理分析

## 来源

- **文件**:`raw/articles/CharacterMovementComponent_移动原理分析.md`
- **类型**:技术分析文章(含 Mermaid 类图/时序图/流程图 + 示例代码 + 学习路线)
- **⚠️ 置信度 medium**:文中示例代码(如 `ClientPredictionUpdate`、`MakeShared<FSavedMove>`、`MoveHistory`)是**教学化伪代码**,函数名/结构与 UE5 真实源码不完全一致(真实为 `FSavedMove_Character`、`ClientData->SavedMoves`、`ReplicateMoveToServer` 等)。要点方向正确,具体符号不可当源码引用。

## 这篇资料是什么

一篇讲 `UCharacterMovementComponent`(CMC)移动原理的分析文档,分四块:
1. **类继承层次**:`UActorComponent → UMovementComponent → UNavMovementComponent → UPawnMovementComponent → UCharacterMovementComponent`
2. **移动模式与物理模拟**:7 种 `MovementMode`,各自的 `PhysXXX()` 方法
3. **网络预测与同步**:客户端预测 / 服务器验证 / 位置校正 / 根运动同步
4. **学习路线**:以 CMC 为案例的 C++ + 引擎 + 网络的四阶段进阶规划

## 关键要点

### 1. 移动是一个状态机 + 物理分派器
`TickComponent` 是入口,按角色 `LocalRole` 分流:`> ROLE_SimulatedProxy` 走 `ControlledCharacterMove`(本地/权威),`== ROLE_SimulatedProxy` 走 `SimulatedTick`(插值)。核心分派器 `StartNewPhysics` 按 `MovementMode` switch 到 `PhysWalking` / `PhysFalling` / `PhysFlying` / `PhysSwimming` / `PhysCustom`。这是一个典型的**运行时 FSM**(可与 [[statetree]] 对比:CMC 用硬编码 switch,StateTree 用数据驱动)。

### 2. 物理模拟是迭代式的(sub-stepping)
`PhysWalking` / `PhysFalling` 都在一个"时间步长循环"里跑:切分 deltaTime → 保存位置/速度 → 应用根运动 → `CalcVelocity` → 移动扫描 → 碰撞/地面检测 → 决定是否切换 MovementMode。循环直到时间耗尽或迭代超限。

### 3. 速度计算 `CalcVelocity`:摩擦 → 加速度 → 限速
先按流体/地面施加摩擦(减速),再叠加 `Acceleration * DeltaTime`,最后按 `GetMaxSpeed()` 截断。

### 4. 网络预测 = 客户端预测 + 服务器权威校正
这是本篇与已有网络同步知识**咬合最紧**的部分,已抽为独立概念页 [[movement-prediction]]:客户端保存 `FSavedMove` 历史 → `ServerMove` 上传 → 服务器权威重算 → 位置超差则 `ClientAdjustPosition` 下发 → 客户端回滚到校正点 + 重放未确认输入 + 平滑过渡。

### 5. 根运动(Root Motion)需要专门的网络同步
`ROLE_AutonomousProxy` 预测根运动位移并累积,`ROLE_Authority` 验证根运动合法性,不匹配则校正。

## 与已有知识的关联

- **填补了此前的空白**:[[src-ue-networking-overview]] 的"局限"里明确写了「没有覆盖:网络预测的具体数学(ClientAdjustPosition 的阈值算法)、移动预测」。本篇正好补上移动预测的完整流程(尽管阈值的**具体数学公式**仍未给出,只到 `PositionTolerance` 比较这一层)。
- **复用底层**:`ServerMove` / `ClientAdjustPosition` 本质是 Server/Client RPC,走 [[rpc-flow]] 的 `UActorChannel` + `FOutBunch` 通道。
- **三端角色一致**:本篇的 Authority / AutonomousProxy / SimulatedProxy 分工与 [[property-replication-dataflow]] 的三端分发差异完全一致。

## 局限与存疑

- 示例代码是伪代码(见上方置信度说明)。
- 未给出 `ServerCheckClientError` 的具体误差阈值算法(仍是本 Wiki 的知识缺口)。
- 未涉及 UE5 的异步物理(Async Tick / Physics Thread)在 CMC 中的真实落地细节,仅在时序图里提了一个 `BuildAsyncInput/ProcessAsyncOutput` 分支。
