/**
 * 搜索系统
 * 全文搜索 + 标签筛选 + 分类过滤 + 结果高亮
 */
const SearchEngine = (() => {
  // 中文分词简化版：按标点和空格分割
  function tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[，,。；;！!？?、\n\r\t\(\)\[\]{}<>""''""''《》<>\\/\-+=*&^%$#@~`|]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  // 提取 N-gram（用于中文部分模糊搜索）
  function ngrams(text, n = 2) {
    const clean = text.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '');
    const grams = [];
    for (let i = 0; i <= clean.length - n; i++) {
      grams.push(clean.substring(i, i + n));
    }
    return grams;
  }

  // 计算搜索文本的相关性分数
  function calcRelevance(query, snippet) {
    const searchText = [
      snippet.title,
      snippet.summary,
      snippet.tags.join(' '),
      snippet.content || '',
    ].join(' ').toLowerCase();

    const queryLower = query.toLowerCase();

    // 精确匹配
    if (searchText.includes(queryLower)) {
      // 标题匹配权重最高
      if (snippet.title.toLowerCase().includes(queryLower)) return 10;
      // 标签匹配
      if (snippet.tags.some(t => t.toLowerCase().includes(queryLower))) return 8;
      // 摘要匹配
      if (snippet.summary.toLowerCase().includes(queryLower)) return 7;
      return 5;
    }

    // 分词匹配
    const queryTokens = tokenize(queryLower);
    const textTokens = tokenize(searchText);
    let matchCount = 0;

    for (const qt of queryTokens) {
      if (textTokens.some(tt => tt.includes(qt))) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      return matchCount / queryTokens.length * 3;
    }

    // N-gram 模糊匹配（中文）
    if (/[\u4e00-\u9fff]/.test(queryLower)) {
      const queryGrams = ngrams(queryLower);
      const textGrams = ngrams(searchText);
      let gramMatches = 0;
      for (const qg of queryGrams) {
        if (textGrams.includes(qg)) gramMatches++;
      }
      if (gramMatches > 0) {
        return gramMatches / queryGrams.length * 2;
      }
    }

    return 0;
  }

  // 执行搜索
  function search(query, options = {}) {
    const { category, tags: filterTags, tagMode = 'AND' } = options;
    let results = KnowledgeDB.getAll();

    // 分类过滤
    if (category && category !== 'all') {
      results = results.filter(s => s.category === category);
    }

    // 标签过滤
    if (filterTags && filterTags.length > 0) {
      if (tagMode === 'AND') {
        results = results.filter(s =>
          filterTags.every(ft => s.tags.some(st =>
            st.toLowerCase().includes(ft.toLowerCase())
          ))
        );
      } else {
        results = results.filter(s =>
          filterTags.some(ft => s.tags.some(st =>
            st.toLowerCase().includes(ft.toLowerCase())
          ))
        );
      }
    }

    // 全文搜索
    if (query && query.trim()) {
      const q = query.trim();
      results = results
        .map(s => ({ snippet: s, score: calcRelevance(q, s) }))
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.snippet);
    } else {
      // 无搜索词时按时间排序
      results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return results;
  }

  // 生成高亮的 HTML
  function highlight(text, query) {
    if (!query || !query.trim()) return escapeHtml(text);
    const q = query.trim();
    const escaped = escapeHtml(text);

    // 分词高亮
    const tokens = tokenize(q);
    let result = escaped;

    // 先尝试整体匹配
    const regex = new RegExp(`(${escapeRegex(q)})`, 'gi');
    if (regex.test(result)) {
      return result.replace(regex, '<mark class="search-hl">$1</mark>');
    }

    // 分词高亮（按长度降序避免短匹配覆盖长匹配）
    const sorted = [...new Set(tokens)].sort((a, b) => b.length - a.length);
    for (const tk of sorted) {
      if (tk.length < 2) continue;
      const reg = new RegExp(`(${escapeRegex(tk)})`, 'gi');
      result = result.replace(reg, '<mark class="search-hl">$1</mark>');
    }

    return result;
  }

  function escapeHtml(str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  return {
    search,
    highlight,
    tokenize,
  };
})();
