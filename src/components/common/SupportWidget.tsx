import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import { SupportConversation, SupportMessage, SupportAttachment } from '../../types';
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
  ExternalLink
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

  // Verification Form State
  const [verifFullName, setVerifFullName] = useState('');
  const [verifCustomerIdOrEmail, setVerifCustomerIdOrEmail] = useState('');
  const [verifPassword, setVerifPassword] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
  }, [messages, isAiThinking]);

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

  const selectSupportMode = async (mode: 'AI_ASSISTANT' | 'HUMAN_VERIFICATION') => {
    if (!conversation) return;
    try {
      const updatedConv = await apiRequest<SupportConversation>(`/api/support/conversations/${conversation.id}/mode`, {
        method: 'PUT',
        body: JSON.stringify({ mode })
      });
      setConversation(updatedConv);
      const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
      setMessages(msgs);
    } catch (err: any) {
      showToast('Failed to select support mode', 'error');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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

      // If in INITIAL or SELECT_MODE mode, set mode to AI_ASSISTANT by default or trigger AI chat
      const currentMode = conversation.mode || 'INITIAL';

      if (currentMode === 'INITIAL' || currentMode === 'SELECT_MODE' || currentMode === 'AI_ASSISTANT') {
        setIsAiThinking(true);
        try {
          const aiRes = await apiRequest<{ message: SupportMessage; conversation: SupportConversation }>('/api/support/ai-chat', {
            method: 'POST',
            body: JSON.stringify({
              conversationId: conversation.id,
              userMessage: userText
            })
          });
          setMessages(prev => [...prev, aiRes.message]);
          if (aiRes.conversation) setConversation(aiRes.conversation);
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

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conversation) return;
    if (!verifFullName || !verifCustomerIdOrEmail || !verifPassword) {
      showToast('Please fill in all verification fields.', 'error');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string; conversation: SupportConversation; aiMessage: SupportMessage }>('/api/support/verify-identity', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          fullName: verifFullName,
          customerIdOrEmail: verifCustomerIdOrEmail,
          password: verifPassword
        })
      });

      if (res.success) {
        showToast('Identity verified successfully!', 'success');
        setConversation(res.conversation);
        setVerifFullName('');
        setVerifCustomerIdOrEmail('');
        setVerifPassword('');
        const updatedMsgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
        setMessages(updatedMsgs);
      }
    } catch (err: any) {
      showToast(err.message || 'Verification unsuccessful. Details do not match our records.', 'error');
      const updatedMsgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
      setMessages(updatedMsgs);
    } finally {
      setIsVerifying(false);
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
              <h3 className="font-extrabold text-sm text-white">Nova Trust Customer Support</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>24/7 Intelligent Banking Desk</span>
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

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 sm:w-[440px] sm:h-[620px] bg-white sm:rounded-2xl shadow-2xl border border-[#DCE3EC] flex flex-col overflow-hidden animate-fade-in font-sans">
      
      {/* Support Header & Quick External Channels */}
      <div className="bg-[#0B1F3A] text-white border-b border-[#0F4C81]/40">
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0F4C81] p-2 rounded-xl text-[#D4AF37] border border-white/10 shadow-sm">
              <Bot className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Nova Trust Support Assistant</h3>
              <div className="flex items-center gap-1.5 text-[10px] text-[#D4AF37] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>24/7 Virtual Concierge &amp; Live Desk</span>
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

        {/* External Quick Access Channels */}
        <div className="bg-[#08172C] px-3.5 py-1.5 flex items-center justify-between text-[11px] border-t border-white/10">
          <span className="text-gray-400 font-medium">Direct Support Channels:</span>
          <div className="flex items-center gap-2">
            <a
              href={`https://wa.me/${formattedWhatsApp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded font-semibold flex items-center gap-1 text-[10px] border border-emerald-500/30 transition-colors"
            >
              <span>WhatsApp</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <a
              href={`https://t.me/${rawTelegram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 bg-sky-600/30 hover:bg-sky-600/50 text-sky-300 rounded font-semibold flex items-center gap-1 text-[10px] border border-sky-500/30 transition-colors"
            >
              <span>Telegram</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Support Mode Status Banner */}
      {currentMode === 'HUMAN_SUPPORT' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">Verified Human Representative Connected</span>
          </div>
          <span className="text-[10px] font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900 font-semibold">
            LIVE DESK
          </span>
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#F5F7FA] space-y-3.5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#5E6C84]">
            <Clock className="w-8 h-8 animate-spin text-[#0F4C81] mb-2" />
            <p className="text-xs font-mono">Connecting to 24/7 AI Banking Desk...</p>
          </div>
        ) : (
          <>
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
                      className={`p-3 rounded-2xl max-w-[88%] text-xs shadow-xs ${
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
                <span className="font-medium">AI Concierge is preparing guidance...</span>
              </div>
            )}

            {/* Prompt for Selecting AI vs Human Support */}
            {currentMode !== 'HUMAN_SUPPORT' && currentMode !== 'HUMAN_VERIFICATION' && (
              <div className="my-3 p-3.5 bg-white rounded-2xl border border-[#0057B8]/20 shadow-sm text-center space-y-2.5">
                <p className="text-xs font-semibold text-[#0B1F3A]">
                  Would you like assistance from our AI Assistant or would you prefer to speak with a Human Support Representative?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => selectSupportMode('AI_ASSISTANT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      currentMode === 'AI_ASSISTANT'
                        ? 'bg-[#0057B8] text-white border-[#0057B8] shadow-xs'
                        : 'bg-blue-50 text-[#0057B8] border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>AI Assistant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => selectSupportMode('HUMAN_VERIFICATION')}
                    className="py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>Human Support</span>
                  </button>
                </div>
              </div>
            )}

            {/* Human Support Identity Verification Form */}
            {currentMode === 'HUMAN_VERIFICATION' && (
              <div className="bg-white rounded-2xl border-2 border-[#0057B8] p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                  <ShieldCheck className="w-5 h-5 text-[#0057B8]" />
                  <div>
                    <h4 className="font-bold text-xs text-[#0B1F3A]">Identity Verification Required</h4>
                    <p className="text-[10px] text-gray-500">
                      Before connecting with a Human Support Representative, please verify your details.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Full Name <span className="text-rose-500">*</span>
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
                      Customer ID or Registered Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={verifCustomerIdOrEmail}
                      onChange={e => setVerifCustomerIdOrEmail(e.target.value)}
                      placeholder="e.g. CID-849201 or customer@example.com"
                      required
                      className="w-full bg-white text-black caret-black px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                      Account Password <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={verifPassword}
                      onChange={e => setVerifPassword(e.target.value)}
                      placeholder="Enter account password"
                      required
                      className="w-full bg-white text-black caret-black px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0057B8]"
                    />
                  </div>

                  <div className="pt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => selectSupportMode('AI_ASSISTANT')}
                      className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 rounded-xl font-semibold text-xs transition-colors"
                    >
                      Back to AI
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="flex-2 bg-[#0057B8] hover:bg-[#004bb0] text-white py-2 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {isVerifying ? 'Verifying...' : 'Verify & Connect Representative'}
                    </button>
                  </div>
                </form>
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
          placeholder={currentMode === 'HUMAN_VERIFICATION' ? 'Complete identity verification above...' : 'Ask AI or type support request...'}
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
