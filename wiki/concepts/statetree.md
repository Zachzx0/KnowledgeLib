---
title: StateTree 层级状态决策模型
type: concept
sources: [raw/articles/StateTree_Learn.html]
related: [[[ai-decision-models]], [[goap]], [[utility-ai]], [[charactermovementcomponent]], [[src-statetree-demo]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# StateTree 层级状态决策模型

UE5 的 StateTree 是一种运行时决策模型,**融合了有限状态机(长期状态、显式跳转)与行为树(层级嵌套、分类到具体)**,再加上数据绑定与事件驱动。一句话:**保持一条从根到叶的活跃状态路径,在 Tick/Event 时评估是否切换**。

## 五个构件

| 构件 | 作用 |
|---|---|
| **State** | 当前在做什么;可层级嵌套(Root → Top State → Leaf State) |
| **Task** | 进入状态后执行的行为(`MoveToPatrolPoint`、`Aim+Fire`) |
| **Condition** | 允许**进入**某状态的门槛(选分支) |
| **Transition** | 触发**切换**的时机:On Tick / On Event / On Task Completed |
| **Evaluator** | 每 Tick 持续读世界、算派生数据(`threatLevel`、`shouldFight`) |

## 运行机制

### 活跃路径选择
从 Root 向下,每层选**第一个 Condition 通过的子状态**递归,直到叶子。示例(巡逻守卫):

```
Root
├─ Combat      (targetVisible || enemyDist<45)
│   ├─ Retreat  (health<35 && cover)      ← 保命优先
│   ├─ Reload   (ammo==0)
│   ├─ Attack   (ammo>0 && visible)       ← 默认战斗
│   └─ Chase    (!visible && dist<45)
├─ Investigate (heardNoise)
│   ├─ LookAround   (dist>=45)
│   └─ ApproachNoise(dist<70)
└─ Patrol      (hasRoute)
    ├─ MovePatrol (hasRoute && !noise)
    └─ IdleAtPost (true)                  ← 恒真兜底
```

### 关键模式
- **恒真兜底叶子**:每个分支末尾放一个 condition 恒 `true` 的叶子,保证总有可选状态。
- **求值顺序**:每 Tick 先 Evaluator 更新感知 → 再 Transition 检查 → 需要重选就从父向子挑分支。
- **事件驱动跳转**:外部 Event(听到噪声、受伤)可通过 On Event Transition 打断当前状态直接跳转。

## StateTree vs FSM vs 行为树

| 模型 | 适合 | 理解重点 |
|---|---|---|
| **FSM** | 状态少、跳转清晰(门开关、[[charactermovementcomponent]] 的 MovementMode) | 我在哪个状态,满足条件跳到哪 |
| **行为树** | 每帧从根按优先级搜可执行行为 | 每次从树上找一个能跑的行为 |
| **StateTree** | 既要长期状态,又要层级选择/数据绑定/事件跳转 | 保持一条活跃路径,Tick/Event 时评估切换 |

## 映射到 UE 编辑器

`Schema/Context`(Actor/Component/外部数据)→ `Evaluators` → `States + Tasks` → `Transitions`。通过 `StateTreeComponent` / `StateTreeAIComponent` 挂到 Actor 上运行。

## 与其它决策模型的关系

- StateTree 保留"当前状态"的概念(像 FSM),而 [[utility-ai]] 每帧无记忆重新评分、[[goap]] 每次重新规划路径。
- 横向对比见 [[ai-decision-models]]。
- 呼应 [[charactermovementcomponent]]:CMC 的 MovementMode 是硬编码 FSM,StateTree 是它的数据驱动升级版思路。

## 局限

- 来源 demo 的选择逻辑简化为"选第一个通过的子状态",真实 StateTree 支持优先级与更丰富的 selection behavior。
- 未涉及非 AI 的 Gameplay 场景应用与具体接入细节。
