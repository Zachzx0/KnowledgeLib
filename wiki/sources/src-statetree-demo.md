---
title: UE StateTree 可视化学习 Demo(来源)
type: source-summary
sources: [raw/articles/StateTree_Learn.html]
related: [[[statetree]], [[ai-decision-models]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# UE StateTree 可视化学习 Demo

## 来源

- **文件**:`raw/articles/StateTree_Learn.html`
- **类型**:单页交互式 demo(可运行的 StateTree 求值器 + 可视化)
- **主题**:UE5 的 StateTree —— 层级状态选择型运行时决策模型

## 这篇资料是什么

用一个"巡逻 AI 守卫"的例子演示 StateTree:调黑板数据(敌人距离/生命/弹药/是否听到噪声...)、切场景预设、Tick、发事件,实时看它如何重新选出活跃状态路径。它自带一个可运行的 StateTree 求值实现。

## StateTree 一句话(demo 原话)

> 它不是单纯的行为树,也不是只会跳转的有限状态机,而是把"层级状态选择、条件判断、任务执行、外部数据评估、事件驱动跳转"组合在一起的运行时决策模型。

## 五个核心构件

| 构件 | 作用 |
|---|---|
| **State** | 当前正在做什么(可层级嵌套:Root → Top State → Leaf State) |
| **Task** | 进入某状态后执行什么行为(如 `MoveToPatrolPoint`、`Aim + Fire`) |
| **Condition** | 什么时候**允许进入**某状态(选择分支的门槛) |
| **Transition** | 什么时候**切换**状态(On Tick / On Event / On Task Completed) |
| **Evaluator** | 每 Tick 持续读世界、计算派生数据(如 `threatLevel`、`shouldFight`) |

## 运行机制要点(从 demo 源码提炼)

- **活跃路径(active path)**:StateTree 始终维持一条从 Root 到某个 Leaf 的活跃状态链。`chooseActivePath` 从根节点向下,在每层**选第一个 Condition 通过的子状态**递归下去,直到叶子。
  - demo 的巡逻守卫顶层三分支:`Combat`(目标可见或距离<45)→ `Investigate`(听到噪声)→ `Patrol`(有巡逻路线),按顺序择一。
  - Combat 内叶子:`Retreat`(血<35且有掩体)/ `Reload`(弹=0)/ `Attack`(有弹且可见)/ `Chase`(不可见但距离<45)。
- **兜底状态**:`IdleAtPost` 的 condition 恒为 `true`,保证 Patrol 分支永远有可选叶子——**层级最后放一个恒真兜底**是 StateTree 常见模式。
- **求值顺序**:每 Tick 先让 Evaluator 更新感知摘要,再做 Transition 检查,需要重选时从父向子挑满足条件的分支。
- **事件驱动**:"噪声事件""受伤事件"按钮演示 On Event Transition——外部事件可打断当前状态直接跳转。

## StateTree vs 行为树 vs FSM(demo 对比表)

| 模型 | 适合表达 | 理解重点 |
|---|---|---|
| **FSM** | 状态少、跳转清晰(门开关、角色移动模式) | "我在哪个状态,满足条件跳到哪" |
| **Behavior Tree** | 每帧从根按优先级搜可执行行为 | "每次从树上找一个能跑的行为" |
| **StateTree** | 既要长期状态,又要层级选择/数据绑定/事件跳转 | "保持一条活跃状态路径,在 Tick/Event 时评估是否切换" |

## 映射到 UE 编辑器

`Schema/Context`(Actor/Component/外部数据)→ `Evaluators`(持续计算感知)→ `States + Tasks`(进入后执行)→ `Transitions`(On Tick / On Event / On Task Completed)。

## 与已有知识的关联

- 与 [[goap]]、[[utility-ai]] 同属 AI 决策模型,横向对比见 [[ai-decision-models]]。
- demo 里"FSM 适合角色移动模式"这句,正好呼应 [[charactermovementcomponent]] 用 `MovementMode` switch 做的硬编码 FSM——CMC 的移动模式切换就是典型 FSM。

## 局限

- demo 的选择逻辑是"选第一个通过的子状态",真实 StateTree 支持优先级、`Transition` 更丰富的触发条件与 selectionbehavior。
- 未涉及 StateTree 与 Gameplay(非 AI)场景、`StateTreeComponent`/`StateTreeAIComponent` 的具体接入。
