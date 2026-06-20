/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Info,
  CalendarDays,
  ShieldCheck,
  AlertOctagon,
  Pin
} from 'lucide-react';
import { AcademicHoliday } from '../types';
import { DEFAULT_HOLIDAYS, getHolidaysForMonth } from '../holidays';

interface AcademicCalendarViewProps {
  holidays: AcademicHoliday[];
  onAddCustomHoliday?: (holiday: AcademicHoliday) => void;
  userRole: 'admin' | 'operator' | 'viewer';
}

export default function AcademicCalendarView({
  holidays,
  onAddCustomHoliday,
  userRole,
}: AcademicCalendarViewProps) {
  // Current viewed calendar date
  const [viewedDate, setViewedDate] = useState<Date>(new Date(2026, 5, 20)); // Seed at June 20, 2026 matching system local time
  const isReadOnly = userRole === 'viewer';

  // State for Custom Holiday creator form
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newHolidayDate, setNewHolidayDate] = useState('2026-06-25');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayCuti, setNewHolidayCuti] = useState(false);

  // Month navigation helpers
  const handlePrevMonth = () => {
    setViewedDate(new Date(viewedDate.getFullYear(), viewedDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewedDate(new Date(viewedDate.getFullYear(), viewedDate.getMonth() + 1, 1));
  };

  const handleBackToToday = () => {
    setViewedDate(new Date(2026, 5, 20)); // lock to 2026 June
  };

  const currentYear = viewedDate.getFullYear();
  const currentMonth = viewedDate.getMonth();

  // Month metadata calculations for grid rendering
  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Get day index of the first day (0 = Minggu, 1 = Senin, ... 6 = Sabtu)
    // We want Monday (Senin) to be the first column, so we align index to (day + 6) % 7
    let firstDayIndex = firstDayOfMonth.getDay(); 
    // Align so 0 = Senin, 6 = Minggu
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDaysInMonth = lastDayOfMonth.getDate();

    const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isSunday: boolean }[] = [];

    // 1. Previous Month Overflow days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isSunday: new Date(prevYear, prevMonth, dayNum).getDay() === 0
      });
    }

    // 2. Current Month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      cells.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: true,
        isSunday: new Date(currentYear, currentMonth, dayNum).getDay() === 0
      });
    }

    // 3. Next Month Overflow days to complete the calendar square grid of 42 cells (6 rows x 7 days)
    const remainingSlots = 42 - cells.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      cells.push({
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isSunday: new Date(nextYear, nextMonth, i).getDay() === 0
      });
    }

    return cells;
  }, [currentYear, currentMonth]);

  // Retrieve matching active holidays for month view
  const monthHolidays = holidays.filter(h => {
    const p = h.date.split('-');
    return Number(p[0]) === currentYear && Number(p[1]) === (currentMonth + 1);
  });

  // Handle addition of custom holidays (e.g. Libur Semester, Libur Sekolah Khusus)
  const handleAddCustomHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !onAddCustomHoliday || !newHolidayName.trim()) return;

    onAddCustomHoliday({
      date: newHolidayDate,
      name: `*Libur Sekolah: ${newHolidayName.trim()}`,
      isCutiBersama: newHolidayCuti
    });

    setNewHolidayName('');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-950/65 text-indigo-600 rounded-xl">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Kalender Akademik & Hari Libur</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Integrasi Kalender Hub Indonesia otomatis. Mencegah pembuatan jam sekolah di hari libur nasional atau cuti bersama.
            </p>
          </div>
        </div>

        {onAddCustomHoliday && !isReadOnly && (
          <button
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            {showCustomForm ? 'Tutup Form' : 'Tambah Libur Sekolah/Lokal'}
          </button>
        )}
      </div>

      {showCustomForm && (
        <form onSubmit={handleAddCustomHolidaySubmit} className="bg-indigo-50/50 dark:bg-slate-850 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 max-w-xl space-y-4">
          <h4 className="font-bold text-xs text-indigo-900 dark:text-indigo-300 uppercase tracking-wider">Tambah Aturan Libur Khusus</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Tanggal Libur</label>
              <input
                type="date"
                required
                value={newHolidayDate}
                onChange={(e) => setNewHolidayDate(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Nama / Keterangan Libur</label>
              <input
                type="text"
                required
                placeholder="Contoh: Libur Akhir Semester Ganjil"
                value={newHolidayName}
                onChange={(e) => setNewHolidayName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-lg outline-none text-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cuti-bersama-chk"
              checked={newHolidayCuti}
              onChange={(e) => setNewHolidayCuti(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-indigo-600"
            />
            <label htmlFor="cuti-bersama-chk" className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
              Set sebagai Cuti Bersama (Berwarna kuning-oranye)
            </label>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Simpan Aturan Libur
          </button>
        </form>
      )}

      {/* Main calendar grid layout and sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Calendar Left Frame */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl shadow-xs lg:col-span-2 space-y-4">
          
          {/* Header Month Navigator bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-base">
              {viewedDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </h3>

            <div className="flex gap-1.5 text-xs">
              <button
                onClick={handlePrevMonth}
                className="p-2 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleBackToToday}
                className="px-3 py-2 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer font-semibold"
              >
                Juni 2026
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 border border-slate-150 rounded-lg hover:bg-slate-50 text-slate-600 dark:border-slate-800 dark:text-slate-300 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days Name row */}
          <div className="grid grid-cols-7 text-center text-xs font-bold text-slate-400 py-1 font-sans">
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span className="text-amber-650">Sab</span>
            <span className="text-red-500">Min</span>
          </div>

          {/* Grid Cells container */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              // Find matching holiday for details
              const matchingHoliday = holidays.find(h => h.date === cell.dateStr);
              const isToday = cell.dateStr === '2026-06-20'; // seed system date 

              // Color styles:
              // Red for Sundays & Holidays (Tanggal Merah)
              // Orange and Yellow for Cuti Bersama
              const isHolidayRed = cell.isSunday || (matchingHoliday && !matchingHoliday.isCutiBersama);
              const isCutiYellow = matchingHoliday && matchingHoliday.isCutiBersama;

              return (
                <div
                  key={idx}
                  className={`min-h-18 p-1.5 border rounded-lg flex flex-col justify-between transition-all group relative ${
                    cell.isCurrentMonth 
                      ? 'bg-transparent border-slate-100 dark:border-slate-800/60' 
                      : 'bg-slate-50/40 border-slate-100/50 dark:bg-slate-850/20 text-slate-300 dark:text-slate-700'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 bg-blue-50/20' : ''}`}
                >
                  <div className="flex justify-between items-start">
                    <span 
                      className={`text-xs font-mono font-bold leading-none ${
                        isHolidayRed 
                          ? 'text-red-500' 
                          : isCutiYellow 
                          ? 'text-amber-500' 
                          : cell.isCurrentMonth
                          ? 'text-slate-800 dark:text-slate-300'
                          : 'text-slate-350 dark:text-slate-650'
                      }`}
                    >
                      {cell.dayNumber}
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" title="Hari Ini" />
                    )}
                  </div>

                  {/* Holiday title tiny block inside cell */}
                  {matchingHoliday && (
                    <div 
                      className={`px-1 py-0.5 rounded text-[8px] leading-tight truncate w-full ${
                        matchingHoliday.isCutiBersama
                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200/30'
                      }`}
                      title={matchingHoliday.name}
                    >
                      {matchingHoliday.name.replace('*Libur Sekolah: ', '')}
                    </div>
                  )}

                  {/* Informational Tooltip bubble on Hover */}
                  {matchingHoliday && (
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-20 bg-slate-900 text-white text-[10px] p-2 rounded-md shadow-xl w-40 text-center leading-normal">
                      <p className="font-bold">{matchingHoliday.name}</p>
                      <p className="text-[8px] text-slate-300 font-mono mt-0.5">{matchingHoliday.date}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-805 flex flex-wrap gap-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest justify-center">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-red-500 rounded border"></span>
              <span>Hari Libur Nasional / Ahad</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-amber-500 rounded border"></span>
              <span>Cuti Bersama Nasional</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-blue-500 rounded border"></span>
              <span>Sistem Hari Ini</span>
            </div>
          </div>
        </div>

        {/* Calendar Right Directory sidebar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <CalendarDays className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Direktori Libur Aktif</h3>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {monthHolidays.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <Info className="w-5 h-5 text-slate-300 mx-auto mb-2" />
                Tidak ada hari libur nasional atau sekolah di bulan ini.
              </div>
            ) : (
              monthHolidays.map((holiday, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded-lg border text-xs flex gap-3 items-center ${
                    holiday.isCutiBersama
                      ? 'bg-amber-50/60 dark:bg-amber-955/20 border-amber-100 text-amber-900'
                      : holiday.name.startsWith('*Libur Sekolah')
                      ? 'bg-indigo-50/50 dark:bg-slate-850/60 border-indigo-100 text-indigo-900 dark:text-indigo-300'
                      : 'bg-red-50/50 dark:bg-red-955/20 border-red-100 text-red-900 dark:text-red-405'
                  }`}
                >
                  <div className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded font-bold font-mono text-center">
                    {holiday.date.split('-')[2]}
                  </div>
                  <div>
                    <h5 className="font-bold leading-tight">{holiday.name}</h5>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {holiday.isCutiBersama ? 'Cuti Bersama' : 'Libur Nasional'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-3 bg-blue-50/50 dark:bg-slate-850/65 rounded-xl border border-blue-105/30 text-[11px] leading-relaxed text-slate-550 dark:text-slate-400 flex gap-2">
            <AlertOctagon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>Jadwal Sekolah otomatis memblokir penempatan materi pelajaran pada deretan waktu libur nasional di atas.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
