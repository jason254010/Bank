import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useAuth();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const bgMap = {
    success: 'bg-[#0057B8] text-white border-l-4 border-emerald-400',
    error: 'bg-red-900 text-white border-l-4 border-red-500',
    info: 'bg-[#0F3557] text-white border-l-4 border-[#A9D8F7]',
    warning: 'bg-amber-800 text-white border-l-4 border-amber-400'
  };

  const iconMap = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-300 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-300 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-[#A9D8F7] flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0" />
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-bounce-short px-4">
      <div className={`p-4 rounded-lg shadow-xl flex items-start gap-3 justify-between ${bgMap[toast.type]}`}>
        <div className="flex items-start gap-3">
          {iconMap[toast.type]}
          <p className="text-sm font-medium leading-tight">{toast.message}</p>
        </div>
        <button
          onClick={hideToast}
          className="text-white/80 hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
