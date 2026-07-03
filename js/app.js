/**
 * 知识库主应用
 * 整合数据层、分类引擎、搜索系统、Canvas 查看器
 */
(function () {
  'use strict';

  // === 状态 ===
  let currentCategory = 'all';
  let currentSnippet = null;
  let currentView = 'list'; // 'list' | 'canvas'
  let liveContent = null; // 从 HTML 文件加载的实时内容
  let selectedTags = [];

  // === DOM 元素 ===
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const categoryList = $('#categoryList');
  const tagCloud = $('#tagCloud');
  const searchInput = $('#searchInput');
  const searchCount = $('#searchCount');
  const snippetList = $('#snippetList');
  const detailHeader = $('#detailHeader');
  const detailCanvas = $('#detailCanvas');
  const detailHtml = $('#detailHtml');
  const canvasContainer = $('#canvasContainer');
  const htmlView = $('#htmlView');
  const viewTabs = $('#viewTabs');
  const btnFit = $('#btnFit');
  const btnReset = $('#btnReset');
  const btnExport = $('#btnExport');
  const btnExportJSON = $('#btnExportJSON');
  const btnImportJSON = $('#btnImportJSON');
  const btnAdd = $('#btnAdd');
  const btnResetCache = $('#btnResetCache');
  const fileImportInput = $('#fileImportInput');
  const sidebar = $('#sidebar');
  const sidebarToggle = $('#sidebarToggle');

  // === 初始化 ===
  async function init() {
    await KnowledgeDB.load();

    // 初始化 Canvas 查看器
    CanvasViewer.init(canvasContainer, detailCanvas);
    CanvasViewer.setOnNodeClick(handleNodeClick);

    // 渲染 UI
    renderCategories();
    renderTags();
    renderSnippetList();
    bindEvents();

    // 默认显示已存在的片段
    const snippets = KnowledgeDB.getAll();
    if (snippets.length > 0) {
      selectSnippet(snippets[0].id);
    }
  }

  // === 事件绑定 ===
  function bindEvents() {
    searchInput.addEventListener('input', debounce(handleSearch, 200));
    categoryList.addEventListener('click', handleCategoryClick);
    tagCloud.addEventListener('click', handleTagClick);
    snippetList.addEventListener('click', handleSnippetListClick);
    viewTabs.addEventListener('click', handleViewTabClick);
    htmlView.addEventListener('click', handleHtmlViewClick);

    btnFit.addEventListener('click', () => CanvasViewer.fitToView());
    btnReset.addEventListener('click', () => CanvasViewer.resetView());
    btnExport.addEventListener('click', () => CanvasViewer.exportImage());
    btnAdd.addEventListener('click', () => window.location.href = 'manage.html');

    btnExportJSON.addEventListener('click', handleExportJSON);
    btnImportJSON.addEventListener('click', () => fileImportInput.click());
    fileImportInput.addEventListener('change', handleImportJSON);
    btnResetCache.addEventListener('click', handleResetCache);

    window.addEventListener('resize', () => {
      CanvasViewer.resize();
    });
  }

  // === 渲染分类列表 ===
  function renderCategories() {
    const categories = CategoryEngine.getAllCategories();
    const snippetCounts = {};
    KnowledgeDB.getAll().forEach(s => {
      snippetCounts[s.category] = (snippetCounts[s.category] || 0) + 1;
    });

    const allCount = KnowledgeDB.getAll().length;

    let html = `<li class="category-item active" data-category="all">
      <span class="category-icon">&#x1F4D6;</span>
      <span>全部</span>
      <span class="category-count">${allCount}</span>
    </li>`;

    categories.forEach(cat => {
      const count = snippetCounts[cat.key] || 0;
      html += `<li class="category-item" data-category="${cat.key}">
        <span class="category-icon">${cat.icon}</span>
        <span>${cat.label}</span>
        <span class="category-count">${count}</span>
      </li>`;
    });

    categoryList.innerHTML = html;
  }

  // === 渲染标签云 ===
  function renderTags() {
    const tags = KnowledgeDB.getAllTags();
    if (tags.length === 0) {
      tagCloud.innerHTML = '<span style="font-size:12px;color:var(--text-muted);">暂无标签</span>';
      return;
    }

    tagCloud.innerHTML = tags.slice(0, 20).map(tag => {
      const isActive = selectedTags.includes(tag) ? ' active' : '';
      return `<span class="tag-item${isActive}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`;
    }).join('');
  }

  // === 渲染片段列表 ===
  function renderSnippetList(filteredSnippets) {
    const snippets = filteredSnippets || KnowledgeDB.getAll();
    const query = searchInput.value.trim();

    if (snippets.length === 0) {
      snippetList.innerHTML = `
        <div class="empty-state" style="padding-top:60px;">
          <div class="empty-state-icon">&#x1F4ED;</div>
          <div class="empty-state-text">没有找到相关内容</div>
          <div class="empty-state-hint">试试不同的搜索词或添加新的知识片段</div>
        </div>`;
      searchCount.textContent = '';
      return;
    }

    searchCount.textContent = `共 ${snippets.length} 项`;

    snippetList.innerHTML = snippets.map(s => {
      const cat = CategoryEngine.getCategory(s.category);
      const catLabel = cat ? cat.label : s.category;
      const isSelected = currentSnippet && currentSnippet.id === s.id ? ' selected' : '';

      const sourceBadge = getSourceBadge(s);

      return `
        <div class="snippet-card${isSelected}" data-id="${s.id}">
          <div class="snippet-card-header">
            <span class="snippet-card-title">${SearchEngine.highlight(s.title, query)}</span>
            ${sourceBadge}
            <span class="snippet-card-date">${s.createdAt}</span>
          </div>
          <div class="snippet-card-summary">${SearchEngine.highlight(s.summary || '', query)}</div>
          <div class="snippet-card-tags">
            <span class="snippet-card-category">${catLabel}</span>
            ${s.tags.map(t => `<span class="snippet-card-tag">${SearchEngine.highlight(t, query)}</span>`).join('')}
          </div>
        </div>`;
    }).join('');
  }

  function getSourceBadge(snippet) {
    if (snippet.source === 'wiki') return '<span class="snippet-card-source">Wiki</span>';
    if (snippet.source === 'raw-demo') return '<span class="snippet-card-source demo">Demo</span>';
    return '';
  }

  // === 选中片段 ===
  async function selectSnippet(id) {
    const snippet = KnowledgeDB.getById(id);
    if (!snippet) return;

    currentSnippet = snippet;

    // 更新列表选中状态
    $$('.snippet-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === id);
    });

    // 更新详情头部
    const cat = CategoryEngine.getCategory(snippet.category);
    const isWiki = snippet.source === 'wiki';
    const isInteractiveDemo = snippet.source === 'raw-demo' || snippet.contentType === 'interactive-demo';
    const fileUrl = getSnippetFileUrl(snippet);
    const actionHtml = isWiki && snippet.file
      ? `<a href="${safeUrl(fileUrl)}" class="btn btn-sm" target="_blank">&#x1F517; 打开 Markdown</a>`
      : isInteractiveDemo && fileUrl
        ? `<a href="${safeUrl(fileUrl)}" class="btn btn-sm" target="_blank">&#x1F517; 打开 Demo</a>`
        : `<a href="manage.html?id=${snippet.id}" class="btn btn-sm">&#x270F; 编辑</a>`;

    detailHeader.innerHTML = `
      <div class="detail-header-info">
        <h2>${escapeHtml(snippet.title)}</h2>
        <div class="detail-header-meta">
          <span>${cat ? cat.icon + ' ' + cat.label : escapeHtml(snippet.category)}</span>
          <span>${escapeHtml(snippet.createdAt || '')}</span>
          ${(snippet.tags || []).map(t => `<span class="meta-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
      <div class="detail-header-actions">
        ${actionHtml}
      </div>
    `;

    // 加载内容
    liveContent = null;
    let fetchOk = false;

    if (snippet.file && !isWiki && !isInteractiveDemo) {
      try {
        const res = await fetch(fileUrl);
        if (res.ok) {
          liveContent = await res.text();
          fetchOk = true;
        }
      } catch (e) {
        console.warn('fetch 无法加载文件 (file:// 环境):', snippet.file);
      }
    }

    // 加载嵌入式图表数据
    let embeddedChart = null;
    if (snippet.chartDataId && window.VIBE_CHARTS && window.VIBE_CHARTS[snippet.chartDataId]) {
      embeddedChart = window.VIBE_CHARTS[snippet.chartDataId];
    }

    // 渲染内容
    // 图表数据：优先嵌入数据，回退到从抓取的 HTML 提取
    // 详情视图：统一用 iframe 加载（保留完整样式与脚本，与本地行为一致）
    if (embeddedChart) {
      CanvasViewer.loadChart(embeddedChart);
    } else if (liveContent) {
      extractAndLoadChart(liveContent);
    }

    if (isInteractiveDemo) {
      htmlView.innerHTML = renderInteractiveDemo(snippet);
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
      viewTabs.style.display = 'none';
      CanvasViewer.loadChart(null);
    } else if (isWiki || snippet.contentType === 'markdown') {
      htmlView.innerHTML = renderMarkdown(snippet.content || '', snippet.file || '');
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
      viewTabs.style.display = 'none';
      CanvasViewer.loadChart(null);
    } else if (embeddedChart || liveContent || snippet.hasDiagram) {
      canvasContainer.style.display = 'flex';
      htmlView.style.display = 'none';
      if (snippet.file) {
        htmlView.innerHTML = `
          <div style="padding:16px 20px;">
            <p style="margin-bottom:12px;color:var(--text-secondary);font-size:13px;">&#x1F4C4; 知识片段文件：<code style="color:var(--success);">${escapeHtml(fileUrl)}</code></p>
            <a href="${safeUrl(fileUrl)}" class="btn" style="display:inline-flex;margin-bottom:12px;" target="_blank">&#x1F517; 在新标签页中打开</a>
            <iframe src="${safeUrl(fileUrl)}" style="width:100%;height:calc(100vh - 200px);border:1px solid #22305c;border-radius:8px;background:#fff;" sandbox="allow-scripts allow-same-origin"></iframe>
          </div>`;
      } else {
        htmlView.innerHTML = `<div class="empty-state"><div class="empty-state-icon">&#x1F4C4;</div><div class="empty-state-text">该片段仅有图表数据</div></div>`;
      }
    } else if (snippet.content) {
      htmlView.innerHTML = snippet.content;
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
      viewTabs.style.display = 'none';
    } else if (snippet.file) {
      // file:// 环境回退：使用 iframe 加载 HTML 文件
      htmlView.innerHTML = `
        <div style="padding:20px;">
          <p><strong>&#x1F4C4; 知识片段文件：</strong><code>${escapeHtml(fileUrl)}</code></p>
          <p><a href="${safeUrl(fileUrl)}" class="btn" style="display:inline-flex;margin-top:8px;" target="_blank">&#x1F517; 在新标签页中打开</a></p>
          <iframe src="${safeUrl(fileUrl)}" style="width:100%;height:70vh;border:1px solid #22305c;border-radius:8px;margin-top:12px;background:#fff;" sandbox="allow-scripts allow-same-origin"></iframe>
        </div>`;
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
      viewTabs.style.display = 'none';
    } else {
      htmlView.innerHTML = loadExistingHTML(snippet.file);
    }

    // 更新视图
    if (isWiki || snippet.contentType === 'markdown' || isInteractiveDemo) {
      viewTabs.style.display = 'none';
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
    } else if (embeddedChart || snippet.hasDiagram || liveContent) {
      viewTabs.style.display = 'flex';
      switchView('canvas');
    } else {
      viewTabs.style.display = 'none';
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
    }

    updateSnippetListSelection();
  }

  // 从片段 HTML 中提取 Canvas 图表数据
  function extractAndLoadChart(html) {
    // 优先查找专门的 VibeLearn 图表数据脚本（安全，不含 DOM 操作）
    // 也支持通用 window._chartData 导出
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    let found = false;

    // 先执行包含 _chartData 的脚本（通常是纯数据导出）
    while ((match = scriptRegex.exec(html)) !== null) {
      if (match[1].includes('window._chartData')) {
        try {
          eval(match[1]);
          found = true;
        } catch (e) {
          console.warn('Chart data eval failed:', e.message);
        }
      }
    }

    if (found && typeof window._chartData !== 'undefined') {
      CanvasViewer.loadChart(window._chartData);
    } else {
      CanvasViewer.loadChart(null);
    }
  }

  function loadExistingHTML(file) {
    if (file) {
      return `<div class="empty-state" style="padding-top:60px;">
        <div class="empty-state-icon">&#x1F4C4;</div>
        <div class="empty-state-text">文件已关联但无法加载</div>
        <div class="empty-state-hint">路径: knowledge/${file}</div>
      </div>`;
    }
    return `<div class="empty-state">
      <div class="empty-state-icon">&#x1F4A1;</div>
      <div class="empty-state-text">选择一个知识片段查看详情</div>
      <div class="empty-state-hint">点击左侧列表中的条目</div>
    </div>`;
  }

  function renderMarkdown(markdown, filePath) {
    const body = stripFrontmatter(String(markdown || ''));
    const fileHtml = filePath
      ? `<div class="wiki-file-path">Wiki 源文件：<code>${escapeHtml(filePath)}</code></div>`
      : '';
    return `<article class="markdown-body">${fileHtml}${markdownBlocksToHtml(body)}</article>`;
  }

  function renderInteractiveDemo(snippet) {
    const fileUrl = getSnippetFileUrl(snippet);
    const sourceSummary = snippet.sourceSummary
      ? `<a href="#" class="btn btn-sm" data-wiki-link="${escapeHtml(snippet.sourceSummary)}">&#x1F4DD; 来源摘要</a>`
      : '';

    return `
      <div class="demo-embed-view">
        <div class="demo-embed-toolbar">
          <div>
            <div class="demo-embed-title">可交互 Demo</div>
            <div class="demo-embed-path"><code>${escapeHtml(fileUrl)}</code></div>
          </div>
          <div class="demo-embed-actions">
            ${sourceSummary}
            <a href="${safeUrl(fileUrl)}" class="btn btn-sm" target="_blank">&#x1F517; 新标签页打开</a>
          </div>
        </div>
        <iframe class="demo-embed-frame" src="${safeUrl(fileUrl)}" sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
      </div>`;
  }

  function getSnippetFileUrl(snippet) {
    if (!snippet || !snippet.file) return '';
    if (snippet.source === 'raw-demo' || snippet.contentType === 'interactive-demo') return snippet.file;
    if (snippet.source === 'wiki') return snippet.file;
    return `knowledge/${snippet.file}`;
  }

  function stripFrontmatter(markdown) {
    return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  }

  function markdownBlocksToHtml(markdown) {
    const lines = markdown.split(/\r?\n/);
    const html = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        i++;
        continue;
      }

      if (trimmed.startsWith('```')) {
        const lang = trimmed.slice(3).trim();
        const code = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          code.push(lines[i]);
          i++;
        }
        if (i < lines.length) i++;
        html.push(`<pre><code class="language-${escapeHtml(lang)}">${escapeHtml(code.join('\n'))}</code></pre>`);
        continue;
      }

      const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
        i++;
        continue;
      }

      if (/^[-*_]{3,}$/.test(trimmed)) {
        html.push('<hr>');
        i++;
        continue;
      }

      if (trimmed.startsWith('>')) {
        const quote = [];
        while (i < lines.length && lines[i].trim().startsWith('>')) {
          quote.push(lines[i].trim().replace(/^>\s?/, ''));
          i++;
        }
        html.push(`<blockquote>${quote.map(inlineMarkdown).join('<br>')}</blockquote>`);
        continue;
      }

      if (isTableStart(lines, i)) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        html.push(renderTable(tableLines));
        continue;
      }

      if (/^[-*+]\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
          i++;
        }
        html.push(`<ul>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
          items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
          i++;
        }
        html.push(`<ol>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</ol>`);
        continue;
      }

      const paragraph = [trimmed];
      i++;
      while (i < lines.length && lines[i].trim() && !isSpecialMarkdownLine(lines, i)) {
        paragraph.push(lines[i].trim());
        i++;
      }
      html.push(`<p>${inlineMarkdown(paragraph.join(' '))}</p>`);
    }

    return html.join('\n');
  }

  function isSpecialMarkdownLine(lines, i) {
    const trimmed = lines[i].trim();
    return trimmed.startsWith('```') || /^#{1,6}\s+/.test(trimmed) || /^[-*_]{3,}$/.test(trimmed) ||
      trimmed.startsWith('>') || /^[-*+]\s+/.test(trimmed) || /^\d+\.\s+/.test(trimmed) || isTableStart(lines, i);
  }

  function isTableStart(lines, i) {
    return lines[i] && lines[i].trim().startsWith('|') && lines[i + 1] && /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(lines[i + 1].trim());
  }

  function renderTable(lines) {
    const rows = lines.map(parseTableRow);
    const head = rows[0] || [];
    const body = rows.slice(2);
    return `<table><thead><tr>${head.map(cell => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead><tbody>${body.map(row => `<tr>${row.map(cell => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  function parseTableRow(line) {
    return line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim());
  }

  function inlineMarkdown(text) {
    let html = escapeHtml(text);
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => `<img alt="${escapeHtml(alt)}" src="${safeUrl(url)}">`);
    html = html.replace(/\[\[([^\]]+)\]\]/g, (_, slug) => `<a href="#" class="wiki-link" data-wiki-link="${escapeHtml(slug)}">[[${escapeHtml(slug)}]]</a>`);
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`);
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return html;
  }

  function safeUrl(url) {
    const value = String(url || '').trim();
    if (/^javascript:/i.test(value)) return '#';
    return escapeHtml(value);
  }

  // 切换视图
  function switchView(view) {
    currentView = view;
    $$('.view-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.view === view);
    });

    if (view === 'canvas') {
      canvasContainer.style.display = 'flex';
      htmlView.style.display = 'none';
      CanvasViewer.fitToView();
      CanvasViewer.render();
    } else {
      canvasContainer.style.display = 'none';
      htmlView.style.display = 'block';
    }
  }

  // === 事件处理 ===
  function handleSearch() {
    renderCategorySearch();
  }

  function renderCategorySearch() {
    const query = searchInput.value.trim();
    let results;

    if (currentCategory === 'all' && selectedTags.length === 0 && !query) {
      results = KnowledgeDB.getAll();
    } else {
      results = SearchEngine.search(query, {
        category: currentCategory === 'all' ? null : currentCategory,
        tags: selectedTags.length > 0 ? selectedTags : null,
        tagMode: 'AND',
      });
    }

    results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    renderSnippetList(results);
  }

  function handleCategoryClick(e) {
    const item = e.target.closest('.category-item');
    if (!item) return;

    currentCategory = item.dataset.category;
    $$('.category-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');

    renderCategorySearch();
  }

  function handleTagClick(e) {
    const tagEl = e.target.closest('.tag-item');
    if (!tagEl) return;

    const tag = tagEl.dataset.tag;
    if (selectedTags.includes(tag)) {
      selectedTags = selectedTags.filter(t => t !== tag);
    } else {
      selectedTags.push(tag);
    }

    renderTags();
    renderCategorySearch();
  }

  function handleSnippetListClick(e) {
    const card = e.target.closest('.snippet-card');
    if (!card) return;

    const id = card.dataset.id;
    selectSnippet(id);
  }

  function handleHtmlViewClick(e) {
    const link = e.target.closest('[data-wiki-link]');
    if (!link) return;

    e.preventDefault();
    const slug = link.dataset.wikiLink;
    const target = KnowledgeDB.getAll().find(s =>
      s.wikiSlug === slug ||
      s.id === `wiki-${slug}` ||
      (s.file && s.file.endsWith(`/${slug}.md`))
    );

    if (target) {
      selectSnippet(target.id);
    } else {
      showToast(`未找到 Wiki 页面：${slug}`, 'info');
    }
  }

  function handleViewTabClick(e) {
    const tab = e.target.closest('.view-tab');
    if (!tab) return;
    switchView(tab.dataset.view);
  }

  // 节点点击 - 显示详情面板
  const nodeDetailPanel = $('#nodeDetailPanel');
  const nodeDetailContent = $('#nodeDetailContent');
  const nodeDetailClose = $('#nodeDetailClose');

  function handleNodeClick(node) {
    const d = node.detail || { h: node.label, desc: '', src: '' };
    const srcHtml = d.src
      ? `<h3>📁 源码位置</h3>${d.src.split('\n').filter(s => s.trim()).map(s => `<span class="src-path">${escapeHtml(s)}</span>`).join('')}`
      : '';
    const descHtml = d.desc
      ? `<h3>💡 详解</h3><p>${d.desc}</p>`
      : '<p style="color:var(--text-muted);">（无更多说明）</p>';

    nodeDetailContent.innerHTML = `
      <h2>${escapeHtml(d.h || node.label || '')}</h2>
      ${srcHtml}
      ${descHtml}
    `;
    nodeDetailPanel.classList.add('show');
  }

  if (nodeDetailClose) {
    nodeDetailClose.addEventListener('click', () => {
      nodeDetailPanel.classList.remove('show');
    });
  }

  // 更新片段列表选中
  function updateSnippetListSelection() {
    $$('.snippet-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.id === currentSnippet?.id);
    });
  }

  // 导出 JSON
  function handleExportJSON() {
    const json = KnowledgeDB.exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibeLearn-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('数据已导出', 'success');
  }

  // 导入 JSON
  function handleImportJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (KnowledgeDB.importJSON(ev.target.result)) {
        showToast('数据已导入', 'success');
        refreshUI();
      } else {
        showToast('导入失败：无效的 JSON 格式', 'error');
      }
    };
    reader.readAsText(file);
    fileImportInput.value = '';
  }

  // 重置缓存，从 index.json 重新加载
  async function handleResetCache() {
    KnowledgeDB.reset();
    await KnowledgeDB.load();
    refreshUI();
    showToast('已从 index.json 重新加载索引', 'success');
  }

  // 刷新 UI
  function refreshUI() {
    renderCategories();
    renderTags();
    renderSnippetList();
    currentSnippet = null;
    detailHeader.innerHTML = '';
    htmlView.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">&#x1F4A1;</div>
      <div class="empty-state-text">选择一个知识片段查看详情</div>
    </div>`;
    canvasContainer.style.display = 'none';
    htmlView.style.display = 'block';
    viewTabs.style.display = 'none';
    CanvasViewer.loadChart(null);
  }

  // === 工具函数 ===
  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return String(str).replace(/[&<>"']/g, c => map[c]);
  }

  function showToast(msg, type = 'info') {
    const container = document.querySelector('.toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  }

  // === 启动 ===
  document.addEventListener('DOMContentLoaded', init);
})();
