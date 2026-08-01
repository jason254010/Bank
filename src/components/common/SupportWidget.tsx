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
  Download,
  CheckCircle,
  Clock,
  UserCircle2,
  Headphones
} from 'lucide-react';

interface SupportWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportWidget: React.FC<SupportWidgetProps> = ({ isOpen, onClose }) => {
  const { user, showToast } = useAuth();
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<SupportAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
      // Get conversation for user or guest
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
  }, [messages]);

  // Poll for new messages every 4 seconds when widget is open
  useEffect(() => {
    if (!isOpen || !conversation || !user) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await apiRequest<SupportMessage[]>(`/api/support/conversations/${conversation.id}/messages`);
        setMessages(msgs);
      } catch (e) {
        // Ignore background errors
      }
    }, 4000);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;
    if (!conversation) return;

    setIsSending(true);
    try {
      const msg = await apiRequest<SupportMessage>('/api/support/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId: conversation.id,
          text: newMessage.trim(),
          attachments
        })
      });

      setMessages(prev => [...prev, msg]);
      setNewMessage('');
      setAttachments([]);
      scrollToBottom();
    } catch (err: any) {
      showToast(err.message || 'Failed to send support message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 sm:w-[420px] sm:h-[540px] bg-white sm:rounded-2xl shadow-2xl border border-[#DCE3EC] flex flex-col overflow-hidden animate-fade-in font-sans">
        {/* Support Header */}
        <div className="bg-[#0B1F3A] text-white p-4 flex items-center justify-between border-b border-[#0F4C81]/40">
          <div className="flex items-center gap-3">
            <div className="bg-[#0F4C81] p-2.5 rounded-xl text-[#D4AF37] border border-white/10 shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Nova Trust Support Desk</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] font-mono font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>24/7 Live Desk Officer</span>
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

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-4 sm:right-4 z-50 sm:w-[420px] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl border border-[#DCE3EC] flex flex-col overflow-hidden animate-fade-in font-sans">
      
      {/* Support Header */}
      <div className="bg-[#0B1F3A] text-white p-4 flex items-center justify-between border-b border-[#0F4C81]/40">
        <div className="flex items-center gap-3">
          <div className="bg-[#0F4C81] p-2.5 rounded-xl text-[#D4AF37] border border-white/10 shadow-sm">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">Nova Trust Live Desk</h3>
            <div className="flex items-center gap-1.5 text-[11px] text-[#D4AF37] font-mono font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>24/7 Priority Support Desk</span>
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

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#F5F7FA] space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#5E6C84]">
            <Clock className="w-8 h-8 animate-spin text-[#0F4C81] mb-2" />
            <p className="text-xs font-mono">Connecting to secure 256-bit support queue...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-white rounded-2xl border border-[#DCE3EC] shadow-sm">
            <MessageSquare className="w-10 h-10 text-[#0F4C81] mb-2" />
            <h4 className="font-extrabold text-sm text-[#0B1F3A]">How can our bank concierge assist you?</h4>
            <p className="text-xs text-[#5E6C84] mt-1 max-w-xs">
              Send a message or attach documents to connect directly with your dedicated account desk officer.
            </p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = user ? msg.senderId === user.id : msg.senderRole === 'CUSTOMER';
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMe ? 'flex-row-reverse items-end' : 'flex-row items-start'}`}
              >
                {/* Sender Avatar */}
                {isMe && user?.profilePicture ? (
                  <img src={user.profilePicture} alt={msg.senderName} className="w-7 h-7 rounded-full object-cover border border-[#0057B8] flex-shrink-0 mb-1" />
                ) : (
                  <div className={`w-7 h-7 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0 mb-1 ${
                    isMe ? 'bg-[#0057B8] text-white' : 'bg-[#0F3557] text-[#A9D8F7]'
                  }`}>
                    {msg.senderName ? msg.senderName.substring(0, 2).toUpperCase() : 'NT'}
                  </div>
                )}

                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#6E7A87] mb-1 px-1">
                    <span className="font-medium">{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs shadow-xs ${
                      isMe
                        ? 'bg-[#0057B8] text-white rounded-tr-none'
                        : 'bg-white text-[#1E2A36] border border-[#D9DEE5] rounded-tl-none'
                    }`}
                  >
                  {msg.text && <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>}

                  {/* Attachments rendering */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-white/20 pt-2">
                      {msg.attachments.map(att => (
                        <div
                          key={att.id}
                          className={`flex items-center justify-between gap-2 p-2 rounded-lg text-[11px] ${
                            isMe ? 'bg-white/10 text-white' : 'bg-[#F3F5F7] text-[#1E2A36]'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {att.type.startsWith('image/') ? (
                              <ImageIcon className="w-4 h-4 flex-shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 flex-shrink-0" />
                            )}
                            <span className="truncate max-w-[140px] font-mono">{att.name}</span>
                          </div>

                          <a
                            href={att.url}
                            download={att.name}
                            className="p-1 rounded hover:bg-black/10 transition-colors"
                            title="Download Attachment"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attachment Previews Before Sending */}
      {attachments.length > 0 && (
        <div className="px-3 py-2 bg-white border-t border-[#D9DEE5] flex flex-wrap gap-2">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-1.5 bg-[#A9D8F7]/30 text-[#0F3557] px-2 py-1 rounded-md text-xs">
              <span className="truncate max-w-[120px] font-mono">{att.name}</span>
              <button onClick={() => removeAttachment(att.id)} className="hover:text-red-600">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
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
          placeholder="Type your message..."
          className="flex-1 bg-white text-black caret-black text-xs px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0F4C81] focus:ring-2 focus:ring-[#0F4C81]/20 placeholder:text-gray-500 font-sans shadow-xs"
        />

        <button
          type="submit"
          disabled={isSending || (!newMessage.trim() && attachments.length === 0)}
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
