import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import {
  LogOut,
  Bell,
  Shield,
  MessageSquare,
  DollarSign,
  Send,
  History,
  CreditCard,
  FileText,
  User as UserIcon,
  Users,
  Activity,
  Settings,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSupport?: () => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  isSupport?: boolean;
  isLive?: boolean;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  onOpenSupport,
  children
}) => {
  const { user, account, logout, unreadNotifications } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return 'NT';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Nav Items for Customer
  const customerNavItems: NavItem[] = [
    { id: 'summary', label: 'Dashboard', icon: DollarSign },
    { id: 'transfer', label: 'Transfers', icon: Send },
    { id: 'history', label: 'Transactions', icon: History },
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'statements', label: 'Statements', icon: FileText },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifications > 0 ? unreadNotifications : null },
    { id: 'profile', label: 'Security & Profile', icon: Shield },
    { id: 'support', label: 'Support', icon: MessageSquare, isSupport: true, isLive: true }
  ];

  // Nav Items for Owner
  const ownerNavItems: NavItem[] = [
    { id: 'home', label: 'Dashboard', icon: DollarSign },
    { id: 'customers', label: 'Customer Management', icon: Users },
    { id: 'transactions', label: 'Transaction Audit', icon: History },
    { id: 'support', label: 'Support Desk', icon: MessageSquare, isLive: true },
    { id: 'audit', label: 'Audit Logs', icon: Activity },
    { id: 'settings', label: 'Bank Settings', icon: Settings }
  ];

  const navItems = user?.role === 'OWNER' ? ownerNavItems : customerNavItems;

  const getPageTitle = () => {
    if (user?.role === 'OWNER') {
      switch (activeTab) {
        case 'home': return 'Bank Operational Console';
        case 'customers': return 'Customer Account Management';
        case 'transactions': return 'Global Transaction Audit Ledger';
        case 'support': return 'Live Customer Support Desk';
        case 'audit': return 'Security & Operations Audit';
        case 'settings': return 'Core Banking Settings';
        default: return 'Bank Admin Dashboard';
      }
    } else {
      switch (activeTab) {
        case 'summary': return 'Customer Dashboard';
        case 'transfer': return 'Internal Money Transfer';
        case 'history': return 'Transaction History';
        case 'cards': return 'Debit Card Management';
        case 'statements': return 'Monthly Account Statements';
        case 'notifications': return 'Account Alerts & Notifications';
        case 'profile': return 'Profile & Security Settings';
        default: return 'Online Banking Portal';
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D12] flex flex-col md:flex-row text-[#F1F5F9] font-sans">
      
      {/* Sidebar Navigation for Desktop */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#12161F] text-white min-h-screen flex-shrink-0 shadow-2xl sticky top-0 h-screen z-30 border-r border-[#2A3241]">
        
        {/* Brand Logo & Header */}
        <div className="p-6 border-b border-[#2A3241]">
          <BrandLogo variant="dark" showTagline={true} />
          <div className="mt-2.5 pt-2 border-t border-[#2A3241] flex items-center justify-between text-[10px] font-mono text-[#D4AF37]">
            <span className="uppercase tracking-widest font-bold">
              {user?.role === 'OWNER' ? 'ADMIN CONSOLE' : 'PRIVATE BANKING'}
            </span>
            <span className="bg-[#1A2232] border border-[#2A3241] px-2 py-0.5 rounded text-gray-300 font-sans font-normal">v4.2.0</span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isSupport && onOpenSupport) {
                    onOpenSupport();
                  } else {
                    setActiveTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#1A2232] text-white shadow-lg border-l-4 border-[#D4AF37]'
                    : 'text-gray-400 hover:bg-[#1A2232]/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      {item.badge}
                    </span>
                  )}
                  {item.isLive && (
                    <span className="support-badge-live">
                      LIVE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Session Info */}
        <div className="p-4 border-t border-[#2A3241] text-[11px] text-gray-400 space-y-1 bg-[#0A0D12]">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Handshake Status:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              TLS 1.3 Active
            </span>
          </div>
          <div className="text-[10px] font-mono text-gray-400">Security Desk ID: #NTB-88392</div>
        </div>

      </aside>

      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-[#12161F] text-white p-4 flex items-center justify-between border-b border-[#2A3241] sticky top-0 z-40">
        <BrandLogo variant="dark" showTagline={false} />

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl text-[#D4AF37] hover:bg-white/10 transition-colors"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#12161F] text-white p-4 border-b border-[#2A3241] space-y-2 z-40">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.isSupport && onOpenSupport) {
                    onOpenSupport();
                  } else {
                    setActiveTab(item.id);
                  }
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold ${
                  isActive ? 'bg-[#1A2232] text-white border-l-4 border-[#D4AF37]' : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4.5 h-4.5 text-[#D4AF37]" />
                  <span>{item.label}</span>
                </div>
                {item.isLive && <span className="support-badge-live">LIVE</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Main Workspace Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="bg-[#12161F] border-b border-[#2A3241] h-16 sm:h-18 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-lg">
          
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-[#F1F5F9] tracking-tight font-sans">
              {getPageTitle()}
            </h1>
            <p className="text-[11px] text-[#94A3B8] hidden sm:block font-mono">
              Nova Trust Bank • Private Wealth &amp; Commercial Banking Portal
            </p>
          </div>

          {user && (
            <div className="flex items-center gap-3 sm:gap-4">
              
              {/* Customer Notifications Quick Action */}
              {user.role === 'CUSTOMER' && (
                <button
                  onClick={() => setActiveTab('notifications')}
                  className="relative p-2 rounded-xl text-gray-300 hover:bg-[#1A2232] transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5 text-[#D4AF37]" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-[#12161F]">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              )}

              {/* Support Button */}
              {onOpenSupport && (
                <button
                  onClick={onOpenSupport}
                  className="p-2 text-gray-200 hover:bg-[#1A2232] rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold border border-[#2A3241]"
                  title="Live Support"
                >
                  <MessageSquare className="w-4.5 h-4.5 text-[#D4AF37]" />
                  <span className="hidden sm:inline">Support</span>
                </button>
              )}

              {/* User Profile Summary */}
              <div
                onClick={() => {
                  if (user.role === 'CUSTOMER') {
                    setActiveTab('profile');
                  }
                }}
                className={`flex items-center gap-3 pl-3 sm:pl-4 border-l border-[#2A3241] ${
                  user.role === 'CUSTOMER' ? 'cursor-pointer group' : ''
                }`}
                title={user.role === 'CUSTOMER' ? 'View Profile' : undefined}
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#F1F5F9] leading-tight group-hover:text-[#D4AF37] transition-colors">{user.fullName}</div>
                  <div className="text-[11px] text-[#94A3B8] font-mono">
                    {user.role === 'CUSTOMER' && account ? `Acc: ${account.accountNumber}` : user.email}
                  </div>
                </div>

                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    className="w-9 h-9 rounded-full object-cover border-2 border-[#D4AF37] shadow-xs group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#1A2232] text-[#D4AF37] font-extrabold text-xs flex items-center justify-center shadow-xs border border-[#2A3241] group-hover:scale-105 transition-transform">
                    {getInitials(user.fullName)}
                  </div>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    logout();
                  }}
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-900/30 rounded-xl transition-colors ml-1"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
};
