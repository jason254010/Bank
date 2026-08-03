import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { SupportConversation, SupportMessage, SupportAttachment } from '../../types';
import { HotlineCallModal } from './HotlineCallModal';
import {
  SupportLanguage,
  SUPPORT_LANGUAGES,
  getTranslation
} from '../../utils/supportTranslations';
import {
  MessageSquare,
  X,
  Send,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Eye,
  Download,
  CheckCircle,
  Clock,
  UserCircle2,
  Headphones,
  Bot,
  UserCheck,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Globe,
  ChevronDown,
  ArrowRight,
  Loader2,
  Phone
} from 'lucide-react';

interface SupportWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ isOpen, onClose }) => {
  const { user, showToast, settings } = useAuth();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Language state stored in localStorage
  const [selectedLang, setSelectedLang] = useState<SupportLanguage>(() => {
    const saved = localStorage.getItem('nova_support_lang') as SupportLanguage;
    return saved && SUPPORT_LANGUAGES.some(l => l.code === saved) ? saved : 'en';
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);

  // Flow State Flags
  const [showAccountReviewForm, setShowAccountReviewForm] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isAccountReviewing, setIsAccountReviewing] = useState(false);

  // Verification Form State
  const [verifFullName, setVerifFullName] = useState('');
  const [verifAccountNumber, setVerifAccountNumber] = useState('');
  const [verifEmail, setVerifEmail] = useState('');

  // Hotline Modal State
  const [isHotlineModalOpen, setIsHotlineModalOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleChannelSwitch = async (newChannel: 'IN_APP' | 'WHATSAPP' | 'TELEGRAM') => {
    if (!conversation) return;
    try {
      const res = await apiRequest<{ success: boolean; conversation: SupportConversation }>(`/api/support/conversations/${conversation.id}/channel`, {
        method: 'PUT',
        body: JSON.stringify({ channel: newChannel })
      });
      if (res.conversation) {
        setConversation(res.conversation);
        showToast(`Switched support channel to ${newChannel === 'WHATSAPP' ? 'WhatsApp' : newChannel === 'TELEGRAM' ? 'Telegram' : 'Website'}`, 'info');
      }
    } catch (err) {
      console.error('Failed to update channel:', err);
    }
  };

  const t = (key: string, fallback?: string) => getTranslation(selectedLang, key, fallback);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const changeLanguage = (lang: SupportLanguage) => {
    setSelectedLang(lang);
    localStorage.setItem('nova_support_lang', lang);
    setIsLangMenuOpen(false);
    showToast(`Support language updated to ${SUPPORT_LANGUAGES.find(l => l.code === lang)?.name}`, 'info');
  };

  const loadConversationAndMessages = async () => {
    if (!isOpen || !user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const convs = await apiRequest<SupportConversation[]>('/api/support/conversations');
      if (convs && convs.length > 0) {
        const activeConv = convs[0];
        setConversation(activeConv);

        const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${activeConv.id}/messages`);
        setMessages(msgs);

        // Prefill account review inputs with logged in user data for convenience
        setVerifFullName(user.fullName || '');
        setVerifEmail(user.email || '');
      }
    } catch (e: any) {
      if (!e?.message?.includes('Unauthorized')) {
        console.error('Failed to load support conversation:', e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConversationAndMessages();
  }, [isOpen, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiThinking, showAccountReviewForm, showContinueButton, isAccountReviewing]);

  // Poll for new messages every 3 seconds when widget is open
  useEffect(() => {
    if (!isOpen || !conversation || !user) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
        setMessages(msgs);
        const convs = await apiRequest<SupportConversation[]>('/api/support/conversations');
        if (convs && convs.length > 0) {
          setConversation(convs[0]);
        }
      } catch (e) {
        // Ignore background errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, conversation, user]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (file.size > 5 * 1024 * 1024) {
        showToast(`File ${file.name} exceeds 5MB limit`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setAttachments(prev => [
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

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const selectSupportMode = async (mode: 'AI_ASSISTANT' | 'HUMAN_SUPPORT') => {
    if (!conversation) return;

    if (mode === 'HUMAN_SUPPORT') {
      try {
        setIsLoading(true);
        const res = await apiRequest<{ success: boolean; message: SupportMessage; conversation: SupportConversation }>('/api/support/escalate-to-human', {
          method: 'POST',
          body: JSON.stringify({
            conversationId: conversation.id,
            targetLanguage: selectedLang
          })
        });
        if (res.conversation) setConversation(res.conversation);
        const updatedMsgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
        setMessages(updatedMsgs);
        setShowContinueButton(false);
        setShowAccountReviewForm(false);
      } catch (err: any) {
        showToast('Failed to connect with Human Support Agent', 'error');
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        const updatedConv = await apiRequest<SupportConversation>(`/api/support/conversations/${conversation.id}/mode`, {
          method: 'PUT',
          body: JSON.stringify({ mode: 'AI_ASSISTANT' })
        });
        setConversation(updatedConv);
        const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
        setMessages(msgs);
      } catch (err: any) {
        showToast('Failed to start AI Assistant session', 'error');
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || isAiThinking) return;
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!conversation) return;

    const userText = newMessage.trim();
    setIsSending(true);

    try {
      // 1. Post user message
      const msg = await apiRequest<SupportMessage>('/api/support/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          text: userText,
          attachments
        })
      });

      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setAttachments([]);
      scrollToBottom();

      const currentMode = conversation.mode || 'INITIAL';

      if (currentMode === 'INITIAL' || currentMode === 'SELECT_MODE' || currentMode === 'AI_ASSISTANT') {
        setIsAiThinking(true);
        try {
          const aiRes = await apiRequest<{
            message: SupportMessage;
            conversation: SupportConversation;
            showAccountReviewForm?: boolean;
            showContinueButton?: boolean;
          }>('/api/support/ai-chat', {
            method: 'POST',
            body: JSON.stringify({
              conversationId: conversation.id,
              userMessage: userText,
              targetLanguage: selectedLang
            })
          });
          setMessages(prev => [...prev, aiRes.message]);
          if (aiRes.conversation) setConversation(aiRes.conversation);
          if (aiRes.showAccountReviewForm) setShowAccountReviewForm(true);
          if (aiRes.showContinueButton) setShowContinueButton(true);
        } catch (aiErr) {
          console.error('AI Support Response failed:', aiErr);
        } finally {
          setIsAiThinking(false);
          scrollToBottom();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to send support message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleAccountReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;
    if (!verifFullName || !verifAccountNumber || !verifEmail) {
      showToast('Please fill in Full Name, Account Number, and Registered Email Address.', 'error');
      return;
    }

    setIsAccountReviewing(true);
    setShowAccountReviewForm(false);

    try {
      // Simulate realistic review verification delay
      await new Promise(res => setTimeout(res, 2200));

      const res = await apiRequest<{
        success: boolean;
        message: SupportMessage;
        conversation: SupportConversation;
        showContinueButton?: boolean;
      }>('/api/support/check-account-status', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          fullName: verifFullName,
          accountNumber: verifAccountNumber,
          email: verifEmail,
          targetLanguage: selectedLang
        })
      });

      if (res.conversation) setConversation(res.conversation);
      if (res.message) setMessages(prev => [...prev, res.message]);
      if (res.showContinueButton) setShowContinueButton(true);
    } catch (err: any) {
      showToast(err.message || 'Verification unsuccessful.', 'error');
    } finally {
      setIsAccountReviewing(false);
      scrollToBottom();
    }
  };

  const handleEscalateContinue = async () => {
    if (!conversation) return;
    try {
      setIsLoading(true);
      const res = await apiRequest<{ success: boolean; message: SupportMessage; conversation: SupportConversation }>('/api/support/escalate-to-human', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          targetLanguage: selectedLang
        })
      });
      if (res.conversation) setConversation(res.conversation);
      if (res.message) setMessages(prev => [...prev, res.message]);
      setShowContinueButton(false);
    } catch (err: any) {
      showToast('Failed to transfer to Human Support Agent', 'error');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const formattedWhatsApp = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '18005550199';
  const rawTelegram = settings?.telegramUsername?.replace('@', '').replace('https://t.me/', '') || 'NovaTrustSupport';

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 sm:w-[420px] sm:h-[580px] bg-white sm:rounded-2xl shadow-2xl border border-[#DCE3EC] flex flex-col overflow-hidden animate-fade-in font-sans">
        {/* Support Header */}
        <div className="bg-[#0B1F3A] text-white p-4 flex items-center justify-between border-b border-[#0F4C81]/40">
          <div className="flex items-center gap-3">
            <div className="bg-[#0F4C81] p-2.5 rounded-xl text-[#D4AF37] border border-white/10 shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{t('title')}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t('subtitle')}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content for Unauthenticated Visitor - Support Login */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center bg-[#F8FAFC]">
          <div className="w-full max-w-sm space-y-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 bg-[#0F4C81]/10 text-[#0F4C81] rounded-full mx-auto flex items-center justify-center mb-2">
                <UserCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-lg text-[#0B1F3A]">Customer Support Login</h4>
              <p className="text-xs text-gray-500">
                Log in with your Email Address or Customer ID to open a live support desk ticket.
              </p>
            </div>

            <SupportLoginForm onLoginSuccess={loadConversationAndMessages} />
          </div>
        </div>
      </div>
    );
  }

  const currentMode = conversation?.mode || 'INITIAL';
  const showWelcomeCard = currentMode === 'SELECT_MODE' || (currentMode === 'INITIAL' && messages.length <= 1);
  const currentLangObj = SUPPORT_LANGUAGES.find(l => l.code === selectedLang) || SUPPORT_LANGUAGES[0];

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 sm:w-[440px] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl border border-[#DCE3EC] flex flex-col overflow-hidden animate-fade-in font-sans">
      
      {/* Support Header & Quick External Channels */}
      <div className="bg-[#0B1F3A] text-white border-b border-[#0F4C81]/40 relative">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#0F4C81] p-2 rounded-xl text-[#D4AF37] border border-white/10 shadow-sm">
              <Bot className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">{t('title')}</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#D4AF37] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{t('subtitle')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Call Hotline Button */}
            <button
              type="button"
              onClick={() => setIsHotlineModalOpen(true)}
              className="flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold px-2.5 py-1.5 rounded-xl border border-amber-400/40 transition-all active:scale-95 shadow-xs"
              title="Call Nova Trust Hotline"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="hidden sm:inline">Hotline</span>
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border border-white/20 transition-colors"
                title="Select Support Language"
              >
                <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{currentLangObj.flag}</span>
                <span className="uppercase">{currentLangObj.code}</span>
                <ChevronDown className="w-3 h-3 text-gray-300" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-200 py-2 z-50 max-h-64 overflow-y-auto font-sans">
                  <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {t('languageLabel', 'Select Language')}
                  </div>
                  {SUPPORT_LANGUAGES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-blue-50 transition-colors ${
                        selectedLang === lang.code ? 'bg-blue-50/80 font-bold text-[#0057B8]' : 'text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.nativeName}</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase text-gray-400">{lang.code}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-300 hover:text-white p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Interactive Multi-Channel Mode Switcher Bar */}
        <div className="bg-[#08172C] px-3.5 py-2 flex items-center justify-between text-[11px] border-t border-white/10 gap-2">
          <span className="text-[#A9D8F7] font-semibold text-[10px] uppercase tracking-wider shrink-0">Channel:</span>
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'IN_APP', label: 'Website', icon: '🌐', bg: 'bg-indigo-600/30 text-indigo-200 border-indigo-400/40' },
              { id: 'WHATSAPP', label: 'WhatsApp', icon: '💬', bg: 'bg-emerald-600/30 text-emerald-300 border-emerald-400/40' },
              { id: 'TELEGRAM', label: 'Telegram', icon: '✈️', bg: 'bg-sky-600/30 text-sky-300 border-sky-400/40' }
            ].map(ch => {
              const isActive = (conversation?.channel || 'IN_APP') === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChannelSwitch(ch.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all flex items-center gap-1 shrink-0 ${
                    isActive ? `${ch.bg} shadow-xs ring-1 ring-white/20` : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <span>{ch.icon}</span>
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>

          {(conversation?.channel === 'WHATSAPP' || conversation?.channel === 'TELEGRAM') && (
            <a
              href={conversation.channel === 'WHATSAPP' ? `https://wa.me/${formattedWhatsApp}` : `https://t.me/${rawTelegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 bg-white/10 hover:bg-white/20 text-white rounded transition-colors shrink-0"
              title={`Open in ${conversation.channel === 'WHATSAPP' ? 'WhatsApp' : 'Telegram'}`}
            >
              <ExternalLink className="w-3 h-3 text-[#A9D8F7]" />
            </a>
          )}
        </div>
      </div>

      {/* Support Mode Status Banner */}
      {currentMode === 'HUMAN_SUPPORT' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{t('verifiedHumanConnected')}</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 font-semibold">
            {t('liveDesk')}
          </span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#F5F7FA] space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#5E6C84]">
            <Clock className="w-8 h-8 animate-spin text-[#0F4C81] mb-2" />
            <p className="text-xs font-mono">Connecting to Nova Trust Banking Desk...</p>
          </div>
        ) : (
          <>
            {/* Welcome Flow Selector Screen */}
            {showWelcomeCard && (
              <div className="p-4 bg-white rounded-2xl border border-[#0057B8]/30 shadow-md space-y-3.5 text-center animate-fade-in">
                <div className="w-10 h-10 bg-[#0057B8]/10 text-[#0057B8] rounded-xl flex items-center justify-center mx-auto">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#0B1F3A] mb-1">
                    {t('welcomeHeader')}
                  </h4>
                  <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed font-medium">
                    {t('welcomeBody')}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => selectSupportMode('AI_ASSISTANT')}
                    className="w-full bg-[#0057B8] hover:bg-[#004bb0] text-white py-3 px-4 rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span>{t('aiAssistantOpt')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => selectSupportMode('HUMAN_SUPPORT')}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-[#0B1F3A] py-3 px-4 rounded-xl text-xs font-bold border border-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <span>{t('humanSupportOpt')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map(msg => {
              const isMe = msg.senderId === user.id;
              const isAi = msg.senderId === 'AI_BOT' || msg.senderName.includes('AI') || msg.senderName.includes('Concierge');
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse items-end' : 'flex-row items-start'}`}
                >
                  {/* Sender Avatar */}
                  {isMe ? (
                    user?.profilePicture ? (
                      <img src={user.profilePicture} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover border border-[#0057B8] flex-shrink-0 mb-1" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#0057B8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mb-1">
                        {user.fullName ? user.fullName.substring(0, 2).toUpperCase() : 'ME'}
                      </div>
                    )
                  ) : isAi ? (
                    <div className="w-7 h-7 rounded-full bg-[#0F3557] text-[#D4AF37] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mb-1 border border-[#D4AF37]/40 shadow-xs">
                      <Bot className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#0057B8] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 mb-1">
                      NT
                    </div>
                  )}

                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#6E7A87] mb-1 px-1">
                      <span className="font-semibold text-[#0B1F3A]">{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl max-w-[90%] text-xs shadow-xs ${
                        isMe
                          ? 'bg-[#0057B8] text-white rounded-tr-none'
                          : isAi
                          ? 'bg-white text-[#1E2A36] border border-[#BCE0FD] rounded-tl-none ring-1 ring-[#0057B8]/10'
                          : 'bg-white text-[#1E2A36] border border-[#D9DEE5] rounded-tl-none'
                      }`}
                    >
                      {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                      {/* Attachments rendering */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 space-y-2 border-t border-gray-200 pt-2">
                          {msg.attachments.map(att => {
                            const isImage = att.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(att.name);
                            if (isImage) {
                              return (
                                <div key={att.id} className="rounded-xl overflow-hidden border border-black/10 bg-black/5 max-w-[240px] shadow-xs">
                                  <a href={att.url} target="_blank" rel="noopener noreferrer" className="block relative group">
                                    <img
                                      src={att.url}
                                      alt={att.name}
                                      className="w-full max-h-48 object-cover rounded-t-xl hover:opacity-95 transition-opacity"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold gap-1">
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>View Image</span>
                                    </div>
                                  </a>
                                  <div className={`p-1.5 flex items-center justify-between text-[10px] ${isMe ? 'bg-black/20 text-white' : 'bg-gray-100 text-[#1E2A36]'}`}>
                                    <span className="truncate max-w-[130px] font-mono">{att.name}</span>
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
                                    isMe ? 'bg-white/15 border-white/20 text-white' : 'bg-[#F3F5F7] border-[#D9DEE5] text-[#1E2A36]'
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
                                      isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-[#0057B8] text-white hover:bg-[#004bb0]'
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
                </div>
              );
            })}

            {/* AI Thinking Animation */}
            {isAiThinking && (
              <div className="flex items-center gap-2 text-xs text-[#0F4C81] bg-blue-50/80 p-2.5 rounded-xl border border-blue-200 animate-pulse w-fit">
                <Bot className="w-4 h-4 text-[#0F4C81] animate-bounce" />
                <span className="font-medium">AI Concierge is processing your request...</span>
              </div>
            )}

            {/* Account Review Verification Progress Loading State */}
            {isAccountReviewing && (
              <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm text-center space-y-2.5 animate-pulse">
                <Loader2 className="w-6 h-6 text-[#0057B8] animate-spin mx-auto" />
                <div className="text-xs text-[#0B1F3A] font-semibold whitespace-pre-line leading-relaxed">
                  {t('verifyingProgress')}
                </div>
              </div>
            )}

            {/* Interactive Account Review Form */}
            {showAccountReviewForm && !isAccountReviewing && (
              <div className="bg-white rounded-2xl border-2 border-[#0057B8] p-4 shadow-lg space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldCheck className="w-5 h-5 text-[#0057B8]" />
                  <div>
                    <h4 className="font-bold text-xs text-[#0B1F3A]">{t('verifyTitle')}</h4>
                    <p className="text-[10px] text-gray-500">
                      {t('verifySubtitle')}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAccountReviewSubmit} className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      {t('fullName')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={verifFullName}
                      onChange={e => setVerifFullName(e.target.value)}
                      placeholder="e.g. Johnathan Doe"
                      required
                      className="w-full bg-white text-black caret-black px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      {t('accountNumber')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={verifAccountNumber}
                      onChange={e => setVerifAccountNumber(e.target.value)}
                      placeholder="e.g. 1092837465"
                      required
                      className="w-full bg-white text-black caret-black px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      {t('registeredEmail')} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={verifEmail}
                      onChange={e => setVerifEmail(e.target.value)}
                      placeholder="e.g. customer@example.com"
                      required
                      className="w-full bg-white text-black caret-black px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="submit"
                      className="w-full bg-[#0057B8] hover:bg-[#004bb0] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                    >
                      {t('submitVerification')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Prominent Continue Escalation Button */}
            {showContinueButton && !isAccountReviewing && (
              <div className="pt-2 pb-1 flex justify-center animate-bounce-short">
                <button
                  type="button"
                  onClick={handleEscalateContinue}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-6 rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <span>{t('continueBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Previews Before Sending */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 bg-[#F8FAFC] border-t border-[#D9DEE5] flex flex-wrap gap-2 max-h-24 overflow-y-auto">
          {attachments.map(att => {
            const isImage = att.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(att.name);
            return (
              <div key={att.id} className="relative group flex items-center gap-2 bg-white border border-[#D9DEE5] px-2.5 py-1.5 rounded-xl shadow-xs text-xs">
                {isImage ? (
                  <img src={att.url} alt={att.name} className="w-6 h-6 rounded object-cover border border-gray-200" />
                ) : (
                  <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <div className="truncate max-w-[110px]">
                  <p className="font-mono text-[10px] font-semibold text-[#1E2A36] truncate">{att.name}</p>
                  <p className="text-[8px] text-[#6E7A87] font-mono">{att.size ? (att.size / 1024).toFixed(0) + ' KB' : (isImage ? 'Image' : 'PDF')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 hover:bg-rose-50 text-rose-600 rounded-md transition-colors"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-[#DCE3EC] flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          multiple
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-[#5E6C84] hover:text-[#0F4C81] hover:bg-[#F5F7FA] rounded-xl transition-colors"
          title="Attach files (Images, PDFs, Screenshots)"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder={t('inputPlaceholder')}
          className="flex-1 bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 placeholder:text-gray-500 font-sans shadow-xs"
        />

        <button
          type="submit"
          disabled={isSending || isAiThinking || (!newMessage.trim() && attachments.length === 0)}
          className="bg-[#0F4C81] hover:bg-[#0C3C66] disabled:bg-[#DCE3EC] text-white p-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center border border-white/10"
        >
          <Send className="w-4 h-4 text-[#D4AF37]" />
        </button>
      </form>

      {/* Hotline Simulator Audio Call Overlay */}
      <HotlineCallModal
        isOpen={isHotlineModalOpen}
        onClose={() => setIsHotlineModalOpen(false)}
        settings={settings}
        onSelectWhatsApp={() => handleChannelSwitch('WHATSAPP')}
        onSelectTelegram={() => handleChannelSwitch('TELEGRAM')}
        onSelectInApp={() => handleChannelSwitch('IN_APP')}
      />
    </div>
  );
};

const SupportLoginForm: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  const { login, showToast } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier || !password) return;
    setIsSubmitting(true);
    try {
      const res = await apiRequest<any>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          loginIdentifier: loginIdentifier.trim(),
          password,
          loginType: 'CUSTOMER'
        })
      });

      login(res);
      showToast('Support session connected', 'success');
      onLoginSuccess();
    } catch (err: any) {
      showToast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-left">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Email Address or Customer ID
        </label>
        <input
          type="text"
          value={loginIdentifier}
          onChange={e => setLoginIdentifier(e.target.value)}
          placeholder="e.g. customer@example.com or CID-849201"
          required
          className="w-full bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F4C81] placeholder:text-gray-400 font-sans"
        />
      </div>

      <div className="text-left">
        <label className="block text-xs font-semibold text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          className="w-full bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F4C81] placeholder:text-gray-400 font-sans"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0F4C81] hover:bg-[#0C3C66] text-white py-2.5 rounded-xl font-bold text-xs shadow-md transition-colors mt-2"
      >
        {isSubmitting ? 'Authenticating...' : 'Sign In to Customer Support'}
      </button>
    </form>
  );
};

