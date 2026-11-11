import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText,
  Trophy,
  Award,
  MapPin,
  User,
  Coins,
  Share2,
  ExternalLink,
  X,
  Phone,
} from 'lucide-react';
import {
  getLunarMonthCalendar,
  getNextPournami,
  getYearlyLunarSchedule,
  translations,
  SupportedLanguage,
  formatINR,
} from '@seettu/shared';
import { api } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface ChitCalendarProps {
  lang: SupportedLanguage;
  onOpenMonthlyReport?: (chitNo: string, date: string) => void;
}

export const ChitCalendar: React.FC<ChitCalendarProps> = ({ lang, onOpenMonthlyReport }) => {
  const t = translations[lang];
  const isTa = lang === 'ta';

  // Selected calendar view (defaults to today / Oct 2026)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDayInfo, setSelectedDayInfo] = useState<any>(null);

  // Scheme & Payouts State for Lucky Draw Winners
  const [schemeDetails, setSchemeDetails] = useState<any>(null);
  const [payoutsList, setPayoutsList] = useState<any[]>([]);
  const [savedReports, setSavedReports] = useState<any[]>(() => {
    try {
      const raw = localStorage.getItem('seettu_saved_reports_registry');
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
  });

  // 1. Load Saved Reports Registry
  useEffect(() => {
    api
      .getMonthlyReportDates()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const map = new Map<string, any>();
          savedReports.forEach((r) => map.set(`${r.chitNo}|${r.date}`, r));
          res.data.forEach((r) => map.set(`${r.chitNo}|${r.date}`, { ...r, isSaved: true }));
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
          setSavedReports(merged);
          try {
            localStorage.setItem('seettu_saved_reports_registry', JSON.stringify(merged));
          } catch (e) {}
        }
      })
      .catch(() => {});
  }, []);

  // 2. Load Scheme Details (Rounds with Lucky Draw Winners) & Payouts
  useEffect(() => {
    api
      .getSchemes({ status: 'ACTIVE' })
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          const schemeId = res.data[0].id;
          return api.getScheme(schemeId);
        }
        return null;
      })
      .then((res) => {
        if (res && res.success && res.data) {
          setSchemeDetails(res.data);
        }
      })
      .catch(() => {});

    api
      .getPayouts({ scope: 'all' })
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setPayoutsList(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const monthCalendar = getLunarMonthCalendar(currentYear, currentMonth, today);
  const nextPournami = getNextPournami(today);
  const yearlySchedule = getYearlyLunarSchedule(currentYear);

  const formattedPournamiDate = useMemo(() => {
    if (!nextPournami?.dateStr) return '';
    try {
      const parts = nextPournami.dateStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dt = new Date(y, m, d);
        return dt.toLocaleDateString(isTa ? 'ta-IN' : 'en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (e) {}
    return nextPournami.dateStr;
  }, [nextPournami?.dateStr, isTa]);

  // Month navigation
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const jumpToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  // Day of week for 1st day of month
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  const paddingDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  const dayHeaders = [
    t.dayShortSun,
    t.dayShortMon,
    t.dayShortTue,
    t.dayShortWed,
    t.dayShortThu,
    t.dayShortFri,
    t.dayShortSat,
  ];

  /**
   * Helper to determine if a specific calendar day is a Chit Draw Day,
   * and if so, retrieves who won the lucky draw for that round.
   */
  const getDrawInfoForDay = (dateStr: string, isPournami: boolean, dayNumber: number) => {
    // Scheme 08 commenced October 2026 (Month 9).
    // Round 1 = Oct 2026, Round 2 = Nov 2026, Round 3 = Dec 2026, etc.
    const roundNumber = (currentYear - 2026) * 12 + (currentMonth - 9) + 1;
    const isWithinSchemeRange = roundNumber >= 1 && roundNumber <= 20;

    // Check if this date matches a Collection Round dueDate directly
    let matchedRound = (schemeDetails?.collectionRounds || []).find((r: any) => {
      const roundDate = r.dueDate?.split('T')[0];
      return roundDate === dateStr;
    });

    // If Pournami day and no explicit date match, map to this month's round
    if (!matchedRound && isPournami && isWithinSchemeRange) {
      matchedRound = (schemeDetails?.collectionRounds || []).find(
        (r: any) => r.roundNumber === roundNumber
      );
    }

    const isDrawDate = isPournami || Boolean(matchedRound);
    const effectiveRoundNo = matchedRound?.roundNumber || (isWithinSchemeRange ? roundNumber : null);

    // Look for winner in round or in payoutsList
    const payoutRecord = payoutsList.find(
      (p) => effectiveRoundNo && p.roundNumber === effectiveRoundNo
    );

    const winnerName =
      matchedRound?.payoutRecipientName ||
      payoutRecord?.recipientName ||
      null;

    const winnerMemberNo =
      matchedRound?.payoutRecipientMemberNumber ||
      payoutRecord?.recipientMemberNumber ||
      null;

    const winnerSlot =
      matchedRound?.payoutRecipientSlotNumber ||
      (matchedRound?.payoutRecipientMemberId &&
        schemeDetails?.memberships?.find(
          (m: any) => m.memberId === matchedRound.payoutRecipientMemberId
        )?.slotNumber) ||
      null;

    const winnerAddress =
      matchedRound?.payoutRecipientAddress ||
      '';

    const netAmount =
      matchedRound?.netPayoutPaise ||
      payoutRecord?.netPayoutPaise ||
      schemeDetails?.totalPoolAmountPaise - (schemeDetails?.organizerCommissionPaise || 2500000) ||
      75500000;

    const status =
      matchedRound?.payoutStatus ||
      payoutRecord?.approvalStatus ||
      'PENDING';

    const hasWinner = Boolean(winnerName);

    return {
      isDrawDate,
      hasWinner,
      roundNumber: effectiveRoundNo,
      winner: hasWinner
        ? {
            fullName: winnerName,
            memberNumber: winnerMemberNo || 'MEMBER',
            slotNumber: winnerSlot,
            netPayoutPaise: netAmount,
            status,
            address: winnerAddress,
            dueDate: dateStr,
          }
        : null,
      netPayoutPaise: netAmount,
    };
  };

  /**
   * Share Winner details via WhatsApp / Native Share sheet
   */
  const handleShareWinner = async (winner: any, roundNumber: number, dateStr: string) => {
    const text = `🛕 ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு எண்: 08\n` +
      `🏆 தவணை #${roundNumber} குலுக்கல் வெற்றியாளர்: ${winner.fullName}\n` +
      `உறுப்பினர் எண்: ${winner.memberNumber}${winner.slotNumber ? ` • டோக்கன் எண்: #${winner.slotNumber}` : ''}\n` +
      `பரிசுத் தொகை: ${formatINR(winner.netPayoutPaise)}\n` +
      `தேதி: ${dateStr} (பௌர்ணமி நாள்)\n` +
      `வாழ்த்துகள்! 🎉`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: `Chit #${roundNumber} Winner - Sri Pattanathu Mariamman`,
          text,
          dialogTitle: 'Share Winner Announcement',
        });
        return;
      } catch (e) {}
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Auspicious Countdown Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Chit Draw Day (Pournami) */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-amber-500 to-amber-600 text-white shadow-xl shadow-amber-500/25 relative overflow-hidden border border-amber-400/40">
          <div className="absolute -right-4 -bottom-4 opacity-20 pointer-events-none text-8xl">
            🌕
          </div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-yellow-200" />
            <span>{t.nextChitDay}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-black whitespace-nowrap tracking-tight">
              {formattedPournamiDate || nextPournami.dateStr}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/25 backdrop-blur-md text-xs font-black whitespace-nowrap border border-white/20 shadow-xs">
              {nextPournami.isToday
                ? isTa ? 'இன்று!' : 'Today!'
                : `${nextPournami.daysRemaining} ${t.daysRemaining}`}
            </span>
          </div>
          <p className="mt-2.5 text-xs text-amber-100/95 leading-relaxed font-medium">
            🎯 {isTa
              ? 'மாதாந்திர சீட்டு குலுக்கல், ஏலம் மற்றும் புதிய தவணை வசூல் நடைபெறும் நாள். தேதியை தொட்டு வெற்றியாளரைக் காணலாம்.'
              : 'Monthly lucky draw and collection day. Touch any date on the calendar to view who won the draw.'}
          </p>
        </div>

        {/* Temple Chit Guidelines */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-amber-200 dark:border-amber-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>🛕 {isTa ? 'சீட்டு வழிமுறைகள் & குலுக்கல்' : 'Chit Tradition & Lucky Draw'}</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
              {isTa ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர்' : 'Sri Pattanathu Mariamman Anangur'}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {isTa
                ? 'அனைத்து சுழற்சி சீட்டு குலுக்கல், ஏலம் மற்றும் புதிய தவணை வசூல்கள் மாதந்தோறும் பௌர்ணமி நாளன்று கோவில் வளாகத்தில் நடைபெறும்.'
                : 'All monthly rotational chit draws and payouts take place exclusively on every Full Moon (Pournami) day.'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              🌕 {isTa ? 'மாதாந்திர தவணை நாள்:' : 'Monthly Draw Day:'} <strong className="text-amber-700 dark:text-amber-400">{t.pournamiFullMoon}</strong>
            </span>
            <span className="text-blue-600 font-bold text-[11px] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTa ? 'வெற்றியாளர் விபரம்' : 'Draw Winners'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Saved Monthly Reports Bar */}
      {savedReports.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-blue-200 dark:border-blue-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-bold text-lg">
              📋
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                {isTa ? 'சேமிக்கப்பட்ட மாதாந்திர சீட்டு அறிக்கைகள்' : 'Saved Official Monthly Reports'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTa
                  ? 'உறுப்பினர்கள் தங்களின் மாதாந்திர தவணை, கமிஷன் மற்றும் வசூல் அறிக்கையை நேரடியாகக் காணலாம்.'
                  : 'Click below to view official monthly collections, commissions, and member statements.'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {savedReports.map((r, i) => (
              <button
                key={i}
                onClick={() => onOpenMonthlyReport && onOpenMonthlyReport(r.chitNo, r.date)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2F7BFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Chit {r.chitNo} ({r.date})</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">
                  ₹{(r.totalAmount || 0).toLocaleString('en-IN')}
                </span>
                <span>➔</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Interactive Lunar Calendar Grid */}
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Calendar Month Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-[#2F7BFF]" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {monthCalendar.monthName} {currentYear}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isTa
                ? 'தேதியை தொட்டு குலுக்கல் வெற்றியாளர் விபரம் மற்றும் தவணை அறிக்கையைக் காணலாம்'
                : 'Touch any date to view who won the lucky draw and monthly statements'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={jumpToToday}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {isTa ? 'இன்று' : 'Today'}
            </button>
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 border border-amber-500 shadow-sm flex items-center justify-center text-[8px] text-white">🏆</span>
            <span className="text-amber-800 dark:text-amber-300 font-bold">
              {isTa ? 'குலுக்கல் வெற்றியாளர் (Winner Announced)' : 'Lucky Draw Winner Announced'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-500 shadow-sm"></span>
            <span className="text-amber-700 dark:text-amber-400">🌕 {t.pournamiFullMoon} — {t.chitDayBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-500"></span>
            <span className="text-blue-600 dark:text-blue-400">{isTa ? 'இன்றைய நாள்' : 'Today'}</span>
          </div>
        </div>

        {/* Calendar Table Header (Days of week) */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-400 uppercase py-2">
          {dayHeaders.map((dh, idx) => (
            <div key={idx} className={idx === 0 ? 'text-rose-500' : ''}>
              {dh}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-2 mt-2">
          {paddingDays.map((p) => (
            <div key={`pad-${p}`} className="h-24 rounded-xl bg-slate-50/40 dark:bg-slate-900/20 border border-dashed border-slate-100 dark:border-slate-800/40 opacity-40"></div>
          ))}

          {monthCalendar.days.map((d) => {
            const drawInfo = getDrawInfoForDay(d.dateStr, d.isPournami, d.day);
            const isChitDay = drawInfo.isDrawDate;
            const hasWinner = drawInfo.hasWinner;

            return (
              <div
                key={d.dateStr}
                onClick={() => setSelectedDayInfo({ ...d, drawInfo })}
                className={`h-24 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                  hasWinner
                    ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-amber-400 dark:border-amber-600 shadow-md ring-2 ring-amber-400/50 hover:scale-[1.02]'
                    : isChitDay
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/90 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-400/30 hover:scale-[1.01]'
                    : d.isToday
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Header row: Day Number & Trophy / Moon Icon */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold ${
                      hasWinner
                        ? 'text-amber-900 dark:text-amber-200 text-sm'
                        : isChitDay
                        ? 'text-amber-800 dark:text-amber-300 text-sm'
                        : d.isToday
                        ? 'text-blue-600 dark:text-blue-400 font-black'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.day}
                  </span>

                  {hasWinner ? (
                    <span className="text-sm" title="Lucky Draw Winner Declared!">
                      🏆
                    </span>
                  ) : isChitDay ? (
                    <span className="text-base animate-pulse" title="Full Moon / Pournami">
                      🌕
                    </span>
                  ) : null}
                </div>

                {/* Event Pill / Badge / Winner preview */}
                <div>
                  {hasWinner ? (
                    <div className="space-y-0.5">
                      <div className="px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black truncate shadow-xs flex items-center justify-center gap-0.5">
                        <Trophy className="w-2.5 h-2.5 text-yellow-200 shrink-0" />
                        <span className="truncate">
                          {drawInfo.winner?.fullName.split('/')[0].trim().split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-800 dark:text-amber-300 block text-center truncate">
                        {isTa ? `தவணை #${drawInfo.roundNumber}` : `R#${drawInfo.roundNumber}`}
                      </span>
                    </div>
                  ) : isChitDay ? (
                    <div className="space-y-0.5">
                      <div className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold text-center truncate shadow-sm">
                        {drawInfo.roundNumber ? (isTa ? `தவணை #${drawInfo.roundNumber}` : `Round #${drawInfo.roundNumber}`) : (isTa ? 'சீட்டு நாள்' : 'Chit Day')}
                      </div>
                    </div>
                  ) : d.isToday ? (
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block text-center">
                      {isTa ? 'இன்று' : 'Today'}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Yearly Lunar Chit Schedule Table */}
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-600" />
              <span>{t.yearlyLunarSchedule} ({currentYear})</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t.lunarNotice}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 uppercase font-semibold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">{isTa ? 'மாதம்' : 'Month'}</th>
                <th className="py-3 px-4">🌕 {t.pournamiFullMoon} ({t.chitDayBadge})</th>
                <th className="py-3 px-4">{isTa ? 'குலுக்கல் நிலை & வெற்றியாளர்' : 'Draw Status & Winner'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {yearlySchedule.map((row) => {
                const isCurrentMonthRow = row.monthIndex === today.getMonth() && currentYear === today.getFullYear();
                const roundNo = (currentYear - 2026) * 12 + (row.monthIndex - 9) + 1;
                const roundData = (schemeDetails?.collectionRounds || []).find((r: any) => r.roundNumber === roundNo);
                const winnerName = roundData?.payoutRecipientName || payoutsList.find((p) => p.roundNumber === roundNo)?.recipientName;

                return (
                  <tr
                    key={row.monthIndex}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      isCurrentMonthRow ? 'bg-amber-50/40 dark:bg-amber-950/20 font-bold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      {row.monthName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                          {row.pournamiDateStr || '-'}
                        </span>
                        {roundNo >= 1 && roundNo <= 20 && (
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                            {isTa ? `தவணை #${roundNo}` : `Round #${roundNo}`}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {winnerName ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            <span>{winnerName}</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ₹7,55,000
                          </span>
                        </div>
                      ) : isCurrentMonthRow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {isTa ? 'நடப்பு மாதம் (குலுக்கல் விரைவில்)' : 'Current Month (Draw Upcoming)'}
                        </span>
                      ) : roundNo >= 1 && roundNo <= 20 ? (
                        <span className="text-slate-400 text-[11px]">
                          {isTa ? 'குலுக்கல் நிலுவை' : 'Pending Draw'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">
                          {isTa ? 'திட்டத்திற்கு வெளியே' : 'Out of Scheme'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ALL ROUNDS LUCKY DRAW WINNERS SUMMARY CARD */}
      <div className="bg-white dark:bg-[#131B2E] rounded-2xl p-6 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {isTa
                  ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் சீட்டு - குலுக்கல் வெற்றியாளர்கள் முழுப் பட்டியல்'
                  : 'Chit Lucky Draw Winners Master List'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isTa
                  ? '78 உறுப்பினர்களின் 20 தவணைகளுக்கான அதிகாரப்பூர்வ குலுக்கல் பட்டுவாடா விபரம்'
                  : 'Official record of awarded members and prize payouts across all 20 rounds'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-xs">
            SCH-CHIT-08 • 20 {isTa ? 'தவணைகள்' : 'Rounds'}
          </span>
        </div>

        {/* List of 20 Rounds and Winners */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {(schemeDetails?.collectionRounds || Array.from({ length: 20 }, (_, i) => ({ roundNumber: i + 1 }))).slice(0, 20).map((r: any) => {
            const roundNo = r.roundNumber;
            const payout = payoutsList.find((p) => p.roundNumber === roundNo);
            const winnerName = r.payoutRecipientName || payout?.recipientName;
            const winnerMemberNo = r.payoutRecipientMemberNumber || payout?.recipientMemberNumber;
            const winnerSlot = r.payoutRecipientSlotNumber;
            const hasWon = Boolean(winnerName);

            return (
              <div
                key={roundNo}
                onClick={() => {
                  setSelectedDayInfo({
                    dateStr: r.dueDate?.split('T')[0] || `தவணை #${roundNo}`,
                    day: roundNo,
                    isPournami: true,
                    drawInfo: {
                      isDrawDate: true,
                      hasWinner: hasWon,
                      roundNumber: roundNo,
                      winner: hasWon
                        ? {
                            fullName: winnerName,
                            memberNumber: winnerMemberNo || 'MEMBER',
                            slotNumber: winnerSlot,
                            netPayoutPaise: r.netPayoutPaise || 75500000,
                            status: r.payoutStatus || 'DISBURSED',
                            address: r.payoutRecipientAddress || '',
                            dueDate: r.dueDate?.split('T')[0] || '',
                          }
                        : null,
                      netPayoutPaise: 75500000,
                    },
                  });
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                  hasWon
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-300 dark:border-amber-700 shadow-xs hover:shadow-md'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    #{roundNo}
                  </span>
                  {hasWon ? (
                    <span className="text-xs">🏆</span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-semibold">
                      {isTa ? 'நிலுவை' : 'Pending'}
                    </span>
                  )}
                </div>

                <div className="my-2 space-y-0.5">
                  {hasWon ? (
                    <>
                      <span className="font-bold text-xs text-amber-950 dark:text-amber-200 block truncate">
                        {winnerName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono block">
                        {winnerMemberNo}{winnerSlot ? ` • #${winnerSlot}` : ''}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 italic block">
                      {isTa ? 'குலுக்கல் நடைபெறவில்லை' : 'Draw Not Conducted'}
                    </span>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-600">
                    ₹7,55,000
                  </span>
                  <span className="text-blue-600 font-semibold text-[10px]">
                    {isTa ? 'விபரம் ➔' : 'View ➔'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOUCH-TO-VIEW: Selected Day / Lucky Draw Winner Details Modal */}
      {selectedDayInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedDayInfo(null);
          }}
        >
          <div className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-3xl p-6 w-full sm:max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">
                  {selectedDayInfo.drawInfo?.hasWinner ? '🏆' : selectedDayInfo.isPournami ? '🌕' : '📅'}
                </span>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {selectedDayInfo.dateStr}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {selectedDayInfo.drawInfo?.roundNumber
                      ? isTa
                        ? `தவணை #${selectedDayInfo.drawInfo.roundNumber} குலுக்கல் நாள்`
                        : `Collection Round #${selectedDayInfo.drawInfo.roundNumber}`
                      : isTa
                      ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் சீட்டு நாட்காட்டி'
                      : 'Sri Pattanathu Mariamman Chit Calendar'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayInfo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lucky Draw Winner Case */}
            {selectedDayInfo.drawInfo?.hasWinner ? (
              <div className="space-y-4">
                {/* Grand Winner Badge Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 text-white shadow-xl shadow-amber-500/25 border-2 border-yellow-300 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/20 pb-2 mb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-amber-100 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-yellow-200 animate-bounce" />
                      {isTa ? 'குலுக்கல் வெற்றியாளர்!' : 'Lucky Draw Winner!'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase backdrop-blur-sm">
                      {isTa ? `தவணை #${selectedDayInfo.drawInfo.roundNumber}` : `Round #${selectedDayInfo.drawInfo.roundNumber}`}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xl font-black text-white leading-tight drop-shadow-sm">
                      {selectedDayInfo.drawInfo.winner.fullName}
                    </h4>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-amber-100 font-medium">
                      <span className="px-2 py-0.5 rounded bg-black/20 font-mono font-bold">
                        {selectedDayInfo.drawInfo.winner.memberNumber}
                      </span>
                      {selectedDayInfo.drawInfo.winner.slotNumber && (
                        <>
                          <span>•</span>
                          <span>{isTa ? `டோக்கன்: #${selectedDayInfo.drawInfo.winner.slotNumber}` : `Token: #${selectedDayInfo.drawInfo.winner.slotNumber}`}</span>
                        </>
                      )}
                    </div>

                    {selectedDayInfo.drawInfo.winner.address && (
                      <div className="flex items-start gap-1.5 pt-1 text-xs text-amber-100/90">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{selectedDayInfo.drawInfo.winner.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Net Prize Amount Display */}
                  <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-100 uppercase block">
                        {isTa ? 'பட்டுவாடா பரிசுத் தொகை' : 'Net Prize Amount'}
                      </span>
                      <span className="text-2xl font-black text-yellow-200">
                        {formatINR(selectedDayInfo.drawInfo.winner.netPayoutPaise)}
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-white text-orange-600 font-bold text-xs shadow-md">
                      {isTa ? 'உறுதியானது' : 'Awarded'}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Share Button */}
                <button
                  type="button"
                  onClick={() =>
                    handleShareWinner(
                      selectedDayInfo.drawInfo.winner,
                      selectedDayInfo.drawInfo.roundNumber,
                      selectedDayInfo.dateStr
                    )
                  }
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{isTa ? 'வெற்றியாளருக்கு வாட்ஸ்அப்பில் வாழ்த்து பகிர்க' : 'Share Congratulations to WhatsApp'}</span>
                </button>
              </div>
            ) : selectedDayInfo.drawInfo?.isDrawDate ? (
              // Draw Day Pending Case
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <span>🌕 {t.pournamiFullMoon}</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-800 text-[10px] font-bold uppercase">
                      {isTa ? `தவணை #${selectedDayInfo.drawInfo?.roundNumber}` : `Round #${selectedDayInfo.drawInfo?.roundNumber}`}
                    </span>
                  </div>
                  <p className="font-semibold text-xs text-amber-700 dark:text-amber-300">
                    🎯 {t.chitDayBadge} • {isTa ? 'குலுக்கல் மற்றும் வசூல் நாள்' : 'Lucky Draw & Collection Day'}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isTa
                      ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் கோவில் வளாகத்தில் மாதாந்திர கூட்டத்தின் போது நேரலை டிஜிட்டல் குலுக்கல் சக்கரத்தை நிர்வாகி சுழற்றி வெற்றியாளரை அறிவிப்பார்.'
                      : 'During the monthly temple meeting, the administrator spins the digital lucky draw wheel to award the prize pool.'}
                  </p>
                  <div className="pt-2 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                      {isTa ? 'பரிசுத் தொகை:' : 'Prize Pool:'}
                    </span>
                    <span className="text-base font-black text-amber-800 dark:text-amber-200">
                      ₹7,55,000
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Non-Draw Day
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p>
                  {isTa
                    ? 'வழக்கமான சேமிப்பு மற்றும் வணிக நாள். இத்தேதியில் சீட்டு குலுக்கல் எதுவும் திட்டமிடப்படவில்லை.'
                    : 'Regular working and transaction day. No lucky draw is scheduled on this date.'}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                  <span>🌕 {isTa ? 'அடுத்த சீட்டு நாள்:' : 'Next Chit Day:'}</span>
                  <strong>{nextPournami.dateStr}</strong>
                </div>
              </div>
            )}

            {/* View Monthly Report Action */}
            {onOpenMonthlyReport && (
              <button
                onClick={() => {
                  const targetChit = '08';
                  const targetDate = selectedDayInfo.dateStr || '25.10.26';
                  onOpenMonthlyReport(targetChit, targetDate);
                  setSelectedDayInfo(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{isTa ? 'இத்தேதிக்கான மாதாந்திர அறிக்கையைக் காண்க' : 'View Monthly Report for this Date'}</span>
              </button>
            )}

            <button
              onClick={() => setSelectedDayInfo(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isTa ? 'மூடுக' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
