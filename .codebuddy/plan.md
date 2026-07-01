# VibeLearn - 学习知识库系统

## 系统架构

```
VibeLearn/
├── index.html                 # 主页面：知识库浏览/搜索/分类
├── manage.html                # 管理页面：添加/编辑知识片段
├── css/
│   └── style.css              # 统一样式
├── js/
│   ├── data.js                # 知识片段数据存储（localStorage）
│   ├── search.js              # 全文搜索 + 标签筛选
│   ├── category.js            # 分类管理 + 自动分类引擎
│   ├── canvas-viewer.js       # Canvas 图表渲染 + 拖拽/缩放
│   └── app.js                 # 主应用逻辑
├── knowledge/                 # 知识片段 HTML 文件存储目录
│   ├── index.json             # 片段索引元数据
│   ├── programming/
│   ├── game-dev/
│   ├── networking/
│   └── ...
```

## 核心功能

### 1. 知识片段存储
- 每个知识片段以独立 HTML 文件存储在 `knowledge/` 下对应分类目录
- 元数据（标题/分类/标签/创建时间）存储在 `knowledge/index.json`
- 支持直接打开 HTML 文件独立浏览

### 2. 自动分类引擎
- 基于关键词匹配自动归类
- 预置分类体系（可扩展）：
  - 编程 (programming)
  - 游戏开发 (game-dev)
  - 网络 (networking)
  - 架构设计 (architecture)
  - AI/机器学习 (ai-ml)
  - 前端开发 (frontend)
  - 后端开发 (backend)
  - 算法 (algorithm)
  - 工具 (tools)
  - 杂项 (misc)
- 手动分类可覆盖自动分类结果

### 3. 搜索系统
- 全文搜索（标题 + 内容）
- 标签筛选（多标签 AND/OR 逻辑）
- 分类筛选
- 高亮匹配结果

### 4. Canvas 图表系统
- 拖拽平移（鼠标拖拽）
- 滚轮缩放（以鼠标位置为中心）
- 适应视图 / 重置按钮
- 支持节点/连线/图表的 Canvas 渲染
- 所有图示内容统一用 Canvas 展示

### 5. 管理接口 (manage.html)
- 添加新知识片段
- 编辑/删除现有片段
- 预览效果
- 自动分类建议（可手动调整）

## 数据流

```
用户输入片段 → manage.html
  → 自动分类引擎分析关键词 → 建议分类/标签
  → 用户确认/修改 → 保存为 HTML 文件 → 更新 index.json
  → index.html 加载 index.json → 左侧分类树/标签云
  → 用户搜索/筛选 → 右侧展示片段列表 → 点击查看详情
  → 详情中图表用 Canvas 渲染（可拖拽缩放）
```

## 实现计划

1. **创建项目骨架**：index.html + manage.html + css/js 目录结构
2. **实现数据层**：data.js（localStorage 持久化 + knowledge/index.json 管理）
3. **实现分类引擎**：category.js（关键词匹配 + 自动分类）
4. **实现搜索系统**：search.js（全文搜索 + 标签筛选 + 高亮）
5. **实现 Canvas 图表系统**：canvas-viewer.js（渲染/拖拽/缩放）
6. **整合主界面**：app.js + index.html UI（侧边栏/搜索/列表/详情）
7. **实现管理界面**：manage.html（添加/编辑/删除片段）
8. **处理已有内容**：将 UE_Networking_Visualization.html 转换为知识片段
