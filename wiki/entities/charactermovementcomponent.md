---
title: UCharacterMovementComponent
type: entity
sources: [raw/articles/CharacterMovementComponent_移动原理分析.md]
related: [[[movement-prediction]], [[rpc-flow]], [[statetree]], [[navmesh-generation]], [[src-cmc-movement]]]
created: 2026-07-02
updated: 2026-07-02
confidence: medium
---

# UCharacterMovementComponent (CMC)

UE5 中负责 `ACharacter` 移动的核心组件:物理模拟(行走/下落/游泳/飞行)、碰撞与地面检测、网络预测同步,全都在这一个组件里。

> ⚠️ 本页基于 [[src-cmc-movement]],其示例代码为教学伪代码,真实 UE 源码的符号名(如 `FSavedMove_Character`、`FNetworkPredictionData_Client_Character`)与文中不完全一致。机制方向可信,具体符号需回源码核对。

## 类继承层次

```
UActorComponent
  └─ UMovementComponent          // UpdatedComponent / Velocity / MoveUpdatedComponent
       └─ UNavMovementComponent  // NavAgentProps,与 navmesh 寻路对接
            └─ UPawnMovementComponent   // PawnOwner / AddInputVector / ConsumeInputVector
                 └─ UCharacterMovementComponent  // MovementMode / PhysWalking / PhysFalling ...
```

`UNavMovementComponent` 这一层说明 CMC 天然与导航系统对接——`MOVE_NavWalking` 模式直接在 navmesh 表面移动(见 [[navmesh-generation]])。

## MovementMode:一个硬编码 FSM

7 种移动模式,`StartNewPhysics` 按当前模式 switch 到对应物理方法:

| 模式 | 物理方法 |
|---|---|
| `MOVE_None` | 无 |
| `MOVE_Walking` | `PhysWalking()` |
| `MOVE_NavWalking` | `PhysNavWalking()` |
| `MOVE_Falling` | `PhysFalling()` |
| `MOVE_Swimming` | `PhysSwimming()` |
| `MOVE_Flying` | `PhysFlying()` |
| `MOVE_Custom` | `PhysCustom()` |

> 这是一个典型的**有限状态机**:状态即 MovementMode,`PhysXXX` 内部检测条件(离地/落地/入水)决定 `SetMovementMode` 切换。与数据驱动的 [[statetree]] 相比,CMC 用的是硬编码 switch——[[src-statetree-demo]] 里"FSM 适合角色移动模式"正是指这个。

## 核心方法链

```
TickComponent(DeltaTime)                    // 入口
  ├─ ConsumeInputVector()                   // 取本帧输入
  ├─ 按 LocalRole 分流:
  │    > ROLE_SimulatedProxy → ControlledCharacterMove()  // 本地/权威角色
  │    == ROLE_SimulatedProxy → SimulatedTick()           // 模拟代理(插值)
  └─ StartNewPhysics(deltaTime, Iterations) // 物理分派器
       └─ switch(MovementMode) → PhysWalking / PhysFalling / ...
```

### PhysWalking / PhysFalling —— 迭代式 sub-stepping
两者都在时间步长循环里:切分 deltaTime → 保存位置/速度 → 应用根运动 → `CalcVelocity` → 移动扫描 → 碰撞/地面检测 → 判断是否切 MovementMode。循环直到时间耗尽或迭代超限。

### CalcVelocity —— 摩擦 → 加速度 → 限速
1. 施加摩擦(流体 vs 地面不同衰减);
2. 叠加 `Acceleration * DeltaTime`;
3. 按 `GetMaxSpeed()` 截断。

### FindFloor —— 地面检测
射线扫描(快速)+ 胶囊体扫描(精确)+ 边缘检测(防掉落)+ 坡度检测(是否可行走)。

## 网络能力

CMC 内置**客户端预测 + 服务器权威校正**,是本组件最复杂的部分,已抽为独立概念页 [[movement-prediction]]。关键:`ServerMove` / `ClientAdjustPosition` 是 Server/Client RPC,走 [[rpc-flow]] 的通道机制。

## 关联

- [[movement-prediction]] — CMC 的网络预测与回滚重放
- [[rpc-flow]] — `ServerMove`/`ClientAdjustPosition` 的 RPC 底层
- [[statetree]] — 与 CMC 的 MovementMode FSM 对照
- [[src-cmc-movement]] — 本页来源
