import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Volume2, VolumeX, Mic, MicOff, MessageSquare, ExternalLink, Headphones, Bot, X } from 'lucide-react';
import { BankSettings } from '../../types';

interface HotlineCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: BankSettings | null;
  onSelectWhatsApp?: () => void;
  onSelectTelegram?: () => void;
  onSelectInApp?: () => void;
}

export const HotlineCallModal: React.FC<HotlineCallModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSelectWhatsApp,
  onSelectTelegram,
  onSelectInApp
}) => {
  const [callState, setCallState] = useState<'IDLE' | 'DIALING' | 'CONNECTED' | 'ENDED'>('IDLE');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [speechProgress, setSpeechProgress] = useState(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const hotlinePhone = settings?.hotlinePhone || settings?.supportPhone || '+1 (800) 555-NOVA';
  const hotlineGreeting = settings?.hotlineGreeting ||
    "Welcome to Nova Trust Bank. Thank you for calling our Customer Support Hotline. At this time, live phone support is unavailable. For faster assistance, please contact us through our official WhatsApp or Telegram support channels, where our AI Assistant and Human Support Representatives are available to help you. Thank you for choosing Nova Trust Bank. Goodbye.";

  // Reset modal when opened
  useEffect(() => {
    if (isOpen) {
      setCallState('DIALING');
      setCallDuration(0);
      setSpeechProgress(0);

      // Transition from DIALING to CONNECTED after 1.8 seconds
      const dialTimer = setTimeout(() => {
        setCallState('CONNECTED');
      }, 1800);

      return () => clearTimeout(dialTimer);
    } else {
      stopSpeech();
      setCallState('IDLE');
    }
  }, [isOpen]);

  // Handle Speech Synthesis & Call Timer when CONNECTED
  useEffect(() => {
    let timer: any;
    if (callState === 'CONNECTED') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Play Voice Greeting using browser SpeechSynthesis
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // cancel any previous utterance
        const utterance = new SpeechSynthesisUtterance(hotlineGreeting);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.lang = 'en-US';

        utterance.onboundary = (event) => {
          if (event.name === 'word') {
            const progress = Math.min(100, Math.round((event.charIndex / hotlineGreeting.length) * 100));
            setSpeechProgress(progress);
          }
        };

        utterance.onend = () => {
          setSpeechProgress(100);
          setTimeout(() => {
            setCallState('ENDED');
          }, 1200);
        };

        utterance.onerror = () => {
          setSpeechProgress(100);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback progress timer if speech synth unavailable
        const progressInterval = setInterval(() => {
          setSpeechProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setCallState('ENDED');
              return 100;
            }
            return prev + 10;
          });
        }, 1000);
      }
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState, hotlineGreeting]);

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleEndCall = () => {
    stopSpeech();
    setCallState('ENDED');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const rawWhatsApp = settings?.whatsappNumber?.replace(/[^0-9]/g, '') || '18005550199';
  const rawTelegram = settings?.telegramUsername?.replace('@', '').replace('https://t.me/', '') || 'NovaTrustSupport';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-[#0F2238] border border-[#1E3A5F] rounded-3xl shadow-2xl overflow-hidden text-white flex flex-col relative">
        
        {/* Close Button */}
        <button
          onClick={() => {
            stopSpeech();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header info */}
        <div className="p-6 text-center space-y-3 pt-8 bg-gradient-to-b from-[#132A46] to-[#0F2238] border-b border-white/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#0057B8] border-4 border-white/20 flex items-center justify-center shadow-xl relative">
            <Headphones className="w-10 h-10 text-white" />
            {callState === 'DIALING' && (
              <span className="absolute inset-0 rounded-full border-4 border-sky-400 animate-ping opacity-75"></span>
            )}
            {callState === 'CONNECTED' && (
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0F2238] flex items-center justify-center">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white tracking-wide">Nova Trust Bank</h3>
            <p className="text-xs text-[#A9D8F7] font-mono mt-0.5">Hotline: {hotlinePhone}</p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold font-mono bg-white/10 border border-white/10">
            {callState === 'DIALING' && (
              <span className="text-amber-300 flex items-center gap-1.5 animate-pulse">
                <Phone className="w-3.5 h-3.5 animate-bounce" />
                <span>Dialing Secure Line...</span>
              </span>
            )}
            {callState === 'CONNECTED' && (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Connected • {formatDuration(callDuration)}</span>
              </span>
            )}
            {callState === 'ENDED' && (
              <span className="text-gray-400">Call Ended</span>
            )}
          </div>
        </div>

        {/* Live Call Body / Speech Transcript */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[300px]">
          {callState === 'CONNECTED' && (
            <div className="space-y-3 bg-[#132A46] p-4 rounded-2xl border border-sky-500/30">
              <div className="flex items-center justify-between text-xs text-[#A9D8F7]">
                <span className="font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-amber-400" />
                  Automated IVR Announcement
                </span>
                <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded">
                  PLAYING
                </span>
              </div>

              <p className="text-xs text-gray-200 leading-relaxed font-sans bg-black/20 p-3 rounded-xl border border-white/5">
                "{hotlineGreeting}"
              </p>

              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${speechProgress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {callState === 'DIALING' && (
            <div className="text-center py-6 space-y-2">
              <div className="flex justify-center items-center gap-1">
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-sky-400 rounded-full animate-bounce"></span>
              </div>
              <p className="text-xs text-gray-400">Ringing official Nova Trust Customer Desk...</p>
            </div>
          )}

          {callState === 'ENDED' && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                <h4 className="font-bold text-sm text-emerald-300">Live Phone Support Offline</h4>
                <p className="text-xs text-gray-300">
                  Please choose one of our official 24/7 digital support channels below to connect instantly with our AI Assistant or Human Agent:
                </p>
              </div>

              <div className="space-y-2">
                {/* WhatsApp Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectWhatsApp) onSelectWhatsApp();
                    else window.open(`https://wa.me/${rawWhatsApp}`, '_blank');
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">💬</span>
                    <span>Continue on WhatsApp AI Support</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* Telegram Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectTelegram) onSelectTelegram();
                    else window.open(`https://t.me/${rawTelegram}`, '_blank');
                  }}
                  className="w-full bg-sky-600 hover:bg-sky-500 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">✈️</span>
                    <span>Continue on Telegram AI Bot</span>
                  </div>
                  <ExternalLink className="w-4 h-4" />
                </button>

                {/* In-App Widget Button */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSelectInApp) onSelectInApp();
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-between transition-all border border-white/20"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">🤖</span>
                    <span>Use In-App AI Assistant</span>
                  </div>
                  <MessageSquare className="w-4 h-4 text-[#A9D8F7]" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Call Action Controls (Mute / Speaker / End Call) */}
        {callState !== 'ENDED' && (
          <div className="p-6 bg-[#0B1A2C] border-t border-white/10 flex items-center justify-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-full border transition-all ${
                isMuted ? 'bg-amber-500/20 text-amber-300 border-amber-500' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Big Red Hangup Button */}
            <button
              onClick={handleEndCall}
              className="p-4 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow-lg shadow-rose-600/40 transition-all hover:scale-105 active:scale-95"
              title="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3.5 rounded-full border transition-all ${
                isSpeakerOn ? 'bg-sky-500/20 text-sky-300 border-sky-500' : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
              }`}
              title={isSpeakerOn ? "Speaker On" : "Speaker Off"}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
