/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AcademicHoliday } from './types';

// Static database of Indonesian National Holidays & Cuti Bersama (2026 & 2027)
export const DEFAULT_HOLIDAYS: AcademicHoliday[] = [
  // 2026 Holidays
  { date: '2026-01-01', name: 'Tahun Baru 2026 Masehi', isCutiBersama: false },
  { date: '2026-01-28', name: 'Tahun Baru Imlek 2577 Kongzili', isCutiBersama: false },
  { date: '2026-02-15', name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', isCutiBersama: false },
  { date: '2026-03-20', name: 'Cuti Bersama Hari Suci Nyepi', isCutiBersama: true },
  { date: '2026-03-20', name: 'Wafat Isa Almasih (Paskah)', isCutiBersama: false },
  { date: '2026-04-18', name: 'Hari Raya Idul Fitri 1447 H (Hari 1)', isCutiBersama: false },
  { date: '2026-04-19', name: 'Hari Raya Idul Fitri 1447 H (Hari 2)', isCutiBersama: false },
  { date: '2026-04-20', name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  { date: '2026-04-21', name: 'Cuti Bersama Idul Fitri 1447 H', isCutiBersama: true },
  { date: '2026-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
  { date: '2026-05-14', name: 'Kenaikan Isa Almasih', isCutiBersama: false },
  { date: '2026-05-31', name: 'Hari Raya Waisak 2570 BE', isCutiBersama: false },
  { date: '2026-06-01', name: 'Hari Lahir Pancasila', isCutiBersama: false },
  { date: '2026-05-29', name: 'Cuti Bersama Hari Raya Waisak', isCutiBersama: true },
  { date: '2026-06-15', name: 'Hari Raya Idul Adha 1447 H', isCutiBersama: false },
  { date: '2026-06-16', name: 'Cuti Bersama Hari Raya Idul Adha', isCutiBersama: true },
  { date: '2026-07-16', name: 'Tahun Baru Islam 1448 H', isCutiBersama: false },
  { date: '2026-08-17', name: 'Hari Kemerdekaan Republik Indonesia ke-81', isCutiBersama: false },
  { date: '2026-09-15', name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2026-12-25', name: 'Hari Raya Natal', isCutiBersama: false },
  { date: '2026-12-26', name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },

  // 2027 Holidays
  { date: '2027-01-01', name: 'Tahun Baru 2027 Masehi', isCutiBersama: false },
  { date: '2027-02-06', name: 'Tahun Baru Imlek 2578 Kongzili', isCutiBersama: false },
  { date: '2027-02-05', name: 'Isra Mikraj Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2027-03-08', name: 'Hari Suci Nyepi (Tahun Baru Saka 1949)', isCutiBersama: false },
  { date: '2027-03-26', name: 'Wafat Isa Almasih', isCutiBersama: false },
  { date: '2027-04-06', name: 'Hari Raya Idul Fitri 1448 H (Hari 1)', isCutiBersama: false },
  { date: '2027-04-07', name: 'Hari Raya Idul Fitri 1448 H (Hari 2)', isCutiBersama: false },
  { date: '2027-04-05', name: 'Cuti Bersama Hari Raya Idul Fitri 1448 H', isCutiBersama: true },
  { date: '2027-04-08', name: 'Cuti Bersama Hari Raya Idul Fitri 1448 H', isCutiBersama: true },
  { date: '2027-05-01', name: 'Hari Buruh Internasional', isCutiBersama: false },
  { date: '2027-05-06', name: 'Kenaikan Isa Almasih', isCutiBersama: false },
  { date: '2027-05-20', name: 'Hari Raya Waisak 2571 BE', isCutiBersama: false },
  { date: '2027-06-01', name: 'Hari Lahir Pancasila', isCutiBersama: false },
  { date: '2027-06-15', name: 'Hari Raya Idul Adha 1448 H', isCutiBersama: false },
  { date: '2027-08-17', name: 'Hari Kemerdekaan Republik Indonesia ke-82', isCutiBersama: false },
  { date: '2027-09-04', name: 'Maulid Nabi Muhammad SAW', isCutiBersama: false },
  { date: '2027-12-25', name: 'Hari Raya Natal', isCutiBersama: false },
  { date: '2027-12-26', name: 'Cuti Bersama Hari Raya Natal', isCutiBersama: true },
];

/**
 * Check if a specific date (YYYY-MM-DD) is a holiday or Sunday or Saturday
 * depending on school arrangements.
 */
export function getHolidayForDate(dateStr: string, activeHolidays: AcademicHoliday[] = DEFAULT_HOLIDAYS): AcademicHoliday | null {
  const match = activeHolidays.find(h => h.date === dateStr);
  if (match) return match;
  return null;
}

/**
 * Get display list of monthly holidays for Indonesian School Academic Calendar
 */
export function getHolidaysForMonth(year: number, monthZeroIndexed: number, activeHolidays: AcademicHoliday[] = DEFAULT_HOLIDAYS): AcademicHoliday[] {
  const monthStr = String(monthZeroIndexed + 1).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  return activeHolidays
    .filter(h => h.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}
