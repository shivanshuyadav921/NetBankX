import React from 'react';
import { useNetworkSim } from '../../context/NetworkSimContext';
import { Terminal, Trash2 } from 'lucide-react';

export const EventTimeline: React.FC = () => {
  const { events, clearEvents } = useNetworkSim();

  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case 'SUCCESS':
        return 'text-luxury-forest border-l-luxury-forest bg-luxury-successBg';
      case 'WARNING':
        return 'text-luxury-amber border-l-luxury-amber bg-luxury-amberBg';
      case 'ERROR':
        return 'text-luxury-burgundy border-l-luxury-burgundy bg-luxury-burgundyBg';
      default:
        return 'text-luxury-slate border-l-luxury-slate bg-luxury-slateLight';
    }
  };

  return (
    <div className="luxury-card p-5 flex flex-col h-[480px]">
      <div className="flex items-center justify-between border-b border-luxury-borderSubtle pb-3 mb-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-luxury-slate" />
          <h3 className="font-bold text-luxury-text text-sm">📡 Live Digital Twin Event Stream</h3>
        </div>
        <button
          onClick={clearEvents}
          title="Clear Event Stream"
          className="p-1.5 rounded-lg text-luxury-textMuted hover:text-luxury-text hover:bg-luxury-subtle transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs pr-1">
        {events.length === 0 ? (
          <div className="text-center text-luxury-textMuted py-16 font-sans">
            <span className="opacity-40 text-2xl block mb-2">⚡</span>
            Waiting for digital twin events... Network ready.
          </div>
        ) : (
          events.map((ev, idx) => {
            const timeStr = new Date(ev.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            });

            return (
              <div
                key={ev.id || `${ev.transactionId}-${idx}`}
                className={`p-2.5 rounded-lg border-l-4 border border-luxury-borderSubtle ${getSeverityStyle(
                  ev.severity
                )}`}
              >
                <div className="flex items-center justify-between text-[10px] text-luxury-textMuted mb-1">
                  <span className="text-luxury-textSecondary">{timeStr}</span>
                  <span className="font-bold uppercase tracking-wider">{ev.eventType}</span>
                  {ev.latencyMs !== undefined && (
                    <span className="text-luxury-leather font-bold">+{ev.latencyMs}ms</span>
                  )}
                </div>
                <div className="text-luxury-text text-xs leading-relaxed font-sans">{ev.description}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

