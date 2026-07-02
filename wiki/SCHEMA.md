# VibeLearn LLM Wiki · 控制协议 (SCHEMA)

> 本文件是 LLM 维护本 Wiki 的操作手册。任何涉及知识管理(摄入/查询/检查)的会话开始时,先读本文件。
> 模式来源:Andrej Karpathy《LLM Wiki》idea file (2026-04)。

---

## 1. 三层结构

| 层 | 路径 | 权限 | 说明 |
|---|---|---|---|
| 原始数据 | `raw/` | **LLM 只读** | 不可变真理之源。文章/论文/图片/数据。绝对不要修改。 |
| Wiki | `wiki/` | **LLM 写** | LLM 生成并维护的 Markdown 知识库。本文件所在层。 |
| HTML 查看器 | `knowledge/` `index.html` `manage.html` `js/` `css/` | **不要动** | 现有的手工 HTML 知识查看器,是渲染产物,与 Wiki 解耦。 |

`raw/` 子目录:`articles/`(网页/文章 Markdown)、`papers/`(论文 PDF/MD)、`assets/`(图片)、`AIGen/`(AI Agent 生成的内容,如 HTML 可视化、代码输出等)。

`wiki/` 子目录见下方 §3。

---

## 2. 页面规范

每个 `wiki/` 下的 `.md` 文件**必须**以 YAML frontmatter 开头:

```yaml
---
title: 页面标题(可中文)
type: concept | entity | source-summary | comparison
sources: [raw/articles/xxx.md, raw/papers/yyy.pdf]   # 引用的 raw/ 文件,无则空数组
related: [[[property-replication-dataflow]], [[unetdriver]]]   # wiki 内部双链,无则空数组
created: 2026-07-02
updated: 2026-07-02
confidence: high | medium | low                       # 结论置信度
---
```

正文用 Markdown。技术名词保留英文原文(如 `UNetDriver`、`FRepLayout`、`ChangeMask`、`RepNotify`),叙述性文字用中文。

文件名用 **kebab-case 英文**(如 `property-replication-dataflow.md`、`unetdriver.md`),便于 `[[双链]]` 引用。`title` 字段可中文。

---

## 3. `wiki/` 目录分工

| 子目录 | 放什么 | type 值 |
|---|---|---|
| `concepts/` | 概念页:某项技术/机制的系统性说明(如 property-replication-dataflow、rpc-flow、movement-prediction) | `concept` |
| `entities/` | 实体页:具体类/结构/系统(如 unetdriver、fReplayout、replicationgraph) | `entity` |
| `sources/` | 来源摘要页:对一份 raw 资料的摘要 + 关键要点 + 与已有知识的关联 | `source-summary` |
| `comparisons/` | 对比分析页:多来源横向对比(如 native-vs-repgraph-vs-iris) | `comparison` |

根目录三个特殊文件:
- `index.md` — **空间目录**,全局导航。每次摄入后更新。
- `log.md` — **时间日志**,append-only。每次操作追加一条。
- `overview.md` — **全局综合判断**,来源积累到 10+ 后由 lint 生成并持续修订。
- `SCHEMA.md` — 本文件。你和用户共同演化它;发现更好结构就更新。

---

## 4. 三大操作 SOP

### 4.1 Ingest(摄入与编译)

触发:用户说"摄入 `<文件名>`"或"ingest `<文件名>`"。

步骤:
1. 读取 `raw/` 中指定的源文件
2. 与用户讨论关键要点(摘要方向、该强调什么)——不要跳过直接写
3. 在 `wiki/sources/` 创建或更新对应来源摘要页(`source-summary` 类型)
4. **联动更新**:遍历 `wiki/concepts/` 与 `wiki/entities/`,凡与新来源相关的页面都要更新(补充新数据、标注矛盾、强化/挑战既有结论)。一次摄入可能触发十几篇联动
5. 若新来源引入了尚无独立页面的重要概念/实体,创建新页
6. 更新 `wiki/index.md`(新增条目)
7. 在 `wiki/log.md` 追加一行:`## [YYYY-MM-DD] ingest | <来源标题>`
8. 若用户使用 Git,提示 `git add . && git commit -m "ingest: <标题>"`

**关键纪律**:摄入时主动检测与既有结论的矛盾,在相关页面用 `> ⚠️ 矛盾:` 引用块标记,不要假装没看见。

### 4.2 Query(查询与沉淀)

触发:用户提问。

步骤:
1. 先读 `wiki/index.md` 定位相关页面
2. 读取这些详情页(必要时回溯 `raw/` 原文核对)
3. 综合生成答案,关键结论带 `[[wiki-link]]` 引用
4. 若答案有价值(非一次性),**主动提议**:"是否归档为新 Wiki 页面?" 用户同意后:
   - 在合适子目录建新页(类型按内容判断)
   - 更新 `index.md` 与相关页面的 `related` 字段
   - 追加 `log.md`:`## [YYYY-MM-DD] query | <问题主题>`

这就形成了复利循环:外部来源 → Wiki → 你的提问 → 新洞察归档 → Wiki 更丰富。

### 4.3 Lint(健康检查)

触发:用户说"lint"或"检查 Wiki"。

检查项:
1. **矛盾检测**:扫描所有页面,找出结论互相冲突的地方
2. **孤岛页面**:没有任何入链的页面
3. **缺失概念**:被多个页面反复提及但尚无独立页面的概念
4. **过时结论**:被新来源取代但未标注的旧结论
5. **frontmatter 合规**:每个页面是否有完整 frontmatter,`related` 链接是否有效
6. **下一步建议**:列出值得调查的新问题、值得寻找的新来源

输出一份结构化报告。**不要擅自修复所有矛盾**——按 Karpathy/Extended Brain 的建议,发现张力后先停下来呈现给用户,让用户决定如何处理。修不修由人决定,不是 LLM 自动闭合。

追加 `log.md`:`## [YYYY-MM-DD] lint | <概要>`

---

## 5. 两个核心索引的格式

### `index.md`(空间维度)

```markdown
# VibeLearn Wiki 索引

## 概念 Concepts
- [[property-replication-dataflow]] — 属性同步完整链路
- [[rpc-flow]] — 三种 RPC 数据流

## 实体 Entities
- [[unetdriver]] — 网络驱动核心
- [[fReplayout]] — 属性布局描述符

## 来源摘要 Source Summaries
- [[src-xxx]] — <一句话摘要>

## 对比分析 Comparisons
- [[native-vs-repgraph-vs-iris]] — 三种同步方案横向对比
```

### `log.md`(时间维度,append-only)

```markdown
## [2026-07-02] ingest | UE 网络同步总览
## [2026-07-03] query | ReplicationGraph 的频率策略
## [2026-07-04] lint | 发现 2 处矛盾,3 个孤岛
```

新会话开始时,LLM 读最近 5 条日志即可理解当前状态。用户可用 `grep "^## \[2026-07"` 分析自己的学习轨迹。

---

## 6. 语言与命名约定

- **正文语言**:中文(与现有 `knowledge/` 一致)
- **技术名词**:保留英文原文,不强行翻译(如 `UNetDriver` 不译作"网络驱动")
- **文件名**:kebab-case 英文,`.md` 扩展
- **标题 `title`**:可中文,可含英文术语
- **双链**:`[[文件名不含扩展名]]`,如 `[[property-replication-dataflow]]`
- **图片**:放入 `raw/assets/`,在 Wiki 中用相对路径引用 `![](../raw/assets/xxx.png)`

---

## 7. 规模演进指引

| 阶段 | 来源数 | 推荐做法 |
|---|---|---|
| 起步 | 0–10 | 纯 `index.md` 导航,手动摄入 |
| 成长 | 10–50 | 开始定期 lint;考虑用 Git 分支做实验性摄入 |
| 扩展 | 50–100 | `index.md` 可能过长,考虑按主题拆分子索引 |
| 规模化 | 100+ | 引入 qmd(本地 BM25+向量+LLM 重排序)做语义检索 |

---

## 8. 与现有 HTML 查看器的关系

VibeLearn 已有 `knowledge/` 下的 HTML 知识查看器(手工策展)。Wiki 现在已通过轻量桥接接入 `index.html`,但仍保持职责分离:

- `wiki/` 是 LLM 维护的 Markdown 知识底座
- `index.html` / `knowledge/` 是前端展示层
- `tools/sync-wiki-to-knowledge.js` 会扫描 `wiki/**/*.md`,生成 `js/wiki-data.js`,并把 Wiki 条目合并进 `knowledge/index.json`
- `index.html` 加载 `js/wiki-data.js` 后,会把 Wiki 条目与原有 HTML 知识片段混合展示
- Wiki Markdown 在前端由内置 Markdown 渲染器显示,支持 `[[双链]]` 点击跳转

注意:桥接不改变来源纪律。Wiki 页面中的 `sources` 仍应引用 `raw/` 下的原始资料;不要把 `knowledge/*.html` 当成常规来源,除非明确标注为冷启动/历史兼容例外。

