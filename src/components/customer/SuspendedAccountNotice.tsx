import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../common/BrandLogo';
import { ShieldAlert, Headphones, LogOut, Lock } from 'lucide-react';

interface SuspendedAccountNoticeProps {
  onOpenSupport: () => void;
}

export const SuspendedAccountNotice: React.FC<SuspendedAccountNoticeProps> = ({ onOpenSupport }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Top Header Logo */}
      <div className="mb-6 flex items-center justify-center">
        <BrandLogo variant="light" showTagline={true} />
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-2xl border border-[#DCE3EC] max-w-lg w-full text-center space-y-6">
        
        {/* Suspended Alert Banner */}
        <div className="w-16 h-16 bg-rose-100 text-[#C62828] rounded-2xl flex items-center justify-center mx-auto shadow-sm border border-rose-200">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#C62828] rounded-full text-xs font-bold font-mono border border-rose-200">
            <Lock className="w-3.5 h-3.5" />
            <span>ACCOUNT STATUS: SUSPENDED</span>
          </div>
          <h2 className="text-2xl font-extrabold text-[#172B4D]">
            Your account has been suspended.
          </h2>
          <p className="text-sm font-semibold text-[#5E6C84]">
            Banking services are temporarily unavailable.
          </p>
        </div>

        <div className="p-4 bg-[#F5F7FA] rounded-2xl border border-[#DCE3EC] text-xs text-[#5E6C84] space-y-2 text-left">
          <p className="font-semibold text-[#172B4D]">Client Information:</p>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div>Account Holder: <span className="font-bold text-[#172B4D]">{user?.fullName || 'Valued Client'}</span></div>
            <div>Reference: <span className="font-bold text-[#172B4D]">{user?.email}</span></div>
          </div>
          <p className="pt-2 text-[11px] text-[#8A94A6]">
            Outgoing wires, internal transfers, card charges, and account balance access have been restricted under bank compliance standard 403-S.
          </p>
        </div>

        {/* Action Buttons: ONLY Contact Customer Care & Sign Out */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOpenSupport}
            className="flex-1 py-3 px-4 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Headphones className="w-4 h-4 text-[#D4AF37]" />
            <span>Contact Customer Care</span>
          </button>

          <button
            onClick={logout}
            className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-[#172B4D] rounded-xl text-xs font-bold transition-all border border-[#DCE3EC] flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-[#5E6C84]" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

      <div className="mt-8 text-xs text-[#8A94A6] text-center font-mono">
        Nova Trust Bank N.A. • 24/7 Security & Administrative Desk
      </div>

    </div>
  );
};
