import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toast } from './components/common/Toast';
import { Header } from './components/common/Header';
import { BrandLogo } from './components/common/BrandLogo';
import { AppLayout } from './components/common/AppLayout';
import { SupportWidget } from './components/common/SupportWidget';
import { FloatingContactButtons } from './components/common/FloatingContactButtons';
import { OwnerSetup } from './components/auth/OwnerSetup';
import { OwnerLogin } from './components/auth/OwnerLogin';
import { CustomerLogin } from './components/auth/CustomerLogin';
import { LandingPage } from './components/landing/LandingPage';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { SuspendedAccountNotice } from './components/customer/SuspendedAccountNotice';
import { DesignShowcaseModal } from './components/showcase/DesignShowcaseModal';
import { Headphones, Building2, Palette, Sparkles } from 'lucide-react';

type RouteView = 'LANDING' | 'CUSTOMER_LOGIN' | 'OWNER_LOGIN';

const getInitialRoute = (): RouteView => {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('/admin')) {
    return 'OWNER_LOGIN';
  }
  if (path.includes('/login')) {
    return 'CUSTOMER_LOGIN';
  }
  return 'LANDING';
};

const AppContent: React.FC = () => {
  const { user, account, hasOwner, isLoading } = useAuth();
  const [routeView, setRouteView] = useState<RouteView>(getInitialRoute);
  const [customerActiveTab, setCustomerActiveTab] = useState('summary');
  const [ownerActiveTab, setOwnerActiveTab] = useState('home');
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isShowcaseOpen, setIsShowcaseOpen] = useState(false);

  // Sync URL and routeView with browser history & location
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('/admin')) {
        setRouteView('OWNER_LOGIN');
      } else if (path.includes('/login')) {
        setRouteView('CUSTOMER_LOGIN');
      } else {
        setRouteView('LANDING');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    if (window.location.pathname !== '/admin') {
      window.history.pushState({}, '', '/admin');
    }
    setRouteView('OWNER_LOGIN');
  };

  const navigateToCustomerLogin = () => {
    if (window.location.pathname !== '/login') {
      window.history.pushState({}, '', '/login');
    }
    setRouteView('CUSTOMER_LOGIN');
  };

  const navigateToLanding = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setRouteView('LANDING');
  };

  // Ensure path is consistent when user logs in
  useEffect(() => {
    if (user) {
      if (user.role === 'OWNER') {
        if (window.location.pathname !== '/admin') {
          window.history.replaceState({}, '', '/admin');
        }
      } else if (user.role === 'CUSTOMER') {
        if (window.location.pathname !== '/dashboard' && window.location.pathname !== '/login') {
          window.history.replaceState({}, '', '/dashboard');
        }
      }
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="flex justify-center mb-4">
          <BrandLogo variant="light" showTagline={true} />
        </div>
        <p className="text-xs text-[#5E6C84] mt-1 font-mono font-semibold">Establishing secure TLS 1.3 256-bit encrypted session...</p>
      </div>
    );
  }

  // If system is uninitialized and visiting setup/admin, render OwnerSetup.
  // Once initialized, hasOwner is permanently true in DB, so OwnerSetup will never render again.
  if (!hasOwner && (window.location.pathname.includes('/admin') || window.location.pathname.includes('/setup'))) {
    return <OwnerSetup />;
  }

  // Check if current user account is suspended
  const isAccountSuspended = user?.role === 'CUSTOMER' && (
    account?.status === 'Suspended' ||
    (user as any).status === 'Suspended' ||
    (user as any).status === 'SUSPENDED'
  );

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col font-sans text-[#172B4D]">
      
      {/* Top Interactive Banner for Visual Showcase */}
      <div className="bg-[#0B1F3A] text-white py-2 px-4 border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2 z-30 text-xs shadow-md">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
          <span className="font-bold">Nova Trust Bank Visual Design &amp; Logo Showcase:</span>
          <span className="text-gray-300 hidden md:inline">8 UI Concepts &amp; 12 Professional Logo Marks Rendered in High Resolution</span>
        </div>
        <button
          onClick={() => setIsShowcaseOpen(true)}
          className="px-3 py-1 bg-[#D4AF37] hover:bg-[#b8972e] text-[#0B1F3A] font-extrabold rounded-lg text-xs flex items-center gap-1.5 transition-transform hover:scale-105 shadow-sm"
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Open Full Visual Showcase</span>
        </button>
      </div>
      
      {!user ? (
        <>
          {routeView === 'LANDING' && (
            <LandingPage
              onLoginClick={navigateToCustomerLogin}
              onAdminClick={navigateToAdmin}
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          )}

          {routeView === 'CUSTOMER_LOGIN' && (
            <CustomerLogin
              onGoHome={navigateToLanding}
            />
          )}

          {routeView === 'OWNER_LOGIN' && (
            <OwnerLogin
              onSwitchToCustomer={navigateToCustomerLogin}
              onGoHome={navigateToLanding}
            />
          )}
        </>
      ) : isAccountSuspended ? (
        // Requirement 9: Suspended Account Notice Screen
        <SuspendedAccountNotice
          onOpenSupport={() => setIsSupportOpen(true)}
        />
      ) : (
        <AppLayout
          activeTab={user.role === 'OWNER' ? ownerActiveTab : customerActiveTab}
          setActiveTab={user.role === 'OWNER' ? setOwnerActiveTab : setCustomerActiveTab}
          onOpenSupport={() => setIsSupportOpen(true)}
        >
          {user.role === 'OWNER' ? (
            <OwnerDashboard
              activeTab={ownerActiveTab}
              setActiveTab={setOwnerActiveTab}
              onOpenSupport={() => setIsSupportOpen(true)}
            />
          ) : (
            <CustomerDashboard
              onOpenSupport={() => setIsSupportOpen(true)}
              activeTab={customerActiveTab}
              setActiveTab={setCustomerActiveTab}
            />
          )}
        </AppLayout>
      )}

      {/* Floating Customer Service Button present on every page */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsSupportOpen(!isSupportOpen)}
          className="bg-[#0F4C81] hover:bg-[#0C3C66] text-white p-3.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold transition-transform hover:scale-105 active:scale-95 group border-2 border-white"
          title="Customer Care Support"
        >
          <Headphones className="w-5 h-5 text-[#D4AF37]" />
          <span className="hidden md:inline pr-1">Customer Support</span>
        </button>
      </div>

      {/* Floating WhatsApp & Telegram Contact Buttons */}
      <FloatingContactButtons />

      {/* Real-time Customer Support Drawer */}
      <SupportWidget isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* Design & Logo Showcase Modal */}
      <DesignShowcaseModal isOpen={isShowcaseOpen} onClose={() => setIsShowcaseOpen(false)} />

      <Toast />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
