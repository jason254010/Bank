import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { BrandLogo } from '../common/BrandLogo';
import { Lock, ArrowRight, Shield, Loader2, Home, AlertCircle, CheckCircle2, KeyRound, Mail, ArrowLeft, ExternalLink } from 'lucide-react';

interface OwnerLoginProps {
  onSwitchToCustomer: () => void;
  onGoHome?: () => void;
}

type AuthMode = 'LOGIN' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';

export const OwnerLogin: React.FC<OwnerLoginProps> = ({ onSwitchToCustomer, onGoHome }) => {
  const { login, showToast } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [devResetLink, setDevResetLink] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Reset Password state (via URL token)
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [isVerifyingToken, setIsVerifyingToken] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenOwnerEmail, setTokenOwnerEmail] = useState<string | null>(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  // Check URL search parameters for token on mount or URL change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token') || searchParams.get('resetToken') || searchParams.get('ownerResetToken');
    
    if (token) {
      setResetToken(token);
      setMode('RESET_PASSWORD');
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (tok: string) => {
    setIsVerifyingToken(true);
    setTokenError(null);
    setTokenValid(null);

    try {
      const res = await apiRequest(`/api/auth/owner/verify-reset-token?token=${encodeURIComponent(tok)}`);
      if (res.valid) {
        setTokenValid(true);
        if (res.email) setTokenOwnerEmail(res.email);
      } else {
        setTokenValid(false);
        setTokenError(res.error || 'Invalid or expired password reset link.');
      }
    } catch (err: any) {
      setTokenValid(false);
      setTokenError(err.message || 'Invalid or expired password reset link. Please request a new link.');
    } finally {
      setIsVerifyingToken(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccessMessage(null);
    setDevResetLink(null);

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotError('Please enter your administrator email address.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setForgotError('Please enter a valid administrator email address.');
      return;
    }

    setForgotSubmitting(true);
    try {
      const res = await apiRequest('/api/auth/owner/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: trimmedEmail })
      });

      setForgotSuccessMessage(res.message || 'If an account exists for this email, a reset link has been sent.');
      if (res.resetLink) {
        setDevResetLink(res.resetLink);
      }
      showToast('Password reset request processed.', 'success');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to request password reset. Please try again.');
    } finally {
      setForgotSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);

    if (!resetToken) {
      setResetError('Reset token is missing. Please request a new link.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setResetError('Please enter and confirm your new password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters long.');
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await apiRequest('/api/auth/owner/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          newPassword,
          confirmPassword
        })
      });

      setResetSuccess(res.message || 'Your administrator password has been reset successfully.');
      showToast('Password reset successfully! Please log in.', 'success');
      
      // Clear token from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('resetToken');
      url.searchParams.delete('ownerResetToken');
      window.history.replaceState({}, '', url.pathname);

      // Reset form states & switch back to login after 2.5 seconds
      setTimeout(() => {
        setMode('LOGIN');
        setEmail(tokenOwnerEmail || forgotEmail || '');
        setPassword('');
        setResetSuccess(null);
        setResetToken(null);
      }, 2000);

    } catch (err: any) {
      setResetError(err.message || 'Failed to reset password. Please try requesting a new link.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const openTestResetLink = (linkUrl: string) => {
    try {
      const urlObj = new URL(linkUrl);
      const token = urlObj.searchParams.get('token');
      if (token) {
        setResetToken(token);
        setMode('RESET_PASSWORD');
        verifyToken(token);
      } else {
        window.location.href = linkUrl;
      }
    } catch (_) {
      window.location.href = linkUrl;
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
          
          {/* ================= MODE: LOGIN ================= */}
          {mode === 'LOGIN' && (
            <>
              {loginError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                      Admin Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotError(null);
                        setForgotSuccessMessage(null);
                        setDevResetLink(null);
                        setMode('FORGOT_PASSWORD');
                      }}
                      className="text-xs text-[#0F4C81] hover:text-[#0B1F3A] hover:underline font-semibold flex items-center gap-1"
                    >
                      <KeyRound className="w-3 h-3 text-[#D4AF37]" />
                      <span>Forgot Password?</span>
                    </button>
                  </div>
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
            </>
          )}

          {/* ================= MODE: FORGOT PASSWORD ================= */}
          {mode === 'FORGOT_PASSWORD' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-full border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-2 text-[#0B1F3A]">
                  <KeyRound className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <h3 className="text-base font-bold text-[#0B1F3A]">Admin Password Recovery</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter your registered administrator email address. If an account exists, a secure single-use 15-minute reset link will be generated.
                </p>
              </div>

              {forgotError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{forgotError}</span>
                </div>
              )}

              {forgotSuccessMessage ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                      <span>Password Reset Link Dispatched</span>
                    </div>
                    <p>{forgotSuccessMessage}</p>
                    <p className="text-[11px] text-emerald-700">
                      Please check your administrator email inbox or audit logs for the secure 15-minute reset link.
                    </p>
                  </div>

                  {/* Dev / Preview Helper Button if reset link is available */}
                  {devResetLink && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>System Generated Secure Reset Link (Preview Mode):</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openTestResetLink(devResetLink)}
                        className="w-full py-2 px-3 bg-[#0F4C81] hover:bg-[#0B1F3A] text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Open Reset Password Link</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMode('LOGIN');
                      setForgotSuccessMessage(null);
                    }}
                    className="w-full py-2.5 px-4 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4 text-slate-500" />
                    <span>Return to Admin Login</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} noValidate className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                      Registered Owner Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      placeholder="admin@novatrustbank.com"
                      className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-slate-900 placeholder-slate-400 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={forgotSubmitting}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#0F4C81] focus:outline-none transition-colors shadow-md disabled:bg-[#DCE3EC]"
                  >
                    {forgotSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        <span>Generating Secure Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 text-[#D4AF37]" />
                        <span>Send Password Reset Link</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-[#0F4C81] hover:underline text-center flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Admin Login</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ================= MODE: RESET PASSWORD (URL TOKEN) ================= */}
          {mode === 'RESET_PASSWORD' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full border border-[#0F4C81]/30 flex items-center justify-center mx-auto mb-2 text-[#0B1F3A]">
                  <Lock className="w-6 h-6 text-[#0F4C81]" />
                </div>
                <h3 className="text-base font-bold text-[#0B1F3A]">Set New Admin Password</h3>
                {tokenOwnerEmail && (
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Account: <span className="font-bold text-[#0B1F3A]">{tokenOwnerEmail}</span>
                  </p>
                )}
              </div>

              {isVerifyingToken && (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0F4C81] mx-auto" />
                  <p className="text-xs text-slate-600 font-semibold">Verifying secure single-use reset token...</p>
                </div>
              )}

              {!isVerifyingToken && tokenValid === false && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-rose-800 text-sm">
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      <span>Invalid or Expired Reset Link</span>
                    </div>
                    <p>{tokenError || 'This password reset token is invalid, expired, or has already been used.'}</p>
                    <p className="text-[11px] text-rose-700">
                      Reset links are strictly valid for 15 minutes and can only be used once.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('FORGOT_PASSWORD');
                      setForgotError(null);
                      setForgotSuccessMessage(null);
                    }}
                    className="w-full py-3 px-4 bg-[#0B1F3A] hover:bg-[#0F4C81] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
                  >
                    <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                    <span>Request a New Reset Link</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('LOGIN')}
                    className="w-full py-2.5 px-4 text-xs font-semibold text-slate-600 hover:underline text-center flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Return to Admin Login</span>
                  </button>
                </div>
              )}

              {!isVerifyingToken && tokenValid === true && (
                <>
                  {resetError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  {resetSuccess ? (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs space-y-2 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                      <h4 className="font-bold text-sm text-emerald-900">Password Reset Complete</h4>
                      <p>{resetSuccess}</p>
                      <p className="text-[11px] text-emerald-700 pt-1 font-semibold">Redirecting to administrator login terminal...</p>
                    </div>
                  ) : (
                    <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                          New Admin Password
                        </label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-slate-900 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-1.5">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="block w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-[#0F4C81] focus:border-[#0F4C81] text-slate-900 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resetSubmitting}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#0B1F3A] hover:bg-[#0F4C81] focus:outline-none transition-colors shadow-md disabled:bg-[#DCE3EC]"
                      >
                        {resetSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                            <span>Updating Admin Password...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-[#D4AF37]" />
                            <span>Update Administrator Password</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </>
              )}
            </div>
          )}

          {/* Switch to Customer Login */}
          <div className="mt-5 pt-4 border-t border-[#DCE3EC] text-center">
            <button
              type="button"
              onClick={onSwitchToCustomer}
              className="text-xs text-[#0F4C81] hover:underline font-semibold inline-flex items-center gap-1.5"
            >
              <span>Customer Personal &amp; Business Online Banking Login</span>
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
