---
title: Navmesh 生成与优化 (Navmesh Generation)
type: concept
sources: [raw/articles/How To Optimize Navmesh Generation.md]
related: [[[charactermovementcomponent]], [[src-navmesh-optimization]]]
created: 2026-07-02
updated: 2026-07-02
confidence: high
---

# Navmesh 生成与优化

UE 用 **Recast** 库生成导航网格(Navmesh):把关卡几何**体素化(voxelize)** → 生成可行走表面 → 切成 tile 供寻路。运行时**动态 navmesh** 会在几何变化时重建受影响的 tile,这一步 CPU 开销很大,是优化的核心战场。

## 生成原理(为什么慢)

- Navmesh 生成的输入是 **nav collision 的三角面**;Recast 把空间离散成**体素**,体素尺寸由 `CellHeight` / `CellSize` 决定。
- 体素越小 → 数量越多 → 生成越慢但越精确;越大 → 越快但越粗糙。
- 关卡按 **tile** 划分,只有被"弄脏(dirty)"的 tile 才需要重建。
- agent 半径会给光栅化**加 padding**:32×32 = 1024 体素,加半径 padding 后 (32+6)² = 1444——**tile 越小,padding 占比越高**,这是 tile 尺寸权衡的关键。

## 优化策略(四类思路)

### 1. 降低单 tile 成本
- 调大 `CellHeight`/`CellSize`(牺牲精度换速度)。
- tile 尺寸取每边 **32–128 cells** 的平衡点(太小 padding 浪费,太大局部化差)。
- 简化 nav collision 三角面(输入越少越快)。

### 2. 减少"脏化"
- 小物件别标记影响导航;
- 别让不可达位置的移动物体无意义 dirty navmesh;
- 避免脏化巨大 tile 区域。

### 3. 控制生成时机与并行
- **锁/解锁**:大批加载前 `bInitialBuildingLocked=true`,加载完 `ReleaseInitialBuildingLock()`,避免同一 tile 反复重建。想连累积 dirty 也清掉,可重写该函数、在 super 前 `DefaultDirtyAreasController.Reset()`。
- **多线程**:`MaxSimultaneousTileGenerationJobsCount` 控制并发,受 `FRecastNavMeshGenerator::Init()` 的 worker 线程数限制。

### 4. 换更便宜的方案
- **Dynamic Obstacle**(静态网格 Navigation → "Is Dynamic Obstacle"):障碍只在其位置**标记** navmesh 表面,不重建整个 tile。
- **静态 navmesh + data chunk streaming**:若只因子关卡 load/unload 变化,预烘焙整张 navmesh,运行时只 load/unload 局部——比全动态便宜得多。

## 决策速查

| 你的情况 | 推荐 |
|---|---|
| 世界基本静态,只有关卡流送 | 静态 navmesh + chunk streaming |
| 有移动障碍但不需在其上生成新表面 | Dynamic Obstacle |
| 真需运行时重建 | 调大 cell + 限 tile 尺寸 + 多线程 + 锁定加载期 |

## 与已有知识的关联

- [[charactermovementcomponent]] 的 `MOVE_NavWalking` 模式依赖 navmesh 表面移动。
- AI 决策模型([[statetree]]/[[goap]]/[[utility-ai]])产出"去哪"的决策后,靠 navmesh + 寻路把决策落地为实际移动路径。

## 局限

- 仅覆盖 Recast/动态 navmesh 的经验优化,非源码级剖析。
- 参数取值高度依赖具体项目,来源给的是范围与权衡。
