/**
 * network-sim.js — Complete Network Simulation Engine
 * NetBankX | Computer Networks Project
 *
 * Renders animated packet flows on an HTML5 Canvas.
 * Fires OSITrace.addHop() callbacks at each hop for the layer panel.
 */

/* ── BOM guard — stop if already loaded ─────────────────────── */
if (window.NetworkSim) { /* already loaded */ }
else {

const NetworkSim = (function () {

  /* ── STATE ─────────────────────────────────────────────────── */
  let canvas, ctx, mode, nodes = [], links = [], packets = [], options = {};
  let animationFrameId, autoPacketTimer;
  let hoverNode = null, frameCount = 0;
  let networkLogEl = null;

  let stats = { sent: 0, lost: 0, retransmitted: 0, totalLatency: 0, latencyCount: 0 };
  let config = {
    speed: 1, packetLoss: 5, latency: 20, bandwidthKbps: 100,
    tlsEnabled: true, firewall: false, rateLimit: false
  };

  /* ── HELPERS ────────────────────────────────────────────────── */
  function getMac(id) {
    if (!id) return '00:00:00:00:00:00';
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
    const hex = Math.abs(hash).toString(16).padStart(6, '0');
    return `00:1A:2B:${hex.substring(0,2)}:${hex.substring(2,4)}:${hex.substring(4,6)}`.toUpperCase();
  }

  function getNode(id) { return nodes.find(n => n.id === id); }
  function getLink(a, b) { return links.find(l => (l.source === a && l.target === b) || (l.source === b && l.target === a)); }
  function getHubForBranch(branchId) {
    if (branchId.startsWith('MH')) return 'MH-HUB';
    if (branchId.startsWith('DL')) return 'DL-HUB';
    return 'KA-HUB';
  }

  /* ── PACKET INSPECTOR STYLES ────────────────────────────────── */
  const piStyle = document.createElement('style');
  piStyle.textContent = `
    .packet-inspector {
      position:absolute;bottom:12px;left:12px;
      background:rgba(7,13,26,0.97);border:1px solid #ffd700;
      border-radius:8px;padding:10px 12px;font-family:'Consolas',monospace;
      color:#e8eaf6;pointer-events:none;z-index:100;
      width:300px;box-shadow:0 4px 20px rgba(0,0,0,0.6);
      display:none;font-size:0.72rem;
    }
    .pi-title{color:#ffd700;border-bottom:1px solid #1e2d4f;padding-bottom:4px;margin-bottom:6px;font-weight:bold;font-size:0.8rem;}
    .pi-layer{color:#4fc3f7;margin-top:6px;margin-bottom:2px;font-weight:bold;font-size:0.66rem;text-transform:uppercase;letter-spacing:1px;}
    .pi-row{display:flex;justify-content:space-between;margin-bottom:2px;}
    .pi-key{color:#5c6bc0;}
    .pi-val{color:#a5d6a7;font-weight:bold;}
    .pi-val.mac{color:#ffab40;}
    .pi-val.flags{color:#ef9a9a;}
  `;
  document.head.appendChild(piStyle);
  let packetInspectorEl = null;

  /* ── COLORS ─────────────────────────────────────────────────── */
  const COLORS = {
    hq: '#1a237e', hqLight: '#3949ab',
    regional: '#1565c0', regionalLight: '#1976d2',
    branch: '#0277bd', branchLight: '#0288d1',
    customer: '#00695c', customerLight: '#00897b',
    gold: '#ffd700', goldDim: '#f0a500',
    bg: '#070d1a', bgCard: '#0d1529',
    gridLine: 'rgba(30,45,80,0.35)',
    text: '#e8eaf6', textMuted: '#5c6bc0',
    linkNormal: '#1e3a6e', linkActive: '#ffd700', linkBroken: '#ff5252',
    pktDown: '#ffd700', pktUp: '#00e676', pktAlert: '#ff5252',
    pktInfo: '#40c4ff', pktRetransmit: '#ff9800'
  };

  /* ── TOPOLOGY SETUP ─────────────────────────────────────────── */
  function setupTopology() {
    nodes = []; links = [];
    const addL = (s, t) => links.push({ source: s, target: t, status: 'normal', dashOffset: 0, flowDirection: null, activeFrames: 0 });

    if (mode === 'full') {
      nodes = [
        { id:'HQ',           ip:'12.0.0.1',      type:'hq',       rx:0.5,  ry:0.10, radius:38, label:'HQ Server' },
        { id:'MH-HUB',       ip:'203.0.113.1',   type:'regional', rx:0.18, ry:0.30, radius:28, label:'MH Regional Hub' },
        { id:'DL-HUB',       ip:'203.0.113.2',   type:'regional', rx:0.50, ry:0.30, radius:28, label:'DL Regional Hub' },
        { id:'KA-HUB',       ip:'203.0.113.3',   type:'regional', rx:0.82, ry:0.30, radius:28, label:'KA Regional Hub' },
        { id:'MH-MUM-001-RT',type:'branch',       rx:0.04, ry:0.58, radius:17, label:'Mumbai Main' },
        { id:'MH-MUM-002-RT',type:'branch',       rx:0.12, ry:0.58, radius:17, label:'Mumbai West' },
        { id:'MH-PUN-001-RT',type:'branch',       rx:0.20, ry:0.58, radius:17, label:'Pune' },
        { id:'MH-NGP-001-RT',type:'branch',       rx:0.28, ry:0.58, radius:17, label:'Nagpur' },
        { id:'DL-NDL-001-RT',type:'branch',       rx:0.41, ry:0.58, radius:17, label:'Connaught Pl.' },
        { id:'DL-NDL-002-RT',type:'branch',       rx:0.50, ry:0.58, radius:17, label:'South Delhi' },
        { id:'DL-GGN-001-RT',type:'branch',       rx:0.59, ry:0.58, radius:17, label:'Gurgaon' },
        { id:'KA-BLR-001-RT',type:'branch',       rx:0.71, ry:0.58, radius:17, label:'Koramangala' },
        { id:'KA-BLR-002-RT',type:'branch',       rx:0.80, ry:0.58, radius:17, label:'Whitefield' },
        { id:'KA-MYS-001-RT',type:'branch',       rx:0.89, ry:0.58, radius:17, label:'Mysore' },
      ];
      addL('HQ','MH-HUB'); addL('HQ','DL-HUB'); addL('HQ','KA-HUB');
      ['MH-MUM-001-RT','MH-MUM-002-RT','MH-PUN-001-RT','MH-NGP-001-RT'].forEach(b => addL('MH-HUB', b));
      ['DL-NDL-001-RT','DL-NDL-002-RT','DL-GGN-001-RT'].forEach(b => addL('DL-HUB', b));
      ['KA-BLR-001-RT','KA-BLR-002-RT','KA-MYS-001-RT'].forEach(b => addL('KA-HUB', b));

    } else if (mode === 'regional') {
      const regionId = options.regionId || 'MH';
      const hubId = `${regionId}-HUB`;
      nodes = [
        { id:'HQ', ip:'12.0.0.1', type:'hq', rx:0.5, ry:0.15, radius:35, label:'HQ Server' },
        { id:hubId, type:'regional', rx:0.5, ry:0.45, radius:30, label:`${regionId} Regional Hub` }
      ];
      let branches = regionId === 'MH'
        ? ['MH-MUM-001-RT','MH-MUM-002-RT','MH-PUN-001-RT','MH-NGP-001-RT']
        : regionId === 'DL'
          ? ['DL-NDL-001-RT','DL-NDL-002-RT','DL-GGN-001-RT']
          : ['KA-BLR-001-RT','KA-BLR-002-RT','KA-MYS-001-RT'];
      const spacing = 0.8 / Math.max(branches.length - 1, 1);
      branches.forEach((b, i) => {
        nodes.push({ id:b, type:'branch', rx:0.1 + i*spacing, ry:0.8, radius:20, label:b.replace('-RT','') });
        addL(hubId, b);
      });
      addL('HQ', hubId);

    } else if (mode === 'branch') {
      const branchId = options.branchId || 'MH-MUM-001-RT';
      const hubId = getHubForBranch(branchId);
      nodes = [
        { id:'BR1',  ip:'10.1.1.1',      type:'branch',   rx:0.1, ry:0.5, radius:25, label: branchId.replace('-RT','') },
        { id:'HUB1', ip:'203.0.113.' + (hubId.includes('DL')?2:hubId.includes('KA')?3:1), type:'regional', rx:0.3, ry:0.5, radius:30, label:hubId },
        { id:'HQ',   ip:'12.0.0.1',      type:'hq',       rx:0.5, ry:0.5, radius:35, label:'HQ Server' },
        { id:'HUB2', ip:'203.0.113.2',   type:'regional', rx:0.7, ry:0.5, radius:30, label:'Dest Hub' },
        { id:'BR2',  ip:'10.2.1.1',      type:'branch',   rx:0.9, ry:0.5, radius:25, label:'Dest Branch' },
      ];
      addL('BR1','HUB1'); addL('HUB1','HQ'); addL('HQ','HUB2'); addL('HUB2','BR2');

    } else if (mode === 'transfer') {
      nodes = [
        { id:'CUST1', ip:'192.168.1.45', type:'customer', rx:0.08, ry:0.5, radius:20, label:'Your Device' },
        { id:'BR1',   ip:'10.1.1.1',     type:'branch',   rx:0.24, ry:0.5, radius:25, label:'Branch Router' },
        { id:'HUB1',  ip:'203.0.113.1',  type:'regional', rx:0.38, ry:0.5, radius:30, label:'Source Hub' },
        { id:'HQ',    ip:'12.0.0.1',     type:'hq',       rx:0.50, ry:0.5, radius:35, label:'HQ Server' },
        { id:'HUB2',  ip:'203.0.113.2',  type:'regional', rx:0.62, ry:0.5, radius:30, label:'Dest Hub' },
        { id:'BR2',   ip:'10.2.1.1',     type:'branch',   rx:0.76, ry:0.5, radius:25, label:'Dest Branch' },
        { id:'CUST2', ip:'192.168.2.88', type:'customer', rx:0.92, ry:0.5, radius:20, label:'Recipient' },
      ];
      addL('CUST1','BR1'); addL('BR1','HUB1'); addL('HUB1','HQ');
      addL('HQ','HUB2'); addL('HUB2','BR2'); addL('BR2','CUST2');
    }
  }

  /* ── NODE POSITION ──────────────────────────────────────────── */
  function nodePos(n) {
    return { x: n.rx * canvas.width, y: n.ry * canvas.height };
  }

  /* ── DRAW ───────────────────────────────────────────────────── */
  function drawGrid() {
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    const spacing = 40;
    for (let x = 0; x < canvas.width; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }
  }

  function drawLinks() {
    links.forEach(l => {
      const sn = getNode(l.source), tn = getNode(l.target);
      if (!sn || !tn) return;
      const sp = nodePos(sn), tp = nodePos(tn);
      ctx.beginPath();
      ctx.moveTo(sp.x, sp.y); ctx.lineTo(tp.x, tp.y);
      if (l.status === 'broken') {
        ctx.strokeStyle = COLORS.linkBroken;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
      } else if (l.activeFrames > 0) {
        ctx.strokeStyle = COLORS.linkActive;
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
        l.activeFrames = Math.max(0, l.activeFrames - 1);
      } else {
        ctx.strokeStyle = COLORS.linkNormal;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  function drawNodes() {
    nodes.forEach(n => {
      const p = nodePos(n);
      const isHover = hoverNode && hoverNode.id === n.id;
      const baseColor = COLORS[n.type] || COLORS.branch;
      const lightColor = COLORS[n.type + 'Light'] || baseColor;

      /* Glow */
      if (isHover || n.type === 'hq') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, n.radius + 12, 0, Math.PI * 2);
        ctx.fillStyle = n.type === 'hq' ? 'rgba(255,215,0,0.07)' : 'rgba(255,255,255,0.05)';
        ctx.fill();
      }

      /* Outer ring */
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.radius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = n.type === 'hq' ? COLORS.gold : lightColor;
      ctx.lineWidth = isHover ? 2.5 : 1.5;
      ctx.globalAlpha = isHover ? 1 : 0.5;
      ctx.stroke();
      ctx.globalAlpha = 1;

      /* Fill */
      const grad = ctx.createRadialGradient(p.x - n.radius*0.25, p.y - n.radius*0.25, 0, p.x, p.y, n.radius);
      grad.addColorStop(0, lightColor);
      grad.addColorStop(1, baseColor);
      ctx.beginPath();
      ctx.arc(p.x, p.y, n.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      /* Icon */
      ctx.fillStyle = n.type === 'hq' ? COLORS.gold : COLORS.text;
      ctx.font = `bold ${Math.max(10, n.radius * 0.55)}px Segoe UI`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icons = { hq:'HQ', regional:'HUB', branch:'BR', customer:'C' };
      ctx.fillText(icons[n.type] || '?', p.x, p.y);

      /* Label */
      ctx.fillStyle = isHover ? COLORS.gold : COLORS.text;
      ctx.font = `${n.radius > 25 ? 12 : 10}px Segoe UI`;
      ctx.textBaseline = 'top';
      ctx.fillText(n.label, p.x, p.y + n.radius + 5);

      /* IP */
      if (n.ip) {
        ctx.fillStyle = COLORS.textMuted;
        ctx.font = '9px Consolas';
        ctx.textBaseline = 'top';
        ctx.fillText(n.ip, p.x, p.y + n.radius + 18);
      }
    });
  }

  function drawPackets() {
    packets.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);

      /* Glow ring */
      const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
      grd.addColorStop(0, p.color + 'aa');
      grd.addColorStop(1, 'transparent');
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      /* Dot */
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      /* Label */
      if (p.label) {
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 9px Consolas';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(p.label, 0, -8);
      }
      ctx.restore();
    });
  }

  function drawHUD() {
    frameCount++;
    /* Scan line pulse */
    ctx.fillStyle = `rgba(255,215,0,${0.015 + 0.01 * Math.sin(frameCount * 0.04)})`;
    const scanY = (frameCount * 1.2) % canvas.height;
    ctx.fillRect(0, scanY, canvas.width, 1.5);
  }

  /* ── ANIMATION LOOP ─────────────────────────────────────────── */
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawGrid();
    drawLinks();
    drawHUD();
    drawNodes();
    drawPackets();

    /* Move packets */
    packets = packets.filter(p => {
      const tn = getNode(p.target);
      if (!tn) return false;
      const tp = nodePos(tn);
      const dx = tp.x - p.x, dy = tp.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const step = (p.speed || 0.012) * config.speed * 400;

      if (dist < step + 2) {
        /* Arrived */
        if (p.onArrive) p.onArrive();
        const link = getLink(p.source, p.target);
        if (link) { link.activeFrames = 0; }
        return false;
      }

      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;
      return true;
    });

    animationFrameId = requestAnimationFrame(animate);
  }

  /* ── SIMULATE PACKET ────────────────────────────────────────── */
  function simulatePacket(srcId, dstId, opts = {}) {
    /* Guard: if canvas has no size yet, nodes are at (0,0) — skip */
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      if (opts.onArrive) opts.onArrive();
      return;
    }

    const sn = getNode(srcId), dn = getNode(dstId);
    if (!sn || !dn) { if (opts.onArrive) opts.onArrive(); return; }


    /* Packet loss */
    if (Math.random() * 100 < config.packetLoss && opts.type !== 'critical') {
      stats.lost++;
      addLog('alert', srcId, dstId, 'LOST', config.latency, 'dropped', opts.label);
      /* Retransmit after timeout */
      setTimeout(() => {
        stats.retransmitted++;
        addLog('info', srcId, dstId, 'RTX', config.latency, 'retransmitting', opts.label);
        const rtxPkt = { ...opts, color: COLORS.pktRetransmit, label: '[RTX]' };
        simulatePacket(srcId, dstId, rtxPkt);
      }, 1200 + config.latency * 10);
      return;
    }

    const sp = nodePos(sn);
    const link = getLink(srcId, dstId);
    if (link) link.activeFrames = 30;

    stats.sent++;
    stats.totalLatency += config.latency;
    stats.latencyCount++;

    const hopNum = opts.hopNum || 0;

    packets.push({
      source: srcId, target: dstId,
      x: sp.x, y: sp.y,
      color: opts.color || COLORS.pktInfo,
      label: opts.label || '',
      speed: (opts.speed || 0.012) * (opts.type === 'syn' ? 1.2 : 1),
      onArrive: opts.onArrive || null,
      type: opts.type || 'data',
      ttl: opts.ttl || 64,
      origSrc: opts.origSrc || srcId,
      finalDest: opts.finalDest || dstId,
    });

    /* Notify the Live Packet Inspector (HQ page) if it is listening */
    if (typeof window._notifyInspector === 'function') {
      window._notifyInspector(srcId, dstId, opts.label || 'DAT', hopNum, config.tlsEnabled);
    }

    updateStatsDisplay();

  }

  /* ── LOG ────────────────────────────────────────────────────── */
  function addLog(type, from, to, label, latency, action, payload) {
    const el = networkLogEl || document.getElementById('networkLog') || document.getElementById('statusLog');
    if (!el) return;

    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
    const icons = { down:'▼', up:'▲', alert:'✗', info:'◈', success:'✓' };
    const typeMap = { down:'down', up:'up', alert:'alert', info:'info', success:'success' };

    const row = document.createElement('div');
    row.className = `log-entry log-entry--${typeMap[type] || 'info'}`;
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:3px;align-items:flex-start;opacity:0;animation:fadeIn 0.3s ease forwards;';
    row.innerHTML = `
      <span class="log-time" style="color:#5c6bc0;flex-shrink:0;font-size:0.68rem;">${ts}</span>
      <span class="log-label" style="font-size:0.72rem;font-weight:700;flex-shrink:0;">${icons[type]||'·'} ${label}</span>
      <span class="log-msg" style="color:#9fa8da;font-size:0.7rem;flex:1;">${from}→${to} | ${action}${latency > 0 ? ' +'+latency+'ms' : ''}${payload ? ' | ' + payload.substring(0,40) : ''}</span>
    `;
    el.appendChild(row);
    el.scrollTop = el.scrollHeight;
  }

  /* ── STATS DISPLAY ──────────────────────────────────────────── */
  function updateStatsDisplay() {
    const ids = { sent:'statSent', lost:'statLost', retx:'statRetx', latency:'statLatency' };
    const avgL = stats.latencyCount ? Math.round(stats.totalLatency / stats.latencyCount) : 0;
    if (document.getElementById(ids.sent)) document.getElementById(ids.sent).textContent = stats.sent;
    if (document.getElementById(ids.lost)) document.getElementById(ids.lost).textContent = stats.lost;
    if (document.getElementById(ids.retx)) document.getElementById(ids.retx).textContent = stats.retransmitted;
    if (document.getElementById(ids.latency)) document.getElementById(ids.latency).textContent = avgL + 'ms';
  }

  /* ── MOUSE ──────────────────────────────────────────────────── */
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);
    hoverNode = null;
    nodes.forEach(n => {
      const p = nodePos(n);
      if (Math.sqrt((mx-p.x)**2 + (my-p.y)**2) < n.radius + 8) hoverNode = n;
    });
  }

  /* ── SIMULATION REPORT — inline panel below canvas ─────────── */
  function showSimulationReport(title, pathHtml, protocol, security, secColor) {
    /* Find or create the summary box below the canvas wrapper */
    let box = document.getElementById('transferSummaryBox');
    if (!box) {
      /* Try to find the canvas and inject after its parent card */
      const canvas = document.getElementById('transferCanvas') || document.querySelector('canvas');
      if (canvas) {
        /* Walk up to the nearest .card ancestor */
        let cardEl = canvas;
        while (cardEl && !cardEl.classList.contains('card')) cardEl = cardEl.parentElement;
        if (cardEl && cardEl.parentElement) {
          box = document.createElement('div');
          box.id = 'transferSummaryBox';
          /* Insert after the card that contains the canvas */
          cardEl.parentElement.insertBefore(box, cardEl.nextSibling);
        }
      }
      /* Fallback: append to main content */
      if (!box) {
        box = document.createElement('div');
        box.id = 'transferSummaryBox';
        (document.querySelector('.content-body') || document.body).appendChild(box);
      }
    }

    box.style.cssText = 'margin-top:1rem;animation:slideIn 0.4s ease;';
    box.innerHTML = `
      <div style="
        background:#111d35;border:1px solid rgba(255,215,0,0.35);
        border-radius:14px;overflow:hidden;
        box-shadow:0 8px 32px rgba(0,0,0,0.5);
      ">
        <!-- TOP BAR -->
        <div style="height:3px;background:linear-gradient(90deg,#ffd700,#7c4dff,#00e676);"></div>
        <!-- HEADER -->
        <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:rgba(255,215,0,0.04);border-bottom:1px solid #1e2d4f;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(0,230,118,0.15);border:1px solid #00e67655;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">✅</div>
            <div>
              <div style="font-size:1rem;font-weight:800;color:#ffd700;">${title}</div>
              <div style="font-size:0.7rem;color:#5c6bc0;">Packet-switched delivery — NetBankX WAN</div>
            </div>
          </div>
          <button onclick="document.getElementById('transferSummaryBox').style.display='none'"
            style="background:none;border:1px solid #1e2d4f;color:#5c6bc0;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.78rem;">✕ Dismiss</button>
        </div>

        <!-- PATH -->
        <div style="padding:14px 18px;border-bottom:1px solid #0d1529;">
          <div style="font-size:0.62rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">📍 Complete Network Path</div>
          <div style="background:#0a1428;border-radius:8px;padding:12px 16px;border:1px solid #1e2d4f;font-size:0.82rem;line-height:2.1;font-family:'Consolas',monospace;">${pathHtml}</div>
        </div>

        <!-- STATS ROW -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#0d1529;border-bottom:1px solid #0d1529;">
          <div style="padding:12px 18px;background:#111d35;">
            <div style="font-size:0.62rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Transport Protocol</div>
            <div style="font-size:0.86rem;color:#40c4ff;font-weight:700;">${protocol}</div>
          </div>
          <div style="padding:12px 18px;background:#111d35;border-left:1px solid #0d1529;">
            <div style="font-size:0.62rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Security</div>
            <div style="font-size:0.86rem;color:${secColor};font-weight:700;">${security}</div>
          </div>
        </div>
      </div>
    `;

    /* Smooth scroll so user can see it */
    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
  }

  /* ── BROADCAST ──────────────────────────────────────────────── */
  function doBroadcast(type) {
    const isPolicy = type === 'policy';
    const isAlert = type === 'alert';
    const color = isAlert ? COLORS.pktAlert : isPolicy ? COLORS.pktDown : COLORS.pktInfo;
    const label = isAlert ? 'ALRT' : isPolicy ? 'POL' : 'REQ';

    if (mode === 'full') {
      ['MH-HUB','DL-HUB','KA-HUB'].forEach((hub, i) => {
        setTimeout(() => {
          simulatePacket('HQ', hub, { color, label, speed:0.014, type:'broadcast', onArrive: () => {
            const branches = links.filter(l => l.source === hub || l.target === hub)
              .map(l => l.source === hub ? l.target : l.source)
              .filter(id => id !== 'HQ');
            branches.forEach((br, j) => {
              setTimeout(() => simulatePacket(hub, br, { color, label, speed:0.014, type:'broadcast' }), j * 200);
            });
          }});
        }, i * 150);
      });
    } else if (mode === 'branch') {
      addLog('down', 'HQ', 'BR1', label, config.latency, 'broadcast', null);
      simulatePacket('HQ', 'HUB1', { color, label, speed:0.014, type:'broadcast', onArrive: () => {
        simulatePacket('HUB1', 'BR1', { color, label, speed:0.014, type:'broadcast' });
      }});
    }
  }

  /* ── BRANCH REPORT ──────────────────────────────────────────── */
  function doBranchReport() {
    if (mode === 'full') {
      const branches = ['MH-MUM-001-RT','DL-NDL-001-RT','KA-BLR-001-RT'];
      branches.forEach((br, i) => {
        const hub = getHubForBranch(br);
        setTimeout(() => {
          simulatePacket(br, hub, { color: COLORS.pktUp, label:'RPT', speed:0.013, type:'report', onArrive: () => {
            simulatePacket(hub, 'HQ', { color: COLORS.pktUp, label:'RPT', speed:0.013, type:'report' });
          }});
        }, i * 300);
      });
    } else if (mode === 'branch') {
      addLog('up', 'BR1', 'HQ', 'REPORT', config.latency, 'sending', null);
      simulatePacket('BR1', 'HUB1', { color: COLORS.pktUp, label:'RPT', speed:0.013, type:'report', onArrive: () => {
        simulatePacket('HUB1', 'HQ', { color: COLORS.pktUp, label:'RPT', speed:0.013, type:'report', onArrive: () => {
          addLog('success', 'HQ', 'BR1', 'ACK', 5, 'confirmed', null);
          simulatePacket('HQ', 'HUB1', { color: COLORS.pktDown, label:'ACK', speed:0.015, type:'report', onArrive: () => {
            simulatePacket('HUB1', 'BR1', { color: COLORS.pktDown, label:'ACK', speed:0.015 });
          }});
        }});
      }});
    }
  }

  /* ── CUSTOMER TRANSFER (auto demo) ─────────────────────────── */
  function doCustomerTransfer() {
    if (mode === 'transfer') {
      const payload = 'TXN: AUTO DEMO';
      simulatePacket('CUST1', 'BR1', { color:COLORS.pktUp, label:'TXN', speed:0.012, type:'transfer', onArrive:()=>{
        simulatePacket('BR1', 'HUB1', { color:COLORS.pktUp, label:'TXN', speed:0.012, onArrive:()=>{
          simulatePacket('HUB1', 'HQ', { color:COLORS.pktUp, label:'TXN', speed:0.012, onArrive:()=>{
            simulatePacket('HQ', 'HUB2', { color:COLORS.pktDown, label:'CNF', speed:0.012, onArrive:()=>{
              simulatePacket('HUB2', 'BR2', { color:COLORS.pktDown, label:'CNF', speed:0.012, onArrive:()=>{
                simulatePacket('BR2', 'CUST2', { color:COLORS.pktDown, label:'CNF', speed:0.012 });
              }});
            }});
          }});
        }});
      }});
    } else if (mode === 'full') {
      const branches = nodes.filter(n => n.type === 'branch');
      if (branches.length < 2) return;
      const srcBr = branches[Math.floor(Math.random() * (branches.length / 2))];
      const dstBr = branches[Math.floor(branches.length / 2 + Math.random() * (branches.length / 2))];
      const srcHub = getHubForBranch(srcBr.id);
      const dstHub = getHubForBranch(dstBr.id);

      const summaryBox = document.getElementById('hqSummaryBox');
      if (summaryBox) summaryBox.style.display = 'none';

      let hopNum = 0;
      const tlsOn = config.tlsEnabled;

      addLog('up', srcBr.id, srcHub, 'TXN', config.latency, 'initiating transfer', null);
      simulatePacket(srcBr.id, srcHub, { color: COLORS.pktUp, label: 'TXN', speed: 0.012, type: 'transfer', origSrc: srcBr.id, finalDest: dstBr.id, hopNum, onArrive: () => {
        hopNum++;
        addLog('up', srcHub, 'HQ', 'TXN', config.latency, 'forwarding to HQ', null);
        simulatePacket(srcHub, 'HQ', { color: COLORS.pktUp, label: 'TXN', speed: 0.012, type: 'transfer', origSrc: srcBr.id, finalDest: dstBr.id, hopNum, onArrive: () => {
          hopNum++;
          addLog('success', 'HQ', 'HQ', 'LEDGER', config.latency, 'processing transaction', null);
          setTimeout(() => {
            addLog('down', 'HQ', dstHub, 'CNF', config.latency, 'routing confirmation', null);
            simulatePacket('HQ', dstHub, { color: COLORS.pktDown, label: 'CNF', speed: 0.012, type: 'transfer', origSrc: 'HQ', finalDest: dstBr.id, hopNum, onArrive: () => {
              hopNum++;
              addLog('down', dstHub, dstBr.id, 'CNF', config.latency, 'delivering confirmation', null);
              simulatePacket(dstHub, dstBr.id, { color: COLORS.pktDown, label: 'CNF', speed: 0.012, type: 'transfer', origSrc: 'HQ', finalDest: dstBr.id, hopNum, onArrive: () => {
                hopNum++;
                addLog('success', dstBr.id, dstBr.id, 'DELIVERED', 5, 'transfer complete', null);
                if (typeof window.showHQSummary === 'function') {
                  const pth = `🏦 <strong>${srcBr.label}</strong><br>&nbsp;&nbsp;↓ Hop 1<br>🌐 <strong>${srcHub}</strong><br>&nbsp;&nbsp;↓ Hop 2<br>🏛 <strong>HQ Server</strong><br>&nbsp;&nbsp;↓ Hop 3<br>🌐 <strong>${dstHub}</strong><br>&nbsp;&nbsp;↓ Hop 4<br>🏦 <strong>${dstBr.label}</strong>`;
                  
                  const box = document.getElementById('hqSummaryBox');
                  if (box) {
                    box.style.display = 'block';
                    box.style.animation = 'slideIn 0.4s ease';
                    box.innerHTML = `
                      <div style="background:#111d35;border:1px solid rgba(255,215,0,0.3);border-radius:12px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.5);">
                        <div style="height:3px;background:linear-gradient(90deg,#ffd700,#7c4dff,#00e676);"></div>
                        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(255,215,0,0.04);border-bottom:1px solid #1e2d4f;">
                          <div style="display:flex;align-items:center;gap:10px;">
                            <div style="font-size:1.1rem;">✅</div>
                            <div>
                              <div style="font-size:0.95rem;font-weight:800;color:#ffd700;">Customer Transfer Complete</div>
                              <div style="font-size:0.7rem;color:#5c6bc0;">${srcBr.label} → ${dstBr.label} · 4 hops</div>
                            </div>
                          </div>
                          <button onclick="document.getElementById('hqSummaryBox').style.display='none'"
                            style="background:none;border:1px solid #1e2d4f;color:#5c6bc0;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:0.75rem;">✕</button>
                        </div>
                        <div style="padding:12px 16px;">
                          <div style="font-size:0.6rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">📍 Packet Route</div>
                          <div style="background:#0a1428;border-radius:8px;padding:10px 14px;font-family:'Consolas',monospace;font-size:0.8rem;line-height:2.1;">${pth}</div>
                        </div>
                      </div>
                    `;
                    setTimeout(() => box.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
                  }
                }
              }});
            }});
          }, 400);
        }});
      }});
    }
  }

  /* ── ANIMATE TRANSFER (real fund transfer with OSI trace) ─── */
  function animateTransfer(canvasId, opts, logId, cb) {
    if (mode !== 'transfer') { if (cb) cb({}); return; }

    networkLogEl = document.getElementById(logId || 'statusLog');

    /* Update node labels from actual data */
    if (opts.senderName) getNode('CUST1').label = opts.senderName.split(' ')[0] + ' (You)';
    if (opts.senderBranch) {
      getNode('BR1').label = opts.senderBranch.replace('-RT','') + ' Branch';
      getNode('BR1').ip = '10.1.' + Math.floor(Math.random()*254) + '.1';
    }
    if (opts.senderRegion) {
      getNode('HUB1').label = opts.senderRegion + ' Hub';
      getNode('HUB1').ip = '203.0.113.' + (opts.senderRegion==='MH'?1:opts.senderRegion==='DL'?2:3);
    }
    if (opts.receiverRegion) {
      getNode('HUB2').label = (opts.senderRegion===opts.receiverRegion ? '(Same Hub)' : opts.receiverRegion + ' Hub');
      getNode('HUB2').ip = '203.0.113.' + (opts.receiverRegion==='MH'?1:opts.receiverRegion==='DL'?2:3);
    }
    if (opts.receiverBranch) {
      getNode('BR2').label = opts.receiverBranch.replace('-RT','') + ' Branch';
      getNode('BR2').ip = '10.2.' + Math.floor(Math.random()*254) + '.1';
    }
    if (opts.receiverName) getNode('CUST2').label = opts.receiverName.split(' ')[0];

    /* OSI trace container */
    const osiContainer = 'osiTraceList';
    if (window.OSITrace) window.OSITrace.clear(osiContainer);

    /* Hide previous summary so screen is clean for new simulation */
    const prevBox = document.getElementById('transferSummaryBox');
    if (prevBox) prevBox.style.display = 'none';

    const o = { ...opts, tlsEnabled: config.tlsEnabled };

    /* Fire OSI hop card IMMEDIATELY when packet arrives at that node */
    function fireOSIHop(idx) {
      if (window.OSITrace) window.OSITrace.addHop(osiContainer, idx, o, 'transfer');
    }


    /* ── TCP 3-WAY HANDSHAKE ─────────────────────────────────── */
    addLog('info', 'CUST1', 'HQ', 'TCP SYN', 15, 'initiating handshake', null);
    simulatePacket('CUST1', 'BR1', { origSrc:'CUST1', finalDest:'HQ', ttl:64, color:'#78909c', label:'SYN', speed:0.016, type:'syn', onArrive: () => {
      simulatePacket('BR1', 'HUB1', { origSrc:'CUST1', finalDest:'HQ', ttl:63, color:'#78909c', label:'SYN', speed:0.016, type:'syn', onArrive: () => {
        simulatePacket('HUB1', 'HQ', { origSrc:'CUST1', finalDest:'HQ', ttl:62, color:'#78909c', label:'SYN', speed:0.016, type:'syn', onArrive: () => {
          addLog('info', 'HQ', 'CUST1', 'TCP SYN-ACK', 15, 'handshake response', null);
          simulatePacket('HQ', 'HUB1', { origSrc:'HQ', finalDest:'CUST1', ttl:64, color:'#546e7a', label:'SYN-ACK', speed:0.016, type:'syn', onArrive: () => {
            simulatePacket('HUB1', 'BR1', { origSrc:'HQ', finalDest:'CUST1', ttl:63, color:'#546e7a', label:'SYN-ACK', speed:0.016, type:'syn', onArrive: () => {
              simulatePacket('BR1', 'CUST1', { origSrc:'HQ', finalDest:'CUST1', ttl:62, color:'#546e7a', label:'SYN-ACK', speed:0.016, type:'syn', onArrive: () => {
                addLog('success', 'CUST1', 'HQ', 'TCP ESTABLISHED', 5, 'connection ready', null);
                setTimeout(doActualTransfer, 300);
              }});
            }});
          }});
        }});
      }});
    }});

    /* ── ACTUAL DATA TRANSFER ────────────────────────────────── */
    function doActualTransfer() {
      const payloadText = config.tlsEnabled
        ? 'AES-256-GCM[ENCRYPTED]'
        : `TXN:${opts.amount}INR→${opts.toAccount}`;
      const payload = `TXN: ₹${opts.amount} → ${opts.toAccount}`;

      /* HOP 0 — CUST1 */
      addLog('up', 'CUST1', 'BR1', 'TXN', 12, 'sending', payload);
      fireOSIHop(0);

      simulatePacket('CUST1', 'BR1', { origSrc:'CUST1', finalDest:'HQ', ttl:64, color:COLORS.pktUp, label:'TXN', speed:0.013, type:'transfer', onArrive: () => {
        /* HOP 1 — BR1 */
        addLog('up', 'BR1', 'HUB1', 'TXN', 15, 'forwarding', payload);
        fireOSIHop(1);

        simulatePacket('BR1', 'HUB1', { origSrc:'CUST1', finalDest:'HQ', ttl:63, color:COLORS.pktUp, label:'TXN', speed:0.013, type:'transfer', onArrive: () => {
          /* HOP 2 — HUB1 */
          addLog('up', 'HUB1', 'HQ', 'TXN+NAT', 15, 'nat→public', payload);
          fireOSIHop(2);

          simulatePacket('HUB1', 'HQ', { origSrc:'CUST1', finalDest:'HQ', ttl:62, color:COLORS.pktUp, label:'TXN', speed:0.013, type:'transfer', onArrive: () => {
            /* HOP 3 — HQ */
            addLog('success', 'HQ', 'HUB2', 'LEDGER', 8, 'writing+routing', payload);
            fireOSIHop(3);

            setTimeout(() => {
              const cnfPayload = 'CONFIRM: TXN_SUCCESS';

              simulatePacket('HQ', 'HUB2', { origSrc:'HQ', finalDest:'CUST2', ttl:64, color:COLORS.pktDown, label:'CNF', speed:0.013, type:'transfer', onArrive: () => {
                /* HOP 4 — HUB2 */
                addLog('down', 'HUB2', 'BR2', 'CNF', 15, 'routing', cnfPayload);
                fireOSIHop(4);

                simulatePacket('HUB2', 'BR2', { origSrc:'HQ', finalDest:'CUST2', ttl:63, color:COLORS.pktDown, label:'CNF', speed:0.013, type:'transfer', onArrive: () => {
                  /* HOP 5 — BR2 */
                  addLog('down', 'BR2', 'CUST2', 'CNF', 22, 'last-mile', cnfPayload);
                  fireOSIHop(5);

                  simulatePacket('BR2', 'CUST2', { origSrc:'HQ', finalDest:'CUST2', ttl:62, color:COLORS.pktDown, label:'CNF', speed:0.013, type:'transfer', onArrive: () => {
                    /* HOP 6 — CUST2 */
                    addLog('success', 'CUST2', '', 'DELIVERED', 5, 'funds credited', cnfPayload);
                    fireOSIHop(6);

                    const txnId = 'TXN-' + Math.floor(Math.random() * 1e9);
                    /* Fire callback immediately so balance updates + form re-enables */
                    if (cb) cb({ txnId });

                    /* Show path summary + OSI summary after a brief pause */
                    setTimeout(() => {
                      const n1 = getNode('CUST1'), n2 = getNode('BR1'), n3 = getNode('HUB1'),
                            n4 = getNode('HQ'),    n5 = getNode('HUB2'), n6 = getNode('BR2'), n7 = getNode('CUST2');

                      const pth =
                        `💻 <strong>${n1.label}</strong> <span style="color:#5c6bc0;">(${n1.ip})</span><br>&nbsp;&nbsp;↓ Hop 1 · WiFi → Branch LAN<br>` +
                        `🏦 <strong>${n2.label}</strong> <span style="color:#5c6bc0;">(${n2.ip})</span><br>&nbsp;&nbsp;↓ Hop 2 · NAT: Private → Public IP<br>` +
                        `🌐 <strong>${n3.label}</strong> <span style="color:#5c6bc0;">(${n3.ip})</span><br>&nbsp;&nbsp;↓ Hop 3 · Fiber Backbone (WAN)<br>` +
                        `🏛 <strong>${n4.label}</strong> <span style="color:#5c6bc0;">(${n4.ip})</span><br>&nbsp;&nbsp;↓ Hop 4 · Ledger Write + Route Decision<br>` +
                        `🌐 <strong>${n5.label}</strong> <span style="color:#5c6bc0;">(${n5.ip})</span><br>&nbsp;&nbsp;↓ Hop 5 · Route into Receiver's LAN<br>` +
                        `🏦 <strong>${n6.label}</strong> <span style="color:#5c6bc0;">(${n6.ip})</span><br>&nbsp;&nbsp;↓ Hop 6 · Last-mile Delivery<br>` +
                        `📱 <strong>${n7.label}</strong> <span style="color:#5c6bc0;">(${n7.ip})</span>`;

                      const secStr = config.tlsEnabled ? '🔒 TLS 1.3 — AES-256-GCM · ECDHE Forward Secrecy' : '⚠️ Plaintext — Vulnerable to MITM Sniffing';
                      const pcolor = config.tlsEnabled ? '#00e676' : '#ff5252';
                      showSimulationReport('✅ Transfer Delivered — ' + txnId, pth, 'TCP · 3-Way Handshake · PSH+ACK', secStr, pcolor);

                      /* Append OSI summary after the path box is visible */
                      if (window.OSITrace) window.OSITrace.showSummary(osiContainer, o, 'transfer');
                    }, 1500);

                  }});
                }});
              }});
            }, 500);
          }});
        }});
      }});
    }
  }

  /* ── BRANCH-TO-BRANCH SECURE SYNC (with OSI trace) ─────────── */
  function sendBranchToBranch(destBranchId) {
    if (mode !== 'branch') return;

    const srcBranch = (options.branchId || 'MH-MUM-001').replace('-RT','');
    const destBranch = destBranchId;
    const osiContainer = 'branchOsiTraceList';
    const o = { srcBranch, destBranch, tlsEnabled: config.tlsEnabled };

    if (window.OSITrace) window.OSITrace.clear(osiContainer);

    const destHubId = getHubForBranch(destBranchId.replace('-RT','') + '-RT');
    /* Update destination node labels */
    const hub2 = getNode('HUB2'), br2 = getNode('BR2');
    if (hub2) { hub2.label = destHubId; hub2.ip = '203.0.113.' + (destHubId.includes('DL')?2:destHubId.includes('KA')?3:1); }
    if (br2)  { br2.label = destBranch; br2.ip = '10.2.1.1'; }

    let hopIdx = 0;
    function fireOSIHop(idx) {
      if (window.OSITrace) setTimeout(() => window.OSITrace.addHop(osiContainer, idx, o, 'branch'), 200);
    }

    addLog('up', 'BR1', 'HQ', 'SYNC-REQ', config.latency, 'initiating secure sync', null);

    /* TCP SYN */
    simulatePacket('BR1', 'HUB1', { color:'#78909c', label:'SYN', speed:0.016, type:'syn', onArrive:() => {
      simulatePacket('HUB1', 'HQ', { color:'#78909c', label:'SYN', speed:0.016, type:'syn', onArrive:() => {
        simulatePacket('HQ', 'HUB1', { color:'#546e7a', label:'SYN-ACK', speed:0.016, type:'syn', onArrive:() => {
          simulatePacket('HUB1', 'BR1', { color:'#546e7a', label:'SYN-ACK', speed:0.016, type:'syn', onArrive:() => {
            addLog('success','BR1','HQ','TCP ESTABLISHED',5,'handshake complete',null);
            setTimeout(doSync, 300);
          }});
        }});
      }});
    }});

    function doSync() {
      /* HOP 0 — source branch */
      fireOSIHop(0);
      simulatePacket('BR1','HUB1',{color:COLORS.pktInfo,label:'SYNC',speed:0.013,type:'transfer',onArrive:()=>{
        /* HOP 1 — source hub */
        addLog('up','HUB1','HQ','SYNC+NAT',15,'nat applied',null);
        fireOSIHop(1);
        simulatePacket('HUB1','HQ',{color:COLORS.pktInfo,label:'SYNC',speed:0.013,type:'transfer',onArrive:()=>{
          /* HOP 2 — HQ */
          addLog('success','HQ','HUB2','ROUTE',8,'authenticated+routing',null);
          fireOSIHop(2);
          setTimeout(()=>{
            simulatePacket('HQ','HUB2',{color:COLORS.pktDown,label:'SYN-D',speed:0.013,type:'transfer',onArrive:()=>{
              /* HOP 3 — dest hub */
              addLog('down','HUB2','BR2','SYNC-D',15,'routing',null);
              fireOSIHop(3);
              simulatePacket('HUB2','BR2',{color:COLORS.pktDown,label:'SYN-D',speed:0.013,type:'transfer',onArrive:()=>{
                /* HOP 4 — dest branch */
                addLog('success','BR2','','SYNCED',5,'data applied',null);
                fireOSIHop(4);

                /* Show simulation report */
                setTimeout(()=>{
                  const br1n = getNode('BR1'), hub1n = getNode('HUB1'), hqn = getNode('HQ'), hub2n = getNode('HUB2'), br2n = getNode('BR2');
                  const pth = `🏦 ${br1n.label} (${br1n.ip})<br>&nbsp;&nbsp;↓ <i>(NAT)</i><br>🌐 ${hub1n.label} (${hub1n.ip})<br>&nbsp;&nbsp;↓<br>🏛 ${hqn.label} (${hqn.ip})<br>&nbsp;&nbsp;↓<br>🌐 ${hub2n.label} (${hub2n.ip})<br>&nbsp;&nbsp;↓<br>🏦 ${br2n.label} (${br2n.ip})`;
                  const secStr = config.tlsEnabled ? '🔒 TLS 1.3 mTLS — AES-256-GCM (Secure)' : '⚠️ Plaintext — Not Secure';
                  const pcolor = config.tlsEnabled ? '#00e676' : '#ff5252';
                  showSimulationReport('✅ Branch-to-Branch Sync Complete', pth, 'TCP / mTLS 1.3', secStr, pcolor);
                  if (window.OSITrace) setTimeout(()=>window.OSITrace.showSummary(osiContainer, o, 'branch'), 400);
                }, 1200);
              }});
            }});
          }, 500);
        }});
      }});
    }
  }

  /* ── AUTO PACKET FIRE ───────────────────────────────────────── */
  function fireRandomPacket() {
    const leafLinks = links.filter(l => l.status === 'normal');
    if (leafLinks.length === 0) return;
    const l = leafLinks[Math.floor(Math.random() * leafLinks.length)];
    const isDown = Math.random() > 0.5;
    simulatePacket(isDown ? l.source : l.target, isDown ? l.target : l.source, {
      color: Math.random() > 0.5 ? COLORS.pktDown : COLORS.pktInfo,
      label: ['DATA','ACK','HB','RPT'][Math.floor(Math.random()*4)],
      speed: 0.01 + Math.random() * 0.01,
    });
  }

  /* ── ROGUE / DDOS / TRACEROUTE (HQ page) ───────────────────── */
  function doRogueTraffic() {
    const color = COLORS.pktAlert;
    const label = 'SQL!';
    ['MH-HUB','DL-HUB','KA-HUB'].forEach((hub, i) => {
      setTimeout(() => {
        if (config.firewall) {
          addLog('alert', hub, 'HQ', 'BLOCKED', 0, 'firewall dropped SQL injection', null);
          simulatePacket(hub, 'HQ', { color: COLORS.pktAlert, label:'DROP', speed:0.02, type:'rogue',
            onArrive: () => addLog('success','HQ','',  'FW-DROP',0,'ACL rule matched',null)
          });
        } else {
          addLog('alert', hub, 'HQ', 'INTRUSION', 0, 'SQL injection reaching HQ!', null);
          simulatePacket(hub, 'HQ', { color, label, speed:0.02, type:'rogue' });
        }
      }, i * 200);
    });
  }

  function doDDoS() {
    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        const hubs = ['MH-HUB','DL-HUB','KA-HUB'];
        const hub = hubs[Math.floor(Math.random()*3)];
        if (config.rateLimit && Math.random() < 0.85) {
          addLog('alert', hub, 'HQ', 'RATE-LIMIT', 0, 'UDP flood dropped', null);
          return;
        }
        simulatePacket(hub, 'HQ', { color: COLORS.pktAlert, label:'UDP', speed:0.025, type:'ddos' });
      }, i * 80);
    }
  }

  function doTraceroute() {
    const hops = ['MH-HUB','DL-HUB','KA-HUB'];
    hops.forEach((hub, i) => {
      setTimeout(() => {
        simulatePacket('HQ', hub, { color:COLORS.pktInfo, label:'PING', speed:0.02, type:'ping',
          onArrive: () => {
            const latency = 5 + i * 3;
            addLog('info', hub, 'HQ', 'PONG', latency, `traceroute hop ${i+1}`, `${latency}ms`);
            simulatePacket(hub, 'HQ', { color:COLORS.pktInfo, label:'PONG', speed:0.02 });
          }
        });
      }, i * 600);
    });
  }

  function sendTargeted(targetBranch) {
    const hub = getHubForBranch(targetBranch);
    const hubNode = nodes.find(n => n.id === hub);
    if (!hubNode) return;
    addLog('down', 'HQ', targetBranch, 'TGT', config.latency, 'targeted send', null);
    simulatePacket('HQ', hub, { color:COLORS.pktDown, label:'TGT', speed:0.013, type:'data',
      onArrive: () => simulatePacket(hub, targetBranch, { color:COLORS.pktDown, label:'TGT', speed:0.013 })
    });
  }

  /* ── INIT ───────────────────────────────────────────────────── */
  function init(canvasId, viewMode, opts = {}) {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    if (autoPacketTimer) clearTimeout(autoPacketTimer);
    packets = [];
    stats = { sent:0, lost:0, retransmitted:0, totalLatency:0, latencyCount:0 };

    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    mode = viewMode || 'full';
    options = opts;
    networkLogEl = document.getElementById('networkLog') || document.getElementById('statusLog');

    /* Packet Inspector overlay */
    const wrapper = canvas.parentElement;
    if (wrapper) {
      wrapper.style.position = 'relative';
      let pi = wrapper.querySelector('.packet-inspector');
      if (!pi) {
        pi = document.createElement('div');
        pi.className = 'packet-inspector';
        wrapper.appendChild(pi);
      }
      packetInspectorEl = pi;
    }

    function resize() {
      /* Use canvas offsetWidth/Height if parent rect is 0 (layout not yet complete) */
      const parent = canvas.parentElement;
      const rect   = parent ? parent.getBoundingClientRect() : { width: 0, height: 0 };
      const w = Math.floor(rect.width)  || canvas.offsetWidth  || 800;
      const h = Math.floor(rect.height) || canvas.offsetHeight || 450;
      if (w > 0) canvas.width  = w;
      if (h > 0) canvas.height = h;
      setupTopology();
      updateStatsDisplay();
    }

    /* Defer first resize so the browser has finished layout */
    requestAnimationFrame(() => {
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(canvas.parentElement || canvas);
    });

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => { hoverNode = null; });

    animate();

    setInterval(() => {
      const el = document.getElementById('activePackets');
      if (el) el.textContent = `${packets.length} active`;
    }, 1000);
  }

  /* ── PUBLIC API ─────────────────────────────────────────────── */
  return {
    init,
    animateTransfer,
    simulatePacket,
    doBroadcast,
    doCustomerTransfer,
    doBranchReport,
    sendBranchToBranch,
    doRogueTraffic,
    doDDoS,
    doTraceroute,
    sendTargeted,
    setSpeed:      v => { config.speed = v; },
    setTLS:        b => { config.tlsEnabled = b; },
    setFirewall:   b => { config.firewall = b; },
    setRateLimit:  b => { config.rateLimit = b; },
    setLatency:    ms => { config.latency = ms; },
    setPacketLoss: p => { config.packetLoss = p; },
    breakLink: () => {
      const active = links.filter(l => l.status === 'normal');
      if (active.length > 0) active[Math.floor(Math.random() * active.length)].status = 'broken';
    },
    resetNetwork: () => {
      links.forEach(l => l.status = 'normal');
      packets = [];
      Object.assign(stats, { sent:0, lost:0, retransmitted:0, totalLatency:0, latencyCount:0 });
      updateStatsDisplay();
    },
    getNodes: () => nodes.map(n => ({ id:n.id, type:n.type, label:n.label })),
    getStats: () => ({ ...stats }),
    fireRandom: fireRandomPacket,
    getTLSEnabled: () => config.tlsEnabled,
  };

})();

window.NetworkSim = NetworkSim;

} /* end guard */
