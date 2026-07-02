---
title: AI 决策模型横向对比 (FSM / BT / StateTree / GOAP / Utility AI)
type: comparison
sources: [raw/articles/GOAP可视化学习.html, raw/articles/StateTree_Learn.html, raw/articles/Utility_AI_Learn.html]
related: [[[goap]], [[statetree]], [[utility-ai]], [[charactermovementcomponent]], [[src-goap-demo]], [[src-statetree-demo]], [[src-utility-ai-demo]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# AI 决策模型横向对比

本次摄入的三份 AI demo([[src-goap-demo]]、[[src-statetree-demo]]、[[src-utility-ai-demo]])各自都带了"和其它模型的区别"对比卡。把它们与 FSM、行为树合并成一张全景图。

## 一句话本质

| 模型 | 核心问题 | 决策方式 |
|---|---|---|
| **FSM(有限状态机)** | 我现在在哪个状态? | 显式状态 + 条件跳转 |
| **Behavior Tree(行为树)** | 每帧从树上找一个能跑的行为 | 从根按优先级遍历,选第一个可执行叶子 |
| **StateTree** | 保持哪条活跃状态路径? | 层级状态选择 + 数据绑定 + 事件跳转 |
| **GOAP** | 怎么达成目标? | 描述动作(前置/效果/代价),规划器搜动作链 |
| **Utility AI** | 现在做什么最划算? | 每个行为按局势打 0~1 分,选最高分 |

## 关键维度对比

| 维度 | FSM | 行为树 | StateTree | GOAP | Utility AI |
|---|---|---|---|---|---|
| **是否有"当前状态"记忆** | ✅ 强 | ❌ 每帧重搜 | ✅ 活跃路径 | ❌ 每次重规划 | ❌ 每帧重评分 |
| **决策是编排还是求解** | 编排 | 编排 | 编排(数据驱动) | **求解**(搜索) | **求解**(打分) |
| **应对动态变化** | 差(手写跳转) | 中 | 好(事件驱动) | **很好**(重规划) | **很好**(重评分) |
| **可预测/可控性** | 高 | 高 | 中高 | 中(链可能出人意料) | 低(易抖动) |
| **多步前瞻规划** | ❌ | ❌ | ❌ | ✅ | ❌ |
| **扩展成本(加行为)** | 高(状态×跳转爆炸) | 中(分支变长) | 中 | **低**(加 action 即可) | **低**(加 consideration) |
| **典型痛点** | 状态/跳转组合爆炸 | 分支多后变硬变长 | 配置复杂 | 状态空间爆炸、搜索开销 | 行为抖动(thrashing) |

## 怎么选

- **状态少、跳转清晰** → FSM(如 [[charactermovementcomponent]] 的 MovementMode)。
- **需要长期状态 + 层级 + 事件驱动,且要可控** → StateTree(UE5 官方主推)。
- **动作多、需要"规划几步后达成目标"、执行中常失败要重来** → GOAP。
- **多个动机连续竞争、要动态权衡** → Utility AI。
- **经典可控的分层行为** → 行为树。

## 可组合,不互斥

这些模型常**混用**:
- **Utility + GOAP**:Utility 选"该追求哪个目标",GOAP 规划"如何到达"([[src-goap-demo]] 的自动目标选择就是这个组合)。
- **StateTree/BT + Utility**:在某个状态/节点内部用 Utility 打分选具体子行为。
- **顶层 FSM + 局部规划**:大状态用 FSM 切,战斗状态内用 GOAP/Utility。

## 与移动/导航的衔接

决策模型只产出"做什么/去哪",真正把决策变成移动要靠 [[charactermovementcomponent]](执行位移)+ [[navmesh-generation]](寻路路径)。决策层与运动层解耦。

## 来源

三份来源都是**可运行的交互式 demo**,自带实现代码,置信度高。但都是通用教学模型,不含 UE 具体框架接入细节(StateTree 是唯一 UE 官方内置的;GOAP/Utility 在 UE 中需自研或插件)。
