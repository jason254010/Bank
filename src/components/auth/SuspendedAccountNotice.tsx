import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Headphones,
  LogOut,
  Building2,
  FileText,
  Clock,
  Mail,
  Phone,
  ArrowRight,
  Info
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface SuspendedAccountNoticeProps {
  onOpenSupport: () => void;
}

export const SuspendedAccountNotice: React.FC<SuspendedAccountNoticeProps> = ({ onOpenSupport }) => {
  const { user, account, logout, showToast } = useAuth();

  const handleDownloadNoticePDF = () => {
    if (!user || !account) return;

    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(15, 53, 87); // Deep Navy
      doc.rect(0, 0, 210, 35, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('NOVA TRUST BANK', 14, 20);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Compliance & Administrative Services Desk', 14, 27);

      // Warning Box
      doc.setDrawColor(239, 68, 68); // Red
      doc.setFillColor(254, 242, 242);
      doc.roundedRect(14, 45, 182, 35, 3, 3, 'FD');

      doc.setTextColor(153, 27, 27);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OFFICIAL NOTICE OF ACCOUNT SUSPENSION', 20, 56);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Ref: COMPLIANCE-HOLD-2026-NTB', 20, 64);
      doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 20, 71);

      // Account Details
      doc.setDrawColor(217, 222, 229);
      doc.setFillColor(243, 245, 247);
      doc.roundedRect(14, 88, 182, 50, 3, 3, 'FD');

      doc.setTextColor(30, 42, 54);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCOUNT IDENTIFICATION', 20, 98);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Customer Name: ${user.fullName}`, 20, 107);
      doc.text(`Customer ID: ${user.id}`, 20, 115);
      doc.text(`Account Number: ${account.accountNumber}`, 20, 123);
      doc.text(`Account Type: ${account.accountType}`, 20, 131);

      doc.text(`Current Status: SUSPENDED`, 110, 107);
      doc.text(`Routing Number: ${account.routingNumber}`, 110, 115);
      doc.text(`Ledger Balance: $${account.balance.toFixed(2)} USD`, 110, 123);

      // Restriction Description
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 53, 87);
      doc.text('RESTRICTIONS & COMPLIANCE REQUIREMENTS', 14, 150);

      const instructions = [
        '1. Outgoing interbank wire transfers, SWIFT debits, and local transfers are blocked.',
        '2. Debit card access and online purchasing capabilities are temporarily disabled.',
        '3. To resolve this suspension and verify account documentation, contact Nova Trust',
        '   Bank Compliance Officer immediately at compliance@novatrustbank.com or via',
        '   the 24/7 Priority Live Support Desk inside your banking portal.'
      ];

      let y = 160;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 42, 54);
      instructions.forEach(line => {
        doc.text(line, 14, y);
        y += 7;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(110, 122, 135);
      doc.text('Nova Trust Bank, N.A. Compliance Department • Member FDIC', 14, 280);

      doc.save(`NovaTrust_SuspensionNotice_${account.accountNumber}.pdf`);
      showToast('Official Suspension Notice PDF downloaded', 'info');
    } catch (e) {
      showToast('Failed to download PDF notice', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F5F7] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      
      <div className="max-w-2xl w-full bg-white rounded-3xl border border-red-200 shadow-2xl overflow-hidden">
        
        {/* Header Red/Navy Bar */}
        <div className="bg-[#0F3557] text-white p-6 sm:p-8 border-b border-red-900/40 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-sans text-white">NOVA TRUST BANK</h1>
                <p className="text-xs text-rose-300 font-mono">Administrative Compliance Unit</p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
              STATUS: SUSPENDED
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 space-y-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>Notice of Account Status Restriction</span>
            </div>
            <p className="leading-relaxed">
              Your banking account (<strong>#{account?.accountNumber}</strong>) has been placed under administrative compliance review. Outgoing money transfers, card operations, and restricted features are temporarily blocked.
            </p>
          </div>

          {/* Account Details Box */}
          <div className="bg-[#F3F5F7] p-5 rounded-2xl border border-[#D9DEE5] text-xs space-y-3 font-mono">
            <h3 className="font-bold text-[#0F3557] font-sans text-sm border-b border-[#D9DEE5] pb-2">
              Account Identification & Status Record
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[#6E7A87] block text-[10px]">ACCOUNT HOLDER</span>
                <span className="font-bold text-[#1E2A36] text-sm">{user?.fullName}</span>
              </div>
              <div>
                <span className="text-[#6E7A87] block text-[10px]">ACCOUNT NUMBER</span>
                <span className="font-bold text-[#0057B8] text-sm">{account?.accountNumber}</span>
              </div>
              <div>
                <span className="text-[#6E7A87] block text-[10px]">CURRENT LEDGER BALANCE</span>
                <span className="font-bold text-[#0F3557] text-sm">${account?.balance.toFixed(2)} USD</span>
              </div>
              <div>
                <span className="text-[#6E7A87] block text-[10px]">COMPLIANCE CASE REF</span>
                <span className="font-bold text-rose-700 text-sm">NTB-CMP-2026-99A</span>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-3 text-xs text-[#1E2A36]">
            <h4 className="font-bold text-sm text-[#0F3557]">Required Action Steps:</h4>
            <ul className="space-y-2 text-[#6E7A87] list-disc pl-5">
              <li>Contact the Nova Trust Compliance Desk to verify account documentation.</li>
              <li>Provide requested identification or transaction verification references.</li>
              <li>Once verified, your account status will be restored to active standard operations.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-[#D9DEE5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSupport}
                className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-md flex items-center gap-2"
              >
                <Headphones className="w-4 h-4" />
                <span>Contact Support Desk</span>
              </button>

              <button
                onClick={handleDownloadNoticePDF}
                className="bg-[#0F3557] hover:bg-[#164875] text-[#A9D8F7] px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4" />
                <span>Download PDF Notice</span>
              </button>
            </div>

            <button
              onClick={logout}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#6E7A87] hover:text-[#1E2A36] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
