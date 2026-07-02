---
title: Navmesh 生成速度优化(来源)
type: source-summary
sources: [raw/articles/How To Optimize Navmesh Generation.md]
related: [[[navmesh-generation]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# How to optimize navmesh generation speed

## 来源

- **文件**:`raw/articles/How To Optimize Navmesh Generation.md`
- **类型**:实践清单(tips + tools),含一段 UDN 官方问答引用
- **主题**:运行时**动态 Navmesh**(Recast)生成的 CPU 开销优化

## 这篇资料是什么

一份针对"运行时生成导航网格代价高"的优化清单。核心前提:**动态 navmesh 在运行时重建 tile 会吃大量 CPU**,文章给出降低这一成本的策略与工具。

## 关键要点

### Tips(降低单 tile 生成成本)

1. **调大 `CellHeight` / `CellSize`**(Project Settings → Navigation Mesh):这两个参数是体素化的体素尺寸,越大 → 体素越少 → tile 生成越快,**代价是精度下降**(navmesh 贴合几何的程度变差)。
2. **限制 tile 尺寸**:建议每边 32–128 cells。注意 agent 半径会给光栅化加 padding:32² = 1024,加半径 padding 2 体素(+1 取整)后是 (32+3+3)² = 1444——**tile 越小,局部化越好,但 padding 占比越高、总处理量反而可能上升**。
3. **保持 nav collision 简单**:碰撞三角面是生成的输入,三角越少越快。
4. **盯住"谁在弄脏 navmesh"**:小物件别标记为影响导航;别让不可达位置的移动物体无意义地 dirty;避免脏化巨大 tile 区域。

### Tools(生成时机与并行)

1. **在关键时机锁/解锁生成**:加载大批资产前"锁定"自动生成,加载完再解锁,避免同一 tile 被反复重建。实现:`bInitialBuildingLocked = true` → 加载完 `ReleaseInitialBuildingLock()`。若想连累积的 dirty 区域也清掉,可重写 `ReleaseInitialBuildingLock()`,在调 super 前先 `DefaultDirtyAreasController.Reset()`。
2. **多线程生成**:由 `MaxSimultaneousTileGenerationJobsCount` 控制,受 `FRecastNavMeshGenerator::Init()` 的 worker 线程数限制。
3. **用 Dynamic Obstacle 代替整块重建**:静态网格 Navigation 分类下的 "Is Dynamic Obstacle" 选项——障碍物只在其位置**标记** navmesh 表面,而非重建整个 tile,代价更低(适用于不需要在移动障碍上生成新表面的场景)。
4. **只因子关卡加载/卸载而变化时,用静态 navmesh + navmesh data chunk streaming**:整张 navmesh 预烘焙,运行时只做局部 load/unload,比全动态生成便宜得多。

## 与已有知识的关联

- 这是 Wiki 中 **AI/导航领域的第一份来源**,与既有的网络同步、角色移动是并列的新主题。
- 与 [[charactermovementcomponent]] 的 `MOVE_NavWalking`(导航网格行走模式)间接相关:CMC 在 NavWalking 下依赖 navmesh 表面。
- 概念页见 [[navmesh-generation]]。

## 局限

- 是经验清单,非源码级剖析;`FRecastNavMeshGenerator` 的内部流程只点到名字。
- 只覆盖 Recast/动态 navmesh,未涉及第三方寻路方案。
- 参数具体取值高度依赖具体项目,文中给的是范围与权衡,不是定值。
