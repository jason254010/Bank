import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';
import loginBgImg from '../../assets/images/login_page_background_1785496351332.jpg';
import {
  UserCheck,
  Lock,
  ArrowRight,
  ShieldCheck,
  Info,
  Loader2,
  Home,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

interface CustomerLoginProps {
  onSwitchToOwner?: () => void;
  onGoHome?: () => void;
}

export const CustomerLogin: React.FC<CustomerLoginProps> = ({ onSwitchToOwner, onGoHome }) => {
  const { login, showToast } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login flow steps: 'FORM' | 'VERIFYING_SPINNER' | 'CODE_VERIFICATION'
  const [step, setStep] = useState<'FORM' | 'VERIFYING_SPINNER' | 'CODE_VERIFICATION'>('FORM');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const maskEmail = (emailStr?: string) => {
    if (!emailStr || !emailStr.includes('@')) return 'your registered email address';
    const [name, domain] = emailStr.split('@');
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    const firstTwo = name.slice(0, 2);
    const lastOne = name.slice(-1);
    const asterisks = '*'.repeat(Math.max(3, name.length - 3));
    return `${firstTwo}${asterisks}${lastOne}@${domain}`;
  };

  // Verification code state
  const [pendingAuthResponse, setPendingAuthResponse] = useState<any>(null);
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);

  // Forgot password flow states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [forgotStep, setForgotStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Form Submit: Validate Credentials -> Show Spinner -> Transition to Code Verification
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setLoginError(null);

    if (!identifier.trim() || !password) {
      setLoginError('Please enter your account identifier and password.');
      showToast('Please enter your account identifier and password.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Validate credentials with backend
      const res = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          loginIdentifier: identifier.trim(),
          password,
          loginType: 'CUSTOMER'
        })
      });

      // Save pending auth response
      setPendingAuthResponse(res);

      // 2. Switch to 3.5s loading animation with logo & "Verifying your credentials..." message
      setStep('VERIFYING_SPINNER');
      setIsSubmitting(false);

      setTimeout(() => {
        setStep('CODE_VERIFICATION');
      }, 3500);

    } catch (err: any) {
      setIsSubmitting(false);
      setLoginError(err.message || 'Customer authentication failed. Please check credentials.');
      showToast(err.message || 'Customer authentication failed.', 'error');
    }
  };

  // Code Verification Submit
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifyingCode) return;
    setCodeError(null);

    if (!enteredCode.trim() || enteredCode.trim().length !== 6) {
      setCodeError('Please enter a valid 6-digit login verification code.');
      return;
    }

    if (!pendingAuthResponse?.userId) {
      setCodeError('Session expired. Please restart login.');
      return;
    }

    setIsVerifyingCode(true);
    try {
      const res = await apiRequest('/api/auth/verify-login-otp', {
        method: 'POST',
        body: JSON.stringify({
          userId: pendingAuthResponse.userId,
          otpCode: enteredCode.trim()
        })
      });

      showToast('Login verification successful!', 'success');
      login(res);
    } catch (err: any) {
      setCodeError(err.message || 'Invalid or expired verification code. Please check your registered email or security portal.');
      showToast(err.message || 'Verification failed.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Password Reset Handlers
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;

    setIsSendingOtp(true);
    try {
      const res = await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail })
      });
      showToast(res.message, 'success');
      setForgotStep('VERIFY');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate reset OTP', 'error');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || !newPassword) return;

    try {
      const res = await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          email: resetEmail,
          otpCode,
          newPassword
        })
      });

      showToast(res.message, 'success');
      setShowForgotModal(false);
      setForgotStep('REQUEST');
      setOtpHint(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    }
  };

  // RENDER STEP 2: Loading Verification Spinner (3.5 seconds)
  if (step === 'VERIFYING_SPINNER') {
    return (
      <div className="min-h-screen bg-[#0A0D12] flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-[#12161F] p-8 sm:p-12 rounded-3xl shadow-2xl border border-[#2A3241] max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <BrandLogo variant="dark" showTagline={false} />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-extrabold text-[#F1F5F9]">NOVA TRUST BANK</h3>
            <p className="text-xs text-[#D4AF37] font-mono uppercase tracking-wider">Private Security Access Portal</p>
          </div>

          <div className="py-6 space-y-4">
            <Loader2 className="w-10 h-10 text-[#D4AF37] animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#F1F5F9]">
              Verifying your credentials… Please wait.
            </p>
            <p className="text-xs text-[#94A3B8]">
              Establishing 256-bit encrypted session handshake...
            </p>
          </div>

          <div className="pt-2 border-t border-[#2A3241] text-[11px] text-[#94A3B8]">
            Nova Trust Bank Security Protocol TLS 1.3
          </div>
        </div>
      </div>
    );
  }

  // RENDER STEP 3: Login Verification Code Input Page
  if (step === 'CODE_VERIFICATION') {
    return (
      <div className="min-h-screen bg-[#0A0D12] flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        
        {onGoHome && (
          <div className="w-full max-w-md mb-4 flex justify-start">
            <button
              onClick={onGoHome}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white"
            >
              <Home className="w-4 h-4 text-[#D4AF37]" />
              <span>Return to Homepage</span>
            </button>
          </div>
        )}

        <div className="bg-[#12161F] p-6 sm:p-10 rounded-3xl shadow-2xl border border-[#2A3241] max-w-md w-full space-y-6">
          
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <BrandLogo variant="dark" showTagline={false} />
            </div>
            <h2 className="text-xl font-extrabold text-[#F1F5F9]">Login Verification</h2>
            <p className="text-xs text-[#94A3B8]">
              For your account security, enter the 6-digit verification code below.
            </p>
          </div>

          {/* SECURE NOTIFICATION BANNER (Code delivered to email & admin portal only) */}
          <div className="p-4 bg-[#0A0D12] text-white rounded-2xl shadow-md border border-[#D4AF37]/40 space-y-1.5">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">
                Verification Security Code Sent
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              A 6-digit authorization code has been dispatched to your registered email (<span className="text-white font-mono font-semibold">{pendingAuthResponse?.userEmail ? maskEmail(pendingAuthResponse.userEmail) : 'your registered email'}</span>) and Security Center.
            </p>
          </div>

          {codeError && (
            <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{codeError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Enter 6-Digit Verification Code
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={enteredCode}
                  onChange={e => setEnteredCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="block w-full pl-10 pr-3 py-3 text-sm font-mono tracking-widest font-bold text-slate-900 bg-white rounded-xl border border-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isVerifyingCode}
              className="w-full py-3 px-4 rounded-xl text-xs font-extrabold text-[#0A0D12] bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifyingCode ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0D12]" />
                  <span>Authenticating Code...</span>
                </>
              ) : (
                <>
                  <span>Verify &amp; Continue to Banking</span>
                  <ArrowRight className="w-4 h-4 text-[#0A0D12]" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setStep('FORM');
                setEnteredCode('');
                setPendingAuthResponse(null);
              }}
              className="text-xs text-gray-400 hover:text-white underline font-medium"
            >
              Cancel and Return to Sign In
            </button>
          </div>

        </div>
      </div>
    );
  }

  // RENDER STEP 1: Standard Customer Login Form
  return (
    <div className="min-h-screen relative bg-[#0A0D12] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans overflow-hidden">
      
      {/* Realistic Corporate Banking Background Backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src={loginBgImg}
          alt="Nova Trust Financial District"
          className="w-full h-full object-cover opacity-20 filter contrast-125 brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D12] via-[#0A0D12]/80 to-[#0A0D12]/90"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto">
      
      {onGoHome && (
        <div className="mb-4 flex justify-start">
          <button
            onClick={onGoHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4 text-[#D4AF37]" />
            <span>Return to Nova Trust Homepage</span>
          </button>
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="flex justify-center mb-2">
          <BrandLogo variant="dark" showTagline={true} />
        </div>
        <p className="text-xs text-[#94A3B8]">
          Secure Personal &amp; Corporate Online Banking Sign In
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#12161F] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-[#2A3241]">
          
          <div className="mb-5 p-3.5 bg-[#1A2232] border border-[#D4AF37]/30 rounded-2xl flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300 leading-relaxed">
              Use your registered Email Address, Account Number, or Username to log in.
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800 rounded-xl flex items-center gap-2 text-rose-200 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-1.5">
                Email / Customer ID / Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <UserCheck className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder="e.g. 1092837465 or client@example.com"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-xs text-[#D4AF37] hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3 py-2.5 text-xs rounded-xl border border-slate-300 bg-white text-slate-900 font-medium placeholder-slate-400 focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-[#2A3241] text-[#D4AF37] focus:ring-[#D4AF37] bg-[#0A0D12]"
                />
                <span>Remember Me</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold text-[#0A0D12] bg-gradient-to-r from-[#D4AF37] to-[#B89228] hover:from-[#E5C158] hover:to-[#CBA532] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] transition-colors shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0A0D12]" />
                  <span>Checking Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[#0A0D12]" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Owner Admin Login */}
          {onSwitchToOwner && (
            <div className="mt-5 pt-4 border-t border-[#2A3241] text-center">
              <button
                type="button"
                onClick={onSwitchToOwner}
                className="text-xs text-[#D4AF37] hover:underline font-semibold inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Bank Owner / Administrative Staff Login</span>
              </button>
            </div>
          )}

        </div>
      </div>
      </div>

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#12161F] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#2A3241]">
            <h3 className="text-base font-bold text-white mb-1">Reset Account Password</h3>
            <p className="text-xs text-gray-400 mb-4">
              {forgotStep === 'REQUEST'
                ? 'Enter your registered email address to generate an OTP code.'
                : 'Enter the 6-digit OTP sent to your email and your new password.'}
            </p>

            {forgotStep === 'REQUEST' ? (
              <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  placeholder="Registered Email Address"
                  className="w-full px-3 py-2.5 text-xs border border-slate-300 bg-white text-slate-900 font-medium placeholder-slate-400 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:bg-[#1A2232] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp}
                    className="px-4 py-2 text-xs font-bold text-[#0A0D12] bg-[#D4AF37] hover:bg-[#E5C158] rounded-xl flex items-center gap-1.5"
                  >
                    {isSendingOtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Send OTP</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">OTP Code</label>
                  <input
                    type="text"
                    required
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 bg-white text-slate-900 font-bold placeholder-slate-400 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-3 py-2 text-xs border border-slate-300 bg-white text-slate-900 font-medium placeholder-slate-400 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('REQUEST')}
                    className="px-4 py-2 text-xs font-semibold text-gray-400 hover:bg-[#1A2232] rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-[#0A0D12] bg-[#D4AF37] hover:bg-[#E5C158] rounded-xl"
                  >
                    Reset Password
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
