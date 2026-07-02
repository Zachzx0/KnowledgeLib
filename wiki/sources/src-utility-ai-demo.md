---
title: Utility AI 交互式 Demo(来源)
type: source-summary
sources: [raw/articles/Utility_AI_Learn.html]
related: [[[utility-ai]], [[ai-decision-models]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# Utility AI 交互式 Demo

## 来源

- **文件**:`raw/articles/Utility_AI_Learn.html`
- **类型**:单页交互式 demo(可运行的效用评分器 + 可视化排行榜)
- **主题**:Utility AI(效用决策 / 效用理论 AI)

## 这篇资料是什么

用"地牢冒险者"模型演示 Utility AI:拖动世界状态滑杆(生命/饥饿/体力/弹药/威胁/战利品/掩体),实时看每个候选行为的效用分数与排名如何变化,分数最高者胜出执行。自带完整可运行的打分实现。

## 核心思想(demo 原话)

> 每一帧不直接问"现在该执行哪个固定分支",而是让每个候选行为根据当前局势计算一个 `0~1` 的效用分数,分数最高的行为获得执行权。

## Utility AI 四件套

| 组件 | 含义 |
|---|---|
| **Context** | 环境输入(生命值、敌人威胁、饥饿度、弹药量...) |
| **Consideration** | 考量项:把某个输入经曲线映射成 `0~1` 分数(如"生命越低,治疗越重要") |
| **Action Score** | 一个行为汇总多个考量项,用乘法或加权平均得总分 |
| **Selection** | 选总分最高者执行;下一帧局势变化后重新评分,行为可能立刻切换 |

## 打分机制要点(从 demo 源码提炼)

- **考量曲线(response curve)**:`highWhenLow`(越低越高,如生命→治疗)、`highWhenHigh`(越高越高,如威胁→攻击)、`bell`(钟形,中段最高,如"中高威胁才换弹")。每个考量把输入归一化到 `0~1` 再乘 `weight`。
- **两种聚合方式(demo 可切换)**:
  - **乘法聚合**:`total = base × ∏ max(0.05, weightedScore)`。特点:**任一关键考量很低会强烈拖低总分**(一票否决式),适合硬约束——如"没弹药就绝不选攻击"。
  - **加权平均**:`total = base × Σ(raw×weight) / Σweight`。特点:更平滑,单项低不会一票否决,适合弱约束行为。
- **反馈闭环**:执行胜出行为会 `effect(world)` 改写世界状态,再叠加 `driftWorld`(饥饿↑、体力↓、威胁↑),下一帧重新评分——演示 Utility AI 的**动态连续切换**。
- **稳定性提示**:当第一名与第二名差距 < 0.06 时 demo 会警告"轻微状态变化就可能切换行为"——这是 Utility AI 的常见问题(**行为抖动 / thrashing**),实践中常加惯性/滞回。

## Utility AI vs 行为树 vs GOAP(demo 对比卡)

- **行为树**:手写优先级流程,可控但分支多后变硬变长。
- **GOAP**:先定目标再搜动作链,适合"规划几步后达成目标"。
- **Utility AI**:给每个行为算即时收益,适合**多个动机互相竞争、需要连续动态切换**的场景。

## 与已有知识的关联

- 与 [[goap]]、[[statetree]] 同属 AI 决策模型,横向对比见 [[ai-decision-models]]。
- 呼应 [[src-goap-demo]]:GOAP demo 的"自动选目标"就是用 Utility 打分选 goal——**两者可组合**(Utility 选目标,GOAP 规划路径)。

## 局限

- 是通用教学模型,未绑定 UE 具体实现(UE 无官方 Utility AI 框架,常自研或用插件)。
- 考量曲线/权重靠手工调参,demo 未涉及自动调参或机器学习。
- 行为抖动问题 demo 只提示未解决(无滞回/冷却机制)。
