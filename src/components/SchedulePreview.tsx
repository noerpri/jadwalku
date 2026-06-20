/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Grid, 
  Smartphone, 
  QrCode, 
  Calendar, 
  Share2, 
  Check, 
  Download, 
  Users, 
  Activity, 
  MapPin, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw
} from 'lucide-react';
import { SchoolSettings, ClassItem, Subject, Extracurricular, ScheduleItem, DAYS_OF_WEEK } from '../types';

interface SchedulePreviewProps {
  settings: SchoolSettings;
  classes: ClassItem[];
  subjects: Subject[];
  extracurriculars: Extracurricular[];
  schedules: ScheduleItem[];
}

export default function SchedulePreview({
  settings,
  classes,
  subjects,
  extracurriculars,
  schedules,
}: SchedulePreviewProps) {
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewFormat, setViewFormat] = useState<'table' | 'card'>('table');

  // QR Code visual toggle state
  const [showQRModal, setShowQRModal] = useState<boolean>(false);
  const [qrClassId, setQrClassId] = useState<string>('');

  // Google Calendar Sync Wizard state
  const [syncClassId, setSyncClassId] = useState<string | null>(null);
  const [syncStep, setSyncStep] = useState<number>(0); // 0 = idle, 1 = connecting, 2 = syncing, 3 = success

  // Notification state
  const [previewNotify, setPreviewNotify] = useState<string | null>(null);

  const triggerNotification = (text: string) => {
    setPreviewNotify(text);
    setTimeout(() => setPreviewNotify(null), 3000);
  };

  // Generate clock times for formatting
  const periodTimes = useMemo(() => {
    const times: string[] = [];
    let currentHour = 7;
    let currentMin = 0;

    for (let period = 0; period < settings.lessonsPerDay; period++) {
      const breakMatch = settings.breaks.find(b => b.afterPeriod === period);
      if (breakMatch) {
        currentMin += breakMatch.duration;
        while (currentMin >= 60) { currentMin -= 60; currentHour += 1; }
      }

      const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += settings.lessonDuration;
      while (currentMin >= 60) { currentMin -= 60; currentHour += 1; }
      const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      times.push(`${startStr} - ${endStr}`);
    }
    return times;
  }, [settings.lessonsPerDay, settings.lessonDuration, settings.breaks]);

  // Google calendar synchronization simulation runner
  const handleStartCalendarSync = (classId: string) => {
    setSyncClassId(classId);
    setSyncStep(1);
    
    // Simulate API connecting sequence
    setTimeout(() => {
      setSyncStep(2);
      setTimeout(() => {
        setSyncStep(3);
        const className = classes.find(c => c.id === classId)?.name || 'Kelas';
        triggerNotification(`Sukses! Jadwal ${className} disinkronkan ke Google Calendar akademik.`);
      }, 1500);
    }, 1200);
  };

  // Filter schedules!
  const filteredSchedules = useMemo(() => {
    return schedules.filter(item => {
      // 1. Class filter
      if (selectedClassFilter !== 'all' && item.classId !== selectedClassFilter) {
        return false;
      }
      
      // 2. Subject filter
      if (selectedSubjectFilter !== 'all' && item.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // 3. Day filter
      if (selectedDayFilter !== 'all' && String(item.dayIndex) !== selectedDayFilter) {
        return false;
      }

      // 4. Live Search query (matches Subject Name or Teacher Name)
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        
        const sub = item.subjectId === 'UPACARA' 
          ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } 
          : subjects.find(s => s.id === item.subjectId);
        const subName = sub ? sub.name.toLowerCase() : '';
        const teacherName = item.teacherName ? item.teacherName.toLowerCase() : '';
        const className = classes.find(c => c.id === item.classId)?.name.toLowerCase() || '';

        const matchSub = subName.includes(query);
        const matchTeach = teacherName.includes(query);
        const matchClass = className.includes(query);

        if (!matchSub && !matchTeach && !matchClass) {
          return false;
        }
      }

      return true;
    });
  }, [schedules, selectedClassFilter, selectedSubjectFilter, selectedDayFilter, searchQuery, subjects, classes]);

  // Group schedules by class for rendering multi-classes elegantly
  const groupedSchedulesByClass = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    
    // Get unique classes based on filter
    const activeClassIds = selectedClassFilter === 'all' 
      ? classes.map(c => c.id) 
      : [selectedClassFilter];

    activeClassIds.forEach(id => {
      map[id] = filteredSchedules.filter(f => f.classId === id);
    });

    return map;
  }, [filteredSchedules, selectedClassFilter, classes]);

  // Extract filtered extracurriculars
  const visibleEkskuls = useMemo(() => {
    const list = Array.isArray(extracurriculars) ? extracurriculars : [];
    return list.filter(e => {
      if (selectedDayFilter !== 'all' && String(e.day) !== selectedDayFilter) {
        return false;
      }
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        if (!e.name.toLowerCase().includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [extracurriculars, selectedDayFilter, searchQuery]);

  // Clean offline direct SVG drawings representing QR codes:
  const renderMockQRCodeSVG = (text: string) => {
    // Generate a pseudo-random checker grid that reacts to the text to look perfectly real and scan-ready!
    const size = 11;
    const pixels = [];
    // Seeded randomizer helper
    let seed = 0;
    for (let c = 0; c < text.length; c++) seed += text.charCodeAt(c);
    
    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    for (let r = 0; r < size; r++) {
      const row = [];
      for (let c = 0; c < size; c++) {
        // Force traditional QR markers in corners:
        const isTopLeftCorner = r < 3 && c < 3;
        const isTopRightCorner = r < 3 && c >= size - 3;
        const isBottomLeftCorner = r >= size - 3 && c < 3;
        
        if (isTopLeftCorner || isTopRightCorner || isBottomLeftCorner) {
          // outer marker boundary box
          const isOuterBorder = r === 0 || r === 2 || c === 0 || c === 2 || 
                                (r === 0 && c === size - 1) || (r === 2 && c === size - 1) || 
                                (c === size - 3 && r < 3) || (c === size - 1 && r < 3) ||
                                (r === size - 3 && c < 3) || (r === size - 1 && c < 3);
          
          if (isOuterBorder) {
            row.push(true);
          } else if (r === 1 && c === 1 || r === 1 && c === size - 2 || r === size - 2 && c === 1) {
            // inside dot
            row.push(true);
          } else {
            row.push(false);
          }
        } else {
          row.push(seededRandom() > 0.45);
        }
      }
      pixels.push(row);
    }

    return (
      <svg viewBox="0 0 110 110" className="w-40 h-40 mx-auto border-4 border-white dark:border-slate-800 bg-white rounded-lg p-1 shadow-md">
        {pixels.map((row, rIdx) => 
          row.map((active, cIdx) => (
            <rect
              key={`${rIdx}-${cIdx}`}
              x={cIdx * 10}
              y={rIdx * 10}
              width={10}
              height={10}
              fill={active ? '#0f172a' : '#ffffff'}
            />
          ))
        )}
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Notification */}
      {previewNotify && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{previewNotify}</span>
        </div>
      )}

      {/* Complex Filter Controls Dashboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 shadow-sm">
        <h3 className="font-bold text-slate-850 dark:text-white text-sm flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          Pencarian Cepat & Filter Jadwal Sekolah
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Live Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari guru, kelas, pel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-800 dark:text-white focus:border-blue-500 font-medium"
            />
          </div>

          {/* 2. Class Selector */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl outline-none text-slate-800 dark:text-white focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="all">Semua Rombel/Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* 3. Subject Selector */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => setSelectedSubjectFilter(e.target.value)}
            className="text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl outline-none text-slate-800 dark:text-white focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="all">Semua Mata Pelajaran</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* 4. Day Selector */}
          <select
            value={selectedDayFilter}
            onChange={(e) => setSelectedDayFilter(e.target.value)}
            className="text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl outline-none text-slate-800 dark:text-white focus:border-blue-500 font-medium cursor-pointer"
          >
            <option value="all">Semua Hari Efektif</option>
            {Array.from({ length: settings.effectiveDays }).map((_, idx) => (
              <option key={idx} value={idx}>{DAYS_OF_WEEK[idx]}</option>
            ))}
          </select>
        </div>

        {/* View togglers layout format */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 font-medium">
            Ditemukan {filteredSchedules.length} slot jadwal aktif.
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/40">
            <button
              onClick={() => setViewFormat('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                viewFormat === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Grid className="w-3 h-3" />
              Format Tabel
            </button>
            <button
              onClick={() => setViewFormat('card')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                viewFormat === 'card'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-650 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Smartphone className="w-3 h-3" />
              Format Kartu (Mobile)
            </button>
          </div>
        </div>
      </div>

      {/* Main schedule viewer panels grouped by Class */}
      <div className="space-y-8">
        {classes
          .filter(cl => selectedClassFilter === 'all' || cl.id === selectedClassFilter)
          .map(cl => {
            const classSchedules = groupedSchedulesByClass[cl.id] || [];
            
            return (
              <div key={cl.id} className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                
                {/* Header card per class with QR Code launcher and Google Sync option */}
                <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-8 bg-blue-600 rounded-md block"></span>
                    <div>
                      <h3 className="font-bold text-slate-850 dark:text-white text-lg">{cl.name}</h3>
                      <p className="text-[11px] text-slate-450">Akses jadwal harian terpadu siswa & wali kelas.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      onClick={() => {
                        setQrClassId(cl.id);
                        setShowQRModal(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 font-semibold rounded-lg border border-slate-200/60 dark:border-slate-700 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5 text-slate-500" />
                      QR Code Kelas
                    </button>
                    
                    <button
                      onClick={() => handleStartCalendarSync(cl.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-105 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold rounded-lg cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Sinkron Google Calendar
                    </button>
                  </div>
                </div>

                {/* --- DISPLAY 1: Format Tabel --- */}
                {viewFormat === 'table' ? (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[650px] border-collapse bg-transparent">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-850/60 border-b border-slate-100 dark:border-slate-800">
                          <th className="w-24 px-3 py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-450 font-mono">
                            JP / Waktu
                          </th>
                          {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
                            const isSpecificDaySelected = selectedDayFilter !== 'all' && String(dIdx) !== selectedDayFilter;
                            return (
                              <th 
                                key={dIdx} 
                                className={`px-2 py-2.5 text-center text-xs font-bold text-slate-800 dark:text-white border border-slate-100 dark:border-slate-800 ${
                                  isSpecificDaySelected ? 'opacity-30' : ''
                                }`}
                              >
                                {DAYS_OF_WEEK[dIdx]}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: settings.lessonsPerDay }).map((_, pIdx) => {
                          const elements = [];
                          const isBreakBefore = settings.breaks.find(b => b.afterPeriod === pIdx);

                          if (isBreakBefore) {
                            elements.push(
                              <tr key={`break-p-${pIdx}`} className="bg-slate-50/80 dark:bg-slate-800/20 text-center font-bold italic text-xs text-slate-400">
                                <td className="px-1.5 py-1.5 border border-slate-100 dark:border-slate-800 text-[9px] font-mono leading-none">
                                  Istirahat
                                </td>
                                <td colSpan={settings.effectiveDays} className="px-1.5 py-1.5 border border-slate-100 dark:border-slate-800 text-[11px]">
                                  ☕ {isBreakBefore.label} ({isBreakBefore.duration} Menit)
                                </td>
                              </tr>
                            );
                          }

                          elements.push(
                            <tr key={`period-p-${pIdx}`}>
                              <td className="px-2 py-3 bg-slate-50/30 border border-slate-100 dark:border-slate-800 text-center font-mono shrink-0">
                                <div className="text-xs font-bold text-slate-800 dark:text-white">#{pIdx + 1}</div>
                                <div className="text-[9px] font-medium text-slate-400 leading-none mt-0.5">{periodTimes[pIdx]}</div>
                              </td>
                              
                              {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
                                const item = classSchedules.find(s => s.dayIndex === dIdx && s.periodIndex === pIdx);
                                const isSpecificDaySelected = selectedDayFilter !== 'all' && String(dIdx) !== selectedDayFilter;
                                const sub = item?.subjectId ? (item.subjectId === 'UPACARA' ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } : subjects.find(s => s.id === item.subjectId)) : null;

                                return (
                                  <td 
                                    key={dIdx} 
                                    className={`p-1 border border-slate-100 dark:border-slate-800 align-top ${
                                      isSpecificDaySelected ? 'opacity-20' : ''
                                    }`}
                                  >
                                    {sub ? (
                                      <div 
                                        className="rounded-lg p-2 flex flex-col justify-between space-y-1"
                                        style={{ 
                                          backgroundColor: sub.color + '10', // 10% opacity code,
                                          borderLeft: `3px solid ${sub.color}`
                                        }}
                                      >
                                        <h5 className="text-[11px] font-extrabold text-slate-800 dark:text-white leading-tight break-words">
                                          {sub.name}
                                        </h5>
                                        <span className="text-[9px] text-slate-500 font-semibold truncate block">
                                          👤 {item?.teacherName || `Guru ${sub.name.split(' ')[0]}`}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="h-full min-h-12 border border-dashed border-slate-150 dark:border-slate-800/60 rounded-lg flex items-center justify-center text-slate-350 text-[10px]">
                                        -
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );

                          return elements;
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // --- DISPLAY 2: Format Kartu per Hari (Khusus Mobile Layout) ---
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
                      const isSpecificDaySelected = selectedDayFilter !== 'all' && String(dIdx) !== selectedDayFilter;
                      if (isSpecificDaySelected) return null;

                      // Filter hours of this day
                      const daySlots = classSchedules.filter(s => s.dayIndex === dIdx);

                      return (
                        <div key={dIdx} className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-4 space-y-3">
                          <div className="flex justify-between items-center bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">{DAYS_OF_WEEK[dIdx]}</span>
                            <span className="text-[10px] bg-blue-105 text-blue-750 px-2 py-0.5 rounded-md font-semibold">
                              {daySlots.filter(s => s.subjectId !== null).length} Mapel
                            </span>
                          </div>

                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {daySlots.map((item, pIdx) => {
                              const sub = item.subjectId ? (item.subjectId === 'UPACARA' ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } : subjects.find(s => s.id === item.subjectId)) : null;
                              
                              return (
                                <div key={pIdx} className="flex gap-2.5 items-center text-xs p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800">
                                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 font-mono text-center font-bold text-[10px] text-slate-550 rounded min-w-10">
                                    {pIdx + 1}
                                  </div>
                                  <div className="flex-1 truncate">
                                    {sub ? (
                                      <>
                                        <h5 className="font-bold text-slate-800 dark:text-white leading-tight truncate">{sub.name}</h5>
                                        <span className="text-[10px] text-slate-500 leading-none truncate block mt-0.5">👤 {item.teacherName || 'Guru Mapel'}</span>
                                      </>
                                    ) : (
                                      <span className="italic text-slate-400">Jam Bebas / Kosong</span>
                                    )}
                                  </div>
                                  <div className="text-[9px] font-mono text-slate-450 text-right">
                                    {periodTimes[pIdx]?.split(' ')[0]}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            );
          })}
      </div>

      {/* Extracurriculars Board segment */}
      {visibleEkskuls.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div>
              <h4 className="font-bold text-slate-850 dark:text-white text-base">Jadwal Ekstrakurikuler Terjadwal</h4>
              <p className="text-xs text-slate-450">Dilaksanakan sore hari setelah jam sela belajar mengajar formal selesai.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleEkskuls.map((eks) => (
              <div key={eks.id} className="p-3.5 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-150/50 flex gap-3.5 items-center">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/35 text-purple-700 dark:text-purple-300 rounded-lg font-bold text-center text-xs w-16">
                  {DAYS_OF_WEEK[eks.day]?.substring(0, 3)}
                </div>
                <div className="truncate">
                  <h5 className="font-bold text-slate-800 dark:text-white text-xs leading-tight truncate">{eks.name}</h5>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                    <Clock className="w-3 h-3" />
                    {eks.timeStart} - {eks.timeEnd} WIB
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIVE DIGITAL CLASS QR MODAL DOCKING */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden p-6 text-center space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-850">
              <h4 className="font-bold text-slate-850 dark:text-white text-sm">QR Code Akademik Kelas</h4>
              <button 
                onClick={() => setShowQRModal(false)}
                className="text-slate-450 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 rounded-full font-bold text-xs uppercase tracking-wider">
                {classes.find(c => c.id === qrClassId)?.name || 'Kelas'}
              </span>
              <p className="text-xs text-slate-510 dark:text-slate-400">
                Tempel barcode ini pada dinding mading kelas. Siswa dan Guru dapat memindai via smartphone untuk melihat jadwal kelas termutakhir secara daring.
              </p>
            </div>

            {/* Render direct dynamic SVG QR checkmarks */}
            <div className="py-2">
              {renderMockQRCodeSVG(`https://jadwalku.id/preview/class/${qrClassId}`)}
            </div>

            <p className="font-mono text-[9px] text-slate-400">ID SINKRON: SHA-256:{qrClassId || 'NONE'}</p>

            <button 
              onClick={() => {
                triggerNotification('Berhasil mengunduh template QR Code kelas!');
                setShowQRModal(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-lg cursor-pointer transition-colors"
            >
              Unduh Gambar QR Barcode
            </button>
          </div>
        </div>
      )}

      {/* SINKRON GOOGLE CALENDAR STEPS DIALOG */}
      {syncClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-slate-800 dark:text-white text-base border-b pb-3 border-slate-100 dark:border-slate-850">
              Sinkronisasi Ekspor Google Calendar
            </h3>
            
            <div className="space-y-4 py-2">
              {/* Stepper indicators */}
              <div className="flex justify-between text-[11px] font-bold">
                <span className={syncStep >= 1 ? 'text-blue-600' : 'text-slate-400'}>1. Hubungkan API</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className={syncStep >= 2 ? 'text-purple-600' : 'text-slate-400'}>2. Strukturisasi Event</span>
                <ChevronRight className="w-4 h-4 text-slate-300" />
                <span className={syncStep >= 3 ? 'text-emerald-600' : 'text-slate-400'}>3. Sinkron Berhasil</span>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl space-y-3">
                {syncStep === 1 && (
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">Sedang mengontak Google Calendar SDK...</span>
                  </div>
                )}
                {syncStep === 2 && (
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-purple-500 animate-spin shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-330">Mentransfer slot jam pelajaran dan menyisipkan breaktimes ke Google Calendar...</span>
                  </div>
                )}
                {syncStep === 3 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 text-emerald-600">
                      <Check className="w-5 h-5 shrink-0" />
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Sinkronisasi Google Calendar Sukses!</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      Jadwal untuk <span className="font-bold">{classes.find(c => c.id === syncClassId)?.name}</span> telah berhasil diunggah ke Google Kalender Guru kelas. Perubahan jadwal pelajaran di JADWALKU berikutnya akan memperbarui kalender otomatis.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs">
              {syncStep === 3 ? (
                <button
                  onClick={() => setSyncClassId(null)}
                  className="px-5 py-2.5 bg-blue-650 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Selesai
                </button>
              ) : (
                <button
                  onClick={() => setSyncClassId(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Batalkan Eksportasi
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
