/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings2, 
  Users, 
  BookOpen, 
  Activity, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  RotateCcw,
  Check,
  AlertCircle
} from 'lucide-react';
import { SchoolSettings, ClassItem, Subject, Extracurricular, BreakItem, THEME_COLORS, DAYS_OF_WEEK } from '../types';

interface SchoolSettingsProps {
  settings: SchoolSettings;
  classes: ClassItem[];
  subjects: Subject[];
  extracurriculars: Extracurricular[];
  userRole: 'admin' | 'operator' | 'viewer';
  onUpdateSettings: (settings: SchoolSettings) => void;
  onUpdateClasses: (classes: ClassItem[]) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
  onUpdateExtracurriculars: (extracurriculars: Extracurricular[]) => void;
  onResetToDefault: () => void;
}

export default function SchoolSettingsComponent({
  settings,
  classes,
  subjects,
  extracurriculars,
  userRole,
  onUpdateSettings,
  onUpdateClasses,
  onUpdateSubjects,
  onUpdateExtracurriculars,
  onResetToDefault,
}: SchoolSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'classes' | 'subjects' | 'extracurriculars' | 'breaks'>('profile');
  const isReadOnly = userRole === 'viewer';

  // --- Custom Confirm Dialog state ---
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  // --- Profile Settings state ---
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [academicYear, setAcademicYear] = useState(settings.academicYear);
  const [semester, setSemester] = useState(settings.semester);
  const [effectiveDays, setEffectiveDays] = useState(settings.effectiveDays);
  const [lessonsPerDay, setLessonsPerDay] = useState(settings.lessonsPerDay);
  const [lessonDuration, setLessonDuration] = useState(settings.lessonDuration);
  const [operatorName, setOperatorName] = useState(settings.operatorName);

  // --- Breaks settings state ---
  const [localBreaks, setLocalBreaks] = useState<BreakItem[]>(() => settings.breaks || []);

  useEffect(() => {
    setLocalBreaks(settings.breaks || []);
  }, [settings.breaks]);

  // --- Classes dynamic state ---
  const [classInputCount, setClassInputCount] = useState(String(classes.length));
  const [newClassName, setNewClassName] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  // --- Subjects state ---
  const [newSubName, setNewSubName] = useState('');
  const [newSubColor, setNewSubColor] = useState(THEME_COLORS[0].value);
  const [newSubHours, setNewSubHours] = useState(4);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubColor, setEditingSubColor] = useState('');
  const [editingSubHours, setEditingSubHours] = useState(4);

  // --- Extracurricular state ---
  const [newEksName, setNewEksName] = useState('');
  const [newEksDay, setNewEksDay] = useState(4); // Jumat by default
  const [newEksStart, setNewEksStart] = useState('14:00');
  const [newEksEnd, setNewEksEnd] = useState('15:30');

  // --- Breaks state ---
  const [newBreakAfter, setNewBreakAfter] = useState(3);
  const [newBreakDuration, setNewBreakDuration] = useState(15);
  const [newBreakLabel, setNewBreakLabel] = useState('Istirahat');

  // Form notifications
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  const showSavedNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => {
      setSavedMessage(null);
    }, 3000);
  };

  // --- Save profile handler ---
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    
    onUpdateSettings({
      ...settings,
      schoolName,
      academicYear,
      semester: Number(semester),
      effectiveDays: Number(effectiveDays) as 5 | 6,
      lessonsPerDay: Number(lessonsPerDay),
      lessonDuration: Number(lessonDuration),
      operatorName,
      breaks: localBreaks,
    });
    showSavedNotification('Pengaturan Sekolah berhasil disimpan!');
  };

  // --- Rombel Auto generator ---
  const handleAutoGenerateClasses = () => {
    if (isReadOnly) return;
    const count = parseInt(classInputCount);
    if (isNaN(count) || count < 1 || count > 30) {
      alert('Masukkan jumlah rombel antara 1 hingga 30');
      return;
    }

    // Auto generate names e.g., Kelas 1A, Clase 1B, Kelas 2A, etc.
    const generated: ClassItem[] = [];
    const suffixes = ['A', 'B', 'C', 'D'];
    
    let suffixIdx = 0;
    let grade = 1;

    for (let i = 0; i < count; i++) {
      generated.push({
        id: `c_gen_${i + 1}`,
        name: `Kelas ${grade}${suffixes[suffixIdx]}`
      });
      // Move to next suffix or next grade
      suffixIdx++;
      if (suffixIdx >= 2) { // alternate A and B first
        suffixIdx = 0;
        grade++;
      }
    }

    onUpdateClasses(generated);
    showSavedNotification(`Berhasil membuat ${count} rombongan belajar otomatis!`);
  };

  // --- Manual Class CRUD ---
  const handleAddClass = () => {
    if (isReadOnly || !newClassName.trim()) return;
    const isDuplicate = classes.some(c => c.name.toLowerCase() === newClassName.trim().toLowerCase());
    if (isDuplicate) {
      alert('Nama kelas sudah terdaftar!');
      return;
    }

    const newClass: ClassItem = {
      id: `c_${Date.now()}`,
      name: newClassName.trim(),
    };
    onUpdateClasses([...classes, newClass]);
    setNewClassName('');
    setClassInputCount(String(classes.length + 1));
    showSavedNotification('Rombel baru berhasil ditambahkan');
  };

  const handleDeleteClass = (id: string) => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Hapus Rombel?',
      message: 'Apakah Anda yakin ingin menghapus rombel ini? Semua jadwal rombel bersangkutan akan terpengaruh.',
      onConfirm: () => {
        const updated = classes.filter(c => c.id !== id);
        onUpdateClasses(updated);
        setClassInputCount(String(updated.length));
        showSavedNotification('Rombel berhasil dihapus');
      }
    });
  };

  const startEditClass = (item: ClassItem) => {
    setEditingClassId(item.id);
    setEditingClassName(item.name);
  };

  const handleSaveEditClass = () => {
    if (!editingClassName.trim() || isReadOnly) return;
    const updated = classes.map(c => 
      c.id === editingClassId ? { ...c, name: editingClassName.trim() } : c
    );
    onUpdateClasses(updated);
    setEditingClassId(null);
    showSavedNotification('Rombel berhasil diperbarui');
  };

  // --- Subjet CRUD ---
  const handleAddSubject = () => {
    if (isReadOnly || !newSubName.trim()) return;
    const sub: Subject = {
      id: `s_${Date.now()}`,
      name: newSubName.trim(),
      color: newSubColor,
      weeklyHours: Number(newSubHours)
    };
    onUpdateSubjects([...subjects, sub]);
    setNewSubName('');
    showSavedNotification('Mata pelajaran berhasil ditambahkan!');
  };

  const handleDeleteSubject = (id: string) => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Hapus Mata Pelajaran?',
      message: 'Hapus mata pelajaran ini?',
      onConfirm: () => {
        onUpdateSubjects(subjects.filter(s => s.id !== id));
        showSavedNotification('Mata pelajaran berhasil dihapus');
      }
    });
  };

  const startEditSubject = (item: Subject) => {
    setEditingSubId(item.id);
    setEditingSubName(item.name);
    setEditingSubColor(item.color);
    setEditingSubHours(item.weeklyHours);
  };

  const handleSaveEditSubject = () => {
    if (!editingSubName.trim() || isReadOnly) return;
    const updated = subjects.map(s => 
      s.id === editingSubId 
        ? { ...s, name: editingSubName.trim(), color: editingSubColor, weeklyHours: Number(editingSubHours) } 
        : s
    );
    onUpdateSubjects(updated);
    setEditingSubId(null);
    showSavedNotification('Mata pelajaran berhasil diperbarui');
  };

  // --- Extracurricular CRUD ---
  const handleAddEks = () => {
    if (isReadOnly || !newEksName.trim()) return;
    const eks: Extracurricular = {
      id: `e_${Date.now()}`,
      name: newEksName.trim(),
      day: Number(newEksDay),
      timeStart: newEksStart,
      timeEnd: newEksEnd
    };
    const list = Array.isArray(extracurriculars) ? extracurriculars : [];
    onUpdateExtracurriculars([...list, eks]);
    setNewEksName('');
    showSavedNotification('Kegiatan Ekstrakurikuler ditambahkan!');
  };

  const handleDeleteEks = (id: string) => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Hapus Ekstrakurikuler?',
      message: 'Hapus ekstrakurikuler ini?',
      onConfirm: () => {
        const list = Array.isArray(extracurriculars) ? extracurriculars : [];
        onUpdateExtracurriculars(list.filter(e => e.id !== id));
        showSavedNotification('Ekstrakurikuler berhasil dihapus');
      }
    });
  };

  // --- Breaks CRUD ---
  const handleAddBreak = () => {
    if (isReadOnly) return;
    if (newBreakAfter < 1 || newBreakAfter >= lessonsPerDay) {
      alert(`Waktu istirahat harus ditempatkan di antara jam pelajaran (1 sampai ${lessonsPerDay - 1})`);
      return;
    }
    const isDuplicate = settings.breaks.some(b => b.afterPeriod === Number(newBreakAfter));
    if (isDuplicate) {
      alert('Sudah terdapat istirahat setelah jam pelajaran tersebut');
      return;
    }

    const newBreak: BreakItem = {
      id: `b_${Date.now()}`,
      afterPeriod: Number(newBreakAfter),
      duration: Number(newBreakDuration),
      label: newBreakLabel.trim() || 'Istirahat'
    };

    const updatedBreaks = [...settings.breaks, newBreak].sort((a, b) => a.afterPeriod - b.afterPeriod);
    onUpdateSettings({
      ...settings,
      breaks: updatedBreaks
    });
    setNewBreakLabel('Istirahat');
    showSavedNotification('Jam istirahat berhasil dikonfigurasi!');
  };

  const handleDeleteBreak = (id: string) => {
    if (isReadOnly) return;
    const updatedBreaks = settings.breaks.filter(b => b.id !== id);
    onUpdateSettings({
      ...settings,
      breaks: updatedBreaks
    });
    showSavedNotification('Jam istirahat berhasil dihapus');
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-100 dark:bg-blue-950/65 text-blue-600 rounded-xl">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pengaturan Awal & Data Sekolah</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi umum instansi, jam operasional, rombel, beban mengajar mata pelajaran, dan jadwal istirahat.
            </p>
          </div>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              setConfirmDialog({
                title: 'Kembalikan Data Bawaan?',
                message: 'Semua konfigurasi saat ini akan dikembalikan ke data awal instansi. Lanjutkan?',
                confirmText: 'Kembalikan',
                onConfirm: () => {
                  onResetToDefault();
                  showSavedNotification('Kembali ke data bawaan sekolah.');
                }
              });
            }}
            className="flex items-center justify-center gap-1.5 px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-semibold rounded-xl border border-dashed border-red-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Kembalikan Data Default
          </button>
        )}
      </div>

      {isReadOnly && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Mode Lihat Saja (Viewer Mode)</p>
            <p>Konfigurasi sekolah dinonaktifkan dalam mode ini. Silakan ubah peran pengguna di dashboard jika ingin mengatur dan menyusun ulang data.</p>
          </div>
        </div>
      )}

      {/* Floating alert for temporary notifications */}
      {savedMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-blue-600 text-xs font-semibold px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Sub tabs nav */}
      <div className="flex border-b border-slate-150 dark:border-slate-800 overflow-x-auto pb-px gap-1">
        {[
          { key: 'profile', label: 'Profil & Kebijakan', icon: Settings2 },
          { key: 'classes', label: 'Rombongan Belajar', icon: Users },
          { key: 'subjects', label: 'Mata Pelajaran', icon: BookOpen },
          { key: 'breaks', label: 'Jam Istirahat', icon: Activity },
          { key: 'extracurriculars', label: 'Ekstrakurikuler', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 text-xs font-semibold cursor-pointer whitespace-nowrap transition-all ${
                isActive
                  ? 'border-blue-650 text-blue-650 dark:text-blue-400 dark:border-blue-400 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        
        {/* TAB 1: Profile & Policy */}
        {activeSubTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Rincian & Aturan Efektif Sekolah</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Sekolah</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Contoh: SD Negeri 1 Jakarta"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Tahun Pelajaran</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="Contoh: 2026/2027"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Semester</label>
                <select
                  disabled={isReadOnly}
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                >
                  <option value={1}>Semester I (Ganjil)</option>
                  <option value={2}>Semester II (Genap)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Hari Efektif Sekolah</label>
                <select
                  disabled={isReadOnly}
                  value={effectiveDays}
                  onChange={(e) => setEffectiveDays(Number(e.target.value) as 5 | 6)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                >
                  <option value={5}>5 Hari Kerja/Sekolah (Senin - Jumat)</option>
                  <option value={6}>6 Hari Kerja/Sekolah (Senin - Sabtu)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Jumlah Jam Pelajaran / Hari (Periods)</label>
                <input
                  type="number"
                  required
                  disabled={isReadOnly}
                  min={4}
                  max={12}
                  value={lessonsPerDay}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLessonsPerDay(val);
                    setLocalBreaks((prev) => 
                      prev.map(b => ({
                        ...b,
                        afterPeriod: Math.min(Math.max(1, val - 1), b.afterPeriod)
                      }))
                    );
                  }}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Durasi Per Jam Pelajaran (Menit)</label>
                <input
                  type="number"
                  required
                  disabled={isReadOnly}
                  min={15}
                  max={60}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nama Lengkap Operator / Penanggungjawab</label>
                <input
                  type="text"
                  required
                  disabled={isReadOnly}
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.Pd."
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white"
                />
              </div>
            </div>

            {/* INTEGRASI PENGATURAN JAM ISTIRAHAT (JUMLAH, POSISI JAM KE-K, DURASI MENIT) */}
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-slate-800/80 rounded-lg text-indigo-600">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Konfigurasi Jam Istirahat Sekolah</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                Atur jumlah istirahat harian, posisi penempatan istirahat setelah jam pelajaran berapa, dan durasi istirahat (dalam menit).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Jumlah Sesi Istirahat</label>
                  <select
                    disabled={isReadOnly}
                    value={localBreaks.length}
                    onChange={(e) => {
                      const targetLen = Math.min(4, Math.max(0, Number(e.target.value)));
                      const current = [...localBreaks];
                      if (targetLen > current.length) {
                        for (let i = current.length; i < targetLen; i++) {
                          current.push({
                            id: `b_local_${Date.now()}_${i}`,
                            afterPeriod: Math.min(Number(lessonsPerDay) - 1, i + 3),
                            duration: 15,
                            label: `Istirahat ${i + 1}`
                          });
                        }
                      } else if (targetLen < current.length) {
                        current.splice(targetLen);
                      }
                      setLocalBreaks(current);
                    }}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 outline-none text-slate-850 dark:text-white font-semibold"
                  >
                    <option value={0}>Tidak Ada Istirahat (0 Sesi)</option>
                    <option value={1}>1 Sesi Istirahat</option>
                    <option value={2}>2 Sesi Istirahat</option>
                    <option value={3}>3 Sesi Istirahat</option>
                    <option value={4}>4 Sesi Istirahat</option>
                  </select>
                </div>
              </div>

              {localBreaks.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {localBreaks.map((item, idx) => (
                    <div 
                      key={item.id} 
                      className="p-4 bg-slate-50/60 dark:bg-slate-850/50 border border-slate-200/40 dark:border-slate-800 rounded-xl space-y-3"
                    >
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-150/45 dark:border-slate-800/80">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                          Sesi Istirahat {idx + 1}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {/* 1. Label/Keterangan */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Keterangan / Nama Istirahat</label>
                          <input
                            type="text"
                            required
                            disabled={isReadOnly}
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...localBreaks];
                              updated[idx] = { ...updated[idx], label: e.target.value };
                              setLocalBreaks(updated);
                            }}
                            placeholder="Contoh: Istirahat Dhuha / Makan Siang"
                            className="w-full text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-lg outline-none text-slate-800 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* 2. Berada jam ke berapa (After period) */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Setelah Jam Pelajaran Ke-</label>
                            <select
                              disabled={isReadOnly}
                              value={item.afterPeriod}
                              onChange={(e) => {
                                const updated = [...localBreaks];
                                updated[idx] = { ...updated[idx], afterPeriod: Number(e.target.value) };
                                setLocalBreaks(updated);
                              }}
                              className="w-full text-xs px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-lg outline-none text-slate-850 dark:text-white focus:border-blue-500"
                            >
                              {Array.from({ length: Math.max(1, Number(lessonsPerDay) - 1) }).map((_, pIdx) => (
                                <option key={pIdx} value={pIdx + 1}>
                                  Jam Ke-{pIdx + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* 3. Durasi menit */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Durasi (Menit)</label>
                            <div className="relative">
                              <input
                                type="number"
                                required
                                disabled={isReadOnly}
                                min={5}
                                max={60}
                                value={item.duration}
                                onChange={(e) => {
                                  const updated = [...localBreaks];
                                  updated[idx] = { ...updated[idx], duration: Number(e.target.value) };
                                  setLocalBreaks(updated);
                                }}
                                className="w-full text-xs px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-705 rounded-lg outline-none text-slate-800 dark:text-white font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 dark:shadow-none cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  Simpan Profil Sekolah
                </button>
              </div>
            )}
          </form>
        )}

        {/* TAB 2: Rombongan Belajar (Classes) */}
        {activeSubTab === 'classes' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="space-y-4 max-w-sm w-full">
                <div className="bg-blue-50/50 dark:bg-slate-800/40 p-4 rounded-xl border border-blue-100/50 dark:border-slate-850 space-y-3">
                  <h4 className="font-bold text-xs text-blue-900 dark:text-blue-400 uppercase tracking-wider">Metode Otomatis</h4>
                  <p className="text-xs text-slate-530 dark:text-slate-400">Penyuntingan cepat. Masukkan jumlah kelas, aplikasi akan membuat rombel terurut.</p>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      disabled={isReadOnly}
                      min={1}
                      max={30}
                      value={classInputCount}
                      onChange={(e) => setClassInputCount(e.target.value)}
                      className="w-20 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                    />
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={handleAutoGenerateClasses}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors"
                    >
                      Buat Rombel Otomatis
                    </button>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-300 uppercase tracking-wider">Tambah Rombel Manual</h4>
                    
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Contoh: Kelas 1C atau Kelas 6B"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddClass}
                        className="w-full flex items-center justify-center gap-1 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold text-xs py-2 px-3 rounded-lg cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Tambah Manual
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Rombel list table */}
              <div className="flex-1 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden self-stretch">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                      <th className="px-5 py-3">No</th>
                      <th className="px-5 py-3">Nama Rombel / Kelas</th>
                      {!isReadOnly && <th className="px-5 py-3 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {classes.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-5 py-8 text-center text-slate-400">Belum ada data rombongan belajar sekolah.</td>
                      </tr>
                    ) : (
                      classes.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-5 py-3.5 font-semibold font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-5 py-3.5">
                            {editingClassId === item.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingClassName}
                                  onChange={(e) => setEditingClassName(e.target.value)}
                                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 outline-none text-slate-800 dark:text-white rounded text-xs"
                                />
                                <button
                                  type="button"
                                  onClick={handleSaveEditClass}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingClassId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                            )}
                          </td>
                          {!isReadOnly && (
                            <td className="px-5 py-3.5 text-right space-x-1.5">
                              <button
                                type="button"
                                onClick={() => startEditClass(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-450 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-all inline-block"
                                title="Edit Rombel"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClass(item.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-450 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-all inline-block"
                                title="Hapus Rombel"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Mata Pelajaran (Subjects) */}
        {activeSubTab === 'subjects' && (
          <div className="space-y-6">
            {!isReadOnly && (
              <div className="p-5 bg-slate-50 dark:bg-slate-800/45 border border-slate-150 dark:border-slate-800 rounded-xl space-y-4">
                <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-wider">Form Tambah Mata Pelajaran Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-5 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Mata Pelajaran</label>
                    <input
                      type="text"
                      placeholder="Contoh: Seni Rupa atau Matematika Umum"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Target Alokasi Jam / Minggu</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newSubHours}
                      onChange={(e) => setNewSubHours(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block">Label Warna Tag</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {THEME_COLORS.map(c => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setNewSubColor(c.value)}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            newSubColor === c.value ? 'ring-2 ring-blue-500 border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                  <button
                    type="button"
                    onClick={handleAddSubject}
                    className="flex items-center gap-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Mata Pelajaran
                  </button>
                </div>
              </div>
            )}

            {/* List Table of Subjects */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-5 py-3">Warna</th>
                    <th className="px-5 py-3">Nama Mata Pelajaran</th>
                    <th className="px-5 py-3">Target JP / Minggu</th>
                    {!isReadOnly && <th className="px-5 py-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {subjects.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-5 py-3.5">
                        <div 
                          className="w-4 h-4 rounded-full border border-slate-200" 
                          style={{ backgroundColor: item.color }} 
                        />
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">
                        {editingSubId === item.id ? (
                          <input
                            type="text"
                            value={editingSubName}
                            onChange={(e) => setEditingSubName(e.target.value)}
                            className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 outline-none text-slate-800 dark:text-white rounded"
                          />
                        ) : (
                          item.name
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold">
                        {editingSubId === item.id ? (
                          <input
                            type="number"
                            min={1}
                            max={10}
                            value={editingSubHours}
                            onChange={(e) => setEditingSubHours(Number(e.target.value))}
                            className="w-16 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-750 outline-none text-slate-800 dark:text-white rounded text-xs"
                          />
                        ) : (
                          `${item.weeklyHours} jam pelajaran`
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="px-5 py-3.5 text-right">
                          {editingSubId === item.id ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={handleSaveEditSubject}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold"
                              >
                                Simpan
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSubId(null)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold"
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <div className="space-x-1.5 inline-block">
                              <button
                                type="button"
                                onClick={() => startEditSubject(item)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-450 hover:bg-slate-100 rounded cursor-pointer inline-block"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubject(item.id)}
                                className="p-1.5 text-slate-500 hover:text-red-600 dark:text-slate-450 hover:bg-slate-100 rounded cursor-pointer inline-block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: Jam Istirahat (Breaks) */}
        {activeSubTab === 'breaks' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Aturan Jam Istirahat & Durasi</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi di mana jam istirahat disisipkan dalam urutan hari pelajaran. Istirahat dimasukkan otomatis di antara slot jadwal.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {!isReadOnly && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4 self-start">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-300 uppercase tracking-widest">Tambah Jam Istirahat</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ditempatkan Setelah Jam Ke-</label>
                      <select
                        value={newBreakAfter}
                        onChange={(e) => setNewBreakAfter(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                      >
                        {Array.from({ length: lessonsPerDay - 1 }).map((_, idx) => (
                          <option key={idx} value={idx + 1}>
                            Jam Ke - {idx + 1}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Durasi Mandiri (Menit)</label>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={newBreakDuration}
                        onChange={(e) => setNewBreakDuration(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Label Keterangan</label>
                      <input
                        type="text"
                        placeholder="Contoh: Istirahat Dhuha / Makan"
                        value={newBreakLabel}
                        onChange={(e) => setNewBreakLabel(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddBreak}
                      className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Sisipkan Istirahat
                    </button>
                  </div>
                </div>
              )}

              {/* Break list item columns */}
              <div className="lg:col-span-2 space-y-4">
                <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                        <th className="px-5 py-3">Nama Sela</th>
                        <th className="px-5 py-3">Posisi Jam pelajaran</th>
                        <th className="px-5 py-3">Durasi Waktu</th>
                        {!isReadOnly && <th className="px-5 py-3 text-right">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {settings.breaks.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-8 text-center text-slate-400">Sekolah dijalankan tanpa jam istirahat terpisah (pembelajaran lurus).</td>
                        </tr>
                      ) : (
                        settings.breaks.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{b.label}</td>
                            <td className="px-5 py-3.5">Setelah Jam Ke- {b.afterPeriod}</td>
                            <td className="px-5 py-3.5 font-mono text-emerald-600 font-semibold">{b.duration} Menit</td>
                            {!isReadOnly && (
                              <td className="px-5 py-3.5 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBreak(b.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all inline-block"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Ekstrakurikuler (Extracurriculars) */}
        {activeSubTab === 'extracurriculars' && (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-800 dark:text-white text-base">Manajemen Jadwal Ekstrakurikuler</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kegiatan ekstrakurikuler luar jam pelajaran yang diselenggarakan sekolah. Ekstrakurikuler tidak dapat berbenturan dengan waktu belajar formal siswa.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {!isReadOnly && (
                <div className="p-5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-4 self-start">
                  <h4 className="font-bold text-xs text-slate-850 dark:text-white uppercase tracking-widest">Tambah Ekstrakurikuler</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Nama Ekstrakurikuler</label>
                      <input
                        type="text"
                        placeholder="Contoh: Pramuka Wajib"
                        value={newEksName}
                        onChange={(e) => setNewEksName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Hari Pelaksanaan</label>
                      <select
                        value={newEksDay}
                        onChange={(e) => setNewEksDay(Number(e.target.value))}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                      >
                        {Array.from({ length: settings.effectiveDays }).map((_, idx) => (
                          <option key={idx} value={idx}>
                            Hari {DAYS_OF_WEEK[idx]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase">Mulai</label>
                        <input
                          type="time"
                          value={newEksStart}
                          onChange={(e) => setNewEksStart(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-550 dark:text-slate-400 uppercase">Selesai</label>
                        <input
                          type="time"
                          value={newEksEnd}
                          onChange={(e) => setNewEksEnd(e.target.value)}
                          className="w-full text-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEks}
                      className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 px-4 rounded-lg cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Tambah Kegiatan
                    </button>
                  </div>
                </div>
              )}

              {/* Ekskul List columns */}
              <div className="lg:col-span-2 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden self-stretch">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                      <th className="px-5 py-3">Nama Ekstrakurikuler</th>
                      <th className="px-5 py-3">Hari Pelaksanaan</th>
                      <th className="px-5 py-3">Waktu Jam</th>
                      {!isReadOnly && <th className="px-5 py-3 text-right">Aksi</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                    {!Array.isArray(extracurriculars) || extracurriculars.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-slate-400">Belum ada data ekstrakurikuler yang terdaftar.</td>
                      </tr>
                    ) : (
                      extracurriculars.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                          <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{item.name}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2 py-1 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-md font-semibold font-sans text-[11px]">
                              {DAYS_OF_WEEK[item.day] || 'Hari Lain'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-slate-500">{item.timeStart} - {item.timeEnd} WIB</td>
                          {!isReadOnly && (
                            <td className="px-5 py-3.5 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteEks(item.id)}
                                className="p-1.5 text-slate-450 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-all inline-block"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Custom Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
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
                  confirmDialog.confirmText === 'Kembalikan' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-red-600 hover:bg-red-750 text-white'
                } text-xs font-bold rounded-xl transition-all cursor-pointer`}
              >
                {confirmDialog.confirmText || 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
