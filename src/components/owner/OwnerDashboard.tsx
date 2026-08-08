import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { ProfilePictureUploader } from '../common/ProfilePictureUploader';
import {
  User,
  Account,
  Transaction,
  SupportConversation,
  SupportMessage,
  AuditLog,
  AccountStatus,
  AccountType,
  Beneficiary,
  TransferCodeRecord
} from '../../types';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  UserPlus,
  Search,
  MoreVertical,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  PlayCircle,
  XCircle,
  KeyRound,
  PlusCircle,
  MinusCircle,
  MessageSquare,
  FileText,
  Activity,
  Settings,
  Copy,
  ExternalLink,
  Paperclip,
  Send,
  Download,
  Pin,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Edit2,
  Trash2,
  Archive,
  Eye,
  Film,
  Upload,
  Ban,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Headphones,
  BookOpen,
  Layers,
  User as UserIcon,
  ArrowLeft,
  X
} from 'lucide-react';

interface OwnerDashboardProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenSupport?: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  activeTab: propActiveTab,
  setActiveTab: propSetActiveTab
}) => {
  const { user, showToast, settings, updateSettings } = useAuth();
  const [internalActiveTab, setInternalActiveTab] = useState<'home' | 'customers' | 'transactions' | 'support' | 'codes' | 'audit' | 'settings' | 'media'>('home');

  const activeTab = (propActiveTab || internalActiveTab) as 'home' | 'customers' | 'transactions' | 'support' | 'codes' | 'audit' | 'settings' | 'media';
  const setActiveTab = (tab: any) => {
    if (propSetActiveTab) {
      propSetActiveTab(tab);
    } else {
      setInternalActiveTab(tab);
    }
  };

  // Bank Settings & Homepage Video State
  const defaultHotlineGreeting = "Welcome to Nova Trust Bank. Thank you for calling our Customer Support Hotline. At this time, live phone support is unavailable. For faster assistance, please contact us through our official WhatsApp or Telegram support channels, where our AI Assistant and Human Support Representatives are available to help you. Thank you for choosing Nova Trust Bank. Goodbye.";

  const [settingsForm, setSettingsForm] = useState({
    whatsappNumber: '',
    telegramUsername: '',
    telegramLink: '',
    supportEmail: '',
    supportPhone: '',
    hotlinePhone: '',
    hotlineGreeting: '',
    officeAddress: '',
    businessHours: ''
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const ownerFileInputRef = React.useRef<HTMLInputElement>(null);

  // Homepage Video Media Management State
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
  const [videoFilename, setVideoFilename] = useState<string>('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings) {
      const tgUser = settings.telegramUsername || '';
      const tgLink = settings.telegramLink || (tgUser.startsWith('http') ? tgUser : `https://t.me/${tgUser.replace('@', '') || 'NovaTrustSupport'}`);
      
      setSettingsForm({
        whatsappNumber: settings.whatsappNumber || '',
        telegramUsername: tgUser,
        telegramLink: tgLink,
        supportEmail: settings.supportEmail || '',
        supportPhone: settings.supportPhone || '',
        hotlinePhone: settings.hotlinePhone || settings.supportPhone || '+1 (800) 555-NOVA',
        hotlineGreeting: settings.hotlineGreeting || defaultHotlineGreeting,
        officeAddress: settings.officeAddress || '100 Financial Plaza, Suite 2800, New York, NY 10005',
        businessHours: settings.businessHours || '24/7 Digital Banking & Support'
      });
      setVideoPreviewUrl(settings.homepageVideoUrl || '');
      setVideoFilename(settings.homepageVideoFilename || '');
    }
  }, [settings]);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    const isExtensionValid = Boolean(file.name.match(/\.(mp4|mov|webm)$/i));
    if (!validTypes.includes(file.type) && !isExtensionValid) {
      showToast('Please upload a valid MP4, MOV, or WEBM video format.', 'error');
      return;
    }

    if (file.size > 35 * 1024 * 1024) {
      showToast('Video file size exceeds 35MB limit. Please select a compressed MP4 or WEBM video file.', 'error');
      return;
    }

    setVideoFile(file);
    setVideoFilename(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setVideoPreviewUrl(reader.result as string);
      showToast(`Video "${file.name}" loaded into preview player. Click "Save & Publish Video" to apply.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveVideo = async () => {
    setIsUploadingVideo(true);
    try {
      await updateSettings({
        ...settingsForm,
        homepageVideoUrl: videoPreviewUrl,
        homepageVideoFilename: videoFilename || 'homepage_promo.mp4'
      });
      showToast('Homepage Promotional Video published successfully! Public homepage has been updated live.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to publish homepage video', 'error');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm('Are you sure you want to delete the homepage promotional video? The public homepage will automatically revert to the institutional default video placeholder.')) {
      return;
    }
    setIsUploadingVideo(true);
    try {
      setVideoPreviewUrl('');
      setVideoFilename('');
      setVideoFile(null);
      await updateSettings({
        ...settingsForm,
        homepageVideoUrl: '',
        homepageVideoFilename: ''
      });
      showToast('Homepage promotional video deleted. Reverted to standard corporate media player.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete video', 'error');
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings({
        ...settingsForm,
        homepageVideoUrl: videoPreviewUrl,
        homepageVideoFilename: videoFilename
      });
      showToast('Bank Contact Parameters & Communication Settings updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to update bank settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // State
  const [customers, setCustomers] = useState<(User & { account?: Account })[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [transferCodes, setTransferCodes] = useState<TransferCodeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerStatusFilter, setCustomerStatusFilter] = useState<string>('ALL');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdCustomerData, setCreatedCustomerData] = useState<any>(null);

  // Processing tracking sets for action buttons
  const [statusProcessingIds, setStatusProcessingIds] = useState<Set<string>>(new Set());
  const [kycProcessingIds, setKycProcessingIds] = useState<Set<string>>(new Set());
  const [deletingCustomerIds, setDeletingCustomerIds] = useState<Set<string>>(new Set());
  const [sendingCodeIds, setSendingCodeIds] = useState<Set<string>>(new Set());

  // Credit / Debit Modal
  const [balanceModal, setBalanceModal] = useState<{
    isOpen: boolean;
    customer: (User & { account?: Account }) | null;
    type: 'CREDIT' | 'DEBIT';
    amount: string;
    description: string;
    isSubmitting?: boolean;
  }>({
    isOpen: false,
    customer: null,
    type: 'CREDIT',
    amount: '',
    description: '',
    isSubmitting: false
  });

  // Edit Customer Modal & Form
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    customer: (User & { account?: Account }) | null;
    isSubmitting?: boolean;
  }>({ isOpen: false, customer: null, isSubmitting: false });

  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    dateOfBirth: '',
    username: '',
    profilePicture: ''
  });

  const handleOpenEditModal = (cust: User & { account?: Account }) => {
    setEditForm({
      fullName: cust.fullName || '',
      email: cust.email || '',
      phoneNumber: cust.phoneNumber || '',
      address: cust.address || '',
      dateOfBirth: cust.dateOfBirth || '',
      username: cust.username || '',
      profilePicture: cust.profilePicture || ''
    });
    setEditModal({ isOpen: true, customer: cust });
  };

  const handleSaveCustomerEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal.customer || editModal.isSubmitting) return;

    const customerId = editModal.customer.id;
    setEditModal(prev => ({ ...prev, isSubmitting: true }));

    // Optimistic UI update
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...editForm } : c));
    if (profileModal.isOpen && profileModal.customer?.id === customerId) {
      setProfileModal(prev => prev.customer ? { ...prev, customer: { ...prev.customer, ...editForm } } : prev);
    }

    try {
      const res = await apiRequest<{ customer: User }>(`/api/admin/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });

      showToast('Customer profile updated successfully', 'success');
      setEditModal({ isOpen: false, customer: null, isSubmitting: false });

      if (res.customer) {
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...res.customer } : c));
        if (profileModal.isOpen && profileModal.customer?.id === customerId) {
          setProfileModal(prev => ({ ...prev, customer: { ...prev.customer, ...res.customer } }));
        }
      }
    } catch (err: any) {
      loadData(false);
      setEditModal(prev => ({ ...prev, isSubmitting: false }));
      showToast(err.message || 'Failed to update customer', 'error');
    }
  };

  // Support Chat state for Owner
  const [selectedConv, setSelectedConv] = useState<SupportConversation | null>(null);
  const [convMessages, setConvMessages] = useState<SupportMessage[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'IN_APP' | 'WHATSAPP' | 'TELEGRAM'>('ALL');

  // Detailed Customer Profile Modal State
  const [profileModal, setProfileModal] = useState<{
    isOpen: boolean;
    customer: (User & { account?: Account }) | null;
    activeSubTab: 'overview' | 'transactions' | 'beneficiaries' | 'support' | 'activity';
  }>({
    isOpen: false,
    customer: null,
    activeSubTab: 'overview'
  });

  const [profileDetails, setProfileDetails] = useState<{
    customer: User;
    account?: Account;
    transactions: Transaction[];
    beneficiaries: Beneficiary[];
    conversation?: SupportConversation;
    messages: SupportMessage[];
    activityHistory: AuditLog[];
  } | null>(null);

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsgText, setProfileMsgText] = useState('');
  const [isSendingProfileMsg, setIsSendingProfileMsg] = useState(false);

  // Create Customer Form state
  const [newCust, setNewCust] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    accountType: 'Checking' as AccountType,
    initialBalance: '10000',
    accountCreatedAt: '2018-03-15',
    generateHistory: true
  });

  // Regenerate Transaction History Modal State
  const [regenModal, setRegenModal] = useState({
    isOpen: false,
    startDate: '2018-03-15',
    targetBalance: '10000'
  });

  // Add Transaction Modal State
  const [addTxModal, setAddTxModal] = useState({
    isOpen: false,
    type: 'Credit' as 'Credit' | 'Debit',
    amount: '',
    description: '',
    bankName: 'JPMorgan Chase',
    counterpartyName: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Edit Transaction Modal State
  const [editTxModal, setEditTxModal] = useState<{
    isOpen: boolean;
    tx: Transaction | null;
    type: 'Credit' | 'Debit';
    amount: string;
    description: string;
    bankName: string;
    counterpartyName: string;
    date: string;
  }>({
    isOpen: false,
    tx: null,
    type: 'Credit',
    amount: '',
    description: '',
    bankName: '',
    counterpartyName: '',
    date: ''
  });

  // Reset Password Modal State
  const [resetPasswordModal, setResetPasswordModal] = useState<{
    isOpen: boolean;
    customer: User | null;
    customPassword: string;
    resultPassword: string | null;
    isSubmitting: boolean;
  }>({
    isOpen: false,
    customer: null,
    customPassword: '',
    resultPassword: null,
    isSubmitting: false
  });

  const loadData = async (showFullLoading = false) => {
    if (showFullLoading) setIsLoading(true);
    try {
      const [custsResult, txsResult, convsResult, auditResult, codesResult] = await Promise.allSettled([
        apiRequest<any[]>('/api/admin/customers'),
        apiRequest<Transaction[]>('/api/admin/transactions'),
        apiRequest<SupportConversation[]>('/api/support/conversations'),
        apiRequest<AuditLog[]>('/api/admin/audit-logs'),
        apiRequest<TransferCodeRecord[]>('/api/admin/transfer-codes')
      ]);

      if (custsResult.status === 'fulfilled') {
        setCustomers(custsResult.value || []);
      } else {
        console.warn('Failed to load customers:', custsResult.reason);
        if (showFullLoading) {
          showToast(custsResult.reason?.message || 'Failed to load customer list', 'error');
        }
      }

      if (txsResult.status === 'fulfilled') {
        setTransactions(txsResult.value || []);
      } else {
        console.warn('Failed to load transactions:', txsResult.reason);
      }

      if (convsResult.status === 'fulfilled') {
        setConversations(convsResult.value || []);
      } else {
        console.warn('Failed to load conversations:', convsResult.reason);
      }

      if (auditResult.status === 'fulfilled') {
        setAuditLogs(auditResult.value || []);
      } else {
        console.warn('Failed to load audit logs:', auditResult.reason);
      }

      if (codesResult.status === 'fulfilled') {
        setTransferCodes(codesResult.value || []);
      } else {
        console.warn('Failed to load transfer codes:', codesResult.reason);
      }
    } catch (e: any) {
      if (showFullLoading) {
        showToast(e.message || 'Failed to load administrative bank data', 'error');
      }
    } finally {
      if (showFullLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateKycStatus = async (customerId: string, status: 'Verified' | 'Verification Required' | 'Suspended') => {
    if (kycProcessingIds.has(customerId)) return;

    const previousCustomers = [...customers];
    const targetCust = customers.find(c => c.id === customerId);
    const previousKyc = targetCust?.kycStatus;

    setKycProcessingIds(prev => new Set(prev).add(customerId));

    // Optimistic UI update
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, kycStatus: status } : c));
    if (profileModal.isOpen && profileModal.customer?.id === customerId) {
      setProfileModal(prev => prev.customer ? { ...prev, customer: { ...prev.customer, kycStatus: status } } : prev);
    }

    try {
      const res = await apiRequest<{ customer: User; account?: Account }>(`/api/admin/customers/${customerId}/kyc-status`, {
        method: 'POST',
        body: JSON.stringify({ kycStatus: status })
      });
      showToast(`KYC status updated to ${status}`, 'success');
      if (res.customer) {
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, ...res.customer } : c));
      }
    } catch (err: any) {
      setCustomers(previousCustomers);
      if (profileModal.isOpen && profileModal.customer?.id === customerId && previousKyc) {
        setProfileModal(prev => prev.customer ? { ...prev, customer: { ...prev.customer, kycStatus: previousKyc } } : prev);
      }
      showToast(err.message || 'Failed to update KYC status', 'error');
    } finally {
      setKycProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  const handleOpenResetPasswordModal = (customer: User) => {
    setResetPasswordModal({
      isOpen: true,
      customer,
      customPassword: '',
      resultPassword: null,
      isSubmitting: false
    });
  };

  const handleAdminResetPassword = async (customerId: string) => {
    const cust = customers.find(c => c.id === customerId);
    if (cust) {
      handleOpenResetPasswordModal(cust);
    } else {
      showToast('Customer account not found', 'error');
    }
  };

  const handleExecuteResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModal.customer) return;

    setResetPasswordModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const res = await apiRequest<{ newPassword: string; temporaryPassword: string }>(
        `/api/admin/customers/${resetPasswordModal.customer.id}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify({ newPassword: resetPasswordModal.customPassword.trim() })
        }
      );

      const updatedPass = res.newPassword || res.temporaryPassword;
      setResetPasswordModal(prev => ({
        ...prev,
        resultPassword: updatedPass,
        isSubmitting: false
      }));
      showToast(`Password successfully updated!`, 'success');
      loadData();
    } catch (err: any) {
      setResetPasswordModal(prev => ({ ...prev, isSubmitting: false }));
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  const handleSendVerificationCode = async (customerId: string) => {
    if (sendingCodeIds.has(customerId)) return;

    setSendingCodeIds(prev => new Set(prev).add(customerId));
    try {
      const res = await apiRequest<any>(`/api/admin/customers/${customerId}/send-verification-code`, {
        method: 'POST'
      });
      showToast(`Verification codes generated for ${res.customerName}: Code 1 (${res.primaryOtp}), Code 2 (${res.secondaryCode})`, 'success');
      // Silently refresh transfer codes list in background
      apiRequest<TransferCodeRecord[]>('/api/admin/transfer-codes').then(codes => setTransferCodes(codes)).catch(() => {});
    } catch (err: any) {
      showToast(err.message || 'Failed to generate verification code', 'error');
    } finally {
      setSendingCodeIds(prev => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  // Poll support messages when active
  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${selectedConv.id}/messages`);
        setConvMessages(msgs);
      } catch (e) {
        // Silent poll error
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedConv]);

  // Handle Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/api/admin/customers', {
        method: 'POST',
        body: JSON.stringify(newCust)
      });

      showToast('Customer account provisioned successfully!', 'success');
      setCreatedCustomerData(res);
      setShowCreateModal(false);
      setNewCust({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        accountType: 'Checking',
        initialBalance: '10000',
        accountCreatedAt: '2018-03-15',
        generateHistory: true
      });
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to create customer', 'error');
    }
  };

  // Open Customer Profile
  const handleOpenCustomerProfile = async (
    customer: User & { account?: Account },
    subTab: 'overview' | 'transactions' | 'beneficiaries' | 'support' | 'activity' = 'overview'
  ) => {
    setProfileModal({
      isOpen: true,
      customer,
      activeSubTab: subTab
    });
    setProfileLoading(true);
    try {
      const details = await apiRequest<any>(`/api/admin/customers/${customer.id}/details`);
      setProfileDetails(details);
    } catch (err: any) {
      showToast(err.message || 'Failed to load customer details', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Send Direct Message from Profile
  const handleSendProfileDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModal.customer || !profileMsgText.trim()) return;

    setIsSendingProfileMsg(true);
    try {
      await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/send-message`, {
        method: 'POST',
        body: JSON.stringify({ text: profileMsgText.trim() })
      });

      showToast('Direct message sent to customer support inbox!', 'success');
      setProfileMsgText('');

      // Refresh customer profile details
      const details = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/details`);
      setProfileDetails(details);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setIsSendingProfileMsg(false);
    }
  };

  // Historical Transaction Action Handlers
  const handleRegenerateHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModal.customer) return;

    try {
      const res = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/regenerate-history`, {
        method: 'POST',
        body: JSON.stringify({
          startDate: regenModal.startDate,
          targetBalance: regenModal.targetBalance
        })
      });

      showToast('Historical transaction history regenerated successfully!', 'success');
      setRegenModal({ ...regenModal, isOpen: false });

      // Refresh details
      const details = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/details`);
      setProfileDetails(details);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to regenerate transaction history', 'error');
    }
  };

  const handleAddTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileModal.customer) return;

    try {
      await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/transactions`, {
        method: 'POST',
        body: JSON.stringify({
          type: addTxModal.type,
          amount: addTxModal.amount,
          description: addTxModal.description,
          bankName: addTxModal.bankName,
          counterpartyName: addTxModal.counterpartyName,
          createdAt: addTxModal.date
        })
      });

      showToast('Transaction entry added and balance updated!', 'success');
      setAddTxModal({
        isOpen: false,
        type: 'Credit',
        amount: '',
        description: '',
        bankName: 'JPMorgan Chase',
        counterpartyName: '',
        date: new Date().toISOString().split('T')[0]
      });

      const details = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/details`);
      setProfileDetails(details);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to add transaction', 'error');
    }
  };

  const handleEditTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTxModal.tx || !profileModal.customer) return;

    try {
      await apiRequest<any>(`/api/admin/transactions/${editTxModal.tx.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          type: editTxModal.type,
          amount: editTxModal.amount,
          description: editTxModal.description,
          bankName: editTxModal.bankName,
          counterpartyName: editTxModal.counterpartyName,
          createdAt: editTxModal.date
        })
      });

      showToast('Transaction updated successfully!', 'success');
      setEditTxModal({ isOpen: false, tx: null, type: 'Credit', amount: '', description: '', bankName: '', counterpartyName: '', date: '' });

      const details = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/details`);
      setProfileDetails(details);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to update transaction', 'error');
    }
  };

  const handleDeleteTransaction = async (txId: string) => {
    if (!profileModal.customer) return;
    if (!window.confirm('Are you sure you want to delete this transaction entry? Running balance will automatically recalculate.')) return;

    try {
      await apiRequest<any>(`/api/admin/transactions/${txId}`, {
        method: 'DELETE'
      });

      showToast('Transaction deleted and balances recalculated!', 'success');

      const details = await apiRequest<any>(`/api/admin/customers/${profileModal.customer.id}/details`);
      setProfileDetails(details);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete transaction', 'error');
    }
  };

  // Handle Account Status Change (Optimistic & Zero Delay)
  const handleStatusChange = async (customerId: string, status: AccountStatus) => {
    if (statusProcessingIds.has(customerId)) return;

    const previousCustomers = [...customers];
    const targetCust = customers.find(c => c.id === customerId);
    const previousStatus = targetCust?.account?.status;

    setStatusProcessingIds(prev => new Set(prev).add(customerId));

    // OPTIMISTIC UPDATE: Update customer account status in local state immediately
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          account: c.account ? { ...c.account, status } : {
            id: 'acc_' + c.id,
            userId: c.id,
            accountNumber: 'N/A',
            routingNumber: '021000021',
            accountType: 'Checking',
            balance: 0,
            availableBalance: 0,
            currency: 'USD',
            status,
            createdAt: c.createdAt
          }
        };
      }
      return c;
    }));

    if (profileModal.isOpen && profileModal.customer?.id === customerId) {
      setProfileModal(prev => prev.customer ? {
        ...prev,
        customer: {
          ...prev.customer,
          account: prev.customer.account ? { ...prev.customer.account, status } : undefined
        }
      } : prev);

      setProfileDetails(prev => prev ? {
        ...prev,
        account: prev.account ? { ...prev.account, status } : undefined
      } : null);
    }

    try {
      const res = await apiRequest<{ account: Account }>(`/api/admin/customers/${customerId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status })
      });

      showToast(`Account status updated to ${status}`, 'success');

      if (res.account) {
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, account: res.account } : c));
        if (profileModal.isOpen && profileModal.customer?.id === customerId) {
          setProfileDetails(prev => prev ? { ...prev, account: res.account } : null);
        }
      }
    } catch (err: any) {
      // ROLLBACK ON ERROR
      setCustomers(previousCustomers);
      if (profileModal.isOpen && profileModal.customer?.id === customerId && previousStatus) {
        setProfileModal(prev => prev.customer ? {
          ...prev,
          customer: {
            ...prev.customer,
            account: prev.customer.account ? { ...prev.customer.account, status: previousStatus } : undefined
          }
        } : prev);
        setProfileDetails(prev => prev ? {
          ...prev,
          account: prev.account ? { ...prev.account, status: previousStatus } : undefined
        } : null);
      }
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setStatusProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  // Handle Balance Credit / Debit
  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModal.customer || balanceModal.isSubmitting) return;

    const numAmount = parseFloat(balanceModal.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    setBalanceModal(prev => ({ ...prev, isSubmitting: true }));
    const customerId = balanceModal.customer.id;
    const isCredit = balanceModal.type === 'CREDIT';

    // OPTIMISTIC UPDATE: adjust balance locally
    setCustomers(prev => prev.map(c => {
      if (c.id === customerId && c.account) {
        const newBal = isCredit ? c.account.balance + numAmount : Math.max(0, c.account.balance - numAmount);
        return { ...c, account: { ...c.account, balance: newBal } };
      }
      return c;
    }));

    if (profileModal.isOpen && profileModal.customer?.id === customerId) {
      setProfileModal(prev => prev.customer?.account ? {
        ...prev,
        customer: {
          ...prev.customer,
          account: {
            ...prev.customer.account,
            balance: isCredit ? prev.customer.account.balance + numAmount : Math.max(0, prev.customer.account.balance - numAmount)
          }
        }
      } : prev);

      if (profileDetails?.account) {
        setProfileDetails(prev => prev ? {
          ...prev,
          account: {
            ...prev.account!,
            balance: isCredit ? prev.account!.balance + numAmount : Math.max(0, prev.account!.balance - numAmount)
          }
        } : null);
      }
    }

    try {
      const res = await apiRequest<{ account?: Account }>(`/api/admin/customers/${customerId}/balance`, {
        method: 'POST',
        body: JSON.stringify({
          amount: balanceModal.amount,
          type: balanceModal.type,
          description: balanceModal.description
        })
      });

      showToast(`Account successfully ${isCredit ? 'credited' : 'debited'}!`, 'success');
      setBalanceModal({ isOpen: false, customer: null, type: 'CREDIT', amount: '', description: '', isSubmitting: false });

      if (res.account) {
        setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, account: res.account } : c));
        if (profileModal.isOpen && profileModal.customer?.id === customerId) {
          setProfileDetails(prev => prev ? { ...prev, account: res.account } : null);
        }
      }
    } catch (err: any) {
      loadData(false);
      setBalanceModal(prev => ({ ...prev, isSubmitting: false }));
      showToast(err.message || 'Balance adjustment failed', 'error');
    }
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async (customerId: string) => {
    if (deletingCustomerIds.has(customerId)) return;
    if (!confirm('WARNING: Deleting a customer account is permanent. Continue?')) return;

    const previousCustomers = [...customers];
    setDeletingCustomerIds(prev => new Set(prev).add(customerId));

    // OPTIMISTICALLY REMOVE
    setCustomers(prev => prev.filter(c => c.id !== customerId));
    if (profileModal.isOpen && profileModal.customer?.id === customerId) {
      setProfileModal({ isOpen: false, customer: null, activeSubTab: 'overview' });
    }

    try {
      await apiRequest(`/api/admin/customers/${customerId}`, { method: 'DELETE' });
      showToast('Customer account deleted', 'info');
    } catch (err: any) {
      setCustomers(previousCustomers);
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeletingCustomerIds(prev => {
        const next = new Set(prev);
        next.delete(customerId);
        return next;
      });
    }
  };

  // Select Support Conversation
  const handleSelectConv = async (conv: SupportConversation) => {
    setSelectedConv(conv);
    try {
      const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conv.id}/messages`);
      setConvMessages(msgs);

      // Mark unread by owner false
      if (conv.unreadByOwner) {
        await apiRequest(`/api/support/conversations/${conv.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ unreadByOwner: false })
        });
        loadData();
      }
    } catch (e) {
      //
    }
  };

  // Real-time Support Polling (Every 2.5s)
  useEffect(() => {
    if (activeTab !== 'support') return;
    const interval = setInterval(async () => {
      try {
        const convs = await apiRequest<SupportConversation[]>('/api/support/conversations');
        setConversations(convs);
        if (selectedConv) {
          const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${selectedConv.id}/messages`);
          setConvMessages(msgs);
        }
      } catch (e) {
        // Ignore background polling errors
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [activeTab, selectedConv]);

  // Handle File Upload from Owner Side
  const handleOwnerFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

    Array.from(files).forEach((file: File) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const isValid = allowedTypes.includes(file.type) || allowedExts.includes(ext);

      if (!isValid) {
        showToast(`File ${file.name} is not a supported format (JPG, JPEG, PNG, WEBP, PDF)`, 'error');
        return;
      }

      if (file.size > 8 * 1024 * 1024) {
        showToast(`File ${file.name} exceeds 8MB size limit`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setReplyAttachments(prev => [
          ...prev,
          {
            id: 'att_' + Math.random().toString(36).substring(2),
            name: file.name,
            type: file.type || (ext === '.pdf' ? 'application/pdf' : 'image/jpeg'),
            url: dataUrl,
            size: file.size
          }
        ]);
        showToast(`Attached ${file.name}`, 'info');
      };
      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const removeOwnerAttachment = (id: string) => {
    setReplyAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Owner Send Support Reply
  const handleSendOwnerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || (!replyText.trim() && replyAttachments.length === 0)) return;

    try {
      const msg = await apiRequest<SupportMessage>('/api/support/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: selectedConv.id,
          text: replyText.trim(),
          attachments: replyAttachments
        })
      });

      setConvMessages(prev => [...prev, msg]);
      setReplyText('');
      setReplyAttachments([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to send reply', 'error');
    }
  };

  // Support Conversation Actions
  const handleConvAction = async (action: 'pin' | 'resolve' | 'unread' | 'archive') => {
    if (!selectedConv) return;
    const updates: any = {};
    if (action === 'pin') updates.isPinned = !selectedConv.isPinned;
    if (action === 'resolve') updates.status = selectedConv.status === 'Resolved' ? 'Open' : 'Resolved';
    if (action === 'archive') updates.status = selectedConv.status === 'Archived' ? 'Open' : 'Archived';
    if (action === 'unread') updates.unreadByOwner = true;

    try {
      const updated = await apiRequest<SupportConversation>(`/api/support/conversations/${selectedConv.id}/status`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      setSelectedConv(updated);
      showToast(`Conversation updated`, 'success');
      loadData();
    } catch (e) {
      showToast('Failed to update conversation', 'error');
    }
  };

  // Filtered Customers
  const filteredCustomers = customers.filter(c => {
    const q = customerSearch.toLowerCase().trim();
    const matchQuery =
      c.fullName.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      (c.account && c.account.accountNumber.includes(q));

    if (customerStatusFilter === 'ALL') return matchQuery;
    return matchQuery && c.account?.status === customerStatusFilter;
  });

  // Calculate Bank Stats
  const totalDeposits = customers.reduce((sum, c) => sum + (c.account?.balance || 0), 0);
  const activeCount = customers.filter(c => c.account?.status === 'Active').length;
  const frozenCount = customers.filter(c => c.account?.status === 'Frozen').length;
  const suspendedCount = customers.filter(c => c.account?.status === 'Suspended').length;

  return (
    <div className="min-h-screen bg-[#F3F5F7] pb-12">
      
      {/* Top Admin Subheader */}
      <div className="bg-[#0F3557] border-t border-white/10 text-white shadow-inner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#A9D8F7]" />
            <div>
              <h1 className="text-sm font-bold tracking-wide uppercase">Nova Trust Bank Management Dashboard</h1>
              <p className="text-[11px] text-[#A9D8F7]">Master Control Center • Owner Access Granted</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Customer Account</span>
            </button>
            <button
              onClick={() => loadData(true)}
              className="bg-white/10 hover:bg-white/20 text-[#A9D8F7] p-1.5 rounded-lg transition-colors"
              title="Refresh Bank Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/10">
          <nav className="flex space-x-2 sm:space-x-6 overflow-x-auto py-2 text-xs font-semibold scrollbar-none flex-nowrap min-w-0 max-w-full">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'home' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Dashboard Home</span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'customers' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Customer Management ({customers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'transactions' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Transactions</span>
            </button>

            <button
              onClick={() => setActiveTab('support')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'support' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Customer Support ({conversations.filter(c => c.unreadByOwner).length} Unread)</span>
            </button>

            <button
              onClick={() => setActiveTab('codes')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'codes' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Transfer Codes {transferCodes.filter(c => c.status === 'PENDING').length > 0 ? `(${transferCodes.filter(c => c.status === 'PENDING').length} Active)` : ''}</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'audit' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'settings' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Bank Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'media' ? 'bg-[#0057B8] text-white' : 'text-[#A9D8F7] hover:bg-white/5'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Homepage Media</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Admin Content Area */}
      <main className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-4 sm:mt-6 max-w-full min-w-0">
        
        {/* ==================== TAB 1: DASHBOARD HOME ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            
            {/* Key Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs flex items-center justify-between min-w-0">
                <div className="min-w-0 flex-1 pr-2">
                  <p className="text-xs font-semibold text-[#6E7A87] uppercase tracking-wider">Total Bank Deposits</p>
                  <p className="text-xl sm:text-2xl font-bold font-mono text-[#0F3557] mt-1 break-all">
                    ${totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#0057B8]/10 text-[#0057B8] p-3 rounded-xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6E7A87] uppercase tracking-wider">Active Customers</p>
                  <p className="text-2xl font-bold text-[#0F3557] mt-1">{activeCount} / {customers.length}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6E7A87] uppercase tracking-wider">Frozen Accounts</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{frozenCount}</p>
                </div>
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
                  <Snowflake className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#6E7A87] uppercase tracking-wider">Total Bank Volume</p>
                  <p className="text-2xl font-bold text-[#0F3557] mt-1">{transactions.length} Txns</p>
                </div>
                <div className="bg-[#A9D8F7]/30 text-[#0F3557] p-3 rounded-xl">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Recent Bank Transactions Table */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs overflow-hidden">
              <div className="p-5 border-b border-[#D9DEE5] flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#0F3557]">Recent Bank Operations & Transactions</h3>
                  <p className="text-xs text-[#6E7A87]">Real-time audit log of customer activities across Nova Trust Bank</p>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs font-semibold text-[#0057B8] hover:underline"
                >
                  View All Transactions
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                    <tr>
                      <th className="py-3 px-4">Reference</th>
                      <th className="py-3 px-4">Sender / Origin</th>
                      <th className="py-3 px-4">Recipient</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5]">
                    {transactions.slice(0, 8).map(tx => (
                      <tr key={tx.id} className="hover:bg-[#F3F5F7]/50">
                        <td className="py-3 px-4 font-mono font-medium text-[#0057B8]">{tx.reference}</td>
                        <td className="py-3 px-4">{tx.senderName || 'System Adjustment'}</td>
                        <td className="py-3 px-4">{tx.recipientName} ({tx.recipientAccountNumber})</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A9D8F7]/30 text-[#0F3557]">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-[#1E2A36]">
                          ${tx.amount.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-[#6E7A87] text-[11px]">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: CUSTOMER MANAGEMENT ==================== */}
        {activeTab === 'customers' && (
          <div className="space-y-4">
            
            {/* Search & Filter Header */}
            <div className="bg-white p-4 rounded-2xl border border-[#D9DEE5] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6E7A87]" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="Search by customer name, email, or 10-digit account number..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={customerStatusFilter}
                  onChange={e => setCustomerStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white text-[#1E2A36]"
                >
                  <option value="ALL">All Account Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Frozen">Frozen Only</option>
                  <option value="Inactive">Deactivated Only</option>
                  <option value="Suspended">Suspended Only</option>
                  <option value="Closed">Closed Only</option>
                </select>

                <button
                  onClick={() => {
                    const link = `${window.location.origin}/login`;
                    navigator.clipboard.writeText(link);
                    showToast(`Customer Login Link copied: ${link}`, 'success');
                  }}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  title="Copy Customer Login Link (https://nova-trust-bank.com/login)"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>Copy Customer Login Link</span>
                </button>

                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Create Customer</span>
                </button>
              </div>
            </div>

            {/* Customer Accounts Table */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs overflow-hidden">
              <div className="overflow-x-auto w-full max-w-full">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0F3557] text-[#A9D8F7] uppercase text-[10px] tracking-wider whitespace-nowrap">
                    <tr>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Customer ID</th>
                      <th className="py-3 px-4">Account Number</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4 text-right">Balance</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">KYC Verification</th>
                      <th className="py-3 px-4">Date Created</th>
                      <th className="py-3 px-4 text-center">Actions & Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9DEE5] whitespace-nowrap">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-[#6E7A87]">
                          No customer accounts found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map(cust => {
                        const acc = cust.account;
                        const statusColors: Record<string, string> = {
                          Active: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                          Frozen: 'bg-amber-100 text-amber-800 border-amber-300',
                          Inactive: 'bg-slate-100 text-slate-800 border-slate-300',
                          Suspended: 'bg-red-100 text-red-800 border-red-300',
                          Closed: 'bg-gray-100 text-gray-800 border-gray-300'
                        };

                        return (
                          <tr key={cust.id} className="hover:bg-[#F3F5F7]/60">
                            <td className="py-3.5 px-4 cursor-pointer" onClick={() => handleOpenCustomerProfile(cust)}>
                              <div className="flex items-center gap-2.5">
                                {cust.profilePicture ? (
                                  <img
                                    src={cust.profilePicture}
                                    alt={cust.fullName}
                                    className="w-8 h-8 rounded-full object-cover border border-[#D9DEE5] shadow-xs flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-[#0F3557] text-[#A9D8F7] font-extrabold text-[10px] flex items-center justify-center shadow-xs flex-shrink-0">
                                    {cust.fullName.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-semibold text-[#1E2A36] hover:text-[#0057B8] transition-colors">
                                    {cust.fullName}
                                  </div>
                                  <div className="text-[11px] text-[#6E7A87] font-mono">{cust.email}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 font-mono text-[11px] text-[#0F3557] font-bold">
                              {cust.id}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-[#0057B8]">
                              {acc ? acc.accountNumber : 'N/A'}
                            </td>

                            <td className="py-3.5 px-4 font-medium text-[#1E2A36]">
                              {acc ? acc.accountType : 'Checking'}
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F3557] text-sm break-all">
                              ${acc ? acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                            </td>

                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[acc?.status || 'Active']}`}>
                                {acc?.status || 'Active'}
                              </span>
                            </td>

                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={cust.kycStatus || 'Verified'}
                                onChange={(e) => handleUpdateKycStatus(cust.id, e.target.value as any)}
                                className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border cursor-pointer focus:outline-none transition-all ${
                                  (cust.kycStatus || 'Verified') === 'Verified' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                                  (cust.kycStatus) === 'Verification Required' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                  'bg-rose-50 text-rose-800 border-rose-300'
                                }`}
                              >
                                <option value="Verified">Verified ✓</option>
                                <option value="Verification Required">Required ⚠</option>
                                <option value="Suspended">Suspended 🚫</option>
                              </select>
                            </td>

                            <td className="py-3.5 px-4 text-[#6E7A87] text-[11px]">
                              {new Date(cust.createdAt).toLocaleDateString()}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center justify-center gap-1.5 flex-wrap max-w-md">
                                
                                {/* View Full Profile Button */}
                                <button
                                  onClick={() => handleOpenCustomerProfile(cust)}
                                  className="px-2.5 py-1 bg-[#0057B8] text-white hover:bg-[#004bb0] rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-[#0057B8] shadow-xs"
                                  title="View Full Detailed Customer Profile"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Profile</span>
                                </button>

                                {/* Edit Customer Profile Button */}
                                <button
                                  onClick={() => handleOpenEditModal(cust)}
                                  className="px-2.5 py-1 bg-white text-[#0F3557] hover:bg-[#F3F5F7] rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-[#D9DEE5]"
                                  title="Edit Customer Details & Profile Photo"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#0057B8]" />
                                  <span>Edit Details</span>
                                </button>

                                {/* Credit / Debit Balance */}
                                <button
                                  onClick={() => setBalanceModal({
                                    isOpen: true,
                                    customer: cust,
                                    type: 'CREDIT',
                                    amount: '',
                                    description: ''
                                  })}
                                  className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-emerald-200"
                                  title="Credit Account Balance"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>Credit</span>
                                </button>

                                <button
                                  onClick={() => setBalanceModal({
                                    isOpen: true,
                                    customer: cust,
                                    type: 'DEBIT',
                                    amount: '',
                                    description: ''
                                  })}
                                  className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-rose-200"
                                  title="Debit Account Balance"
                                >
                                  <MinusCircle className="w-3.5 h-3.5" />
                                  <span>Debit</span>
                                </button>

                                {/* Account Freeze Toggle */}
                                {acc?.status === 'Frozen' ? (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Active')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-amber-300 disabled:opacity-50"
                                    title="Unfreeze Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                    <span>Unfreeze</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Frozen')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-amber-200 disabled:opacity-50"
                                    title="Freeze Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Snowflake className="w-3.5 h-3.5" />}
                                    <span>Freeze</span>
                                  </button>
                                )}

                                {/* Account Deactivate Toggle */}
                                {acc?.status === 'Inactive' ? (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Active')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-emerald-200 disabled:opacity-50"
                                    title="Activate Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span>Activate</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Inactive')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-slate-300 disabled:opacity-50"
                                    title="Deactivate Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Ban className="w-3.5 h-3.5" />}
                                    <span>Deactivate</span>
                                  </button>
                                )}

                                {/* Account Suspend Toggle */}
                                {acc?.status === 'Suspended' ? (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Active')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-emerald-200 disabled:opacity-50"
                                    title="Reactivate Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    <span>Reactivate</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(cust.id, 'Suspended')}
                                    disabled={statusProcessingIds.has(cust.id)}
                                    className="px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-red-200 disabled:opacity-50"
                                    title="Suspend Account"
                                  >
                                    {statusProcessingIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                                    <span>Suspend</span>
                                  </button>
                                )}

                                {/* Reset Password */}
                                <button
                                  onClick={() => handleAdminResetPassword(cust.id)}
                                  className="px-2 py-1 bg-blue-50 text-[#0057B8] hover:bg-blue-100 rounded-lg text-[11px] font-semibold flex items-center gap-1 border border-blue-200"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Reset Pass</span>
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => handleDeleteCustomer(cust.id)}
                                  disabled={deletingCustomerIds.has(cust.id)}
                                  className="p-1 bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700 rounded-lg border border-gray-200 disabled:opacity-50"
                                  title="Delete Customer"
                                >
                                  {deletingCustomerIds.has(cust.id) ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                </button>

                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 3: TRANSACTIONS ==================== */}
        {activeTab === 'transactions' && (
          <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F3557]">Bank-Wide Transaction Audit Ledger</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                  <tr>
                    <th className="py-3 px-4">Ref #</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-[#F3F5F7]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0057B8]">{tx.reference}</td>
                      <td className="py-3 px-4">{tx.senderName || 'Internal System'}</td>
                      <td className="py-3 px-4">{tx.recipientName} ({tx.recipientAccountNumber})</td>
                      <td className="py-3 px-4 text-[#6E7A87]">{tx.description}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[#0F3557]">
                        ${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-[#6E7A87] text-[11px]">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 4: CUSTOMER SUPPORT CHAT ==================== */}
        {activeTab === 'support' && (
          <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs overflow-hidden h-[680px] grid grid-cols-1 md:grid-cols-3 max-w-full min-w-0">
            
            {/* Conversations List */}
            <div className={`border-r border-[#D9DEE5] bg-[#F3F5F7] flex flex-col h-full overflow-hidden ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-[#D9DEE5] bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0F3557]">Customer Support Inbox</h3>
                  <span className="text-[10px] bg-[#0057B8]/10 text-[#0057B8] font-bold px-2 py-0.5 rounded-full">
                    Multi-Channel
                  </span>
                </div>
                <p className="text-xs text-[#6E7A87]">Synchronized inquiries across Web, WhatsApp & Telegram</p>

                {/* Channel Filter Pills */}
                <div className="flex items-center gap-1 pt-1 overflow-x-auto text-[11px] no-scrollbar">
                  {[
                    { key: 'ALL', label: 'All', icon: '📥' },
                    { key: 'IN_APP', label: 'Website', icon: '🌐' },
                    { key: 'WHATSAPP', label: 'WhatsApp', icon: '💬' },
                    { key: 'TELEGRAM', label: 'Telegram', icon: '✈️' }
                  ].map(ch => (
                    <button
                      key={ch.key}
                      onClick={() => setChannelFilter(ch.key as any)}
                      className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                        channelFilter === ch.key
                          ? 'bg-[#0057B8] text-white font-bold shadow-xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{ch.icon}</span>
                      <span>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#D9DEE5]">
                {conversations.filter(c => channelFilter === 'ALL' || (c.channel || 'IN_APP') === channelFilter).length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6E7A87]">No support tickets found for this channel</div>
                ) : (
                  conversations
                    .filter(c => channelFilter === 'ALL' || (c.channel || 'IN_APP') === channelFilter)
                    .map(c => {
                      const ch = c.channel || 'IN_APP';
                      const channelBadge = ch === 'WHATSAPP' ? { label: 'WhatsApp', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '💬' }
                        : ch === 'TELEGRAM' ? { label: 'Telegram', bg: 'bg-sky-100 text-sky-800 border-sky-300', icon: '✈️' }
                        : { label: 'Website', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '🌐' };

                      return (
                        <div
                          key={c.id}
                          onClick={() => handleSelectConv(c)}
                          className={`p-3.5 cursor-pointer transition-colors ${
                            selectedConv?.id === c.id ? 'bg-white border-l-4 border-[#0057B8]' : 'hover:bg-white/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="font-semibold text-xs text-[#1E2A36] truncate">{c.customerName}</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border flex items-center gap-0.5 shrink-0 ${channelBadge.bg}`}>
                                <span>{channelBadge.icon}</span>
                                <span>{channelBadge.label}</span>
                              </span>
                            </div>
                            {c.unreadByOwner && (
                              <span className="bg-[#0057B8] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                UNREAD
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#0057B8] font-mono truncate">Acc: {c.customerAccountNumber}</p>
                          <p className="text-xs text-[#6E7A87] truncate mt-1">{c.lastMessageText}</p>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

            {/* Selected Conversation Workspace */}
            <div className={`md:col-span-2 flex-col h-full bg-white ${selectedConv ? 'flex' : 'hidden md:flex'}`}>
              {selectedConv ? (
                <>
                  {/* Conv Header */}
                  <div className="p-4 border-b border-[#D9DEE5] flex items-center justify-between bg-[#0F3557] text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <button
                        onClick={() => setSelectedConv(null)}
                        className="md:hidden px-2 py-1 bg-white/10 hover:bg-white/20 text-[#A9D8F7] hover:text-white rounded-lg text-xs font-semibold shrink-0"
                      >
                        ← Inbox
                      </button>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm truncate">{selectedConv.customerName}</h4>
                          {/* Channel Indicator Badge */}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 shrink-0 ${
                            (selectedConv.channel || 'IN_APP') === 'WHATSAPP' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' :
                            (selectedConv.channel || 'IN_APP') === 'TELEGRAM' ? 'bg-sky-500/20 text-sky-300 border-sky-400/40' :
                            'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                          }`}>
                            {(selectedConv.channel || 'IN_APP') === 'WHATSAPP' ? '💬 WhatsApp Channel' :
                             (selectedConv.channel || 'IN_APP') === 'TELEGRAM' ? '✈️ Telegram Channel' :
                             '🌐 Website Channel'}
                          </span>
                          {selectedConv.verifiedForHuman ? (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-400/30 flex items-center gap-1 shrink-0">
                              ✓ Identity Verified
                            </span>
                          ) : selectedConv.mode === 'AI_ASSISTANT' ? (
                            <span className="bg-sky-500/20 text-sky-300 text-[10px] font-bold px-2 py-0.5 rounded border border-sky-400/30 shrink-0">
                              🤖 AI Mode
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-[#A9D8F7] font-mono truncate">
                          {selectedConv.customerEmail} • Account #{selectedConv.customerAccountNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleConvAction('pin')}
                        className={`p-1.5 rounded hover:bg-white/10 ${selectedConv.isPinned ? 'text-amber-300' : 'text-[#A9D8F7]'}`}
                        title="Pin Conversation"
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleConvAction('resolve')}
                        className="px-2.5 py-1 bg-[#0057B8] text-white text-xs font-medium rounded hover:bg-[#004bb0]"
                      >
                        {selectedConv.status === 'Resolved' ? 'Reopen' : 'Mark Resolved'}
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto bg-[#F3F5F7] space-y-3">
                    {convMessages.map(msg => {
                      const isOwner = msg.senderRole === 'OWNER';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}>
                          <span className="text-[10px] text-[#6E7A87] mb-1">
                            {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${isOwner ? 'bg-[#0057B8] text-white' : 'bg-white text-[#1E2A36] border border-[#D9DEE5]'}`}>
                            {msg.text}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mt-2.5 space-y-2 border-t border-white/20 pt-2">
                                {msg.attachments.map(att => {
                                  const isImage = att.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(att.name);
                                  if (isImage) {
                                    return (
                                      <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 bg-black/5 max-w-[260px] shadow-xs">
                                        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block relative group">
                                          <img
                                            src={att.url}
                                            alt={att.name}
                                            className="w-full max-h-52 object-cover rounded-t-xl hover:opacity-95 transition-opacity"
                                          />
                                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1">
                                            <Eye className="w-4 h-4" />
                                            <span>View Image</span>
                                          </div>
                                        </a>
                                        <div className={`p-1.5 flex items-center justify-between text-[10px] ${isOwner ? 'bg-black/20 text-white' : 'bg-gray-100 text-[#1E2A36]'}`}>
                                          <span className="truncate max-w-[150px] font-mono">{att.name}</span>
                                          <a
                                            href={att.url}
                                            download={att.name}
                                            className="p-1 hover:text-emerald-400 transition-colors flex items-center gap-0.5"
                                            title="Download Image"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </a>
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div
                                        key={att.id}
                                        className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border text-xs ${
                                          isOwner ? 'bg-white/15 border-white/20 text-white' : 'bg-[#F3F5F7] border-[#D9DEE5] text-[#1E2A36]'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 truncate">
                                          <div className="p-1.5 bg-rose-500/20 text-rose-500 rounded-lg shrink-0">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                          <div className="truncate">
                                            <p className="font-semibold text-[11px] font-mono truncate">{att.name}</p>
                                            <p className="text-[9px] opacity-75 font-mono">{att.size ? (att.size / 1024).toFixed(0) + ' KB' : 'PDF Document'}</p>
                                          </div>
                                        </div>
                                        <a
                                          href={att.url}
                                          download={att.name}
                                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                                            isOwner ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[#0057B8] text-white hover:bg-[#004bb0]'
                                          }`}
                                          title="Download PDF"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span>Download</span>
                                        </a>
                                      </div>
                                    );
                                  }
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pending Owner Attachments */}
                  {replyAttachments.length > 0 && (
                    <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#D9DEE5] flex flex-wrap gap-2">
                      {replyAttachments.map(att => {
                        const isImage = att.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(att.name);
                        return (
                          <div key={att.id} className="flex items-center gap-2 bg-white border border-[#D9DEE5] px-2.5 py-1.5 rounded-xl text-xs shadow-xs">
                            {isImage ? (
                              <img src={att.url} alt={att.name} className="w-5 h-5 rounded object-cover border border-gray-200" />
                            ) : (
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            )}
                            <span className="truncate max-w-[120px] font-mono text-[10px] font-semibold">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => removeOwnerAttachment(att.id)}
                              className="p-1 hover:bg-rose-50 text-rose-600 rounded"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Reply Input */}
                  <form onSubmit={handleSendOwnerReply} className="p-3 border-t border-[#D9DEE5] flex items-center gap-2">
                    <input
                      type="file"
                      ref={ownerFileInputRef}
                      onChange={handleOwnerFileUpload}
                      className="hidden"
                      accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                      multiple
                    />
                    <button
                      type="button"
                      onClick={() => ownerFileInputRef.current?.click()}
                      className="p-2.5 text-gray-500 hover:text-[#0057B8] hover:bg-gray-100 rounded-xl transition-colors"
                      title="Attach JPG, PNG, WEBP or PDF"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="Type official bank support response..."
                      className="flex-1 bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-gray-500 font-sans shadow-xs"
                    />
                    <button type="submit" className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors">
                      <Send className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-[#6E7A87]">
                  <MessageSquare className="w-12 h-12 text-[#0057B8] mb-2" />
                  <p className="text-sm font-semibold">Select a customer conversation to manage support</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB: TRANSFER CODES (SENT TO ADMIN) ==================== */}
        {activeTab === 'codes' && (
          <div className="space-y-4">
            
            {/* Header Banner */}
            <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-200">
                  <KeyRound className="w-6 h-6 text-[#0057B8]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F3557]">Secondary Transfer Verification Codes</h3>
                  <p className="text-xs text-[#6E7A87]">
                    Live authorization passcodes issued during customer wire transfer requests. Identified by customer account name.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(true)}
                  className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Refresh Codes</span>
                </button>
              </div>
            </div>

            {/* Transfer Codes List Table */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs overflow-hidden">
              <div className="p-4 bg-[#0F3557] text-[#A9D8F7] flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Active & Recent Verification Passcodes Issued ({transferCodes.length})</span>
                </div>
                <div className="text-[11px] text-[#A9D8F7]">
                  Pending Codes: {transferCodes.filter(c => c.status === 'PENDING').length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F5F7FA] text-[#5E6C84] uppercase text-[10px] tracking-wider border-b border-[#DCE3EC]">
                    <tr>
                      <th className="py-3.5 px-4">Type</th>
                      <th className="py-3.5 px-4">Customer Name &amp; Email</th>
                      <th className="py-3.5 px-4">Account Number</th>
                      <th className="py-3.5 px-4">Recipient</th>
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Code 1 (OTP)</th>
                      <th className="py-3.5 px-4">Code 2</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Date &amp; Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DCE3EC]">
                    {transferCodes.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-[#5E6C84]">
                          <div className="max-w-xs mx-auto space-y-2">
                            <KeyRound className="w-8 h-8 text-[#0F4C81] mx-auto opacity-50" />
                            <p className="font-semibold text-xs text-[#172B4D]">No verification codes in audit queue</p>
                            <p className="text-[11px] text-[#5E6C84]">
                              When a customer logs in or initiates a wire transfer, their 6-digit authorization codes and audit history will appear here.
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      transferCodes.map(item => {
                        const isPending = item.status === 'PENDING';
                        const isLoginOtp = item.codeType === 'LOGIN_OTP';
                        return (
                          <tr key={item.id} className={`hover:bg-[#F5F7FA]/60 ${isPending ? 'bg-indigo-50/30' : ''}`}>
                            <td className="py-3.5 px-4">
                              {isLoginOtp ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-purple-100 text-purple-800 border border-purple-300">
                                  Login OTP
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-300">
                                  Wire Transfer
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#172B4D] text-xs">{item.userName}</div>
                              <div className="text-[10px] text-[#5E6C84]">{item.userEmail}</div>
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-[#0F4C81]">
                              {item.accountNumber || 'N/A'}
                            </td>

                            <td className="py-3.5 px-4 font-semibold text-[#172B4D]">
                              {isLoginOtp ? <span className="text-gray-400">—</span> : (item.recipientName || 'External Recipient')}
                            </td>

                            <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                              {isLoginOtp ? <span className="text-gray-400">—</span> : `$${(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-950 font-mono font-black text-sm rounded-lg border border-amber-300 shadow-xs">
                                  {item.primaryOtp}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.primaryOtp);
                                    showToast(`Copied Code 1 (${item.primaryOtp})`, 'success');
                                  }}
                                  className="p-1 text-[#0F4C81] hover:bg-[#0F4C81]/10 rounded"
                                  title="Copy Code 1"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              {item.secondaryCode ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="px-3 py-1 bg-[#0B1F3A] text-[#D4AF37] font-mono font-black text-sm rounded-lg border border-[#0F4C81] shadow-xs">
                                    {item.secondaryCode}
                                  </span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.secondaryCode!);
                                      showToast(`Copied Code 2 (${item.secondaryCode})`, 'success');
                                    }}
                                    className="p-1 text-[#0F4C81] hover:bg-[#0F4C81]/10 rounded"
                                    title="Copy Code 2"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {item.status === 'PENDING' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                                  <Clock className="w-3 h-3" />
                                  <span>Pending</span>
                                </span>
                              ) : item.status === 'VERIFIED' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Verified</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-300">
                                  <span>Expired</span>
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-[#5E6C84] text-[11px] font-mono">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 5: AUDIT LOGS ==================== */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
            <h3 className="text-base font-bold text-[#0F3557]">System Security Audit Trail</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9DEE5]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#F3F5F7]/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F3557]">{log.action}</td>
                      <td className="py-3 px-4">{log.userEmail || 'System'}</td>
                      <td className="py-3 px-4 text-[#6E7A87] max-w-xs truncate">{log.details}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#6E7A87]">{log.ipAddress}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#6E7A87] text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ==================== TAB 6: SETTINGS ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6 max-w-4xl">
            {/* Hidden Video File Input */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoFileChange}
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              className="hidden"
            />

            {/* Homepage Media Management Panel */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#0057B8]" />
                    <h3 className="text-base font-bold text-[#0F3557]">Homepage Media & Promotional Video Management</h3>
                  </div>
                  <p className="text-xs text-[#6E7A87] mt-1">
                    Manage the promotional video displayed on the public homepage. Upload, replace, preview, or remove video. Supported formats: MP4, MOV, WEBM.
                  </p>
                </div>
                
                <div className="shrink-0">
                  {videoPreviewUrl ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Custom Video Active ({videoFilename || 'Uploaded Video'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Default Media Placeholder Active
                    </span>
                  )}
                </div>
              </div>

              {/* Video Player & Preview Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F3557]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0057B8]" />
                    Homepage Promotional Video Preview
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 font-normal">Formats: MP4, MOV, WEBM (Max 35MB)</span>
                </div>

                <div className="bg-[#0A0D12] rounded-2xl overflow-hidden border border-[#2A3241] aspect-video relative flex items-center justify-center group shadow-md">
                  {videoPreviewUrl ? (
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                        <Film className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Default Corporate Overview Video</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          No custom video has been saved. The public homepage displays the standard Nova Trust institutional media overview.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{videoPreviewUrl ? 'Replace Video' : 'Upload New Video'}</span>
                  </button>

                  {videoPreviewUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteVideo}
                      disabled={isUploadingVideo}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Delete Video</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveVideo}
                  disabled={isUploadingVideo}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] text-[#0A0D12] text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUploadingVideo ? 'Publishing Changes...' : 'Save & Publish Video'}</span>
                </button>
              </div>
            </div>

            {/* Customer Communication & Contact Channels */}
            <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F3557]">Customer Support & Multi-Channel AI Controls</h3>
                  <p className="text-xs text-[#6E7A87]">Configure official WhatsApp, Telegram, and Nova Trust Support Hotline parameters.</p>
                </div>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase">
                  Live Global Controls
                </span>
              </div>

              {/* Dedicated Nova Trust Hotline Configuration Section */}
              <div className="bg-[#F8FAFC] border border-[#0057B8]/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#0057B8] text-white rounded-xl shadow-xs">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F3557]">Nova Trust Bank Support Hotline Settings</h4>
                      <p className="text-[11px] text-[#6E7A87]">Configure automated phone hotline number & audio greeting directive.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettingsForm({ ...settingsForm, hotlineGreeting: defaultHotlineGreeting })}
                    className="text-[11px] font-semibold text-[#0057B8] hover:underline"
                  >
                    Reset Default Greeting
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Hotline Phone Number */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-[#1E2A36]">
                      Hotline Phone Number <span className="text-[#0057B8] font-mono">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.hotlinePhone}
                      onChange={e => setSettingsForm({ ...settingsForm, hotlinePhone: e.target.value })}
                      placeholder="+1 (800) 555-NOVA"
                      className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-mono shadow-xs"
                      required
                    />
                    <p className="text-[10px] text-[#6E7A87]">Official phone number displayed to callers for support.</p>
                  </div>

                  {/* WhatsApp Support Number */}
                  <div className="space-y-1.5">
                    <label className="block font-semibold text-[#1E2A36]">
                      WhatsApp Support Number <span className="text-emerald-600 font-mono">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.whatsappNumber}
                      onChange={e => setSettingsForm({ ...settingsForm, whatsappNumber: e.target.value })}
                      placeholder="+1 (800) 555-0199"
                      className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-mono shadow-xs"
                      required
                    />
                    <p className="text-[10px] text-[#6E7A87]">WhatsApp account number with country code (e.g. +18005550199)</p>
                  </div>

                  {/* Telegram Support Link */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block font-semibold text-[#1E2A36]">
                      Telegram Support Link / Handle <span className="text-sky-600 font-mono">*</span>
                    </label>
                    <input
                      type="text"
                      value={settingsForm.telegramLink}
                      onChange={e => setSettingsForm({ ...settingsForm, telegramLink: e.target.value, telegramUsername: e.target.value })}
                      placeholder="https://t.me/NovaTrustSupport or @NovaTrustSupport"
                      className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-mono shadow-xs"
                      required
                    />
                    <p className="text-[10px] text-[#6E7A87]">Direct Telegram link or username (e.g. https://t.me/NovaTrustSupport)</p>
                  </div>

                  {/* Automated Hotline Greeting Message */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block font-semibold text-[#1E2A36]">
                      Automated Hotline Greeting Message <span className="text-amber-600 font-mono">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={settingsForm.hotlineGreeting}
                      onChange={e => setSettingsForm({ ...settingsForm, hotlineGreeting: e.target.value })}
                      className="w-full bg-white text-black caret-black p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 text-xs shadow-xs font-sans"
                      required
                    />
                    <p className="text-[10px] text-[#6E7A87]">
                      Played automatically when callers ring the Nova Trust Hotline before transferring them to WhatsApp or Telegram.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Support Email */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1E2A36]">Official Support Email</label>
                  <input
                    type="email"
                    value={settingsForm.supportEmail}
                    onChange={e => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                    placeholder="support@novatrustbank.com"
                    className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-sans shadow-xs"
                  />
                </div>

                {/* General Desk Phone */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1E2A36]">General Inquiry Desk Phone</label>
                  <input
                    type="text"
                    value={settingsForm.supportPhone}
                    onChange={e => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    placeholder="+1 (800) 555-NOVA"
                    className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-mono shadow-xs"
                  />
                </div>

                {/* Headquarters Office Address */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1E2A36]">Headquarters / Contact Address</label>
                  <input
                    type="text"
                    value={settingsForm.officeAddress}
                    onChange={e => setSettingsForm({ ...settingsForm, officeAddress: e.target.value })}
                    placeholder="100 Financial Plaza, Suite 2800, New York, NY 10005"
                    className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-sans shadow-xs"
                  />
                </div>

                {/* Business Hours */}
                <div className="space-y-1.5">
                  <label className="block font-semibold text-[#1E2A36]">Operating Business Hours</label>
                  <input
                    type="text"
                    value={settingsForm.businessHours}
                    onChange={e => setSettingsForm({ ...settingsForm, businessHours: e.target.value })}
                    placeholder="24/7 Digital Banking & Priority Support"
                    className="w-full bg-white text-black caret-black px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 font-sans shadow-xs"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="bg-[#0057B8] hover:bg-[#004bb0] text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSavingSettings ? 'Saving Parameters...' : 'Save Communication Settings'}
                </button>
              </div>
            </form>

            {/* Institutional Security Parameters */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-4">
              <h3 className="text-base font-bold text-[#0F3557]">Nova Trust Bank Operational Parameters</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-[#F3F5F7] rounded-xl border border-[#D9DEE5] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#1E2A36]">Bank Routing Number</p>
                    <p className="text-[#6E7A87] font-mono">021000021 (Federal Reserve Routing System)</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">VERIFIED</span>
                </div>

                <div className="p-3.5 bg-[#F3F5F7] rounded-xl border border-[#D9DEE5] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#1E2A36]">Internal Transfer Engine</p>
                    <p className="text-[#6E7A87]">OTP Email Authentication Enabled ($0.00 Transaction Fee)</p>
                  </div>
                  <span className="bg-blue-100 text-[#0057B8] font-bold px-2.5 py-1 rounded-full text-[10px]">ACTIVE</span>
                </div>

                <div className="p-3.5 bg-[#F3F5F7] rounded-xl border border-[#D9DEE5] flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-[#1E2A36]">Security Enforcement</p>
                    <p className="text-[#6E7A87]">256-Bit SSL Encryption • Audit Logs Enabled</p>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB 7: HOMEPAGE MEDIA MANAGEMENT ==================== */}
        {activeTab === 'media' && (
          <div className="space-y-6 max-w-4xl">
            {/* Hidden Video File Input */}
            <input
              type="file"
              ref={videoInputRef}
              onChange={handleVideoFileChange}
              accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
              className="hidden"
            />

            {/* Homepage Media Management Panel */}
            <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Film className="w-5 h-5 text-[#0057B8]" />
                    <h3 className="text-base font-bold text-[#0F3557]">Homepage Media & Promotional Video Management</h3>
                  </div>
                  <p className="text-xs text-[#6E7A87] mt-1">
                    Manage the promotional video displayed on the public homepage. Upload, replace, preview, or remove video. Supported formats: MP4, MOV, WEBM.
                  </p>
                </div>
                
                <div className="shrink-0">
                  {videoPreviewUrl ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Custom Video Active ({videoFilename || 'Uploaded Video'})
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 text-xs font-semibold px-3 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      Default Media Placeholder Active
                    </span>
                  )}
                </div>
              </div>

              {/* Video Player & Preview Container */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-[#0F3557]">
                  <span className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#0057B8]" />
                    Homepage Promotional Video Preview
                  </span>
                  <span className="text-[11px] font-mono text-gray-500 font-normal">Formats: MP4, MOV, WEBM (Max 35MB)</span>
                </div>

                <div className="bg-[#0A0D12] rounded-2xl overflow-hidden border border-[#2A3241] aspect-video relative flex items-center justify-center group shadow-md">
                  {videoPreviewUrl ? (
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      className="w-full h-full object-contain rounded-2xl"
                    />
                  ) : (
                    <div className="text-center p-6 space-y-3">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#D4AF37]">
                        <Film className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Default Corporate Overview Video</h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                          No custom video has been saved. The public homepage displays the standard Nova Trust institutional media overview.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={isUploadingVideo}
                    className="bg-[#0057B8] hover:bg-[#004bb0] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{videoPreviewUrl ? 'Replace Video' : 'Upload New Video'}</span>
                  </button>

                  {videoPreviewUrl && (
                    <button
                      type="button"
                      onClick={handleDeleteVideo}
                      disabled={isUploadingVideo}
                      className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Delete Video</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveVideo}
                  disabled={isUploadingVideo}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] text-[#0A0D12] text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUploadingVideo ? 'Publishing Changes...' : 'Save & Publish Video'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ==================== MODAL: CREATE CUSTOMER ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#D9DEE5] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-[#D9DEE5] pb-3">
              <h3 className="text-base font-bold text-[#0F3557]">Provision New Customer Account</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6E7A87] hover:text-[#1E2A36]">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newCust.fullName}
                  onChange={e => setNewCust({ ...newCust, fullName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newCust.email}
                    onChange={e => setNewCust({ ...newCust, email: e.target.value })}
                    placeholder="sarah@example.com"
                    className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Initial Login Password *</label>
                  <input
                    type="text"
                    required
                    value={newCust.password || ''}
                    onChange={e => setNewCust({ ...newCust, password: e.target.value })}
                    placeholder="e.g. SecurePass2026!"
                    className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-xl focus:outline-none focus:border-[#0057B8] font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newCust.phoneNumber}
                    onChange={e => setNewCust({ ...newCust, phoneNumber: e.target.value })}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Account Creation Date *</label>
                  <input
                    type="date"
                    required
                    value={newCust.accountCreatedAt}
                    onChange={e => setNewCust({ ...newCust, accountCreatedAt: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Account Type *</label>
                  <select
                    value={newCust.accountType}
                    onChange={e => setNewCust({ ...newCust, accountType: e.target.value as AccountType })}
                    className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white"
                  >
                    <option value="Checking">Checking Account</option>
                    <option value="Savings">Savings Account</option>
                    <option value="Business">Business Account</option>
                    <option value="High-Yield">High-Yield Savings</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Initial Deposit ($) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={newCust.initialBalance}
                    onChange={e => setNewCust({ ...newCust, initialBalance: e.target.value })}
                    className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Residential Address</label>
                <input
                  type="text"
                  value={newCust.address}
                  onChange={e => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="123 Bank Street, Suite 400"
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="pt-3 border-t border-[#D9DEE5] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-medium text-[#6E7A87] hover:bg-[#F3F5F7] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-[#0057B8] hover:bg-[#004bb0] rounded-xl shadow-xs"
                >
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATED CUSTOMER CREDENTIALS ==================== */}
      {createdCustomerData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9DEE5] space-y-4">
            <div className="flex items-center gap-3 text-emerald-600">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <h3 className="font-bold text-base text-[#0F3557]">Account Provisioned Successfully!</h3>
                <p className="text-xs text-[#6E7A87]">System generated credentials and account details</p>
              </div>
            </div>

            <div className="bg-[#F3F5F7] p-4 rounded-xl border border-[#D9DEE5] space-y-2 text-xs font-mono">
              <div>
                <span className="text-[#6E7A87]">Customer Name:</span>
                <span className="font-bold text-[#1E2A36] ml-2">{createdCustomerData.customer.fullName}</span>
              </div>

              <div>
                <span className="text-[#6E7A87]">10-Digit Account #:</span>
                <span className="font-bold text-[#0057B8] ml-2">{createdCustomerData.account.accountNumber}</span>
              </div>

              <div>
                <span className="text-[#6E7A87]">Routing #:</span>
                <span className="font-bold text-[#1E2A36] ml-2">{createdCustomerData.account.routingNumber}</span>
              </div>

              <div>
                <span className="text-[#6E7A87]">Temporary Password:</span>
                <span className="font-bold text-amber-700 ml-2">{createdCustomerData.temporaryPassword}</span>
              </div>
            </div>

            <p className="text-xs text-[#6E7A87]">
              Share the login link below with the customer so they can sign in to Online Banking:
            </p>

            <div className="p-3 bg-[#A9D8F7]/30 border border-[#A9D8F7] rounded-xl flex items-center justify-between text-xs font-mono text-[#0F3557]">
              <span>{window.location.origin.includes('run.app') || window.location.origin.includes('localhost') ? 'https://novatrustbank.web.app/login' : `${window.location.origin}/login`}</span>
              <button
                onClick={() => {
                  const targetUrl = window.location.origin.includes('run.app') || window.location.origin.includes('localhost') ? 'https://novatrustbank.web.app/login' : `${window.location.origin}/login`;
                  navigator.clipboard.writeText(targetUrl);
                  showToast('Login URL copied to clipboard!', 'success');
                }}
                className="p-1 hover:bg-[#A9D8F7] rounded"
                title="Copy Link"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setCreatedCustomerData(null)}
              className="w-full py-2.5 bg-[#0057B8] text-white text-xs font-semibold rounded-xl hover:bg-[#004bb0]"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREDIT / DEBIT BALANCE ==================== */}
      {balanceModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9DEE5]">
            <h3 className="text-base font-bold text-[#0F3557] mb-1">
              {balanceModal.type === 'CREDIT' ? 'Credit' : 'Debit'} Customer Account
            </h3>
            <p className="text-xs text-[#6E7A87] mb-4">
              Customer: <span className="font-semibold text-[#1E2A36]">{balanceModal.customer?.fullName}</span> (Acc: {balanceModal.customer?.account?.accountNumber})
            </p>

            <form onSubmit={handleBalanceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Adjustment Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={balanceModal.amount}
                  onChange={e => setBalanceModal({ ...balanceModal, amount: e.target.value })}
                  placeholder="e.g. 500.00"
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Description / Memo</label>
                <input
                  type="text"
                  value={balanceModal.description}
                  onChange={e => setBalanceModal({ ...balanceModal, description: e.target.value })}
                  placeholder="e.g. Approved Promotional Credit or Wire Deposit Adjustment"
                  className="w-full px-3 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModal({ isOpen: false, customer: null, type: 'CREDIT', amount: '', description: '' })}
                  className="px-4 py-2 font-medium text-[#6E7A87] hover:bg-[#F3F5F7] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={balanceModal.isSubmitting}
                  className={`px-5 py-2 font-semibold text-white rounded-xl flex items-center gap-2 disabled:opacity-50 ${
                    balanceModal.type === 'CREDIT' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {balanceModal.isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{balanceModal.isSubmitting ? 'Processing...' : `Process ${balanceModal.type === 'CREDIT' ? 'Credit' : 'Debit'}`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== DETAILED CUSTOMER PROFILE FULL-SCREEN MANAGEMENT PAGE ==================== */}
      {profileModal.isOpen && profileModal.customer && (
        <div className="fixed inset-0 z-50 bg-[#F5F7FA] overflow-y-auto w-full h-full flex flex-col font-sans">
          <div className="min-h-screen bg-[#F5F7FA] flex flex-col w-full">
            
            {/* Top Executive Navigation Bar */}
            <div className="bg-[#0B1F3A] text-white px-4 sm:px-8 py-4 border-b border-[#0F4C81] flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40 shadow-md">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setProfileModal({ isOpen: false, customer: null, activeSubTab: 'overview' })}
                  className="px-3.5 py-2 bg-[#0F4C81] hover:bg-[#0057B8] text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/10 transition-colors shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
                  <span>Back to Customer Directory</span>
                </button>

                <div className="flex items-center gap-3">
                  {profileModal.customer.profilePicture ? (
                    <img
                      src={profileModal.customer.profilePicture}
                      alt={profileModal.customer.fullName}
                      className="w-11 h-11 rounded-xl object-cover border-2 border-[#D4AF37]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#0057B8] text-white font-extrabold text-base flex items-center justify-center border border-white/20">
                      {profileModal.customer.fullName.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold text-white">{profileModal.customer.fullName}</h1>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        (profileDetails?.account?.status || profileModal.customer.account?.status) === 'Active' ? 'bg-emerald-500 text-white' :
                        (profileDetails?.account?.status || profileModal.customer.account?.status) === 'Frozen' ? 'bg-amber-500 text-white' :
                        (profileDetails?.account?.status || profileModal.customer.account?.status) === 'Suspended' ? 'bg-rose-600 text-white' :
                        'bg-slate-500 text-white'
                      }`}>
                        {profileDetails?.account?.status || profileModal.customer.account?.status || 'Active'}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        (profileModal.customer.kycStatus || 'Verified') === 'Verified' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        (profileModal.customer.kycStatus) === 'Verification Required' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}>
                        KYC: {profileModal.customer.kycStatus || 'Verified'}
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] font-mono mt-0.5">
                      Customer ID: <span className="text-white font-bold">{profileModal.customer.id}</span> • Account #: <span className="text-white font-bold">{profileDetails?.account?.accountNumber || profileModal.customer.account?.accountNumber || 'N/A'}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditModal(profileModal.customer!)}
                  className="px-3.5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => setProfileModal({ isOpen: false, customer: null, activeSubTab: 'overview' })}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                  title="Close Full Screen Profile"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prominent Action Buttons Header */}
            <div className="bg-[#F3F5F7] p-4 border-b border-[#D9DEE5]">
              <p className="text-[11px] font-bold uppercase text-[#6E7A87] tracking-wider mb-2.5">
                Owner Administrative Actions & Account Controls
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {/* Freeze / Unfreeze */}
                {profileDetails?.account?.status === 'Frozen' ? (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Active')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                    <span>Unfreeze Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Frozen')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin text-amber-700" /> : <Snowflake className="w-4 h-4 text-amber-700" />}
                    <span>Freeze Account</span>
                  </button>
                )}

                {/* Suspend / Unsuspend */}
                {profileDetails?.account?.status === 'Suspended' ? (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Active')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Unsuspend Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Suspended')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin text-rose-700" /> : <XCircle className="w-4 h-4 text-rose-700" />}
                    <span>Suspend Account</span>
                  </button>
                )}

                {/* Deactivate / Activate */}
                {profileDetails?.account?.status === 'Inactive' ? (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Active')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Activate Account</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(profileModal.customer!.id, 'Inactive')}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin text-slate-700" /> : <Ban className="w-4 h-4 text-slate-700" />}
                    <span>Deactivate Account</span>
                  </button>
                )}

                {/* Credit Account */}
                <button
                  onClick={() => setBalanceModal({
                    isOpen: true,
                    customer: profileModal.customer,
                    type: 'CREDIT',
                    amount: '',
                    description: ''
                  })}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  <span>Credit Account</span>
                </button>

                {/* Debit Account */}
                <button
                  onClick={() => setBalanceModal({
                    isOpen: true,
                    customer: profileModal.customer,
                    type: 'DEBIT',
                    amount: '',
                    description: ''
                  })}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <MinusCircle className="w-4 h-4 text-rose-600" />
                  <span>Debit Account</span>
                </button>

                {/* Reset Password */}
                <button
                  onClick={() => handleAdminResetPassword(profileModal.customer!.id)}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-[#0057B8] border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <KeyRound className="w-4 h-4 text-[#0057B8]" />
                  <span>Reset Password</span>
                </button>

                {/* Copy Customer Login Link */}
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/login`;
                    navigator.clipboard.writeText(link);
                    showToast(`Customer Login Link copied: ${link}`, 'success');
                  }}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  title="Copy customer login portal link (https://nova-trust-bank.com/login)"
                >
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>Copy Login Link</span>
                </button>

                {/* Send Message */}
                <button
                  onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'support' })}
                  className="px-3.5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send Message</span>
                </button>

                {/* Send Verification Code */}
                <button
                  onClick={() => handleSendVerificationCode(profileModal.customer!.id)}
                  disabled={sendingCodeIds.has(profileModal.customer.id)}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {sendingCodeIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin text-purple-600" /> : <ShieldAlert className="w-4 h-4 text-purple-600" />}
                  <span>Send Verification Code</span>
                </button>

                {/* KYC Status Select Controls */}
                <div className="flex items-center gap-1.5 bg-white border border-[#D9DEE5] px-2.5 py-1 rounded-xl">
                  <span className="text-[11px] font-bold text-gray-600">KYC Status:</span>
                  <select
                    value={profileModal.customer.kycStatus || profileDetails?.account?.kycStatus || 'Verified'}
                    disabled={kycProcessingIds.has(profileModal.customer.id)}
                    onChange={(e) => handleUpdateKycStatus(profileModal.customer!.id, e.target.value as any)}
                    className="text-xs font-bold text-[#0F3557] bg-transparent focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="Verified">Verified</option>
                    <option value="Verification Required">Verification Required</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>

                {/* Close Account */}
                {profileDetails?.account?.status !== 'Closed' && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to CLOSE the account for ${profileModal.customer?.fullName}?`)) {
                        handleStatusChange(profileModal.customer!.id, 'Closed');
                      }
                    }}
                    disabled={statusProcessingIds.has(profileModal.customer.id)}
                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {statusProcessingIds.has(profileModal.customer.id) ? <RefreshCw className="w-4 h-4 animate-spin text-gray-600" /> : <XCircle className="w-4 h-4 text-gray-600" />}
                    <span>Close Account</span>
                  </button>
                )}

              </div>
            </div>

            {/* Customer Profile Subtabs */}
            <div className="border-b border-[#D9DEE5] bg-white px-6 pt-3 flex space-x-4 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'overview' })}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  profileModal.activeSubTab === 'overview' ? 'border-[#0057B8] text-[#0057B8]' : 'border-transparent text-[#6E7A87] hover:text-[#1E2A36]'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Profile Overview</span>
              </button>

              <button
                onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'transactions' })}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  profileModal.activeSubTab === 'transactions' ? 'border-[#0057B8] text-[#0057B8]' : 'border-transparent text-[#6E7A87] hover:text-[#1E2A36]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Recent Transactions ({profileDetails?.transactions?.length || 0})</span>
              </button>

              <button
                onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'beneficiaries' })}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  profileModal.activeSubTab === 'beneficiaries' ? 'border-[#0057B8] text-[#0057B8]' : 'border-transparent text-[#6E7A87] hover:text-[#1E2A36]'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Saved Beneficiaries ({profileDetails?.beneficiaries?.length || 0})</span>
              </button>

              <button
                onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'support' })}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  profileModal.activeSubTab === 'support' ? 'border-[#0057B8] text-[#0057B8]' : 'border-transparent text-[#6E7A87] hover:text-[#1E2A36]'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Support Conversation</span>
              </button>

              <button
                onClick={() => setProfileModal({ ...profileModal, activeSubTab: 'activity' })}
                className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  profileModal.activeSubTab === 'activity' ? 'border-[#0057B8] text-[#0057B8]' : 'border-transparent text-[#6E7A87] hover:text-[#1E2A36]'
                }`}
              >
                <Activity className="w-4 h-4" />
                <span>Activity History ({profileDetails?.activityHistory?.length || 0})</span>
              </button>
            </div>

            {/* Modal Subtab Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#F3F5F7]">
              {profileLoading ? (
                <div className="py-12 text-center text-[#6E7A87] flex flex-col items-center justify-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#0057B8] mb-2" />
                  <p className="text-xs font-semibold">Loading customer record...</p>
                </div>
              ) : (
                <>
                  {/* SUBTAB 1: OVERVIEW */}
                  {profileModal.activeSubTab === 'overview' && (
                    <div className="space-y-6">
                      
                      {/* Financial Metrics Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-2xl border border-[#D9DEE5] shadow-xs">
                          <p className="text-[10px] font-bold uppercase text-[#6E7A87] tracking-wider">Current Balance</p>
                          <p className="text-2xl font-bold font-mono text-[#0F3557] mt-1">
                            ${profileDetails?.account?.balance.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-[10px] text-[#6E7A87] mt-1">Available for transactions</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-[#D9DEE5] shadow-xs">
                          <p className="text-[10px] font-bold uppercase text-[#6E7A87] tracking-wider">Account Type</p>
                          <p className="text-lg font-bold text-[#1E2A36] mt-1">
                            {profileDetails?.account?.accountType || 'Checking'}
                          </p>
                          <p className="text-[10px] text-[#6E7A87] mt-1">Routing #: {profileDetails?.account?.routingNumber || '021000021'}</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-[#D9DEE5] shadow-xs">
                          <p className="text-[10px] font-bold uppercase text-[#6E7A87] tracking-wider">Account Status</p>
                          <p className="text-lg font-bold text-[#1E2A36] mt-1 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              profileDetails?.account?.status === 'Active' ? 'bg-emerald-500' :
                              profileDetails?.account?.status === 'Frozen' ? 'bg-amber-500' :
                              profileDetails?.account?.status === 'Suspended' ? 'bg-rose-500' : 'bg-slate-400'
                            }`} />
                            {profileDetails?.account?.status || 'Active'}
                          </p>
                          <p className="text-[10px] text-[#6E7A87] mt-1">Created: {new Date(profileModal.customer.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Customer Details Cards Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Personal Information */}
                        <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs space-y-3">
                          <h3 className="font-bold text-sm text-[#0F3557] border-b border-[#D9DEE5] pb-2 flex items-center gap-1.5">
                            <UserIcon className="w-4 h-4 text-[#0057B8]" />
                            <span>Personal Information</span>
                          </h3>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Full Legal Name:</span>
                              <span className="font-bold text-[#1E2A36]">{profileModal.customer.fullName}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Customer ID:</span>
                              <span className="font-mono font-bold text-[#0F3557]">{profileModal.customer.id}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Email Address:</span>
                              <span className="font-mono text-[#0057B8]">{profileModal.customer.email}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Phone Number:</span>
                              <span className="font-semibold text-[#1E2A36]">{profileModal.customer.phoneNumber || 'Not provided'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Date of Birth:</span>
                              <span className="font-semibold text-[#1E2A36]">{profileModal.customer.dateOfBirth || 'Not provided'}</span>
                            </div>

                            <div className="flex justify-between py-1">
                              <span className="text-[#6E7A87]">Residential Address:</span>
                              <span className="font-semibold text-[#1E2A36] text-right max-w-[200px]">{profileModal.customer.address || 'Not provided'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Banking Parameters */}
                        <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs space-y-3">
                          <h3 className="font-bold text-sm text-[#0F3557] border-b border-[#D9DEE5] pb-2 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#0057B8]" />
                            <span>Account Details & Security</span>
                          </h3>

                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">10-Digit Account Number:</span>
                              <span className="font-mono font-bold text-[#0057B8]">{profileDetails?.account?.accountNumber || 'N/A'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Bank Routing Number:</span>
                              <span className="font-mono font-bold text-[#1E2A36]">{profileDetails?.account?.routingNumber || '021000021'}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Account Type:</span>
                              <span className="font-semibold text-[#1E2A36]">{profileDetails?.account?.accountType}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Role:</span>
                              <span className="font-semibold text-[#1E2A36]">{profileModal.customer.role}</span>
                            </div>

                            <div className="flex justify-between py-1 border-b border-[#F3F5F7]">
                              <span className="text-[#6E7A87]">Account Opened:</span>
                              <span className="font-semibold text-[#1E2A36]">{new Date(profileModal.customer.createdAt).toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between py-1">
                              <span className="text-[#6E7A87]">Two-Factor Authentication:</span>
                              <span className="font-bold text-emerald-600">OTP Email Enforcement</span>
                            </div>

                            <button
                              onClick={() => handleOpenResetPasswordModal(profileModal.customer!)}
                              className="mt-3 w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#0057B8] border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Reset Active Login Password</span>
                            </button>
                          </div>
                        </div>

                      </div>

                    </div>
                  )}

                  {/* SUBTAB 2: TRANSACTIONS */}
                  {profileModal.activeSubTab === 'transactions' && (
                    <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs space-y-4">
                      <h3 className="font-bold text-sm text-[#0F3557]">Customer Transaction History</h3>
                      
                      {profileDetails?.transactions?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#6E7A87]">
                          No transactions recorded for this customer yet.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                              <tr>
                                <th className="py-2.5 px-3">Ref #</th>
                                <th className="py-2.5 px-3">Type</th>
                                <th className="py-2.5 px-3">Sender</th>
                                <th className="py-2.5 px-3">Recipient</th>
                                <th className="py-2.5 px-3">Description</th>
                                <th className="py-2.5 px-3 text-right">Amount</th>
                                <th className="py-2.5 px-3">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D9DEE5]">
                              {profileDetails?.transactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-[#F3F5F7]/60">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#0057B8]">{tx.reference}</td>
                                  <td className="py-2.5 px-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#A9D8F7]/30 text-[#0F3557]">
                                      {tx.type}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3">{tx.senderName || 'System'}</td>
                                  <td className="py-2.5 px-3">{tx.recipientName} ({tx.recipientAccountNumber})</td>
                                  <td className="py-2.5 px-3 text-[#6E7A87]">{tx.description}</td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-[#0F3557]">
                                    ${tx.amount.toFixed(2)}
                                  </td>
                                  <td className="py-2.5 px-3 text-[#6E7A87] text-[11px]">
                                    {new Date(tx.createdAt).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBTAB 3: SAVED BENEFICIARIES */}
                  {profileModal.activeSubTab === 'beneficiaries' && (
                    <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs space-y-4">
                      <h3 className="font-bold text-sm text-[#0F3557]">Saved Beneficiaries Directory</h3>

                      {profileDetails?.beneficiaries?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#6E7A87]">
                          This customer has not saved any external or internal beneficiaries yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {profileDetails?.beneficiaries.map(ben => (
                            <div key={ben.id} className="p-4 bg-[#F3F5F7] rounded-xl border border-[#D9DEE5] space-y-1.5 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-[#1E2A36] text-sm">{ben.name}</span>
                                {ben.nickname && (
                                  <span className="bg-[#0057B8] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                    {ben.nickname}
                                  </span>
                                )}
                              </div>
                              <p className="font-mono text-[#0057B8]">Account #: {ben.accountNumber}</p>
                              <p className="text-[#6E7A87]">Bank: {ben.bankName}</p>
                              <p className="text-[10px] text-[#6E7A87]">Added: {new Date(ben.createdAt).toLocaleDateString()}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SUBTAB 4: CUSTOMER SUPPORT CONVERSATION & DIRECT MESSAGING */}
                  {profileModal.activeSubTab === 'support' && (
                    <div className="bg-white rounded-2xl border border-[#D9DEE5] shadow-xs overflow-hidden flex flex-col h-[500px]">
                      
                      {/* Subtab Support Header */}
                      <div className="p-3.5 bg-[#0F3557] text-white flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs">Direct Support Workspace • {profileModal.customer.fullName}</h4>
                          <p className="text-[11px] text-[#A9D8F7] font-mono">
                            Messages sent here deliver immediately to customer support inbox
                          </p>
                        </div>
                      </div>

                      {/* Message History Container */}
                      <div className="flex-1 p-4 overflow-y-auto bg-[#F3F5F7] space-y-3">
                        {profileDetails?.messages?.length === 0 ? (
                          <div className="p-8 text-center text-xs text-[#6E7A87]">
                            No previous messages in this conversation. Start a conversation below!
                          </div>
                        ) : (
                          profileDetails?.messages.map(msg => {
                            const isOwner = msg.senderRole === 'OWNER';
                            return (
                              <div key={msg.id} className={`flex flex-col ${isOwner ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] text-[#6E7A87] mb-1">
                                  {msg.senderName} ({msg.senderRole}) • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className={`p-3 rounded-2xl max-w-[80%] text-xs ${isOwner ? 'bg-[#0057B8] text-white' : 'bg-white text-[#1E2A36] border border-[#D9DEE5]'}`}>
                                  {msg.text}
                                  {msg.attachments && msg.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1.5 pt-2 border-t border-gray-200/40">
                                      {msg.attachments.map(att => (
                                        <a
                                          key={att.id}
                                          href={att.url}
                                          download={att.name}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs font-mono underline hover:opacity-80"
                                        >
                                          <Download className="w-3.5 h-3.5 flex-shrink-0" />
                                          <span className="truncate">{att.name}</span>
                                        </a>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Direct Message Form */}
                      <form onSubmit={handleSendProfileDirectMessage} className="p-3 bg-white border-t border-[#D9DEE5] flex gap-2">
                        <input
                          type="text"
                          required
                          value={profileMsgText}
                          onChange={e => setProfileMsgText(e.target.value)}
                          placeholder="Type a direct message to send to customer's support inbox..."
                          className="flex-1 bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-gray-500 font-sans shadow-xs"
                        />
                        <button
                          type="submit"
                          disabled={isSendingProfileMsg}
                          className="bg-[#0057B8] hover:bg-[#004bb0] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isSendingProfileMsg ? 'Sending...' : 'Send Message'}</span>
                        </button>
                      </form>

                    </div>
                  )}

                  {/* SUBTAB 5: ACTIVITY HISTORY / AUDIT LOGS */}
                  {profileModal.activeSubTab === 'activity' && (
                    <div className="bg-white p-5 rounded-2xl border border-[#D9DEE5] shadow-xs space-y-4">
                      <h3 className="font-bold text-sm text-[#0F3557]">Customer Security & Activity Trail</h3>

                      {profileDetails?.activityHistory?.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#6E7A87]">
                          No activity logs found for this user account.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#F3F5F7] text-[#6E7A87] uppercase text-[10px] tracking-wider border-b border-[#D9DEE5]">
                              <tr>
                                <th className="py-2.5 px-3">Action</th>
                                <th className="py-2.5 px-3">Details</th>
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Timestamp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D9DEE5]">
                              {profileDetails?.activityHistory.map(log => (
                                <tr key={log.id} className="hover:bg-[#F3F5F7]/60">
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#0F3557]">{log.action}</td>
                                  <td className="py-2.5 px-3 text-[#6E7A87]">{log.details}</td>
                                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#6E7A87]">{log.ipAddress}</td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                      {log.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-[#6E7A87] text-[11px]">{new Date(log.timestamp).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ==================== MODAL: EDIT CUSTOMER PROFILE ==================== */}
      {editModal.isOpen && editModal.customer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 border border-[#D9DEE5] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0F3557]">Edit Customer Profile</h3>
                <p className="text-xs text-[#6E7A87]">Update customer information & profile picture</p>
              </div>
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, customer: null })}
                className="p-1.5 text-[#6E7A87] hover:bg-[#F3F5F7] rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Profile Picture Uploader for Owner View */}
            <div className="flex justify-center py-2 bg-[#F3F5F7] rounded-2xl p-4 border border-[#D9DEE5]">
              <ProfilePictureUploader
                currentPicture={editForm.profilePicture}
                fullName={editForm.fullName || 'Customer'}
                onSavePicture={async (base64) => {
                  setEditForm(prev => ({ ...prev, profilePicture: base64 }));
                }}
                onRemovePicture={async () => {
                  setEditForm(prev => ({ ...prev, profilePicture: '' }));
                }}
                isEditable={true}
                size="lg"
              />
            </div>

            <form onSubmit={handleSaveCustomerEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Username (Login Alias)</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={e => setEditForm({ ...editForm, username: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#1E2A36] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editForm.dateOfBirth}
                    onChange={e => setEditForm({ ...editForm, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E2A36] mb-1">Residential Address</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D9DEE5]">
                <button
                  type="button"
                  onClick={() => setEditModal({ isOpen: false, customer: null })}
                  className="px-4 py-2 border border-[#D9DEE5] text-[#1E2A36] font-semibold text-xs rounded-xl hover:bg-[#F3F5F7]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSubmitting}
                  className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
                >
                  {editModal.isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editModal.isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== RESET PASSWORD OVERRIDE MODAL ==================== */}
      {resetPasswordModal.isOpen && resetPasswordModal.customer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#D9DEE5] space-y-5 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <div className="flex items-center gap-2 text-[#0F3557]">
                <div className="p-2 bg-blue-50 text-[#0057B8] rounded-xl border border-blue-100">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Reset Customer Password</h3>
                  <p className="text-xs text-[#6E7A87]">Bank Administration Security Override</p>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordModal({ isOpen: false, customer: null, customPassword: '', resultPassword: null, isSubmitting: false })}
                className="text-[#6E7A87] hover:text-[#1E2A36] p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetPasswordModal.resultPassword ? (
              /* Success Screen */
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-sm text-emerald-900">Password Successfully Reset</h4>
                  <p className="text-xs text-emerald-700">
                    The active password for <span className="font-bold">{resetPasswordModal.customer.fullName}</span> ({resetPasswordModal.customer.email}) has been updated.
                  </p>
                </div>

                <div className="p-3.5 bg-[#F3F5F7] border border-[#D9DEE5] rounded-xl space-y-1">
                  <p className="text-[10px] uppercase font-bold text-[#6E7A87]">New Active Login Password:</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-bold text-[#0F3557] select-all">
                      {resetPasswordModal.resultPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(resetPasswordModal.resultPassword!);
                        showToast('New password copied to clipboard!', 'success');
                      }}
                      className="px-3 py-1.5 bg-[#0057B8] text-white hover:bg-[#004bb0] rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#6E7A87] bg-blue-50/50 p-3 rounded-xl border border-blue-100 space-y-1">
                  <p className="font-bold text-[#0F3557]">Operational Confirmation:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li>The customer can immediately log into the bank portal with this new password.</li>
                    <li>An automated security notification was sent to the customer's inbox.</li>
                    <li>This action was permanently recorded in the administrative audit log.</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => setResetPasswordModal({ isOpen: false, customer: null, customPassword: '', resultPassword: null, isSubmitting: false })}
                  className="w-full py-2.5 bg-[#0F3557] text-white font-semibold text-xs rounded-xl hover:bg-[#0A243D] transition-colors"
                >
                  Close &amp; Return
                </button>
              </div>
            ) : (
              /* Form Screen */
              <form onSubmit={handleExecuteResetPassword} className="space-y-4">
                <div className="p-3 bg-[#F3F5F7] rounded-xl border border-[#D9DEE5] text-xs space-y-1">
                  <p className="text-[#6E7A87]">Target Customer Account:</p>
                  <p className="font-bold text-[#1E2A36] text-sm">{resetPasswordModal.customer.fullName}</p>
                  <p className="font-mono text-[#0057B8]">{resetPasswordModal.customer.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F3557] mb-1">
                    New Password <span className="text-[#6E7A87] font-normal">(Leave empty to auto-generate)</span>
                  </label>
                  <input
                    type="text"
                    value={resetPasswordModal.customPassword}
                    onChange={e => setResetPasswordModal({ ...resetPasswordModal, customPassword: e.target.value })}
                    placeholder="e.g. Nova9821! or leave blank"
                    className="w-full bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20 placeholder:text-gray-500 font-mono shadow-xs"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const auto = 'Nova' + Math.floor(1000 + Math.random() * 9000) + '!';
                      setResetPasswordModal({ ...resetPasswordModal, customPassword: auto });
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold flex items-center gap-1 border border-gray-300 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
                    <span>Auto-Generate</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-[#D9DEE5]">
                  <button
                    type="button"
                    onClick={() => setResetPasswordModal({ isOpen: false, customer: null, customPassword: '', resultPassword: null, isSubmitting: false })}
                    className="px-4 py-2 border border-[#D9DEE5] rounded-xl text-xs font-semibold text-[#1E2A36] hover:bg-[#F3F5F7] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetPasswordModal.isSubmitting}
                    className="px-5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{resetPasswordModal.isSubmitting ? 'Updating...' : 'Confirm Reset Password'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
