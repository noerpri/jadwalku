/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  BookOpen, 
  Activity, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Users, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { SchoolSettings, ClassItem, Subject, Extracurricular, ScheduleItem, AcademicHoliday } from '../types';
import { getHolidayForDate } from '../holidays';

interface DashboardProps {
  settings: SchoolSettings;
  classes: ClassItem[];
  subjects: Subject[];
  extracurriculars: Extracurricular[];
  schedules: ScheduleItem[];
  holidays: AcademicHoliday[];
  userRole: 'admin' | 'operator' | 'viewer';
  onChangeRole: (role: 'admin' | 'operator' | 'viewer') => void;
  onNavigate: (tab: string) => void;
}

export default function Dashboard({
  settings,
  classes,
  subjects,
  extracurriculars,
  schedules,
  holidays,
  userRole,
  onChangeRole,
  onNavigate,
}: DashboardProps) {
  // Calculations
  const totalClasses = classes.length;
  const totalSubjects = subjects.length;
  const totalEkskul = Array.isArray(extracurriculars) ? extracurriculars.length : 0;
  
  // Total schedules that are actually scheduled (not null)
  const scheduledCount = schedules.filter(s => s.subjectId !== null).length;
  const totalPossibleSlots = totalClasses * settings.effectiveDays * settings.lessonsPerDay;
  const schedulePercentage = totalPossibleSlots > 0 
    ? Math.round((scheduledCount / totalPossibleSlots) * 100) 
    : 0;

  // Find nearest upcoming national holiday
  const todayStr = new Date().toISOString().split('07:00')[0]; // simple local date match, default to June 20, 2026
  
  const upcomingHolidays = holidays
    .filter(h => h.date >= '2026-06-20') // filter onwards from current date in metadata (2026-06-20)
    .sort((a, b) => a.date.localeCompare(b.date));
  
  const nearestHoliday = upcomingHolidays[0];

  // Calculate schedule coverage per class
  const classStats = classes.map(cl => {
    const classSchedules = schedules.filter(s => s.classId === cl.id && s.subjectId !== null);
    const classTarget = settings.effectiveDays * settings.lessonsPerDay;
    const pct = classTarget > 0 ? Math.round((classSchedules.length / classTarget) * 100) : 0;
    return { name: cl.name, percent: pct, count: classSchedules.length };
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 md:p-8 text-white shadow-xl shadow-blue-100 dark:shadow-none transition-all relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md mb-2">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Tahun Pelajaran {settings.academicYear} • Semester {settings.semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
            Selamat Datang di JADWALKU!
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Asisten cerdas penyusun jadwal pelajaran otomatis untuk <span className="font-semibold">{settings.schoolName}</span>. 
            Membantu operator kurikulum menyusun jadwal kelas bebas bentrok dalam hitungan detik.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('settings')}
              className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-medium text-xs md:text-sm rounded-xl shadow-md transition-all cursor-pointer"
            >
              Kelola Data & Sekolah
            </button>
            <button
              onClick={() => onNavigate('scheduler')}
              className="px-4 py-2 bg-blue-500/30 hover:bg-blue-500/40 border border-white/20 text-white font-medium text-xs md:text-sm rounded-xl transition-all cursor-pointer"
            >
              Kelola Jadwal Pelajaran
            </button>
          </div>
        </div>
      </div>

      {/* Role Manager Badge Widget for Admin Control Demo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Akses Akun Pengguna</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Pilih peran akun untuk menguji tingkat hak akses aplikasi secara realtime.</p>
          </div>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-stretch md:self-auto">
          {(['admin', 'operator', 'viewer'] as const).map((role) => (
            <button
              key={role}
              onClick={() => onChangeRole(role)}
              className={`flex-1 md:flex-none px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                userRole === role
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {role === 'admin' ? 'Administrator' : role === 'operator' ? 'Operator' : 'Viewer'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Classes Stat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Rombel</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalClasses}</h4>
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">Rombongan Belajar</span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Subjects Stat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mata Pelajaran</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalSubjects}</h4>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Mata Pelajaran Aktif</span>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Extra Stat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ekstrakurikuler</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{totalEkskul}</h4>
            <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">Kegiatan Aktif</span>
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Schedules Stat */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 p-5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Jadwal Terisi</p>
            <h4 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{schedulePercentage}%</h4>
            <span className="text-[11px] text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/40 px-2 py-0.5 rounded">{scheduledCount} / {totalPossibleSlots} jam terisi</span>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Schedule completion and density */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Progress Penyusunan Jadwal Kelas</h3>
            <span className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
              {settings.effectiveDays} Hari Efektif
            </span>
          </div>

          <div className="space-y-4">
            {classStats.map((st, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-700 dark:text-slate-300">{st.name}</span>
                  <span className="text-slate-500 dark:text-slate-450">{st.count} JP / {settings.effectiveDays * settings.lessonsPerDay} JP ({st.percent}%)</span>
                </div>
                {/* Custom Tailwind CSS bar graph */}
                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      st.percent === 100 
                        ? 'bg-emerald-500' 
                        : st.percent > 70 
                        ? 'bg-blue-500' 
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${st.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
              <span>100% Selesai</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
              <span>&gt;70% Terjadwal</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
              <span>&lt;70% Draf</span>
            </div>
          </div>
        </div>

        {/* Right Column - Academic Calendar Insight */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Info Libur Akademik</h3>
          </div>

          {nearestHoliday ? (
            <div className="bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/60 rounded-xl p-4 text-center space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/60 text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-widest">
                Hari Libur Terdekat
              </span>
              <h4 className="font-bold text-red-900 dark:text-red-400 text-sm leading-snug">
                {nearestHoliday.name}
              </h4>
              <p className="text-xs text-red-600/80 dark:text-red-300/85">
                {new Date(nearestHoliday.date).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {nearestHoliday.isCutiBersama && (
                <span className="inline-block text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                  *Cuti Bersama Nasional
                </span>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-xs">
              Tidak ada hari libur terdekat.
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-650 dark:text-slate-400 uppercase tracking-wider">Libur Nasional Bulan Ini</h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {upcomingHolidays.slice(0, 3).map((holiday, idx) => (
                <div key={idx} className="flex gap-2.5 items-start text-xs border-b border-dashed border-slate-100 dark:border-slate-800 pb-2">
                  <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-1 rounded text-center min-w-12 font-semibold font-mono">
                    {holiday.date.split('-')[2]}/{holiday.date.split('-')[1]}
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-800 dark:text-slate-255 leading-none">{holiday.name}</h5>
                    <span className="text-[10px] text-slate-500">{holiday.isCutiBersama ? 'Cuti Bersama' : 'Tanggal Merah'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => onNavigate('calendar')}
            className="w-full text-center py-2.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 transition-all cursor-pointer"
          >
            Lihat Kalender Akademik Lengkap
          </button>
        </div>
      </div>
    </div>
  );
}
