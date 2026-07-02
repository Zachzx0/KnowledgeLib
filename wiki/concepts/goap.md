---
title: GOAP 目标导向行动规划 (Goal-Oriented Action Planning)
type: concept
sources: [raw/articles/GOAP可视化学习.html]
related: [[[ai-decision-models]], [[statetree]], [[utility-ai]], [[src-goap-demo]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# GOAP 目标导向行动规划

GOAP 的核心:**不手写行为流程,而是描述"世界事实 + 带前置/效果/代价的动作",让规划器在运行时自动搜出一条能达成目标的动作链**。行为逻辑从"人工编排"变成"自动求解"。

## 四件套

| 组件 | 含义 | 例子 |
|---|---|---|
| **World State** | 世界事实(布尔集合) | `injured=true`、`hasWeapon=false`、`enemyNear=true` |
| **Goal** | 目标条件(期望的状态子集) | "活下来" = `injured:false ∧ enemyNear:false` |
| **Action** | 前置条件(pre) + 效果(effects) + 代价(cost) | `Heal`:pre `hasPotion∧injured` → eff `injured:false` → cost 1 |
| **Planner** | 从当前事实搜索**总代价最低**、满足目标的动作序列 | 见下 |

## 规划算法

把"状态"看作图节点,"动作"看作有代价的边,从当前状态搜到满足目标的状态:

1. `open` 优先队列按累计 cost 排序,起点是当前 World State;
2. 弹出最低代价节点,遍历所有**前置满足**的 action,应用 effects 得到后继状态;
3. 用已访问表(状态序列化为 key)剪掉更贵的重复路径;
4. 命中目标 → 返回动作链;队列空/超迭代 → 规划失败(无解)。

> [[src-goap-demo]] 的实现是 **Dijkstra / 均匀代价搜索**(无启发式)。经典 GOAP(Jeff Orkin, F.E.A.R.)用 **A***,启发式 h = 目标中尚未满足的条件数,搜索更快。

## 为什么用 GOAP:重规划(Replanning)

GOAP 最大优势是**动作失效时能立刻重新求解**:某步执行失败(如"开门"发现门锁了),把该动作标记不可用,从当前实际状态重新规划,而不用人工修改一棵庞大的行为树。这让 AI 在动态环境里更鲁棒。

## 适用与不适用

- **适合**:动作多、组合路径多、目标随局势变化、需要"规划几步之后达成目标"的场景(潜行、生存、战术 AI)。
- **不适合**:状态爆炸严重的场景(布尔维度多→搜索空间指数增长);需要即时反应而非多步规划的场景(用 [[utility-ai]] 或 [[statetree]] 更轻)。

## 与其它决策模型的关系

- **GOAP 回答"怎么达成目标(动作链)"**,[[utility-ai]] 回答"该追求什么(目标/行为收益)"。二者可组合:[[src-goap-demo]] 就用 Utility 打分选 goal,再用 GOAP 规划到达。
- 与 [[statetree]]、[[utility-ai]] 的横向对比见 [[ai-decision-models]]。

## 局限

- 来源规划器无启发式(Dijkstra),规模大时慢于 A*。
- World State 仅布尔,真实场景常需数值/区间条件。
- UE 无官方 GOAP 框架,需第三方插件或自研。
