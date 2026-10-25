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
    commission: 0,
    moneyOffered: 0,
    templeCharityFund: 10000,
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
      if (saved) return Number(saved) || 10000;
    } catch (e) {}
    return 10000;
  });

  // Bulk edit state
  const [bulkCommission, setBulkCommission] = useState('');

  const isMember = user?.role === 'MEMBER';

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

    setDate(newDateStr);
    try {
      localStorage.setItem(LAST_ACTIVE_CHIT_KEY, JSON.stringify({ chitNo, date: newDateStr }));
    } catch (e) {}

    setShowMiniCalendar(false);
    loadReport(chitNo, newDateStr);
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

  // Identify member's own entry if logged in as a member
  const myEntry = entries.find((e) => {
    if (!isMember) return false;
    if (user?.member?.memberNumber && e.memberNumber === user.member.memberNumber) return true;
    if (user?.name) {
      const uNorm = user.name.toLowerCase().replace(/[\s\.\-]+/g, '');
      const eNorm = (e.memberName || '').toLowerCase().replace(/[\s\.\-]+/g, '');
      return eNorm.includes(uNorm) || uNorm.includes(eNorm);
    }
    return false;
  });

  const loadReport = (targetChit = chitNo, targetDate = date) => {
    setLoading(true);
    // Instant local cache recovery
    const localKey = `seettu_monthly_report_${targetChit}_${targetDate}`;
    const fundKey = `seettu_charity_fund_${targetChit}_${targetDate}`;
    try {
      const savedFund = localStorage.getItem(fundKey);
      if (savedFund) setTempleCharityFund(Number(savedFund) || 10000);
    } catch (e) {}

    let currentData = entries;
    const cached = localStorage.getItem(localKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.map((e: any) => ({
            ...e,
            moneyOffered: (e.moneyOffered === 10000 || e.moneyOffered === 9916 || e.moneyOffered === undefined || e.moneyOffered === null) ? 0 : (Number(e.moneyOffered) || 0),
          }));
          currentData = cleaned;
          setEntries(cleaned);
          setIsSaved(true);
          if (parsed[0]?.templeCharityFund !== undefined) {
            setTempleCharityFund(Number(parsed[0].templeCharityFund) || 10000);
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
            const fund = Number(res.data.templeCharityFund) || 10000;
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
            localStorage.setItem(localKey, JSON.stringify(cleaned));
            if (res.data.entries[0]?.templeCharityFund !== undefined) {
              setTempleCharityFund(Number(res.data.entries[0].templeCharityFund) || 10000);
            }
          } else if (currentData && currentData.length > 0) {
            // Keep existing valid entries; never overwrite with empty
            setEntries(currentData);
          } else {
            const fallback = getDefaultEntries(targetChit, targetDate);
            setEntries(fallback);
          }
        }
      })
      .catch((err) => {
        console.warn('Network error loading report, falling back to local/default:', err);
        if (!currentData || currentData.length === 0) {
          setEntries(getDefaultEntries(targetChit, targetDate));
        }
      })
      .finally(() => setLoading(false));
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

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
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
      const sheetEntries = entries.filter((e) => e.sheetNumber === sNum);
      const sheetAmount = sheetEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const sheetCommission = sheetEntries.reduce((sum, e) => sum + (Number(e.commission) || 0), 0);
      const sheetOffered = sheetAmount - sheetCommission;

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
                  const sheetSno = idx + 1;
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

  return (
    <div className="space-y-6">
      {/* Top Header & Chit / Date Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-black text-slate-900 tracking-tight">
              {isMember
                ? (lang === 'ta' ? 'மாதாந்திர சீட்டு அறிக்கை' : 'Monthly Chit Report')
                : (lang === 'ta' ? 'மாதாந்திர அறிக்கை பதிவு (நிர்வாகம்)' : 'Monthly Report Entry (Admin)')}
            </h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              isSaved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {isSaved
                ? lang === 'ta' ? 'சேமிக்கப்பட்டது' : 'Saved'
                : lang === 'ta' ? 'சேமிக்கப்படவில்லை' : 'Draft / Unsaved'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {lang === 'ta'
              ? 'தேதி, சீட்டு எண், உறுப்பினர் தொகை மற்றும் கமிஷன் விவரங்கள்.'
              : 'Official monthly collections, member contributions, and commissions per Chit & Date.'}
          </p>
        </div>

        {/* Date, Chit No & Export / Save Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {savedReportsList.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
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
                className="bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg px-2 py-0.5 focus:ring-1 focus:ring-[#2F7BFF]"
              >
                {savedReportsList.map((r, i) => (
                  <option key={i} value={`${r.chitNo}|${r.date}`}>
                    Chit {r.chitNo} ({r.date})
                  </option>
                ))}
                {!savedReportsList.some((r) => r.chitNo === chitNo && r.date === date) && (
                  <option value={`${chitNo}|${date}`}>
                    Chit {chitNo} ({date}) {isSaved ? '' : '(Draft)'}
                  </option>
                )}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 font-mono uppercase">
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
              disabled={isMember}
              className="w-16 px-2 py-1 rounded bg-white border border-slate-300 text-xs font-mono font-bold text-center focus:ring-1 focus:ring-[#2F7BFF] disabled:bg-slate-100"
              placeholder="08"
            />
          </div>

          {/* Small Calendar Picker Popover Container */}
          <div className="relative" ref={calendarPickerRef}>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
              <button
                type="button"
                onClick={toggleMiniCalendar}
                className="text-slate-500 hover:text-[#2F7BFF] transition-colors p-0.5 rounded cursor-pointer"
                title={lang === 'ta' ? 'நாட்காட்டியைத் திற' : 'Open Calendar'}
              >
                <Calendar className="w-4 h-4 text-[#2F7BFF]" />
              </button>
              <span className="text-xs font-bold text-slate-600 font-mono uppercase">
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

          {/* Save Report Button (Admin / Staff only) */}
          {!isMember && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...') : (lang === 'ta' ? 'சேமிக்க' : 'Save Report')}</span>
            </button>
          )}
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

      {/* 5 Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
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
            🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity Fund'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-amber-800 font-mono">
              ₹{Number(templeCharityFund).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
              {lang === 'ta' ? 'மாரியம்மன்' : 'Temple'}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            {lang === 'ta' ? 'நிகர சீட்டு நிதி' : 'Net Chit Pool'}
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl font-extrabold text-blue-600 font-mono">
              ₹{(netPool).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">✓ Ready</span>
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

        {/* Bulk Commission Setter - Admin / Staff only */}
        {!isMember && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {lang === 'ta' ? 'கமிஷன் நிரப்ப:' : 'Set Commission:'}
            </span>
            <input
              type="number"
              value={bulkCommission}
              onChange={(e) => setBulkCommission(e.target.value)}
              placeholder="₹ 500"
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
                <th className="py-3 px-4 w-36 text-center border-r border-slate-200 bg-emerald-50/70 text-emerald-950 font-bold">
                  {lang === 'ta' ? 'Money Offered (வழங்கப்பட்டது)' : 'Money Offered'}
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

                      {/* Money Offered */}
                      <td className="py-2.5 px-3 text-center border-r border-slate-200 bg-emerald-50/30">
                        {isMember ? (
                          <span className="font-mono font-bold text-emerald-800 text-xs">
                            ₹{(Number(e.moneyOffered) || 0).toLocaleString('en-IN')}
                          </span>
                        ) : (
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
                            className="w-full text-center font-mono font-bold text-emerald-700 px-2 py-1.5 rounded border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-xs"
                          />
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
                      🛕 {lang === 'ta' ? 'கோவில் தர்ம நிதி' : 'Temple Charity Fund'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 shadow-2xs">
                      {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன்' : 'Mariamman Temple'}
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
                          placeholder="10000"
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
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating / Sticky Bottom Bar for Quick Save */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-40">
        <div className="flex items-center gap-3 text-xs text-slate-600">
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={exportPDF}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export official 6-sheet PDF"
          >
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          {!isMember && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-[#2F7BFF] hover:bg-blue-600 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? lang === 'ta' ? 'சேமிக்கப்படுகிறது...' : 'Saving...'
                  : lang === 'ta' ? 'மாதாந்திர அறிக்கையைச் சேமிக்க' : 'Save Monthly Report'}
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
