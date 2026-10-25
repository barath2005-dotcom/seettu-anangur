import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import {
  getLunarMonthCalendar,
  getNextPournami,
  getYearlyLunarSchedule,
  translations,
  SupportedLanguage,
} from '@seettu/shared';
import { api } from '../services/api';

interface ChitCalendarProps {
  lang: SupportedLanguage;
  onOpenMonthlyReport?: (chitNo: string, date: string) => void;
}

export const ChitCalendar: React.FC<ChitCalendarProps> = ({ lang, onOpenMonthlyReport }) => {
  const t = translations[lang];

  // Selected calendar view (defaults to today / Oct 2026)
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDayInfo, setSelectedDayInfo] = useState<any>(null);
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

  useEffect(() => {
    api.getMonthlyReportDates()
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

  const monthCalendar = getLunarMonthCalendar(currentYear, currentMonth, today);
  const nextPournami = getNextPournami(today);
  const yearlySchedule = getYearlyLunarSchedule(currentYear);

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

  return (
    <div className="space-y-6">
      {/* Top Auspicious Countdown Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Chit Draw Day (Pournami) */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none text-8xl">
            🌕
          </div>
          <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{t.nextChitDay}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold">{nextPournami.dateStr}</span>
            <span className="px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-bold">
              {nextPournami.isToday
                ? lang === 'ta' ? 'இன்று!' : 'Today!'
                : `${nextPournami.daysRemaining} ${t.daysRemaining}`}
            </span>
          </div>
          <p className="mt-2 text-xs text-amber-100/90 leading-relaxed font-medium">
            🎯 {lang === 'ta' ? 'மாதாந்திர சீட்டு குலுக்கல், ஏலம் மற்றும் புதிய தவணை வசூல் நடைபெறும் நாள்.' : 'Monthly lucky draw, auction, and contribution collection day.'}
          </p>
        </div>

        {/* Temple Chit Guidelines */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#131B2E] border border-amber-200 dark:border-amber-800/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>🛕 {lang === 'ta' ? 'சீட்டு வழிமுறைகள்' : 'Chit Fund Tradition'}</span>
            </div>
            <h3 className="mt-2 text-sm font-bold text-slate-800 dark:text-white">
              {lang === 'ta' ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர்' : 'Sri Pattanathu Mariamman Anangur'}
            </h3>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {lang === 'ta'
                ? 'அனைத்து சுழற்சி சீட்டு குலுக்கல், ஏலம் மற்றும் புதிய தவணை வசூல்கள் மாதந்தோறும் பௌர்ணமி நாளன்று நடைபெறும்.'
                : 'All monthly rotational chit draws, auctions, and collections are held exclusively on every Full Moon day (Pournami).'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">
              🌕 {lang === 'ta' ? 'மாதாந்திர தவணை நாள்:' : 'Monthly Draw Day:'} <strong className="text-amber-700 dark:text-amber-400">{t.pournamiFullMoon}</strong>
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
                {lang === 'ta' ? 'சேமிக்கப்பட்ட மாதாந்திர சீட்டு அறிக்கைகள்' : 'Saved Official Monthly Reports'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'ta'
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
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2F7BFF] to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
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
              {t.calendarSubtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={jumpToToday}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              {lang === 'ta' ? 'இன்று' : 'Today'}
            </button>
            <button
              onClick={prevMonth}
              aria-label="Previous month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              aria-label="Next month"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-sm"></span>
            <span className="text-amber-800 dark:text-amber-300 font-bold">🌕 {t.pournamiFullMoon} — {t.chitDayBadge}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full border-2 border-blue-500"></span>
            <span className="text-blue-600 dark:text-blue-400">{lang === 'ta' ? 'இன்றைய நாள்' : 'Today'}</span>
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
            const isChitDay = d.isPournami;

            return (
              <div
                key={d.dateStr}
                onClick={() => setSelectedDayInfo(d)}
                className={`h-24 p-2 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                  isChitDay
                    ? 'bg-gradient-to-br from-amber-50 to-amber-100/90 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-400/40'
                    : d.isToday
                    ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-400 dark:border-blue-600 ring-2 ring-blue-500/20'
                    : 'bg-white dark:bg-[#1E293B] border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {/* Header row: Day Number & Moon Icon */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-extrabold ${
                      isChitDay
                        ? 'text-amber-800 dark:text-amber-300 text-sm'
                        : d.isToday
                        ? 'text-blue-600 dark:text-blue-400 font-black'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.day}
                  </span>

                  {isChitDay && (
                    <span className="text-base animate-pulse" title="Full Moon / Pournami">
                      🌕
                    </span>
                  )}
                </div>

                {/* Event Pill / Badge */}
                <div>
                  {isChitDay && (
                    <div className="space-y-0.5">
                      <div className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[9px] font-bold text-center truncate shadow-sm">
                        {lang === 'ta' ? 'சீட்டு நாள்' : 'Chit Day'}
                      </div>
                      {onOpenMonthlyReport && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenMonthlyReport('08', '25.10.26');
                          }}
                          className="w-full px-1 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-[8px] font-bold text-center truncate shadow-xs flex items-center justify-center gap-0.5"
                          title="Open Monthly Report"
                        >
                          <FileText className="w-2.5 h-2.5" />
                          <span>{lang === 'ta' ? 'அறிக்கை' : 'Report'}</span>
                        </button>
                      )}
                    </div>
                  )}
                  {d.isToday && !isChitDay && (
                    <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 block text-center">
                      {lang === 'ta' ? 'இன்று' : 'Today'}
                    </span>
                  )}
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
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t.yearlyLunarSchedule} ({currentYear})
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
                <th className="py-3 px-4">{lang === 'ta' ? 'மாதம்' : 'Month'}</th>
                <th className="py-3 px-4">🌕 {t.pournamiFullMoon} ({t.chitDayBadge})</th>
                <th className="py-3 px-4">{lang === 'ta' ? 'நிலை' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {yearlySchedule.map((row) => {
                const isCurrentMonthRow = row.monthIndex === today.getMonth() && currentYear === today.getFullYear();
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
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">
                          {lang === 'ta' ? 'சீட்டு குலுக்கல்' : 'Chit Draw'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {isCurrentMonthRow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          {lang === 'ta' ? 'நடப்பு மாதம்' : 'Current Month'}
                        </span>
                      ) : row.monthIndex < today.getMonth() && currentYear <= today.getFullYear() ? (
                        <span className="text-slate-400 text-[11px]">
                          {lang === 'ta' ? 'முடிவடைந்தது' : 'Completed'}
                        </span>
                      ) : (
                        <span className="text-blue-600 dark:text-blue-400 text-[11px]">
                          {lang === 'ta' ? 'வரவிருக்கிறது' : 'Upcoming'}
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

      {/* Selected Day Details Modal */}
      {selectedDayInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-[#1E293B] rounded-t-3xl sm:rounded-2xl p-6 w-full sm:max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {selectedDayInfo.dateStr}
              </span>
              <span className="text-3xl">
                {selectedDayInfo.isPournami ? '🌕' : '📅'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {selectedDayInfo.isPournami ? (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                  <p className="font-bold text-sm">🌕 {t.pournamiFullMoon}</p>
                  <p className="mt-1 font-semibold text-amber-700 dark:text-amber-300">
                    🎯 {t.chitDayBadge}
                  </p>
                  <p className="mt-1 text-slate-600 dark:text-slate-400">
                    {lang === 'ta'
                      ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் சீட்டு குழுவின் மாதாந்திர ஏலம், குலுக்கல் மற்றும் தவணை வசூல் நடைபெறும் நாள்.'
                      : 'Monthly lucky draw and collection auction day for Sri Pattanathu Mariamman Seettu Kuzhu.'}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 py-2">
                  {lang === 'ta'
                    ? 'வழக்கமான சேமிப்பு மற்றும் வணிக நாள்.'
                    : 'Regular working and transaction day.'}
                </p>
              )}
            </div>

            {onOpenMonthlyReport && (
              <button
                onClick={() => {
                  const targetChit = '08';
                  const targetDate = selectedDayInfo.dateStr || '25.10.26';
                  onOpenMonthlyReport(targetChit, targetDate);
                  setSelectedDayInfo(null);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'ta' ? 'இத்தேதிக்கான மாதாந்திர அறிக்கையைக் காண்க' : 'View Monthly Report for this Date'}</span>
              </button>
            )}

            <button
              onClick={() => setSelectedDayInfo(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-white text-xs font-bold transition-colors"
            >
              {lang === 'ta' ? 'மூடுக' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
