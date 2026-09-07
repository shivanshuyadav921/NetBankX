import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Send,
  History,
  FileText,
  Network,
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Terminal,
  AlertTriangle,
  Layers,
  Zap,
  LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    switch (role) {
      case 'HQ_ADMIN':
        return { label: 'HQ Executive', color: 'bg-luxury-slateLight text-luxury-slate border-luxury-slate/30' };
      case 'REGIONAL_MANAGER':
        return { label: 'Regional Hub', color: 'bg-luxury-tealSoft text-luxury-teal border-luxury-teal/30' };
      case 'BRANCH_STAFF':
        return { label: 'Branch Manager', color: 'bg-luxury-successBg text-luxury-success border-luxury-successBorder' };
      default:
        return { label: 'Retail Customer', color: 'bg-luxury-amberBg text-luxury-leather border-luxury-amberBorder' };
    }
  };

  const roleInfo = getRoleBadge();

  return (
    <aside className="w-64 bg-luxury-charcoal border-r border-luxury-charcoalBorder flex flex-col h-screen select-none sticky top-0 dark-scroll">
      {/* Brand Header */}
      <div className="p-5 border-b border-luxury-charcoalBorder flex items-center gap-3 bg-luxury-charcoal">
        <div className="w-9 h-9 rounded-lg bg-luxury-charcoalSurface border border-luxury-charcoalBorder flex items-center justify-center font-extrabold text-luxury-leather text-lg shadow-sm">
          🏛
        </div>
        <div>
          <div className="font-extrabold text-base tracking-tight text-luxury-charcoalText flex items-center gap-1">
            NETBANK<span className="text-luxury-leather">X</span>
          </div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-luxury-charcoalMuted">
            Digital Twin Platform
          </div>
        </div>
      </div>

      {/* Navigation Links according to Role */}
      <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
        {role === 'CUSTOMER' && (
          <>
            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 py-1 mb-1">
              Banking Operations
            </div>
            <NavLink
              to="/customer/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-luxury-slateSubtle" />
              <span>My Accounts</span>
            </NavLink>
            <NavLink
              to="/customer/transfer"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Send className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Transfer & Net Trace</span>
            </NavLink>
            <NavLink
              to="/customer/history"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <History className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Transaction History</span>
            </NavLink>
            <NavLink
              to="/customer/requests"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <FileText className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Account Statements</span>
            </NavLink>
          </>
        )}

        {role === 'BRANCH_STAFF' && (
          <>
            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 py-1 mb-1">
              Branch Management
            </div>
            <NavLink
              to="/branch/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Branch Operations</span>
            </NavLink>
            <NavLink
              to="/branch/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Users className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Customer Registry</span>
            </NavLink>
            <NavLink
              to="/branch/transactions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Activity className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Branch Ledger</span>
            </NavLink>
            <NavLink
              to="/branch/network"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Network className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Branch Ingress WAN</span>
            </NavLink>
          </>
        )}

        {role === 'REGIONAL_MANAGER' && (
          <>
            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 py-1 mb-1">
              Regional Operations
            </div>
            <NavLink
              to="/regional/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Regional Hub</span>
            </NavLink>
            <NavLink
              to="/regional/branches"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Building2 className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Region Branches</span>
            </NavLink>
            <NavLink
              to="/regional/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Users className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Regional Accounts</span>
            </NavLink>
            <NavLink
              to="/regional/network"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Network className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Regional WAN</span>
            </NavLink>
          </>
        )}

        {role === 'HQ_ADMIN' && (
          <>
            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 py-1 mb-1">
              National Infrastructure
            </div>
            <NavLink
              to="/hq/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Executive Overview</span>
            </NavLink>
            <NavLink
              to="/hq/network-lab"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Network className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Network Digital Twin</span>
            </NavLink>
            <NavLink
              to="/hq/traffic-simulator"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Zap className="w-4 h-4 text-luxury-leather" />
              <span>Branch-to-Branch Lab</span>
            </NavLink>
            <NavLink
              to="/hq/regions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <MapPin className="w-4 h-4 text-luxury-slateSubtle" />
              <span>National Regions</span>
            </NavLink>
            <NavLink
              to="/hq/branches"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Building2 className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Branch Topology</span>
            </NavLink>
            <NavLink
              to="/hq/customers"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Users className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Accounts Directory</span>
            </NavLink>
            <NavLink
              to="/hq/transactions"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Activity className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Ledger & Transactions</span>
            </NavLink>

            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 pt-3 pb-1 mb-1 border-t border-luxury-border/60">
              Security Operations
            </div>
            <NavLink
              to="/hq/security"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <ShieldAlert className="w-4 h-4 text-luxury-slateSubtle" />
              <span>SOC Security Center</span>
            </NavLink>
            <NavLink
              to="/hq/incidents"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Incident Response</span>
            </NavLink>
            <NavLink
              to="/hq/cyber-lab"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Terminal className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Cyber Attack Lab</span>
            </NavLink>
            <NavLink
              to="/hq/audit-logs"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <ShieldCheck className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Audit Hash Trail</span>
            </NavLink>

            <div className="text-[10px] font-bold text-luxury-textMuted uppercase tracking-wider px-3 pt-3 pb-1 mb-1 border-t border-luxury-border/60">
              System & Tokens
            </div>
            <NavLink
              to="/hq/design-system"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-luxury-surfaceHover text-luxury-text border-l-2 border-luxury-slate font-semibold shadow-sm'
                    : 'text-luxury-textSecondary hover:bg-luxury-surfaceControl hover:text-luxury-text'
                }`
              }
            >
              <Layers className="w-4 h-4 text-luxury-slateSubtle" />
              <span>Design System Tokens</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3.5 border-t border-luxury-charcoalBorder bg-luxury-charcoalSurface/60">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-luxury-slate text-white flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-luxury-charcoalText truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
              </div>
              <span className={`inline-block text-[10px] px-1.5 py-0.2 rounded border font-mono ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-luxury-charcoalMuted hover:text-luxury-burgundy hover:bg-luxury-charcoalHover transition-all shrink-0"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
