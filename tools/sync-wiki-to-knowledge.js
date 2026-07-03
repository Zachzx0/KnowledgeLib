const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const WIKI_DIR = path.join(ROOT, 'wiki');
const RAW_ARTICLES_DIR = path.join(ROOT, 'raw', 'articles');
const KNOWLEDGE_INDEX = path.join(ROOT, 'knowledge', 'index.json');
const WIKI_DATA_JS = path.join(ROOT, 'js', 'wiki-data.js');
const RAW_DEMO_DATA_JS = path.join(ROOT, 'js', 'raw-demo-data.js');

const TYPE_CATEGORY = {
  concept: 'wiki-concept',
  entity: 'wiki-entity',
  comparison: 'wiki-comparison',
  'source-summary': 'wiki-source',
  index: 'wiki-index',
  overview: 'wiki-overview',
};

const RAW_DEMO_META = {
  'GOAP可视化学习.html': {
    sourceSummary: 'src-goap-demo',
    tags: ['GOAP', 'AI 决策', '规划器', '可交互 Demo'],
    summary: '可交互 GOAP 教学 demo：调整世界状态、选择目标、单步执行并观察规划器如何生成动作链。',
  },
  'StateTree_Learn.html': {
    sourceSummary: 'src-statetree-demo',
    tags: ['StateTree', 'UE5', 'AI 决策', '状态机', '可交互 Demo'],
    summary: '可交互 StateTree 学习 demo：调整黑板数据、触发事件并观察活跃状态路径如何切换。',
  },
  'Utility_AI_Learn.html': {
    sourceSummary: 'src-utility-ai-demo',
    tags: ['Utility AI', 'AI 决策', '效用评分', '可交互 Demo'],
    summary: '可交互 Utility AI 学习 demo：拖动世界状态滑杆，实时观察候选行为的效用分数与排序。',
  },
  'UE_Networking_Visualization.html': {
    sourceSummary: 'src-ue-networking-overview',
    tags: ['Unreal Engine', '网络同步', 'Replication', '可视化图谱', '可交互 Demo'],
    summary: 'UE 网络同步可视化学习图谱：通过多视图 Canvas 交互理解原生同步、ReplicationGraph、Iris、RPC 和属性同步。',
  },
};

function walk(dir, extension = '.md') {
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full, extension);
    if (entry.isFile() && entry.name.endsWith(extension)) return [full];
    return [];
  });
}

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;

  const data = {};
  match[1].split(/\r?\n/).forEach((line) => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();

    if (/^\[.*\]$/.test(value)) {
      const inner = value.slice(1, -1).trim();
      data[key] = inner
        ? inner.split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
        : [];
      return;
    }

    data[key] = value.replace(/^['"]|['"]$/g, '');
  });

  return {
    data,
    body: text.slice(match[0].length),
  };
}

function extractSummary(body) {
  const cleaned = body
    .replace(/```[\s\S]*?```/g, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && !line.startsWith('>') && !line.startsWith('|') && !/^[-*_]{3,}$/.test(line));

  const paragraph = cleaned.find((line) => !line.startsWith('- ') && !/^\d+\.\s+/.test(line)) || cleaned[0] || '';
  return paragraph.replace(/\[\[([^\]]+)\]\]/g, '$1').replace(/[*_`]/g, '').slice(0, 180);
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildWikiSnippet(file) {
  const text = fs.readFileSync(file, 'utf8');
  const parsed = parseFrontmatter(text);
  if (!parsed) return null;

  const rel = toPosix(path.relative(ROOT, file));
  if (rel === 'wiki/log.md' || rel === 'wiki/SCHEMA.md') return null;

  const slug = path.basename(file, '.md');
  const relNoExt = toPosix(path.relative(WIKI_DIR, file)).replace(/\.md$/, '').replace(/\//g, '-');
  const type = parsed.data.type || 'wiki';
  const related = normalizeArray(parsed.data.related).map((item) => item.replace(/^\[\[/, '').replace(/\]\]$/, ''));
  const sources = normalizeArray(parsed.data.sources);
  const tags = [
    'LLM Wiki',
    type,
    ...related.slice(0, 8),
    ...sources.map((src) => path.basename(src).replace(/\.[^.]+$/, '')).slice(0, 4),
  ].filter(Boolean);

  return {
    id: `wiki-${relNoExt}`,
    title: parsed.data.title || slug,
    category: TYPE_CATEGORY[type] || 'wiki-overview',
    tags: [...new Set(tags)],
    file: rel,
    source: 'wiki',
    contentType: 'markdown',
    wikiSlug: slug,
    wikiType: type,
    createdAt: parsed.data.created || new Date().toISOString().slice(0, 10),
    updatedAt: parsed.data.updated || parsed.data.created || null,
    hasDiagram: false,
    summary: extractSummary(parsed.body),
    content: text,
  };
}

function writeKnowledgeIndex(wikiSnippets) {
  const existing = JSON.parse(fs.readFileSync(KNOWLEDGE_INDEX, 'utf8'));
  const nonWiki = (existing.snippets || []).filter((snippet) => snippet.source !== 'wiki' && !String(snippet.id || '').startsWith('wiki-'));
  const indexSnippets = wikiSnippets.map(({ content, ...snippet }) => snippet);

  const next = {
    ...existing,
    version: '2.3-wiki',
    snippets: [...nonWiki, ...indexSnippets],
  };

  const serialized = JSON.stringify(next, null, 2).replace(/\n/g, '\r\n') + '\r\n';
  fs.writeFileSync(KNOWLEDGE_INDEX, serialized, 'utf8');
}

function writeWikiData(wikiSnippets) {
  const payload = {
    version: '2.3-wiki',
    generatedAt: new Date().toISOString(),
    snippets: wikiSnippets,
  };

  const js = `// Auto-generated by tools/sync-wiki-to-knowledge.js. Do not edit manually.\nwindow.VIBE_WIKI_DATA = ${JSON.stringify(payload, null, 2)};\n`.replace(/\n/g, '\r\n');
  fs.writeFileSync(WIKI_DATA_JS, js, 'utf8');
}

function extractHtmlTitle(text, fallback) {
  const match = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1].trim()) : fallback;
}

function decodeHtml(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function buildRawDemoSnippet(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = toPosix(path.relative(ROOT, file));
  const name = path.basename(file);
  const meta = RAW_DEMO_META[name] || {};
  const slug = path.basename(file, path.extname(file)).replace(/[^\w\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '');
  const stat = fs.statSync(file);

  return {
    id: `raw-demo-${slug}`,
    title: extractHtmlTitle(text, path.basename(file, path.extname(file))),
    category: 'interactive-demo',
    tags: [...new Set(['raw', 'HTML', '可交互 Demo', ...(meta.tags || [])])],
    file: rel,
    source: 'raw-demo',
    contentType: 'interactive-demo',
    sourceSummary: meta.sourceSummary || '',
    createdAt: stat.mtime.toISOString().slice(0, 10),
    updatedAt: stat.mtime.toISOString().slice(0, 10),
    hasDiagram: false,
    summary: meta.summary || `raw/articles 下的 HTML 可交互学习 Demo：${path.basename(file)}`,
  };
}

function writeRawDemoData(rawDemoSnippets) {
  const payload = {
    version: '2.3-wiki',
    generatedAt: new Date().toISOString(),
    snippets: rawDemoSnippets,
  };

  const js = `// Auto-generated by tools/sync-wiki-to-knowledge.js. Do not edit manually.\nwindow.VIBE_RAW_DEMO_DATA = ${JSON.stringify(payload, null, 2)};\n`.replace(/\n/g, '\r\n');
  fs.writeFileSync(RAW_DEMO_DATA_JS, js, 'utf8');
}

function main() {
  const wikiSnippets = walk(WIKI_DIR)
    .map(buildWikiSnippet)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)) || a.title.localeCompare(b.title));

  const rawDemoSnippets = walk(RAW_ARTICLES_DIR, '.html')
    .map(buildRawDemoSnippet)
    .filter(Boolean)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)) || a.title.localeCompare(b.title));

  writeKnowledgeIndex(wikiSnippets);
  writeWikiData(wikiSnippets);
  writeRawDemoData(rawDemoSnippets);

  console.log(`Synced ${wikiSnippets.length} wiki pages and ${rawDemoSnippets.length} raw demos into frontend runtime data.`);
}

main();
