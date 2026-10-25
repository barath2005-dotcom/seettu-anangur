import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { mobileApi, setMobileAuthToken, setCustomApiUrl, getApiUrl } from './src/api';
import {
  formatINR,
  formatKolkataDate,
  translations,
  SupportedLanguage,
  getNextPournami,
  getLunarMonthCalendar,
  getYearlyLunarSchedule,
} from '@seettu/shared';

export default function App() {
  const [lang, setLang] = useState<SupportedLanguage>('en');
  const t = translations[lang];
  const [isDark, setIsDark] = useState(false);
  const nextPournami = getNextPournami();
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const mobileCal = getLunarMonthCalendar(calYear, calMonth);

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Login form
  const [email, setEmail] = useState('admin@seettu.com');
  const [password, setPassword] = useState('admin123');

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Modals & subviews
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [showCollectModal, setShowCollectModal] = useState(false);
  const [apiUrlInput, setApiUrlInput] = useState(getApiUrl());

  // Collection form
  const [collectMemberId, setCollectMemberId] = useState('');
  const [collectSchemeId, setCollectSchemeId] = useState('');
  const [collectRound, setCollectRound] = useState('1');
  const [collectAmount, setCollectAmount] = useState('5000');
  const [collectMethod, setCollectMethod] = useState('UPI');

  const handleLogin = async (loginEmail?: string, loginPass?: string) => {
    const e = loginEmail || email;
    const p = loginPass || password;
    setLoading(true);
    try {
      const res = await mobileApi.login({ email: e, password: p });
      if (res.success) {
        setMobileAuthToken(res.data.accessToken);
        setUser(res.data.user);
        loadDashboard();
      }
    } catch (err: any) {
      Alert.alert(lang === 'ta' ? 'உள்நுழைவு தோல்வி' : 'Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setMobileAuthToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  const loadDashboard = async () => {
    try {
      const res = await mobileApi.getDashboard();
      if (res.success) setDashboardData(res.data);
    } catch (err: any) {
      console.warn('Dashboard load error:', err.message);
    }
  };

  const loadMembers = async () => {
    try {
      const res = await mobileApi.getMembers();
      if (res.success) setMembers(res.data);
    } catch (err) {
      console.warn('Members load error:', err);
    }
  };

  const loadSchemes = async () => {
    try {
      const res = await mobileApi.getSchemes();
      if (res.success) setSchemes(res.data);
    } catch (err) {
      console.warn('Schemes load error:', err);
    }
  };

  const loadPayments = async () => {
    try {
      const res = await mobileApi.getPayments();
      if (res.success) setPayments(res.data);
    } catch (err) {
      console.warn('Payments load error:', err);
    }
  };

  const loadPayouts = async () => {
    try {
      const res = await mobileApi.getPayouts();
      if (res.success) setPayouts(res.data);
    } catch (err) {
      console.warn('Payouts load error:', err);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await mobileApi.getNotifications();
      if (res.success) setNotifications(res.data);
    } catch (err) {
      console.warn('Notifications load error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      if (activeTab === 'dashboard') loadDashboard();
      if (activeTab === 'members') loadMembers();
      if (activeTab === 'schemes') loadSchemes();
      if (activeTab === 'history') loadPayments();
      if (activeTab === 'payouts') loadPayouts();
      if (activeTab === 'notifications') loadNotifications();
    }
  }, [user, activeTab]);

  const handleRecordCollection = async () => {
    if (!collectMemberId || !collectSchemeId) {
      Alert.alert(
        lang === 'ta' ? 'விவரங்களை நிரப்பவும்' : 'Validation Error',
        lang === 'ta' ? 'உறுப்பினர் மற்றும் சீட்டுத் திட்டத்தைத் தேர்வு செய்யவும்' : 'Please select member and scheme'
      );
      return;
    }

    try {
      const payload = {
        memberId: collectMemberId,
        schemeId: collectSchemeId,
        roundNumber: parseInt(collectRound, 10),
        amountReceivedPaise: parseInt(collectAmount, 10) * 100,
        paymentMethod: collectMethod,
        idempotencyKey: `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      };

      const res = await mobileApi.recordPayment(payload);
      if (res.success) {
        Alert.alert(
          lang === 'ta' ? 'கட்டணம் பெறப்பட்டது' : 'Payment Collected',
          `${t.receiptNumber}: ${res.data.receiptNumber}`
        );
        setShowCollectModal(false);
        setSelectedReceipt(res.data);
        loadDashboard();
      }
    } catch (err: any) {
      Alert.alert(lang === 'ta' ? 'பிழை' : 'Payment Error', err.message);
    }
  };

  // 1. LOGIN SCREEN WITH LANGUAGE TOGGLE
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.loginContent}>
          {/* Mobile Language & Theme Switcher */}
          <View style={styles.mobileLangRow}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'ta' && styles.langBtnActive]}
              onPress={() => setLang('ta')}
            >
              <Text style={[styles.langBtnText, lang === 'ta' && styles.langBtnTextActive]}>தமிழ்</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
              onPress={() => setIsDark(!isDark)}
            >
              <Text style={styles.langBtnText}>{isDark ? '☀️ Day' : '🌙 Night'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginHeader}>
            <Image
              source={require('./assets/logo.jpg')}
              style={styles.logoImage}
            />
            <Text style={styles.appTitle}>{t.appName}</Text>
            <Text style={styles.appSubtitle}>{t.tagline}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.inputLabel}>{t.emailAddress.toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@seettu.com"
            />

            <Text style={styles.inputLabel}>{t.password.toUpperCase()}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t.signInButton}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoDivider}>
              <Text style={styles.demoDividerText}>{t.quickDemoRoles.toUpperCase()}</Text>
            </View>

            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLogin('admin@seettu.com', 'admin123')}
              >
                <Text style={styles.demoBtnText}>{t.adminRole}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLogin('staff@seettu.com', 'staff123')}
              >
                <Text style={styles.demoBtnText}>{t.staffRole}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleLogin('member@seettu.com', 'member123')}
              >
                <Text style={styles.demoBtnText}>{t.memberRole}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.serverConfigCard}>
            <Text style={styles.serverConfigTitle}>API Host: {apiUrlInput}</Text>
            <Text style={styles.serverConfigHelp}>
              {lang === 'ta' ? 'உள்ளூர் Node.js API-யுடன் நேரலையாக இணைக்கப்பட்டுள்ளது' : 'Connects to your local Node.js server on port 4000'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Mobile Bar with Lang Toggle */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={require('./assets/logo.jpg')}
            style={styles.topBarLogo}
          />
          <View>
            <Text style={styles.topBarTitle}>{t.appName}</Text>
            <Text style={styles.topBarSubtitle}>
              {user.name} ({user.role})
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Quick Lang Toggle */}
          <TouchableOpacity
            style={styles.headerLangToggle}
            onPress={() => setLang(lang === 'en' ? 'ta' : 'en')}
          >
            <Text style={styles.headerLangText}>{lang === 'en' ? 'தமிழ்' : 'EN'}</Text>
          </TouchableOpacity>

          {/* Day / Night Toggle */}
          <TouchableOpacity
            style={styles.headerLangToggle}
            onPress={() => setIsDark(!isDark)}
          >
            <Text style={{ fontSize: 13 }}>{isDark ? '☀️' : '🌙'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setActiveTab('notifications')}
          >
            <Text style={styles.bellText}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Tab Screen Area */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2. DASHBOARD */}
        {activeTab === 'dashboard' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.dashboard.toUpperCase()}</Text>

            {/* Auspicious Chit Lunar Day Banner */}
            <TouchableOpacity
              style={styles.lunarBanner}
              onPress={() => setActiveTab('calendar')}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 26 }}>🌕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lunarBannerTitle}>
                    {lang === 'ta' ? 'அடுத்த சீட்டு நாள் (பௌர்ணமி):' : 'Next Chit Day (Pournami):'} {nextPournami.dateStr}
                  </Text>
                  <Text style={styles.lunarBannerSub}>
                    🎯 {t.chitDayBadge} • {lang === 'ta' ? 'மாதாந்திர குலுக்கல் நாள்' : 'Monthly Draw Day'}
                  </Text>
                </View>
                <Text style={{ color: '#d97706', fontWeight: 'bold', fontSize: 11 }}>📅 ➔</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.kpiLabel}>{t.totalCollected.toUpperCase()}</Text>
                <Text style={[styles.kpiValue, { color: '#2F7BFF' }]}>
                  {dashboardData ? formatINR(dashboardData.totalContributionsCollectedPaise) : '₹...'}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: '#fef3c7' }]}>
                <Text style={styles.kpiLabel}>{t.expectedThisMonth.toUpperCase()}</Text>
                <Text style={[styles.kpiValue, { color: '#d97706' }]}>
                  {dashboardData ? formatINR(dashboardData.contributionsExpectedThisMonthPaise) : '₹...'}
                </Text>
              </View>
            </View>

            <View style={styles.kpiRow}>
              <View style={[styles.kpiCard, { backgroundColor: '#fee2e2' }]}>
                <Text style={styles.kpiLabel}>{t.outstandingBalance.toUpperCase()}</Text>
                <Text style={[styles.kpiValue, { color: '#dc2626' }]}>
                  {dashboardData ? formatINR(dashboardData.outstandingContributionsPaise) : '₹...'}
                </Text>
              </View>
              <View style={[styles.kpiCard, { backgroundColor: '#f3e8ff' }]}>
                <Text style={styles.kpiLabel}>{t.totalPayouts.toUpperCase()}</Text>
                <Text style={[styles.kpiValue, { color: '#7c3aed' }]}>
                  {dashboardData ? formatINR(dashboardData.totalPayoutsRecordedPaise) : '₹...'}
                </Text>
              </View>
            </View>

            {user.role !== 'MEMBER' && (
              <TouchableOpacity
                style={styles.actionBanner}
                onPress={() => {
                  loadMembers();
                  loadSchemes();
                  setShowCollectModal(true);
                }}
              >
                <Text style={styles.actionBannerTitle}>⚡ {t.recordPayment}</Text>
                <Text style={styles.actionBannerDesc}>
                  {lang === 'ta' ? 'கள வசூல் செய்து உடனுக்குடன் டிஜிட்டல் ரசீது வழங்குக' : 'Collect installment & issue instant digital receipt'}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={[styles.sectionHeader, { marginTop: 20 }]}>{t.recentTransactions.toUpperCase()}</Text>
            {dashboardData?.recentTransactions?.map((tx: any) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.listRow}
                onPress={() => setSelectedReceipt(tx)}
              >
                <View>
                  <Text style={styles.listRowTitle}>{tx.memberName || tx.schemeName}</Text>
                  <Text style={styles.listRowSub}>{t.receiptNumber}: {tx.receiptNumber}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listRowAmount}>{formatINR(tx.amountReceivedPaise)}</Text>
                  <Text style={styles.listRowDate}>{formatKolkataDate(tx.paymentDate)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 3. MEMBERS */}
        {activeTab === 'members' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.memberDirectory.toUpperCase()}</Text>
            {members.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={styles.listRow}
                onPress={() => setSelectedMember(m)}
              >
                <View>
                  <Text style={styles.listRowTitle}>{m.fullName}</Text>
                  <Text style={styles.listRowSub}>ID: {m.memberNumber} • {m.phone}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.statusPill}>{m.status === 'ACTIVE' ? t.active : m.status}</Text>
                  <Text style={styles.listRowAmount}>{formatINR(m.totalContributedPaise || 0)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 5. SCHEMES */}
        {activeTab === 'schemes' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.schemesTitle.toUpperCase()}</Text>
            {schemes.map((s) => (
              <View key={s.id} style={styles.schemeCard}>
                <View style={styles.schemeCardHeader}>
                  <Text style={styles.schemeCode}>{s.code}</Text>
                  <Text style={styles.statusPill}>{s.status === 'ACTIVE' ? t.active : s.status}</Text>
                </View>
                <Text style={styles.schemeTitle}>{s.name}</Text>
                <Text style={styles.schemeSub}>
                  {s.schemeType === 'ROTATING_CHIT' ? t.rotatingChit : t.fixedSavings} • {s.totalInstallments} {lang === 'ta' ? 'தவணைகள்' : 'Installments'}
                </Text>
                <View style={styles.schemeFooter}>
                  <Text style={styles.schemeMetric}>
                    {t.installmentAmount}: <Text style={{ fontWeight: 'bold' }}>{formatINR(s.contributionAmountPaise)}</Text>
                  </Text>
                  <Text style={styles.schemeMetric}>
                    {t.totalPoolPerRound}: <Text style={{ fontWeight: 'bold' }}>{formatINR(s.totalPoolAmountPaise)}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 7. PAYMENT HISTORY */}
        {activeTab === 'history' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.paymentsLedger.toUpperCase()}</Text>
            {payments.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.listRow}
                onPress={() => setSelectedReceipt(p)}
              >
                <View>
                  <Text style={styles.listRowTitle}>{p.memberName}</Text>
                  <Text style={styles.listRowSub}>
                    {p.schemeName} • #{p.roundNumber}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.listRowAmount}>{formatINR(p.amountReceivedPaise)}</Text>
                  <Text style={styles.listRowSub}>{p.paymentMethod}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 8. PAYOUTS */}
        {activeTab === 'payouts' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.payoutsTitle.toUpperCase()}</Text>
            {payouts.map((po) => (
              <View key={po.id} style={styles.schemeCard}>
                <Text style={styles.schemeTitle}>{po.schemeName}</Text>
                <Text style={styles.schemeSub}>{t.recipient}: {po.recipientName} (#{po.roundNumber})</Text>
                <View style={styles.schemeFooter}>
                  <Text style={[styles.schemeMetric, { color: '#7c3aed', fontWeight: 'bold' }]}>
                    {t.netPayout}: {formatINR(po.netPayoutPaise)}
                  </Text>
                  <Text style={styles.statusPill}>{po.approvalStatus}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* 10. NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.notificationsInbox.toUpperCase()}</Text>
            {notifications.length === 0 ? (
              <Text style={{ textAlign: 'center', color: '#94a3b8', marginVertical: 20 }}>
                {t.noNotifications}
              </Text>
            ) : (
              notifications.map((n) => (
                <View key={n.id} style={styles.notificationCard}>
                  <Text style={styles.notifTitle}>{n.title}</Text>
                  <Text style={styles.notifMsg}>{n.message}</Text>
                  <Text style={styles.notifDate}>{formatKolkataDate(n.createdAt)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* 11. PROFILE & SETTINGS */}
        {activeTab === 'profile' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.settings.toUpperCase()}</Text>

            {/* Language card in profile */}
            <View style={styles.card}>
              <Text style={styles.inputLabel}>{t.languageSelect.toUpperCase()}</Text>
              <View style={styles.demoButtonsRow}>
                <TouchableOpacity
                  style={[styles.demoBtn, lang === 'en' && { backgroundColor: '#2F7BFF', borderColor: '#2F7BFF' }]}
                  onPress={() => setLang('en')}
                >
                  <Text style={[styles.demoBtnText, lang === 'en' && { color: '#fff' }]}>English</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.demoBtn, lang === 'ta' && { backgroundColor: '#2F7BFF', borderColor: '#2F7BFF' }]}
                  onPress={() => setLang('ta')}
                >
                  <Text style={[styles.demoBtnText, lang === 'ta' && { color: '#fff' }]}>தமிழ்</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 16 }]}>{lang === 'ta' ? 'பயனர் விவரம்' : 'USER PROFILE'}</Text>
            <View style={styles.card}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <Text style={styles.profileRole}>ROLE: {user.role}</Text>
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 16 }]}>{t.regionalConfig.toUpperCase()}</Text>
            <View style={styles.card}>
              <Text style={styles.infoRow}>{t.currencyStandard}: INR (₹)</Text>
              <Text style={styles.infoRow}>{t.timezoneLabel}: Asia/Kolkata (IST)</Text>
              <Text style={styles.infoRow}>{t.currencyNotice}</Text>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Text style={styles.logoutBtnText}>{t.signOut}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>{t.calendar.toUpperCase()}</Text>

            {/* Countdown Banner */}
            <View style={styles.lunarBanner}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 32 }}>🌕</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.lunarBannerTitle}>
                    {t.nextChitDay}: {nextPournami.dateStr}
                  </Text>
                  <Text style={[styles.lunarBannerSub, { color: '#b45309', fontWeight: 'bold' }]}>
                    {nextPournami.isToday ? (lang === 'ta' ? 'இன்று!' : 'Today!') : `${nextPournami.daysRemaining} ${t.daysRemaining}`}
                  </Text>
                  <Text style={styles.lunarBannerSub}>
                    🎯 {lang === 'ta' ? 'ஒவ்வொரு பௌர்ணமி நாளிலும் சீட்டு குலுக்கல் நடைபெறும்.' : 'Chit draw & collection occurs every Full Moon day.'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Month Navigator */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(calYear - 1);
                    } else {
                      setCalMonth(calMonth - 1);
                    }
                  }}
                  style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 }}
                >
                  <Text style={{ fontWeight: 'bold' }}>◀</Text>
                </TouchableOpacity>

                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#172033' }}>
                  {mobileCal.monthName} {calYear}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(calYear + 1);
                    } else {
                      setCalMonth(calMonth + 1);
                    }
                  }}
                  style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 }}
                >
                  <Text style={{ fontWeight: 'bold' }}>▶</Text>
                </TouchableOpacity>
              </View>

              {/* Lunar Highlights */}
              <View style={{ gap: 8, marginTop: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: '#fef3c7', borderRadius: 10, borderWidth: 1, borderColor: '#fde68a' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 22 }}>🌕</Text>
                    <View>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#92400e' }}>
                        {t.pournamiFullMoon}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#b45309', fontWeight: 'bold' }}>
                        🎯 {t.chitDayBadge}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#b45309' }}>
                    {mobileCal.pournamiDateStr || '-'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Yearly Schedule List */}
            <Text style={[styles.sectionHeader, { marginTop: 16 }]}>{t.yearlyLunarSchedule.toUpperCase()} ({calYear})</Text>
            {getYearlyLunarSchedule(calYear).map((m) => (
              <View key={m.monthIndex} style={[styles.card, { padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#172033' }}>{m.monthName}</Text>
                  <Text style={{ fontSize: 11, color: '#b45309', fontWeight: 'bold', marginTop: 2 }}>
                    🌕 {m.pournamiDateStr}
                  </Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, color: '#b45309', fontWeight: 'bold' }}>
                    {lang === 'ta' ? 'சீட்டு நாள்' : 'Chit Day'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Record Payment Modal */}
      {showCollectModal && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t.recordPayment}</Text>

              <Text style={styles.inputLabel}>{t.memberId.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                placeholder="Member ID (e.g. M-001)"
                value={collectMemberId}
                onChangeText={setCollectMemberId}
              />

              <Text style={styles.inputLabel}>{t.schemeCode.toUpperCase()}</Text>
              <TextInput
                style={styles.input}
                placeholder="Scheme Code (e.g. SCH-100K-01)"
                value={collectSchemeId}
                onChangeText={setCollectSchemeId}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t.roundNumber.toUpperCase()}</Text>
                  <TextInput
                    style={styles.input}
                    value={collectRound}
                    onChangeText={setCollectRound}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>{t.amountReceived.toUpperCase()} (₹)</Text>
                  <TextInput
                    style={styles.input}
                    value={collectAmount}
                    onChangeText={setCollectAmount}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#e2e8f0' }]}
                  onPress={() => setShowCollectModal(false)}
                >
                  <Text style={{ color: '#475569', fontWeight: 'bold' }}>{t.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, { backgroundColor: '#2F7BFF' }]}
                  onPress={handleRecordCollection}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t.recordAndGenerateReceipt}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Digital Receipt Modal */}
      {selectedReceipt && (
        <Modal visible={true} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={{ alignItems: 'center', marginBottom: 6 }}>
                <Image
                  source={require('./assets/logo.jpg')}
                  style={{ width: 48, height: 48, borderRadius: 24, marginBottom: 4 }}
                  resizeMode="cover"
                />
              </View>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#172033', textAlign: 'center' }}>
                {t.officialReceipt}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginVertical: 4 }}>
                {t.appName} • {t.appSubtitle}
              </Text>

              <View style={styles.receiptBox}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: '#2F7BFF', textAlign: 'center' }}>
                  {formatINR(selectedReceipt.amountReceivedPaise)}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', textAlign: 'center', marginTop: 2 }}>
                  {selectedReceipt.receiptNumber}
                </Text>
              </View>

              <Text style={styles.receiptRow}>{t.fullName}: {selectedReceipt.memberName || selectedReceipt.memberId}</Text>
              <Text style={styles.receiptRow}>{t.schemes}: {selectedReceipt.schemeName || selectedReceipt.schemeId}</Text>
              <Text style={styles.receiptRow}>{t.roundNumber}: #{selectedReceipt.roundNumber}</Text>
              <Text style={styles.receiptRow}>{t.paymentMethod}: {selectedReceipt.paymentMethod}</Text>
              <Text style={styles.receiptRow}>{t.dueDate}: {formatKolkataDate(selectedReceipt.paymentDate, true)}</Text>

              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#172033', marginTop: 15 }]}
                onPress={() => setSelectedReceipt(null)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{lang === 'ta' ? 'ரசீதை மூடுக' : 'Close Receipt'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* Bottom Mobile Tab Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={[styles.tabIcon, activeTab === 'dashboard' && styles.tabActive]}>📊</Text>
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.tabLabelActive]}>{t.dashboard}</Text>
        </TouchableOpacity>

        {user.role !== 'MEMBER' && (
          <TouchableOpacity
            style={styles.tabBtn}
            onPress={() => setActiveTab('members')}
          >
            <Text style={[styles.tabIcon, activeTab === 'members' && styles.tabActive]}>👥</Text>
            <Text style={[styles.tabLabel, activeTab === 'members' && styles.tabLabelActive]}>{t.members}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('schemes')}
        >
          <Text style={[styles.tabIcon, activeTab === 'schemes' && styles.tabActive]}>🪙</Text>
          <Text style={[styles.tabLabel, activeTab === 'schemes' && styles.tabLabelActive]}>{t.schemes}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('calendar')}
        >
          <Text style={[styles.tabIcon, activeTab === 'calendar' && styles.tabActive]}>📅</Text>
          <Text style={[styles.tabLabel, activeTab === 'calendar' && styles.tabLabelActive]}>{t.calendar}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabIcon, activeTab === 'history' && styles.tabActive]}>🧾</Text>
          <Text style={[styles.tabLabel, activeTab === 'history' && styles.tabLabelActive]}>{t.payments}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabIcon, activeTab === 'profile' && styles.tabActive]}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'profile' && styles.tabLabelActive]}>{t.settings}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  loginContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  mobileLangRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  langBtnActive: {
    backgroundColor: '#2F7BFF',
    borderColor: '#2F7BFF',
  },
  langBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  langBtnTextActive: {
    color: '#fff',
  },
  headerLangToggle: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  headerLangText: {
    color: '#2F7BFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  loginHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    marginBottom: 12,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#2F7BFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#172033',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    backgroundColor: '#fff',
  },
  primaryBtn: {
    backgroundColor: '#2F7BFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  demoDivider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  demoDividerText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  demoBtnText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: 'bold',
  },
  serverConfigCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  serverConfigTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#334155',
  },
  serverConfigHelp: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  topBarLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  topBarTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#172033',
    maxWidth: 220,
  },
  topBarSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  bellBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  bellText: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 4,
  },
  actionBanner: {
    backgroundColor: '#2F7BFF',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
  },
  lunarBanner: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fcd34d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  lunarBannerTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#92400e',
  },
  lunarBannerSub: {
    fontSize: 10,
    color: '#78350f',
    marginTop: 2,
  },
  actionBannerTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionBannerDesc: {
    color: '#dbeafe',
    fontSize: 11,
    marginTop: 2,
  },
  listRow: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  listRowTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#172033',
  },
  listRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  listRowAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
  },
  listRowDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusPill: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#047857',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  schemeCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  schemeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  schemeCode: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#2F7BFF',
  },
  schemeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#172033',
  },
  schemeSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  schemeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  schemeMetric: {
    fontSize: 11,
    color: '#475569',
  },
  notificationCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#172033',
  },
  notifMsg: {
    fontSize: 12,
    color: '#475569',
    marginTop: 3,
  },
  notifDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 6,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#172033',
  },
  profileEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  profileRole: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2F7BFF',
    marginTop: 6,
  },
  infoRow: {
    fontSize: 12,
    color: '#475569',
    marginVertical: 3,
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: 'bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingVertical: 8,
    paddingBottom: 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.6,
  },
  tabActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#2F7BFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#172033',
    marginBottom: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  receiptBox: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  receiptRow: {
    fontSize: 12,
    color: '#334155',
    marginVertical: 3,
  },
});
