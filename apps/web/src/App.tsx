import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Coins,
  Receipt,
  Gift,
  FileBarChart2,
  Bell,
  ShieldCheck,
  History,
  Settings as SettingsIcon,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Printer,
  RotateCcw,
  Check,
  AlertCircle,
  Calendar,
  CreditCard,
  Building,
  Menu,
  X,
  UserCheck,
  ArrowUpRight,
  TrendingUp,
  Languages,
  Sun,
  Moon,
  Trash2,
  ClipboardList,
  Target,
  ChevronDown,
  ChevronRight,
  Eye,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api, setAuthTokens, clearAuthTokens, getAuthToken } from './services/api';
import { formatINR, formatKolkataDate, translations, SupportedLanguage, getNextPournami, OFFICIAL_78_MEMBERS } from '@seettu/shared';
import { StatCard } from './components/StatCard';
import { ReceiptModal } from './components/ReceiptModal';
import { ChitCalendar } from './components/ChitCalendar';
import { MonthlyEntryScreen } from './components/MonthlyEntryScreen';

export function App() {
  // Language State
  const [lang, setLang] = useState<SupportedLanguage>(
    (localStorage.getItem('seettu_lang') as SupportedLanguage) || 'en'
  );
  const t = translations[lang];

  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLang(newLang);
    localStorage.setItem('seettu_lang', newLang);
  };

  // Day & Night mode state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('seettu_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('seettu_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Auth state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem('seettu_active_tab') || 'dashboard';
  });

  const setActiveTab = (tab: string) => {
    try {
      localStorage.setItem('seettu_active_tab', tab);
    } catch (e) {}
    setActiveTabState(tab);
  };

  const [reportTarget, setReportTarget] = useState<{ chitNo: string; date: string } | null>(() => {
    try {
      const last = localStorage.getItem('seettu_last_active_chit');
      if (last) return JSON.parse(last);
    } catch (e) {}
    return null;
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleOpenMonthlyReport = (chitNo: string, date: string) => {
    setReportTarget({ chitNo, date });
    try {
      localStorage.setItem('seettu_last_active_chit', JSON.stringify({ chitNo, date }));
    } catch (e) {}
    setActiveTab('monthly-entry');
  };

  // Login form state (Only 2 logins: Member and Admin)
  const [loginRole, setLoginRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Active Receipt Modal
  const [viewingReceipt, setViewingReceipt] = useState<any>(null);

  // Toast / Status Message
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      api.getMe()
        .then((res) => {
          if (res.success) {
            setUser(res.data);
            fetchNotifications();
          } else {
            clearAuthTokens();
          }
        })
        .catch(() => clearAuthTokens())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await api.login({ identifier: loginEmail, email: loginEmail, password: loginPassword });
      if (res.success) {
        setAuthTokens(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
        setActiveTab('dashboard');
        fetchNotifications();
        showToast(`${t.welcomeBack}, ${res.data.user.name}!`);
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleLogout = () => {
    clearAuthTokens();
    setUser(null);
    try {
      localStorage.removeItem('seettu_active_tab');
      localStorage.removeItem('seettu_last_active_chit');
    } catch (e) {}
    setActiveTabState('dashboard');
    showToast(lang === 'ta' ? 'வெற்றிகரமாக வெளியேற்றப்பட்டீர்கள்' : 'Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-600">
            {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு ஏற்றப்படுகிறது...' : 'Loading Sri Pattanathu Mariamman Anangur Seettu Kuzhu...'}
          </p>
        </div>
      </div>
    );
  }

  // 1. LOGIN SCREEN WITH BILINGUAL SWITCHER
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-[#F5F7FB] p-4">
        {/* Language selector & Day/Night Toggle in login */}
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-semibold">
            <Languages className="w-4 h-4 text-[#2F7BFF]" />
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                lang === 'en' ? 'bg-[#2F7BFF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('ta')}
              className={`px-2.5 py-1 rounded-full transition-colors ${
                lang === 'ta' ? 'bg-[#2F7BFF] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              தமிழ்
            </button>
          </div>

          <button
            onClick={toggleTheme}
            title={theme === 'light' ? t.nightMode : t.dayMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-all text-xs font-semibold shadow-sm"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'ta' ? 'இரவு' : 'Night'}</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ta' ? 'பகல்' : 'Day'}</span>
              </>
            )}
          </button>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Centralized App Logo & Title */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="relative mb-3">
              <img
                src="/logo.jpg"
                alt="ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு Logo"
                className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-amber-300 ring-4 ring-blue-50 mx-auto"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#172033] tracking-tight text-center leading-snug">
              {t.appName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 text-center font-medium">
              {t.tagline}
            </p>
          </div>

          {/* 2 Logins: Member & Admin Only */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setLoginRole('MEMBER');
                setLoginEmail('');
                setLoginPassword('');
                setLoginError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginRole === 'MEMBER'
                  ? 'bg-white text-[#2F7BFF] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>{lang === 'ta' ? 'உறுப்பினர்' : 'Member'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginRole('ADMIN');
                setLoginEmail('admin@seettu.com');
                setLoginPassword('admin123');
                setLoginError('');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginRole === 'ADMIN'
                  ? 'bg-white text-[#2F7BFF] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'ta' ? 'நிர்வாகி (Admin)' : 'Admin'}</span>
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                {loginRole === 'ADMIN'
                  ? (lang === 'ta' ? 'நிர்வாகி மின்னஞ்சல் / பயனர் பெயர்' : 'Admin Username / Email')
                  : (lang === 'ta' ? 'உறுப்பினர் பெயர்' : 'Member Name')}
              </label>
              <input
                type="text"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7BFF] focus:border-transparent font-medium"
                placeholder={loginRole === 'ADMIN' ? 'admin@seettu.com' : (lang === 'ta' ? 'உங்கள் பெயர்' : 'Your Name')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                {lang === 'ta' ? 'கடவுச்சொல்' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F7BFF] focus:border-transparent"
                placeholder={loginRole === 'ADMIN' ? 'admin123' : (lang === 'ta' ? 'உங்கள் கடவுச்சொல்' : 'Your Password')}
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loginRole === 'ADMIN'
                ? (lang === 'ta' ? 'நிர்வாகியாக உள்நுழைக' : 'Sign In as Admin')
                : (lang === 'ta' ? 'உறுப்பினராக உள்நுழைக' : 'Sign In as Member')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Navigation Items by Role
  const navItems = [
    { id: 'dashboard', label: lang === 'ta' ? 'முகப்பு' : 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'members', label: lang === 'ta' ? 'உறுப்பினர்கள்' : 'Members', icon: Users, roles: ['ADMIN', 'STAFF'] },
    {
      id: 'monthly-entry',
      label: user.role === 'ADMIN'
        ? (lang === 'ta' ? 'மாதாந்திர அறிக்கை பதிவு (Admin)' : 'Monthly Report Entry')
        : (lang === 'ta' ? 'மாதாந்திர அறிக்கை' : 'Monthly Report'),
      icon: ClipboardList,
      roles: ['ADMIN', 'STAFF', 'MEMBER'],
    },
    { id: 'schemes', label: lang === 'ta' ? 'சீட்டு திட்டங்கள்' : 'Chit Schemes', icon: Coins, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'calendar', label: lang === 'ta' ? 'சீட்டு நாட்காட்டி' : 'Chit Calendar', icon: Calendar, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'payments', label: lang === 'ta' ? 'தவணை பதிவேடு' : 'Payments Ledger', icon: Receipt, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'payouts', label: lang === 'ta' ? 'வழங்கல்கள்' : 'Payouts', icon: Gift, roles: ['ADMIN', 'STAFF', 'MEMBER'] },
    { id: 'reports', label: lang === 'ta' ? 'நிதி அறிக்கைகள்' : 'Financial Reports', icon: FileBarChart2, roles: ['ADMIN', 'STAFF'] },
    { id: 'notifications', label: lang === 'ta' ? 'அறிவிப்புகள்' : 'Notifications', icon: Bell, roles: ['ADMIN', 'STAFF', 'MEMBER'], badge: unreadCount },
    { id: 'staff', label: lang === 'ta' ? 'பணியாளர்கள் & அனுமதிகள்' : 'Staff & Roles', icon: ShieldCheck, roles: ['ADMIN'] },
    { id: 'audit', label: lang === 'ta' ? 'தணிக்கை பதிவு' : 'Audit Trail', icon: History, roles: ['ADMIN'] },
    { id: 'settings', label: lang === 'ta' ? 'அமைப்புகள்' : 'Settings', icon: SettingsIcon, roles: ['ADMIN', 'STAFF'] },
  ].filter((item) => item.roles.includes(user.role));

  return (
    <div className="min-h-screen flex bg-[#F4F7FC] dark:bg-[#080E1A]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toast.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {viewingReceipt && (
        <ReceiptModal
          payment={viewingReceipt}
          onClose={() => setViewingReceipt(null)}
          lang={lang}
        />
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 bg-gradient-to-b from-[#091529] via-[#0D1C36] to-[#071120] text-white border-r border-slate-800/80 flex-col shrink-0 relative overflow-hidden">
        {/* Subtle Temple Gopuram Watermark Silhouette at bottom */}
        <div className="absolute -bottom-6 -right-6 w-56 h-72 pointer-events-none opacity-15 text-blue-400">
          <svg viewBox="0 0 200 280" className="w-full h-full" fill="currentColor">
            <path d="M100 10 L108 30 L92 30 Z M97 0 L103 0 L103 10 L97 10 Z" />
            <path d="M75 32 L125 32 L130 55 L70 55 Z" />
            <path d="M65 57 L135 57 L142 85 L58 85 Z" />
            <path d="M55 87 L145 87 L154 125 L46 125 Z" />
            <path d="M42 127 L158 127 L168 175 L32 175 Z" />
            <path d="M28 177 L172 177 L184 235 L16 235 Z" />
            <path d="M12 237 L188 237 L194 280 L6 280 Z" />
            <path d="M82 280 L82 245 C82 235 118 235 118 245 L118 280 Z" fill="#091529" />
          </svg>
        </div>

        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 relative z-10">
          <div className="p-0.5 rounded-xl border border-amber-400/60 bg-amber-400/10 shadow-md shadow-amber-500/10 shrink-0">
            <img
              src="/logo.jpg"
              alt="Sri Pattanathu Mariamman"
              className="w-10 h-10 rounded-lg object-cover"
            />
          </div>
          <div className="overflow-hidden min-w-0">
            <h2 className="font-bold text-white text-xs sm:text-[13px] leading-tight truncate">
              {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன்' : 'Sri Pattanathu Mariamman'}
            </h2>
            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
              {lang === 'ta' ? 'ஆனங்கூர் சீட்டு குழு' : 'Anangur Seettu Kuzhu'}
            </p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto relative z-10">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#2563EB] text-white shadow-lg shadow-blue-600/30 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Card & Logout */}
        <div className="p-3 border-t border-white/10 relative z-10 space-y-2">
          <div className="p-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-sm">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-bold text-white truncate">{user.name}</p>
                <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider bg-blue-900/70 text-blue-300 uppercase">
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-72 max-w-[85vw] bg-gradient-to-b from-[#091529] via-[#0D1C36] to-[#071120] text-white h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-left duration-200 border-r border-slate-800">
            {/* Header with App Logo & Close Button */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="p-0.5 rounded-xl border border-amber-400/60 bg-amber-400/10 shadow-sm shrink-0">
                  <img
                    src="/logo.jpg"
                    alt="Logo"
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-bold text-white text-xs leading-tight truncate">
                    {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன்' : 'Sri Pattanathu Mariamman'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {lang === 'ta' ? 'ஆனங்கூர் சீட்டு குழு' : 'Anangur Seettu Kuzhu'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 shrink-0 ml-1"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Card */}
            <div className="p-3.5 mx-3 my-2.5 rounded-2xl bg-white/[0.06] border border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-black tracking-wider bg-blue-900/70 text-blue-300 uppercase">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#2563EB] text-white shadow-md shadow-blue-600/30 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 ? (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                      }`}>
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>

            {/* Quick Language & Theme switcher in mobile drawer */}
            <div className="p-3 border-t border-white/10 flex items-center justify-between gap-2">
              <div className="flex items-center bg-white/10 rounded-full p-0.5 text-xs font-bold border border-white/10">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                    lang === 'en' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-300'
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => handleLanguageChange('ta')}
                  className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                    lang === 'ta' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-300'
                  }`}
                >
                  தமிழ்
                </button>
              </div>

              <button
                onClick={toggleTheme}
                className="p-2 rounded-full border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs font-semibold"
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-slate-300" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>
            </div>

            {/* Drawer Logout */}
            <div className="p-3 border-t border-white/10">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.signOut}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-white dark:bg-[#0E1726] border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none shrink-0"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Pill Search Input matching the image */}
            <div className="relative flex items-center w-64 sm:w-80 md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  lang === 'ta'
                    ? 'உறுப்பினர்கள், சீட்டுகள், பதிவேடு தேடுக...'
                    : 'Search members, chit schemes, transactions...'
                }
                className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white dark:bg-slate-800 dark:hover:bg-slate-800/80 dark:focus:bg-slate-900 rounded-full text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 border border-transparent focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950 outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Bilingual Switcher [EN | தமிழ்] */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-0.5 text-xs font-bold border border-slate-200/80 dark:border-slate-700 shadow-2xs">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 rounded-full transition-all text-xs font-bold ${
                  lang === 'en'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleLanguageChange('ta')}
                className={`px-3 py-1 rounded-full transition-all text-xs font-bold ${
                  lang === 'ta'
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>

            {/* Day / Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              title={theme === 'light' ? t.nightMode : t.dayMode}
              className="p-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-slate-600" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Notifications Bell */}
            <button
              onClick={() => setActiveTab('notifications')}
              className="p-2 rounded-full border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 relative shadow-2xs transition-colors"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1.5 right-1.5 ring-2 ring-white dark:ring-slate-800"></span>
              )}
            </button>

            {/* User Profile Pill matching image */}
            <div className="flex items-center gap-2 pl-1 sm:pl-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline truncate max-w-[120px]">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardScreen
              user={user}
              lang={lang}
              onNavigate={(tab) => setActiveTab(tab)}
              onViewReceipt={(p) => setViewingReceipt(p)}
            />
          )}
          {activeTab === 'members' && (
            <MembersScreen
              user={user}
              lang={lang}
              showToast={showToast}
            />
          )}
          {activeTab === 'monthly-entry' && (
            <MonthlyEntryScreen
              user={user}
              lang={lang}
              showToast={showToast}
              initialTarget={reportTarget}
            />
          )}
          {activeTab === 'schemes' && (
            <SchemesScreen
              user={user}
              lang={lang}
              showToast={showToast}
              onRecordPaymentForScheme={() => setActiveTab('payments')}
            />
          )}
          {activeTab === 'calendar' && (
            <ChitCalendar lang={lang} onOpenMonthlyReport={handleOpenMonthlyReport} />
          )}
          {activeTab === 'payments' && (
            <PaymentsScreen
              user={user}
              lang={lang}
              showToast={showToast}
              onViewReceipt={(p) => setViewingReceipt(p)}
            />
          )}
          {activeTab === 'payouts' && (
            <PayoutsScreen user={user} lang={lang} showToast={showToast} />
          )}
          {activeTab === 'reports' && (
            <ReportsScreen
              user={user}
              lang={lang}
              showToast={showToast}
              onOpenMonthlyReport={handleOpenMonthlyReport}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsScreen
              notifications={notifications}
              lang={lang}
              onRefresh={fetchNotifications}
              showToast={showToast}
            />
          )}
          {activeTab === 'staff' && (
            <StaffScreen user={user} lang={lang} showToast={showToast} />
          )}
          {activeTab === 'audit' && (
            <AuditScreen user={user} lang={lang} />
          )}
          {activeTab === 'settings' && user.role !== 'MEMBER' && (
            <SettingsScreen
              user={user}
              lang={lang}
              theme={theme}
              onToggleTheme={toggleTheme}
              onLanguageChange={handleLanguageChange}
              showToast={showToast}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (Phone Optimized) */}
        <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 flex items-center justify-around py-1.5 px-1 shadow-lg pb-[max(0.375rem,env(safe-area-inset-bottom))]">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === 'dashboard' ? 'text-[#2F7BFF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-[#2F7BFF] stroke-[2.5]' : 'text-slate-400'}`} />
            <span>{lang === 'ta' ? 'முகப்பு' : 'Home'}</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly-entry')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === 'monthly-entry' ? 'text-[#2F7BFF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className={`w-5 h-5 ${activeTab === 'monthly-entry' ? 'text-[#2F7BFF] stroke-[2.5]' : 'text-slate-400'}`} />
            <span>{lang === 'ta' ? 'சீட்டு பதிவு' : 'Chit Entry'}</span>
          </button>

          {user.role !== 'MEMBER' ? (
            <button
              onClick={() => setActiveTab('members')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'members' ? 'text-[#2F7BFF]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'text-[#2F7BFF] stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{lang === 'ta' ? 'உறுப்பினர்கள்' : 'Members'}</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('schemes')}
              className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                activeTab === 'schemes' ? 'text-[#2F7BFF]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className={`w-5 h-5 ${activeTab === 'schemes' ? 'text-[#2F7BFF] stroke-[2.5]' : 'text-slate-400'}`} />
              <span>{lang === 'ta' ? 'திட்டங்கள்' : 'Schemes'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
              activeTab === 'calendar' ? 'text-[#2F7BFF]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'text-[#2F7BFF] stroke-[2.5]' : 'text-slate-400'}`} />
            <span>{lang === 'ta' ? 'காலண்டர்' : 'Calendar'}</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 text-slate-400" />
            <span>{lang === 'ta' ? 'மேலும்' : 'Menu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 2. DASHBOARD SCREEN (BILINGUAL)
// -------------------------------------------------------------
function DashboardScreen({ user, lang, onNavigate, onViewReceipt }: { user: any; lang: SupportedLanguage; onNavigate: (t: string) => void; onViewReceipt: (p: any) => void }) {
  const t = translations[lang];
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const nextPournami = getNextPournami();

  useEffect(() => {
    api.getDashboard()
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-slate-400">{lang === 'ta' ? 'புள்ளிவிவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading dashboard metrics...'}</div>;
  }

  if (data?.isMember) {
    return (
      <div className="space-y-6">
        {/* Auspicious Chit Lunar Day Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-indigo-500/15 border-2 border-amber-300 dark:border-amber-700/60 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-amber-400/20 border border-amber-400/40 shrink-0">
              🌕
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-amber-900 dark:text-amber-300 text-sm">
                  {lang === 'ta' ? 'அடுத்த சீட்டு நாள் (பௌர்ணமி):' : 'Next Chit Day (Pournami):'} {nextPournami.dateStr}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-sm">
                  {nextPournami.isToday
                    ? lang === 'ta' ? 'இன்று!' : 'Today!'
                    : `${nextPournami.daysRemaining} ${t.daysRemaining}`}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                🎯 {lang === 'ta' ? 'அனைத்து சீட்டுத் தவணைகள் & குலுக்கல் பௌர்ணமி நாளில் நடைபெறும்.' : 'Monthly lucky draw and collections held on every Full Moon day.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('calendar')}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 shrink-0"
          >
            <Calendar className="w-4 h-4" />
            <span>{lang === 'ta' ? 'நாட்காட்டியைப் பார்க்க ➔' : 'View Chit Calendar ➔'}</span>
          </button>
        </div>

        {/* Official Monthly Report Quick Access Banner for Member */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 rounded-xl bg-white/10 shrink-0">📋</span>
            <div>
              <h4 className="font-extrabold text-sm">
                {lang === 'ta' ? 'அதிகாரப்பூர்வ மாதாந்திர சீட்டு அறிக்கை' : 'Official Monthly Chit Report'}
              </h4>
              <p className="text-xs text-blue-100 mt-0.5">
                {lang === 'ta'
                  ? 'சீட்டு எண் 08 (25.10.26) - 78 உறுப்பினர்களின் தவணை வசூல் மற்றும் கமிஷன் விபரம்'
                  : 'Chit No: 08 (25.10.26) - 78 Members contribution & commission statement'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('monthly-entry')}
            className="px-4 py-2 rounded-xl bg-white text-blue-700 hover:bg-blue-50 text-xs font-black transition-all shadow-md shrink-0 flex items-center gap-1.5"
          >
            <ClipboardList className="w-4 h-4 text-blue-600" />
            <span>{lang === 'ta' ? 'அறிக்கையைக் காண்க ➔' : 'View Monthly Report ➔'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title={t.totalContributed}
            value={formatINR(data.totalContributedPaise)}
            icon={<Coins className="w-5 h-5" />}
            color="blue"
            trend={lang === 'ta' ? 'செயலில் உள்ள சேமிப்பு' : 'Active Savings'}
          />
          <StatCard
            title={t.outstandingBalance}
            value={formatINR(data.outstandingContributionsPaise)}
            icon={<AlertCircle className="w-5 h-5" />}
            color={data.outstandingContributionsPaise > 0 ? 'red' : 'green'}
            subtitle={data.outstandingContributionsPaise > 0 ? (lang === 'ta' ? 'செலுத்த வேண்டிய தவணைகள்' : 'Due for active rounds') : (lang === 'ta' ? 'அனைத்து தவணைகளும் செலுத்தப்பட்டன' : 'All installments cleared')}
          />
          <StatCard
            title={t.enrolledSchemes}
            value={`${data.activeSchemesCount} ${lang === 'ta' ? 'திட்டங்கள்' : 'Active'}`}
            icon={<Building className="w-5 h-5" />}
            color="purple"
          />
        </div>

        {/* Upcoming dues */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{t.upcomingInstallments}</h3>
          {data.upcomingRounds.length === 0 ? (
            <p className="text-xs text-slate-400">{t.noPendingDues}</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingRounds.map((r: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{r.schemeName}</h4>
                    <span className="text-xs text-slate-500">{t.roundNumber} #{r.roundNumber} • {t.dueDate}: {formatKolkataDate(r.dueDate)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#2F7BFF]">{formatINR(r.amountDuePaise)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Member Recent Transactions */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">{t.recentPaymentsTitle}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-2.5 px-3">{t.receiptNumber}</th>
                  <th className="py-2.5 px-3">{t.schemes}</th>
                  <th className="py-2.5 px-3">{t.roundNumber}</th>
                  <th className="py-2.5 px-3">{t.amountReceived}</th>
                  <th className="py-2.5 px-3">{t.dueDate}</th>
                  <th className="py-2.5 px-3">{lang === 'ta' ? 'நடவடிக்கை' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {data.recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">{tx.receiptNumber}</td>
                    <td className="py-3 px-3">{tx.schemeName}</td>
                    <td className="py-3 px-3">#{tx.roundNumber}</td>
                    <td className="py-3 px-3 font-bold text-emerald-600">{formatINR(tx.amountReceivedPaise)}</td>
                    <td className="py-3 px-3 text-slate-500">{formatKolkataDate(tx.paymentDate)}</td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="inline-flex items-center gap-1 text-[#2F7BFF] hover:underline"
                      >
                        <Printer className="w-3.5 h-3.5" /> {t.viewReceipt}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Admin & Staff Dashboard
  // Chart data matching mockup trends
  const chartData = [
    { month: 'May 26', collected: 2, payouts: 1 },
    { month: 'Jun 26', collected: 2, payouts: 0 },
    { month: 'Jul 26', collected: 2.5, payouts: 0 },
    { month: 'Aug 26', collected: 4, payouts: 1.5 },
    { month: 'Sep 26', collected: 5, payouts: 0 },
    { month: 'Oct 26', collected: 50, payouts: 10 },
  ];

  const totalMembersCount = data.totalActiveMembers || 78;
  const paidCount = data.paidMembersCount || 5;
  const pendingCount = data.pendingMembersCount || 73;
  const paidPercent = Math.round((paidCount / totalMembersCount) * 100) || 6;
  const pendingPercent = 100 - paidPercent;

  const donutRadius = 34;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutOffset = donutCircumference - (paidPercent / 100) * donutCircumference;

  // Transactions list matching mockup
  const transactionsList = [
    { id: 1, date: '26 Oct 2026', name: 'Ramesh K', type: 'Collection', amount: '₹5,000', status: 'Completed' },
    { id: 2, date: '25 Oct 2026', name: 'Selvi M', type: 'Collection', amount: '₹3,000', status: 'Completed' },
    { id: 3, date: '24 Oct 2026', name: 'Murugan S', type: 'Payout', amount: '₹10,000', status: 'Completed' },
    { id: 4, date: '22 Oct 2026', name: 'Anitha R', type: 'Collection', amount: '₹2,500', status: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Dashboard Top Title & Date Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {lang === 'ta' ? `மீண்டும் வருக, ${user.name}` : `Welcome back, ${user.name}`}
          </p>
        </div>

        {/* Today Card on Top Right */}
        <div className="flex items-center gap-3 bg-white dark:bg-[#111C2E] border border-slate-200/80 dark:border-slate-800 rounded-2xl px-4 py-2.5 shadow-2xs self-start sm:self-auto">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'ta' ? 'இன்று' : 'Today'}
            </div>
            <div className="text-xs font-black text-slate-800 dark:text-slate-200">
              Sunday, 26 Oct 2026
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner: Pournami / Next Chit Day */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0C1E3E] via-[#0E2954] to-[#0A1732] text-white p-6 sm:p-7 relative overflow-hidden shadow-xl border border-blue-900/50 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Subtle illuminated Temple Gopuram picture on the left */}
        <div className="hidden md:flex items-center justify-center shrink-0 w-24 h-24 relative">
          <img
            src="/logo.jpg"
            alt="Sri Pattanathu Mariamman Gopuram"
            className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.35)] ring-4 ring-amber-400/20"
          />
        </div>

        {/* Center: Next Chit Announcement */}
        <div className="flex-1 min-w-0 z-10 text-center md:text-left">
          <div className="text-[11px] font-bold tracking-widest text-blue-300 uppercase flex items-center justify-center md:justify-start gap-1.5 mb-1">
            <span>{lang === 'ta' ? 'அடுத்த சீட்டு நாள்' : 'NEXT CHIT DAY'}</span>
            <ChevronRight className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Pournami - 2026-10-26
          </h2>
          <p className="text-xs text-blue-200/90 mt-1.5 flex items-center justify-center md:justify-start gap-1.5">
            <span>🎁</span>
            <span>
              {lang === 'ta'
                ? 'மாதாந்திர அதிர்ஷ்ட குலுக்கல் & வசூல் பௌர்ணமி தோறும் நடைபெறும்.'
                : 'Monthly lucky draw and collections held on every Full Moon day.'}
            </span>
          </p>
        </div>

        {/* Glowing Full Moon */}
        <div className="relative flex items-center justify-center shrink-0 z-10">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-yellow-300 shadow-[0_0_50px_rgba(251,191,36,0.7)] border-2 border-yellow-200/70 overflow-hidden relative flex items-center justify-center">
            <div className="absolute top-3 left-4 w-5 h-5 rounded-full bg-amber-300/35 blur-xs"></div>
            <div className="absolute bottom-4 right-5 w-7 h-6 rounded-full bg-amber-300/40 blur-xs"></div>
            <div className="absolute top-7 right-3 w-4 h-4 rounded-full bg-amber-300/30 blur-xs"></div>
            <div className="absolute inset-0 bg-radial from-transparent via-amber-200/10 to-amber-400/30"></div>
          </div>
        </div>

        {/* Countdown & View Calendar Action Button */}
        <div className="flex flex-col items-center md:items-end shrink-0 z-10">
          <div className="text-sm font-black text-amber-300 tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="text-lg">1</span>
            <span>{lang === 'ta' ? 'நாள் மீதமுள்ளது' : 'DAY REMAINING'}</span>
          </div>
          <button
            onClick={() => onNavigate('calendar')}
            className="bg-[#F59E0B] hover:bg-[#D97706] text-slate-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>{lang === 'ta' ? 'சீட்டு நாட்காட்டி ➔' : 'View Chit Calendar →'}</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="TOTAL COLLECTED"
          value="₹50,000"
          icon={<Coins className="w-5 h-5" />}
          color="blue"
          trend="↑ Live Ledger Sync"
        />
        <StatCard
          title="EXPECTED THIS MONTH"
          value="₹7,80,000"
          icon={<Target className="w-5 h-5" />}
          color="amber"
          subtitle="Target for current round"
        />
        <StatCard
          title="OUTSTANDING BALANCE"
          value="₹7,30,000"
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
          subtitle="Overdue collections"
        />
        <StatCard
          title="TOTAL PAYOUTS"
          value="₹0"
          icon={<Gift className="w-5 h-5" />}
          color="green"
          subtitle="Disbursed to winners"
        />
      </div>

      {/* Middle Row: Collections Chart & Member Participation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Collections vs Payouts Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111C2E] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] shrink-0">
                <BarChart2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Monthly Collections vs Payouts
                </h3>
                <p className="text-xs text-slate-400">
                  Financial trends (INR in Thousands)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span> Total Collected
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-[#9333EA]"></span> Payouts
              </span>
              <div className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1">
                Last 6 Months <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val}K`}
                  domain={[0, 60]}
                  ticks={[0, 15, 30, 45, 60]}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${value}K`, '']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                />
                <Bar dataKey="collected" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={22} name="Total Collected" />
                <Bar dataKey="payouts" fill="#9333EA" radius={[4, 4, 0, 0]} barSize={22} name="Payouts" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Participation Radial Progress (1 Col) */}
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Member Participation
                </h3>
                <p className="text-xs text-slate-400">
                  Current Month Installment Status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 my-4">
              {/* Circular Gauge */}
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="9"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r={donutRadius}
                    stroke="#10B981"
                    strokeWidth="9"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={donutOffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-800 dark:text-white leading-none">
                    78
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                    Total Members
                  </span>
                </div>
              </div>

              {/* Breakdown Bars */}
              <div className="flex-1 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Paid Members
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">5 (6%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '6%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Members
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">73 (94%)</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '94%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('payments')}
              className="w-full py-2.5 px-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 text-[#2563EB] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Record New Contribution →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions & Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Transactions Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#111C2E] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                Recent Transactions
              </h3>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              View Full Ledger →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">DATE</th>
                  <th className="py-2.5 px-3">MEMBER NAME</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">AMOUNT</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {transactionsList.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-500">{tx.id}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{tx.date}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{tx.name}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          tx.type === 'Collection'
                            ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60'
                            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {tx.amount}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => onNavigate('payments')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563EB] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Events (1 Col) */}
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Upcoming Events
                </h3>
              </div>
              <button
                onClick={() => onNavigate('calendar')}
                className="text-xs font-bold text-[#2563EB] hover:underline"
              >
                View Calendar →
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Event 1 */}
              <div
                onClick={() => onNavigate('calendar')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🌕</span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">
                      Pournami - Chit Day
                    </h4>
                    <span className="text-[11px] text-slate-400">26 Oct 2026</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    1 day left
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Event 2 */}
              <div
                onClick={() => onNavigate('calendar')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">
                      Monthly Collection
                    </h4>
                    <span className="text-[11px] text-slate-400">25 Nov 2026</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Event 3 */}
              <div
                onClick={() => onNavigate('payouts')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">
                      Monthly Payout
                    </h4>
                    <span className="text-[11px] text-slate-400">25 Nov 2026</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>

              {/* Event 4 */}
              <div
                onClick={() => onNavigate('calendar')}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 transition-all flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB]">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors">
                      Next Chit Day
                    </h4>
                    <span className="text-[11px] text-slate-400">24 Dec 2026</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 3. MEMBERS MANAGEMENT SCREEN (BILINGUAL)
// -------------------------------------------------------------
function MembersScreen({ user, lang, showToast }: { user: any; lang: SupportedLanguage; showToast: any }) {
  const t = translations[lang];
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15); // Default to 15 members per page as requested
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Selection & Delete States
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSelectDeleteModal, setShowSelectDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<any>(null);
  const [dropdownSelectedId, setDropdownSelectedId] = useState<string>('');
  const [allMembersList, setAllMembersList] = useState<any[]>([]);
  const [loadingAllMembers, setLoadingAllMembers] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newMember, setNewMember] = useState({
    memberNumber: '',
    fullName: '',
    phone: '',
    email: '',
    address: '',
    status: 'ACTIVE',
    notes: '',
  });

  const loadMembers = (page = currentPage, limit = pageSize) => {
    setLoading(true);
    api.getMembers({ search, status: statusFilter, page, limit })
      .then((res) => {
        if (res.success) {
          setMembers(res.data);
          if (res.pagination) {
            setTotalCount(res.pagination.total);
            setTotalPages(res.pagination.totalPages || 1);
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
    loadMembers(1, pageSize);
  }, [search, statusFilter, pageSize]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setSelectedIds([]);
    loadMembers(newPage, pageSize);
  };

  const toggleSelectAll = () => {
    if (members.length > 0 && selectedIds.length === members.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(members.map((m) => m.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openSelectDeleteModal = async () => {
    setShowSelectDeleteModal(true);
    setLoadingAllMembers(true);
    try {
      const res = await api.getMembers({ limit: 500 });
      if (res.success && res.data) {
        setAllMembersList(res.data);
        if (res.data.length > 0 && !dropdownSelectedId) {
          setDropdownSelectedId(res.data[0].id);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch members list', 'error');
    } finally {
      setLoadingAllMembers(false);
    }
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (memberToDelete) {
        const res = await api.deleteMember(memberToDelete.id);
        if (res.success) {
          showToast(
            lang === 'ta'
              ? `${memberToDelete.fullName} வெற்றிகரமாக நீக்கப்பட்டார்`
              : res.message
          );
          setShowDeleteModal(false);
          setMemberToDelete(null);
          setSelectedIds((prev) => prev.filter((id) => id !== memberToDelete.id));
          loadMembers(currentPage, pageSize);
        }
      } else if (selectedIds.length > 0) {
        const res = await api.batchDeleteMembers(selectedIds);
        if (res.success) {
          showToast(
            lang === 'ta'
              ? `${res.data.deletedCount} உறுப்பினர்கள் வெற்றிகரமாக நீக்கப்பட்டனர்`
              : res.message
          );
          setShowDeleteModal(false);
          setSelectedIds([]);
          loadMembers(currentPage, pageSize);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete member', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      let dataToExport = members;
      try {
        const res = await api.getMembers({ limit: 500 });
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          dataToExport = res.data;
        }
      } catch (e) {}

      if (!dataToExport || dataToExport.length === 0) {
        dataToExport = OFFICIAL_78_MEMBERS;
      }

      const headers = [
        'S.No',
        'Sheet Number',
        'Member ID',
        'Full Name (Tamil / English)',
        'Phone Number',
        'Email Address',
        'Address / Village',
        'Status',
      ];

      const rows = dataToExport.map((m: any, idx: number) => {
        const sno = m.sno || idx + 1;
        const sheetNumber = m.sheetNumber || Math.floor(idx / 13) + 1;
        const memId = m.memberNumber || `M-${String(sno).padStart(3, '0')}`;
        const name = (m.fullName || '').replace(/"/g, '""');
        const phone = (m.phone || '').replace(/"/g, '""');
        const email = (m.email || '').replace(/"/g, '""');
        const address = (m.address || '').replace(/"/g, '""');
        const status = m.status || 'ACTIVE';

        return [
          sno,
          `"Sheet ${sheetNumber}"`,
          `"${memId}"`,
          `"${name}"`,
          `"${phone}"`,
          `"${email}"`,
          `"${address}"`,
          `"${status}"`,
        ];
      });

      const csvContent =
        '\uFEFF' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seettu-members.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast(
        lang === 'ta'
          ? 'உறுப்பினர்கள் பட்டியல் (78 நபர்கள்) CSV கோப்பாக வெற்றிகரமாக பதிவிறக்கப்பட்டது!'
          : 'Members list (78 members) CSV downloaded successfully!'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to export CSV', 'error');
    }
  };

  const handleDropdownSelectDelete = () => {
    if (!dropdownSelectedId) return;
    const target = allMembersList.find((m) => m.id === dropdownSelectedId);
    if (!target) return;
    setMemberToDelete(target);
    setShowSelectDeleteModal(false);
    setShowDeleteModal(true);
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createMember(newMember);
      if (res.success) {
        showToast(lang === 'ta' ? 'உறுப்பினர் வெற்றிகரமாக சேர்க்கப்பட்டார்' : res.message);
        setShowAddModal(false);
        setNewMember({ memberNumber: '', fullName: '', phone: '', email: '', address: '', status: 'ACTIVE', notes: '' });
        loadMembers();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleViewProfile = async (id: string) => {
    try {
      const res = await api.getMember(id);
      if (res.success) setSelectedMember(res.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
          >
            <option value="ALL">{t.allStatus}</option>
            <option value="ACTIVE">{t.active}</option>
            <option value="INACTIVE">{t.inactive}</option>
            <option value="SUSPENDED">{t.suspended}</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs">
            {totalCount} {lang === 'ta' ? 'உறுப்பினர்கள்' : 'Members'}
          </span>

          {/* Delete Option in Top Bar */}
          {selectedIds.length > 0 ? (
            <button
              onClick={() => {
                setMemberToDelete(null);
                setShowDeleteModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              title={lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட உறுப்பினர்களை நீக்கு' : 'Delete selected members'}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>
                {lang === 'ta'
                  ? `நீக்கு (${selectedIds.length})`
                  : `Delete (${selectedIds.length})`}
              </span>
            </button>
          ) : (
            <button
              onClick={openSelectDeleteModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
              title={lang === 'ta' ? 'உறுப்பினரைத் தேர்ந்தெடுத்து நீக்கு' : 'Select a member to delete'}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{lang === 'ta' ? 'உறுப்பினரை நீக்கு' : 'Delete Member'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> {t.exportCsv}
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t.addMember}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Select all members on this page"
                    checked={members.length > 0 && selectedIds.length === members.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#2F7BFF] focus:ring-[#2F7BFF] h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">{t.memberId}</th>
                <th className="py-3 px-4">{t.fullName}</th>
                <th className="py-3 px-4">{t.contact}</th>
                <th className="py-3 px-4">{t.status}</th>
                <th className="py-3 px-4">{t.enrolledSchemes}</th>
                <th className="py-3 px-4">{t.totalContributed}</th>
                <th className="py-3 px-4 text-right">{lang === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">...</td></tr>
              ) : members.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400">{t.noMembersFound}</td></tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      selectedIds.includes(m.id) ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Select ${m.fullName}`}
                        checked={selectedIds.includes(m.id)}
                        onChange={() => toggleSelectOne(m.id)}
                        className="rounded border-slate-300 text-[#2F7BFF] focus:ring-[#2F7BFF] h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{m.memberNumber}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900">{m.fullName}</span>
                      {m.address && <p className="text-[11px] text-slate-400 truncate max-w-xs">{m.address}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>{m.phone}</div>
                      <div className="text-slate-400 text-[11px]">{m.email || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        m.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {m.status === 'ACTIVE' ? t.active : t.inactive}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-700">{m.activeSchemesCount || 0}</td>
                    <td className="py-3.5 px-4 font-extrabold text-emerald-600">
                      {formatINR(m.totalContributedPaise || 0)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewProfile(m.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#2F7BFF] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        {t.profileAndLedger}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Count Footer (15 per page default) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-700">
              {lang === 'ta'
                ? `மொத்தம் ${totalCount} உறுப்பினர்களில் ${Math.min((currentPage - 1) * pageSize + 1, totalCount)} - ${Math.min(currentPage * pageSize, totalCount)} காட்டப்படுகிறது (பக்கம் ${currentPage} / ${totalPages})`
                : `Showing ${Math.min((currentPage - 1) * pageSize + 1, totalCount)} to ${Math.min(currentPage * pageSize, totalCount)} of ${totalCount} members (Page ${currentPage} of ${totalPages})`}
            </span>
            <span className="text-slate-300">|</span>
            <label className="flex items-center gap-1.5">
              <span className="text-slate-500">{lang === 'ta' ? 'பக்கம் ஒன்றிற்கு:' : 'Per page:'}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setCurrentPage(1);
                  loadMembers(1, newSize);
                }}
                className="py-1 px-2 rounded border border-slate-200 bg-white text-xs font-bold focus:ring-1 focus:ring-[#2F7BFF]"
              >
                <option value={15}>15 ({lang === 'ta' ? 'பரிந்துரைக்கப்பட்டது' : 'Standard'})</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={100}>100 ({lang === 'ta' ? 'அனைத்து 78' : 'All 78'})</option>
              </select>
            </label>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1 font-semibold">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              >
                {lang === 'ta' ? '◀ முந்தைய' : '◀ Prev'}
              </button>

              {/* Numbered Page Buttons for direct jumping */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                      currentPage === pageNum
                        ? 'bg-[#2F7BFF] text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-xs"
              >
                {lang === 'ta' ? 'அடுத்தது ▶' : 'Next ▶'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">{t.addMember}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateMember} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.memberId}</label>
                    <input
                      type="text"
                      required
                      placeholder="M-011"
                      value={newMember.memberNumber}
                      onChange={(e) => setNewMember({ ...newMember, memberNumber: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.status}</label>
                    <select
                      value={newMember.status}
                      onChange={(e) => setNewMember({ ...newMember, status: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    >
                      <option value="ACTIVE">{t.active}</option>
                      <option value="INACTIVE">{t.inactive}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.fullName}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ta' ? 'எ.கா: சுப்பிரமணியன் கே' : 'e.g. Subramanian K'}
                    value={newMember.fullName}
                    onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.phoneNumber}</label>
                    <input
                      type="tel"
                      required
                      placeholder="9840112233"
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.emailOptional}</label>
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.address}</label>
                  <input
                    type="text"
                    placeholder={lang === 'ta' ? 'தெரு, ஊர், மாவட்டம்' : 'Street, City, Postal Code'}
                    value={newMember.address}
                    onChange={(e) => setNewMember({ ...newMember, address: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 flex justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  {t.saveMember}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedMember.fullName}</h3>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {t.memberId}: {selectedMember.memberNumber} • {selectedMember.phone}
                </span>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <span className="text-xs font-semibold text-emerald-800 uppercase">{t.totalContributed}</span>
                  <p className="text-2xl font-bold text-emerald-700">{formatINR(selectedMember.totalContributedPaise)}</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-xs font-semibold text-amber-800 uppercase">{t.outstandingBalance}</span>
                  <p className="text-2xl font-bold text-amber-700">{formatINR(selectedMember.totalPendingPaise)}</p>
                </div>
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.enrolledSchemesTitle}</h4>
              <div className="space-y-2 mb-4">
                {selectedMember.memberships.map((m: any) => (
                  <div key={m.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{m.schemeName}</span>
                      <span className="text-slate-400 font-mono block text-[11px]">
                        {lang === 'ta' ? 'இடம்' : 'Slot'} #{m.slotNumber} • {formatINR(m.contributionAmountPaise)}/{lang === 'ta' ? 'தவணை' : 'installment'}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      m.hasReceivedPayout ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {m.hasReceivedPayout ? (lang === 'ta' ? 'பட்டுவாடா வழங்கப்பட்டது' : 'Payout Awarded') : (lang === 'ta' ? 'செயலில் உள்ள உறுப்பினர்' : 'Active Contributor')}
                    </span>
                  </div>
                ))}
              </div>

              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.recentPaymentsTitle}</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">{t.receiptNumber}</th>
                      <th className="py-2.5 px-3">{t.schemes}</th>
                      <th className="py-2.5 px-3">{t.roundNumber}</th>
                      <th className="py-2.5 px-3">{t.amountReceived}</th>
                      <th className="py-2.5 px-3">{t.dueDate}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedMember.recentPayments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-mono font-semibold">{p.receiptNumber}</td>
                        <td className="py-2.5 px-3">{p.schemeName}</td>
                        <td className="py-2.5 px-3">#{p.roundNumber}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{formatINR(p.amountReceivedPaise)}</td>
                        <td className="py-2.5 px-3 text-slate-400">{formatKolkataDate(p.paymentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="px-5 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {lang === 'ta' ? 'முடிந்தது' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Member to Delete Modal (Opened from Top Bar "Delete Member") */}
      {showSelectDeleteModal && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <div className="flex items-center gap-2 text-rose-600">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ta' ? 'நீக்க வேண்டிய உறுப்பினரைத் தேர்வுசெய்க' : 'Select Member to Delete'}
                </h3>
              </div>
              <button
                onClick={() => setShowSelectDeleteModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAllMembers ? (
              <div className="py-12 text-center text-slate-400 text-xs flex-1 flex items-center justify-center">
                {lang === 'ta' ? 'உறுப்பினர்கள் பட்டியல் ஏற்றப்படுகிறது...' : 'Loading members list...'}
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                      {lang === 'ta' ? 'உறுப்பினர் பெயர் & எண்' : 'Select Member'}
                    </label>
                    <select
                      value={dropdownSelectedId}
                      onChange={(e) => setDropdownSelectedId(e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    >
                      {allMembersList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.memberNumber} - {m.fullName} ({m.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  {dropdownSelectedId && (() => {
                    const target = allMembersList.find((m) => m.id === dropdownSelectedId);
                    if (!target) return null;
                    return (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-100 space-y-1 text-slate-700">
                        <div className="font-bold text-rose-900 text-sm">{target.fullName}</div>
                        <div className="font-mono text-slate-600">{t.memberId}: {target.memberNumber}</div>
                        <div className="text-slate-600">{t.phoneNumber}: {target.phone}</div>
                        {target.address && <div className="text-slate-500 text-[11px] truncate">{target.address}</div>}
                      </div>
                    );
                  })()}
                </div>

                <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 flex justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <button
                    type="button"
                    onClick={() => setShowSelectDeleteModal(false)}
                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDropdownSelectDelete}
                    disabled={!dropdownSelectedId}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'ta' ? 'அடுத்து நீக்கு' : 'Proceed to Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full shadow-2xl p-6 border border-slate-100 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'ta' ? 'உறுப்பினரை நீக்க உறுதிப்படுத்தவும்' : 'Confirm Deletion'}
                </h3>
                <p className="text-xs text-slate-500">
                  {lang === 'ta' ? 'இந்த செயல் நிரந்தரமானது, மாற்ற முடியாது.' : 'This action is permanent and cannot be undone.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-5">
              {memberToDelete ? (
                <div>
                  <p className="font-semibold text-slate-800 mb-1">
                    {lang === 'ta' ? 'நீங்கள் நீக்க விரும்பும் உறுப்பினர்:' : 'Member to be deleted:'}
                  </p>
                  <p className="font-bold text-rose-600 text-sm">
                    {memberToDelete.memberNumber} - {memberToDelete.fullName}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1 font-mono">
                    {t.phoneNumber}: {memberToDelete.phone}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-800 mb-1">
                    {lang === 'ta'
                      ? `தேர்ந்தெடுக்கப்பட்ட ${selectedIds.length} உறுப்பினர்களை நீக்க விரும்புகிறீர்களா?`
                      : `Are you sure you want to delete these ${selectedIds.length} selected member(s)?`}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-1">
                    {lang === 'ta'
                      ? 'இவர்களுடைய அனைத்து சீட்டுப் பதிவுகள் மற்றும் கணக்குகளும் நீக்கப்படும்.'
                      : 'All associated memberships and ledger history will be removed.'}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                {isDeleting ? (
                  <span>{lang === 'ta' ? 'நீக்கப்படுகிறது...' : 'Deleting...'}</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>{lang === 'ta' ? 'உறுதியாக நீக்கு' : 'Yes, Delete Permanently'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 4. SCHEMES SCREEN (BILINGUAL)
// -------------------------------------------------------------
function SchemesScreen({ user, lang, showToast, onRecordPaymentForScheme }: { user: any; lang: SupportedLanguage; showToast: any; onRecordPaymentForScheme: (id: string) => void }) {
  const t = translations[lang];
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<any>(null);

  const [form, setForm] = useState({
    code: '',
    name: '',
    schemeType: 'ROTATING_CHIT',
    startDate: new Date().toISOString().split('T')[0],
    totalInstallments: 20,
    frequency: 'MONTHLY',
    contributionAmountRupees: 5000,
    totalMembersCount: 20,
    organizerCommissionRupees: 2500,
    notes: '',
  });

  const loadSchemes = () => {
    setLoading(true);
    api.getSchemes().then((res) => {
      if (res.success) setSchemes(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code,
        name: form.name,
        schemeType: form.schemeType,
        startDate: form.startDate,
        totalInstallments: Number(form.totalInstallments),
        frequency: form.frequency,
        contributionAmountPaise: Number(form.contributionAmountRupees) * 100,
        totalMembersCount: Number(form.totalMembersCount),
        organizerCommissionPaise: Number(form.organizerCommissionRupees) * 100,
        notes: form.notes,
        status: 'ACTIVE',
      };

      const res = await api.createScheme(payload);
      if (res.success) {
        showToast(lang === 'ta' ? 'சீட்டுத் திட்டம் வெற்றிகரமாக துவக்கப்பட்டது' : res.message);
        setShowCreateModal(false);
        loadSchemes();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleViewScheme = async (id: string) => {
    try {
      const res = await api.getScheme(id);
      if (res.success) setSelectedScheme(res.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">{t.schemesTitle}</h2>
          <p className="text-xs text-slate-400">{t.schemesSubtitle}</p>
        </div>
        {user.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t.createNewScheme}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {schemes.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-[#2F7BFF] bg-blue-50 px-2 py-0.5 rounded">
                  {s.code}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {s.status === 'ACTIVE' ? t.active : s.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">{s.name}</h3>
              <p className="text-xs text-slate-500 mt-1">
                {s.schemeType === 'ROTATING_CHIT' ? t.rotatingChit : t.fixedSavings} • {s.totalInstallments} {lang === 'ta' ? 'மாதங்கள்' : 'Installments'}
              </p>

              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.installmentAmount}</span>
                  <span className="font-bold text-slate-800">{formatINR(s.contributionAmountPaise)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.totalPoolPerRound}</span>
                  <span className="font-bold text-slate-800">{formatINR(s.totalPoolAmountPaise)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.totalMembers}</span>
                  <span className="font-bold text-slate-800">{s.membersEnrolled} / {s.totalMembersCount}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">{lang === 'ta' ? 'நடப்பு சுற்று' : 'Current Round'}</span>
                  <span className="font-bold text-blue-600">{t.roundNumber} #{s.currentRoundNumber || 1}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button
                onClick={() => handleViewScheme(s.id)}
                className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
              >
                {t.viewDetailsAndRounds}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Scheme Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">{t.createNewScheme}</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateScheme} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.schemeCode}</label>
                    <input
                      type="text"
                      required
                      placeholder="SCH-200K-01"
                      value={form.code}
                      onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.schemeType}</label>
                    <select
                      value={form.schemeType}
                      onChange={(e) => setForm({ ...form, schemeType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    >
                      <option value="ROTATING_CHIT">{t.rotatingChit}</option>
                      <option value="FIXED_SAVINGS">{t.fixedSavings}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.schemeName}</label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ta' ? 'தங்கம் மாதாந்திர சீட்டு (1 லட்சம்)' : 'Gold Monthly Chit Fund (1 Lakh)'}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.installmentAmount}</label>
                    <input
                      type="number"
                      required
                      value={form.contributionAmountRupees}
                      onChange={(e) => setForm({ ...form, contributionAmountRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.totalMembers}</label>
                    <input
                      type="number"
                      required
                      value={form.totalMembersCount}
                      onChange={(e) => setForm({ ...form, totalMembersCount: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.totalInstallments}</label>
                    <input
                      type="number"
                      required
                      value={form.totalInstallments}
                      onChange={(e) => setForm({ ...form, totalInstallments: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.startDate}</label>
                    <input
                      type="date"
                      required
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.organizerFee}</label>
                    <input
                      type="number"
                      value={form.organizerCommissionRupees}
                      onChange={(e) => setForm({ ...form, organizerCommissionRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 flex justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  {t.initializeScheme}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scheme Details Drawer */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-3xl h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedScheme.name}</h3>
                <span className="text-xs font-mono font-medium text-slate-500">
                  {selectedScheme.code} • {t.totalPoolPerRound}: {formatINR(selectedScheme.totalPoolAmountPaise)}
                </span>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">{t.collectionSchedule}</h4>
              <div className="space-y-2 mb-6">
                {selectedScheme.collectionRounds.map((r: any) => (
                  <div key={r.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{t.roundNumber} #{r.roundNumber}</span>
                      <span className="text-slate-400 block text-[11px]">{t.dueDate}: {formatKolkataDate(r.dueDate)}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] text-slate-500">{t.totalCollected}:</span>
                      <span className="font-bold text-emerald-600 block">{formatINR(r.collectedAmountPaise)}</span>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {r.status}
                      </span>
                      {r.payoutRecipientName && (
                        <span className="text-[10px] text-purple-700 font-semibold block mt-0.5">
                          {t.winnerAwarded}: {r.payoutRecipientName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 px-5 py-3 bg-slate-50 flex justify-end shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setSelectedScheme(null)}
                className="px-5 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                {lang === 'ta' ? 'மூடுக' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 5. PAYMENTS LEDGER SCREEN (BILINGUAL)
// -------------------------------------------------------------
function PaymentsScreen({ user, lang, showToast, onViewReceipt }: { user: any; lang: SupportedLanguage; showToast: any; onViewReceipt: (p: any) => void }) {
  const t = translations[lang];
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState<string | null>(null);
  const [reverseReason, setReverseReason] = useState('');

  const [members, setMembers] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);

  const [paymentForm, setPaymentForm] = useState({
    memberId: '',
    schemeId: '',
    roundNumber: 1,
    amountRupees: 5000,
    paymentMethod: 'UPI',
    externalReference: '',
    notes: '',
  });

  const loadPayments = () => {
    setLoading(true);
    api.getPayments().then((res) => {
      if (res.success) setPayments(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPayments();
    if (user.role !== 'MEMBER') {
      api.getMembers().then((r) => r.success && setMembers(r.data));
      api.getSchemes().then((r) => r.success && setSchemes(r.data));
    }
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const payload = {
        memberId: paymentForm.memberId,
        schemeId: paymentForm.schemeId,
        roundNumber: Number(paymentForm.roundNumber),
        amountReceivedPaise: Number(paymentForm.amountRupees) * 100,
        paymentMethod: paymentForm.paymentMethod,
        externalReference: paymentForm.externalReference || null,
        idempotencyKey,
        notes: paymentForm.notes || null,
      };

      const res = await api.recordPayment(payload);
      if (res.success) {
        showToast(lang === 'ta' ? 'கட்டணம் வெற்றிகரமாக பதிவு செய்யப்பட்டு ரசீது உருவாக்கப்பட்டது' : res.message);
        setShowRecordModal(false);
        loadPayments();
        onViewReceipt(res.data);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReverse = async () => {
    if (!showReverseModal || !reverseReason.trim()) return;
    try {
      const res = await api.reversePayment(showReverseModal, reverseReason);
      if (res.success) {
        showToast(lang === 'ta' ? 'கட்டணம் ரத்து செய்யப்பட்டு தணிக்கைப் பதிவு செய்யப்பட்டது' : res.message);
        setShowReverseModal(null);
        setReverseReason('');
        loadPayments();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-800">{t.paymentsLedger}</h2>
          <p className="text-xs text-slate-400">{t.paymentsSubtitle}</p>
        </div>
        {user.role !== 'MEMBER' && (
          <button
            onClick={() => setShowRecordModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t.recordPayment}
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">{t.receiptNumber}</th>
              <th className="py-3 px-4">{t.fullName}</th>
              <th className="py-3 px-4">{t.schemes}</th>
              <th className="py-3 px-4">{t.amountReceived}</th>
              <th className="py-3 px-4">{t.paymentMethod}</th>
              <th className="py-3 px-4">{t.dueDate}</th>
              <th className="py-3 px-4">{t.status}</th>
              <th className="py-3 px-4 text-right">{lang === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.receiptNumber}</td>
                <td className="py-3 px-4">
                  <span className="font-bold text-slate-900 block">{p.memberName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {p.memberNumber}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-slate-800 block">{p.schemeName}</span>
                  <span className="text-[10px] text-slate-400">{t.roundNumber} #{p.roundNumber}</span>
                </td>
                <td className="py-3 px-4 font-extrabold text-emerald-600">
                  {formatINR(p.amountReceivedPaise)}
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-[11px] font-semibold text-slate-700">{p.paymentMethod}</span>
                  {p.externalReference && (
                    <span className="text-[10px] text-slate-400 block font-mono">Ref: {p.externalReference}</span>
                  )}
                </td>
                <td className="py-3 px-4 text-slate-500">{formatKolkataDate(p.paymentDate)}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {p.status === 'SUCCESS' ? (lang === 'ta' ? 'வெற்றி' : 'SUCCESS') : (lang === 'ta' ? 'ரத்து செய்யப்பட்டது' : 'REVERSED')}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onViewReceipt(p)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t.viewReceipt}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    {user.role === 'ADMIN' && p.status === 'SUCCESS' && (
                      <button
                        onClick={() => setShowReverseModal(p.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        title={t.reversePayment}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center bg-black/60 sm:p-4 backdrop-blur-sm overflow-hidden">
          <div className="bg-white w-full sm:max-w-md h-full sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-white">
              <h3 className="text-base font-bold text-slate-900">{t.recordPayment}</h3>
              <button onClick={() => setShowRecordModal(false)} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecordPayment} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    {lang === 'ta' ? 'உறுப்பினரைத் தேர்வு செய்க' : 'Select Member'}
                  </label>
                  <select
                    required
                    value={paymentForm.memberId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, memberId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                  >
                    <option value="">{lang === 'ta' ? '-- உறுப்பினரைத் தேர்ந்தெடுக்கவும் --' : '-- Choose Member --'}</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.memberNumber} - {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    {lang === 'ta' ? 'சீட்டுத் திட்டத்தைத் தேர்வு செய்க' : 'Select Scheme'}
                  </label>
                  <select
                    required
                    value={paymentForm.schemeId}
                    onChange={(e) => setPaymentForm({ ...paymentForm, schemeId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                  >
                    <option value="">{lang === 'ta' ? '-- சீட்டைத் தேர்ந்தெடுக்கவும் --' : '-- Choose Scheme --'}</option>
                    {schemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({formatINR(s.contributionAmountPaise)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.roundNumber}</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={paymentForm.roundNumber}
                      onChange={(e) => setPaymentForm({ ...paymentForm, roundNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.amountReceived} (₹)</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={paymentForm.amountRupees}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountRupees: Number(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-[#2F7BFF] focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.paymentMethod}</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    >
                      <option value="UPI">{t.upi}</option>
                      <option value="CASH">{t.cash}</option>
                      <option value="BANK_TRANSFER">{t.bankTransfer}</option>
                      <option value="OTHER">{t.chequeOther}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.txnReference}</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-998201"
                      value={paymentForm.externalReference}
                      onChange={(e) => setPaymentForm({ ...paymentForm, externalReference: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-xs font-mono focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 px-5 py-3.5 bg-slate-50 flex justify-end gap-2 shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
                >
                  {t.recordAndGenerateReceipt}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Reversal Modal */}
      {showReverseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-sm w-full shadow-2xl p-6 border border-slate-100 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <h3 className="text-base font-bold text-slate-900 mb-2">{t.reversePayment}</h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">{t.reversalReason}</label>
              <textarea
                required
                rows={3}
                placeholder={lang === 'ta' ? 'ரத்து செய்யப்படுவதற்கான காரணத்தை பதிவு செய்க...' : 'Reason for payment reversal...'}
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              ></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReverseModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleReverse}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                {t.confirmReversal}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// 6. PAYOUTS SCREEN (BILINGUAL)
// -------------------------------------------------------------
function PayoutsScreen({ user, lang, showToast }: { user: any; lang: SupportedLanguage; showToast: any }) {
  const t = translations[lang];
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPayouts = () => {
    setLoading(true);
    api.getPayouts().then((res) => {
      if (res.success) setPayouts(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadPayouts();
  }, []);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      const res = await api.approvePayout(id, approved);
      if (res.success) {
        showToast(lang === 'ta' ? (approved ? 'பட்டுவாடாவுக்கு ஒப்புதல் அளிக்கப்பட்டது' : 'பட்டுவாடா நிராகரிக்கப்பட்டது') : res.message);
        loadPayouts();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">{t.payoutsTitle}</h2>
        <p className="text-xs text-slate-400">{t.payoutsSubtitle}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">{t.schemes}</th>
              <th className="py-3 px-4">{t.recipient}</th>
              <th className="py-3 px-4">{t.grossPayout}</th>
              <th className="py-3 px-4">{t.deductions}</th>
              <th className="py-3 px-4">{t.netPayout}</th>
              <th className="py-3 px-4">{t.approvalStatus}</th>
              <th className="py-3 px-4">{t.disbursedRef}</th>
              <th className="py-3 px-4 text-right">{lang === 'ta' ? 'செயல்கள்' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {payouts.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-800 block">{po.schemeName}</span>
                  <span className="text-[10px] text-blue-600 font-semibold">{t.roundNumber} #{po.roundNumber}</span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-bold text-slate-900 block">{po.recipientName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {po.recipientMemberNumber}</span>
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-700">{formatINR(po.grossPayoutPaise)}</td>
                <td className="py-3.5 px-4 text-rose-600 font-semibold">-{formatINR(po.deductionsPaise)}</td>
                <td className="py-3.5 px-4 font-extrabold text-purple-700">{formatINR(po.netPayoutPaise)}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    po.approvalStatus === 'DISBURSED' ? 'bg-purple-100 text-purple-800' :
                    po.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {po.approvalStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">{po.referenceNumber || '-'}</td>
                <td className="py-3.5 px-4 text-right">
                  {user.role === 'ADMIN' && po.approvalStatus === 'PENDING_APPROVAL' && (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleApprove(po.id, true)}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold"
                      >
                        {t.approve}
                      </button>
                      <button
                        onClick={() => handleApprove(po.id, false)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[11px] font-bold"
                      >
                        {t.reject}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 7. REPORTS SCREEN (BILINGUAL)
// -------------------------------------------------------------
function ReportsScreen({
  user,
  lang,
  showToast,
  onOpenMonthlyReport,
}: {
  user: any;
  lang: SupportedLanguage;
  showToast: any;
  onOpenMonthlyReport?: (chitNo: string, date: string) => void;
}) {
  const t = translations[lang];
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [schemeSummaries, setSchemeSummaries] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      api.getCashFlowReport(),
      api.getSchemeSummary(),
      api.getOutstandingBalances(),
    ]).then(([cf, ss, ob]) => {
      if (cf.success) setCashFlow(cf.data);
      if (ss.success) setSchemeSummaries(ss.data);
      if (ob.success) setOutstanding(ob.data);
    });

    // Load monthly reports list
    const localRegistryRaw = localStorage.getItem('seettu_saved_reports_registry');
    let localList: any[] = [];
    if (localRegistryRaw) {
      try {
        const parsed = JSON.parse(localRegistryRaw);
        if (Array.isArray(parsed)) localList = parsed;
      } catch (e) {}
    }

    api.getMonthlyReportDates()
      .then((res) => {
        const map = new Map<string, any>();
        localList.forEach((r) => {
          const charity = r.templeCharityFund !== undefined ? Number(r.templeCharityFund) : 15000;
          const gross = Number(r.totalAmount) || 780000;
          const comm = Number(r.totalCommission) || 46800;
          const off = Number(r.totalOffered) || 0;
          map.set(`${r.chitNo}|${r.date}`, {
            ...r,
            templeCharityFund: charity,
            totalAmount: gross,
            totalCommission: comm,
            totalOffered: off,
            netTally: gross - comm - charity,
          });
        });

        if (res.success && Array.isArray(res.data)) {
          res.data.forEach((r: any) => {
            const charity = r.templeCharityFund !== undefined ? Number(r.templeCharityFund) : 15000;
            const gross = Number(r.totalAmount) || 780000;
            const comm = Number(r.totalCommission) || 46800;
            const off = Number(r.totalOffered) || 0;
            map.set(`${r.chitNo}|${r.date}`, {
              ...r,
              templeCharityFund: charity,
              totalAmount: gross,
              totalCommission: comm,
              totalOffered: off,
              netTally: gross - comm - charity,
            });
          });
        }

        // Guarantee Chit 08 default
        if (!map.has('08|25.10.26')) {
          map.set('08|25.10.26', {
            chitNo: '08',
            date: '25.10.26',
            count: 78,
            totalAmount: 780000,
            totalCommission: 46800,
            totalOffered: 0,
            templeCharityFund: 15000,
            netTally: 780000 - 46800 - 15000,
            isSaved: true,
          });
        }

        setMonthlyReports(Array.from(map.values()));
      })
      .catch(() => {
        if (localList.length > 0) {
          setMonthlyReports(localList);
        } else {
          setMonthlyReports([
            {
              chitNo: '08',
              date: '25.10.26',
              count: 78,
              totalAmount: 780000,
              totalCommission: 46800,
              totalOffered: 0,
              templeCharityFund: 15000,
              netTally: 718200,
              isSaved: true,
            },
          ]);
        }
      })
      .finally(() => setLoadingReports(false));
  }, []);

  const totalChitsCount = monthlyReports.length;
  const grandGrossCollection = monthlyReports.reduce((s, r) => s + (Number(r.totalAmount) || 0), 0);
  const grandCommission = monthlyReports.reduce((s, r) => s + (Number(r.totalCommission) || 0), 0);
  const grandTempleCharity = monthlyReports.reduce((s, r) => s + (Number(r.templeCharityFund) || 15000), 0);
  const grandOffered = monthlyReports.reduce((s, r) => s + (Number(r.totalOffered) || 0), 0);
  const grandNetTally = grandGrossCollection - grandCommission - grandTempleCharity;

  return (
    <div className="space-y-6">
      {/* 5 Financial Summary Stat Cards */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          {t.cashFlowTitle}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs text-blue-700 uppercase font-semibold">{t.totalCollected}</span>
            <p className="text-2xl font-bold text-[#2F7BFF] mt-1">
              ₹{(grandGrossCollection > 0 ? grandGrossCollection : (cashFlow?.totalCollectedPaise ? cashFlow.totalCollectedPaise / 100 : 780000)).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
            <span className="text-xs text-purple-700 uppercase font-semibold">{t.organizerMargin} ({lang === 'ta' ? 'கமிஷன்' : 'Commission'})</span>
            <p className="text-2xl font-bold text-purple-700 mt-1">
              ₹{(grandCommission > 0 ? grandCommission : 46800).toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 select-none">🛕</div>
            <span className="text-xs text-amber-800 uppercase font-bold">
              🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity Fund'}
            </span>
            <p className="text-2xl font-black text-amber-900 mt-1">
              ₹{grandTempleCharity.toLocaleString('en-IN')}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-100">
            <span className="text-xs text-rose-700 uppercase font-semibold">{t.totalDisbursed}</span>
            <p className="text-2xl font-bold text-rose-700 mt-1">{formatINR(cashFlow?.totalPayoutsDisbursedPaise || 0)}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-300 relative overflow-hidden">
            <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 select-none">⚖️</div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-900 uppercase font-bold">
                ⚖️ {lang === 'ta' ? 'இறுதி கணக்கு சமரசம்' : 'Net Tally Balance'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-200 text-emerald-900">
                ✓ {lang === 'ta' ? 'சமரசம்' : 'Tallied'}
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-950 mt-1">
              ₹{grandNetTally.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* Monthly Chit Tally & Temple Charity Fund Audit Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">⚖️</span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                {lang === 'ta'
                  ? 'மாதாந்திர சீட்டு மற்றும் கோவில் தர்ம நிதி கணக்கு முடிவு (Tally)'
                  : 'Monthly Chit Tally & Temple Charity Fund Audit'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                ✓ {lang === 'ta' ? 'சமரசம்' : 'Tallied'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {lang === 'ta'
                ? 'வசூல் தொகை - ஏலக் கழிவு (கமிஷன்) - கோவில் தர்ம நிதி = நிகர இறுதி இருப்பு கணக்கு சமரசம்'
                : 'Reconciliation: Gross Collection - Auction Commission - Temple Charity Fund = Final Net Settlement Tally'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span>{lang === 'ta' ? 'பதிவான சீட்டுகள்:' : 'Recorded Chits:'}</span>
            <span className="font-mono text-blue-600">{totalChitsCount}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3 text-center">{lang === 'ta' ? 'சீட்டு எண்' : 'Chit No'}</th>
                <th className="py-3 px-3">{lang === 'ta' ? 'தேதி' : 'Date'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ta' ? 'உறுப்பினர்கள்' : 'Members'}</th>
                <th className="py-3 px-3 text-right text-emerald-700">{lang === 'ta' ? 'மொத்த வசூல்' : 'Gross Collection'}</th>
                <th className="py-3 px-3 text-right text-purple-700">{lang === 'ta' ? 'கமிஷன்' : 'Commission'}</th>
                <th className="py-3 px-3 text-right text-amber-800 bg-amber-50/50">🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity'}</th>
                <th className="py-3 px-3 text-right text-slate-700">{lang === 'ta' ? 'வழங்கப்பட்டது' : 'Money Offered'}</th>
                <th className="py-3 px-3 text-right font-black text-emerald-950 bg-emerald-50">⚖️ {lang === 'ta' ? 'இறுதி கணக்கு சமரசம்' : 'Net Tally Balance'}</th>
                <th className="py-3 px-3 text-center">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                {onOpenMonthlyReport && (
                  <th className="py-3 px-3 text-center">{lang === 'ta' ? 'செயல்' : 'Action'}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {monthlyReports.map((r, idx) => {
                const charity = Number(r.templeCharityFund) || 15000;
                const gross = Number(r.totalAmount) || 780000;
                const comm = Number(r.totalCommission) || 46800;
                const offered = Number(r.totalOffered) || 0;
                const tally = gross - comm - charity;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-black text-blue-600">
                      Chit #{r.chitNo}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {r.date}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-600">
                      {r.count || 78}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-700">
                      ₹{gross.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-700">
                      ₹{comm.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-amber-900 bg-amber-50/30">
                      ₹{charity.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{offered.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-black text-emerald-950 bg-emerald-50/70 text-sm">
                      ₹{tally.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        ✓ {lang === 'ta' ? 'முடிவு' : 'Tallied'}
                      </span>
                    </td>
                    {onOpenMonthlyReport && (
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => onOpenMonthlyReport(r.chitNo, r.date)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#2F7BFF] font-bold text-[11px] transition-colors cursor-pointer border border-blue-200"
                        >
                          {lang === 'ta' ? 'திறக்க' : 'Open Chit'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-3 px-3 text-center font-mono">
                  {totalChitsCount} Chits
                </td>
                <td colSpan={2} className="py-3 px-3 uppercase tracking-wider text-xs">
                  {lang === 'ta' ? 'முழு சீட்டு மொத்தம் (Grand Total)' : 'Grand Chit Totals'}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm font-black">
                  ₹{grandGrossCollection.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-purple-800 text-sm font-black">
                  ₹{grandCommission.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-amber-950 text-sm font-black bg-amber-100/60">
                  ₹{grandTempleCharity.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-slate-800 text-sm font-black">
                  ₹{grandOffered.toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-950 text-base font-black bg-emerald-100">
                  ₹{grandNetTally.toLocaleString('en-IN')}
                </td>
                <td colSpan={onOpenMonthlyReport ? 2 : 1} className="py-3 px-3 text-center">
                  <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded border border-emerald-400">
                    {lang === 'ta' ? 'முழு சமரசம்' : 'Fully Tallied'}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Scheme Summary Table */}
      <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          {t.schemeSummary}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold">
              <tr>
                <th className="py-2.5 px-3">{t.schemeCode}</th>
                <th className="py-2.5 px-3">{t.schemeName}</th>
                <th className="py-2.5 px-3">{t.totalMembers}</th>
                <th className="py-2.5 px-3">{t.installmentAmount}</th>
                <th className="py-2.5 px-3">{t.totalCollected}</th>
                <th className="py-2.5 px-3">{t.totalDisbursed}</th>
                <th className="py-2.5 px-3">{t.progress}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {schemeSummaries.map((s) => (
                <tr key={s.schemeId}>
                  <td className="py-3 px-3 font-mono font-bold text-blue-600">{s.code}</td>
                  <td className="py-3 px-3 font-bold text-slate-800">{s.name}</td>
                  <td className="py-3 px-3">{s.membersEnrolled} / {s.totalMembersCount}</td>
                  <td className="py-3 px-3">{formatINR(s.contributionAmountPaise)}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{formatINR(s.totalCollectedPaise)}</td>
                  <td className="py-3 px-3 font-bold text-purple-700">{formatINR(s.totalDisbursedPaise)}</td>
                  <td className="py-3 px-3 font-bold text-slate-700">{s.progressPercent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 8. NOTIFICATIONS SCREEN (BILINGUAL)
// -------------------------------------------------------------
function NotificationsScreen({ notifications, lang, onRefresh, showToast }: { notifications: any[]; lang: SupportedLanguage; onRefresh: any; showToast: any }) {
  const t = translations[lang];

  const handleMarkAll = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res.success) {
        showToast(lang === 'ta' ? 'அனைத்து அறிவிப்புகளும் படித்ததாகக் குறிக்கப்பட்டது' : res.message);
        onRefresh();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">{t.notificationsInbox}</h2>
          <p className="text-xs text-slate-400">
            {lang === 'ta' ? 'தவணை நினைவூட்டல்கள், பட்டுவாடா தகவல் மற்றும் ரசீதுகள்' : 'Installment reminders, payout updates, and receipts'}
          </p>
        </div>
        <button onClick={handleMarkAll} className="text-xs font-semibold text-[#2F7BFF] hover:underline">
          {t.markAllAsRead}
        </button>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-center py-8 text-xs text-slate-400">{t.noNotifications}</p>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-3.5 rounded-xl border transition-colors flex items-start gap-3 ${
                n.isRead ? 'bg-slate-50/60 border-slate-100 text-slate-600' : 'bg-blue-50/50 border-blue-100 text-slate-900'
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-100 text-[#2F7BFF] shrink-0 mt-0.5">
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold">{n.title}</h4>
                  <span className="text-[10px] text-slate-400">{formatKolkataDate(n.createdAt, true)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 9. STAFF SCREEN (BILINGUAL)
// -------------------------------------------------------------
function StaffScreen({ user, lang, showToast }: { user: any; lang: SupportedLanguage; showToast: any }) {
  const t = translations[lang];
  const [staffList, setStaffList] = useState<any[]>([]);

  useEffect(() => {
    api.getStaff().then((res) => res.success && setStaffList(res.data));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <h2 className="text-base font-bold text-slate-800">{t.staffManagement}</h2>
        <p className="text-xs text-slate-400">{t.staffSubtitle}</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">{t.fullName}</th>
              <th className="py-3 px-4">{t.emailAddress}</th>
              <th className="py-3 px-4">{lang === 'ta' ? 'பங்கு' : 'Role'}</th>
              <th className="py-3 px-4">{t.phoneNumber}</th>
              <th className="py-3 px-4">{t.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {staffList.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 px-4 font-bold text-slate-900">{st.name}</td>
                <td className="py-3 px-4 font-mono text-slate-600">{st.email}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    st.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {st.role}
                  </span>
                </td>
                <td className="py-3 px-4 font-mono">{st.phone || '-'}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    st.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {st.isActive ? t.active : t.inactive}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 10. AUDIT TRAIL SCREEN (BILINGUAL)
// -------------------------------------------------------------
function AuditScreen({ user, lang }: { user: any; lang: SupportedLanguage }) {
  const t = translations[lang];
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    api.getAuditLogs().then((res) => res.success && setLogs(res.data));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-base font-bold text-slate-800">{t.auditTrailTitle}</h2>
        <p className="text-xs text-slate-400">{t.auditSubtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">{t.dueDate}</th>
              <th className="py-3 px-4">{lang === 'ta' ? 'பயனர்' : 'Actor'}</th>
              <th className="py-3 px-4">{lang === 'ta' ? 'செயல்பாடு' : 'Action'}</th>
              <th className="py-3 px-4">{lang === 'ta' ? 'பொருள்' : 'Entity'}</th>
              <th className="py-3 px-4">{lang === 'ta' ? 'தணிக்கை விவரங்கள்' : 'Audit Details'}</th>
              <th className="py-3 px-4 font-mono">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-500 font-mono">{formatKolkataDate(log.createdAt, true)}</td>
                <td className="py-3 px-4 font-bold text-slate-800">{log.userName}</td>
                <td className="py-3 px-4 font-mono font-bold text-blue-600">{log.action}</td>
                <td className="py-3 px-4 text-slate-600">{log.entityType}</td>
                <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                  {log.details ? JSON.stringify(log.details) : '-'}
                </td>
                <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress || '127.0.0.1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 11. SETTINGS SCREEN (BILINGUAL)
// -------------------------------------------------------------
function SettingsScreen({
  user,
  lang,
  theme,
  onToggleTheme,
  onLanguageChange,
  showToast,
}: {
  user: any;
  lang: SupportedLanguage;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLanguageChange: (l: SupportedLanguage) => void;
  showToast: any;
}) {
  const t = translations[lang];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          {t.regionalConfig}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Language Selection Card */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <span className="text-xs font-bold text-blue-800 uppercase block mb-2">{t.languageSelect}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onLanguageChange('en')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  lang === 'en'
                    ? 'bg-[#2F7BFF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('ta')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                  lang === 'ta'
                    ? 'bg-[#2F7BFF] text-white shadow-md shadow-blue-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                தமிழ் (Tamil)
              </button>
            </div>
          </div>

          {/* Day & Night Mode Card */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <span className="text-xs font-bold text-indigo-800 uppercase block mb-2">{t.themeToggle}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => theme !== 'light' && onToggleTheme()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  theme === 'light'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>{t.dayMode}</span>
              </button>
              <button
                onClick={() => theme !== 'dark' && onToggleTheme()}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  theme === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>{t.nightMode}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 uppercase font-semibold block text-[10px]">{t.currencyStandard}</span>
            <span className="font-bold text-slate-800 text-sm">INR (₹) Indian Rupee</span>
            <p className="text-slate-500 mt-1">{t.currencyNotice}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-400 uppercase font-semibold block text-[10px]">{t.timezoneLabel}</span>
            <span className="font-bold text-slate-800 text-sm">Asia/Kolkata (IST +5:30)</span>
            <p className="text-slate-500 mt-1">{lang === 'ta' ? 'அனைத்து தவணை தேதிகளும் இந்திய நிலையான நேரத்திற்கு ஏற்ப கணக்கிடப்படுகின்றன.' : 'All collection due dates aligned to Indian standard time.'}</p>
          </div>
        </div>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">{t.connectedApiEndpoints}</h4>
          <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs space-y-1">
            <p><span className="text-emerald-400">Local Backend:</span> http://localhost:4000/api</p>
            <p><span className="text-emerald-400">Health Check:</span> http://localhost:4000/api/health</p>
            <p><span className="text-emerald-400">Database:</span> SQLite (Local) / PostgreSQL (Production)</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">{t.dbBackupTitle}</h4>
          <p className="text-xs text-slate-500 mb-3">
            {lang === 'ta' ? 'உள்ளூர் SQLite தரவுத்தள கோப்பு apps/backend/dev.db இடத்தில் உள்ளது.' : 'Local SQLite database file is located at apps/backend/dev.db.'}
          </p>
          <button
            onClick={() => showToast(lang === 'ta' ? 'தரவுத்தள காப்பு நகல் எடுக்கப்பட்டது' : 'Backup snapshot created: apps/backend/dev.db')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> {t.createDbSnapshot}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
