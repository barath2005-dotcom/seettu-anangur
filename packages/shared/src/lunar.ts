/**
 * Lunar (Panchangam) calculations for Pournami (Full Moon) and Amavasai (No Moon)
 * Aligned with Tamil Nadu temple and chit fund schedules (Asia/Kolkata timezone).
 */

export interface LunarDayInfo {
  day: number;
  dateStr: string; // YYYY-MM-DD
  isPournami: boolean;
  isAmavasai: boolean;
  isChitDay: boolean; // Same as isPournami
  isToday: boolean;
  phaseDays: number;
}

export interface LunarMonthSummary {
  year: number;
  monthIndex: number; // 0-11
  monthName: string;
  pournamiDay: number | null;
  amavasaiDay: number | null;
  pournamiDateStr: string | null;
  amavasaiDateStr: string | null;
  days: LunarDayInfo[];
}

export interface UpcomingLunarEvent {
  date: Date;
  dateStr: string;
  day: number;
  monthName: string;
  year: number;
  daysRemaining: number;
  isToday: boolean;
  type: 'POURNAMI' | 'AMAVASAI';
}

const SYNODIC_MONTH = 29.53058867;
// Reference New Moon: 2000-01-06 18:14 UTC (23:44 IST)
const REF_NEW_MOON = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));

/**
 * Calculates moon phase age in days (0 = New Moon, ~14.765 = Full Moon)
 */
export function getMoonPhaseDays(date: Date): number {
  const diffDays = (date.getTime() - REF_NEW_MOON.getTime()) / (1000 * 60 * 60 * 24);
  return ((diffDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
}

/**
 * Finds the exact Pournami and Amavasai days for any month and year (Asia/Kolkata noon).
 */
export function getMonthLunarEvents(year: number, monthIndex: number): {
  pournamiDay: number | null;
  amavasaiDay: number | null;
} {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const days: { day: number; phase: number }[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    // 12:00 IST = 06:30 UTC
    const dt = new Date(Date.UTC(year, monthIndex, d, 6, 30, 0));
    days.push({ day: d, phase: getMoonPhaseDays(dt) });
  }

  let pournamiDay: number | null = null;
  let minPournamiDist = 999;
  let amavasaiDay: number | null = null;
  let minAmavasaiDist = 999;

  for (const item of days) {
    const pDist = Math.abs(item.phase - 14.765);
    if (pDist < minPournamiDist && pDist < 0.9) {
      minPournamiDist = pDist;
      pournamiDay = item.day;
    }
    const aDist = Math.min(item.phase, Math.abs(item.phase - SYNODIC_MONTH));
    if (aDist < minAmavasaiDist && aDist < 0.9) {
      minAmavasaiDist = aDist;
      amavasaiDay = item.day;
    }
  }

  return { pournamiDay, amavasaiDay };
}

/**
 * Generates the full day array for a given calendar month
 */
export function getLunarMonthCalendar(year: number, monthIndex: number, todayRef = new Date()): LunarMonthSummary {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const { pournamiDay, amavasaiDay } = getMonthLunarEvents(year, monthIndex);
  const monthName = new Date(year, monthIndex, 1).toLocaleString('en-US', { month: 'long' });

  const todayYear = todayRef.getFullYear();
  const todayMonth = todayRef.getMonth();
  const todayDate = todayRef.getDate();

  const days: LunarDayInfo[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(Date.UTC(year, monthIndex, d, 6, 30, 0));
    const phase = getMoonPhaseDays(dt);
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    const isPournami = d === pournamiDay;
    const isAmavasai = d === amavasaiDay;
    const isToday = year === todayYear && monthIndex === todayMonth && d === todayDate;

    days.push({
      day: d,
      dateStr,
      isPournami,
      isAmavasai,
      isChitDay: isPournami,
      isToday,
      phaseDays: phase,
    });
  }

  const pad = (n: number | null) => (n ? String(n).padStart(2, '0') : null);
  const mm = String(monthIndex + 1).padStart(2, '0');

  return {
    year,
    monthIndex,
    monthName,
    pournamiDay,
    amavasaiDay,
    pournamiDateStr: pournamiDay ? `${year}-${mm}-${pad(pournamiDay)}` : null,
    amavasaiDateStr: amavasaiDay ? `${year}-${mm}-${pad(amavasaiDay)}` : null,
    days,
  };
}

/**
 * Finds the upcoming Pournami (Full Moon / Chit Day) from a reference date
 */
export function getNextPournami(from = new Date()): UpcomingLunarEvent {
  const todayMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let currentYear = from.getFullYear();
  let currentMonth = from.getMonth();

  for (let offset = 0; offset < 12; offset++) {
    const targetMonth = (currentMonth + offset) % 12;
    const targetYear = currentYear + Math.floor((currentMonth + offset) / 12);
    const { pournamiDay } = getMonthLunarEvents(targetYear, targetMonth);

    if (pournamiDay) {
      const pDate = new Date(targetYear, targetMonth, pournamiDay);
      const diffMs = pDate.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        const mm = String(targetMonth + 1).padStart(2, '0');
        const dd = String(pournamiDay).padStart(2, '0');
        const mName = pDate.toLocaleString('en-US', { month: 'short' });
        return {
          date: pDate,
          dateStr: `${targetYear}-${mm}-${dd}`,
          day: pournamiDay,
          monthName: mName,
          year: targetYear,
          daysRemaining: diffDays,
          isToday: diffDays === 0,
          type: 'POURNAMI',
        };
      }
    }
  }

  // Fallback
  return {
    date: new Date(),
    dateStr: from.toISOString().split('T')[0],
    day: from.getDate(),
    monthName: 'Unknown',
    year: currentYear,
    daysRemaining: 0,
    isToday: true,
    type: 'POURNAMI',
  };
}

/**
 * Finds the upcoming Amavasai (No Moon Day) from a reference date
 */
export function getNextAmavasai(from = new Date()): UpcomingLunarEvent {
  const todayMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let currentYear = from.getFullYear();
  let currentMonth = from.getMonth();

  for (let offset = 0; offset < 12; offset++) {
    const targetMonth = (currentMonth + offset) % 12;
    const targetYear = currentYear + Math.floor((currentMonth + offset) / 12);
    const { amavasaiDay } = getMonthLunarEvents(targetYear, targetMonth);

    if (amavasaiDay) {
      const aDate = new Date(targetYear, targetMonth, amavasaiDay);
      const diffMs = aDate.getTime() - todayMidnight.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays >= 0) {
        const mm = String(targetMonth + 1).padStart(2, '0');
        const dd = String(amavasaiDay).padStart(2, '0');
        const mName = aDate.toLocaleString('en-US', { month: 'short' });
        return {
          date: aDate,
          dateStr: `${targetYear}-${mm}-${dd}`,
          day: amavasaiDay,
          monthName: mName,
          year: targetYear,
          daysRemaining: diffDays,
          isToday: diffDays === 0,
          type: 'AMAVASAI',
        };
      }
    }
  }

  // Fallback
  return {
    date: new Date(),
    dateStr: from.toISOString().split('T')[0],
    day: from.getDate(),
    monthName: 'Unknown',
    year: currentYear,
    daysRemaining: 0,
    isToday: true,
    type: 'AMAVASAI',
  };
}

/**
 * Returns all Pournami and Amavasai dates for an entire year
 */
export function getYearlyLunarSchedule(year: number) {
  const schedule: {
    monthIndex: number;
    monthName: string;
    pournamiDay: number | null;
    pournamiDateStr: string | null;
    amavasaiDay: number | null;
    amavasaiDateStr: string | null;
  }[] = [];

  for (let m = 0; m < 12; m++) {
    const { pournamiDay, amavasaiDay } = getMonthLunarEvents(year, m);
    const mName = new Date(year, m, 1).toLocaleString('en-US', { month: 'long' });
    const mm = String(m + 1).padStart(2, '0');

    schedule.push({
      monthIndex: m,
      monthName: mName,
      pournamiDay,
      pournamiDateStr: pournamiDay ? `${year}-${mm}-${String(pournamiDay).padStart(2, '0')}` : null,
      amavasaiDay,
      amavasaiDateStr: amavasaiDay ? `${year}-${mm}-${String(amavasaiDay).padStart(2, '0')}` : null,
    });
  }

  return schedule;
}
