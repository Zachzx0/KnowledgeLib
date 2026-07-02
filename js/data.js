/**
 * 知识库数据层
 * 管理知识片段的 CRUD、localStorage 持久化、JSON 索引
 */
const KnowledgeDB = (() => {
  const STORAGE_KEY = 'vibeLearn_snippets';
  const INDEX_PATH = 'knowledge/index.json';

  let snippets = [];
  let loaded = false;

  // 生成唯一 ID
  function generateId() {
    const cat = 'snp';
    const ts = Date.now().toString(36);
    const rnd = Math.random().toString(36).substr(2, 5);
    return `${cat}-${ts}-${rnd}`;
  }

  // 加载数据
  async function load(forceReload = false) {
    if (loaded && !forceReload) return snippets;

    // 检查嵌入数据版本
    let embeddedVersion = null;
    try {
      const dataEl = document.getElementById('vibe-default-data');
      if (dataEl && dataEl.textContent) {
        const data = JSON.parse(dataEl.textContent);
        embeddedVersion = data.version || '1.0';
      }
    } catch (e) {}

    // 先尝试从 localStorage 加载
    const cached = localStorage.getItem(STORAGE_KEY);
    const cachedVersion = localStorage.getItem(STORAGE_KEY + '_version');

    if (cached && !forceReload) {
      try {
        const parsed = JSON.parse(cached);
        // 版本匹配则使用缓存
        if (embeddedVersion && cachedVersion === embeddedVersion) {
          snippets = parsed;
          mergeRuntimeWikiSnippets();
          loaded = true;
          return snippets;
        }
        // 尝试用 fetch 校验版本
        const fetchVersion = await fetchIndexVersion();
        if (fetchVersion && cachedVersion === fetchVersion) {
          snippets = parsed;
          mergeRuntimeWikiSnippets();
          loaded = true;
          return snippets;
        }
      } catch (e) {
        console.warn('localStorage 数据损坏，重新加载索引');
      }
    }

    // 版本不匹配或无缓存，重新加载
    await reloadFromIndex();
    mergeRuntimeWikiSnippets();

    return snippets;
  }

  function mergeRuntimeWikiSnippets() {
    const runtimeData = window.VIBE_WIKI_DATA;
    const wikiSnippets = runtimeData && Array.isArray(runtimeData.snippets) ? runtimeData.snippets : [];
    if (!wikiSnippets.length) return;

    const wikiIds = new Set(wikiSnippets.map(s => s.id));
    const nonWiki = snippets.filter(s => s.source !== 'wiki' && !wikiIds.has(s.id));
    snippets = [...nonWiki, ...wikiSnippets.map(s => ({
      ...s,
      tags: Array.isArray(s.tags) ? s.tags : [],
      source: 'wiki',
      contentType: s.contentType || 'markdown',
    }))];
  }

  async function fetchIndexVersion() {
    try {
      const res = await fetch(INDEX_PATH);
      const data = await res.json();
      return data.version || '1.0';
    } catch (e) {
      return null;
    }
  }

  async function reloadFromIndex() {
    // 优先使用嵌入式数据（解决 file:// 无法 fetch 的问题）
    let embedded = false;
    try {
      const dataEl = document.getElementById('vibe-default-data');
      if (dataEl && dataEl.textContent) {
        const data = JSON.parse(dataEl.textContent);
        if (data && data.snippets && data.snippets.length > 0) {
          snippets = data.snippets;
          const version = data.version || '1.0';
          localStorage.setItem(STORAGE_KEY + '_version', version);
          save();
          loaded = true;
          embedded = true;
          console.log('从嵌入数据加载了 ' + snippets.length + ' 个知识片段');
        }
      }
    } catch (e) {
      console.warn('嵌入数据解析失败:', e.message);
    }

    if (embedded) return;

    // 回退到 fetch 方式（本地服务器场景）
    try {
      const res = await fetch(INDEX_PATH);
      const data = await res.json();
      snippets = data.snippets || [];
      const version = data.version || '1.0';
      localStorage.setItem(STORAGE_KEY + '_version', version);
      save();
      loaded = true;
    } catch (e) {
      console.warn('无法加载 index.json，使用空数据集');
      snippets = [];
      loaded = true;
    }
  }

  // 保存到 localStorage
  function save() {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
  }

  // 导出为 JSON（用于下载/备份）
  function exportJSON() {
    return JSON.stringify({ snippets }, null, 2);
  }

  // 导入 JSON
  function importJSON(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.snippets)) {
        snippets = data.snippets;
        save();
        return true;
      }
    } catch (e) {
      console.error('导入失败：无效的 JSON 格式');
    }
    return false;
  }

  // 获取所有片段
  function getAll() {
    return [...snippets];
  }

  // 按分类获取
  function getByCategory(category) {
    return snippets.filter(s => s.category === category);
  }

  // 按 ID 获取
  function getById(id) {
    return snippets.find(s => s.id === id);
  }

  // 添加片段
  function add(snippet) {
    const newSnippet = {
      id: generateId(),
      title: snippet.title || '未命名片段',
      category: snippet.category || 'misc',
      tags: snippet.tags || [],
      file: snippet.file || '',
      createdAt: snippet.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: snippet.updatedAt || null,
      hasDiagram: snippet.hasDiagram || false,
      summary: snippet.summary || '',
      content: snippet.content || '',
    };
    snippets.unshift(newSnippet);
    save();
    return newSnippet;
  }

  // 更新片段
  function update(id, updates) {
    const idx = snippets.findIndex(s => s.id === id);
    if (idx === -1) return null;
    snippets[idx] = {
      ...snippets[idx],
      ...updates,
      updatedAt: new Date().toISOString().split('T')[0],
      id: snippets[idx].id, // 不允许修改 id
    };
    save();
    return snippets[idx];
  }

  // 删除片段
  function remove(id) {
    const idx = snippets.findIndex(s => s.id === id);
    if (idx === -1) return false;
    snippets.splice(idx, 1);
    save();
    return true;
  }

  // 获取所有分类
  function getAllCategories() {
    const cats = new Set(snippets.map(s => s.category));
    return [...cats];
  }

  // 获取所有标签（按出现频率排序）
  function getAllTags() {
    const tagCount = {};
    snippets.forEach(s => {
      s.tags.forEach(t => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }

  // 重置数据
  function reset() {
    snippets = [];
    loaded = false;
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    load,
    save,
    exportJSON,
    importJSON,
    getAll,
    getByCategory,
    getById,
    add,
    update,
    remove,
    getAllCategories,
    getAllTags,
    reset,
  };
})();
