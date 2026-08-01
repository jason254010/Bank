import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { jsPDF } from 'jspdf';
import { TransferSection } from './TransferSection';
import { ProfilePictureUploader } from '../common/ProfilePictureUploader';
import {
  User,
  Account,
  DebitCard,
  Transaction,
  Notification,
  AccountType
} from '../../types';
import {
  CreditCard,
  Send,
  History,
  FileText,
  Bell,
  Shield,
  User as UserIcon,
  Lock,
  Unlock,
  CheckCircle2,
  DollarSign,
  Building2,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Download,
  Printer,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  ChevronRight,
  Info
} from 'lucide-react';

interface CustomerDashboardProps {
  onOpenSupport: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onOpenSupport,
  activeTab,
  setActiveTab
}) => {
  const { user, account, refreshUser, showToast } = useAuth();

  // State
  const [cards, setCards] = useState<DebitCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Card CVV / Number Reveal Toggle
  const [showCardDetails, setShowCardDetails] = useState(false);

  // Internal Transfer Workflow State
  const [transferStep, setTransferStep] = useState<'FORM' | 'REVIEW' | 'OTP' | 'SUCCESS'>('FORM');
  const [transferData, setTransferData] = useState({
    recipientAccountNumber: '',
    recipientName: '',
    bankName: 'Nova Trust Bank',
    amount: '',
    description: ''
  });
  const [isValidatingRecipient, setIsValidatingRecipient] = useState(false);
  const [isInternalRecipient, setIsInternalRecipient] = useState<boolean | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);
  const [completedTx, setCompletedTx] = useState<Transaction | null>(null);

  // Transaction History Filter State
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');

  // Statements State
  const [selectedStatementMonth, setSelectedStatementMonth] = useState('July 2026');
  const [showPrintableModal, setShowPrintableModal] = useState(false);

  // Profile / Security Form state
  const [profileForm, setProfileForm] = useState({
    phoneNumber: user?.phoneNumber || '',
    address: user?.address || '',
    username: user?.username || '',
    dateOfBirth: user?.dateOfBirth || ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        username: user.username || '',
        dateOfBirth: user.dateOfBirth || ''
      });
    }
  }, [user]);

  const handleSaveProfilePicture = async (base64Picture: string) => {
    try {
      await apiRequest('/api/customer/profile', {
        method: 'PUT',
        body: JSON.stringify({ profilePicture: base64Picture })
      });
      showToast('Profile picture updated successfully!', 'success');
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile picture', 'error');
    }
  };

  const handleRemoveProfilePicture = async () => {
    try {
      await apiRequest('/api/customer/profile/picture', {
        method: 'DELETE'
      });
      showToast('Profile picture removed', 'info');
      await refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove profile picture', 'error');
    }
  };
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      const [cardsRes, txsRes, notifsRes] = await Promise.all([
        apiRequest<DebitCard[]>('/api/customer/cards'),
        apiRequest<Transaction[]>('/api/customer/transactions'),
        apiRequest<Notification[]>('/api/customer/notifications')
      ]);

      setCards(cardsRes);
      setTransactions(txsRes);
      setNotifications(notifsRes);
    } catch (e: any) {
      showToast(e.message || 'Failed to sync banking records', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomerData();
  }, []);

  // Recipient Account Validation
  const handleValidateRecipient = async () => {
    if (!transferData.recipientAccountNumber.trim()) return;
    setIsValidatingRecipient(true);
    try {
      const res = await apiRequest('/api/transfers/validate-recipient', {
        method: 'POST',
        body: JSON.stringify({ accountNumber: transferData.recipientAccountNumber.trim() })
      });

      setIsInternalRecipient(res.isInternal);
      if (res.isInternal) {
        setTransferData(prev => ({
          ...prev,
          recipientName: res.recipientName,
          bankName: res.bankName
        }));
      }
    } catch (e) {
      //
    } finally {
      setIsValidatingRecipient(false);
    }
  };

  // Card Lock/Unlock Toggle
  const handleToggleCardLock = async (cardId: string) => {
    try {
      const updatedCard = await apiRequest<DebitCard>(`/api/customer/cards/${cardId}/toggle-lock`, {
        method: 'POST'
      });

      setCards(prev => prev.map(c => c.id === cardId ? updatedCard : c));
      showToast(`Debit card is now ${updatedCard.isLocked ? 'Locked' : 'Unlocked'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to update card status', 'error');
    }
  };

  // Request OTP for Transfer
  const handleRequestTransferOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(transferData.amount);
    if (isNaN(numAmt) || numAmt <= 0) {
      showToast('Please enter a valid transfer amount', 'error');
      return;
    }

    if (account && account.availableBalance < numAmt) {
      showToast('Insufficient funds for this transfer', 'error');
      return;
    }

    try {
      const res = await apiRequest('/api/transfers/request-otp', { method: 'POST' });
      showToast(res.message, 'success');
      if (res.otpCodeHint) {
        setOtpHint(res.otpCodeHint);
      }
      setTransferStep('OTP');
    } catch (err: any) {
      showToast(err.message || 'Failed to request transfer OTP', 'error');
    }
  };

  // Execute Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      showToast('Please enter the 6-digit OTP code', 'error');
      return;
    }

    setIsSubmittingTransfer(true);
    try {
      const res = await apiRequest('/api/transfers/execute', {
        method: 'POST',
        body: JSON.stringify({
          recipientAccountNumber: transferData.recipientAccountNumber,
          recipientName: transferData.recipientName,
          bankName: transferData.bankName,
          amount: transferData.amount,
          description: transferData.description,
          otpCode: otpCode.trim()
        })
      });

      showToast('Transfer completed successfully!', 'success');
      setCompletedTx(res.transaction);
      setTransferStep('SUCCESS');
      await refreshUser();
      loadCustomerData();
    } catch (err: any) {
      showToast(err.message || 'Transfer failed', 'error');
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  // Reset Transfer Form
  const resetTransfer = () => {
    setTransferStep('FORM');
    setTransferData({
      recipientAccountNumber: '',
      recipientName: '',
      bankName: 'Nova Trust Bank',
      amount: '',
      description: ''
    });
    setOtpCode('');
    setOtpHint(null);
    setCompletedTx(null);
  };

  // Mark Notifications Read
  const handleMarkNotifsRead = async () => {
    try {
      await apiRequest('/api/customer/notifications/mark-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'info');
    } catch (e) {
      //
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/api/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(profileForm)
      });
      showToast('Profile updated successfully', 'success');
      refreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  // Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    try {
      await apiRequest('/api/customer/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      showToast('Password changed successfully!', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      showToast(err.message || 'Failed to change password', 'error');
    }
  };

  // Generate PDF Statement
  const handleDownloadPDFStatement = () => {
    if (!account || !user) return;

    const doc = new jsPDF();
    
    // Bank Header
    doc.setFillColor(15, 53, 87); // Navy Blue
    doc.rect(0, 0, 210, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('NOVA TRUST BANK', 14, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Official Account Activity Statement', 14, 27);
    doc.text(`Statement Period: ${selectedStatementMonth}`, 130, 20);

    // Account Summary Box
    doc.setDrawColor(217, 222, 229);
    doc.setFillColor(243, 245, 247);
    doc.roundedRect(14, 42, 182, 35, 3, 3, 'FD');

    doc.setTextColor(30, 42, 54);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Account Holder: ${user.fullName}`, 20, 52);
    doc.text(`Account Number: ${account.accountNumber}`, 20, 60);
    doc.text(`Account Type: ${account.accountType}`, 20, 68);

    doc.text(`Available Balance: $${account.availableBalance.toFixed(2)}`, 110, 52);
    doc.text(`Routing Number: ${account.routingNumber}`, 110, 60);
    doc.text(`Currency: USD ($)`, 110, 68);

    // Table Headers
    let y = 90;
    doc.setFillColor(0, 87, 184); // Primary Blue
    doc.rect(14, y, 182, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Date', 18, y + 5.5);
    doc.text('Reference #', 45, y + 5.5);
    doc.text('Description', 90, y + 5.5);
    doc.text('Amount ($)', 165, y + 5.5);

    // Table Content
    y += 12;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 42, 54);

    transactions.forEach(tx => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(new Date(tx.createdAt).toLocaleDateString(), 18, y);
      doc.text(tx.reference, 45, y);
      doc.text(tx.description.substring(0, 35), 90, y);
      doc.text(`$${tx.amount.toFixed(2)}`, 165, y);
      y += 8;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(110, 122, 135);
    doc.text('This is a computer-generated bank statement issued by Nova Trust Bank.', 14, 285);

    doc.save(`NovaTrustBank_Statement_${selectedStatementMonth.replace(' ', '_')}.pdf`);
    showToast('Statement PDF generated and downloaded', 'success');
  };

  // Filtered Transactions
  const filteredTxs = transactions.filter(t => {
    const q = txSearch.toLowerCase();
    const matchSearch =
      t.recipientName.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q);

    if (txTypeFilter === 'ALL') return matchSearch;
    return matchSearch && t.type === txTypeFilter;
  });

  return (
    <div className="min-h-screen bg-[#F3F5F7] pb-16">
      
      {/* Customer Subheader Navigation Bar */}
      <div className="bg-[#0F3557] text-white shadow-inner border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#A9D8F7]">Welcome back,</span>
              {user?.customerId && (
                <span className="bg-[#0057B8]/40 border border-[#A9D8F7]/30 text-[#A9D8F7] text-[11px] font-mono px-2 py-0.5 rounded-md">
                  ID: {user.customerId}
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold font-sans text-white">{user?.fullName}</h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('transfer')}
              className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Make Transfer</span>
            </button>
            <button
              onClick={onOpenSupport}
              className="bg-white/10 hover:bg-white/20 text-[#A9D8F7] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            >
              Need Support?
            </button>
          </div>
        </div>

        {/* KYC Notice Banner if restricted */}
        {(user?.kycStatus === 'Verification Required' || user?.kycStatus === 'Suspended' || account?.kycStatus === 'Verification Required' || account?.kycStatus === 'Suspended') && (
          <div className="bg-amber-500/20 border-y border-amber-500/40 text-amber-200 px-4 py-2 text-xs flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>KYC Action Required:</strong> Your account status is <strong>{user?.kycStatus || account?.kycStatus}</strong>. Outward transfers and withdrawals are restricted until verified.
              </span>
            </div>
            <button
              onClick={onOpenSupport}
              className="bg-amber-500 hover:bg-amber-600 text-black px-2.5 py-1 rounded text-[11px] font-bold transition-colors shrink-0"
            >
              Contact Support
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-2 text-xs font-medium">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'summary' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Account Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('transfer')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'transfer' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Transfers</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'history' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('cards')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'cards' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              onClick={() => setActiveTab('statements')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'statements' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Statements</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'notifications' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications ({notifications.filter(n => !n.read).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'profile' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Profile & Security</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Customer Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Account Notice Alert Banner if not active */}
        {account?.status && account.status !== 'Active' && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-center gap-3 text-amber-900 text-xs shadow-xs">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Account Notice: Status is {account.status}</p>
              <p>
                Your account is currently set to <strong>{account.status}</strong>.{' '}
                {account.status === 'Inactive' || account.status === 'Closed'
                  ? 'Banking transactions and outgoing transfers are currently disabled for this account.'
                  : 'Outgoing transfers and restricted actions are currently blocked. Please contact Nova Trust Bank support if you require assistance.'}
              </p>
            </div>
          </div>
        )}

        {/* ==================== TAB 1: SUMMARY ==================== */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            
            {/* Account Hero Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Account Balance Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0F3557] to-[#0057B8] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs text-[#A9D8F7] font-semibold tracking-wider uppercase">
                      {account?.accountType || 'Checking'} Account
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold font-mono mt-1 text-white">
                      ${account?.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </h2>
                    <p className="text-xs text-[#A9D8F7] mt-1 font-mono">
                      Ledger Balance: ${account?.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                    </p>
                  </div>

                  <span className="bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    {account?.status || 'Active'}
                  </span>
                </div>

                <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#A9D8F7]">
                  <div>
                    <span className="text-white/60 block text-[10px] uppercase">Account Number</span>
                    <span className="text-white font-bold text-sm">{account?.accountNumber}</span>
                  </div>

                  <div>
                    <span className="text-white/60 block text-[10px] uppercase">Routing Number</span>
                    <span className="text-white font-bold text-sm">{account?.routingNumber}</span>
                  </div>

                  <button
                    onClick={() => setActiveTab('transfer')}
                    className="bg-white text-[#0F3557] hover:bg-[#A9D8F7] px-4 py-2 rounded-xl font-sans font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Money</span>
                  </button>
                </div>
              </div>

              {/* Debit Card Widget */}
              {cards.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-[#D9DEE5] shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-[#0F3557]">Nova Trust Debit Card</h3>
                    <button
                      onClick={() => setShowCardDetails(!showCardDetails)}
                      className="text-xs text-[#0057B8] hover:underline flex items-center gap-1 font-medium"
                    >
                      {showCardDetails ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showCardDetails ? 'Hide Details' : 'Reveal Details'}</span>
                    </button>
                  </div>

                  {/* Physical Card Preview */}
                  <div className={`p-4 rounded-2xl text-white shadow-md relative overflow-hidden transition-all ${
                    cards[0].isLocked
                      ? 'bg-gradient-to-r from-gray-700 to-gray-900 opacity-90'
                      : 'bg-gradient-to-r from-[#0F3557] via-[#0057B8] to-[#0F3557]'
                  }`}>
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-xs font-sans tracking-tight">NOVA TRUST</span>
                      <Building2 className="w-5 h-5 text-[#A9D8F7]" />
                    </div>

                    <div className="font-mono text-sm tracking-widest my-2">
                      {showCardDetails ? cards[0].fullCardNumber : cards[0].cardNumber}
                    </div>

                    <div className="flex justify-between items-end text-[10px] font-mono mt-4 text-[#A9D8F7]">
                      <div>
                        <span className="block text-white/60">CARD HOLDER</span>
                        <span className="text-white font-semibold uppercase">{cards[0].cardHolderName}</span>
                      </div>
                      <div>
                        <span className="block text-white/60">EXPIRES</span>
                        <span className="text-white font-semibold">{cards[0].expiryDate}</span>
                      </div>
                      <div>
                        <span className="block text-white/60">CVV</span>
                        <span className="text-white font-semibold">{showCardDetails ? cards[0].cvv : '•••'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D9DEE5] flex items-center justify-between">
                    <span className="text-xs text-[#6E7A87]">Card Status:</span>
                    <button
                      onClick={() => handleToggleCardLock(cards[0].id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        cards[0].isLocked
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      }`}
                    >
                      {cards[0].isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      <span>{cards[0].isLocked ? 'Card Locked' : 'Card Active'}</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Recent Transactions List */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-[#0F3557]">Recent Activity</h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs font-semibold text-[#0057B8] hover:underline"
                >
                  View Full History
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#6E7A87]">No recent transactions logged</div>
              ) : (
                <div className="divide-y divide-[#D9DEE5]">
                  {transactions.slice(0, 5).map(tx => {
                    const isCredit = tx.recipientUserId === user?.id || tx.type === 'Transfer Received' || tx.type === 'Credit Adjustment' || tx.type === 'Initial Deposit';
                    return (
                      <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isCredit ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1E2A36]">
                              {isCredit ? `From: ${tx.senderName || 'Deposit'}` : `To: ${tx.recipientName}`}
                            </p>
                            <p className="text-[11px] text-[#6E7A87] font-mono">{tx.reference} • {new Date(tx.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <span className={`font-mono font-bold text-sm ${isCredit ? 'text-emerald-700' : 'text-[#1E2A36]'}`}>
                          {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 2: TRANSFERS & BENEFICIARIES WORKFLOW ==================== */}
        {activeTab === 'transfer' && (
          <TransferSection
            onTransferComplete={loadCustomerData}
            onReturnToDashboard={() => setActiveTab('summary')}
          />
        )}

        {/* ==================== TAB 3: TRANSACTIONS HISTORY ==================== */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-bold text-base text-[#0F3557]">Full Transaction History</h3>
              
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  placeholder="Search reference or recipient..."
                  className="px-3 py-1.5 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />

                <select
                  value={txTypeFilter}
                  onChange={e => setTxTypeFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white text-[#1E2A36]"
                >
                  <option value="ALL">All Types</option>
                  <option value="Transfer Sent">Transfer Sent</option>
                  <option value="Transfer Received">Transfer Received</option>
                  <option value="Credit Adjustment">Credit Adjustment</option>
                  <option value="Debit Adjustment">Debit Adjustment</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                  <tr>
                    <th className="py-3 px-4">Ref #</th>
                    <th className="py-3 px-4">Counterparty / Sender</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                    <th className="py-3 px-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {filteredTxs.map(tx => {
                    const isCredit = tx.recipientUserId === user?.id || tx.type === 'Transfer Received' || tx.type === 'Credit Adjustment' || tx.type === 'Initial Deposit';
                    return (
                      <tr key={tx.id} className="hover:bg-[#F3F5F7]/50">
                        <td className="py-3 px-4 font-mono font-bold text-[#0057B8]">{tx.reference}</td>
                        <td className="py-3 px-4 font-semibold text-[#1E2A36]">{isCredit ? (tx.senderName || 'Bank Deposit') : tx.recipientName}</td>
                        <td className="py-3 px-4 text-[#6E7A87]">{tx.bankName || 'Nova Trust Bank'}</td>
                        <td className="py-3 px-4 text-[#6E7A87]">{tx.description}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isCredit ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                            {tx.type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-mono font-bold ${isCredit ? 'text-emerald-700' : 'text-[#1E2A36]'}`}>
                          {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#0F3557]">
                          ${(tx.runningBalance ?? account?.balance ?? 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[#6E7A87] text-[11px]">{new Date(tx.createdAt).toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CARDS ==================== */}
        {activeTab === 'cards' && (
          <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-6">
            <h3 className="font-bold text-base text-[#0F3557]">Card Controls & Limits</h3>

            {cards.map(card => (
              <div key={card.id} className="space-y-4">
                <div className={`p-6 rounded-3xl text-white shadow-xl relative overflow-hidden transition-all ${
                  card.isLocked ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-[#0F3557] via-[#0057B8] to-[#0F3557]'
                }`}>
                  <div className="flex justify-between items-center mb-8">
                    <span className="font-bold text-sm tracking-wide">NOVA TRUST BANK</span>
                    <Building2 className="w-6 h-6 text-[#A9D8F7]" />
                  </div>

                  <div className="font-mono text-xl tracking-widest my-4">
                    {showCardDetails ? card.fullCardNumber : card.cardNumber}
                  </div>

                  <div className="flex justify-between items-end text-xs font-mono mt-6 text-[#A9D8F7]">
                    <div>
                      <span className="block text-white/60">CARD HOLDER</span>
                      <span className="text-white font-bold">{card.cardHolderName}</span>
                    </div>
                    <div>
                      <span className="block text-white/60">EXPIRES</span>
                      <span className="text-white font-bold">{card.expiryDate}</span>
                    </div>
                    <div>
                      <span className="block text-white/60">CVV</span>
                      <span className="text-white font-bold">{showCardDetails ? card.cvv : '•••'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5]">
                  <div>
                    <p className="font-semibold text-xs text-[#1E2A36]">Card Security Status</p>
                    <p className="text-[11px] text-[#6E7A87]">
                      {card.isLocked ? 'Transactions temporarily blocked' : 'Card active for online & POS purchases'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleCardLock(card.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                      card.isLocked ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                    }`}
                  >
                    {card.isLocked ? 'Unlock Card' : 'Lock Card'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================== TAB 5: STATEMENTS ==================== */}
        {activeTab === 'statements' && (
          <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#D9DEE5] pb-4">
              <div>
                <h3 className="font-bold text-base text-[#0F3557]">Monthly Bank Statements</h3>
                <p className="text-xs text-[#6E7A87]">Generate official PDF bank statements and print records</p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedStatementMonth}
                  onChange={e => setSelectedStatementMonth(e.target.value)}
                  className="px-3 py-2 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white"
                >
                  <option value="July 2026">July 2026 Statement</option>
                  <option value="June 2026">June 2026 Statement</option>
                  <option value="May 2026">May 2026 Statement</option>
                </select>

                <button
                  onClick={handleDownloadPDFStatement}
                  className="bg-[#0057B8] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#004bb0] shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Statement (PDF)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-[#0F3557] text-[#A9D8F7] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#0057B8] hover:text-white"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Statement</span>
                </button>
              </div>
            </div>

            {/* Printable Statement Layout */}
            <div id="printable-statement" className="p-6 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] space-y-6">
              <div className="flex justify-between items-start border-b border-[#D9DEE5] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-[#0F3557]">NOVA TRUST BANK</h2>
                  <p className="text-xs text-[#6E7A87]">256 Financial Plaza, New York, NY 10005</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-[#0057B8]">STATEMENT: {selectedStatementMonth}</span>
                  <p className="text-[11px] text-[#6E7A87]">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-white p-4 rounded-xl border border-[#D9DEE5]">
                <div>
                  <p className="text-[#6E7A87]">Account Holder:</p>
                  <p className="font-bold text-[#1E2A36]">{user?.fullName}</p>
                  <p className="text-[#6E7A87] mt-1">Account Number:</p>
                  <p className="font-bold text-[#0057B8]">{account?.accountNumber}</p>
                </div>
                <div>
                  <p className="text-[#6E7A87]">Available Balance:</p>
                  <p className="font-bold text-[#0F3557] text-sm">${account?.availableBalance.toFixed(2)}</p>
                  <p className="text-[#6E7A87] mt-1">Routing Number:</p>
                  <p className="font-bold text-[#1E2A36]">{account?.routingNumber}</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-[#D9DEE5] overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F3557] text-[#A9D8F7] uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Ref #</th>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5]">
                    {transactions.map(t => (
                      <tr key={t.id}>
                        <td className="py-2 px-4">{new Date(t.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 px-4 font-mono">{t.reference}</td>
                        <td className="py-2 px-4 text-[#6E7A87]">{t.description}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold">${t.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 6: NOTIFICATIONS ==================== */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <h3 className="font-bold text-base text-[#0F3557]">Account Notifications & Alerts</h3>
              <button
                onClick={handleMarkNotifsRead}
                className="text-xs text-[#0057B8] hover:underline font-semibold"
              >
                Mark All as Read
              </button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-center text-xs text-[#6E7A87] py-6">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                      n.read ? 'bg-white border-[#D9DEE5]' : 'bg-[#A9D8F7]/20 border-[#0057B8]/40'
                    }`}
                  >
                    <Bell className="w-5 h-5 text-[#0057B8] flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-[#0F3557]">{n.title}</p>
                      <p className="text-[#6E7A87] mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-[#6E7A87] mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 7: PROFILE & SECURITY ==================== */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            
            {/* Top Customer Header Card with Profile Picture */}
            <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 flex flex-col md:flex-row items-center gap-6">
              <ProfilePictureUploader
                currentPicture={user?.profilePicture}
                fullName={user?.fullName || 'Customer'}
                onSavePicture={handleSaveProfilePicture}
                onRemovePicture={handleRemoveProfilePicture}
                isEditable={true}
                size="xl"
              />

              <div className="flex-1 text-center md:text-left space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h2 className="text-2xl font-extrabold text-[#0F3557]">{user?.fullName}</h2>
                  <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${
                    account?.status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    account?.status === 'Frozen' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                    account?.status === 'Suspended' ? 'bg-rose-50 text-rose-800 border-rose-300' :
                    'bg-slate-50 text-slate-800 border-slate-300'
                  }`}>
                    {account?.status || 'Active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-[#6E7A87] font-mono">
                  <div>Customer ID: <span className="font-bold text-[#0F3557]">{user?.id}</span></div>
                  <div>Account #: <span className="font-bold text-[#0057B8]">{account?.accountNumber || 'N/A'}</span></div>
                  <div>Account Type: <span className="font-bold text-[#1E2A36]">{account?.accountType || 'Checking'}</span></div>
                </div>

                <p className="text-[11px] text-[#6E7A87] pt-1">
                  Member since {new Date(account?.createdAt || user?.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>

            {/* Profile Grid: Account Details, Personal Information & Password Security */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Card 1: Account Information Summary */}
              <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-base text-[#0F3557] border-b border-[#D9DEE5] pb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#0057B8]" />
                  <span>Account Summary</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Customer ID:</span>
                    <span className="font-mono font-bold text-[#0F3557]">{user?.id}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Account Number:</span>
                    <span className="font-mono font-bold text-[#0057B8]">{account?.accountNumber}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Account Type:</span>
                    <span className="font-bold text-[#1E2A36]">{account?.accountType}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Base Currency:</span>
                    <span className="font-bold text-[#1E2A36]">{account?.currency || 'USD ($)'}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Current Ledger Balance:</span>
                    <span className="font-mono font-bold text-[#0F3557] text-sm">${account?.balance.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Available Balance:</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">${account?.availableBalance.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between py-1.5 border-b border-[#F3F5F7]">
                    <span className="text-[#6E7A87]">Account Status:</span>
                    <span className="font-bold text-[#1E2A36]">{account?.status}</span>
                  </div>

                  <div className="flex justify-between py-1.5">
                    <span className="text-[#6E7A87]">Date Created:</span>
                    <span className="font-mono text-[#1E2A36]">{new Date(account?.createdAt || user?.createdAt || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Editable Personal Contact Information */}
              <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-base text-[#0F3557] border-b border-[#D9DEE5] pb-2 flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0057B8]" />
                  <span>Personal Contact Details</span>
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user?.fullName || ''}
                      className="w-full px-3 py-2 bg-[#F3F5F7] border border-[#D9DEE5] rounded-xl text-[#6E7A87] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Email Address (Primary)</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3 py-2 bg-[#F3F5F7] border border-[#D9DEE5] rounded-xl text-[#6E7A87] font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Username (Login Alias)</label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                      placeholder="e.g. jsmith2026"
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phoneNumber}
                      onChange={e => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileForm.dateOfBirth}
                      onChange={e => setProfileForm({ ...profileForm, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Residential Address</label>
                    <input
                      type="text"
                      value={profileForm.address}
                      onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder="Street, City, State, ZIP"
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0057B8] text-white font-semibold text-xs rounded-xl hover:bg-[#004bb0] transition-colors shadow-xs"
                  >
                    Save Contact Details
                  </button>
                </form>
              </div>

              {/* Card 3: Security & Password */}
              <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
                <h3 className="font-bold text-base text-[#0F3557] border-b border-[#D9DEE5] pb-2 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#0057B8]" />
                  <span>Security & Password</span>
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Current Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">New Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#1E2A36] mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      required
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#0F3557] text-[#A9D8F7] font-semibold text-xs rounded-xl hover:bg-[#0057B8] hover:text-white transition-colors shadow-xs"
                  >
                    Update Account Password
                  </button>
                </form>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
};
