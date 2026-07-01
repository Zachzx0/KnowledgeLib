/**
 * Canvas 图表查看器
 * 支持拖拽平移、滚轮缩放、适应视图、重置
 */
const CanvasViewer = (() => {
  let canvas, ctx, container;
  let offsetX = 0, offsetY = 0;
  let scale = 1;
  let minScale = 0.2;
  let maxScale = 5;
  let isDragging = false;
  let dragStartX, dragStartY;
  let dragOffsetX, dragOffsetY;
  let chartData = null;
  let nodePositions = [];
  let nodeRadius = 50;
  let animationId = null;

  // 颜色映射
  const COLORS = {
    bg: '#0a1220',
    grid: '#1a2540',
    nodeFill: '#162040',
    nodeStroke: '#2d4a8a',
    nodeHover: '#3a5aaa',
    edge: '#2d4a8a',
    edgeHighlight: '#5a8aff',
    text: '#d0d8f0',
    title: '#7ee0ff',
    subtext: '#8899bb',
    highlight: '#ffd08a',
    accent: '#5acc8a',
    danger: '#e0556a',
    info: '#5a8aff',
  };

  // 初始化
  function init(_container, _canvas) {
    container = _container;
    canvas = _canvas;
    ctx = canvas.getContext('2d');

    resize();
    bindEvents();
    render();
  }

  // 自适应大小
  function resize() {
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 绑定事件
  function bindEvents() {
    if (!canvas) return;

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    window.addEventListener('resize', () => {
      resize();
      render();
    });
  }

  // 加载图表数据
  function loadChart(data) {
    chartData = data;
    nodePositions = [];

    if (!data) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { resize(); fitToView(); render(); });
      });
      return;
    }

    // 序列图：不需要 nodePositions
    if (data.type === 'sequence') {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { resize(); fitToView(); render(); });
      });
      return;
    }

    if (data.nodes && data.nodes.length > 0) {
      // 使用预设位置或自动布局
      data.nodes.forEach((node, i) => {
        if (node.x !== undefined && node.y !== undefined) {
          nodePositions.push({ x: node.x, y: node.y, ...node });
        } else {
          // 自动圆形布局
          const angle = (2 * Math.PI * i) / data.nodes.length;
          const r = 200;
          nodePositions.push({
            x: Math.cos(angle) * r,
            y: Math.sin(angle) * r,
            ...node,
          });
        }
      });
    }

    // 延迟执行以确保容器可见后 canvas 有正确尺寸
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resize();
        fitToView();
        render();
      });
    });
  }

  // 获取当前图表数据
  function getChartData() {
    return chartData;
  }

  // 屏幕坐标 → 世界坐标
  function screenToWorld(sx, sy) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (sx - rect.left - offsetX) / scale,
      y: (sy - rect.top - offsetY) / scale,
    };
  }

  // 世界坐标 → 屏幕坐标
  function worldToScreen(wx, wy) {
    return {
      x: wx * scale + offsetX,
      y: wy * scale + offsetY,
    };
  }

  function onMouseDown(e) {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragOffsetX = offsetX;
    dragOffsetY = offsetY;
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) {
      // 检测 hover
      render();
      return;
    }
    offsetX = dragOffsetX + (e.clientX - dragStartX);
    offsetY = dragOffsetY + (e.clientY - dragStartY);
    render();
  }

  function onMouseUp(e) {
    if (!isDragging) return;
    isDragging = false;
    canvas.style.cursor = 'grab';
  }

  function onWheel(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const worldBefore = screenToWorld(e.clientX, e.clientY);
    const delta = -e.deltaY * 0.001;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * (1 + delta)));

    scale = newScale;

    const worldAfter = screenToWorld(e.clientX, e.clientY);
    offsetX += (worldBefore.x - worldAfter.x) * scale;
    offsetY += (worldBefore.y - worldAfter.y) * scale;

    render();
  }

  function onClick(e) {
    if (isDragging) return;
    const pos = screenToWorld(e.clientX, e.clientY);

    if (nodePositions.length === 0) return;

    // 查找被点击的节点
    for (const node of nodePositions) {
      const dx = pos.x - node.x;
      const dy = pos.y - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < nodeRadius) {
        // 触发节点点击回调
        if (typeof onNodeClick === 'function') {
          onNodeClick(node);
        }
        break;
      }
    }
  }

  function onDblClick(e) {
    fitToView();
    render();
  }

  // 触摸支持
  let touchStartDist = 0;
  let touchStartScale = 1;
  let touchStartOffset = { x: 0, y: 0 };
  let touches = [];

  function onTouchStart(e) {
    e.preventDefault();
    touches = Array.from(e.touches);

    if (touches.length === 1) {
      isDragging = true;
      dragStartX = touches[0].clientX;
      dragStartY = touches[0].clientY;
      dragOffsetX = offsetX;
      dragOffsetY = offsetY;
    } else if (touches.length === 2) {
      isDragging = false;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      touchStartDist = Math.sqrt(dx * dx + dy * dy);
      touchStartScale = scale;
      const cx = (touches[0].clientX + touches[1].clientX) / 2;
      const cy = (touches[0].clientY + touches[1].clientY) / 2;
      touchStartOffset = { x: offsetX, y: offsetY };
    }
  }

  function onTouchMove(e) {
    e.preventDefault();
    touches = Array.from(e.touches);

    if (touches.length === 1 && isDragging) {
      offsetX = dragOffsetX + (touches[0].clientX - dragStartX);
      offsetY = dragOffsetY + (touches[0].clientY - dragStartY);
    } else if (touches.length === 2) {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = Math.min(maxScale, Math.max(minScale, touchStartScale * (dist / touchStartDist)));

      const cx = (touches[0].clientX + touches[1].clientX) / 2;
      const cy = (touches[0].clientY + touches[1].clientY) / 2;

      const rect = canvas.getBoundingClientRect();
      const px = cx - rect.left;
      const py = cy - rect.top;

      const worldX = (px - touchStartOffset.x) / touchStartScale;
      const worldY = (py - touchStartOffset.y) / touchStartScale;

      scale = newScale;
      offsetX = px - worldX * scale;
      offsetY = py - worldY * scale;
    }

    render();
  }

  function onTouchEnd(e) {
    isDragging = false;
    touches = [];
  }

  // 节点点击回调（外部设置）
  let onNodeClick = null;
  function setOnNodeClick(fn) {
    onNodeClick = fn;
  }

  // 适应视图
  function fitToView() {
    if (!chartData) {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      return;
    }

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    if (chartData.type === 'sequence') {
      // 序列图：基于泳道 x 和消息 y 计算
      for (const l of chartData.lanes) {
        minX = Math.min(minX, l.x - 160);
        maxX = Math.max(maxX, l.x + 160);
      }
      minY = -30;
      maxY = 60;
      const yScale = chartData.yScale || 1;
      for (const m of chartData.messages) {
        maxY = Math.max(maxY, m.y * yScale + 80);
      }
    } else if (nodePositions.length > 0) {
      for (const n of nodePositions) {
        const halfW = (n.w || nodeRadius * 2) / 2;
        const halfH = (n.h || nodeRadius * 2) / 2;
        const pad = 30;
        minX = Math.min(minX, n.x - halfW - pad);
        minY = Math.min(minY, n.y - halfH - pad);
        maxX = Math.max(maxX, n.x + (n.w || 0) + pad);
        maxY = Math.max(maxY, n.y + (n.h || 0) + pad);
      }
    } else {
      scale = 1;
      offsetX = 0;
      offsetY = 0;
      return;
    }

    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const padding = 60;

    const scaleX = (rect.width - padding * 2) / Math.max(graphW, 1);
    const scaleY = (rect.height - padding * 2) / Math.max(graphH, 1);
    scale = Math.min(scaleX, scaleY, 1.6);
    if (scale < 0.1) scale = 1;

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    offsetX = rect.width / 2 - centerX * scale;
    offsetY = rect.height / 2 - centerY * scale;
  }

  // 重置视图
  function resetView() {
    fitToView();
    render();
  }

  // 渲染
  function render() {
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;

    if (w === 0) {
      requestAnimationFrame(render);
      return;
    }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    // 网格背景
    drawGrid(w, h);

    if (!chartData) {
      drawPlaceholder(w, h);
      return;
    }

    // 根据类型分发渲染
    if (chartData.type === 'sequence') {
      drawSequenceDiagram();
    } else {
      if (nodePositions.length === 0) {
        drawPlaceholder(w, h);
        return;
      }
      // 绘制连线
      if (chartData.edges) {
        drawEdges();
      }
      // 绘制节点
      drawNodes();
    }

    // 绘制标题
    if (chartData.title) {
      drawTitle(w, h);
    }
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;

    const gridSize = 50 * scale;
    if (gridSize < 10) return;

    const startX = offsetX % gridSize;
    const startY = offsetY % gridSize;

    for (let x = startX; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = startY; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawEdges() {
    for (const edge of chartData.edges) {
      const from = nodePositions.find(n => n.id === edge.from);
      const to = nodePositions.find(n => n.id === edge.to);
      if (!from || !to) continue;

      // 计算节点中心点（矩形节点用 x+w/2, y+h/2）
      const fromCX = from.x + (from.w || 0) / 2;
      const fromCY = from.y + (from.h || 0) / 2;
      const toCX = to.x + (to.w || 0) / 2;
      const toCY = to.y + (to.h || 0) / 2;

      // 计算与目标节点边界的交点
      let sx, sy, ex, ey;
      const fromIsRect = from.w !== undefined;
      const toIsRect = to.w !== undefined;

      if (fromIsRect) {
        [sx, sy] = clipToRect(fromCX, fromCY, toCX, toCY, { x: from.x, y: from.y, w: from.w, h: from.h });
      } else {
        sx = from.x; sy = from.y;
      }

      if (toIsRect) {
        [ex, ey] = clipToRect(toCX, toCY, fromCX, fromCY, { x: to.x, y: to.y, w: to.w, h: to.h });
      } else {
        ex = to.x; ey = to.y;
      }

      const S = worldToScreen(sx, sy);
      const E = worldToScreen(ex, ey);

      ctx.strokeStyle = edge.color || 'rgba(140,180,255,0.55)';
      ctx.lineWidth = edge.width || 1.5;
      ctx.setLineDash(edge.dashed ? [8, 4] : []);

      ctx.beginPath();
      ctx.moveTo(S.x, S.y);
      // 贝塞尔曲线（更美观）
      const midY = (S.y + E.y) / 2;
      ctx.bezierCurveTo(S.x, midY, E.x, midY, E.x, E.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 箭头
      const dx = E.x - S.x, dy = E.y - S.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const ah = 8;
      ctx.fillStyle = edge.color || 'rgba(140,180,255,0.85)';
      ctx.beginPath();
      ctx.moveTo(E.x, E.y);
      ctx.lineTo(E.x - ux * ah - uy * ah / 2, E.y - uy * ah + ux * ah / 2);
      ctx.lineTo(E.x - ux * ah + uy * ah / 2, E.y - uy * ah - ux * ah / 2);
      ctx.closePath();
      ctx.fill();

      // 标签
      if (edge.label) {
        const mx = (S.x + E.x) / 2;
        const my = (S.y + E.y) / 2;
        const fs = Math.max(10, 11 * Math.min(scale, 1.5));
        ctx.font = `${fs}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';

        // 文字背景
        const tw = ctx.measureText(edge.label).width;
        ctx.fillStyle = 'rgba(11,16,32,0.85)';
        ctx.fillRect(mx - tw / 2 - 4, my - 10, tw + 8, fs + 4);

        ctx.fillStyle = '#d0d8f0';
        ctx.textBaseline = 'middle';
        ctx.fillText(edge.label, mx, my - 6);
      }
    }
  }

  // 从 (fromX,fromY) 向 (toX,toY) 方向，与 rect 边界的交点
  function clipToRect(fromX, fromY, toX, toY, rect) {
    const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
    const dx = fromX - cx, dy = fromY - cy;
    const hw = rect.w / 2, hh = rect.h / 2;
    const scale = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6));
    return [cx + dx * scale, cy + dy * scale];
  }

  function drawArrow(fromX, fromY, toX, toY) {
    const angle = Math.atan2(toY - fromY, toX - fromX);
    const headLen = 12;
    const headAngle = Math.PI / 6;

    ctx.fillStyle = COLORS.edge;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLen * Math.cos(angle - headAngle),
      toY - headLen * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      toX - headLen * Math.cos(angle + headAngle),
      toY - headLen * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fill();
  }

  function drawNodes() {
    for (const node of nodePositions) {
      const s = worldToScreen(node.x, node.y);

      // 判断是矩形节点（原始风格）还是圆形节点
      const isRect = node.w !== undefined && node.h !== undefined;

      if (isRect) {
        drawRectNode(node, s);
      } else {
        drawCircleNode(node, s);
      }
    }
  }

  // 矩形节点（UE 原图风格）
  function drawRectNode(node, s) {
    const w = (node.w || 200) * scale;
    const h = (node.h || 50) * scale;
    const x = s.x;
    const y = s.y;

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(x + 3, y + 4, w, h);

    // 主体填充
    ctx.fillStyle = node.color || COLORS.nodeStroke;
    ctx.fillRect(x, y, w, h);

    // 高光边
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // 文本
    const fs = Math.max(10, 13 * scale);
    ctx.fillStyle = '#fff';
    ctx.font = `600 ${fs}px "Segoe UI", "Microsoft YaHei"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = (node.label || '').split('\n');
    const lh = fs * 1.25;
    const total = lh * lines.length;
    lines.forEach((ln, i) => {
      ctx.fillText(ln, x + w / 2, y + h / 2 - total / 2 + lh * (i + 0.5));
    });
  }

  // 圆形节点
  function drawCircleNode(node, s) {
    const r = node.radius || nodeRadius;
    const sr = r * scale;

    // 阴影
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    // 填充
    const grad = ctx.createRadialGradient(s.x - sr * 0.3, s.y - sr * 0.3, sr * 0.1, s.x, s.y, sr);
    grad.addColorStop(0, node.fill || COLORS.nodeStroke);
    grad.addColorStop(1, node.fill || COLORS.nodeFill);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.x, s.y, sr, 0, Math.PI * 2);
    ctx.fill();

    // 描边
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = node.color || COLORS.nodeStroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    ctx.fillStyle = COLORS.text;
    ctx.font = `${Math.max(14, sr * 0.5)}px "Microsoft YaHei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (node.icon) {
      ctx.fillText(node.icon, s.x, s.y);
    } else if (node.label) {
      const fontSize = Math.max(10, sr * 0.35);
      ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
      const lines = wrapText(node.label, sr * 1.6, fontSize);
      const lineH = fontSize * 1.3;
      const totalH = lines.length * lineH;
      const startY = s.y - totalH / 2 + lineH / 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, s.x, startY + i * lineH);
      });
    }
  }

  // === 序列图渲染 ===
  function drawSequenceDiagram() {
    if (!chartData.lanes || !chartData.messages) return;

    const laneMap = Object.fromEntries(chartData.lanes.map(l => [l.id, l]));
    const yScale = chartData.yScale || 1;

    // 计算全局 y 范围
    let yMin = 20, yMax = 60;
    for (const m of chartData.messages) {
      yMax = Math.max(yMax, m.y * yScale + 40);
    }

    // ---- 1. 绘制泳道生命线 ----
    for (const l of chartData.lanes) {
      const X = l.x * scale + offsetX;
      const YTop = yMin * scale + offsetY;
      const YBottom = yMax * scale + offsetY;

      // 生命线（虚线）
      ctx.strokeStyle = 'rgba(140,180,255,0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(X, YTop + 30);
      ctx.lineTo(X, YBottom);
      ctx.stroke();
      ctx.setLineDash([]);

      // 泳道标题框
      const boxW = 260 * scale, boxH = 44 * scale;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(X - boxW / 2 + 3, YTop + 4, boxW, boxH);
      ctx.fillStyle = l.color;
      ctx.fillRect(X - boxW / 2, YTop, boxW, boxH);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(X - boxW / 2, YTop, boxW, boxH);

      ctx.fillStyle = '#fff';
      ctx.font = `600 ${Math.max(11, 14 * scale)}px "Segoe UI", "Microsoft YaHei"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(l.label, X, YTop + boxH / 2);
    }

    // ---- 2. 绘制消息 ----
    for (let i = 0; i < chartData.messages.length; i++) {
      const m = chartData.messages[i];
      const from = laneMap[m.from], to = laneMap[m.to];
      if (!from || !to) continue;
      drawSequenceMessage(m, from, to);
    }
  }

  function drawSequenceMessage(m, from, to) {
    const yScale = chartData.yScale || 1;
    const Y = (m.y * yScale) * scale + offsetY;
    const XF = from.x * scale + offsetX;
    const XT = to.x * scale + offsetX;

    if (m.kind === 'note') {
      // 说明节点：横跨所有泳道的浅色带
      const laneXs = chartData.lanes.map(l => l.x * scale + offsetX);
      const left = Math.min(...laneXs) - 140 * scale;
      const right = Math.max(...laneXs) + 140 * scale;
      const H = 34 * scale;

      ctx.fillStyle = 'rgba(196,127,61,0.22)';
      ctx.fillRect(left, Y - H / 2, right - left, H);
      ctx.strokeStyle = 'rgba(255,208,138,0.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(left, Y - H / 2, right - left, H);
      ctx.setLineDash([]);

      ctx.fillStyle = '#ffd08a';
      ctx.font = `600 ${Math.max(12, 14 * scale)}px "Segoe UI", "Microsoft YaHei"`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(m.label, (left + right) / 2, Y);
      return;
    }

    if (m.kind === 'internal' || m.from === m.to) {
      // 内部处理：泳道自循环圆弧
      const R = 20 * scale;
      ctx.strokeStyle = 'rgba(120,140,200,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(XF + R + 4 * scale, Y, R, Math.PI * 0.6, Math.PI * 1.4, true);
      ctx.stroke();

      // 箭头
      ctx.fillStyle = 'rgba(120,140,200,0.9)';
      ctx.beginPath();
      ctx.moveTo(XF + 6 * scale, Y);
      ctx.lineTo(XF + 14 * scale, Y - 4 * scale);
      ctx.lineTo(XF + 14 * scale, Y + 4 * scale);
      ctx.closePath();
      ctx.fill();
    } else {
      // RPC / reply：箭头线
      const color = m.kind === 'rpc' ? '#e0556a' : '#5a8aff';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash(m.dashed ? [6, 4] : []);
      ctx.beginPath();
      ctx.moveTo(XF, Y);
      ctx.lineTo(XT, Y);
      ctx.stroke();
      ctx.setLineDash([]);

      // 箭头
      const dir = XT > XF ? 1 : -1;
      const ah = 10 * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(XT, Y);
      ctx.lineTo(XT - dir * ah, Y - ah / 2);
      ctx.lineTo(XT - dir * ah, Y + ah / 2);
      ctx.closePath();
      ctx.fill();
    }

    // 文字标签
    const labelY = Y - 14 * scale;
    const midX = (XF + XT) / 2;
    const fs = Math.max(11, 12 * scale);
    ctx.font = `600 ${fs}px "Segoe UI", "Microsoft YaHei"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 文字背景框
    const textW = ctx.measureText(m.label).width;
    const padX = 6 * scale, padY = 3 * scale;
    ctx.fillStyle = 'rgba(11,16,32,0.85)';
    ctx.fillRect(midX - textW / 2 - padX, labelY - fs / 2 - padY, textW + padX * 2, fs + padY * 2);

    ctx.fillStyle = '#d0d8f0';
    ctx.fillText(m.label, midX, labelY);
  }

  function wrapText(text, maxWidth, fontSize) {
    ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
    const words = text.split('');
    const lines = [];
    let current = '';

    for (const ch of words) {
      const test = current + ch;
      if (ctx.measureText(test).width > maxWidth && current.length > 0) {
        lines.push(current);
        current = ch;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    return lines.slice(0, 3); // 最多3行
  }

  function drawPlaceholder(w, h) {
    ctx.fillStyle = COLORS.subtext;
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('暂无图表数据，请加载知识片段', w / 2, h / 2);
  }

  function drawTitle(w, h) {
    ctx.fillStyle = COLORS.title;
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(chartData.title, w / 2, 30);
  }

  // 导出当前视图为图片
  function exportImage() {
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'knowledge-chart.png';
    link.href = dataUrl;
    link.click();
  }

  // 清理
  function destroy() {
    // 移除事件监听可以通过克隆节点
    if (canvas) {
      const clone = canvas.cloneNode(true);
      canvas.parentNode.replaceChild(clone, canvas);
      canvas = clone;
    }
  }

  return {
    init,
    resize,
    loadChart,
    getChartData,
    fitToView,
    resetView,
    setOnNodeClick,
    exportImage,
    destroy,
    render,
  };
})();
