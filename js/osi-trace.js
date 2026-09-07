/**
 * osi-trace.js — Real-time OSI Layer-by-Layer Data Flow Visualizer
 * NetBankX | Computer Networks Project
 *
 * Renders hop-by-hop, layer-by-layer breakdown for fund transfers
 * and branch-to-branch simulations.
 */
window.OSITrace = (function () {

  /* ── LAYER DEFINITIONS ─────────────────────────────────────── */
  const LAYERS = [
    { num: 7, name: 'Application',   short: 'L7', color: '#7c4dff', bg: 'rgba(124,77,255,0.1)',  icon: '💻' },
    { num: 6, name: 'Presentation',  short: 'L6', color: '#536dfe', bg: 'rgba(83,109,254,0.1)',  icon: '🔐' },
    { num: 5, name: 'Session',       short: 'L5', color: '#1e88e5', bg: 'rgba(30,136,229,0.1)',  icon: '🤝' },
    { num: 4, name: 'Transport',     short: 'L4', color: '#00acc1', bg: 'rgba(0,172,193,0.1)',   icon: '📦' },
    { num: 3, name: 'Network',       short: 'L3', color: '#43a047', bg: 'rgba(67,160,71,0.1)',   icon: '🌐' },
    { num: 2, name: 'Data Link',     short: 'L2', color: '#fb8c00', bg: 'rgba(251,140,0,0.1)',   icon: '🔗' },
    { num: 1, name: 'Physical',      short: 'L1', color: '#e53935', bg: 'rgba(229,57,53,0.1)',   icon: '⚡' },
  ];

  /* ── MAC GENERATOR (matches network-sim) ────────────────────── */
  function getMac(id) {
    if (!id) return '00:00:00:00:00:00';
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash) + id.charCodeAt(i);
    let hex = Math.abs(hash).toString(16).padStart(6, '0');
    return `00:1A:2B:${hex.substring(0,2)}:${hex.substring(2,4)}:${hex.substring(4,6)}`.toUpperCase();
  }

  /* ── DATA GENERATORS PER HOP ────────────────────────────────── */
  function buildHopData(hopIndex, opts, mode) {
    const {
      senderName = 'Customer A', receiverName = 'Customer B',
      senderBranch = 'MH-MUM-001', senderRegion = 'MH',
      receiverBranch = 'KA-BLR-001', receiverRegion = 'KA',
      amount = 0, toAccount = 'ACC-XXXXX', fromAccount = 'ACC-XXXXX',
      srcBranch, destBranch,        // branch mode
      tlsEnabled = true,
    } = opts;

    const isBranch = (mode === 'branch');

    /* IPs */
    const ips = isBranch ? {
      CUST1: '10.1.0.1',
      BR1:   '10.1.1.1',
      HUB1:  '203.0.113.' + (srcBranch && srcBranch.startsWith('MH') ? 1 : srcBranch && srcBranch.startsWith('DL') ? 2 : 3),
      HQ:    '12.0.0.1',
      HUB2:  '203.0.113.' + (destBranch && destBranch.startsWith('MH') ? 1 : destBranch && destBranch.startsWith('DL') ? 2 : 3),
      BR2:   '10.2.1.1',
    } : {
      CUST1: '192.168.1.45',
      BR1:   '10.1.1.1',
      HUB1:  '203.0.113.' + (senderRegion === 'MH' ? 1 : senderRegion === 'DL' ? 2 : 3),
      HQ:    '12.0.0.1',
      HUB2:  '203.0.113.' + (receiverRegion === 'MH' ? 1 : receiverRegion === 'DL' ? 2 : 3),
      BR2:   '10.2.1.1',
      CUST2: '192.168.2.88',
    };

    /* MACs */
    const macs = {};
    ['CUST1','BR1','HUB1','HQ','HUB2','BR2','CUST2'].forEach(id => { macs[id] = getMac(id + (opts.fromAccount||'')); });

    const encPayload = tlsEnabled
      ? 'AES-256-GCM: ' + btoa(JSON.stringify({to: toAccount, amt: amount})).substring(0, 28) + '...'
      : `{"to":"${toAccount}","amount":${amount}}`;

    const branchSyncPayload = tlsEnabled
      ? 'AES-256-GCM: ' + btoa(JSON.stringify({sync: srcBranch, dest: destBranch})).substring(0, 28) + '...'
      : `{"sync":"${srcBranch}","dest":"${destBranch}","type":"SECURE_SYNC"}`;

    const payload = isBranch ? branchSyncPayload : encPayload;
    const appLayer = isBranch
      ? { method: 'SYNC POST /api/branch/secure-sync', data: `{"srcBranch":"${srcBranch}","destBranch":"${destBranch}","type":"DATA_SYNC"}` }
      : { method: 'HTTP POST /api/transfer/initiate', data: `{"from":"${fromAccount}","to":"${toAccount}","amount":${amount},"currency":"INR"}` };

    const ttlBase = 64;

    /* HOP DEFINITIONS */
    const hops = isBranch ? [
      {
        nodeId: 'BR1', label: srcBranch || 'Source Branch',
        icon: '🏦', type: 'source', ip: ips.BR1,
        role: 'Source Branch Router — Data originates here',
        layersActive: [7,6,5,4,3,2,1],
        direction: 'encapsulate',
      },
      {
        nodeId: 'HUB1', label: 'Source Regional Hub',
        icon: '🌐', type: 'router', ip: ips.HUB1,
        role: 'Regional Hub — NAT translation to Public IP',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'HQ', label: 'HQ Core Server',
        icon: '🏛', type: 'hq', ip: ips.HQ,
        role: 'HQ Server — Authentication, Authorization, Routing',
        layersActive: [1,2,3,4,5,6,7],
        direction: 'process',
      },
      {
        nodeId: 'HUB2', label: 'Dest Regional Hub',
        icon: '🌐', type: 'router', ip: ips.HUB2,
        role: 'Destination Regional Hub — Route to branch LAN',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'BR2', label: destBranch || 'Destination Branch',
        icon: '🏦', type: 'destination', ip: ips.BR2,
        role: 'Destination Branch Router — Delivery, Decapsulation',
        layersActive: [1,2,3,4,5,6,7],
        direction: 'decapsulate',
      },
    ] : [
      {
        nodeId: 'CUST1', label: senderName + ' (Device)',
        icon: '💻', type: 'source', ip: ips.CUST1,
        role: 'Customer Device — Generates the transaction request',
        layersActive: [7,6,5,4,3,2,1],
        direction: 'encapsulate',
      },
      {
        nodeId: 'BR1', label: senderBranch + ' Branch',
        icon: '🏦', type: 'router', ip: ips.BR1,
        role: 'Source Branch Router — Forwards frame to regional hub',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'HUB1', label: senderRegion + ' Regional Hub',
        icon: '🌐', type: 'router', ip: ips.HUB1,
        role: 'Regional Hub — NAT: Private → Public IP translation',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'HQ', label: 'HQ Core Server',
        icon: '🏛', type: 'hq', ip: ips.HQ,
        role: 'HQ Server — TLS Termination, Ledger Write, Routing',
        layersActive: [1,2,3,4,5,6,7],
        direction: 'process',
      },
      {
        nodeId: 'HUB2', label: receiverRegion + ' Regional Hub',
        icon: '🌐', type: 'router', ip: ips.HUB2,
        role: 'Destination Regional Hub — Route into receiver LAN',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'BR2', label: receiverBranch + ' Branch',
        icon: '🏦', type: 'router', ip: ips.BR2,
        role: 'Destination Branch Router — Last-mile delivery',
        layersActive: [1,2,3],
        direction: 'forward',
      },
      {
        nodeId: 'CUST2', label: receiverName + ' (Device)',
        icon: '📱', type: 'destination', ip: ips.CUST2,
        role: 'Recipient Device — Receives confirmation, Credits funds',
        layersActive: [1,2,3,4,5,6,7],
        direction: 'decapsulate',
      },
    ];

    const hop = hops[hopIndex];
    if (!hop) return null;

    const ttl = ttlBase - hopIndex;
    const srcMac = Object.values(macs)[Math.max(0, hopIndex - 1)];
    const dstMac = Object.values(macs)[hopIndex];
    const prevMac = Object.values(macs)[hopIndex];
    const nextMac = Object.values(macs)[Math.min(hopIndex + 1, 6)];

    /* Build per-layer data */
    const layerData = {
      7: {
        title: 'Application Layer',
        fields: [
          ['Protocol', 'HTTPS / REST API'],
          ['Method', appLayer.method],
          ['Payload', hop.type === 'destination' ? (isBranch ? '{"status":"SYNC_OK","ts":"'+Date.now()+'"}' : '{"status":"SUCCESS","txnId":"TXN-'+Math.floor(Math.random()*1e9)+'"}') : appLayer.data],
          ['Host', 'netbankx-hq.internal'],
          ['User-Agent', 'NetBankX-Client/3.2.1'],
        ]
      },
      6: {
        title: 'Presentation Layer',
        fields: [
          ['Encryption', tlsEnabled ? 'TLS 1.3 (AES-256-GCM)' : '⚠ NONE (Plaintext)'],
          ['Cipher Suite', tlsEnabled ? 'TLS_AES_256_GCM_SHA384' : 'N/A'],
          ['Certificate', tlsEnabled ? 'netbankx.com — Valid ✓' : 'None'],
          ['Encoded Data', payload],
          ['Compression', 'gzip (ratio: 0.72)'],
        ]
      },
      5: {
        title: 'Session Layer',
        fields: [
          ['Session ID', 'SID-' + Math.abs(getMac('session').replace(/:/g,'').substring(0,8))],
          ['State', hop.type === 'source' ? 'SYN → SYN-ACK → ESTABLISHED' : hop.type === 'destination' ? 'FIN → ACK → CLOSED' : 'ESTABLISHED'],
          ['Auth Token', 'Bearer eyJhbGciOiJIUzI1NiJ9.' + btoa(fromAccount||'').substring(0,12) + '...'],
          ['Keep-Alive', '60s / max=100'],
          ['Protocol', 'TLS Handshake Complete'],
        ]
      },
      4: {
        title: 'Transport Layer',
        fields: [
          ['Protocol', 'TCP (Reliable Delivery)'],
          ['Src Port', String(32768 + hopIndex * 100)],
          ['Dst Port', '443 (HTTPS)'],
          ['Seq Number', String(1000 + hopIndex * 512)],
          ['Ack Number', String(1001 + hopIndex * 512)],
          ['Flags', hop.type === 'source' ? 'SYN, ACK' : hop.type === 'destination' ? 'FIN, ACK' : 'PSH, ACK'],
          ['Window Size', '65535 bytes'],
          ['Checksum', '0x' + Math.abs(hopIndex * 12345).toString(16).toUpperCase().padStart(4,'0')],
        ]
      },
      3: {
        title: 'Network Layer',
        fields: [
          ['Protocol', 'IPv4'],
          ['Src IP', hopIndex === 0 ? ips.CUST1 : (hopIndex === 1 && !isBranch ? ips.BR1 : hopIndex <= 2 ? (isBranch ? ips.BR1 : ips.HUB1) : ips.HQ)],
          ['Dst IP', hopIndex < (isBranch ? 2 : 3) ? ips.HQ : (isBranch ? ips.BR2 : ips.CUST2)],
          ['TTL', String(ttl) + ' (decremented at each router)'],
          ['Protocol #', '6 (TCP)'],
          ['NAT', (hopIndex === (isBranch ? 0 : 1)) ? '🔄 Private→Public: ' + (isBranch ? ips.BR1 : ips.BR1) + ' → ' + (isBranch ? ips.HUB1 : ips.HUB1) : 'Not applied'],
          ['DSCP', 'EF (Expedited Forwarding / QoS)'],
        ]
      },
      2: {
        title: 'Data Link Layer',
        fields: [
          ['Protocol', 'Ethernet II (802.3)'],
          ['Src MAC', srcMac + ' ⟵ This interface'],
          ['Dst MAC', dstMac + ' (Next-hop)'],
          ['EtherType', '0x0800 (IPv4)'],
          ['Frame Size', String(1500 - hopIndex * 12) + ' bytes'],
          ['MAC Rewrite', hopIndex > 0 ? '✅ Rewritten at router (L2 is hop-local)' : '🔵 Original frame'],
          ['CRC/FCS', '0x' + Math.abs(hopIndex * 99887).toString(16).toUpperCase().padStart(8,'0')],
        ]
      },
      1: {
        title: 'Physical Layer',
        fields: [
          ['Medium', hopIndex === 0 ? 'Wi-Fi 6 (802.11ax)' : hopIndex <= 2 ? 'Fiber Optic (Single-mode)' : 'OFC Backbone (100 Gbps)'],
          ['Bit Rate', hopIndex === 0 ? '574 Mbps' : hopIndex <= 2 ? '1 Gbps' : '100 Gbps'],
          ['Encoding', hopIndex === 0 ? 'OFDM (Orthogonal FDM)' : '8B/10B NRZ'],
          ['Signal', hopIndex === 0 ? '2.4/5 GHz RF' : '1310 nm Laser (Infrared)'],
          ['Latency', String(5 + hopIndex * 8) + ' ms (propagation)'],
          ['Error Rate', '10⁻¹² BER (Bit Error Rate)'],
          ['Bits', '01001000 01010100 01010100 01010000...'],
        ]
      },
    };

    return { ...hop, layerData, ttl, srcMac, dstMac, hopIndex };
  }

  /* ── RENDER ONE HOP CARD ────────────────────────────────────── */
  function renderHopCard(containerId, hopIndex, hopData, animate) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const hop = hopData;
    const isSource = hop.type === 'source';
    const isDest = hop.type === 'destination';
    const isHQ = hop.type === 'hq';
    const isForward = hop.type === 'router';

    const hopTypeColor = isSource ? '#00e676' : isDest ? '#ffd700' : isHQ ? '#7c4dff' : '#40c4ff';
    const hopTypeBg = isSource ? 'rgba(0,230,118,0.08)' : isDest ? 'rgba(255,215,0,0.08)' : isHQ ? 'rgba(124,77,255,0.08)' : 'rgba(64,196,255,0.08)';
    const directionLabel = isSource ? '▼ ENCAPSULATING' : isDest ? '▲ DECAPSULATING' : isHQ ? '⟳ PROCESSING' : '→ FORWARDING';

    /* Active layers */
    const activeSet = new Set(hop.layersActive);
    const layerBadges = LAYERS.map(l => {
      const active = activeSet.has(l.num);
      return `<span style="
        display:inline-flex;align-items:center;gap:3px;
        padding:2px 8px;border-radius:12px;font-size:0.65rem;font-weight:700;
        background:${active ? l.bg : 'rgba(255,255,255,0.03)'};
        color:${active ? l.color : '#333'};
        border:1px solid ${active ? l.color + '55' : '#1e2d4f'};
        transition:all 0.3s;
      ">${l.icon} L${l.num}</span>`;
    }).join('');

    /* Layer panels */
    const layerPanels = LAYERS
      .filter(l => activeSet.has(l.num))
      .map((l, idx) => {
        const fields = (hop.layerData[l.num] || {}).fields || [];
        const rows = fields.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
            <span style="color:#5c6bc0;font-size:0.68rem;flex-shrink:0;width:110px;">${k}</span>
            <span style="color:#e8eaf6;font-size:0.68rem;font-family:'Consolas',monospace;text-align:right;word-break:break-all;flex:1;">${v}</span>
          </div>`).join('');
        return `
          <div class="osi-layer-panel" style="
            background:${l.bg};border:1px solid ${l.color}44;
            border-radius:6px;padding:8px 10px;margin-bottom:6px;
            animation: osiLayerIn 0.35s ease ${idx * 0.08}s both;
          ">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="font-size:0.7rem;font-weight:800;color:${l.color};letter-spacing:1px;">${l.icon} ${l.short} — ${l.name.toUpperCase()}</span>
            </div>
            ${rows}
          </div>`;
      }).join('');

    const card = document.createElement('div');
    card.className = 'osi-hop-card';
    card.id = `osi-hop-${hopIndex}`;
    card.style.cssText = `
      background:#111d35;border:1px solid #1e2d4f;border-radius:10px;
      margin-bottom:12px;overflow:hidden;
      ${animate ? 'animation:osiHopIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;' : ''}
      border-left:3px solid ${hopTypeColor};
    `;

    card.innerHTML = `
      <!-- HOP HEADER -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:10px 14px;background:${hopTypeBg};
        border-bottom:1px solid #1e2d4f;cursor:pointer;
      " onclick="this.parentElement.querySelector('.osi-hop-body').style.display = this.parentElement.querySelector('.osi-hop-body').style.display === 'none' ? 'block' : 'none'; this.querySelector('.osi-chevron').textContent = this.parentElement.querySelector('.osi-hop-body').style.display === 'none' ? '▶' : '▼';">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="
            width:28px;height:28px;border-radius:50%;
            background:${hopTypeColor}22;border:1px solid ${hopTypeColor}66;
            display:flex;align-items:center;justify-content:center;
            font-size:0.65rem;font-weight:800;color:${hopTypeColor};flex-shrink:0;
          ">HOP<br><span style="font-size:0.6rem;">${hopIndex + 1}</span></div>
          <div>
            <div style="font-size:0.85rem;font-weight:700;color:#e8eaf6;">${hop.icon} ${hop.label}</div>
            <div style="font-size:0.68rem;color:#5c6bc0;">${hop.role}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:0.62rem;font-weight:700;color:${hopTypeColor};letter-spacing:1px;">${directionLabel}</span>
          <span style="font-family:monospace;font-size:0.68rem;color:#9fa8da;background:#0d1529;padding:2px 6px;border-radius:4px;">${hop.ip}</span>
          <span class="osi-chevron" style="color:#5c6bc0;font-size:0.75rem;">▼</span>
        </div>
      </div>

      <!-- LAYER BADGES ROW -->
      <div style="padding:8px 14px;display:flex;flex-wrap:wrap;gap:4px;border-bottom:1px solid #0d1529;">
        ${layerBadges}
      </div>

      <!-- HOP BODY (collapsible) -->
      <div class="osi-hop-body" style="padding:10px 14px;">
        ${layerPanels}

        <!-- TTL & MAC INFO -->
        <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
          <div style="flex:1;background:#0d1529;border-radius:6px;padding:6px 10px;border:1px solid #1e2d4f;">
            <div style="font-size:0.62rem;color:#5c6bc0;margin-bottom:2px;">TTL at this hop</div>
            <div style="font-size:0.78rem;font-family:monospace;color:#ffd700;">${hop.ttl} <span style="color:#5c6bc0;">hops remaining</span></div>
          </div>
          <div style="flex:2;background:#0d1529;border-radius:6px;padding:6px 10px;border:1px solid #1e2d4f;">
            <div style="font-size:0.62rem;color:#5c6bc0;margin-bottom:2px;">Frame MAC Addresses (L2 — rewritten per hop)</div>
            <div style="font-size:0.68rem;font-family:monospace;">
              <span style="color:#fb8c00;">SRC:</span> <span style="color:#ffab40;">${hop.srcMac}</span> &nbsp;→&nbsp;
              <span style="color:#fb8c00;">DST:</span> <span style="color:#ffab40;">${hop.dstMac}</span>
            </div>
          </div>
        </div>
      </div>
    `;

    container.appendChild(card);
  }

  /* ── FINAL SUMMARY CARD ─────────────────────────────────────── */
  function renderSummary(containerId, opts, mode) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isBranch = mode === 'branch';
    const tlsEnabled = opts.tlsEnabled !== false;

    const hopCount = isBranch ? 5 : 7;
    const totalLatency = (10 + hopCount * 8) + 'ms (simulated RTT: ~' + (20 + hopCount * 16) + 'ms)';
    const security = tlsEnabled
      ? '🔒 TLS 1.3 Encrypted — AES-256-GCM — PFS via ECDHE'
      : '⚠️ PLAINTEXT — Vulnerable to MITM/Sniffing';
    const secColor = tlsEnabled ? '#00e676' : '#ff5252';

    const path = isBranch
      ? `🏦 ${opts.srcBranch || 'Source Branch'} → 🌐 Source Hub → 🏛 HQ → 🌐 Dest Hub → 🏦 ${opts.destBranch || 'Dest Branch'}`
      : `💻 ${opts.senderName || 'Sender'} → 🏦 Branch → 🌐 ${opts.senderRegion||'??'} Hub → 🏛 HQ → 🌐 ${opts.receiverRegion||'??'} Hub → 🏦 Branch → 📱 ${opts.receiverName || 'Recipient'}`;

    const summary = document.createElement('div');
    summary.id = 'osi-summary';
    summary.style.cssText = 'animation:osiHopIn 0.5s ease both;margin-top:8px;';
    summary.innerHTML = `
      <div style="
        background:linear-gradient(135deg,rgba(255,215,0,0.06),rgba(124,77,255,0.06));
        border:1px solid rgba(255,215,0,0.3);border-radius:12px;padding:16px 20px;
        position:relative;overflow:hidden;
      ">
        <div style="position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,#ffd700,#7c4dff,#00e676);"></div>
        
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
          <div style="font-size:1.4rem;">✅</div>
          <div>
            <div style="font-size:0.95rem;font-weight:800;color:#ffd700;">${isBranch ? 'Branch-to-Branch Sync Complete' : 'Fund Transfer Delivered'}</div>
            <div style="font-size:0.72rem;color:#9fa8da;">${isBranch ? 'Secure inter-branch data synchronization' : 'End-to-end transaction confirmed'} · All ${hopCount} hops processed</div>
          </div>
        </div>

        <!-- GRID STATS -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px;">
          <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#00e676;font-family:monospace;">${hopCount}</div>
            <div style="font-size:0.65rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;">Total Hops</div>
          </div>
          <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#40c4ff;font-family:monospace;">${totalLatency.split('(')[0].trim()}</div>
            <div style="font-size:0.65rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;">Total Latency</div>
          </div>
          <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:10px;text-align:center;">
            <div style="font-size:1.3rem;font-weight:800;color:#ffd700;font-family:monospace;">OSI 1-7</div>
            <div style="font-size:0.65rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;">Layers Used</div>
          </div>
        </div>

        <!-- SECURITY -->
        <div style="background:rgba(0,0,0,0.35);border-radius:8px;padding:10px 12px;margin-bottom:10px;border:1px solid ${secColor}33;">
          <div style="font-size:0.65rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Security Status</div>
          <div style="font-size:0.82rem;color:${secColor};font-weight:600;">${security}</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">
            ${tlsEnabled ? `
              <span style="font-size:0.62rem;background:rgba(0,230,118,0.1);color:#00e676;padding:2px 8px;border-radius:10px;border:1px solid #00e67633;">✓ Certificate Verified</span>
              <span style="font-size:0.62rem;background:rgba(0,230,118,0.1);color:#00e676;padding:2px 8px;border-radius:10px;border:1px solid #00e67633;">✓ Forward Secrecy (ECDHE)</span>
              <span style="font-size:0.62rem;background:rgba(0,230,118,0.1);color:#00e676;padding:2px 8px;border-radius:10px;border:1px solid #00e67633;">✓ Integrity (HMAC-SHA384)</span>
            ` : `
              <span style="font-size:0.62rem;background:rgba(255,82,82,0.1);color:#ff5252;padding:2px 8px;border-radius:10px;border:1px solid #ff525233;">✗ No Encryption</span>
              <span style="font-size:0.62rem;background:rgba(255,82,82,0.1);color:#ff5252;padding:2px 8px;border-radius:10px;border:1px solid #ff525233;">✗ MITM Possible</span>
            `}
          </div>
        </div>

        <!-- PATH -->
        <div style="background:rgba(0,0,0,0.35);border-radius:8px;padding:10px 12px;border:1px solid #1e2d4f;">
          <div style="font-size:0.65rem;color:#5c6bc0;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;">Complete Network Path (${hopCount} Hops)</div>
          <div style="font-size:0.78rem;color:#9fa8da;line-height:1.9;word-break:break-word;">${path}</div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap;">
            <span style="font-size:0.62rem;background:rgba(64,196,255,0.1);color:#40c4ff;padding:2px 8px;border-radius:10px;">TCP (Reliable)</span>
            <span style="font-size:0.62rem;background:rgba(67,160,71,0.1);color:#66bb6a;padding:2px 8px;border-radius:10px;">IPv4 Packet Switched</span>
            <span style="font-size:0.62rem;background:rgba(251,140,0,0.1);color:#ffa726;padding:2px 8px;border-radius:10px;">Ethernet L2 Frames</span>
            <span style="font-size:0.62rem;background:rgba(229,57,53,0.1);color:#ef5350;padding:2px 8px;border-radius:10px;">Fiber + WiFi Physical</span>
          </div>
        </div>
      </div>
    `;
    container.appendChild(summary);
    container.scrollTop = container.scrollHeight;
  }

  /* ── PUBLIC API ─────────────────────────────────────────────── */
  function init(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `
      <div style="text-align:center;padding:32px;color:#5c6bc0;">
        <div style="font-size:2.5rem;margin-bottom:8px;opacity:0.3;">🌐</div>
        <div style="font-size:0.82rem;">Initiate a transfer to see the live OSI layer trace</div>
      </div>`;
  }

  function clear(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  }

  function addHop(containerId, hopIndex, opts, mode) {
    if (hopIndex === 0) clear(containerId);
    const hopData = buildHopData(hopIndex, opts, mode);
    if (!hopData) return;
    renderHopCard(containerId, hopIndex, hopData, true);
    const el = document.getElementById(containerId);
    if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 100);
  }

  function showSummary(containerId, opts, mode) {
    renderSummary(containerId, opts, mode);
  }

  /* Inject keyframe styles */
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes osiHopIn {
      from { opacity:0; transform:translateY(12px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes osiLayerIn {
      from { opacity:0; transform:translateX(-8px); }
      to   { opacity:1; transform:translateX(0); }
    }
    .osi-hop-card:hover {
      border-color: #263454 !important;
      box-shadow: 0 2px 16px rgba(0,0,0,0.4);
    }
  `;
  document.head.appendChild(styleEl);

  return { init, clear, addHop, showSummary };
})();
