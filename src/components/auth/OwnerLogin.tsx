import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';
import { Lock, ArrowRight, Shield, Loader2, Home, AlertCircle } from 'lucide-react';

interface OwnerLoginProps {
  onSwitchToCustomer: () => void;
  onGoHome?: () => void;
}

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onSwitchToCustomer, onGoHome }) => {
  const { login, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!email.trim() || !password) {
      setLoginError('Please enter administrator email and password.');
      showToast('Please enter administrator email and password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          loginIdentifier: email.trim(),
          password,
          loginType: 'OWNER'
        })
      });

      login(res);
    } catch (err: any) {
      setLoginError(err.message || 'Administrator authentication failed.');
      showToast(err.message || 'Owner authentication failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      
      {onGoHome && (
        <div className="sm:mx-auto sm:w-full sm:max-w-md mb-4 flex justify-start">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F4C81] hover:underline"
          >
            <Home className="w-4 h-4 text-[#D4AF37]" />
            <span>Return to Nova Trust Homepage</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="flex justify-center mb-2">
          <BrandLogo variant="light" showTagline={true} />
        </div>
        <div className="flex items-center justify-center gap-1.5 pt-1">
          <span className="px-3 py-1 rounded-md text-[10px] font-mono font-bold bg-[#0B1F3A] text-[#D4AF37] border border-[#0F4C81]">
            STAFF &amp; CORE BANKING ADMINISTRATION
          </span>
        </div>
        <p className="text-xs text-[#5E6C84]">
          Restricted Institutional Audit &amp; System Control Terminal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-3xl border border-[#DCE3EC]">
          
          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@novatrustbank.com"
                className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-slate-900 placeholder-slate-400 font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#0F4C81] focus:outline-none transition-colors shadow-md disabled:bg-[#DCE3EC]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Authenticating Staff Credentials...</span>
                </>
              ) : (
                <>
                  <span>Access Admin Console</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Customer Login */}
          <div className="mt-5 pt-4 border-t border-[#DCE3EC] text-center">
            <button
              type="button"
              onClick={onSwitchToCustomer}
              className="text-xs text-[#0F4C81] hover:underline font-semibold inline-flex items-center gap-1.5"
            >
              <span>Customer Personal & Business Online Banking Login</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

