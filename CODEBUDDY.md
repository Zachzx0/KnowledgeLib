# CODEBUDDY.md · VibeLearn

本项目含一个 **LLM Wiki**(Karpathy 模式):由 LLM 持续维护的 Markdown 知识库。

## 三层边界

| 层 | 路径 | 权限 |
|---|---|---|
| 原始数据 | `raw/` | LLM **只读**,不可修改 |
| Wiki | `wiki/` | LLM **写** |
| HTML 查看器 | `knowledge/` `*.html` `js/` `css/` | **不要动** |

## 操作前必读

任何涉及知识管理、摄入(`ingest`)、查询(`query`)、健康检查(`lint`)的会话,**先读 [`wiki/SCHEMA.md`](wiki/SCHEMA.md)**。它定义了目录结构、页面 frontmatter 规范、三大操作 SOP、语言与命名约定。

## 快速上手

1. 把资料放进 `raw/articles/`(网页剪藏为 `.md`)、`raw/papers/`(论文)、`raw/assets/`(图片)；AI 生成的内容放入 `raw/AIGen/`
2. 对我说"摄入 `<文件名>`" → 触发 ingest 流程
3. 直接提问 → 触发 query 流程,好答案会提议归档
4. 说"lint" → 触发健康检查

## 现有结构说明

- `index.html` / `manage.html` / `js/` / `css/` / `knowledge/` — 既有的 HTML 知识查看器,手工策展,与 Wiki 解耦
- `UE_Networking_Visualization.html` — 独立可视化页

Wiki 不替代查看器,二者平行存在。完整规则见 `wiki/SCHEMA.md`。
