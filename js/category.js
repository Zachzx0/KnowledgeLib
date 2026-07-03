/**
 * 分类引擎
 * 预置分类体系 + 关键词自动分类
 */
const CategoryEngine = (() => {
  // 预置分类定义
  const CATEGORIES = {
    'programming': {
      label: '编程基础',
      icon: '&#x1F4BB;',
      keywords: ['编程', '语言', '语法', '数据结构', '设计模式', '代码', '编译', '调试', '重构',
        'programming', 'code', 'syntax', 'pattern', 'compile', 'debug', 'refactor', 'generic',
        'inheritance', 'polymorphism', 'interface', 'abstract', 'lambda', 'closure', 'promise',
        'async', 'await', 'thread', 'concurrent', 'parallel'],
    },
    'game-dev': {
      label: '游戏开发',
      icon: '&#x1F3AE;',
      keywords: ['游戏', '引擎', '渲染', '着色器', '碰撞', '物理', '动画', '场景', '关卡', '角色', 'AI',
        'game', 'engine', 'render', 'shader', 'collision', 'physics', 'animation', 'scene',
        'unreal', 'unity', 'godot', 'UObject', 'Actor', 'Pawn', 'Controller', 'Component',
        'Blueprint', 'Spawn', 'Tick', 'BeginPlay', 'EndPlay', 'UClass', 'Property'],
    },
    'networking': {
      label: '网络',
      icon: '&#x1F310;',
      keywords: ['网络', '协议', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'WebSocket', 'RPC', '同步', '复制',
        '延迟', '丢包', '带宽', '客户端', '服务器', 'P2P', 'DNS', 'socket', 'rest', 'api',
        'network', 'protocol', 'replication', 'latency', 'packet', 'server', 'client',
        'request', 'response', 'endpoint', 'middleware', 'proxy', 'gateway', 'loadbalancer',
        'NetDriver', 'NetConnection', 'Channel', 'Bunch', 'RepLayout', 'FastArraySerializer'],
    },
    'architecture': {
      label: '架构设计',
      icon: '&#x1F3D7;',
      keywords: ['架构', '系统', '设计', '分层', '微服务', '管道', '模式', 'ECS', 'MVC', 'MVVM',
        '模块', '解耦', '依赖', '注入', '消息', '事件', '队列', '缓存', '数据库',
        'architecture', 'system', 'design', 'layer', 'microservice', 'pipeline', 'pattern',
        'ECS', 'module', 'decouple', 'dependency', 'injection', 'event', 'queue', 'cache',
        'database', 'scalability', 'distributed', 'Plugin', 'Module', 'Subsystem'],
    },
    'ai-ml': {
      label: 'AI / 机器学习',
      icon: '&#x1F916;',
      keywords: ['AI', 'ML', 'DL', 'NLP', 'CV', '训练', '推理', '模型', '神经网络', '深度学习',
        '机器学习', 'Transformer', 'GPT', 'LLM', 'RAG', 'Embedding', 'token', 'agent',
        'machine learning', 'deep learning', 'neural', 'model', 'train', 'inference',
        'behavior tree', 'BT', 'navmesh', 'pathfinding', 'A*', 'decision', 'finite state',
        'state machine', 'FSM', 'perception', 'sensing', 'EQS', 'behavior'],
    },
    'frontend': {
      label: '前端开发',
      icon: '&#x1F4F1;',
      keywords: ['前端', 'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Vue', 'Angular',
        '组件', 'UI', 'UX', 'DOM', 'Canvas', 'SVG', 'WebGL', '动画', '响应式',
        'frontend', 'front-end', 'component', 'responsive', 'layout', 'style', 'theme',
        'SPA', 'SSR', 'SSG', 'bundler', 'webpack', 'vite', 'esbuild', 'tailwind', 'bootstrap',
        'Slate', 'UMG', 'Widget', 'Blueprint Widget', 'HUD', 'Viewport'],
    },
    'backend': {
      label: '后端开发',
      icon: '&#x2699;&#xFE0F;',
      keywords: ['后端', '服务器', '数据库', 'SQL', 'NoSQL', 'Redis', 'MongoDB', 'MongoDB',
        'Node.js', 'Python', 'Go', 'Java', 'C#', 'REST', 'GraphQL', 'gRPC',
        'backend', 'back-end', 'server', 'database', 'query', 'index', 'transaction',
        'authentication', 'authorization', 'JWT', 'OAuth', 'session', 'cookie', 'cron',
        'Dedicated Server', 'Listen Server', 'DS', 'GameSession', 'Matchmaking'],
    },
    'algorithm': {
      label: '算法与数学',
      icon: '&#x1F522;',
      keywords: ['算法', '排序', '搜索', '树', '图', '动态规划', '贪心', '回溯', '哈希', '堆',
        '数学', '向量', '矩阵', '四元数', '插值', '曲线', '噪声', '随机',
        'algorithm', 'sort', 'search', 'tree', 'graph', 'DP', 'greedy', 'backtrack',
        'hash', 'heap', 'math', 'vector', 'matrix', 'quaternion', 'interpolation',
        'lerp', 'noise', 'perlin', 'simplex', 'procedural', 'FVector', 'FTransform', 'FRotator'],
    },
    'tools': {
      label: '工具与效率',
      icon: '&#x1F6E0;&#xFE0F;',
      keywords: ['工具', 'IDE', 'Git', '版本控制', 'Docker', 'CI/CD', '调试器', '分析器',
        '日志', '监控', '测试', '部署', '插件', '扩展', '快捷键', '工作流',
        'tool', 'IDE', 'git', 'version control', 'docker', 'CI', 'CD', 'debugger',
        'profiler', 'log', 'monitor', 'test', 'deploy', 'plugin', 'extension',
        'shortcut', 'workflow', 'blueprint', 'build', 'package', 'cook', 'nativization'],
    },
    'wiki-concept': {
      label: 'Wiki 概念',
      icon: '&#x1F4D8;',
      keywords: ['wiki', 'concept', '概念'],
    },
    'wiki-entity': {
      label: 'Wiki 实体',
      icon: '&#x1F9E9;',
      keywords: ['wiki', 'entity', '实体'],
    },
    'wiki-comparison': {
      label: 'Wiki 对比',
      icon: '&#x2696;&#xFE0F;',
      keywords: ['wiki', 'comparison', '对比'],
    },
    'wiki-source': {
      label: 'Wiki 来源摘要',
      icon: '&#x1F4DD;',
      keywords: ['wiki', 'source-summary', '来源摘要'],
    },
    'wiki-index': {
      label: 'Wiki 索引',
      icon: '&#x1F5C2;&#xFE0F;',
      keywords: ['wiki', 'index', '索引'],
    },
    'interactive-demo': {
      label: '交互 Demo',
      icon: '&#x1F9EA;',
      keywords: ['demo', 'interactive', '可交互', '演示', '学习'],
    },
    'wiki-overview': {
      label: 'Wiki 综述',
      icon: '&#x1F4DA;',
      keywords: ['wiki', 'overview', '综述'],
    },
    'misc': {
      label: '杂项',
      icon: '&#x1F4CA;',
      keywords: [],
    },
  };

  // 分析文本的关键词匹配
  function extractKeywords(text) {
    const lower = text.toLowerCase();
    const matched = [];

    for (const [catKey, catDef] of Object.entries(CATEGORIES)) {
      if (catKey === 'misc') continue;
      let score = 0;
      const matchedKeywords = [];

      for (const keyword of catDef.keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          score += 1;
          // 长关键词权重更高
          if (keyword.length > 4) score += 1;
          if (keyword.length > 8) score += 1;
          matchedKeywords.push(keyword);
        }
      }

      if (score > 0) {
        matched.push({ category: catKey, score, matchedKeywords });
      }
    }

    // 按分数降序排列
    matched.sort((a, b) => b.score - a.score);
    return matched;
  }

  // 自动分类
  function autoClassify(snippet) {
    const text = `${snippet.title} ${snippet.summary} ${snippet.content || ''}`;
    const results = extractKeywords(text);

    if (results.length === 0) {
      return { category: 'misc', confidence: 0, suggestions: [] };
    }

    const best = results[0];
    const total = results.reduce((sum, r) => sum + r.score, 0);
    const confidence = total > 0 ? best.score / total : 0;

    return {
      category: best.category,
      confidence: Math.min(confidence * 100, 100),
      suggestions: results.slice(0, 3).map(r => ({
        category: r.category,
        label: CATEGORIES[r.category].label,
        score: r.score,
        matchedKeywords: r.matchedKeywords,
      })),
    };
  }

  // 建议标签
  function suggestTags(snippet, results) {
    const tags = [];
    const text = `${snippet.title} ${snippet.summary} ${snippet.content || ''}`.toLowerCase();

    // 从匹配的关键词中提取标签
    if (results && results.suggestions) {
      results.suggestions.forEach(s => {
        s.matchedKeywords.slice(0, 3).forEach(kw => {
          if (!tags.includes(kw) && tags.length < 10) {
            tags.push(kw);
          }
        });
      });
    }

    // 常见技术关键词匹配
    const techKeywords = [
      'Unreal Engine', 'Unity', 'Godot', 'React', 'Vue', 'Angular',
      'Node.js', 'Python', 'Go', 'Java', 'C#', 'C++', 'Rust', 'TypeScript',
      'JavaScript', 'HTML', 'CSS', 'Canvas', 'WebGL', 'SQL', 'Redis',
      'Docker', 'Git', 'AI', '机器学习', '深度学习', 'ECS', 'MVC',
      'RPC', 'HTTP', 'WebSocket', 'TCP', 'UDP', 'REST', 'GraphQL',
      '架构', '设计模式', '算法', '数据结构', '测试', '部署',
    ];

    techKeywords.forEach(kw => {
      if (text.includes(kw.toLowerCase()) && !tags.includes(kw) && tags.length < 12) {
        tags.push(kw);
      }
    });

    return tags;
  }

  // 获取分类定义
  function getCategory(catKey) {
    return CATEGORIES[catKey] || null;
  }

  // 获取所有分类
  function getAllCategories() {
    return Object.entries(CATEGORIES).map(([key, def]) => ({
      key,
      label: def.label,
      icon: def.icon,
    }));
  }

  return {
    autoClassify,
    suggestTags,
    getCategory,
    getAllCategories,
  };
})();
