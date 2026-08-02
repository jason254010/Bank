import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Account, BankSettings } from '../types';
import { apiRequest, getStoredToken, setStoredToken, clearStoredToken } from '../services/api';

interface ToastState {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface AuthContextType {
  user: User | null;
  account: Account | null;
  token: string | null;
  hasOwner: boolean;
  isLoading: boolean;
  toast: ToastState | null;
  unreadNotifications: number;
  settings: BankSettings | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  showToast: (message: string, type?: ToastState['type']) => void;
  hideToast: () => void;
  checkSystemStatus: () => Promise<void>;
  login: (data: { user: User; account?: Account; token: string }) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<BankSettings>) => Promise<BankSettings>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [hasOwner, setHasOwner] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);
  const [settings, setSettings] = useState<BankSettings | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('novatrust_theme');
    return saved === 'dark' || saved === 'light' ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('novatrust_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const showToast = useCallback((message: string, type: ToastState['type'] = 'info') => {
    setToast({
      id: Math.random().toString(),
      message,
      type
    });
  }, []);

  const hideToast = useCallback(() => setToast(null), []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await apiRequest<BankSettings>('/api/settings');
      setSettings(res);
    } catch (e) {
      console.warn('Failed to load bank settings:', e);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<BankSettings>) => {
    const updated = await apiRequest<BankSettings>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(newSettings)
    });
    setSettings(updated);
    return updated;
  }, []);

  const checkSystemStatus = async () => {
    try {
      const res = await apiRequest('/api/system/status');
      setHasOwner(res.hasOwner);
    } catch (e) {
      console.error('System status check failed:', e);
    }
  };

  const refreshUser = async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await apiRequest('/api/auth/me');
      setUser(res.user);
      setAccount(res.account || null);

      if (res.user && res.user.role === 'CUSTOMER') {
        const dashRes = await apiRequest('/api/customer/dashboard');
        setUnreadNotifications(dashRes.unreadNotifications || 0);
      }
    } catch (e) {
      console.warn('Session restoration failed:', e);
      clearStoredToken();
      setUser(null);
      setAccount(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await checkSystemStatus();
      await refreshUser();
      await refreshSettings();
    };
    init();
  }, [refreshSettings]);

  const login = (data: { user: User; account?: Account; token: string }) => {
    setUser(data.user);
    setAccount(data.account || null);
    setToken(data.token);
    setStoredToken(data.token);
    setHasOwner(true);
    showToast(`Welcome back, ${data.user.fullName}!`, 'success');

    if (data.user.role === 'CUSTOMER') {
      apiRequest('/api/customer/dashboard').then(dashRes => {
        setUnreadNotifications(dashRes.unreadNotifications || 0);
      }).catch(() => {});
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    clearStoredToken();
    setUser(null);
    setAccount(null);
    setToken(null);
    showToast('You have been logged out securely.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        token,
        hasOwner,
        isLoading,
        toast,
        unreadNotifications,
        settings,
        theme,
        toggleTheme,
        showToast,
        hideToast,
        checkSystemStatus,
        login,
        logout,
        refreshUser,
        refreshSettings,
        updateSettings
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
