import React from 'react';
import { Shield, Globe } from 'lucide-react';

interface BrandLogoProps {
  variant?: 'light' | 'dark' | 'compact';
  showTagline?: boolean;
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  showTagline = true,
  className = ''
}) => {
  const isDark = variant === 'dark'; // Dark background context -> light text

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Globe & Shield Emblem (Logo 4) */}
      <div className="relative w-10 h-10 flex-shrink-0">
        <div className="w-10 h-10 bg-[#0F4C81] rounded-xl flex items-center justify-center text-white shadow-md border border-white/10 relative overflow-hidden">
          {/* Outer Shield frame */}
          <Shield className="w-6 h-6 text-[#D4AF37] stroke-[1.75]" />
          {/* Inner Globe overlay */}
          <Globe className="w-3.5 h-3.5 text-white absolute inset-0 m-auto stroke-[2.2]" />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className={`font-extrabold text-lg tracking-tight font-sans ${isDark ? 'text-white' : 'text-[#0B1F3A]'}`}>
            NOVA TRUST BANK
          </span>
        </div>
        {showTagline && (
          <span className="text-[9.5px] text-[#D4AF37] font-semibold tracking-wider uppercase font-mono leading-none">
            International Commercial &amp; Private Banking
          </span>
        )}
      </div>
    </div>
  );
};
