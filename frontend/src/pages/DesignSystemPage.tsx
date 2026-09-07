import React from 'react';
import { Header } from '../components/layout/Header';
import { Badge } from '../components/common/Badge';
import { StatCard } from '../components/common/StatCard';
import {
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Network,
  Database
} from 'lucide-react';

export const DesignSystemPage: React.FC = () => {

  const colorPalette = [
    {
      category: 'Dark Surfaces & Depth Tonal Hierarchy',
      colors: [
        { name: 'App / Sidebar Deepest Surface', hex: '#15181B', token: 'luxury.base', usage: 'Deep navigation shell, canvas background' },
        { name: 'Main Workspace Canvas', hex: '#1B1D1B', token: 'luxury.bg', usage: 'Main application background for all routes' },
        { name: 'Primary Card / Panel Surface', hex: '#1F1F1E', token: 'luxury.surface', usage: 'Primary cards, panels, table body' },
        { name: 'Elevated Cards & Table Headers', hex: '#262624', token: 'luxury.surfaceElevated', usage: 'Elevated containers, table headers' },
        { name: 'Inputs & Secondary Controls', hex: '#292A27', token: 'luxury.surfaceControl', usage: 'Form inputs, dropdowns, secondary controls' },
        { name: 'Hover & Selected Surface', hex: '#30312D', token: 'luxury.surfaceHover', usage: 'Row hover, active navigation item' },
      ]
    },
    {
      category: 'Text & Typography Hierarchy',
      colors: [
        { name: 'Primary Text (High-Contrast)', hex: '#F2EEE9', token: 'luxury.text', usage: 'Headings, key balances, high-priority numbers' },
        { name: 'Secondary Text', hex: '#D3CEC4', token: 'luxury.textSecondary', usage: 'Secondary labels, account metadata, hints' },
        { name: 'Muted Text', hex: '#B8ADA1', token: 'luxury.textMuted', usage: 'Timestamps, table headers, subtitles' },
        { name: 'Disabled Text', hex: '#8F8A82', token: 'luxury.textDisabled', usage: 'Placeholders, disabled controls' },
      ]
    },
    {
      category: 'Brand Accent: Muted Teal / Slate Family',
      colors: [
        { name: 'Primary Muted Teal (Brand Accent)', hex: '#4F6F73', token: 'luxury.slate', usage: 'Primary action buttons, active indicator borders' },
        { name: 'Deep Teal / Slate Active', hex: '#295155', token: 'luxury.slateDark', usage: 'Button hover, active button state' },
        { name: 'Secondary Slate (Healthy Links / WAN)', hex: '#6E8888', token: 'luxury.slateSecondary', usage: 'Healthy network links, secondary buttons' },
        { name: 'Subtle Slate (Telemetry & Packets)', hex: '#8FA3A6', token: 'luxury.slateSubtle', usage: 'Packet animation, cryptographic hash text' },
      ]
    },
    {
      category: 'Sage, Earth & Controlled Semantic Accents',
      colors: [
        { name: 'Sage / Forest Green (Operational / Success)', hex: '#607758', token: 'luxury.forest', usage: 'Healthy node, verified ledger, completed TX' },
        { name: 'Warm Earth / Leather (Financial Highlights)', hex: '#A88867', token: 'luxury.earth', usage: 'Financial accents, reserve highlights' },
        { name: 'Muted Ochre / Amber (Warning / Degraded)', hex: '#B89F6A', token: 'luxury.amber', usage: 'Congested link, MFA required, warning' },
        { name: 'Muted Terracotta (High Risk)', hex: '#B74E32', token: 'luxury.terracotta', usage: 'Suspicious session, route anomaly, held TX' },
        { name: 'Deep Burgundy (Critical Security Alert)', hex: '#7B1E20', token: 'luxury.burgundy', usage: 'Failed node, blocked TX, active attack' },
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-luxury-bg">
      <Header
        title="NetBankX Design System & Color Architecture"
        subtitle="Living component library based on the Complete Color Archive · Enterprise Banking & Cybersecurity Standard"
      />

      <div className="p-8 space-y-10 flex-1 max-w-7xl mx-auto w-full">
        {/* Intro Architecture Banner */}
        <div className="luxury-card p-6 bg-gradient-to-r from-luxury-surface via-luxury-surface to-luxury-subtle border-l-4 border-l-luxury-slate">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-luxury-slate uppercase tracking-wider mb-1">
                <Shield className="w-4 h-4 text-luxury-leather" />
                <span>Architecture Specification · Version 2.0</span>
              </div>
              <h2 className="text-xl font-bold text-luxury-text">
                Luxury Banking + Enterprise Cybersecurity Design Token Architecture
              </h2>
              <p className="text-xs text-luxury-muted mt-1 max-w-2xl">
                A restrained color distribution rule (60% Neutral Foundation, 20% Dark Charcoal Shell, 10% Professional Cool, 5% Warm Earth Tones, 5% Controlled Semantics). Zero generic blues, zero neon hacker effects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded bg-luxury-slate text-luxury-bg text-xs font-mono font-semibold">
                60:20:10:5:5 Ratio
              </span>
              <span className="px-3 py-1.5 rounded bg-luxury-forest/10 text-luxury-forest border border-luxury-forest/30 text-xs font-mono font-semibold">
                WCAG AAA Compliant
              </span>
            </div>
          </div>
        </div>

        {/* 1. COLOR ARCHITECTURE SPECIFICATION */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">1. Complete Color Archive Tokens</h3>
            <p className="text-xs text-luxury-muted">Centralized semantic CSS variables and Tailwind tokens extracted from the reference archive.</p>
          </div>

          <div className="space-y-6">
            {colorPalette.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-luxury-slate">{grp.category}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grp.colors.map((c, cIdx) => (
                    <div key={cIdx} className="luxury-card p-4 flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-lg border border-luxury-border shadow-sm shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-luxury-text truncate">{c.name}</div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-luxury-slate mt-0.5">
                          <span>{c.hex}</span>
                          <span className="text-luxury-muted">·</span>
                          <span className="text-luxury-muted font-sans text-[10px]">{c.token}</span>
                        </div>
                        <div className="text-[11px] text-luxury-muted mt-1 line-clamp-1">{c.usage}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. TYPOGRAPHY HIERARCHY */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">2. Typography Hierarchy</h3>
            <p className="text-xs text-luxury-muted">Inter / System Sans-Serif paired with JetBrains Mono for cryptographic & financial data.</p>
          </div>

          <div className="luxury-card divide-y divide-luxury-border">
            <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 text-xs font-mono text-luxury-muted">Page Title (28–36px · 700)</div>
              <div className="text-2xl md:text-3xl font-bold text-luxury-text tracking-tight">Security Operations Command Center</div>
            </div>
            <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 text-xs font-mono text-luxury-muted">Section Heading (18–22px · 600)</div>
              <div className="text-lg font-semibold text-luxury-text">Cryptographic WAN Simulation & Packet Flow</div>
            </div>
            <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 text-xs font-mono text-luxury-muted">Card Heading (14–16px · 600)</div>
              <div className="text-sm font-semibold text-luxury-text">National Inter-Branch Settlement Ledger</div>
            </div>
            <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 text-xs font-mono text-luxury-muted">Body Text (13–15px · 400)</div>
              <div className="text-sm text-luxury-text max-w-2xl">
                The banking digital-twin architecture evaluates network propagation delays, BGP hop latencies, and threat signatures simultaneously.
              </div>
            </div>
            <div className="p-5 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 text-xs font-mono text-luxury-muted">Cryptographic Mono (11–13px)</div>
              <div className="text-xs font-mono text-luxury-slate font-medium">
                SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
              </div>
            </div>
          </div>
        </div>

        {/* 3. BUTTON SYSTEM */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">3. Button & Action System</h3>
            <p className="text-xs text-luxury-muted">Strict hierarchy of interactive controls with subtle hover feedback.</p>
          </div>

          <div className="luxury-card p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <button className="px-4 py-2 bg-luxury-slate text-luxury-bg font-semibold text-xs rounded-lg shadow hover:bg-luxury-slate/90 transition-all flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-luxury-leather" />
                <span>Primary Slate Action</span>
              </button>
              <button className="px-4 py-2 bg-luxury-subtle border border-luxury-border text-luxury-text font-semibold text-xs rounded-lg hover:bg-luxury-border/40 transition-all">
                Secondary Stone Action
              </button>
              <button className="px-4 py-2 bg-luxury-forest text-luxury-bg font-semibold text-xs rounded-lg shadow hover:bg-luxury-forest/90 transition-all flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Success / Authorize</span>
              </button>
              <button className="px-4 py-2 bg-luxury-burgundy text-white font-semibold text-xs rounded-lg shadow hover:bg-luxury-burgundy/90 transition-all flex items-center gap-2">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Critical / Isolate Node</span>
              </button>
              <button className="px-4 py-2 bg-transparent border border-luxury-border text-luxury-slate font-semibold text-xs rounded-lg hover:bg-luxury-subtle transition-all">
                Outline Action
              </button>
            </div>
          </div>
        </div>

        {/* 4. RESTRAINED SEMANTIC BADGES */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">4. Semantic Status Badges</h3>
            <p className="text-xs text-luxury-muted">Muted backgrounds with darker text matching the Complete Color Archive.</p>
          </div>

          <div className="luxury-card p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success" size="md">✓ APPROVED / HEALTHY</Badge>
              <Badge variant="warning" size="md">⚠ REVIEW / DEGRADED</Badge>
              <Badge variant="danger" size="md">✕ BLOCKED / CRITICAL</Badge>
              <Badge variant="info" size="md">● ACTIVE / TELEMETRY</Badge>
              <Badge variant="neutral" size="md">○ OFFLINE / QUEUED</Badge>
            </div>
          </div>
        </div>

        {/* 5. ARCHITECTURAL STAT CARDS */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">5. Architectural Stat Cards</h3>
            <p className="text-xs text-luxury-muted">Elevated surfaces with subtle left accent indicators and high-contrast numerical metrics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Verified Liquid Reserves"
              value="₹84,25,200"
              subtitle="Audited in SHA256 chain"
              icon={<Database className="w-5 h-5 text-luxury-slate" />}
              accentColor="indigo"
            />
            <StatCard
              title="Global Health Status"
              value="99.98%"
              subtitle="National WAN mesh"
              icon={<Activity className="w-5 h-5 text-luxury-forest" />}
              accentColor="emerald"
            />
            <StatCard
              title="Active Threat Signals"
              value="1 Incident"
              subtitle="Investigating honeypot"
              icon={<AlertTriangle className="w-5 h-5 text-luxury-amber" />}
              accentColor="gold"
            />
            <StatCard
              title="Critical Block Rate"
              value="0.02%"
              subtitle="ATO signals intercepted"
              icon={<AlertOctagon className="w-5 h-5 text-luxury-burgundy" />}
              accentColor="rose"
            />
          </div>
        </div>

        {/* 6. ENTERPRISE TABLE SYSTEM */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">6. Enterprise Banking & Forensic Table</h3>
            <p className="text-xs text-luxury-muted">Dark charcoal surfaces, elevated headers, subtle borders, and smooth row hover transitions.</p>
          </div>

          <div className="luxury-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-luxury-subtle/60 border-b border-luxury-border text-luxury-muted uppercase text-[11px]">
                  <tr>
                    <th className="p-4 font-semibold">Transaction ID</th>
                    <th className="p-4 font-semibold">Source Account</th>
                    <th className="p-4 font-semibold">Destination Account</th>
                    <th className="p-4 font-semibold">Security Score</th>
                    <th className="p-4 font-semibold">State</th>
                    <th className="p-4 font-semibold text-right">Amount (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-luxury-border/60">
                  <tr className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-4 font-bold text-luxury-text">TX-901284</td>
                    <td className="p-4 text-luxury-muted">ACC-100001 (Mumbai)</td>
                    <td className="p-4 text-luxury-slate font-medium">ACC-100003 (Bangalore)</td>
                    <td className="p-4 text-luxury-forest font-semibold">98.4 / 100 (Safe)</td>
                    <td className="p-4"><Badge variant="success">COMPLETED</Badge></td>
                    <td className="p-4 text-right font-bold text-luxury-text">₹75,000.00</td>
                  </tr>
                  <tr className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-4 font-bold text-luxury-text">TX-901285</td>
                    <td className="p-4 text-luxury-muted">ACC-100002 (Pune)</td>
                    <td className="p-4 text-luxury-slate font-medium">ACC-100004 (Delhi)</td>
                    <td className="p-4 text-luxury-amber font-semibold">72.1 / 100 (Review)</td>
                    <td className="p-4"><Badge variant="warning">MFA_REQUIRED</Badge></td>
                    <td className="p-4 text-right font-bold text-luxury-text">₹2,50,000.00</td>
                  </tr>
                  <tr className="hover:bg-luxury-subtle/40 transition-colors">
                    <td className="p-4 font-bold text-luxury-text">TX-901286</td>
                    <td className="p-4 text-luxury-muted">ACC-100005 (Decoy)</td>
                    <td className="p-4 text-luxury-slate font-medium">ACC-EXT-999 (Blocked)</td>
                    <td className="p-4 text-luxury-burgundy font-semibold">12.0 / 100 (Critical)</td>
                    <td className="p-4"><Badge variant="danger">BLOCKED</Badge></td>
                    <td className="p-4 text-right font-bold text-luxury-text">₹10,00,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 7. NETWORK & SECURITY STATE SEMANTICS */}
        <div className="space-y-6">
          <div className="border-b border-luxury-border pb-3">
            <h3 className="text-lg font-bold text-luxury-text">7. Network Topology & Telemetry States</h3>
            <p className="text-xs text-luxury-muted">Consistent state mapping across WAN canvas, packets, and incident workflows.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="luxury-card p-5 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-luxury-slate flex items-center gap-2">
                <Network className="w-4 h-4 text-luxury-teal" />
                <span>Node & Link Telemetry Statuses</span>
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">HEALTHY NODE</span>
                  <span className="text-luxury-forest font-bold">#3E5E3F · Forest Green</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">ACTIVE TRANSIT / ROUTE</span>
                  <span className="text-luxury-teal font-bold">#4F6F73 · Muted Teal</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">CONGESTED / HIGH LATENCY</span>
                  <span className="text-luxury-amber font-bold">#B89F6A · Warm Amber</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">SEVERED LINK / FAILED NODE</span>
                  <span className="text-luxury-burgundy font-bold">#7B1E20 · Deep Burgundy</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">ACTIVE TELEMETRY PACKET</span>
                  <span className="text-luxury-leather font-bold">#C8946A · Restrained Leather</span>
                </div>
              </div>
            </div>

            <div className="luxury-card p-5 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-luxury-slate flex items-center gap-2">
                <Shield className="w-4 h-4 text-luxury-burgundy" />
                <span>Cybersecurity Threat Levels</span>
              </h4>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">LOW / BASELINE</span>
                  <span className="text-luxury-forest font-bold">Sage / Forest Green (Secure)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">MEDIUM / ELEVATED RISK</span>
                  <span className="text-luxury-amber font-bold">Warm Amber (MFA Challenge)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">HIGH / ANOMALOUS BEHAVIOR</span>
                  <span className="text-luxury-terracotta font-bold">Muted Terracotta (Suspicious)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-luxury-subtle/60 border border-luxury-border">
                  <span className="text-luxury-text font-semibold">CRITICAL / ACTIVE ATTACK</span>
                  <span className="text-luxury-burgundy font-bold">Deep Burgundy (ATO / Threat Blocked)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="text-center text-xs font-mono text-luxury-muted py-6 border-t border-luxury-border">
          NetBankX Design System · Crafted according to the Complete Color Archive specifications · Production Enterprise Ready
        </div>
      </div>
    </div>
  );
};
