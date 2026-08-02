import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Headphones, X, GripVertical, ExternalLink, MessageSquare } from 'lucide-react';

export const FloatingContactButtons: React.FC = () => {
  const { settings } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 24,
    initialY: 0,
  });

  // Initialize position to bottom-left on mount and handle window resize
  useEffect(() => {
    const initPos = () => {
      const defaultY = Math.max(20, window.innerHeight - 90);
      const defaultX = 24;
      setPosition(prev => {
        if (!prev) return { x: defaultX, y: defaultY };
        const clampedX = Math.min(Math.max(10, prev.x), window.innerWidth - 80);
        const clampedY = Math.min(Math.max(10, prev.y), window.innerHeight - 80);
        return { x: clampedX, y: clampedY };
      });
    };

    initPos();
    window.addEventListener('resize', initPos);
    return () => window.removeEventListener('resize', initPos);
  }, []);

  // Handle Click Outside to collapse menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Pointer/Mouse/Touch drag handlers
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('button' in e && e.button !== 0) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const currentX = position?.x ?? 24;
    const currentY = position?.y ?? (window.innerHeight - 90);

    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      initialX: currentX,
      initialY: currentY,
    };

    isDraggingRef.current = true;
    hasMovedRef.current = false;

    const handlePointerMove = (moveEvt: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;

      const moveX = 'touches' in moveEvt ? moveEvt.touches[0].clientX : (moveEvt as MouseEvent).clientX;
      const moveY = 'touches' in moveEvt ? moveEvt.touches[0].clientY : (moveEvt as MouseEvent).clientY;

      const deltaX = moveX - dragStartRef.current.startX;
      const deltaY = moveY - dragStartRef.current.startY;

      if (Math.hypot(deltaX, deltaY) > 4) {
        hasMovedRef.current = true;
      }

      if (hasMovedRef.current) {
        const newX = Math.min(Math.max(10, dragStartRef.current.initialX + deltaX), window.innerWidth - 80);
        const newY = Math.min(Math.max(10, dragStartRef.current.initialY + deltaY), window.innerHeight - 80);
        setPosition({ x: newX, y: newY });
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchend', handlePointerUp);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchend', handlePointerUp);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasMovedRef.current) {
      hasMovedRef.current = false;
      return;
    }
    setIsOpen(prev => !prev);
  };

  const handleOpenWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    const rawNumber = settings?.whatsappNumber || '+1 (800) 555-0199';
    const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
    const defaultText = encodeURIComponent('Hello Nova Trust Bank Customer Support Desk, I require assistance with my banking account.');
    const targetUrl = cleanNumber
      ? `https://wa.me/${cleanNumber}?text=${defaultText}`
      : `https://api.whatsapp.com/send?phone=18005550199&text=${defaultText}`;
    
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleOpenTelegram = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    const rawUsername = settings?.telegramUsername || 'NovaTrustSupport';
    let targetUrl = rawUsername.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const cleanHandle = targetUrl.replace(/^@/, '');
      targetUrl = `https://t.me/${cleanHandle}`;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  if (!position) return null;

  const isTopHalf = position.y < window.innerHeight / 2;
  const isRightHalf = position.x > window.innerWidth / 2;

  const menuPlacementClass = `${isTopHalf ? 'top-full mt-3' : 'bottom-full mb-3'} ${
    isRightHalf ? 'right-0' : 'left-0'
  }`;

  return (
    <div
      ref={containerRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'fixed',
        zIndex: 9999,
      }}
      className="select-none font-sans touch-none"
    >
      <div className="relative">
        {/* Expanded Contact Options Popup Menu */}
        {isOpen && (
          <div
            className={`absolute ${menuPlacementClass} w-72 bg-white/95 backdrop-blur-md border border-[#D9DEE5] rounded-3xl shadow-2xl p-4 space-y-3 transition-all duration-300 animate-in fade-in zoom-in-95`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#0057B8]/10 text-[#0057B8] rounded-xl">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0F3557]">Nova Trust Support Desk</h4>
                  <p className="text-[10px] text-[#6E7A87]">Choose your preferred live channel</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* WhatsApp Option Button */}
            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="w-full flex items-center justify-between p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-2xl transition-all group text-left cursor-pointer active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.705 1.754zm6.097-4.501l.383.227c1.472.873 3.161 1.334 4.886 1.335 5.252 0 9.526-4.274 9.528-9.527.001-2.546-.991-4.938-2.791-6.738-1.799-1.8-4.191-2.793-6.738-2.794-5.253 0-9.527 4.274-9.529 9.527-.001 1.785.497 3.52 1.44 5.011l.249.392-1.002 3.661 3.754-.984zm11.33-6.95c-.092-.153-.339-.245-.71-.43-.37-.184-2.193-1.082-2.531-1.204-.338-.123-.585-.184-.832.184-.247.369-.958 1.204-1.174 1.45-.216.246-.432.277-.802.092-.37-.185-1.562-.576-2.976-1.837-1.1-1.066-1.843-2.383-2.059-2.753-.216-.369-.023-.569.162-.753.167-.166.37-.431.554-.646.185-.215.246-.369.37-.616.123-.246.061-.462-.031-.646-.093-.184-.832-2.062-1.141-2.801-.301-.718-.607-.621-.832-.632-.216-.01-.462-.01-.709-.01-.247 0-.647.092-.986.462-.339.369-1.295 1.268-1.295 3.091s1.325 3.584 1.51 3.831c.185.246 2.607 3.981 6.317 5.584 3.71 1.603 3.71 1.069 4.388.999.678-.07 2.193-.896 2.501-1.762.308-.866.308-1.608.216-.761z" />
                  </svg>
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#0F3557]">WhatsApp</span>
                    <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">LIVE</span>
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono truncate">
                    {settings?.whatsappNumber || '+1 (800) 555-0199'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Telegram Option Button */}
            <button
              type="button"
              onClick={handleOpenTelegram}
              className="w-full flex items-center justify-between p-3 bg-sky-50 hover:bg-sky-100/80 border border-sky-200/80 rounded-2xl transition-all group text-left cursor-pointer active:scale-98 shadow-xs"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.536-.194 1.006.128.832.941z" />
                  </svg>
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#0F3557]">Telegram</span>
                    <span className="bg-sky-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">FAST</span>
                  </div>
                  <p className="text-[10px] text-gray-600 font-mono truncate">
                    @{settings?.telegramUsername?.replace(/^@/, '') || 'NovaTrustSupport'}
                  </p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-sky-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Primary Floating Contact Button (Draggable Trigger) */}
        <div
          onMouseDown={handlePointerDown}
          onTouchStart={handlePointerDown}
          onClick={handleToggleClick}
          className={`group relative flex items-center gap-2.5 px-4 py-3 bg-[#0057B8] hover:bg-[#004bb0] text-white rounded-full shadow-2xl shadow-[#0057B8]/30 border-2 border-white/90 transition-all duration-200 cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95`}
          title="Drag to move • Click for Support Channels"
        >
          {/* Subtle Drag Handle Icon */}
          <GripVertical className="w-3.5 h-3.5 text-white/60 group-hover:text-white shrink-0" />

          {/* Main Icon */}
          <div className="relative">
            {isOpen ? (
              <X className="w-5 h-5 text-white animate-in spin-in-90 duration-200" />
            ) : (
              <MessageSquare className="w-5 h-5 text-white" />
            )}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0057B8] animate-pulse"></span>
          </div>

          <span className="text-xs font-extrabold tracking-wide">Contact</span>

          {/* Tooltip on Hover when collapsed */}
          {!isOpen && (
            <span className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1 bg-[#0F3557] text-white text-[10px] font-medium py-1 px-2.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
              <span>Support Desk</span>
              <span className="text-white/60">• Drag me</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

