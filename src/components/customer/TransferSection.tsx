import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { Beneficiary, Transaction } from '../../types';
import { jsPDF } from 'jspdf';
import {
  Send,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  ArrowRight,
  ShieldCheck,
  Mail,
  Clock,
  RefreshCw,
  Download,
  Share2,
  X,
  FileText,
  DollarSign,
  ChevronDown,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

interface TransferSectionProps {
  onTransferComplete?: () => void;
  onReturnToDashboard?: () => void;
}

const POPULAR_BANKS = [
  'Nova Trust Bank',
  'JPMorgan Chase',
  'Bank of America',
  'Wells Fargo',
  'Citigroup',
  'Capital One',
  'TD Bank',
  'U.S. Bank',
  'PNC Bank',
  'Truist',
  'Fifth Third Bank',
  'KeyBank',
  'Citizens Bank'
];

type WorkflowStep =
  | 'FORM' // Transfer form & beneficiary selection
  | 'VALIDATING_PROCESSING' // First progress bar
  | 'OTP_VERIFICATION' // Primary 6-digit OTP code entry (First Transfer Verification Code)
  | 'SECOND_VALIDATING_PROCESSING' // Second progress bar animation
  | 'SECOND_VERIFICATION' // Secondary 6-digit verification code entry (Second Transfer Verification Code)
  | 'FINAL_PROCESSING' // Final clearing settlement screen
  | 'SUCCESS'; // Successful receipt screen

export const TransferSection: React.FC<TransferSectionProps> = ({
  onTransferComplete,
  onReturnToDashboard
}) => {
  const { user, account, refreshUser, showToast } = useAuth();

  const maskEmail = (emailStr?: string) => {
    if (!emailStr || !emailStr.includes('@')) return 'your registered email address';
    const [name, domain] = emailStr.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    const firstTwo = name.slice(0, 2);
    const lastOne = name.slice(-1);
    const asterisks = '*'.repeat(Math.max(3, name.length - 3));
    return `${firstTwo}${asterisks}${lastOne}@${domain}`;
  };

  // Active Tab: "transfer" or "beneficiaries"
  const [activeSubTab, setActiveSubTab] = useState<'transfer' | 'beneficiaries'>('transfer');

  // Workflow Step
  const [step, setStep] = useState<WorkflowStep>('FORM');

  // Beneficiaries State
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);

  // Beneficiary Modal State
  const [showAddBenModal, setShowAddBenModal] = useState(false);
  const [editingBen, setEditingBen] = useState<Beneficiary | null>(null);
  const [benForm, setBenForm] = useState({
    name: '',
    accountNumber: '',
    bankName: 'Nova Trust Bank',
    nickname: ''
  });
  const [isSavingBen, setIsSavingBen] = useState(false);
  const [benSearchQuery, setBenSearchQuery] = useState('');

  // Transfer Form State
  const [formData, setFormData] = useState({
    transferType: 'Internal' as 'Internal' | 'External Wire',
    bankName: 'Nova Trust Bank',
    recipientAccountNumber: '',
    recipientName: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
    country: 'United States',
    currency: 'USD',
    amount: '',
    description: '',
    saveAsBeneficiary: false,
    beneficiaryNickname: ''
  });

  // Account Lookup Validation State
  const [isValidatingAccount, setIsValidatingAccount] = useState(false);
  const [isInternalMatch, setIsInternalMatch] = useState<boolean | null>(null);
  const [bankDropdownOpen, setBankDropdownOpen] = useState(false);
  const [bankSearch, setBankSearch] = useState('');

  // Form Error
  const [formError, setFormError] = useState<string | null>(null);

  // Progress Bar States (0 - 100%)
  const [valProgress, setValProgress] = useState(0);
  const [valStatusMessage, setValStatusMessage] = useState('Validating transfer details...');
  
  const [finalProgress, setFinalProgress] = useState(0);
  const [finalStatusMessage, setFinalStatusMessage] = useState('Verifying OTP authentication code...');

  // Primary OTP Verification States (First Transfer Verification Code)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [primaryCodeError, setPrimaryCodeError] = useState<string | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 minutes countdown
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [isVerifyingPrimaryOtp, setIsVerifyingPrimaryOtp] = useState(false);

  // Secondary Verification States (Second Transfer Verification Code)
  const [secondOtpDigits, setSecondOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const secondOtpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [secondCodeError, setSecondCodeError] = useState<string | null>(null);
  const [isVerifyingSecondOtp, setIsVerifyingSecondOtp] = useState(false);

  // 40-Second Verification Screen State
  const [procPhaseState, setProcPhaseState] = useState<'PROCESSING' | 'PAUSED' | 'FINALIZING'>('PROCESSING');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Successful Transaction Result
  const [completedTransaction, setCompletedTransaction] = useState<Transaction | null>(null);

  // Load Beneficiaries on Mount
  const loadBeneficiaries = async () => {
    setIsLoadingBeneficiaries(true);
    try {
      const data = await apiRequest<Beneficiary[]>('/api/customer/beneficiaries');
      setBeneficiaries(data);
    } catch (err: any) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  // OTP Countdown Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'OTP_VERIFICATION' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  // Account Number Lookup Handler
  const handleLookupAccount = async (accountNum: string, selectedBank: string) => {
    if (!accountNum || accountNum.trim().length < 5) {
      setIsInternalMatch(null);
      return;
    }

    setIsValidatingAccount(true);
    try {
      const result = await apiRequest<{
        isInternal: boolean;
        recipientName: string;
        accountNumber: string;
        bankName: string;
      }>('/api/transfers/validate-recipient', {
        method: 'POST',
        body: JSON.stringify({ accountNumber: accountNum.trim() })
      });

      if (result.isInternal && selectedBank === 'Nova Trust Bank') {
        setIsInternalMatch(true);
        setFormData(prev => ({
          ...prev,
          recipientName: result.recipientName
        }));
      } else {
        setIsInternalMatch(false);
      }
    } catch (err) {
      setIsInternalMatch(false);
    } finally {
      setIsValidatingAccount(false);
    }
  };

  // Select Saved Beneficiary
  const handleSelectBeneficiary = (ben: Beneficiary) => {
    setFormData(prev => ({
      ...prev,
      bankName: ben.bankName,
      recipientAccountNumber: ben.accountNumber,
      recipientName: ben.name,
      amount: formData.amount,
      description: formData.description || `Transfer to ${ben.nickname || ben.name}`,
      saveAsBeneficiary: false,
      beneficiaryNickname: ben.nickname || ''
    }));
    setFormError(null);
    setActiveSubTab('transfer');
    showToast(`Beneficiary selected: ${ben.name}`, 'info');
  };

  // Handle Form Submit (Step 1 -> Step 2: First Processing)
  const handleStartTransferProcessing = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountNum = parseFloat(formData.amount);

    // Form Validations
    if (account && account.status !== 'Active') {
      setFormError(`Transfers restricted: Your account status is currently ${account.status}. Outgoing transfers are disabled. Please contact Nova Trust Bank customer support.`);
      return;
    }
    if (!formData.bankName) {
      setFormError('Please select a recipient bank.');
      return;
    }
    if (!formData.recipientAccountNumber || formData.recipientAccountNumber.trim().length < 5) {
      setFormError('Please enter a valid recipient account number.');
      return;
    }
    if (!formData.recipientName || formData.recipientName.trim().length < 2) {
      setFormError('Please enter the recipient full name.');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      setFormError('Please enter a valid transfer amount greater than $0.00.');
      return;
    }
    if (account && amountNum > account.availableBalance) {
      setFormError(`Insufficient funds. Your available balance is $${account.availableBalance.toFixed(2)}.`);
      return;
    }
    if (account && formData.recipientAccountNumber.trim() === account.accountNumber) {
      setFormError('Cannot perform a transfer to your own account number.');
      return;
    }

    // Begin Step 2: Validation Processing Animation (30 seconds)
    setStep('VALIDATING_PROCESSING');
    setValProgress(0);

    const startTime = Date.now();
    const duration = 30000; // 30 seconds processing

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setValProgress(pct);

      if (pct < 33) {
        setValStatusMessage('Validating transfer details…');
      } else if (pct < 66) {
        setValStatusMessage('Performing security checks…');
      } else {
        setValStatusMessage('Preparing OTP…');
      }

      if (pct >= 100) {
        clearInterval(interval);
        // Request OTP code from server and move to Step 3
        requestTransferOtpCode();
      }
    }, 100);
  };

  // Request OTP from Server
  const requestTransferOtpCode = async () => {
    try {
      await apiRequest('/api/transfers/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: formData.recipientName,
          amount: formData.amount
        })
      });

      setTimerSeconds(300); // 5 mins
      setOtpDigits(['', '', '', '', '', '']);
      setStep('OTP_VERIFICATION');
      showToast(`A security verification code has been sent to ${maskEmail(user?.email)}.`, 'info');
      
      // Auto focus first OTP input after DOM renders
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 200);
    } catch (err: any) {
      setFormError(err.message || 'Failed to request verification code.');
      setStep('FORM');
    }
  };

  // Handle Resend OTP
  const handleResendOtp = async () => {
    setIsResendingOtp(true);
    try {
      await apiRequest('/api/transfers/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: formData.recipientName,
          amount: formData.amount
        })
      });

      setTimerSeconds(300);
      setOtpDigits(['', '', '', '', '', '']);
      showToast(`A new security verification code has been sent to ${maskEmail(user?.email)}.`, 'info');
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      showToast(err.message || 'Failed to resend OTP', 'error');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // OTP Digit Change Handler
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input if filled
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  // OTP Keydown (Backspace Navigation)
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  // OTP Paste Handler
  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setOtpDigits(newDigits);

    const nextIndex = Math.min(5, pasted.length);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 1: Handle Verify Primary OTP & Proceed to Secondary Processing
  const handleVerifyPrimaryOtp = async () => {
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setPrimaryCodeError('Please enter the complete 6-digit First Transfer Verification Code.');
      showToast('Please enter the complete 6-digit First Transfer Verification Code.', 'error');
      return;
    }

    setIsVerifyingPrimaryOtp(true);
    setPrimaryCodeError(null);

    try {
      await apiRequest('/api/transfers/verify-first-otp', {
        method: 'POST',
        body: JSON.stringify({ otpCode: fullOtp })
      });

      // Advance to Step 8: SECOND_VALIDATING_PROCESSING (Second Processing Animation)
      setStep('SECOND_VALIDATING_PROCESSING');
      setValProgress(0);

      const startTime = Date.now();
      const duration = 5000; // 5 seconds second processing animation

      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
        setValProgress(pct);

        if (pct < 33) {
          setValStatusMessage('Validating First Transfer Verification Code...');
        } else if (pct < 66) {
          setValStatusMessage('Synchronizing security protocol ledger...');
        } else {
          setValStatusMessage('Preparing Second Transfer Verification Code entry...');
        }

        if (pct >= 100) {
          clearInterval(interval);
          setSecondOtpDigits(['', '', '', '', '', '']);
          setSecondCodeError(null);
          setStep('SECOND_VERIFICATION');
          showToast('First verification code validated. Please enter Second Transfer Verification Code.', 'info');
          setTimeout(() => {
            secondOtpInputRefs.current[0]?.focus();
          }, 200);
        }
      }, 100);
    } catch (err: any) {
      setPrimaryCodeError(err.message || 'Invalid verification code. Please check the code sent to your registered email address and try again.');
      showToast(err.message || 'Invalid verification code.', 'error');
    } finally {
      setIsVerifyingPrimaryOtp(false);
    }
  };

  // Step 2: Handle Secondary Code Verification & Start Final Verification Process
  const handleVerifySecondCodeAndStartFinal = async () => {
    const fullSecond = secondOtpDigits.join('');
    if (fullSecond.length < 6) {
      setSecondCodeError('Please enter the complete 6-digit Second Transfer Verification Code.');
      showToast('Please enter the complete 6-digit Second Transfer Verification Code.', 'error');
      return;
    }

    setIsVerifyingSecondOtp(true);
    setSecondCodeError(null);

    try {
      await apiRequest('/api/transfers/verify-second-otp', {
        method: 'POST',
        body: JSON.stringify({ secondCode: fullSecond })
      });

      // Both codes verified successfully! Begin final verification clearance process
      start40SecondFinalVerificationProcess(otpDigits.join(''), fullSecond);
    } catch (err: any) {
      setSecondCodeError(err.message || 'Invalid verification code. Please check the code sent to your registered email address and try again.');
      showToast(err.message || 'Invalid verification code.', 'error');
    } finally {
      setIsVerifyingSecondOtp(false);
    }
  };

  // Handle Resend / Request New Secondary Code
  const handleResendSecondCode = async () => {
    try {
      await apiRequest('/api/transfers/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: formData.recipientName,
          amount: formData.amount
        })
      });
    } catch (e) {
      // Ignore transient errors
    }

    setSecondOtpDigits(['', '', '', '', '', '']);
    setSecondCodeError(null);
    showToast(`A new secondary verification passcode has been sent to ${maskEmail(user?.email)}.`, 'info');
    setTimeout(() => {
      secondOtpInputRefs.current[0]?.focus();
    }, 100);
  };

  // Start 40-Second Verification Process with repeated start, pause, resume timeline
  const start40SecondFinalVerificationProcess = (primaryOtp: string, secondaryCode: string) => {
    setStep('FINAL_PROCESSING');
    setFinalProgress(0);
    setElapsedSeconds(0);
    setProcPhaseState('PROCESSING');

    const startTime = Date.now();
    const duration = 40000; // 40 seconds processing

    let serverCalled = false;

    const interval = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      const currentSec = Math.min(40, Math.floor(elapsed / 1000));
      setElapsedSeconds(currentSec);

      // 40 Seconds Timeline with Start, Pause, Resume, and Continue
      let pct = 0;
      let statusMsg = '';
      let phase: 'PROCESSING' | 'PAUSED' | 'FINALIZING' = 'PROCESSING';

      if (elapsed < 6000) {
        // 0s - 6s: Running 0% -> 18%
        pct = Math.floor((elapsed / 6000) * 18);
        statusMsg = 'Initiating Interbank FedWire & SWIFT Clearing Channel...';
        phase = 'PROCESSING';
      } else if (elapsed < 11000) {
        // 6s - 11s: PAUSED at 18% (Hold for reserve check)
        pct = 18;
        statusMsg = 'Validating Secondary Authorization Passcode with Reserve Ledger... (Paused for Authentication)';
        phase = 'PAUSED';
      } else if (elapsed < 20000) {
        // 11s - 20s: RESUMED 18% -> 48%
        pct = 18 + Math.floor(((elapsed - 11000) / 9000) * 30);
        statusMsg = 'Performing Anti-Money Laundering (AML) & Sanctions Compliance Scan...';
        phase = 'PROCESSING';
      } else if (elapsed < 26000) {
        // 20s - 26s: PAUSED at 48% (Hold for network clearing house response)
        pct = 48;
        statusMsg = 'Awaiting Bank Clearing House Response... (Network Sync Paused)';
        phase = 'PAUSED';
      } else if (elapsed < 34000) {
        // 26s - 34s: RESUMED 48% -> 80%
        pct = 48 + Math.floor(((elapsed - 26000) / 8000) * 32);
        statusMsg = 'Reconciling Account Ledger & Cryptographic Token Signatures...';
        phase = 'PROCESSING';
      } else if (elapsed < 37000) {
        // 34s - 37s: PAUSED at 80% (Hold for final token confirmation)
        pct = 80;
        statusMsg = 'Verifying Cryptographic Receipts & Settlement Confirmation... (Settlement Hold)';
        phase = 'PAUSED';
      } else {
        // 37s - 40s: RESUMED 80% -> 100%
        pct = 80 + Math.floor(((elapsed - 37000) / 3000) * 20);
        statusMsg = 'Finalizing Digital Transaction Audit Receipt...';
        phase = 'FINALIZING';
      }

      setFinalProgress(Math.min(100, pct));
      setFinalStatusMessage(statusMsg);
      setProcPhaseState(phase);

      // Execute backend API call at approx 32 seconds (72% progress)
      if (elapsed >= 32000 && !serverCalled) {
        serverCalled = true;
        try {
          const res = await apiRequest<{
            message: string;
            transaction: Transaction;
            updatedAccount: any;
          }>('/api/transfers/execute', {
            method: 'POST',
            body: JSON.stringify({
              recipientAccountNumber: formData.recipientAccountNumber.trim(),
              recipientName: formData.recipientName.trim(),
              bankName: formData.bankName,
              amount: formData.amount,
              description: formData.description,
              otpCode: primaryOtp,
              secondCode: secondaryCode,
              saveAsBeneficiary: formData.saveAsBeneficiary,
              beneficiaryNickname: formData.beneficiaryNickname
            })
          });

          setCompletedTransaction(res.transaction);
          refreshUser();
          loadBeneficiaries();
        } catch (err: any) {
          clearInterval(interval);
          setFormError(err.message || 'Transfer execution failed. Please check verification codes and try again.');
          setStep('FORM');
          showToast(err.message || 'Transfer failed', 'error');
          return;
        }
      }

      if (elapsed >= 40000) {
        clearInterval(interval);
        setFinalProgress(100);
        setStep('SUCCESS');
        if (onTransferComplete) onTransferComplete();
      }
    }, 100);
  };

  // Add or Edit Beneficiary Handler
  const handleSaveBeneficiaryModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!benForm.name || !benForm.accountNumber || !benForm.bankName) {
      showToast('Name, Account Number, and Bank Name are required', 'error');
      return;
    }

    setIsSavingBen(true);
    try {
      if (editingBen) {
        await apiRequest(`/api/customer/beneficiaries/${editingBen.id}`, {
          method: 'PUT',
          body: JSON.stringify(benForm)
        });
        showToast('Beneficiary updated successfully', 'success');
      } else {
        await apiRequest('/api/customer/beneficiaries', {
          method: 'POST',
          body: JSON.stringify(benForm)
        });
        showToast('Beneficiary saved successfully', 'success');
      }

      setShowAddBenModal(false);
      setEditingBen(null);
      setBenForm({ name: '', accountNumber: '', bankName: 'Nova Trust Bank', nickname: '' });
      loadBeneficiaries();
    } catch (err: any) {
      showToast(err.message || 'Failed to save beneficiary', 'error');
    } finally {
      setIsSavingBen(false);
    }
  };

  // Delete Beneficiary Handler
  const handleDeleteBeneficiary = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from your saved beneficiaries?`)) {
      return;
    }

    try {
      await apiRequest(`/api/customer/beneficiaries/${id}`, {
        method: 'DELETE'
      });
      showToast('Beneficiary removed', 'info');
      loadBeneficiaries();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete beneficiary', 'error');
    }
  };

  // Download PDF Receipt
  const handleDownloadReceipt = () => {
    if (!completedTransaction) return;

    try {
      const doc = new jsPDF();
      
      // Header Navy Banner
      doc.setFillColor(15, 53, 87); // #0F3557
      doc.rect(0, 0, 210, 40, 'F');

      // Bank Logo Text
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('NOVA TRUST BANK', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(169, 216, 247); // #A9D8F7
      doc.text('Official Electronic Funds Transfer Receipt', 14, 32);

      // Status Badge Box
      doc.setFillColor(220, 252, 231); // light green
      doc.roundedRect(140, 12, 56, 16, 3, 3, 'F');
      doc.setTextColor(22, 101, 52);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('✓ SUCCESSFUL', 146, 23);

      // Receipt Box Border
      doc.setDrawColor(217, 222, 229);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(14, 48, 182, 175, 4, 4, 'FD');

      // Title & Amount Header
      doc.setTextColor(30, 42, 54);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TRANSACTION SUMMARY', 22, 60);

      doc.setFontSize(26);
      doc.setTextColor(0, 87, 184); // #0057B8
      doc.text(`$${completedTransaction.amount.toFixed(2)} USD`, 22, 74);

      doc.setDrawColor(217, 222, 229);
      doc.line(22, 82, 188, 82);

      // Key-Value Rows
      const rows = [
        ['Reference Number:', completedTransaction.reference],
        ['Recipient Name:', completedTransaction.recipientName],
        ['Recipient Bank:', completedTransaction.bankName],
        ['Account Number:', completedTransaction.recipientAccountNumber],
        ['Sender Name:', user?.fullName || 'Nova Trust Account'],
        ['Sender Account:', account?.accountNumber || '••••••••'],
        ['Transfer Description:', completedTransaction.description || 'N/A'],
        ['Transaction Fee:', '$0.00 (Waived)'],
        ['Date & Time:', new Date(completedTransaction.createdAt).toLocaleString()],
        ['Payment Method:', 'Online Banking Secure Channel']
      ];

      let y = 92;
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(110, 122, 135);
        doc.text(label, 22, y);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 42, 54);
        doc.text(value, 90, y);

        y += 11;
      });

      // Divider & Footer Disclaimer
      doc.setDrawColor(217, 222, 229);
      doc.line(22, y + 2, 188, y + 2);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(110, 122, 135);
      doc.text('This is an official system-generated transaction receipt issued by Nova Trust Bank.', 22, y + 12);
      doc.text('No signature is required. For inquiries, contact support@novatrustbank.com.', 22, y + 17);

      doc.save(`Nova_Trust_Receipt_${completedTransaction.reference}.pdf`);
      showToast('Receipt PDF downloaded successfully', 'success');
    } catch (err: any) {
      showToast('Failed to generate PDF receipt', 'error');
    }
  };

  // Share Receipt (Copy Text Summary to Clipboard)
  const handleShareReceipt = () => {
    if (!completedTransaction) return;

    const summaryText = `Nova Trust Bank Receipt
Ref: ${completedTransaction.reference}
Amount: $${completedTransaction.amount.toFixed(2)}
To: ${completedTransaction.recipientName} (${completedTransaction.bankName})
Account: ${completedTransaction.recipientAccountNumber}
Date: ${new Date(completedTransaction.createdAt).toLocaleString()}
Status: SUCCESSFUL`;

    navigator.clipboard.writeText(summaryText);
    showToast('Receipt summary copied to clipboard!', 'success');
  };

  // Reset Form for New Transfer
  const handleResetTransfer = () => {
    setStep('FORM');
    setFormData(prev => ({
      ...prev,
      bankName: 'Nova Trust Bank',
      recipientAccountNumber: '',
      recipientName: '',
      amount: '',
      description: '',
      saveAsBeneficiary: false,
      beneficiaryNickname: ''
    }));
    setFormError(null);
    setCompletedTransaction(null);
    setIsInternalMatch(null);
  };

  // Filter Beneficiaries by Search Query
  const filteredBeneficiaries = beneficiaries.filter(b => {
    const q = benSearchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.accountNumber.includes(q) ||
      b.bankName.toLowerCase().includes(q) ||
      (b.nickname && b.nickname.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Navigation Sub-Tabs Header */}
      {step === 'FORM' && (
        <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-[#D9DEE5] shadow-xs">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('transfer')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeSubTab === 'transfer'
                  ? 'bg-[#0F3557] text-white shadow-xs'
                  : 'text-[#6E7A87] hover:bg-[#F3F5F7]'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Make a Transfer</span>
            </button>

            <button
              onClick={() => setActiveSubTab('beneficiaries')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 ${
                activeSubTab === 'beneficiaries'
                  ? 'bg-[#0F3557] text-white shadow-xs'
                  : 'text-[#6E7A87] hover:bg-[#F3F5F7]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Saved Beneficiaries ({beneficiaries.length})</span>
            </button>
          </div>

          {activeSubTab === 'beneficiaries' && (
            <button
              onClick={() => {
                setEditingBen(null);
                setBenForm({ name: '', accountNumber: '', bankName: 'Nova Trust Bank', nickname: '' });
                setShowAddBenModal(true);
              }}
              className="px-3.5 py-2 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Beneficiary</span>
            </button>
          )}
        </div>
      )}

      {/* ==================== SUB-TAB 2: BENEFICIARIES LIST VIEW ==================== */}
      {step === 'FORM' && activeSubTab === 'beneficiaries' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-md p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9DEE5] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#0F3557]">Your Saved Beneficiaries</h2>
              <p className="text-xs text-[#6E7A87] mt-0.5">
                Quickly send funds to your trusted personal and business contacts.
              </p>
            </div>

            {/* Beneficiaries Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#6E7A87] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={benSearchQuery}
                onChange={e => setBenSearchQuery(e.target.value)}
                placeholder="Search beneficiaries..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
              />
            </div>
          </div>

          {isLoadingBeneficiaries ? (
            <div className="py-12 text-center text-xs text-[#6E7A87] flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 text-[#0057B8] animate-spin" />
              <span>Loading beneficiaries...</span>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#6E7A87] space-y-3">
              <Users className="w-10 h-10 text-[#D9DEE5] mx-auto" />
              <p className="font-semibold text-sm text-[#1E2A36]">No beneficiaries found</p>
              <p className="max-w-md mx-auto text-[#6E7A87]">
                {benSearchQuery ? 'No beneficiaries match your search criteria.' : 'You have not added any saved beneficiaries yet.'}
              </p>
              <button
                onClick={() => {
                  setEditingBen(null);
                  setBenForm({ name: '', accountNumber: '', bankName: 'Nova Trust Bank', nickname: '' });
                  setShowAddBenModal(true);
                }}
                className="px-4 py-2 bg-[#0057B8] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Beneficiary</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBeneficiaries.map(ben => (
                <div
                  key={ben.id}
                  className="p-4 bg-[#F3F5F7] border border-[#D9DEE5] rounded-2xl flex flex-col justify-between hover:border-[#0057B8] transition-colors group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0057B8] text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                        {ben.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0F3557] group-hover:text-[#0057B8] transition-colors">
                          {ben.name}
                        </h3>
                        {ben.nickname && (
                          <span className="text-[11px] text-[#0057B8] font-semibold block">
                            "{ben.nickname}"
                          </span>
                        )}
                        <span className="text-xs font-mono text-[#6E7A87]">
                          {ben.bankName} • {ben.accountNumber}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingBen(ben);
                          setBenForm({
                            name: ben.name,
                            accountNumber: ben.accountNumber,
                            bankName: ben.bankName,
                            nickname: ben.nickname || ''
                          });
                          setShowAddBenModal(true);
                        }}
                        className="p-1.5 text-[#6E7A87] hover:text-[#0057B8] hover:bg-white rounded-lg transition-colors"
                        title="Edit Beneficiary"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteBeneficiary(ben.id, ben.name)}
                        className="p-1.5 text-[#6E7A87] hover:text-red-600 hover:bg-white rounded-lg transition-colors"
                        title="Delete Beneficiary"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#D9DEE5] flex justify-end">
                    <button
                      onClick={() => handleSelectBeneficiary(ben)}
                      className="w-full py-2 bg-white hover:bg-[#0057B8] text-[#0057B8] hover:text-white border border-[#0057B8] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Transfer to {ben.name.split(' ')[0]}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== STEP 1: COMPLETE TRANSFER FORM ==================== */}
      {step === 'FORM' && activeSubTab === 'transfer' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-lg p-6 sm:p-8 space-y-6">

          {/* Form Header */}
          <div className="border-b border-[#D9DEE5] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-[#0F3557]">Fund Transfer</h2>
              <p className="text-xs text-[#6E7A87] mt-0.5">
                Send money internally or interbank securely with instant OTP verification.
              </p>
            </div>

            <div className="text-right text-xs bg-[#F3F5F7] px-3 py-1.5 rounded-xl border border-[#D9DEE5]">
              <span className="text-[#6E7A87] block text-[10px]">AVAILABLE BALANCE</span>
              <span className="font-mono font-bold text-sm text-[#0F3557]">
                ${account?.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
              </span>
            </div>
          </div>

          {/* Quick Select Saved Beneficiaries Strip */}
          {beneficiaries.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#0F3557] flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0057B8]" />
                <span>Quick Select Beneficiary:</span>
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {beneficiaries.slice(0, 5).map(ben => (
                  <button
                    key={ben.id}
                    type="button"
                    onClick={() => handleSelectBeneficiary(ben)}
                    className="px-3 py-2 bg-[#F3F5F7] hover:bg-[#A9D8F7]/30 border border-[#D9DEE5] rounded-xl text-left text-xs flex-shrink-0 transition-colors"
                  >
                    <div className="font-bold text-[#0F3557] truncate max-w-[120px]">{ben.name}</div>
                    <div className="text-[10px] text-[#6E7A87] font-mono">{ben.bankName}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error Alert Banner */}
          {formError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-900 text-xs animate-shake">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-950">Transfer Validation Error</p>
                <p>{formError}</p>
              </div>
              <button onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Main Transfer Form */}
          <form onSubmit={handleStartTransferProcessing} className="space-y-5 text-xs">

            {/* Transfer Type Selection */}
            <div>
              <label className="block font-bold text-[#1E2A36] mb-1.5">
                Transfer Type <span className="text-rose-600">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transferType: 'Internal', bankName: 'Nova Trust Bank' })}
                  className={`py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    formData.transferType === 'Internal'
                      ? 'border-[#0057B8] bg-[#0057B8]/10 text-[#0057B8] font-bold shadow-xs'
                      : 'border-[#D9DEE5] bg-white text-[#6E7A87] hover:border-[#0057B8]'
                  }`}
                >
                  <Building2 className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold">Internal Transfer</div>
                    <div className="text-[10px] text-[#6E7A87]">Nova Trust Bank Account</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, transferType: 'External Wire' })}
                  className={`py-3 px-4 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    formData.transferType === 'External Wire'
                      ? 'border-[#0057B8] bg-[#0057B8]/10 text-[#0057B8] font-bold shadow-xs'
                      : 'border-[#D9DEE5] bg-white text-[#6E7A87] hover:border-[#0057B8]'
                  }`}
                >
                  <Send className="w-5 h-5 flex-shrink-0" />
                  <div>
                    <div className="text-xs font-bold">External / International</div>
                    <div className="text-[10px] text-[#6E7A87]">Interbank / Wire Transfer</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Country & Currency Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">
                  Recipient Country <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.country}
                  onChange={e => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-3.5 py-3 border border-[#D9DEE5] rounded-xl bg-white font-medium text-xs focus:outline-none focus:border-[#0057B8]"
                >
                  <option value="United States">United States (US)</option>
                  <option value="United Kingdom">United Kingdom (UK)</option>
                  <option value="Canada">Canada (CA)</option>
                  <option value="Germany">Germany (DE)</option>
                  <option value="France">France (FR)</option>
                  <option value="Singapore">Singapore (SG)</option>
                  <option value="Australia">Australia (AU)</option>
                  <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                  <option value="Japan">Japan (JP)</option>
                  <option value="Switzerland">Switzerland (CH)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">
                  Transfer Currency <span className="text-rose-600">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3.5 py-3 border border-[#D9DEE5] rounded-xl bg-white font-mono font-semibold text-xs focus:outline-none focus:border-[#0057B8]"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                  <option value="SGD">SGD ($) - Singapore Dollar</option>
                  <option value="AED">AED (د.إ) - UAE Dirham</option>
                  <option value="CHF">CHF (Fr) - Swiss Franc</option>
                </select>
              </div>
            </div>

            {/* 1. Recipient Bank Name */}
            <div>
              <label className="block font-bold text-[#1E2A36] mb-1">
                Recipient Bank Name <span className="text-rose-600">*</span>
              </label>

              <input
                type="text"
                required
                value={formData.bankName}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({ ...formData, bankName: val });
                  if (formData.recipientAccountNumber) {
                    handleLookupAccount(formData.recipientAccountNumber, val);
                  }
                }}
                placeholder="Enter Recipient Bank Name (e.g. Nova Trust Bank, Chase, Wells Fargo)"
                className="w-full px-3.5 py-3 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] font-medium"
              />
            </div>

            {/* 2. Recipient Account Number */}
            <div>
              <label className="block font-bold text-[#1E2A36] mb-1">
                Recipient Account Number <span className="text-rose-600">*</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={formData.recipientAccountNumber}
                  onChange={e => {
                    const val = e.target.value;
                    setFormData({ ...formData, recipientAccountNumber: val });
                    if (val.length >= 6) {
                      handleLookupAccount(val, formData.bankName);
                    } else {
                      setIsInternalMatch(null);
                    }
                  }}
                  onBlur={() => handleLookupAccount(formData.recipientAccountNumber, formData.bankName)}
                  placeholder="e.g. 1092837465"
                  className="flex-1 px-3.5 py-3 font-mono text-sm border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />

                <button
                  type="button"
                  onClick={() => handleLookupAccount(formData.recipientAccountNumber, formData.bankName)}
                  className="px-4 py-3 bg-[#0F3557] hover:bg-[#0057B8] text-white font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  {isValidatingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Lookup'}
                </button>
              </div>

              {isValidatingAccount && (
                <p className="text-[11px] text-[#0057B8] mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Searching Nova Trust ledger for account details...</span>
                </p>
              )}

              {isInternalMatch === true && (
                <div className="mt-2 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Nova Trust Internal Account Verified:</span>
                    <span className="ml-1 text-emerald-800 font-semibold">{formData.recipientName}</span>
                  </div>
                </div>
              )}

              {isInternalMatch === false && formData.recipientAccountNumber.length >= 6 && (
                <p className="text-[11px] text-[#6E7A87] mt-1 italic">
                  External interbank recipient. Manual account verification enabled.
                </p>
              )}
            </div>

            {/* 3. Recipient Account Name */}
            <div>
              <label className="block font-bold text-[#1E2A36] mb-1">
                Recipient Full Name <span className="text-rose-600">*</span>
              </label>

              <input
                type="text"
                required
                value={formData.recipientName}
                onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
                placeholder="Full Recipient Name as registered with bank"
                className="w-full px-3.5 py-3 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
              />
            </div>

            {/* International Transfer Identification Fields (SWIFT / BIC / IBAN / Routing) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F3F5F7] p-3.5 rounded-2xl border border-[#D9DEE5]">
              <div>
                <label className="block text-[11px] font-bold text-[#0F3557] mb-1">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  value={formData.swiftCode}
                  onChange={e => setFormData({ ...formData, swiftCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. NVTBUS33XXX"
                  className="w-full px-3 py-2 font-mono text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F3557] mb-1">
                  IBAN
                </label>
                <input
                  type="text"
                  value={formData.iban}
                  onChange={e => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                  placeholder="e.g. GB29NWBK60161331926819"
                  className="w-full px-3 py-2 font-mono text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#0F3557] mb-1">
                  Routing / Sort Code
                </label>
                <input
                  type="text"
                  value={formData.routingNumber}
                  onChange={e => setFormData({ ...formData, routingNumber: e.target.value })}
                  placeholder="e.g. 021000021"
                  className="w-full px-3 py-2 font-mono text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white"
                />
              </div>
            </div>

            {/* 4. Amount */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-[#1E2A36]">
                  Transfer Amount ($) <span className="text-rose-600">*</span>
                </label>
                <div className="flex gap-1.5">
                  {[50, 100, 500, 1000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: val.toString() })}
                      className="px-2 py-0.5 bg-[#F3F5F7] hover:bg-[#A9D8F7]/40 text-[#0F3557] font-mono text-[10px] font-bold rounded-md border border-[#D9DEE5]"
                    >
                      +${val}
                    </button>
                  ))}
                  {account && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, amount: account.availableBalance.toFixed(2) })}
                      className="px-2 py-0.5 bg-[#0057B8] text-white font-mono text-[10px] font-bold rounded-md"
                    >
                      MAX
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-[#6E7A87] font-mono">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-3 font-mono text-lg font-extrabold border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] text-[#0F3557]"
                />
              </div>
            </div>

            {/* 5. Transfer Description / Narration */}
            <div>
              <label className="block font-bold text-[#1E2A36] mb-1">
                Transfer Description / Narration
              </label>

              <input
                type="text"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Invoice #1084 payment, Monthly rent, Personal gift"
                className="w-full px-3.5 py-3 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
              />
            </div>

            {/* 6. Save as Beneficiary Option */}
            <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] space-y-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0F3557]">
                <input
                  type="checkbox"
                  checked={formData.saveAsBeneficiary}
                  onChange={e => setFormData({ ...formData, saveAsBeneficiary: e.target.checked })}
                  className="w-4 h-4 text-[#0057B8] rounded focus:ring-[#0057B8]"
                />
                <span>Save recipient as beneficiary for future transfers</span>
              </label>

              {formData.saveAsBeneficiary && (
                <div className="pl-6 pt-1">
                  <label className="block text-[11px] font-semibold text-[#6E7A87] mb-1">
                    Beneficiary Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.beneficiaryNickname}
                    onChange={e => setFormData({ ...formData, beneficiaryNickname: e.target.value })}
                    placeholder="e.g. Mom's Account, Landlord"
                    className="w-full px-3 py-2 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white"
                  />
                </div>
              )}
            </div>

            {/* Form Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-4 bg-[#0057B8] hover:bg-[#004bb0] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Continue & Validate Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </form>

        </div>
      )}

      {/* ==================== STEP 2: VALIDATION PROCESSING SCREEN (First Progress Bar) ==================== */}
      {step === 'VALIDATING_PROCESSING' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xl p-8 sm:p-12 text-center space-y-8 max-w-xl mx-auto">
          
          <div className="w-20 h-20 rounded-full bg-[#A9D8F7]/30 text-[#0057B8] mx-auto flex items-center justify-center relative">
            <Loader2 className="w-12 h-12 text-[#0057B8] animate-spin" />
            <ShieldCheck className="w-6 h-6 text-[#0F3557] absolute" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#0F3557]">Validating Transfer Details...</h2>
            <p className="text-xs text-[#6E7A87] font-medium transition-all duration-300 min-h-[20px]">
              {valStatusMessage}
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#F3F5F7] h-3 rounded-full overflow-hidden border border-[#D9DEE5] p-0.5">
              <div
                className="bg-gradient-to-r from-[#0F3557] to-[#0057B8] h-full rounded-full transition-all duration-150"
                style={{ width: `${valProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#0F3557]">
              <span>VALIDATION IN PROGRESS</span>
              <span>{valProgress}%</span>
            </div>
          </div>

          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-left text-xs space-y-1 font-mono text-[#6E7A87]">
            <div className="flex justify-between">
              <span>Target Bank:</span>
              <span className="text-[#1E2A36] font-bold">{formData.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span>Account Number:</span>
              <span className="text-[#1E2A36] font-bold">{formData.recipientAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount:</span>
              <span className="text-[#0057B8] font-bold">${parseFloat(formData.amount).toFixed(2)}</span>
            </div>
          </div>

        </div>
      )}

      {/* ==================== STEP 3: FIRST OTP VERIFICATION ==================== */}
      {step === 'OTP_VERIFICATION' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xl p-6 sm:p-10 space-y-6 max-w-xl mx-auto">

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-7 h-7 text-[#0057B8]" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F3557]">Security Verification Required</h2>
            <p className="text-xs text-[#6E7A87] max-w-md mx-auto">
              A security verification code has been sent to your registered email address (<span className="font-semibold text-[#0F3557]">{maskEmail(user?.email)}</span>). Please check your inbox and enter the code below to continue.
            </p>
          </div>

          {/* Primary Error Alert */}
          {primaryCodeError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs flex items-center gap-2.5 animate-shake shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{primaryCodeError}</span>
            </div>
          )}

          {/* Security Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-950 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0057B8] shrink-0" />
            <p className="text-xs text-blue-900 leading-relaxed">
              For your account security, a 6-digit verification code was sent to <span className="font-semibold">{maskEmail(user?.email)}</span>. Never share your security codes with anyone.
            </p>
          </div>

          {/* Transfer Summary Review Card */}
          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6E7A87]">Transfer To:</span>
              <span className="font-bold text-[#1E2A36]">{formData.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E7A87]">Bank & Account:</span>
              <span className="font-mono text-[#1E2A36]">{formData.bankName} • {formData.recipientAccountNumber}</span>
            </div>
            <div className="flex justify-between border-t border-[#D9DEE5] pt-2">
              <span className="text-[#6E7A87]">Total Debit:</span>
              <span className="font-mono font-extrabold text-sm text-[#0057B8]">
                ${parseFloat(formData.amount).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* 6-Digit OTP Boxes */}
          <div className="space-y-3">
            <label className="block text-center font-bold text-xs text-[#1E2A36]">
              Enter First Transfer Verification Code
            </label>

            <div className="flex justify-center gap-2 sm:gap-3">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { otpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpDigitChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(idx, e)}
                  onPaste={handleOtpPaste}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold border-2 rounded-xl focus:outline-none bg-white text-[#0F3557] shadow-xs ${
                    primaryCodeError ? 'border-red-400 focus:border-red-600 bg-red-50/20' : 'border-[#D9DEE5] focus:border-[#0057B8]'
                  }`}
                />
              ))}
            </div>

            {/* Countdown Timer & Resend */}
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-[#6E7A87]">
                <Clock className="w-4 h-4 text-[#0057B8]" />
                <span>Session expires in:</span>
                <span className="font-mono font-bold text-[#0F3557]">
                  {Math.floor(timerSeconds / 60)}:{('0' + (timerSeconds % 60)).slice(-2)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResendingOtp}
                className="text-[#0057B8] hover:underline font-bold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResendingOtp ? 'animate-spin' : ''}`} />
                <span>Resend / Refresh Code</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Cancel or Verify */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => {
                setStep('FORM');
                showToast('Transfer process cancelled.', 'info');
              }}
              className="flex-1 py-3 bg-[#F3F5F7] hover:bg-[#D9DEE5] text-[#1E2A36] font-bold text-xs rounded-xl transition-colors"
            >
              Cancel Transfer
            </button>

            <button
              type="button"
              onClick={handleVerifyPrimaryOtp}
              disabled={otpDigits.join('').length < 6 || isVerifyingPrimaryOtp}
              className={`flex-1 py-3 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                otpDigits.join('').length < 6 || isVerifyingPrimaryOtp
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#0057B8] hover:bg-[#004bb0]'
              }`}
            >
              {isVerifyingPrimaryOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Code...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Code 1 & Proceed</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ==================== STEP 3A: SECONDARY PROCESSING ANIMATION ==================== */}
      {step === 'SECOND_VALIDATING_PROCESSING' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xl p-8 sm:p-12 text-center space-y-8 max-w-xl mx-auto">
          
          <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-700 mx-auto flex items-center justify-center relative">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <ShieldCheck className="w-6 h-6 text-[#0F3557] absolute" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#0F3557]">Processing Secondary Verification...</h2>
            <p className="text-xs text-[#6E7A87] font-medium transition-all duration-300 min-h-[20px]">
              {valStatusMessage}
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#F3F5F7] h-3 rounded-full overflow-hidden border border-[#D9DEE5] p-0.5">
              <div
                className="bg-gradient-to-r from-[#0F3557] via-indigo-600 to-[#0057B8] h-full rounded-full transition-all duration-150"
                style={{ width: `${valProgress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#0F3557]">
              <span>SECONDARY CLEARANCE</span>
              <span>{valProgress}%</span>
            </div>
          </div>

          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-left text-xs space-y-1 font-mono text-[#6E7A87]">
            <div className="flex justify-between">
              <span>First Verification Code:</span>
              <span className="text-emerald-700 font-bold">Passed</span>
            </div>
            <div className="flex justify-between">
              <span>Next Step:</span>
              <span className="text-indigo-700 font-bold">Second Transfer Verification Code</span>
            </div>
          </div>

        </div>
      )}

      {/* ==================== STEP 3B: SECONDARY VERIFICATION CODE ==================== */}
      {step === 'SECOND_VERIFICATION' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xl p-6 sm:p-10 space-y-6 max-w-xl mx-auto">

          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-[#0F3557]">Secondary Security Authorization</h2>
            <p className="text-xs text-[#6E7A87] max-w-md mx-auto">
              A secondary security verification code has been sent to your registered email address (<span className="font-semibold text-[#0F3557]">{maskEmail(user?.email)}</span>). Please enter the 6-digit code to finalize transfer authorization.
            </p>
          </div>

          {/* Error Message Alert */}
          {secondCodeError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2 animate-shake shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span className="font-semibold">{secondCodeError}</span>
            </div>
          )}

          {/* Transfer Summary Review Card */}
          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#6E7A87]">Recipient Name:</span>
              <span className="font-bold text-[#1E2A36]">{formData.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6E7A87]">Bank & Account:</span>
              <span className="font-mono text-[#1E2A36]">{formData.bankName} • {formData.recipientAccountNumber}</span>
            </div>
            <div className="flex justify-between border-t border-[#D9DEE5] pt-2">
              <span className="text-[#6E7A87]">Amount to Transfer:</span>
              <span className="font-mono font-extrabold text-sm text-[#0057B8]">
                ${parseFloat(formData.amount).toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* 6-Digit Secondary Code Input Boxes */}
          <div className="space-y-3">
            <label className="block text-center font-bold text-xs text-[#1E2A36]">
              Enter Second Transfer Verification Code
            </label>

            <div className="flex justify-center gap-2 sm:gap-3">
              {secondOtpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => { secondOtpInputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(-1);
                    const newDigits = [...secondOtpDigits];
                    newDigits[idx] = val;
                    setSecondOtpDigits(newDigits);
                    if (val && idx < 5) {
                      secondOtpInputRefs.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Backspace' && !secondOtpDigits[idx] && idx > 0) {
                      secondOtpInputRefs.current[idx - 1]?.focus();
                    }
                  }}
                  onPaste={e => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
                    if (!pasted) return;
                    const newDigits = ['', '', '', '', '', ''];
                    for (let i = 0; i < pasted.length; i++) {
                      newDigits[i] = pasted[i];
                    }
                    setSecondOtpDigits(newDigits);
                    const nextIndex = Math.min(5, pasted.length);
                    secondOtpInputRefs.current[nextIndex]?.focus();
                  }}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-extrabold border-2 rounded-xl focus:outline-none bg-white text-[#0F3557] shadow-xs ${
                    secondCodeError
                      ? 'border-red-400 focus:border-red-600 bg-red-50/20'
                      : 'border-indigo-200 focus:border-indigo-600'
                  }`}
                />
              ))}
            </div>

            {/* Resend / Request New Code Action */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={handleResendSecondCode}
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#0057B8] hover:text-[#0F3557] hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Resend / Refresh Second Code</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setStep('OTP_VERIFICATION')}
              className="flex-1 py-3 bg-[#F3F5F7] hover:bg-[#D9DEE5] text-[#1E2A36] font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleVerifySecondCodeAndStartFinal}
              disabled={secondOtpDigits.join('').length < 6 || isVerifyingSecondOtp}
              className={`flex-1 py-3 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                secondOtpDigits.join('').length < 6 || isVerifyingSecondOtp
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isVerifyingSecondOtp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validating Code 2...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize Transfer</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}

      {/* ==================== STEP 4: 40-SECOND REALISTIC VERIFICATION LOADING SCREEN ==================== */}
      {step === 'FINAL_PROCESSING' && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-xl p-8 sm:p-12 text-center space-y-8 max-w-xl mx-auto">
          
          <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
            {/* Outer Ring */}
            <div className={`absolute inset-0 rounded-full border-4 border-t-[#0057B8] border-r-indigo-500 border-b-emerald-500 border-l-transparent ${
              procPhaseState === 'PAUSED' ? 'animate-pulse opacity-60 border-amber-500' : 'animate-spin'
            }`}></div>

            {/* Inner Icon */}
            <div className="w-16 h-16 rounded-full bg-[#F3F5F7] text-[#0F3557] flex items-center justify-center shadow-inner relative z-10">
              {procPhaseState === 'PAUSED' ? (
                <Clock className="w-8 h-8 text-amber-600" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-[#0057B8]" />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#F3F5F7] border border-[#D9DEE5]">
              {procPhaseState === 'PAUSED' ? (
                <span className="flex items-center gap-1.5 text-amber-800">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  PAUSED (AWAITING RESERVE SYNC)
                </span>
              ) : procPhaseState === 'FINALIZING' ? (
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  FINALIZING CONFIRMATION
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[#0057B8]">
                  <span className="w-2 h-2 rounded-full bg-[#0057B8] animate-ping"></span>
                  INTERBANK CLEARING IN PROGRESS
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black text-[#0F3557]">Executing Verification...</h2>
            
            <p className="text-xs text-[#6E7A87] font-semibold transition-all duration-300 min-h-[36px] max-w-md mx-auto">
              {finalStatusMessage}
            </p>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-[#F3F5F7] h-4 rounded-full overflow-hidden border border-[#D9DEE5] p-0.5 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  procPhaseState === 'PAUSED'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-gradient-to-r from-[#0F3557] via-[#0057B8] to-emerald-500'
                }`}
                style={{ width: `${finalProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center text-xs font-mono font-bold text-[#0F3557]">
              <span>VERIFICATION PROCESS: {elapsedSeconds}s / 40s</span>
              <span className={procPhaseState === 'PAUSED' ? 'text-amber-600 font-extrabold' : 'text-[#0057B8]'}>
                {finalProgress}% {procPhaseState === 'PAUSED' ? '(PAUSED)' : ''}
              </span>
            </div>
          </div>

          {/* Verification Checkpoints Timeline */}
          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#6E7A87] font-medium">1. Primary Email OTP:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6E7A87] font-medium">2. Secondary Passcode Authorization:</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#6E7A87] font-medium">3. Reserve Settlement & AML Check:</span>
              <span className={`font-bold flex items-center gap-1 ${
                elapsedSeconds >= 34 ? 'text-emerald-700' : 'text-[#0057B8]'
              }`}>
                {elapsedSeconds >= 34 ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cleared</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{procPhaseState === 'PAUSED' ? 'Paused (Hold)' : 'Processing...'}</span>
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-[#D9DEE5] pt-2">
              <span className="text-[#6E7A87] font-medium">4. Digital Ledger Settlement:</span>
              <span className={`font-bold ${elapsedSeconds >= 40 ? 'text-emerald-700' : 'text-[#6E7A87]'}`}>
                {elapsedSeconds >= 40 ? 'Completed' : 'Pending...'}
              </span>
            </div>
          </div>

          <div className="p-4 bg-[#F3F5F7] rounded-2xl border border-[#D9DEE5] text-left text-xs space-y-1 font-mono text-[#6E7A87]">
            <div className="flex justify-between">
              <span>Debiting Account:</span>
              <span className="text-[#1E2A36] font-bold">{account?.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Crediting Recipient:</span>
              <span className="text-[#1E2A36] font-bold">{formData.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span>Amount Transferred:</span>
              <span className="text-emerald-700 font-extrabold">${parseFloat(formData.amount).toFixed(2)}</span>
            </div>
          </div>

        </div>
      )}

      {/* ==================== STEP 5: SUCCESSFUL TRANSFER RECEIPT ==================== */}
      {step === 'SUCCESS' && completedTransaction && (
        <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-2xl p-6 sm:p-10 space-y-8 max-w-2xl mx-auto">

          {/* Success Banner */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-[#0F3557]">Transfer Successful!</h2>
            <p className="text-xs text-[#6E7A87]">
              Your transfer has been processed successfully. A confirmation email has been dispatched.
            </p>
          </div>

          {/* Official Receipt Card */}
          <div className="p-6 bg-[#F3F5F7] border border-[#D9DEE5] rounded-3xl space-y-4 relative overflow-hidden">
            
            {/* Top Navy Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#0F3557] to-[#0057B8]"></div>

            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-4">
              <div>
                <span className="text-[10px] text-[#6E7A87] font-bold uppercase tracking-wider block">
                  TRANSACTION REFERENCE
                </span>
                <span className="text-base font-mono font-extrabold text-[#0F3557]">
                  {completedTransaction.reference}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-[#6E7A87] font-bold uppercase tracking-wider block">
                  AMOUNT TRANSFERRED
                </span>
                <span className="text-xl font-mono font-black text-[#0057B8]">
                  ${completedTransaction.amount.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Receipt Key-Value Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#6E7A87] block text-[11px]">Recipient Name:</span>
                <span className="font-bold text-[#1E2A36] text-sm">{completedTransaction.recipientName}</span>
              </div>

              <div>
                <span className="text-[#6E7A87] block text-[11px]">Recipient Bank:</span>
                <span className="font-bold text-[#1E2A36] text-sm">{completedTransaction.bankName}</span>
              </div>

              <div>
                <span className="text-[#6E7A87] block text-[11px]">Recipient Account:</span>
                <span className="font-mono font-bold text-[#1E2A36] text-sm">{completedTransaction.recipientAccountNumber}</span>
              </div>

              <div>
                <span className="text-[#6E7A87] block text-[11px]">Date & Time:</span>
                <span className="font-mono text-[#1E2A36]">
                  {new Date(completedTransaction.createdAt).toLocaleString()}
                </span>
              </div>

              <div>
                <span className="text-[#6E7A87] block text-[11px]">Description / Narration:</span>
                <span className="text-[#1E2A36] font-medium">{completedTransaction.description || 'N/A'}</span>
              </div>

              <div>
                <span className="text-[#6E7A87] block text-[11px]">Updated Available Balance:</span>
                <span className="font-mono font-extrabold text-emerald-700">
                  ${account?.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

          </div>

          {/* Action Buttons Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            <button
              type="button"
              onClick={handleDownloadReceipt}
              className="py-3 px-4 bg-white hover:bg-[#F3F5F7] text-[#0F3557] border border-[#0F3557] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Download className="w-4 h-4 text-[#0057B8]" />
              <span>Download Official Receipt PDF</span>
            </button>

            <button
              type="button"
              onClick={handleShareReceipt}
              className="py-3 px-4 bg-white hover:bg-[#F3F5F7] text-[#0F3557] border border-[#D9DEE5] font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs"
            >
              <Share2 className="w-4 h-4 text-[#0057B8]" />
              <span>Copy Receipt Summary</span>
            </button>

            <button
              type="button"
              onClick={handleResetTransfer}
              className="py-3 px-4 bg-[#0057B8] hover:bg-[#004bb0] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Make Another Transfer</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onReturnToDashboard) onReturnToDashboard();
              }}
              className="py-3 px-4 bg-[#0F3557] hover:bg-[#003b70] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Dashboard</span>
            </button>

          </div>

        </div>
      )}

      {/* ==================== ADD / EDIT BENEFICIARY MODAL ==================== */}
      {showAddBenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-[#D9DEE5] shadow-2xl w-full max-w-md p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-[#D9DEE5] pb-3">
              <h3 className="font-extrabold text-base text-[#0F3557]">
                {editingBen ? 'Edit Saved Beneficiary' : 'Add New Beneficiary'}
              </h3>
              <button
                onClick={() => setShowAddBenModal(false)}
                className="p-1 rounded-lg text-[#6E7A87] hover:bg-[#F3F5F7]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBeneficiaryModal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">Bank Name *</label>
                <select
                  value={benForm.bankName}
                  onChange={e => setBenForm({ ...benForm, bankName: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8] bg-white font-semibold"
                >
                  {POPULAR_BANKS.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">Account Number *</label>
                <input
                  type="text"
                  required
                  value={benForm.accountNumber}
                  onChange={e => setBenForm({ ...benForm, accountNumber: e.target.value })}
                  placeholder="e.g. 1092837465"
                  className="w-full px-3.5 py-2.5 font-mono text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">Full Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  value={benForm.name}
                  onChange={e => setBenForm({ ...benForm, name: e.target.value })}
                  placeholder="Full Name as registered on account"
                  className="w-full px-3.5 py-2.5 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1E2A36] mb-1">Nickname / Category (Optional)</label>
                <input
                  type="text"
                  value={benForm.nickname}
                  onChange={e => setBenForm({ ...benForm, nickname: e.target.value })}
                  placeholder="e.g. Landlord, Sister, Supplier"
                  className="w-full px-3.5 py-2.5 text-xs border border-[#D9DEE5] rounded-xl focus:outline-none focus:border-[#0057B8]"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBenModal(false)}
                  className="flex-1 py-2.5 bg-[#F3F5F7] text-[#1E2A36] font-bold rounded-xl hover:bg-[#D9DEE5]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingBen}
                  className="flex-1 py-2.5 bg-[#0057B8] hover:bg-[#004bb0] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {isSavingBen && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingBen ? 'Update Beneficiary' : 'Save Beneficiary'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
