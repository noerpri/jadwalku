/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Settings2, 
  BookOpen, 
  Clock, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  Check, 
  AlertCircle,
  Building
} from 'lucide-react';
import { SchoolSettings, Subject, THEME_COLORS } from '../types';

interface QuickSettingsProps {
  settings: SchoolSettings;
  subjects: Subject[];
  userRole: 'admin' | 'operator' | 'viewer';
  onUpdateSettings: (settings: SchoolSettings) => void;
  onUpdateSubjects: (subjects: Subject[]) => void;
}

export default function QuickSettings({
  settings,
  subjects,
  userRole,
  onUpdateSettings,
  onUpdateSubjects,
}: QuickSettingsProps) {
  const isReadOnly = userRole === 'viewer';

  // Local state for School Name & Lesson Duration
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [lessonDuration, setLessonDuration] = useState(settings.lessonDuration);

  // Local state for new subject addition
  const [newSubName, setNewSubName] = useState('');
  const [newSubHours, setNewSubHours] = useState(4);
  const [newSubColor, setNewSubColor] = useState(THEME_COLORS[0].value);

  // Local state for raw subject editing
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingSubName, setEditingSubName] = useState('');
  const [editingSubHours, setEditingSubHours] = useState(4);
  const [editingSubColor, setEditingSubColor] = useState('');

  // Notification feedback state
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // --- Custom Confirm Dialog state ---
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showSavedNotification = (msg: string) => {
    setSavedMessage(msg);
    setTimeout(() => {
      setSavedMessage(null);
    }, 3000);
  };

  // Handle saving school details & duration
  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    onUpdateSettings({
      ...settings,
      schoolName: schoolName.trim(),
      lessonDuration: Number(lessonDuration),
    });
    showSavedNotification('Profil sekolah & durasi berhasil diperbarui!');
  };

  // Handle adding custom subject
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || !newSubName.trim()) return;

    // Check if duplicate name exists
    const isDuplicate = subjects.some(s => s.name.toLowerCase() === newSubName.trim().toLowerCase());
    if (isDuplicate) {
      alert('Nama mata pelajaran ini sudah ada dalam daftar!');
      return;
    }

    const sub: Subject = {
      id: `s_${Date.now()}`,
      name: newSubName.trim(),
      color: newSubColor,
      weeklyHours: Number(newSubHours)
    };

    onUpdateSubjects([...subjects, sub]);
    setNewSubName('');
    showSavedNotification('Mata pelajaran baru berhasil ditambahkan!');
  };

  // Handle deleting a subject
  const handleDeleteSubject = (id: string) => {
    if (isReadOnly) return;
    setConfirmDialog({
      title: 'Hapus Mata Pelajaran?',
      message: 'Apakah Anda yakin ingin menghapus mata pelajaran ini? Jadwal yang menggunakan mapel ini akan dikosongkan.',
      onConfirm: () => {
        const updated = subjects.filter(s => s.id !== id);
        onUpdateSubjects(updated);
        showSavedNotification('Mata pelajaran berhasil dihapus');
      }
    });
  };

  // Initialize editing form
  const startEditSubject = (item: Subject) => {
    setEditingSubId(item.id);
    setEditingSubName(item.name);
    setEditingSubHours(item.weeklyHours);
    setEditingSubColor(item.color);
  };

  // Save the edited subject
  const handleSaveEditSubject = () => {
    if (isReadOnly || !editingSubName.trim()) return;
    const updated = subjects.map(s => 
      s.id === editingSubId 
        ? { ...s, name: editingSubName.trim(), color: editingSubColor, weeklyHours: Number(editingSubHours) } 
        : s
    );
    onUpdateSubjects(updated);
    setEditingSubId(null);
    showSavedNotification('Pembaruan mata pelajaran berhasil disimpan!');
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
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Pengaturan Ringkas</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi terpadu untuk nama sekolah, alokasi jam mengajar mata pelajaran, beserta durasi 1 jam pelajaran (JP).
            </p>
          </div>
        </div>
      </div>

      {isReadOnly && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <p className="font-bold">Mode Lihat Saja (Viewer Mode)</p>
            <p>Konfigurasi sekolah dinonaktifkan dalam mode ini. Silakan ubah peran pengguna di dashboard utama untuk menyunting.</p>
          </div>
        </div>
      )}

      {/* Floating Notification */}
      {savedMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-950 text-white font-semibold px-4 py-3 rounded-xl shadow-xl text-xs flex items-center gap-2 animate-bounce border border-slate-850">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: School Name & Lesson Duration Settings */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800/60">
              <Building className="w-5 h-5 text-indigo-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Profil & Durasi Belajar</h3>
            </div>

            {/* Input 1: School Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <span>Nama Sekolah</span>
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Contoh: SD Negeri Cemerlang"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-705 rounded-xl focus:border-blue-500 outline-none text-slate-800 dark:text-white transition-all font-semibold"
              />
            </div>

            {/* Input 2: Lesson Duration */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Durasi 1 Jam Pelajaran (Menit)
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  disabled={isReadOnly}
                  min={15}
                  max={90}
                  value={lessonDuration}
                  onChange={(e) => setLessonDuration(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-705 rounded-xl focus:border-blue-500 outline-none text-slate-800 dark:text-white transition-all font-mono font-bold pr-12"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] uppercase font-sans">
                  Menit
                </span>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 italic mt-1 leading-normal">
                Standard sekolah dasar (SD) berkisar antara 35 s.d. 40 menit per JP, SMP/SMA berkisar 45 menit.
              </p>
            </div>

            {!isReadOnly && (
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Profil & Durasi
              </button>
            )}
          </form>

          {/* Quick info panel */}
          <div className="bg-blue-50/40 dark:bg-slate-900/40 border border-blue-100/55 dark:border-indigo-950/70 p-5 rounded-2xl space-y-3 leading-relaxed text-xs text-slate-600 dark:text-slate-400">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Bagaimana data ini memengaruhi berkas cetakan?</span>
            </h4>
            <p>
              Modifikasi <b>Nama Sekolah</b> dan <b>Durasi Jam Pelajaran (JP)</b> akan langsung diintegrasikan ke tajuk surat dinas serta perhitungan waktu operasional pada modul cetak/ekspor PDF.
            </p>
            <p>
              Perubahan <b>Mata Pelajaran & Alokasi Jam</b> membantu menyaring mata pelajaran pada papan penyusun agar beban mengajar tiap guru terkendali secara proporsional.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Subject & Alokasi Jam Management */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-101 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800/60">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">Kelola Mata Pelajaran & Alokasi Jam</h3>
            </div>

            {/* Quick Add Form Section */}
            {!isReadOnly && (
              <form onSubmit={handleAddSubjectSubmit} className="bg-slate-50 dark:bg-slate-850/50 p-4 rounded-xl border border-slate-150/50 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-[10px] text-slate-500 uppercase tracking-widest leading-none">Tambah Mata Pelajaran Baru</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6 space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Nama Mata Pelajaran</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: IPS Terpadu atau Bahasa Jawa"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500"
                    />
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Durasi JP / Minggu</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={12}
                      value={newSubHours}
                      onChange={(e) => setNewSubHours(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah Mapel
                    </button>
                  </div>
                </div>

                {/* Color tag presets */}
                <div className="space-y-1 pt-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase block">Label Warna Tag</label>
                  <div className="flex flex-wrap gap-1.5">
                    {THEME_COLORS.map(c => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setNewSubColor(c.value)}
                        className={`w-5 h-5 rounded-full border transition-all ${
                          newSubColor === c.value ? 'ring-2 ring-blue-500 border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              </form>
            )}

            {/* Subject List Table */}
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 dark:border-slate-850">
                    <th className="px-4 py-2.5 w-12 text-center">Tag</th>
                    <th className="px-4 py-2.5">Nama Mata Pelajaran</th>
                    <th className="px-4 py-2.5 w-36">Beban Jam / Minggu</th>
                    {!isReadOnly && <th className="px-4 py-2.5 text-right w-24">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150/55 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400 font-medium">
                        Belum ada daftar mata pelajaran. Silakan tambahkan mendaftar baru di atas.
                      </td>
                    </tr>
                  ) : (
                    subjects.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10">
                        <td className="px-4 py-3 text-center">
                          {editingSubId === item.id ? (
                            <div className="flex justify-center gap-1">
                              {THEME_COLORS.map(c => (
                                <button
                                  key={c.value}
                                  type="button"
                                  onClick={() => setEditingSubColor(c.value)}
                                  className={`w-3.5 h-3.5 rounded-full border ${
                                    editingSubColor === c.value ? 'ring-1 ring-blue-500 border-white scale-110' : 'border-transparent'
                                  }`}
                                  style={{ backgroundColor: c.value }}
                                  title={c.name}
                                />
                              ))}
                            </div>
                          ) : (
                            <div 
                              className="w-3.5 h-3.5 rounded-full border border-slate-200 dark:border-slate-700 mx-auto" 
                              style={{ backgroundColor: item.color }} 
                            />
                          )}
                        </td>
                        
                        <td className="px-4 py-3 font-bold text-slate-800 dark:text-white">
                          {editingSubId === item.id ? (
                            <input
                              type="text"
                              value={editingSubName}
                              onChange={(e) => setEditingSubName(e.target.value)}
                              className="w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-305 dark:border-slate-700 outline-none text-slate-800 dark:text-white rounded font-semibold text-xs"
                            />
                          ) : (
                            item.name
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {editingSubId === item.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={1}
                                max={12}
                                value={editingSubHours}
                                onChange={(e) => setEditingSubHours(Number(e.target.value))}
                                className="w-14 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-305 dark:border-slate-700 outline-none text-slate-800 dark:text-white rounded font-mono font-bold text-xs"
                              />
                              <span className="text-[10px] text-slate-450 uppercase font-bold">JP</span>
                            </div>
                          ) : (
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {item.weeklyHours} JP <span className="text-[10px] text-slate-400 font-sans font-medium">/Minggu</span>
                            </span>
                          )}
                        </td>

                        {!isReadOnly && (
                          <td className="px-4 py-3 text-right">
                            {editingSubId === item.id ? (
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={handleSaveEditSubject}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="Simpan"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingSubId(null)}
                                  className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Batal"
                                >
                                  <Trash2 className="w-4 h-4 text-slate-400" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => startEditSubject(item)}
                                  className="p-1 text-slate-500 hover:text-blue-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-all inline-block"
                                  title="Suntiq Mapel"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubject(item.id)}
                                  className="p-1 text-slate-500 hover:text-red-650 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer transition-all inline-block"
                                  title="Hapus Mapel"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
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
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
