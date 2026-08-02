import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { LogOut, Bell, Shield, User as UserIcon, MessageSquare, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenSupport }) => {
  const { user, account, logout, unreadNotifications, theme, toggleTheme } = useAuth();

  return (
    <header className="bg-[#0B1F3A] text-white shadow-lg border-b border-[#0F4C81]/40 sticky top-0 z-40 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title (Globe & Shield International Mark) */}
          <div className="flex items-center space-x-3">
            <BrandLogo variant="dark" showTagline={true} />
            <span className="hidden xl:inline-block bg-[#0F4C81] text-[#D4AF37] text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-white/10">
              {user ? (user.role === 'OWNER' ? 'Staff Portal' : 'Online Banking') : 'Secure Access'}
            </span>
          </div>

          {/* User Status / Navigation Actions */}
          {user ? (
            <div className="flex items-center space-x-3 sm:space-x-4">
              
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-white/10 bg-white/5"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#D4AF37]" />
                    <span className="hidden md:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#D4AF37]" />
                    <span className="hidden md:inline">Dark</span>
                  </>
                )}
              </button>

              {/* Customer Quick Notifications Trigger */}
              {user.role === 'CUSTOMER' && setActiveTab && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#0B1F3A]">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              )}

              {/* Support Quick Trigger */}
              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  className="p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                  title="Customer Support Desk"
                >
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  <span className="hidden md:inline">Support</span>
                </button>
              )}

              {/* Account Quick Info */}
              <div className="hidden lg:flex flex-col text-right pr-3 border-r border-white/15">
                <span className="text-xs font-bold text-white">{user.fullName}</span>
                <span className="text-[11px] text-gray-300 font-mono">
                  {user.role === 'CUSTOMER' && account ? `Acc: ${account.accountNumber}` : user.email}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0F4C81] hover:bg-[#0C3C66] text-white rounded-xl text-xs font-bold transition-all border border-white/10 shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3 text-xs text-[#D4AF37]">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors flex items-center gap-1.5 text-xs font-semibold border border-white/10 bg-white/5"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#D4AF37]" />
                    <span className="hidden sm:inline">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#D4AF37]" />
                    <span className="hidden sm:inline">Dark</span>
                  </>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-1.5 font-mono font-semibold">
                <Shield className="w-4 h-4 text-[#D4AF37]" />
                <span>TLS 1.3 256-Bit Encrypted</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </header>
  );
};
