import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';
import { ShieldCheck, KeyRound, Mail, ArrowRight, Lock } from 'lucide-react';

export const OwnerSetup: React.FC = () => {
  const { login, showToast } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      showToast('Please complete all required fields.', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest('/api/auth/owner-setup', {
        method: 'POST',
        body: JSON.stringify({ email, password, confirmPassword })
      });

      showToast('Owner account initialized successfully!', 'success');
      login({
        user: res.user,
        token: res.token
      });
    } catch (err: any) {
      showToast(err.message || 'Owner initialization failed.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <div className="flex justify-center mb-2">
          <BrandLogo variant="light" showTagline={true} />
        </div>
        <p className="text-xs text-[#5E6C84]">
          Initial Core System Setup: Create the Bank Owner &amp; Lead Administrator Account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-[#DCE3EC]">
          
          <div className="mb-6 p-4 bg-[#0F4C81]/10 border border-[#0F4C81]/30 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0F4C81] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#0B1F3A] leading-relaxed font-sans">
              This setup form is only shown once on initial deployment. Once created, the Owner account will gain master operational control over bank settings, customer creation, and transfer authorizations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5 font-mono">
                Owner Email Address
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Mail className="h-4 w-4 text-[#0F4C81]" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@novatrustbank.com"
                  className="block w-full pl-10 pr-3.5 py-3 text-xs rounded-xl border border-[#DCE3EC] focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B1F3A] font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5 font-mono">
                Owner Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <KeyRound className="h-4 w-4 text-[#0F4C81]" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-3 text-xs rounded-xl border border-[#DCE3EC] focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B1F3A] font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0B1F3A] uppercase tracking-wider mb-1.5 font-mono">
                Confirm Owner Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5E6C84]">
                  <Lock className="h-4 w-4 text-[#0F4C81]" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-3 text-xs rounded-xl border border-[#DCE3EC] focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-[#0B1F3A] font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-xs font-bold text-white bg-[#0F4C81] hover:bg-[#0C3C66] transition-all shadow-md disabled:bg-[#DCE3EC] border border-white/10"
            >
              <span>{isSubmitting ? 'Creating Owner Account...' : 'Complete Setup & Initialize Platform'}</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
