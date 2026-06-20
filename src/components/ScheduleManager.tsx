/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Trash2, 
  AlertTriangle, 
  Clock, 
  HelpCircle, 
  Check, 
  Edit3, 
  Shuffle, 
  Users, 
  X,
  Plus,
  RefreshCw,
  CalendarCheck
} from 'lucide-react';
import { SchoolSettings, ClassItem, Subject, Extracurricular, ScheduleItem, DAYS_OF_WEEK } from '../types';
import { validateSchedule, generateAutomaticSchedule, SchedulingConflict, getDayName } from '../utils/scheduler';

interface ScheduleManagerProps {
  settings: SchoolSettings;
  classes: ClassItem[];
  subjects: Subject[];
  extracurriculars: Extracurricular[];
  schedules: ScheduleItem[];
  userRole: 'admin' | 'operator' | 'viewer';
  onUpdateSchedules: (schedules: ScheduleItem[]) => void;
}

export default function ScheduleManager({
  settings,
  classes,
  subjects,
  extracurriculars,
  schedules,
  userRole,
  onUpdateSchedules,
}: ScheduleManagerProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const isReadOnly = userRole === 'viewer';

  // State for slot selection / edits
  const [editingSlot, setEditingSlot] = useState<{ dayIndex: number; periodIndex: number } | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('clear');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');

  // Swap State Coordinator
  const [swapSource, setSwapSource] = useState<{ dayIndex: number; periodIndex: number } | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<string | null>(null);

  // --- Custom Confirm Dialog state ---
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerNotification = (text: string) => {
    setNotification(text);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Calculate Clock Times dynamically
  const periodTimes = useMemo(() => {
    const times: { label: string; start: string; end: string; isBreakBefore: boolean; breakLabel?: string }[] = [];
    let currentHour = 7;
    let currentMin = 0;

    const timeString = (h: number, m: number) => {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    for (let period = 0; period < settings.lessonsPerDay; period++) {
      // Is there a break before this period? Let's check if there's a break after the previous period (period - 1)
      const breakMatch = settings.breaks.find(b => b.afterPeriod === period);
      let isBreakBefore = false;
      let breakLabel = '';

      if (breakMatch) {
        isBreakBefore = true;
        breakLabel = `${breakMatch.label} (${breakMatch.duration}m)`;
        
        // Add break duration to clock before starting the next period
        const breakStart = timeString(currentHour, currentMin);
        currentMin += breakMatch.duration;
        while (currentMin >= 60) {
          currentMin -= 60;
          currentHour += 1;
        }
        const breakEnd = timeString(currentHour, currentMin);
        
        // Push break as a separate entry index or metadata
      }

      const startTime = timeString(currentHour, currentMin);
      
      // Add lesson duration
      currentMin += settings.lessonDuration;
      while (currentMin >= 60) {
        currentMin -= 60;
        currentHour += 1;
      }
      
      const endTime = timeString(currentHour, currentMin);

      times.push({
        label: `Jam Ke-${period + 1}`,
        start: startTime,
        end: endTime,
        isBreakBefore,
        breakLabel
      });
    }

    return times;
  }, [settings.lessonsPerDay, settings.lessonDuration, settings.breaks]);

  // 2. Validate current entire schedules
  const conflicts = useMemo(() => {
    return validateSchedule(
      schedules,
      classes,
      subjects,
      settings.effectiveDays,
      settings.lessonsPerDay,
      settings.breaks
    );
  }, [schedules, classes, subjects, settings.effectiveDays, settings.lessonsPerDay, settings.breaks]);

  // Handle auto generation of schedules for ALL classes
  const handleGenerateAllSchedules = () => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Besut Ulang Semua Jadwal Omotanis?',
      message: 'JADWALKU akan menyusun ulang jadwal untuk seluruh kelas secara otomatis. Jadwal saat ini akan ditimpa dan diperbarui dengan algoritma anti-bentrok. Lanjutkan?',
      confirmText: 'Lanjutkan',
      onConfirm: () => {
        const generated = generateAutomaticSchedule(classes, subjects, settings.effectiveDays, settings.lessonsPerDay);
        onUpdateSchedules(generated);
        triggerNotification('Jadwal seluruh kelas sukses disusun otomatis berkemampuan anti-bentrok!');
      }
    });
  };

  // Handle single class cleaning
  const handleClearCurrentClass = () => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Kosongkan Jadwal Kelas?',
      message: 'Kosongkan semua slot materi pelajaran untuk kelas ini?',
      confirmText: 'Kosongkan',
      onConfirm: () => {
        const cleared = schedules.map(item => {
          if (item.classId === selectedClassId) {
            return { ...item, subjectId: null, teacherName: undefined };
          }
          return item;
        });
        onUpdateSchedules(cleared);
        triggerNotification('Jadwal kelas berhasil dikosongkan.');
      }
    });
  };

  // Handle single slot clearing
  const handleClearSlot = (dayIndex: number, periodIndex: number) => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Kosongkan Slot Jadwal?',
      message: `Apakah Anda yakin ingin mengosongkan jadwal pada hari ${DAYS_OF_WEEK[dayIndex]} jam pelajaran ke-${periodIndex + 1}?`,
      confirmText: 'Kosongkan',
      onConfirm: () => {
        const cleared = schedules.map(item => {
          if (item.classId === selectedClassId && item.dayIndex === dayIndex && item.periodIndex === periodIndex) {
            return { ...item, subjectId: null, teacherName: undefined };
          }
          return item;
        });
        onUpdateSchedules(cleared);
        triggerNotification('Slot jadwal berhasil dikosongkan.');
      }
    });
  };

  // Click handler on slot
  const handleSlotClick = (dayIndex: number, periodIndex: number) => {
    if (isReadOnly) return;

    if (isSwapMode) {
      if (!swapSource) {
        // Set as swap source
        setSwapSource({ dayIndex, periodIndex });
        triggerNotification('Pilih slot tujuan untuk penukaran jadwal...');
      } else {
        // Perform Swap!
        const sourceItemIdx = schedules.findIndex(
          s => s.classId === selectedClassId && s.dayIndex === swapSource.dayIndex && s.periodIndex === swapSource.periodIndex
        );
        const targetItemIdx = schedules.findIndex(
          s => s.classId === selectedClassId && s.dayIndex === dayIndex && s.periodIndex === periodIndex
        );

        if (sourceItemIdx !== -1 && targetItemIdx !== -1) {
          const updated = [...schedules];
          const tempSub = updated[sourceItemIdx].subjectId;
          const tempTeach = updated[sourceItemIdx].teacherName;

          updated[sourceItemIdx].subjectId = updated[targetItemIdx].subjectId;
          updated[sourceItemIdx].teacherName = updated[targetItemIdx].teacherName;

          updated[targetItemIdx].subjectId = tempSub;
          updated[targetItemIdx].teacherName = tempTeach;

          onUpdateSchedules(updated);
          triggerNotification(`Jadwal jam pelajaran berhasil ditukar!`);
        }

        setSwapSource(null);
        setIsSwapMode(false);
      }
    } else {
      // Normal editing slot click - launch quick editor popup
      const currentVal = schedules.find(
        s => s.classId === selectedClassId && s.dayIndex === dayIndex && s.periodIndex === periodIndex
      );

      setEditingSlot({ dayIndex, periodIndex });
      setSelectedSubjectId(currentVal?.subjectId || 'clear');
      setSelectedTeacherName(currentVal?.teacherName || '');
    }
  };

  // Submit slot edit
  const handleSaveSlotEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot || isReadOnly) return;

    const updated = schedules.map(item => {
      if (
        item.classId === selectedClassId &&
        item.dayIndex === editingSlot.dayIndex &&
        item.periodIndex === editingSlot.periodIndex
      ) {
        return {
          ...item,
          subjectId: selectedSubjectId === 'clear' ? null : selectedSubjectId,
          teacherName: selectedSubjectId === 'clear' ? undefined : selectedTeacherName.trim() || undefined
        };
      }
      return item;
    });

    onUpdateSchedules(updated);
    setEditingSlot(null);
    triggerNotification('Slot jadwal berhasil diperbarui!');
  };

  const getSubjectForSlot = (dayIdx: number, periodIdx: number) => {
    const item = schedules.find(
      s => s.classId === selectedClassId && s.dayIndex === dayIdx && s.periodIndex === periodIdx
    );
    if (!item?.subjectId) return null;
    if (item.subjectId === 'UPACARA') {
      return { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 };
    }
    return subjects.find(sub => sub.id === item.subjectId) || null;
  };

  const getTeacherForSlot = (dayIdx: number, periodIdx: number) => {
    const item = schedules.find(
      s => s.classId === selectedClassId && s.dayIndex === dayIdx && s.periodIndex === periodIdx
    );
    return item?.teacherName || '';
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            Manajemen & Penyusun Jadwal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Penyusun jadwal otomatis cerdas dan pembangun manual interaktif. Bebas mengatur slot kegiatan per rombel.
          </p>
        </div>

        {!isReadOnly && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerateAllSchedules}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Susun Jadwal Otomatis (Anti-Bentrok)
            </button>

            <button
              onClick={handleClearCurrentClass}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan Kelas
            </button>
          </div>
        )}
      </div>

      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-blue-600 text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-pulse">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Class Switcher Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Menyusun Kelas:</span>
          <div className="flex flex-wrap gap-1">
            {classes.map(cl => (
              <button
                key={cl.id}
                onClick={() => setSelectedClassId(cl.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                  selectedClassId === cl.id
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 ring-1 ring-blue-250'
                    : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50'
                }`}
              >
                {cl.name}
              </button>
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              setIsSwapMode(!isSwapMode);
              setSwapSource(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
              isSwapMode 
                ? 'bg-orange-500 text-white' 
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            {isSwapMode ? 'Batal Tukar Slot' : 'Mode Tukar (Swap) Jam'}
          </button>
        )}
      </div>

      {/* Main Timetable Grid Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 md:p-6 shadow-xs overflow-hidden">
        {isSwapMode && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-slate-800 text-orange-850 dark:text-orange-400 rounded-lg text-xs leading-relaxed border border-orange-100">
            <p className="font-bold">Mode Tukar Aktif:</p>
            <p>Klik slot jam pertama kemudian klik slot kedua untuk menukar urutan jadwal pelajaran dengan cepat.</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse table-fixed">
            <thead>
              <tr>
                <th className="w-32 px-2 py-3 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 text-center text-xs font-bold uppercase">
                  Waktu / Jam
                </th>
                {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => (
                  <th key={dIdx} className="px-2 py-3 border border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-white text-center text-xs font-bold">
                    {DAYS_OF_WEEK[dIdx]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periodTimes.map((time, pIdx) => {
                const elements = [];

                // Render Istirahat if registered after this period
                if (time.isBreakBefore) {
                  elements.push(
                    <tr key={`break-${pIdx}`} className="bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 text-center">
                      <td className="px-2 py-2 border border-slate-150 dark:border-slate-800 font-bold text-[10px] uppercase font-mono">
                        Sela
                      </td>
                      <td colSpan={settings.effectiveDays} className="px-2 py-2 border border-slate-150 dark:border-slate-800 font-bold italic text-xs tracking-wider">
                        ☕ {time.breakLabel}
                      </td>
                    </tr>
                  );
                }

                // Render normal school hour period row
                elements.push(
                  <tr key={`period-${pIdx}`} className="hover:bg-slate-50/20">
                    {/* Time indicator and duration column */}
                    <td className="px-2 py-4 border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-center">
                      <div className="text-xs font-bold text-slate-800 dark:text-white">{time.label}</div>
                      <div className="text-[10px] font-semibold text-slate-500 font-mono mt-0.5">{time.start} - {time.end}</div>
                    </td>

                    {/* Columns for effective school days */}
                    {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
                      const subject = getSubjectForSlot(dIdx, pIdx);
                      const teacher = getTeacherForSlot(dIdx, pIdx);
                      const isSourceSelected = swapSource && swapSource.dayIndex === dIdx && swapSource.periodIndex === pIdx;

                      return (
                        <td 
                          key={dIdx} 
                          onClick={() => handleSlotClick(dIdx, pIdx)}
                          className={`p-1.5 border border-slate-150 dark:border-slate-800 align-top transition-all ${
                            isReadOnly ? '' : 'cursor-pointer hover:shadow-inner'
                          } ${isSourceSelected ? 'bg-orange-100 ring-2 ring-orange-500' : ''}`}
                        >
                          {subject ? (
                            <div 
                              className="h-full rounded-lg p-2.5 flex flex-col justify-between space-y-1 select-none transition-transform active:scale-95"
                              style={{ 
                                backgroundColor: subject.color + '15', // 10% opacity
                                borderLeft: `4px solid ${subject.color}`
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                                  {subject.name}
                                </span>
                                {!isReadOnly && (
                                  <div className="flex items-center gap-0.5 shrink-0 ml-1">
                                    <button
                                      type="button"
                                      title="Edit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSlotClick(dIdx, pIdx);
                                      }}
                                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      type="button"
                                      title="Hapus"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleClearSlot(dIdx, pIdx);
                                      }}
                                      className="p-1 hover:bg-black/5 dark:hover:bg-white/10 text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span className="text-[9px] font-semibold text-slate-500 truncate block">
                                👤 {teacher || `Guru ${subject.name.split(' ')[0]}`}
                              </span>
                            </div>
                          ) : (
                            <div className="h-full min-h-14 border border-dashed border-slate-200 dark:border-slate-800 hover:border-slate-400 rounded-lg flex flex-col items-center justify-center p-2 text-slate-400 text-[10px] font-medium transition-colors select-none">
                              {!isReadOnly ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlotClick(dIdx, pIdx);
                                  }}
                                  className="flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-[9px] font-semibold text-slate-600 dark:text-slate-300 rounded-md transition-colors cursor-pointer"
                                >
                                  <Plus className="w-2.5 h-2.5 text-slate-400" />
                                  <span>Isi</span>
                                </button>
                              ) : (
                                <span>Kosong</span>
                              )}
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
      </div>

      {/* Conflicts Realtime Logger / Notification Panel */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">Validasi Bentrok Cerdas ({conflicts.length})</h3>
          </div>
          <span className="text-[10px] font-bold bg-white dark:bg-slate-800 px-2.5 py-1 rounded-full text-slate-500 uppercase shadow-xs">
            Scan Real-time Aktif
          </span>
        </div>

        {conflicts.length === 0 ? (
          <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-400 rounded-xl text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-500 animate-bounce" />
            <span>Selamat! Tidak ada bentrokan guru pelajaran ataupun jam di seluruh database sekolah. Jadwal sempurna.</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {conflicts.map((c, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                  c.severity === 'error'
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/60 text-red-900 dark:text-red-400'
                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/60 text-amber-900 dark:text-amber-400'
                }`}
              >
                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${c.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <span className="font-bold uppercase tracking-wider text-[9px] mr-1.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 font-mono">
                    {c.severity}
                  </span>
                  <span>{c.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QUICK SLOT EDITOR MODAL POPUP */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                Atur Slot: {getDayName(editingSlot.dayIndex)} Jam ke-{editingSlot.periodIndex + 1}
              </h3>
              <button 
                onClick={() => setEditingSlot(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlotEdit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Mata Pelajaran</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 outline-none text-slate-800 dark:text-white rounded-lg focus:border-blue-500"
                >
                  <option value="clear">* Kosongkan Slot (Jam Bebas)</option>
                  <option value="UPACARA">UPACARA (Kegiatan Sekolah)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.weeklyHours} JP/Mgg)
                    </option>
                  ))}
                </select>
              </div>

              {selectedSubjectId !== 'clear' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest block">Nama Guru Mengajar</label>
                  <input
                    type="text"
                    value={selectedTeacherName}
                    onChange={(e) => setSelectedTeacherName(e.target.value)}
                    placeholder="Contoh: Bpk. Heru, M.Pd."
                    className="w-full text-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-750 outline-none text-slate-800 dark:text-white rounded-lg focus:border-blue-500"
                  />
                  <p className="text-[10px] text-slate-450 italic">Ketik nama guru pengampu kelas atau kosongkan untuk otomatis.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                >
                  Simpan Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              {confirmDialog.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className={`px-4 py-2.5 ${
                  confirmDialog.confirmText === 'Lanjutkan' 
                    ? 'bg-blue-600 hover:bg-blue-750 text-white' 
                    : 'bg-red-650 hover:bg-red-700 text-white'
                } text-xs font-bold rounded-xl transition-all cursor-pointer`}
              >
                {confirmDialog.confirmText || 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
