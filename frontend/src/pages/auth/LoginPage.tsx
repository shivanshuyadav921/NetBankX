import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield, KeyRound, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('HQ_ADMIN');
  const [username, setUsername] = useState<string>('arjun.mehta');
  const [password, setPassword] = useState<string>('Password@123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    switch (role) {
      case 'HQ_ADMIN':
        setUsername('arjun.mehta');
        setPassword('Password@123');
        break;
      case 'REGIONAL_MANAGER':
        setUsername('raj.sharma');
        setPassword('Password@123');
        break;
      case 'BRANCH_STAFF':
        setUsername('vikram.nair');
        setPassword('Password@123');
        break;
      case 'CUSTOMER':
        setUsername('aisha.kapoor');
        setPassword('Password@123');
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password, expectedRole: selectedRole });
      if (selectedRole === 'HQ_ADMIN') navigate('/hq/dashboard');
      else if (selectedRole === 'REGIONAL_MANAGER') navigate('/regional/dashboard');
      else if (selectedRole === 'BRANCH_STAFF') navigate('/branch/dashboard');
      else navigate('/customer/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs = {
    HQ_ADMIN: { label: 'HQ Executive', icon: '🏛', desc: 'Global Bank & National WAN Digital Twin' },
    REGIONAL_MANAGER: { label: 'Regional Manager', icon: '🏢', desc: 'Regional Hub Gateway & Aggregated Traffic' },
    BRANCH_STAFF: { label: 'Branch Manager', icon: '🏦', desc: 'Local Branch Accounts & Inter-Branch Sync' },
    CUSTOMER: { label: 'Customer Portal', icon: '👤', desc: 'Private Wealth & 7-Layer OSI Trace' }
  };

  return (
    <div className="min-h-screen bg-luxury-charcoal flex items-center justify-center p-4 relative overflow-hidden">
      {/* Restrained architectural background grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#EDE6DE 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      <div className="w-full max-w-lg z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-luxury-charcoalSurface border border-luxury-charcoalBorder text-luxury-leather font-black text-2xl shadow-luxury-md mb-3">
            🏛
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-luxury-charcoalText">
            NETBANK<span className="text-luxury-leather">X</span>
          </h1>
          <p className="text-xs text-luxury-charcoalMuted font-mono mt-1 uppercase tracking-widest">
            Enterprise Banking Network Digital Twin
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-luxury-charcoalSurface border border-luxury-charcoalBorder rounded-xl shadow-luxury-lg overflow-hidden">
          {/* 4 Role Selector Tabs */}
          <div className="grid grid-cols-4 border-b border-luxury-charcoalBorder bg-luxury-charcoal p-1.5 gap-1">
            {(['HQ_ADMIN', 'REGIONAL_MANAGER', 'BRANCH_STAFF', 'CUSTOMER'] as UserRole[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleSelect(r)}
                className={`py-2 px-1 text-center rounded-lg transition-all ${
                  selectedRole === r
                    ? 'bg-luxury-slate text-luxury-charcoalText font-bold border border-luxury-charcoalBorder shadow-sm'
                    : 'text-luxury-charcoalMuted hover:text-luxury-charcoalText hover:bg-luxury-charcoalHover'
                }`}
              >
                <div className="text-sm">{roleConfigs[r].icon}</div>
                <div className="text-[10px] font-medium tracking-tight mt-0.5 truncate">
                  {r === 'HQ_ADMIN' ? 'HQ Admin' : r === 'REGIONAL_MANAGER' ? 'Regional' : r === 'BRANCH_STAFF' ? 'Branch' : 'Customer'}
                </div>
              </button>
            ))}
          </div>

          <div className="p-6">
            <div className="bg-luxury-charcoal/80 p-3 rounded-lg border border-luxury-charcoalBorder mb-5 flex items-center gap-3">
              <span className="text-2xl">{roleConfigs[selectedRole].icon}</span>
              <div>
                <div className="text-xs font-bold text-luxury-charcoalText">{roleConfigs[selectedRole].label}</div>
                <div className="text-[11px] text-luxury-charcoalMuted">{roleConfigs[selectedRole].desc}</div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-luxury-burgundyBg border border-luxury-burgundyBorder text-luxury-burgundy text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-luxury-charcoalMuted mb-1.5 uppercase tracking-wider">
                  User ID / Username
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-luxury-charcoalMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    placeholder="Enter user ID"
                    className="w-full pl-9 pr-4 py-2.5 bg-luxury-charcoal border border-luxury-charcoalBorder rounded-lg text-sm text-luxury-charcoalText font-mono focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate transition-all placeholder:text-luxury-charcoalMuted/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-luxury-charcoalMuted mb-1.5 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-luxury-charcoalMuted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="w-full pl-9 pr-10 py-2.5 bg-luxury-charcoal border border-luxury-charcoalBorder rounded-lg text-sm text-luxury-charcoalText font-mono focus:outline-none focus:border-luxury-slate focus:ring-1 focus:ring-luxury-slate transition-all placeholder:text-luxury-charcoalMuted/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-luxury-charcoalMuted hover:text-luxury-charcoalText"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-luxury-slate hover:bg-luxury-slateHover text-white font-semibold rounded-lg shadow-luxury-sm hover:shadow-luxury-md active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm mt-2"
              >
                <span>{isLoading ? 'Authenticating...' : 'Sign In to Portal'}</span>
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Quick-Fill Demo Credentials */}
            <div className="mt-6 pt-5 border-t border-luxury-charcoalBorder">
              <div className="text-[11px] font-semibold text-luxury-charcoalMuted mb-2 flex items-center justify-between">
                <span>⚡ Quick Fill Demo Accounts:</span>
                <span className="text-[10px] font-mono text-luxury-forest">Password@123</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={() => {
                    handleRoleSelect('HQ_ADMIN');
                    setUsername('arjun.mehta');
                    setPassword('Password@123');
                  }}
                  className="p-1.5 rounded bg-luxury-charcoal border border-luxury-charcoalBorder text-luxury-charcoalText hover:border-luxury-slate text-left truncate"
                >
                  🏛 arjun.mehta (HQ)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleSelect('REGIONAL_MANAGER');
                    setUsername('raj.sharma');
                    setPassword('Password@123');
                  }}
                  className="p-1.5 rounded bg-luxury-charcoal border border-luxury-charcoalBorder text-luxury-charcoalText hover:border-luxury-slate text-left truncate"
                >
                  🏢 raj.sharma (MH Hub)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleSelect('BRANCH_STAFF');
                    setUsername('vikram.nair');
                    setPassword('Password@123');
                  }}
                  className="p-1.5 rounded bg-luxury-charcoal border border-luxury-charcoalBorder text-luxury-charcoalText hover:border-luxury-slate text-left truncate"
                >
                  🏦 vikram.nair (Mumbai)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleSelect('CUSTOMER');
                    setUsername('aisha.kapoor');
                    setPassword('Password@123');
                  }}
                  className="p-1.5 rounded bg-luxury-charcoal border border-luxury-charcoalBorder text-luxury-charcoalText hover:border-luxury-slate text-left truncate"
                >
                  👤 aisha.kapoor (Cust)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="text-center mt-6 text-xs text-luxury-charcoalMuted flex items-center justify-center gap-2">
          <Shield className="w-3.5 h-3.5 text-luxury-forest" />
          <span>Protected by Bcrypt/Argon2 + JWT RBAC Guard · TLS 1.3 Transport</span>
        </div>
      </div>
    </div>
  );
};

