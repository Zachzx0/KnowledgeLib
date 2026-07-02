---
title: GOAP 交互式 Demo(来源)
type: source-summary
sources: [raw/articles/GOAP可视化学习.html]
related: [[[goap]], [[ai-decision-models]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# GOAP 交互式 Demo

## 来源

- **文件**:`raw/articles/GOAP可视化学习.html`
- **类型**:单页交互式 demo(可运行的 GOAP 规划器 + 可视化)
- **主题**:Goal-Oriented Action Planning(目标导向行动规划)

## 这篇资料是什么

一个可交互的 GOAP 教学 demo,用"地牢撤离"场景演示:改 World State / 选目标 / 单步执行 / 模拟动作失败,实时看规划器如何搜出动作链。它自带一个**真实可运行的规划器实现**(见下方"实现要点"),不是纯文字讲解。

## 核心思想(demo 原话)

> GOAP 的核心不是"写一棵很大的行为树",而是把世界描述成事实,把行为描述成"前置条件 + 效果 + 代价",再让规划器自动找出能达成目标的动作链。

## GOAP 四件套

| 组件 | 含义 | demo 中的例子 |
|---|---|---|
| **World State** | 世界事实(布尔集合) | `injured`、`hasWeapon`、`enemyNear`、`chestReachable` |
| **Goal** | 目标条件 | "活下来" = `injured:false` 且 `enemyNear:false` |
| **Action** | 前置条件 + 效果 + 代价 | `Heal`:前置 `hasPotion&injured` → 效果 `injured:false` → cost 1 |
| **Planner** | 从当前事实搜索总代价最低、能满足目标的动作链 | 见实现要点 |

## 实现要点(从 demo 源码提炼)

- **状态表示**:World State 是一组布尔键值;动作 `pre`/`effects` 都是"部分状态"匹配/覆盖。
- **规划算法**:是 **Dijkstra / 均匀代价搜索**(uniform-cost search)——`open` 列表按累计 `cost` 升序排序,每次弹出最低代价节点,展开所有前置满足的 action,用 `best` map 做已访问状态剪枝(`keyOf(state)` 序列化状态为 key),命中目标即返回路径。`guard < 800` 防死循环。
  - 注意:demo 里排序取最小其实是 Dijkstra 行为;经典 GOAP 论文用的是 **A***(带启发式 h = 未满足的目标条件数),demo 未加启发式。
- **重规划(replanning)**:"模拟第一步失败"按钮把该 action 临时 `blockedActionId` 屏蔽,重新规划——体现 GOAP 的关键优势:**执行中动作失效可立刻重新求解**,不用手改流程。
- **自动目标选择**:`utility` 函数给目标打分(受伤/遇敌 → "活下来" 100 分),这其实是**在 GOAP 之上叠了一层 Utility 式目标选择**——见 [[utility-ai]]。

## 与已有知识的关联

- 与 [[statetree]]、[[utility-ai]] 同属 AI 决策模型,横向对比见 [[ai-decision-models]]。
- demo 内嵌了"GOAP vs 行为树 vs Utility AI"的对比卡片,是 [[ai-decision-models]] 的直接素材。
- 有趣的桥接:demo 的"自动选目标"用了 Utility 打分,说明 **GOAP(怎么达成)与 Utility(该追求什么)可以组合**。

## 局限

- 规划器用的是 Dijkstra 无启发式,规模大时效率不如 A*。
- World State 只支持布尔,真实 GOAP 常需数值/区间条件。
- 是教学模型,未涉及 UE 中 GOAP 的具体落地(UE 官方无内置 GOAP,通常靠第三方插件或自研)。
