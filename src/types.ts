/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'admin' | 'operator' | 'viewer';

export interface BreakItem {
  id: string;
  afterPeriod: number; // e.g., break after period 2, 4
  duration: number; // in minutes, e.g., 15, 30
  label: string; // e.g., "Istirahat I", "Istirahat II"
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string; // e.g., "2026/2027"
  semester: number; // 1 or 2
  effectiveDays: 5 | 6; // 5 Days: Senin-Jumat, 6 Days: Senin-Sabtu
  lessonsPerDay: number; // e.g., 6 to 10 periods
  lessonDuration: number; // in minutes, default 40
  breaks: BreakItem[];
  operatorName: string;
}

export interface ClassItem {
  id: string;
  name: string; // e.g., "Kelas 1A", "Kelas 1B"
}

export interface Subject {
  id: string;
  name: string; // e.g., "Matematika", "PJOK"
  color: string; // tailwind color class prefix or simple hex (e.g., "#3b82f6")
  weeklyHours: number; // target hours per week for scheduling
}

export interface Extracurricular {
  id: string;
  name: string; // e.g., "Pramuka", "Tahfidz"
  day: number; // day index (0 = Senin, etc)
  timeStart: string; // e.g., "14:00"
  timeEnd: string; // e.g., "15:30"
}

export interface ScheduleItem {
  classId: string;
  dayIndex: number; // 0 to 5
  periodIndex: number; // 0 to lessonsPerDay - 1
  subjectId: string | null; // null represents empty/free period
  teacherName?: string;
}

export interface AcademicHoliday {
  date: string; // YYYY-MM-DD
  name: string; // Holiday name in Indonesian
  isCutiBersama: boolean;
}

export const DAYS_OF_WEEK = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu'
];

export const THEME_COLORS = [
  { name: 'Biru', value: '#3b82f6', bgClass: 'bg-blue-100 dark:bg-blue-950/40', textClass: 'text-blue-700 dark:text-blue-300', borderClass: 'border-blue-200 dark:border-blue-900/60' },
  { name: 'Hijau', value: '#10b981', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40', textClass: 'text-emerald-700 dark:text-emerald-300', borderClass: 'border-emerald-200 dark:border-emerald-900/60' },
  { name: 'Ungu', value: '#8b5cf6', bgClass: 'bg-violet-100 dark:bg-violet-950/40', textClass: 'text-violet-700 dark:text-violet-300', borderClass: 'border-violet-200 dark:border-violet-900/60' },
  { name: 'Oranye', value: '#f97316', bgClass: 'bg-orange-100 dark:bg-orange-950/40', textClass: 'text-orange-700 dark:text-orange-300', borderClass: 'border-orange-200 dark:border-orange-900/60' },
  { name: 'Merah', value: '#ef4444', bgClass: 'bg-red-100 dark:bg-red-950/40', textClass: 'text-red-700 dark:text-red-300', borderClass: 'border-red-200 dark:border-red-900/60' },
  { name: 'Sian', value: '#06b6d4', bgClass: 'bg-cyan-100 dark:bg-cyan-950/40', textClass: 'text-cyan-700 dark:text-cyan-300', borderClass: 'border-cyan-200 dark:border-cyan-900/60' },
  { name: 'Kuning', value: '#eab308', bgClass: 'bg-yellow-100 dark:bg-yellow-950/40', textClass: 'text-yellow-700 dark:text-yellow-300', borderClass: 'border-yellow-200 dark:border-yellow-900/60' },
  { name: 'Merah Muda', value: '#ec4899', bgClass: 'bg-pink-100 dark:bg-pink-950/40', textClass: 'text-pink-700 dark:text-pink-300', borderClass: 'border-pink-200 dark:border-pink-900/60' },
];
