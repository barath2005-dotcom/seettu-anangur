import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Save,
  Printer,
  Calendar,
  Layers,
  Coins,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  ShieldCheck,
  Trash2,
  Edit3,
  AlertTriangle,
  Eye,
  UserCheck,
} from 'lucide-react';
import { api } from '../services/api';
import {
  formatINR,
  SupportedLanguage,
  OFFICIAL_78_MEMBERS,
  getLunarMonthCalendar,
  getNextPournami,
} from '@seettu/shared';

interface MonthlyEntry {
  sno: number;
  sheetNumber: number;
  chitNo: string;
  date: string;
  memberNumber: string;
  memberName: string;
  amount: number;
  commission: number;
  moneyOffered?: number;
  templeCharityFund?: number;
  status: string;
  paymentMethod: string;
  notes?: string;
}

const SAVED_REGISTRY_KEY = 'seettu_saved_reports_registry';
const LAST_ACTIVE_CHIT_KEY = 'seettu_last_active_chit';

function parseChitDate(dateStr: string): { day: number; month: number; year: number } {
  const now = new Date();
  if (!dateStr) return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
  if (dateStr.includes('.')) {
    const parts = dateStr.split('.');
    const d = parseInt(parts[0], 10) || now.getDate();
    const m = (parseInt(parts[1], 10) || (now.getMonth() + 1)) - 1;
    let y = parseInt(parts[2], 10) || now.getFullYear();
    if (y < 100) y += 2000;
    return { day: d, month: m, year: y };
  }
  return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
}

function getDefaultEntries(chitNo: string, date: string): MonthlyEntry[] {
  return OFFICIAL_78_MEMBERS.map((m, idx) => ({
    sno: idx + 1,
    sheetNumber: Math.floor(idx / 13) + 1,
    chitNo,
    date,
    memberNumber: m.memberNumber,
    memberName: m.fullName,
    amount: 10000,
    commission: 600,
    moneyOffered: 0,
    templeCharityFund: 15600,
    status: 'PAID',
    paymentMethod: 'CASH',
    notes: '',
  }));
}

function getStoredSavedReports(): any[] {
  try {
    const raw = localStorage.getItem(SAVED_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [
    {
      chitNo: '08',
      date: '25.10.26',
      count: 78,
      totalAmount: 780000,
      totalCommission: 0,
      isSaved: true,
    },
  ];
}

export function MonthlyEntryScreen({
  user,
  lang,
  showToast,
  initialTarget,
}: {
  user: any;
  lang: SupportedLanguage;
  showToast: any;
  initialTarget?: { chitNo: string; date: string } | null;
}) {
  const getInitialChit = () => {
    if (initialTarget?.chitNo) return initialTarget.chitNo;
    try {
      const last = localStorage.getItem(LAST_ACTIVE_CHIT_KEY);
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed.chitNo) return parsed.chitNo;
      }
    } catch (e) {}
    return '08';
  };

  const getInitialDate = () => {
    if (initialTarget?.date) return initialTarget.date;
    try {
      const last = localStorage.getItem(LAST_ACTIVE_CHIT_KEY);
      if (last) {
        const parsed = JSON.parse(last);
        if (parsed.date) return parsed.date;
      }
    } catch (e) {}
    return '25.10.26';
  };

  const [chitNo, setChitNo] = useState<string>(getInitialChit);
  const [date, setDate] = useState<string>(getInitialDate);
  const [selectedSheet, setSelectedSheet] = useState<number | 'ALL'>('ALL');
  const [entries, setEntries] = useState<MonthlyEntry[]>(() => {
    const initChit = getInitialChit();
    const initDate = getInitialDate();
    const localKey = `seettu_monthly_report_${initChit}_${initDate}`;
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((e: any) => ({
            ...e,
            moneyOffered: (e.moneyOffered === 10000 || e.moneyOffered === 9916 || e.moneyOffered === undefined || e.moneyOffered === null) ? 0 : (Number(e.moneyOffered) || 0),
          }));
        }
      }
    } catch (e) {}
    return getDefaultEntries(initChit, initDate);
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [savedReportsList, setSavedReportsList] = useState<any[]>(getStoredSavedReports);
  const [templeCharityFund, setTempleCharityFund] = useState<number>(() => {
    const initChit = getInitialChit();
    const initDate = getInitialDate();
    try {
      const fundKey = `seettu_charity_fund_${initChit}_${initDate}`;
      const saved = localStorage.getItem(fundKey);
      if (saved) return Number(saved) || 15600;
    } catch (e) {}
    return 15600;
  });

  // Bulk edit state
  const [bulkCommission, setBulkCommission] = useState('');

  const isMember = user?.role?.toUpperCase() === 'MEMBER' || (user?.role !== 'ADMIN' && user?.role !== 'STAFF');
  const [adminPreviewMemberView, setAdminPreviewMemberView] = useState(false);
  const effectiveIsMember = isMember || adminPreviewMemberView;
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMemberSeat, setSelectedMemberSeat] = useState<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [showFullRoster, setShowFullRoster] = useState(false);

  // Mini Calendar Popover State
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);
  const calendarPickerRef = useRef<HTMLDivElement>(null);

  const initialDateParsed = parseChitDate(date);
  const [calYear, setCalYear] = useState(initialDateParsed.year);
  const [calMonth, setCalMonth] = useState(initialDateParsed.month);

  const toggleMiniCalendar = () => {
    if (!showMiniCalendar) {
      const p = parseChitDate(date);
      setCalYear(p.year);
      setCalMonth(p.month);
    }
    setShowMiniCalendar((prev) => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarPickerRef.current && !calendarPickerRef.current.contains(event.target as Node)) {
        setShowMiniCalendar(false);
      }
    }
    if (showMiniCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMiniCalendar]);

  const monthSummary = getLunarMonthCalendar(calYear, calMonth);
  const firstDayIndex = new Date(calYear, calMonth, 1).getDay(); // 0 = Sun
  const paddingArray = Array.from({ length: firstDayIndex }, (_, i) => i);
  const parsedCurrent = parseChitDate(date);

  const monthNamesTa = [
    'ஜனவரி', 'பிப்ரவரி', 'மார்ச்', 'ஏப்ரல்', 'மே', 'ஜூன்',
    'ஜூலை', 'ஆகஸ்ட்', 'செப்டம்பர்', 'அக்டோபர்', 'நவம்பர்', 'டிசம்பர்'
  ];
  const displayMonthName = lang === 'ta' ? monthNamesTa[calMonth] : monthSummary.monthName;
  const dayHeaders = lang === 'ta'
    ? ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const handleSelectDay = (day: number) => {
    const dd = String(day).padStart(2, '0');
    const mm = String(calMonth + 1).padStart(2, '0');
    const yy = String(calYear).slice(-2);
    const newDateStr = `${dd}.${mm}.${yy}`;

    const matched = savedReportsList.find((r) => r.date === newDateStr);
    const targetChit = matched ? matched.chitNo : chitNo;

    setDate(newDateStr);
    if (matched) {
      setChitNo(matched.chitNo);
    }
    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo: targetChit, date: newDateStr }));
    } catch (e) {}

    setShowMiniCalendar(false);
    loadReport(targetChit, newDateStr);
  };

  const selectChitByRecord = (c: string, d: string) => {
    setChitNo(c);
    setDate(d);
    const p = parseChitDate(d);
    setCalYear(p.year);
    setCalMonth(p.month);
    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo: c, date: d }));
    } catch (e) {}
    loadReport(c, d);
  };

  const handlePrevCalMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const newDateStr = `${dd}.${mm}.${yy}`;
    setDate(newDateStr);
    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo, date: newDateStr }));
    } catch (err) {}
    setShowMiniCalendar(false);
    loadReport(chitNo, newDateStr);
  };

  const handleJumpToNextPournami = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextP = getNextPournami(new Date());
    const dt = nextP.date;
    setCalYear(dt.getFullYear());
    setCalMonth(dt.getMonth());
    const dd = String(dt.getDate()).padStart(2, '0');
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const yy = String(dt.getFullYear()).slice(-2);
    const newDateStr = `${dd}.${mm}.${yy}`;
    setDate(newDateStr);
    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo, date: newDateStr }));
    } catch (err) {}
    setShowMiniCalendar(false);
    loadReport(chitNo, newDateStr);
  };

  // Identify member's own entry/seats accurately without false positives
  const memberSeats = entries.filter((e) => {
    if (!effectiveIsMember) return false;
    // 1. Exact Member Number match (guaranteed unique e.g. M-002)
    if (user?.member?.memberNumber && e.memberNumber === user.member.memberNumber) return true;
    if (user?.memberId && (e.memberNumber === user.memberId || e.memberNumber === user?.member?.memberNumber)) return true;

    // 2. Strict Name match (comparing unique primary name, avoiding common suffixes like B.L.R / S.R / ஆனங்கூர்)
    if (user?.name && e.memberName) {
      const uNorm = user.name.toLowerCase().replace(/[\s\.\-\/\(\)\d]+/g, '');
      const eNorm = e.memberName.toLowerCase().replace(/[\s\.\-\/\(\)\d]+/g, '');
      if (uNorm === eNorm) return true;

      const uEng = (user.name.split('/')[1] || '').trim().toLowerCase().split(' ')[0] || '';
      const eEng = (e.memberName.split('/')[1] || '').trim().toLowerCase().split(' ')[0] || '';
      if (uEng.length >= 4 && eEng.length >= 4 && uEng === eEng) return true;

      const uTam = (user.name.split('/')[0] || '').trim().toLowerCase().split(' ')[0] || '';
      const eTam = (e.memberName.split('/')[0] || '').trim().toLowerCase().split(' ')[0] || '';
      if (uTam.length >= 4 && eTam.length >= 4 && uTam === eTam) return true;
    }
    return false;
  });

  const activeSeatNumber = selectedMemberSeat !== null
    ? selectedMemberSeat
    : (memberSeats[0]?.sno || (isMember ? 1 : 1));

  const myEntry = entries.find((e) => e.sno === activeSeatNumber) || entries[0];

  const loadReport = (targetChit = chitNo, targetDate = date) => {
    setLoading(true);
    const localKey = `seettu_monthly_report_${targetChit}_${targetDate}`;
    const fundKey = `seettu_charity_fund_${targetChit}_${targetDate}`;
    try {
      const savedFund = localStorage.getItem(fundKey);
      if (savedFund) setTempleCharityFund(Number(savedFund) || 10000);
    } catch (e) {}

    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((e: any) => ({
            ...e,
            moneyOffered: (e.moneyOffered === 10000 || e.moneyOffered === 9916 || e.moneyOffered === undefined || e.moneyOffered === null) ? 0 : (Number(e.moneyOffered) || 0),
          }));
          setEntries(cleaned);
          setIsSaved(true);
          if (parsed[0]?.templeCharityFund !== undefined) {
            const rawFund = Number(parsed[0].templeCharityFund);
            setTempleCharityFund(rawFund === 10000 || !rawFund ? 15600 : rawFund);
          }
        }
      } catch (e) {}
    }

    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo: targetChit, date: targetDate }));
    } catch (e) {}

    api.getMonthlyReport({ chitNo: targetChit, date: targetDate })
      .then((res) => {
        if (res.success && res.data) {
          if (res.data.templeCharityFund !== undefined && res.data.templeCharityFund !== null) {
            const rawFund = Number(res.data.templeCharityFund);
            const fund = rawFund === 10000 || !rawFund ? 15600 : rawFund;
            setTempleCharityFund(fund);
            try {
              localStorage.setItem(fundKey, String(fund));
            } catch (e) {}
          }
          if (Array.isArray(res.data.entries) && res.data.entries.length > 0) {
            const cleaned = res.data.entries.map((e: any) => ({
              ...e,
              moneyOffered: (e.moneyOffered === 10000 || e.moneyOffered === 9916 || e.moneyOffered === undefined || e.moneyOffered === null) ? 0 : (Number(e.moneyOffered) || 0),
            }));
            setEntries(cleaned);
            setIsSaved(Boolean(res.data.isSaved));
            if (res.data.isSaved) {
              localStorage.setItem(localKey, JSON.stringify(cleaned));
            }
            if (res.data.entries[0]?.templeCharityFund !== undefined) {
              const rawFund = Number(res.data.entries[0].templeCharityFund);
              setTempleCharityFund(rawFund === 10000 || !rawFund ? 15600 : rawFund);
            }
          } else {
            const fallback = getDefaultEntries(targetChit, targetDate);
            setEntries(fallback);
            setIsSaved(false);
          }
        } else {
          setEntries(getDefaultEntries(targetChit, targetDate));
          setIsSaved(false);
        }
      })
      .catch((err) => {
        console.warn('Network error loading report, falling back to local/default:', err);
        const fallback = getDefaultEntries(targetChit, targetDate);
        setEntries(fallback);
        setIsSaved(false);
      })
      .finally(() => setLoading(false));
  };

  const handleDeleteReport = async () => {
    const confirmMsg =
      lang === 'ta'
        ? `சீட்டு எண் ${chitNo} (${date}) அறிக்கையை முழுமையாக நீக்க விரும்புகிறீர்களா? இந்த செயல்முறை திரும்பப் பெற முடியாது.`
        : `Are you sure you want to delete the monthly report for Chit ${chitNo} (${date})? This action cannot be undone.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      setLoading(true);
      await api.deleteMonthlyReport({ chitNo, date });

      const localKey = `seettu_monthly_report_${chitNo}_${date}`;
      const fundKey = `seettu_charity_fund_${chitNo}_${date}`;
      try {
        localStorage.removeItem(localKey);
        localStorage.removeItem(fundKey);
      } catch (e) {}

      const updated = savedReportsList.filter((r) => !(r.chitNo === chitNo && r.date === date));
      setSavedReportsList(updated);
      try {
        localStorage.setItem(SAVED_REGISTRY_KEY, JSON.stringify(updated));
      } catch (e) {}

      showToast(
        lang === 'ta'
          ? `சீட்டு எண் ${chitNo} (${date}) அறிக்கை வெற்றிகரமாக நீக்கப்பட்டது.`
          : `Monthly report for Chit ${chitNo} (${date}) deleted successfully.`
      );

      if (updated.length > 0) {
        setChitNo(updated[0].chitNo);
        setDate(updated[0].date);
        loadReport(updated[0].chitNo, updated[0].date);
      } else {
        setChitNo('08');
        setDate('25.10.26');
        loadReport('08', '25.10.26');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedDates = () => {
    const localList = getStoredSavedReports();
    setSavedReportsList(localList);

    api.getMonthlyReportDates()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map = new Map<string, any>();
          localList.forEach((r: any) => map.set(`${r.chitNo}|${r.date}`, r));
          res.data.forEach((r: any) => {
            map.set(`${r.chitNo}|${r.date}`, {
              ...r,
              isSaved: true,
            });
          });
          if (!map.has('08|25.10.26')) {
            map.set('08|25.10.26', {
              chitNo: '08',
              date: '25.10.26',
              count: 78,
              totalAmount: 780000,
              totalCommission: 0,
              isSaved: true,
            });
          }
          const merged = Array.from(map.values());
          setSavedReportsList(merged);
          try {
            localStorage.setItem(SAVED_REGISTRY_KEY, JSON.stringify(merged));
          } catch (e) {}
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    const targetChit = initialTarget?.chitNo || getInitialChit();
    const targetDate = initialTarget?.date || getInitialDate();
    setChitNo(targetChit);
    setDate(targetDate);
    loadReport(targetChit, targetDate);
    loadSavedDates();
  }, [initialTarget]);

  const handleFieldChange = (index: number, field: keyof MonthlyEntry, value: any) => {
    setEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const applyBulkCommission = () => {
    const val = Number(bulkCommission) || 0;
    setEntries((prev) =>
      prev.map((e) => {
        if (selectedSheet === 'ALL' || e.sheetNumber === selectedSheet) {
          return { ...e, commission: val };
        }
        return e;
      })
    );
    showToast(
      lang === 'ta'
        ? `அனைத்து உறுப்பினர்களுக்கும் கமிஷன் ₹${val} அமைக்கப்பட்டது`
        : `Applied ₹${val} commission to current view`
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const localKey = `seettu_monthly_report_${chitNo}_${date}`;
      const fundKey = `seettu_charity_fund_${chitNo}_${date}`;
      const totalAmount = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      const totalCommission = entries.reduce((s, e) => s + (Number(e.commission) || 0), 0);
      const totalOffered = entries.reduce((s, e) => s + (Number(e.moneyOffered) || 0), 0);

      // 1. Immediately persist locally so refresh will NEVER lose it
      const entriesToSave = entries.map((e) => ({ ...e, templeCharityFund }));
      localStorage.setItem(localKey, JSON.stringify(entriesToSave));
      localStorage.setItem(fundKey, String(templeCharityFund));
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo, date }));
      setIsSaved(true);

      // 2. Update saved reports registry locally
      const currentList = getStoredSavedReports();
      const map = new Map<string, any>();
      currentList.forEach((r: any) => map.set(`${r.chitNo}|${r.date}`, r));
      map.set(`${chitNo}|${date}`, {
        chitNo,
        date,
        count: entries.length,
        totalAmount,
        totalCommission,
        totalOffered,
        templeCharityFund,
        isSaved: true,
      });
      const updatedList = Array.from(map.values());
      setSavedReportsList(updatedList);
      try {
        localStorage.setItem(SAVED_REGISTRY_KEY, JSON.stringify(updatedList));
      } catch (e) {}

      // 3. Sync to backend API
      const res = await api.saveMonthlyReport({
        chitNo,
        date,
        entries: entriesToSave,
        templeCharityFund,
      });

      showToast(
        lang === 'ta'
          ? `சீட்டு எண் ${chitNo} (${date}) மாதாந்திர அறிக்கை வெற்றிகரமாகச் சேமிக்கப்பட்டது!`
          : (res?.message || `Monthly report for Chit ${chitNo} (${date}) saved successfully!`)
      );
      loadSavedDates();
    } catch (err: any) {
      showToast(
        lang === 'ta'
          ? `சீட்டு எண் ${chitNo} (${date}) உள்ளூர் நினைவகத்தில் பாதுகாப்பாகச் சேமிக்கப்பட்டது!`
          : `Saved locally for Chit ${chitNo} (${date})`
      );
      loadSavedDates();
    } finally {
      setSaving(false);
    }
  };

  // 1. Export as CSV (with UTF-8 BOM for Tamil Unicode compatibility)
  const exportCSV = () => {
    const headers = [
      'S.no',
      'Sheet',
      'Member Number',
      'Member Name (Tamil)',
      'Member Name (English)',
      'Amount (INR)',
      'Commission (INR)',
      'Money Offered (INR)',
      'Temple Charity Fund (INR)',
      'Payment Mode',
      'Status',
      'Date',
      'Chit No',
    ];

    const rows = entries.map((e) => {
      const parts = (e.memberName || '').split('/');
      const tamilName = (parts[0] || '').trim();
      const englishName = (parts[1] || '').trim();
      const offered = Number(e.moneyOffered) || 0;

      return [
        e.sno,
        `Sheet ${e.sheetNumber}`,
        `"${e.memberNumber || ''}"`,
        `"${tamilName.replace(/"/g, '""')}"`,
        `"${englishName.replace(/"/g, '""')}"`,
        e.amount,
        e.commission,
        offered,
        templeCharityFund,
        `"${e.paymentMethod}"`,
        `"${e.status}"`,
        `"${date}"`,
        `"${chitNo}"`,
      ];
    });

    const grandAmount = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const grandCommission = entries.reduce((s, e) => s + (Number(e.commission) || 0), 0);
    const grandOffered = entries.reduce((s, e) => s + (Number(e.moneyOffered) || 0), 0);
    const grandNetTally = grandAmount - grandCommission - templeCharityFund;

    const summaryRows = [
      '',
      `"--- OFFICIAL CHIT TALLY & SETTLEMENT SUMMARY ---",,,,,,,,,,,`,
      `"Gross Collection (INR)",,,,,${grandAmount},,,,,,`,
      `"Total Commission (INR)",,,,,,${grandCommission},,,,,`,
      `"Total Money Offered (INR)",,,,,,,${grandOffered},,,,`,
      `"Temple Charity Fund (INR)",,,,,,,,${templeCharityFund},,,`,
      `"Final Net Tally Settlement Balance (INR)",,,,,,,,,${grandNetTally},,`,
    ];

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(',')), ...summaryRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seettu-chit-${chitNo}-${date.replace(/\./g, '-')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(lang === 'ta' ? 'CSV அறிக்கை வெற்றிகரமாக பதிவிறக்கப்பட்டது!' : 'CSV Report downloaded successfully!');
  };

  // 2. Export as PDF (Exact 6 Sheets layout identical to the official Chit 08 PDF)
  const exportPDF = () => {
    const sheetsToExport = selectedSheet === 'ALL' ? [1, 2, 3, 4, 5, 6] : [Number(selectedSheet)];

    const grandTotalAmount = entries.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const grandTotalCommission = entries.reduce((s, e) => s + (Number(e.commission) || 0), 0);
    const grandNet = grandTotalAmount - grandTotalCommission;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>சீட்டு எண்: ${chitNo} - தேதி: ${date}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Tamil", Arial, sans-serif;
      color: #000;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .sheet-page {
      page-break-after: always;
      break-after: page;
      padding: 10px 0 20px 0;
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .sheet-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .header-table {
      width: 100%;
      margin-bottom: 18px;
      border: none;
    }
    .header-table td {
      border: none;
      padding: 4px 0;
      font-size: 15px;
      font-weight: 800;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.data-table th, table.data-table td {
      border: 1.5px solid #000;
      padding: 11px 14px;
      font-size: 14px;
    }
    table.data-table th {
      font-weight: 800;
      background-color: #fff;
      text-align: center;
    }
    .sno-cell {
      width: 8%;
      text-align: center;
      font-weight: bold;
      font-family: monospace;
      font-size: 14.5px;
    }
    .name-cell {
      width: 44%;
      font-weight: 700;
      padding-left: 14px;
      font-size: 14px;
    }
    .amount-cell {
      width: 16%;
      text-align: center;
      font-family: monospace;
      font-weight: bold;
      font-size: 14px;
    }
    .commission-cell {
      width: 16%;
      text-align: center;
      font-family: monospace;
      font-weight: bold;
      font-size: 14px;
    }
    .offered-cell {
      width: 16%;
      text-align: center;
      font-family: monospace;
      font-weight: bold;
      font-size: 14px;
    }
    .subtotal-row td {
      background-color: #fafafa;
      font-weight: 800;
    }
    .sheet-footer {
      display: flex;
      justify-content: space-between;
      font-size: 11.5px;
      color: #555;
      margin-top: 10px;
      border-top: 1px dashed #ccc;
      padding-top: 8px;
    }
    @media print {
      body { background: transparent; }
    }
  </style>
</head>
<body>
  ${sheetsToExport
    .map((sNum) => {
      const sheetEntries = entries
        .filter((e) => e.sheetNumber === sNum)
        .sort((a, b) => a.sno - b.sno);
      const sheetAmount = sheetEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const sheetCommission = sheetEntries.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);
      const sheetOffered = sheetEntries.reduce((sum, e) => sum + (Number(e.moneyOffered) || 0), 0);

      return `
      <div class="sheet-page">
        <div>
          <table class="header-table">
            <tr>
              <td style="text-align: left; width: 33%;">தேதி : <span style="font-family: monospace;">${date}</span></td>
              <td style="text-align: center; width: 34%; font-size: 13px; font-weight: 700; color: #333;">
                ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு
              </td>
              <td style="text-align: right; width: 33%;">சீட்டு எண் : <span style="font-family: monospace;">${chitNo}</span></td>
            </tr>
          </table>

          <table class="data-table">
            <thead>
              <tr>
                <th class="sno-cell">S.no</th>
                <th class="name-cell" style="text-align: left;">Sheet ${sNum}</th>
                <th class="amount-cell" style="text-align: center;">Amount</th>
                <th class="commission-cell" style="text-align: center;">Commission</th>
                <th class="offered-cell" style="text-align: center;">Money Offered</th>
              </tr>
            </thead>
            <tbody>
              ${sheetEntries
                .map((e, idx) => {
                  const sheetSno = e.sno || (sNum - 1) * 13 + idx + 1;
                  const tamilName = (e.memberName || '').split('/')[0].trim();
                  const rowOffered = Number(e.moneyOffered) || 0;
                  return `
                <tr>
                  <td class="sno-cell">${sheetSno}</td>
                  <td class="name-cell">${tamilName}</td>
                  <td class="amount-cell">${e.amount ? Number(e.amount).toLocaleString('en-IN') : '10000'}</td>
                  <td class="commission-cell">${e.commission ? Number(e.commission).toLocaleString('en-IN') : ''}</td>
                  <td class="offered-cell">${rowOffered.toLocaleString('en-IN')}</td>
                </tr>
              `;
                })
                .join('')}
              <tr class="subtotal-row">
                <td class="sno-cell"></td>
                <td class="name-cell" style="text-align: right; text-transform: uppercase;">Sheet ${sNum} Total:</td>
                <td class="amount-cell">₹${sheetAmount.toLocaleString('en-IN')}</td>
                <td class="commission-cell">${sheetCommission > 0 ? `₹${sheetCommission.toLocaleString('en-IN')}` : '-'}</td>
                <td class="offered-cell">₹${sheetOffered.toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="sheet-footer">
          <div>Sheet ${sNum} of 6 • ${sheetEntries.length} Members</div>
          <div>Subtotal: ₹${sheetAmount.toLocaleString('en-IN')} | Commission: ₹${sheetCommission.toLocaleString('en-IN')} | Offered: ₹${sheetOffered.toLocaleString('en-IN')} | 🛕 Charity: ₹${templeCharityFund.toLocaleString('en-IN')}</div>
        </div>
      </div>
      `;
    })
    .join('')}

    <div class="sheet-page" style="min-height: auto; page-break-before: always; break-before: page; padding: 20px 0;">
      <table class="header-table">
        <tr>
          <td style="text-align: left; width: 33%;">தேதி : <span style="font-family: monospace;">${date}</span></td>
          <td style="text-align: center; width: 34%; font-size: 14px; font-weight: 800; color: #000;">
            ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு<br />
            <span style="font-size: 12px; font-weight: bold; color: #444;">முழுமையான கணக்கு சமரசம் / Official Chit Tally Report</span>
          </td>
          <td style="text-align: right; width: 33%;">சீட்டு எண் : <span style="font-family: monospace;">${chitNo}</span></td>
        </tr>
      </table>

      <table class="data-table" style="margin-top: 20px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="padding: 12px; font-size: 14px; text-align: left;">விவரம் / Description</th>
            <th style="padding: 12px; font-size: 14px; text-align: center; width: 30%;">தொகை (INR)</th>
            <th style="padding: 12px; font-size: 14px; text-align: center; width: 30%;">நிலை / Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 12px; font-weight: 700;">1. மொத்த வசூல் தொகை (Gross Collection - ${entries.length} Members)</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-weight: 800; font-size: 15px; color: #047857;">₹${grandTotalAmount.toLocaleString('en-IN')}</td>
            <td style="padding: 12px; text-align: center; font-weight: 600; color: #047857;">✓ 100% வசூல்</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: 700;">2. மொத்த சீட்டு கமிஷன் கழிவு (Total Chit Commission)</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-weight: 800; font-size: 15px; color: #7e22ce;">- ₹${grandTotalCommission.toLocaleString('en-IN')}</td>
            <td style="padding: 12px; text-align: center; font-weight: 600; color: #7e22ce;">கமிஷன் கழிவு</td>
          </tr>
          <tr style="background-color: #fffbeb;">
            <td style="padding: 12px; font-weight: 700; color: #92400e;">3. 🛕 கோவில் தர்ம நிதி (Temple Charity Fund - Fixed ₹15,600)</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-weight: 800; font-size: 15px; color: #b45309;">- ₹${templeCharityFund.toLocaleString('en-IN')}</td>
            <td style="padding: 12px; text-align: center; font-weight: 700; color: #b45309;">🛕 நிலையானது (Fixed)</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: 700;">4. மொத்த வழங்கப்பட்ட தொகை (Total Money Offered - 6 Recipients)</td>
            <td style="padding: 12px; text-align: center; font-family: monospace; font-weight: 800; font-size: 15px;">₹${entries.reduce((s, e) => s + (Number(e.moneyOffered) || 0), 0).toLocaleString('en-IN')}</td>
            <td style="padding: 12px; text-align: center; font-weight: 600;">மாதம் 6 நபர்கள் (${entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6)</td>
          </tr>
          <tr style="background-color: #ecfdf5; border-top: 2.5px solid #047857;">
            <td style="padding: 14px; font-size: 15px; font-weight: 900; color: #064e3b; text-transform: uppercase;">
              மொத்த இருப்புத் தொகை (TOTAL BALANCE):
            </td>
            <td style="padding: 14px; text-align: center; font-family: monospace; font-weight: 900; font-size: 18px; color: #047857;">
              ₹${(grandTotalAmount - grandTotalCommission - templeCharityFund).toLocaleString('en-IN')}
            </td>
            <td style="padding: 14px; text-align: center; font-weight: 900; color: #047857; font-size: 14px;">
              ✓ சரிபார்க்கப்பட்டது (Verified)
            </td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 50px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 15px;">
        <div>நிர்வாகி கையொப்பம் (Admin Signature): _______________</div>
        <div>சரிபார்த்தவர் கையொப்பம் (Auditor / Checker): _______________</div>
      </div>
    </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 400);
    };
  </script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      showToast(lang === 'ta' ? 'PDF அச்சிடும் திரை திறக்கப்பட்டது! (Save as PDF தேர்வுசெய்க)' : 'PDF print preview opened! Choose "Save as PDF".');
    } else {
      window.print();
    }
  };

  // Filter entries by Sheet
  const displayedEntries =
    selectedSheet === 'ALL'
      ? entries
      : entries.filter((e) => e.sheetNumber === selectedSheet);

  // Totals
  const totalAmount = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalCommission = entries.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);
  const netPool = totalAmount - totalCommission;

  // DEDICATED READ-ONLY MEMBER MONTHLY STATEMENT VIEW (WITH INTEGRATED CALENDAR)
  if (effectiveIsMember) {
    const memberFilteredEntries = entries.filter((e) => {
      if (selectedSheet !== 'ALL' && e.sheetNumber !== selectedSheet) return false;
      if (!memberSearch) return true;
      const q = memberSearch.toLowerCase().trim();
      return (
        e.memberName.toLowerCase().includes(q) ||
        e.memberNumber.toLowerCase().includes(q) ||
        String(e.sno).includes(q)
      );
    });

    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Top Header: Official Statement Title & Export Actions */}
        <div className="bg-white dark:bg-[#101A2E] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {lang === 'ta' ? 'அதிகாரப்பூர்வ மாதாந்திர சீட்டு அறிக்கை' : 'Official Monthly Chit Statement'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border flex items-center gap-1 shadow-2xs ${
                isSaved
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isSaved
                  ? (lang === 'ta' ? 'சரிபார்க்கப்பட்ட அறிக்கை' : 'Verified Report')
                  : (lang === 'ta' ? 'திட்டமிடப்பட்ட வரைவு' : 'Scheduled Draft')}
              </span>
              {adminPreviewMemberView && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-300">
                  👁️ {lang === 'ta' ? 'உறுப்பினர் பார்வை மாதிரி' : 'Admin Preview'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {lang === 'ta'
                ? 'நாட்காட்டியில் தேதியைத் தேர்ந்தெடுத்து உங்கள் மாதாந்திர சீட்டு அறிக்கையைக் காண்க.'
                : 'Select any date or chit on the calendar to view your official monthly statement and passbook.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {adminPreviewMemberView && (
              <button
                type="button"
                onClick={() => setAdminPreviewMemberView(false)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>⬅️ {lang === 'ta' ? 'நிர்வாகப் பதிவேடு' : 'Back to Admin Worksheet'}</span>
              </button>
            )}

            <button
              onClick={() => loadReport(chitNo, date)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              title={lang === 'ta' ? 'புதுப்பி' : 'Refresh'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            {/* Export PDF */}
            <button
              onClick={exportPDF}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Two-Column Responsive Layout: Interactive Calendar on Left, Selected Date Report on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: Integrated Interactive Calendar (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-[#101A2E] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-blue-900/40 shadow-sm space-y-4">
              {/* Calendar Month Header & Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {displayMonthName} {calYear}
                    </h3>
                    {monthSummary.pournamiDay && (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        🌕 {lang === 'ta' ? `பௌர்ணமி: ${monthSummary.pournamiDay}` : `Pournami Day: ${monthSummary.pournamiDay}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevCalMonth}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextCalMonth}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Day Headers (Su, Mo, Tu, We, Th, Fr, Sa) */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {dayHeaders.map((dh, i) => (
                  <span
                    key={i}
                    className={`text-[11px] font-black py-0.5 ${
                      i === 0 ? 'text-rose-500' : 'text-slate-400'
                    }`}
                  >
                    {dh}
                  </span>
                ))}
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {paddingArray.map((_, i) => (
                  <div key={`pad-${i}`} className="h-9 w-full" />
                ))}

                {monthSummary.days.map((d) => {
                  const isSelected =
                    parsedCurrent.day === d.day &&
                    parsedCurrent.month === calMonth &&
                    parsedCurrent.year === calYear;

                  const ddStr = String(d.day).padStart(2, '0');
                  const mmStr = String(calMonth + 1).padStart(2, '0');
                  const yyStr = String(calYear).slice(-2);
                  const fullDateStr = `${ddStr}.${mmStr}.${yyStr}`;
                  const hasRecordedChit = savedReportsList.some((r) => r.date === fullDateStr);

                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => handleSelectDay(d.day)}
                      className={`h-9 w-full rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1D68FE] text-white font-black shadow-md shadow-blue-500/30 scale-105 z-10'
                          : d.isPournami
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-black hover:bg-amber-200'
                          : hasRecordedChit
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-[#1D68FE] dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-extrabold hover:bg-blue-100'
                          : d.isToday
                          ? 'bg-slate-100 dark:bg-slate-800 text-[#1D68FE] font-bold border border-slate-300 dark:border-slate-700'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                      }`}
                      title={
                        hasRecordedChit
                          ? `Chit Date (${fullDateStr})`
                          : d.isPournami
                          ? `Pournami Day (${fullDateStr})`
                          : fullDateStr
                      }
                    >
                      <span className="leading-none">{d.day}</span>
                      {d.isPournami && !isSelected && (
                        <span className="text-[9px] leading-none mt-0.5">🌕</span>
                      )}
                      {hasRecordedChit && !d.isPournami && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1D68FE] mt-0.5"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump Shortcuts */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-500">
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#1D68FE] font-bold transition-colors cursor-pointer"
                >
                  {lang === 'ta' ? 'இன்று' : 'Today'}
                </button>
                <button
                  type="button"
                  onClick={handleJumpToNextPournami}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold border border-amber-200 dark:border-amber-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>🌕</span>
                  <span>{lang === 'ta' ? 'அடுத்த சீட்டு' : 'Next Pournami'}</span>
                </button>
              </div>

              {/* Saved Chit Reports List (Click to jump directly) */}
              {savedReportsList.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    {lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட சீட்டு தவணைகள்' : 'Official Recorded Chits'}
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {savedReportsList.map((r, i) => {
                      const isActive = r.chitNo === chitNo && r.date === date;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => selectChitByRecord(r.chitNo, r.date)}
                          className={`w-full p-2.5 rounded-xl border text-xs text-left transition-all flex items-center justify-between cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-[#1D68FE] text-slate-900 dark:text-white shadow-xs font-bold'
                              : 'bg-slate-50 dark:bg-[#0B1424] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🌕</span>
                            <div>
                              <span className="font-mono font-bold block">
                                Chit {r.chitNo} ({r.date})
                              </span>
                              <span className="text-[10px] text-slate-400">
                                78 Members • ₹{(r.totalAmount || 780000).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#1D68FE] text-white">
                              {lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்டது' : 'Active'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Selected Date Report & Passbook (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Selected Date Header Pill & Member/Seat Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101A2E] px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">{lang === 'ta' ? 'தேர்ந்தெடுக்கப்பட்ட தேதி:' : 'Selected Date:'}</span>
                <span className="text-xs font-mono font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  {date}
                </span>
                <span className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
                  Chit {chitNo}
                </span>
              </div>

              {/* Quick Member / Seat Picker: Allows viewing any seat statement */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 whitespace-nowrap flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                  <span>{lang === 'ta' ? 'உறுப்பினர்:' : 'Seat / Member:'}</span>
                </span>
                <select
                  value={activeSeatNumber}
                  onChange={(e) => setSelectedMemberSeat(Number(e.target.value))}
                  className="bg-slate-50 dark:bg-[#0B1424] border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white rounded-xl px-2.5 py-1 max-w-[200px] sm:max-w-[230px] truncate focus:ring-2 focus:ring-[#1D68FE] cursor-pointer"
                >
                  {entries.map((e) => (
                    <option key={e.sno} value={e.sno}>
                      #{e.sno} {e.memberName.split('/')[0].trim()} ({e.memberNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Member Personalized Hero Card (Passbook Statement) */}
            {myEntry && (
              <div className="bg-gradient-to-br from-[#06182C] via-[#0A2647] to-[#0D3B54] text-white p-5 sm:p-6 rounded-3xl border border-blue-500/30 shadow-xl relative overflow-hidden">
                <div className="absolute -right-8 -bottom-8 text-8xl opacity-10 select-none pointer-events-none">🛕</div>
                <div className="relative z-10">
                  {/* Multiple Seats Switcher Tabs (e.g. for members holding 2 seats like Mayilsamy or Kannan) */}
                  {memberSeats.length > 1 && (
                    <div className="flex flex-wrap items-center gap-2 mb-3 bg-white/10 p-2 rounded-2xl border border-white/20">
                      <span className="text-xs font-black text-amber-300 px-1">
                        ⭐ {lang === 'ta' ? 'உங்களின் பல சீட்டுகள்:' : 'Your Multiple Seats:'}
                      </span>
                      {memberSeats.map((ms) => (
                        <button
                          key={ms.sno}
                          type="button"
                          onClick={() => setSelectedMemberSeat(ms.sno)}
                          className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            activeSeatNumber === ms.sno
                              ? 'bg-amber-400 text-slate-900 shadow-md scale-105'
                              : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          Seat #{ms.sno} ({ms.memberNumber})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Card Header: Category & Seat Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-blue-400/20">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                        {lang === 'ta' ? 'உங்களின் மாதாந்திர சீட்டு கணக்கு விவரம்' : 'Your Monthly Chit Standing & Passbook'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(Number(myEntry.moneyOffered) || 0) > 0 ? (
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-md flex items-center gap-1">
                          🏆 {lang === 'ta' ? 'இந்த மாதம் சீட்டு பெற்றவர் (1 of 6)' : 'Monthly Recipient (1 of 6)'}
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                          {lang === 'ta' ? 'மாத முதலீட்டாளர்' : 'Monthly Investor'}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                        {myEntry.memberNumber}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Seat #{myEntry.sno}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20">
                        Sheet {myEntry.sheetNumber}
                      </span>
                    </div>
                  </div>

                  {/* Member Name & Chit Date (Full Width) */}
                  <div className="mt-4">
                    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {myEntry.memberName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-blue-200/80 font-medium">
                      <span>{lang === 'ta' ? `சீட்டு எண்: ${chitNo}` : `Chit Scheme No: ${chitNo}`}</span>
                      <span>•</span>
                      <span>{lang === 'ta' ? `தவணைத் தேதி: ${date}` : `Draw Date: ${date}`}</span>
                    </div>
                  </div>

                  {/* 4 Stat Boxes (Full Width 4-column Grid with Generous Padding) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
                    {/* Box 1: Installment Due */}
                    <div className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-300 block mb-1 whitespace-nowrap">
                        {lang === 'ta' ? 'தவணை முதலீடு' : 'Installment Due'}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-white font-mono whitespace-nowrap">
                        ₹{Number(myEntry.amount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Box 2: Money Offered / Payout Received */}
                    <div className={`p-3.5 rounded-2xl backdrop-blur-md border flex flex-col justify-between ${
                      (Number(myEntry.moneyOffered) || 0) > 0 
                        ? 'bg-gradient-to-br from-amber-500/30 to-emerald-600/30 border-amber-400/50 ring-2 ring-amber-400/30' 
                        : 'bg-black/40 border-white/10'
                    }`}>
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-300 block mb-1 whitespace-nowrap">
                        {(Number(myEntry.moneyOffered) || 0) > 0
                          ? (lang === 'ta' ? '🏆 பணம் பெற்றது (1 of 6)' : '🏆 Payout (1 of 6)')
                          : (lang === 'ta' ? 'சீட்டு பணம் பெற்றது' : 'Money Offered (Payout)')}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-emerald-300 font-mono whitespace-nowrap">
                        ₹{(Number(myEntry.moneyOffered) || 0).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[9px] text-slate-400 mt-1 font-medium">
                        {(Number(myEntry.moneyOffered) || 0) > 0
                          ? (lang === 'ta' ? '🎉 இந்த மாதம் சீட்டு பெற்றவர்' : '🎉 Monthly Chit Recipient')
                          : (lang === 'ta' ? 'மாதம் 6 நபர்கள் பெறுவர்' : '6 recipients per month')}
                      </span>
                    </div>

                    {/* Box 3: Commission */}
                    <div className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-300 block mb-1 whitespace-nowrap">
                        {lang === 'ta' ? 'கமிஷன்' : 'Commission'}
                      </span>
                      <span className="text-lg sm:text-xl font-black text-purple-300 font-mono whitespace-nowrap">
                        ₹{Number(myEntry.commission || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    {/* Box 4: Status */}
                    <div className="p-3.5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex flex-col justify-between">
                      <span className="text-[10px] sm:text-[11px] uppercase font-bold text-slate-300 block mb-1 whitespace-nowrap">
                        {lang === 'ta' ? 'செலுத்தல் நிலை' : 'Status'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-xl border border-emerald-400/30 w-fit">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{myEntry.status === 'PAID' ? (lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid') : myEntry.status}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Official Chit Scheme Summary Stat Cards for Selected Date */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-[#101A2E] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'ta' ? 'மொத்த முதலீட்டாளர்கள்' : 'Total Investors'}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono block">
                  {entries.length} {lang === 'ta' ? 'உறுப்பினர்கள் (6 தாள்கள்)' : 'Members (6 Sheets)'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {lang === 'ta' ? `பணம் பெற்றவர்கள்: ${entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6` : `Recipients: ${entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6`}
                </span>
              </div>

              <div className="bg-white dark:bg-[#101A2E] p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {lang === 'ta' ? 'மொத்த வசூல்' : 'Total Collected'}
                </span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">₹10,000 × 78</span>
              </div>

              <div className="bg-white dark:bg-[#101A2E] p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm bg-gradient-to-br from-white to-amber-50/30 dark:from-[#101A2E] dark:to-amber-950/20">
                <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                  🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity (Fixed)'}
                </span>
                <span className="text-lg font-black text-amber-800 dark:text-amber-300 font-mono block">
                  ₹{Number(templeCharityFund).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                  {lang === 'ta' ? 'நிலையான தர்ம நிதி' : 'Fixed Charity'}
                </span>
              </div>

              <div className="bg-white dark:bg-[#101A2E] p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-sm bg-gradient-to-br from-white to-emerald-50/50 dark:from-[#101A2E] dark:to-emerald-950/30">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block mb-1">
                  💰 {lang === 'ta' ? 'மொத்த இருப்பு' : 'Total Balance'}
                </span>
                <span className="text-lg font-black text-emerald-950 dark:text-emerald-200 font-mono block">
                  ₹{(totalAmount - totalCommission - templeCharityFund).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                  ₹7,80,000 - கமிஷன் - ₹15,600
                </span>
              </div>
            </div>

            {/* Business Logic Explanation Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-blue-950/30 dark:via-indigo-950/30 dark:to-emerald-950/30 border border-blue-200/80 dark:border-blue-900/40 flex items-start gap-3 text-xs">
              <span className="text-lg shrink-0">ℹ️</span>
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white">
                  {lang === 'ta' 
                    ? 'மாதாந்திர சீட்டு முறை விளக்கம் (Chit Scheme System):' 
                    : 'Monthly Chit Scheme Structure:'}
                </div>
                <div className="leading-relaxed">
                  {lang === 'ta'
                    ? `மொத்தம் 78 உறுப்பினர்கள் மாதம் தலா ₹10,000 முதலீடு செய்கின்றனர் (மொத்த வசூல் ₹7,80,000). இதில் கோவில் தர்ம நிதி ₹15,600 நிலையானது. ஒவ்வொரு மாதமும் முதலீடு செய்த 78 பேரில் 6 உறுப்பினர்களுக்கு சீட்டு தொகை (Money Offered) பகிர்ந்து வழங்கப்படுகிறது. (இந்த மாதம் பணம் பெற்றவர்கள்: ${entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6 உறுப்பினர்கள்).`
                    : `All 78 members invest ₹10,000 monthly (Gross ₹7,80,000). Temple charity is fixed at ₹15,600. Every month, among all 78 investing members, exactly 6 members receive the chit payout (Money Offered). (Recipients allocated: ${entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6 members).`}
                </div>
              </div>
            </div>

            {/* Direct Action Buttons for Selected Date */}
            <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#101A2E] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <button
                onClick={exportPDF}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1D68FE] hover:bg-blue-600 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'ta' ? 'அதிகாரப்பூர்வ அறிக்கை (PDF)' : 'Download Official PDF Statement'}</span>
              </button>

              <button
                onClick={exportCSV}
                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Official Committee Verification Seal Box */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-xl shrink-0">
                🛡️
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                  {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் சீட்டு நிர்வாக தணிக்கை சான்றிதழ்' : 'Official Committee Audit & Verification Certificate'}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'ta'
                    ? '78 உறுப்பினர்களின் பங்களிப்புகள் சரிபார்க்கப்பட்டு, கோவில் தர்ம நிதி ₹15,600 முறையாக ஒதுக்கப்பட்டுள்ளது.'
                    : 'All 78 seats verified, audited, and temple charity fund of ₹15,600 allocated to Sri Pattanathu Mariamman.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Optional Collapsible 78-Member Roster (Closed by default so it never clutters the screen) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowFullRoster((prev) => !prev)}
            className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-[#101A2E] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>👥</span>
              <span>
                {lang === 'ta'
                  ? '78 உறுப்பினர்களின் முழு பட்டியல் (விரும்பினால் மட்டும் காண்க)'
                  : 'View Full 78 Seats Scheme Roster (Optional)'}
              </span>
            </span>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
              {showFullRoster ? '▲ Hide' : '▼ Expand'}
            </span>
          </button>

          {showFullRoster && (
            <div className="mt-4 space-y-4 animate-in fade-in duration-200">
              {/* Sheet Tabs & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#101A2E] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setSelectedSheet('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedSheet === 'ALL'
                        ? 'bg-[#1D68FE] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {lang === 'ta' ? 'அனைத்தும் (1-78)' : 'All (1-78)'}
                  </button>
                  {[1, 2, 3, 4, 5, 6].map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSheet(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedSheet === s
                          ? 'bg-[#1D68FE] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      } ${myEntry?.sheetNumber === s ? 'ring-2 ring-emerald-500 font-black' : ''}`}
                    >
                      Sheet {s} ({(s - 1) * 13 + 1}-{s * 13})
                      {myEntry?.sheetNumber === s && ' ⭐'}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={lang === 'ta' ? 'உறுப்பினர் பெயர் தேடுக...' : 'Search member or seat #...'}
                    className="w-full px-3 py-1.5 pl-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
                </div>
              </div>

              {/* Roster Table */}
              <div className="bg-white dark:bg-[#101A2E] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 dark:bg-[#0C1523] text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="py-3 px-4 w-16 text-center border-r border-slate-200 dark:border-slate-800">S.no</th>
                        <th className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">{lang === 'ta' ? 'உறுப்பினர் பெயர்' : 'Member Name'}</th>
                        <th className="py-3 px-4 w-28 text-center border-r border-slate-200 dark:border-slate-800">{lang === 'ta' ? 'தவணைத் தொகை' : 'Installment'}</th>
                        <th className="py-3 px-4 w-28 text-center border-r border-slate-200 dark:border-slate-800">{lang === 'ta' ? 'கமிஷன்' : 'Commission'}</th>
                        <th className="py-3 px-4 w-32 text-center border-r border-slate-200 dark:border-slate-800">{lang === 'ta' ? 'வழங்கப்பட்டது' : 'Money Offered'}</th>
                        <th className="py-3 px-4 w-28 text-center border-r border-slate-200 dark:border-slate-800">{lang === 'ta' ? 'செலுத்தல் முறை' : 'Payment Mode'}</th>
                        <th className="py-3 px-4 w-28 text-center">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {memberFilteredEntries.map((e) => {
                        const isMyRow = Boolean(myEntry && e.sno === myEntry.sno);
                        return (
                          <tr
                            key={e.sno}
                            className={`transition-colors ${
                              isMyRow
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 ring-2 ring-emerald-500 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                            }`}
                          >
                            <td className={`py-3 px-4 text-center font-mono font-bold border-r border-slate-200 dark:border-slate-800 ${
                              isMyRow ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-950 dark:text-emerald-200 font-black' : 'text-slate-800 dark:text-slate-300'
                            }`}>
                              {e.sno}
                            </td>
                            <td className="py-3 px-4 border-r border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{e.memberName}</span>
                                {isMyRow && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase">
                                    ⭐ {lang === 'ta' ? 'நீங்கள்' : 'You'}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-400">{e.memberNumber} • Sheet {e.sheetNumber}</span>
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-200 border-r border-slate-200 dark:border-slate-800">
                              ₹{Number(e.amount).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-purple-700 dark:text-purple-400 border-r border-slate-200 dark:border-slate-800">
                              {e.commission ? `₹${Number(e.commission).toLocaleString('en-IN')}` : '-'}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400 border-r border-slate-200 dark:border-slate-800">
                              ₹{(Number(e.moneyOffered) || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4 text-center text-xs font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                              {e.paymentMethod === 'CASH' ? '💵 Cash' : e.paymentMethod === 'UPI' ? '📱 UPI' : e.paymentMethod || '💵 Cash'}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-bold ${
                                e.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}>
                                {e.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ADMIN / STAFF DATA-ENTRY WORKSHEET VIEW
  return (
    <div className="space-y-6">
      {/* Top Header & Chit / Date Selector */}
      <div className="bg-white dark:bg-[#101A2E] p-5 rounded-2xl border border-slate-200 dark:border-blue-900/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {isMember
                ? (lang === 'ta' ? 'அதிகாரப்பூர்வ மாதாந்திர சீட்டு அறிக்கை' : 'Official Monthly Chit Report')
                : (lang === 'ta' ? 'மாதாந்திர அறிக்கை பதிவு (நிர்வாகம்)' : 'Monthly Report Entry (Admin)')}
            </h2>
            {!isMember ? (
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isSaved
                  ? lang === 'ta' ? 'சேமிக்கப்பட்டது' : 'Saved'
                  : lang === 'ta' ? 'சேமிக்கப்படவில்லை' : 'Draft / Unsaved'}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                {lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட அறிக்கை' : 'Verified Report'}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isMember
              ? (lang === 'ta'
                  ? '78 உறுப்பினர்களின் தவணை வசூல் மற்றும் கமிஷன் விவரங்கள் (பார்வைக்கு மட்டும்).'
                  : 'Monthly collection statement & member contributions across 78 seats (Read-Only).')
              : (lang === 'ta'
                  ? 'தேதி, சீட்டு எண், உறுப்பினர் தொகை மற்றும் கமிஷன் விவரங்கள்.'
                  : 'Official monthly collections, member contributions, and commissions per Chit & Date.')}
          </p>
        </div>

        {/* Date, Chit No & Export / Save Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {savedReportsList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0B1424] px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-500 uppercase">
                {lang === 'ta' ? 'அறிக்கை:' : 'Chit:'}
              </span>
              <select
                value={`${chitNo}|${date}`}
                onChange={(e) => {
                  const [c, d] = e.target.value.split('|');
                  setChitNo(c);
                  setDate(d);
                  try {
                    localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo: c, date: d }));
                  } catch (err) {}
                  loadReport(c, d);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-[#2F7BFF]"
              >
                {savedReportsList.map((r, i) => (
                  <option key={i} value={`${r.chitNo}|${r.date}`}>
                    Chit {r.chitNo} ({r.date})
                  </option>
                ))}
                {!savedReportsList.some((r) => r.chitNo === chitNo && r.date === date) && (
                  <option value={`${chitNo}|${date}`}>
                    Chit {chitNo} ({date})
                  </option>
                )}
              </select>
            </div>
          )}

          {!isMember && (
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0B1424] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono uppercase">
                {lang === 'ta' ? 'சீட்டு எண்:' : 'Chit No:'}
              </span>
              <input
                type="text"
                value={chitNo}
                onChange={(e) => {
                  const val = e.target.value;
                  setChitNo(val);
                  try {
                    localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo: val, date }));
                  } catch (err) {}
                }}
                className="w-16 px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-center focus:ring-1 focus:ring-[#2F7BFF]"
                placeholder="08"
              />
            </div>
          )}

          {/* Small Calendar Picker Popover Container (Admin only) */}
          {!isMember && (
          <div className="relative" ref={calendarPickerRef}>
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#0B1424] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 transition-colors">
              <button
                type="button"
                onClick={toggleMiniCalendar}
                className="text-slate-500 hover:text-[#2F7BFF] transition-colors p-0.5 rounded cursor-pointer"
                title={lang === 'ta' ? 'நாட்காட்டியைத் திற' : 'Open Calendar'}
              >
                <Calendar className="w-4 h-4 text-[#2F7BFF]" />
              </button>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono uppercase">
                {lang === 'ta' ? 'தேதி:' : 'Date:'}
              </span>
              <input
                type="text"
                value={date}
                onClick={toggleMiniCalendar}
                onChange={(e) => {
                  const val = e.target.value;
                  setDate(val);
                  try {
                    localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo, date: val }));
                  } catch (err) {}
                }}
                disabled={isMember}
                className="w-24 px-2 py-1 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-center focus:ring-2 focus:ring-[#2F7BFF] focus:outline-none disabled:bg-slate-100 cursor-pointer shadow-2xs"
                placeholder="25.10.26"
              />
            </div>

            {/* Small Calendar Dropdown Popover */}
            {showMiniCalendar && (
              <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 z-50 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                {/* Header: Month & Year + Prev / Next Arrows */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-extrabold text-slate-800">
                      {displayMonthName} {calYear}
                    </span>
                    {monthSummary.pournamiDay && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800" title="Chit Pournami Day">
                        🌕 {monthSummary.pournamiDay}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handlePrevCalMonth}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCalMonth}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMiniCalendar(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-1 cursor-pointer"
                      title="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Day Headers (Su, Mo, Tu...) */}
                <div className="grid grid-cols-7 gap-1 text-center">
                  {dayHeaders.map((dh, i) => (
                    <span
                      key={i}
                      className={`text-[11px] font-bold py-0.5 ${
                        i === 0 ? 'text-rose-500' : 'text-slate-400'
                      }`}
                    >
                      {dh}
                    </span>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Padding Days for alignment */}
                  {paddingArray.map((_, i) => (
                    <div key={`pad-${i}`} className="h-7 w-7" />
                  ))}

                  {/* Month Days */}
                  {monthSummary.days.map((d) => {
                    const isSelected =
                      parsedCurrent.day === d.day &&
                      parsedCurrent.month === calMonth &&
                      parsedCurrent.year === calYear;

                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => handleSelectDay(d.day)}
                        className={`h-7 w-7 mx-auto rounded-lg text-xs font-semibold flex items-center justify-center relative transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#2F7BFF] text-white font-extrabold shadow-sm scale-105'
                            : d.isPournami
                            ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300 hover:bg-amber-200'
                            : d.isToday
                            ? 'bg-blue-50 text-[#2F7BFF] font-bold border border-blue-200 hover:bg-blue-100'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                        title={
                          d.isPournami
                            ? lang === 'ta'
                              ? `பௌர்ணமி சீட்டு நாள் (${d.day}.${String(calMonth + 1).padStart(2, '0')}.${String(calYear).slice(-2)})`
                              : `Pournami Chit Day (${d.day}.${String(calMonth + 1).padStart(2, '0')}.${String(calYear).slice(-2)})`
                            : undefined
                        }
                      >
                        <span>{d.day}</span>
                        {d.isPournami && !isSelected && (
                          <span className="absolute -top-1 -right-0.5 text-[8px] leading-none">🌕</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Selection Shortcuts Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={handleJumpToToday}
                    className="px-2 py-1 rounded-md hover:bg-slate-100 text-[#2F7BFF] font-bold transition-colors cursor-pointer"
                  >
                    {lang === 'ta' ? 'இன்று' : 'Today'}
                  </button>
                  <button
                    type="button"
                    onClick={handleJumpToNextPournami}
                    className="px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>🌕</span>
                    <span>{lang === 'ta' ? 'அடுத்த சீட்டு' : 'Next Chit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowMiniCalendar(false)}
                    className="px-2 py-1 rounded-md hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer"
                  >
                    {lang === 'ta' ? 'மூடு' : 'Done'}
                  </button>
                </div>
              </div>
            )}
          </div>
          )}

          <button
            onClick={() => loadReport(chitNo, date)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1"
            title="Reload report"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'புதுப்பி' : 'Load'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportCSV}
            className="px-3 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Export PDF Button */}
          <button
            onClick={exportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export official 6-sheet PDF"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>

          {/* Edit Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsEditMode((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
              isEditMode
                ? 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-400 font-black'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title={isEditMode ? 'Exit edit mode' : 'Enable editing mode'}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditMode ? (lang === 'ta' ? 'பதிவு முறை (செயலில்)' : 'Editing Mode') : (lang === 'ta' ? 'அறிக்கையைத் திருத்து' : 'Edit Report')}</span>
          </button>

          {/* Delete Report Button */}
          <button
            type="button"
            onClick={handleDeleteReport}
            disabled={loading}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Delete this monthly report from database"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{lang === 'ta' ? 'அறிக்கையை நீக்கு' : 'Delete Report'}</span>
          </button>

          {/* Save Report Button (Admin / Staff only) */}
          {!isMember && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (lang === 'ta' ? 'சேமிக்க' : 'Save Report')}</span>
            </button>
          )}

          {/* Preview Member View Button */}
          <button
            type="button"
            onClick={() => setAdminPreviewMemberView(true)}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Preview Member Statement View"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'உறுப்பினர் பார்வை' : 'Member View'}</span>
          </button>
        </div>
      </div>

      {/* Member Personalized Record Overview (Only for Member Login) */}
      {isMember && myEntry && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border-2 border-emerald-400 dark:border-emerald-700 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                  {lang === 'ta' ? 'உங்கள் சீட்டு பதிவு' : 'Your Chit Record'}
                </span>
                <span className="text-xs text-slate-500 font-bold font-mono">
                  {myEntry.memberNumber} • S.No: #{myEntry.sno} • Sheet {myEntry.sheetNumber}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                {myEntry.memberName}
              </h3>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 bg-white/90 dark:bg-slate-900/90 px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'ta' ? 'தவணைத் தொகை' : 'Installment'}</span>
                <span className="text-base font-black text-slate-900 dark:text-white font-mono">₹{Number(myEntry.amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'ta' ? 'கமிஷன்' : 'Commission'}</span>
                <span className="text-sm font-bold text-purple-700 font-mono">₹{Number(myEntry.commission).toLocaleString('en-IN')}</span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'ta' ? 'வழங்கப்பட்ட தொகை' : 'Money Offered'}</span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  ₹{(Number(myEntry.moneyOffered) || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-l border-slate-200 dark:border-slate-700 pl-3">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{lang === 'ta' ? 'நிலை' : 'Status'}</span>
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {myEntry.status === 'PAID' ? (lang === 'ta' ? 'செலுத்தப்பட்டது' : 'Paid') : myEntry.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த உறுப்பினர்கள்' : 'Total Members'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-slate-800">{entries.length}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold font-mono">
              6 {lang === 'ta' ? 'தாள்கள்' : 'Sheets'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த வசூல் தொகை' : 'Total Amount (Collected)'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-600 font-mono">
              ₹{(totalAmount).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">₹10k x 78</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'மொத்த கமிஷன்' : 'Total Commission'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-purple-600 font-mono">
              ₹{(totalCommission).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-purple-600 font-bold">
              {totalAmount > 0 ? `${((totalCommission / totalAmount) * 100).toFixed(1)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 shadow-sm relative overflow-hidden">
          <div className="absolute -right-2 -bottom-2 text-3xl opacity-10 select-none">🛕</div>
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block mb-1">
            🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-amber-800 font-mono">
              ₹{Number(templeCharityFund).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {lang === 'ta' ? 'நிலையானது' : 'Fixed'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-blue-50/40">
          <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 select-none">🏆</div>
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
            🏆 {lang === 'ta' ? 'பணம் பெற்றவர்கள்' : 'Chit Recipients'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-blue-900 font-mono">
              {entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
              {lang === 'ta' ? 'மாதம் 6 பேர்' : '6 / mo'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-emerald-50/50">
          <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 select-none">💰</div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
            💰 {lang === 'ta' ? 'மொத்த இருப்பு' : 'Total Balance'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-emerald-950 font-mono">
              ₹{(totalAmount - totalCommission - templeCharityFund).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
              ✓ {lang === 'ta' ? 'சரிபார்க்கப்பட்டது' : 'Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* Sheet Tabs & Quick Fill Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        {/* Sheet Tabs: All, Sheet 1 to 6 */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedSheet('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedSheet === 'ALL'
                ? 'bg-[#2F7BFF] text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lang === 'ta' ? 'அனைத்தும் (1-78)' : 'All (1-78)'}
          </button>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSheet(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedSheet === s
                  ? 'bg-[#2F7BFF] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              } ${isMember && myEntry?.sheetNumber === s ? 'ring-2 ring-emerald-500 font-black' : ''}`}
            >
              Sheet {s} ({(s - 1) * 13 + 1}-{s * 13})
              {isMember && myEntry?.sheetNumber === s && ' ⭐'}
            </button>
          ))}
        </div>

        {/* Bulk Commission Setter & Recipient Tracker - Admin / Staff only */}
        {!isMember && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold text-amber-900">
              <span>🏆 {lang === 'ta' ? 'பெற்றவர்கள்:' : 'Recipients:'}</span>
              <span className="font-mono font-black text-amber-700">
                {entries.filter((e) => (Number(e.moneyOffered) || 0) > 0).length} / 6
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {lang === 'ta' ? 'கமிஷன் நிரப்ப:' : 'Set Commission:'}
            </span>
            <input
              type="number"
              value={bulkCommission}
              onChange={(e) => setBulkCommission(e.target.value)}
              placeholder="₹ 600"
              className="w-20 px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold focus:ring-1 focus:ring-[#2F7BFF]"
            />
            <button
              onClick={applyBulkCommission}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-bold transition-colors"
            >
              {lang === 'ta' ? 'நிரப்பு' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEntries((prev) =>
                  prev.map((e) =>
                    selectedSheet === 'ALL' || e.sheetNumber === selectedSheet
                      ? { ...e, moneyOffered: 0 }
                      : e
                  )
                );
                showToast(
                  lang === 'ta'
                    ? 'வழங்கப்பட்ட தொகை அனைத்தும் 0 என அமைக்கப்பட்டது'
                    : 'Set Money Offered to 0 for all'
                );
              }}
              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded text-xs font-bold transition-colors ml-1 cursor-pointer"
              title="Reset Money Offered to 0"
            >
              {lang === 'ta' ? 'Offered: 0 ஆக்கு' : 'Offered: 0'}
            </button>
          </div>
        )}
      </div>

      {/* Main Table: S.No | Sheet / Name | Amount | Commission */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        {/* Printable Official Header matching PDF */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-sm font-extrabold text-slate-900">
          <div>
            <span className="text-slate-500 font-normal">தேதி : </span>
            <span className="font-mono">{date}</span>
          </div>
          <div className="text-center font-bold text-xs uppercase tracking-wide text-slate-700">
            {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு' : 'Sri Pattanathu Mariamman Anangur Seettu'}
          </div>
          <div>
            <span className="text-slate-500 font-normal">சீட்டு எண் : </span>
            <span className="font-mono">{chitNo}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
              <tr>
                <th className="py-3 px-4 w-16 text-center border-r border-slate-200">S.no</th>
                <th className="py-3 px-4 border-r border-slate-200">
                  {selectedSheet === 'ALL' ? 'Sheet / Name' : `Sheet ${selectedSheet}`}
                </th>
                <th className="py-3 px-4 w-32 text-center border-r border-slate-200">Amount</th>
                <th className="py-3 px-4 w-32 text-center border-r border-slate-200">Commission</th>
                <th className="py-3 px-4 w-40 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950 font-bold">
                  <div>{lang === 'ta' ? 'பணம் பெற்றவர் (Money Offered)' : 'Money Offered'}</div>
                  <div className="text-[10px] font-semibold text-emerald-800">
                    {lang === 'ta' ? '(மாதம் 6 உறுப்பினர்கள்)' : '(6 Recipients / mo)'}
                  </div>
                </th>
                <th className="py-3 px-4 w-32 text-center border-r border-slate-200">Payment Mode</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {lang === 'ta' ? 'மாதாந்திர விவரங்கள் ஏற்றப்படுகின்றன...' : 'Loading monthly report entries...'}
                  </td>
                </tr>
              ) : displayedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    {lang === 'ta' ? 'பதிவுகள் எதுவும் இல்லை' : 'No records found'}
                  </td>
                </tr>
              ) : (
                displayedEntries.map((e, idx) => {
                  const globalIndex = entries.findIndex((item) => item.sno === e.sno);
                  const isMyRow = Boolean(isMember && myEntry && e.sno === myEntry.sno);
                  return (
                    <tr
                      key={e.sno}
                      className={`transition-colors ${
                        isMyRow
                          ? 'bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-emerald-500 font-bold'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      {/* S.No */}
                      <td className={`py-3 px-4 text-center font-mono font-bold border-r border-slate-200 ${isMyRow ? 'bg-emerald-100 text-emerald-900 font-black' : 'bg-slate-50/50 text-slate-800'}`}>
                        {e.sno}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4 border-r border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{e.memberName}</span>
                          {isMyRow && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-black uppercase">
                              ⭐ You ({lang === 'ta' ? 'நீங்கள்' : 'You'})
                            </span>
                          )}
                          {e.sno === 78 && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase flex items-center gap-1 shadow-2xs">
                              🛕 {lang === 'ta' ? 'கோவில் சீட்டு' : 'Temple Ticket'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-slate-400">{e.memberNumber}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                            Sheet {e.sheetNumber}
                          </span>
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        {isMember ? (
                          <span className="font-mono font-bold text-slate-900 text-xs">
                            ₹{Number(e.amount).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={e.amount}
                            onChange={(ev) =>
                              handleFieldChange(globalIndex, 'amount', Number(ev.target.value))
                            }
                            className="w-full text-center font-mono font-bold text-slate-800 px-2 py-1.5 rounded border border-slate-200 focus:ring-2 focus:ring-[#2F7BFF] focus:border-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* Commission */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-purple-50/20">
                        {isMember ? (
                          <span className="font-mono font-semibold text-purple-700 text-xs">
                            {e.commission ? `₹${Number(e.commission).toLocaleString('en-IN')}` : '-'}
                          </span>
                        ) : (
                          <input
                            type="number"
                            value={e.commission}
                            onChange={(ev) =>
                              handleFieldChange(globalIndex, 'commission', Number(ev.target.value))
                            }
                            placeholder="0"
                            className="w-full text-center font-mono font-bold text-purple-700 px-2 py-1.5 rounded border border-purple-200 bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent text-xs"
                          />
                        )}
                      </td>

                      {/* Money Offered (6 Recipients) */}
                      <td className={`py-2.5 px-3 text-center border-r border-slate-200 ${(Number(e.moneyOffered) || 0) > 0 ? 'bg-amber-50/80 font-bold' : 'bg-emerald-50/30'}`}>
                        {isMember ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono font-bold text-emerald-800 text-xs">
                              ₹{(Number(e.moneyOffered) || 0).toLocaleString('en-IN')}
                            </span>
                            {(Number(e.moneyOffered) || 0) > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-black mt-0.5 whitespace-nowrap">
                                🏆 {lang === 'ta' ? 'பெற்றவர் (1/6)' : 'Recipient'}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <input
                              type="number"
                              value={e.moneyOffered !== undefined && e.moneyOffered !== null ? e.moneyOffered : 0}
                              onChange={(ev) =>
                                handleFieldChange(
                                  globalIndex,
                                  'moneyOffered',
                                  ev.target.value === '' ? '' : Number(ev.target.value)
                                )
                              }
                              placeholder="0"
                              className={`w-full text-center font-mono font-bold px-2 py-1.5 rounded border focus:ring-2 focus:border-transparent text-xs ${
                                (Number(e.moneyOffered) || 0) > 0
                                  ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500 font-black'
                                  : 'border-emerald-300 bg-white text-emerald-700 focus:ring-emerald-500'
                              }`}
                            />
                            {(Number(e.moneyOffered) || 0) > 0 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-200 text-amber-900 font-black border border-amber-300 whitespace-nowrap">
                                🏆 {lang === 'ta' ? 'பெற்றவர் (1/6)' : 'Recipient'}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200">
                        {isMember ? (
                          <span className="text-xs font-semibold text-slate-700">
                            {e.paymentMethod === 'CASH' ? '💵 Cash' : e.paymentMethod === 'UPI' ? '📱 UPI' : e.paymentMethod}
                          </span>
                        ) : (
                          <select
                            value={e.paymentMethod}
                            onChange={(ev) =>
                              handleFieldChange(globalIndex, 'paymentMethod', ev.target.value)
                            }
                            className="w-full px-2 py-1.5 rounded border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-1 focus:ring-[#2F7BFF]"
                          >
                            <option value="CASH">💵 Cash (ரொக்கம்)</option>
                            <option value="UPI">📱 GPay / UPI</option>
                            <option value="BANK_TRANSFER">🏦 Bank</option>
                          </select>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center">
                        {isMember ? (
                          <span className={`inline-block py-1 px-2.5 rounded-lg text-xs font-bold ${
                            e.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {e.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleFieldChange(
                                globalIndex,
                                'status',
                                e.status === 'PAID' ? 'PENDING' : 'PAID'
                              )
                            }
                            className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all ${
                              e.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                          >
                            {e.status === 'PAID' ? '✓ Paid' : '⏳ Pending'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Table Footer with Totals */}
            <tfoot className="bg-slate-100 font-extrabold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td className="py-3 px-4 text-center font-mono border-r border-slate-300">
                  {displayedEntries.length}
                </td>
                <td className="py-3 px-4 border-r border-slate-300 uppercase tracking-wider text-xs">
                  {lang === 'ta' ? 'மொத்தம் (Total)' : 'Total'}
                </td>
                <td className="py-3 px-4 text-center font-mono text-emerald-700 border-r border-slate-300 text-sm">
                  ₹{displayedEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center font-mono text-purple-700 border-r border-slate-300 text-sm">
                  ₹{displayedEntries.reduce((s, e) => s + (Number(e.commission) || 0), 0).toLocaleString('en-IN')}
                </td>
                <td className="py-3 px-4 text-center font-mono text-emerald-800 border-r border-slate-300 text-sm bg-emerald-50/50">
                  ₹{displayedEntries.reduce((s, e) => s + (Number(e.moneyOffered) || 0), 0).toLocaleString('en-IN')}
                </td>
                <td colSpan={2} className="py-3 px-4 text-center font-mono text-blue-700 text-xs">
                  Net Pool: ₹{displayedEntries.reduce((s, e) => s + ((Number(e.amount) || 0) - (Number(e.commission) || 0)), 0).toLocaleString('en-IN')}
                </td>
              </tr>

              {/* Dedicated Temple Charity Fund (கோவில் தர்ம நிதி) Row */}
              <tr className="bg-gradient-to-r from-amber-50 via-yellow-50/80 to-amber-50 border-t-2 border-amber-300 text-slate-800">
                <td className="py-3 px-4 text-center font-mono border-r border-amber-200 text-amber-800 font-bold text-sm">
                  🛕
                </td>
                <td className="py-3 px-4 border-r border-amber-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-950 text-xs sm:text-sm">
                      🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி (நிலையானது)' : 'Temple Charity Fund (Fixed)'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 shadow-2xs">
                      {lang === 'ta' ? '₹15,600 நிலையானது' : 'Fixed ₹15,600'}
                    </span>
                  </div>
                </td>
                <td colSpan={3} className="py-2.5 px-4 border-r border-amber-200 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xs font-bold text-amber-900">
                      {lang === 'ta' ? 'தர்ம நிதித் தொகை:' : 'Charity Fund Amount:'}
                    </span>
                    {!isMember ? (
                      <div className="flex items-center gap-1">
                        <span className="font-mono font-bold text-amber-800 text-sm">₹</span>
                        <input
                          type="number"
                          value={templeCharityFund}
                          onChange={(e) => setTempleCharityFund(Number(e.target.value) || 0)}
                          className="w-28 text-center font-mono font-bold text-amber-900 px-2 py-1 rounded-lg border-2 border-amber-300 bg-white shadow-2xs focus:ring-2 focus:ring-amber-500 text-sm"
                          placeholder="15600"
                        />
                      </div>
                    ) : (
                      <span className="font-mono font-black text-amber-900 text-sm bg-white px-3 py-1 rounded-lg border border-amber-300 shadow-2xs">
                        ₹{Number(templeCharityFund).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </td>
                <td colSpan={2} className="py-3 px-4 text-center font-mono font-extrabold text-amber-950 text-xs bg-amber-100/60">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-amber-700">
                      {lang === 'ta' ? 'தர்ம நிதி நிலை' : 'Charity Fund Status'}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                      ✓ {lang === 'ta' ? 'ஒதுக்கப்பட்டது' : 'Allocated'}
                    </span>
                  </div>
                </td>
              </tr>

              {/* Row 3: Total Balance (மொத்த இருப்புத் தொகை / Total Balance) */}
              <tr className="bg-gradient-to-r from-emerald-100/90 via-teal-100/80 to-blue-100/90 border-t-2 border-emerald-400 text-slate-900 font-black shadow-xs">
                <td className="py-3.5 px-4 text-center font-mono border-r border-emerald-300 text-emerald-900 text-base font-black">
                  💰
                </td>
                <td className="py-3.5 px-4 border-r border-emerald-300">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <span className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <span>💰</span>
                      <span>{lang === 'ta' ? 'மொத்த இருப்புத் தொகை' : 'Total Balance'}</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-200/80 text-emerald-950 border border-emerald-400 w-fit">
                      {lang === 'ta' ? 'வசூல் - கமிஷன் - தர்ம நிதி' : 'Gross - Comm - Charity'}
                    </span>
                  </div>
                </td>
                <td colSpan={3} className="py-2.5 px-4 border-r border-emerald-300 text-center font-mono text-xs">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="text-emerald-800 font-extrabold bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                      ₹{displayedEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0).toLocaleString('en-IN')} (Gross)
                    </span>
                    <span className="text-slate-500 font-bold">-</span>
                    <span className="text-purple-800 font-extrabold bg-white/70 px-2 py-0.5 rounded border border-purple-200">
                      ₹{displayedEntries.reduce((s, e) => s + (Number(e.commission) || 0), 0).toLocaleString('en-IN')} (Comm)
                    </span>
                    <span className="text-slate-500 font-bold">-</span>
                    <span className="text-amber-900 font-extrabold bg-white/70 px-2 py-0.5 rounded border border-amber-200">
                      ₹{templeCharityFund.toLocaleString('en-IN')} (🛕 Charity)
                    </span>
                  </div>
                </td>
                <td colSpan={2} className="py-3 px-4 text-center font-mono font-black text-emerald-950 bg-emerald-200/50">
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">
                      {lang === 'ta' ? 'மொத்த இருப்பு' : 'Total Balance'}
                    </span>
                    <span className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
                      ₹{(
                        displayedEntries.reduce((s, e) => s + (Number(e.amount) || 0), 0) -
                        displayedEntries.reduce((s, e) => s + (Number(e.commission) || 0), 0) -
                        templeCharityFund
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating / Sticky Bottom Bar for Quick Save */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-16 sm:bottom-4 z-20">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 sm:gap-3 text-xs text-slate-600">
          <span className="font-bold text-slate-800">
            {lang === 'ta' ? 'தேதி:' : 'Date:'} <span className="font-mono">{date}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-800">
            {lang === 'ta' ? 'சீட்டு எண்:' : 'Chit No:'} <span className="font-mono">{chitNo}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            {lang === 'ta' ? 'உறுப்பினர்கள்:' : 'Members:'} <span className="font-bold font-mono">{entries.length}</span>
          </span>
          <span className="text-slate-300">|</span>
          <span className="font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono text-[11px] sm:text-xs">
            💰 {lang === 'ta' ? 'மொத்த இருப்பு:' : 'Total Balance:'} ₹{(totalAmount - totalCommission - templeCharityFund).toLocaleString('en-IN')}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
          {!isMember && (
            <>
              <button
                type="button"
                onClick={() => setIsEditMode((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  isEditMode
                    ? 'bg-amber-500 text-white shadow-amber-500/30 ring-2 ring-amber-400 font-black'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isEditMode ? 'Exit edit mode' : 'Enable editing mode'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditMode ? (lang === 'ta' ? 'செயலில்' : 'Editing') : (lang === 'ta' ? 'திருத்து' : 'Edit')}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteReport}
                disabled={loading}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Delete this monthly report from database"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{lang === 'ta' ? 'நீக்கு' : 'Delete'}</span>
              </button>
            </>
          )}

          <button
            onClick={exportCSV}
            className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportPDF}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="Export official 6-sheet PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          {!isMember && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'
                  : lang === 'ta' ? 'அறிக்கையைச் சேமிக்க' : 'Save Monthly Report'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Saved Reports History Drawer */}
      {savedReportsList.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            {lang === 'ta' ? 'ஏற்கனவே சேமிக்கப்பட்ட மாதாந்திர அறிக்கைகள்' : 'Previously Saved Monthly Reports'}
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedReportsList.map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  setChitNo(r.chitNo);
                  setDate(r.date);
                  loadReport(r.chitNo, r.date);
                }}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-2 ${
                  chitNo === r.chitNo && date === r.date
                    ? 'bg-blue-50 border-blue-300 text-blue-700 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {r.date} (Chit {r.chitNo})
                </span>
                <span className="font-mono text-[10px] text-slate-400">
                  {r.count} members • ₹{(r.totalAmount || 0).toLocaleString('en-IN')}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
