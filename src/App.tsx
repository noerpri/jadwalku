/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings2, 
  Calendar, 
  Grid, 
  Printer, 
  HelpCircle, 
  Sun, 
  Moon, 
  CloudOff, 
  Database, 
  Upload, 
  Download, 
  Sparkles, 
  Check, 
  UserCheck, 
  Menu, 
  X,
  FileCheck,
  Sliders
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Types and helper data
import { 
  SchoolSettings, 
  ClassItem, 
  Subject, 
  Extracurricular, 
  ScheduleItem, 
  AcademicHoliday,
  UserRole
} from './types';
import { 
  INITIAL_SCHOOL_SETTINGS, 
  INITIAL_CLASSES, 
  INITIAL_SUBJECTS, 
  INITIAL_EXTRACURRICULARS,
  generateInitialSchedules 
} from './seedData';
import { DEFAULT_HOLIDAYS } from './holidays';

// Subcomponents
import Dashboard from './components/Dashboard';
import SchoolSettingsComponent from './components/SchoolSettings';
import ScheduleManager from './components/ScheduleManager';
import SchedulePreview from './components/SchedulePreview';
import AcademicCalendarView from './components/AcademicCalendarView';
import ExportPanel from './components/ExportPanel';
import QuickSettings from './components/QuickSettings';

export default function App() {
  // ----------------------------------------------------
  // LocalStorage State Deserializer & Sync Initiators
  // ----------------------------------------------------
  
  // Tab control
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  
  // Sidebar view for mobile screens
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Dark/Light view toggle state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // User Authority Role
  const [userRole, setUserRole] = useState<UserRole>('admin');

  // School settings state
  const [settings, setSettings] = useState<SchoolSettings>(() => {
    const local = localStorage.getItem('jadwalku_settings');
    if (local) return JSON.parse(local);
    return INITIAL_SCHOOL_SETTINGS;
  });

  // Regular classes state
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    const local = localStorage.getItem('jadwalku_classes');
    if (local) return JSON.parse(local);
    return INITIAL_CLASSES;
  });

  // Subjects lists
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const local = localStorage.getItem('jadwalku_subjects');
    if (local) return JSON.parse(local);
    return INITIAL_SUBJECTS;
  });

  // Extracurriculars lists
  const [extracurriculars, setExtracurriculars] = useState<Extracurricular[]>(() => {
    const local = localStorage.getItem('jadwalku_extracurriculars');
    if (local) return JSON.parse(local);
    return INITIAL_EXTRACURRICULARS;
  });

  // Active Indonesian Calendar Holiday database (can be appended with custom school holidays)
  const [holidays, setHolidays] = useState<AcademicHoliday[]>(() => {
    const local = localStorage.getItem('jadwalku_holidays');
    if (local) return JSON.parse(local);
    return DEFAULT_HOLIDAYS;
  });

  // Schedule grid cells
  const [schedules, setSchedules] = useState<ScheduleItem[]>(() => {
    const local = localStorage.getItem('jadwalku_schedules');
    if (local) return JSON.parse(local);
    // Seed on first loaded state automatically
    return generateInitialSchedules(INITIAL_CLASSES, INITIAL_SUBJECTS, INITIAL_SCHOOL_SETTINGS.lessonsPerDay, INITIAL_SCHOOL_SETTINGS.effectiveDays);
  });

  // UI notifications feedback
  const [systemNotify, setSystemNotify] = useState<string | null>(null);

  const showSystemNotification = (txt: string) => {
    setSystemNotify(txt);
    setTimeout(() => setSystemNotify(null), 3000);
  };

  // ----------------------------------------------------
  // Persistent Auto-Save Hook monitors
  // ----------------------------------------------------
  useEffect(() => {
    localStorage.setItem('jadwalku_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('jadwalku_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('jadwalku_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('jadwalku_extracurriculars', JSON.stringify(extracurriculars));
  }, [extracurriculars]);

  useEffect(() => {
    localStorage.setItem('jadwalku_holidays', JSON.stringify(holidays));
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem('jadwalku_schedules', JSON.stringify(schedules));
  }, [schedules]);

  // Dark class toggle
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // ----------------------------------------------------
  // Dynamic School-wide settings propagation cascade
  // (e.g. if periods per day changes, resize the schedules matrix)
  // ----------------------------------------------------
  const handleUpdateSchoolSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);

    // Expand or shrink schedule grid matrix if day configurations or periods modified
    const updatedSchedules = [...schedules];
    let itemsChanged = false;

    classes.forEach(cl => {
      for (let d = 0; d < newSettings.effectiveDays; d++) {
        for (let p = 0; p < newSettings.lessonsPerDay; p++) {
          const matchIdx = updatedSchedules.findIndex(
            s => s.classId === cl.id && s.dayIndex === d && s.periodIndex === p
          );
          
          if (matchIdx === -1) {
            // New position, append slot
            updatedSchedules.push({
              classId: cl.id,
              dayIndex: d,
              periodIndex: p,
              subjectId: null
            });
            itemsChanged = true;
          }
        }
      }
    });

    // Remove any overflow schedules from extra days or periods
    const prunedSchedules = updatedSchedules.filter(item => {
      const isClassValid = classes.some(c => c.id === item.classId);
      const isDayValid = item.dayIndex < newSettings.effectiveDays;
      const isPeriodValid = item.periodIndex < newSettings.lessonsPerDay;
      return isClassValid && isDayValid && isPeriodValid;
    });

    if (itemsChanged || prunedSchedules.length !== schedules.length) {
      setSchedules(prunedSchedules);
    }
  };

  const handleUpdateClasses = (newClasses: ClassItem[]) => {
    setClasses(newClasses);

    // Ensure schedules coordinates exist or get pruned for class modifications
    const updated = [...schedules];
    
    // Add slots for new classes
    newClasses.forEach(cl => {
      for (let d = 0; d < settings.effectiveDays; d++) {
        for (let p = 0; p < settings.lessonsPerDay; p++) {
          const exists = updated.some(s => s.classId === cl.id && s.dayIndex === d && s.periodIndex === p);
          if (!exists) {
            updated.push({
              classId: cl.id,
              dayIndex: d,
              periodIndex: p,
              subjectId: null
            });
          }
        }
      }
    });

    // Prune slots of deleted classes
    const cleaned = updated.filter(item => newClasses.some(c => c.id === item.classId));
    setSchedules(cleaned);
  };

  const handleAddCustomHoliday = (customH: AcademicHoliday) => {
    setHolidays([...holidays, customH]);
    showSystemNotification('Libur khusus sekolah ditambahkan!');
  };

  // Reset whole local storage parameters back to default state
  const handleResetToDefault = () => {
    setSettings(INITIAL_SCHOOL_SETTINGS);
    setClasses(INITIAL_CLASSES);
    setSubjects(INITIAL_SUBJECTS);
    setExtracurriculars(INITIAL_EXTRACURRICULARS);
    setHolidays(DEFAULT_HOLIDAYS);
    setSchedules(generateInitialSchedules(INITIAL_CLASSES, INITIAL_SUBJECTS, INITIAL_SCHOOL_SETTINGS.lessonsPerDay, INITIAL_SCHOOL_SETTINGS.effectiveDays));
    setActiveTab('dashboard');
    showSystemNotification('Database kembali disetel ke pengaturan standard.');
  };

  // ----------------------------------------------------
  // DATABASE SUITE: Backup (JSON) and Import (JSON Parser)
  // ----------------------------------------------------
  const handleBackupDatabase = () => {
    const fullBackup = {
      settings,
      classes,
      subjects,
      extracurriculars,
      holidays,
      schedules
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `JadwalKu_Database_Backup_${new Date().toISOString().split('07:00')[0]}.json`;
    a.click();
    showSystemNotification('Backup Database (.json) berhasil diunduh!');
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        // Basic schema validator test
        if (parsed.settings && parsed.classes && parsed.subjects && parsed.schedules) {
          setSettings(parsed.settings);
          setClasses(parsed.classes);
          setSubjects(parsed.subjects);
          if (parsed.extracurriculars) setExtracurriculars(parsed.extracurriculars);
          if (parsed.holidays) setHolidays(parsed.holidays);
          setSchedules(parsed.schedules);
          
          showSystemNotification('Sinkronisasi Pulih! Database sukses di-import!');
        } else {
          alert('Format berkas backup JSON tidak sesuai skema JADWALKU.');
        }
      } catch (err) {
        alert('Gagal membaca JSON berkas. Pastikan berkas berformat .json sehat.');
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className={`min-h-screen font-sans ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200`}>
      
      {/* Floating System auto save/notifications feedback */}
      {systemNotify && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 border border-slate-700 text-white dark:bg-blue-600 dark:border-blue-500 font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-bounce text-xs">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{systemNotify}</span>
        </div>
      )}

      {/* Modern App topbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-900/80 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 md:hidden text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-100 dark:shadow-none">
            J
          </div>
          <div>
            <span className="font-extrabold text-slate-800 dark:text-white text-base tracking-widest font-sans inline-flex items-center gap-1.5">
              JADWALKU 
              <span className="text-[9px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded-full animate-pulse capitalize tracking-normal italic">
                PRO
              </span>
            </span>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-3">
          {/* Offline/PWA indicator */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Offline Mode Aktif
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* User Role Quick Indicator badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 border px-3 py-1 rounded-lg text-[10px] font-bold capitalize text-slate-600 dark:text-slate-400">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Role: {userRole === 'admin' ? 'Administrator' : userRole === 'operator' ? 'Operator' : 'Viewer'}</span>
          </div>

          {/* Light/Dark mode toggler circle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-805 rounded-xl text-slate-600 dark:text-slate-350 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            title="Ubah Mode Visual"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* SIDEBAR NAVIGATION FRAME (REUSABLE COMPONENT) */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-105 dark:border-slate-900 bg-white dark:bg-slate-950 p-5 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static transition-transform duration-200 ease-in-out shrink-0 flex flex-col justify-between h-[calc(100vh-57px)]`}>
          
          <div className="space-y-6">
            {/* Mobile close bar */}
            <div className="md:hidden flex justify-end pb-2">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-455 hover:bg-slate-50 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* School Profile display segment */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block leading-tight">Instansi</span>
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-white leading-tight truncate">{settings.schoolName}</h4>
              <p className="text-[10px] text-slate-500">T.A: {settings.academicYear} • Smt: {settings.semester}</p>
            </div>

            {/* Primary Main Menu Lists */}
            <nav className="space-y-1 text-xs">
              {[
                { key: 'dashboard', label: 'Monitor Dashboard', icon: LayoutDashboard },
                { key: 'quick-settings', label: 'Pengaturan Ringkas', icon: Sliders },
                { key: 'settings', label: 'Pengaturan Sekolah', icon: Settings2 },
                { key: 'scheduler', label: 'Penyusun Jadwal', icon: Grid },
                { key: 'preview', label: 'Pratinjau Jadwal', icon: Grid },
                { key: 'calendar', label: 'Kalender Akademik', icon: Calendar },
                { key: 'export', label: 'Ekspor & Cetak', icon: Printer },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl font-bold tracking-wide transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none'
                        : 'text-slate-650 hover:bg-slate-50 dark:text-slate-350 dark:hover:bg-slate-900 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Database Backup & Restore Widgets Footer */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-900">
            <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 block pl-1">Perawatan Database</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={handleBackupDatabase}
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 cursor-pointer text-[10px] font-bold text-slate-700 dark:text-slate-300 gap-1"
                title="Cadangkan seluruh konfigurasi sekolah"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>Backup</span>
              </button>

              <label
                className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 cursor-pointer text-[10px] font-bold text-slate-700 dark:text-slate-300 gap-1 text-center"
                title="Pulihkan database dari berkas json"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
              </label>
            </div>
            
            <p className="text-[9px] italic text-slate-400 text-center">Version 1.0.0 • Offline-First Engine</p>
          </div>
        </aside>

        {/* MAIN BODY LAYOUT CONTAINER (DOCK PANEL FOR TABS) */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-57px)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-7xl mx-auto"
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  settings={settings}
                  classes={classes}
                  subjects={subjects}
                  extracurriculars={extracurriculars}
                  schedules={schedules}
                  holidays={holidays}
                  userRole={userRole}
                  onChangeRole={setUserRole}
                  onNavigate={setActiveTab}
                />
              )}

              {activeTab === 'quick-settings' && (
                <QuickSettings
                  settings={settings}
                  subjects={subjects}
                  userRole={userRole}
                  onUpdateSettings={handleUpdateSchoolSettings}
                  onUpdateSubjects={setSubjects}
                />
              )}

              {activeTab === 'settings' && (
                <SchoolSettingsComponent
                  settings={settings}
                  classes={classes}
                  subjects={subjects}
                  extracurriculars={extracurriculars}
                  userRole={userRole}
                  onUpdateSettings={handleUpdateSchoolSettings}
                  onUpdateClasses={handleUpdateClasses}
                  onUpdateSubjects={setSubjects}
                  onUpdateExtracurriculars={setExtracurriculars}
                  onResetToDefault={handleResetToDefault}
                />
              )}

              {activeTab === 'scheduler' && (
                <ScheduleManager
                  settings={settings}
                  classes={classes}
                  subjects={subjects}
                  extracurriculars={extracurriculars}
                  schedules={schedules}
                  userRole={userRole}
                  onUpdateSchedules={setSchedules}
                />
              )}

              {activeTab === 'preview' && (
                <SchedulePreview
                  settings={settings}
                  classes={classes}
                  subjects={subjects}
                  extracurriculars={extracurriculars}
                  schedules={schedules}
                />
              )}

              {activeTab === 'calendar' && (
                <AcademicCalendarView
                  holidays={holidays}
                  onAddCustomHoliday={handleAddCustomHoliday}
                  userRole={userRole}
                />
              )}

              {activeTab === 'export' && (
                <ExportPanel
                  settings={settings}
                  classes={classes}
                  subjects={subjects}
                  extracurriculars={extracurriculars}
                  schedules={schedules}
                  userRole={userRole}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
