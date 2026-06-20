/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  FileText, 
  FileSpreadsheet, 
  HelpCircle, 
  Check, 
  Download, 
  Users, 
  Clock, 
  Layers,
  ChevronRight,
  Eye,
  Award,
  Signature
} from 'lucide-react';
import { SchoolSettings, ClassItem, Subject, Extracurricular, ScheduleItem, DAYS_OF_WEEK } from '../types';

interface ExportPanelProps {
  settings: SchoolSettings;
  classes: ClassItem[];
  subjects: Subject[];
  extracurriculars: Extracurricular[];
  schedules: ScheduleItem[];
  userRole: 'admin' | 'operator' | 'viewer';
}

export default function ExportPanel({
  settings,
  classes,
  subjects,
  extracurriculars,
  schedules,
  userRole,
}: ExportPanelProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'word'>('pdf');
  const [signDate, setSignDate] = useState<string>('2026-06-20');

  // Popup feedback message helper
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const triggerFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Compile times for display in document
  const periodTimes = useMemo(() => {
    const times: string[] = [];
    let currentHour = 7;
    let currentMin = 0;

    for (let period = 0; period < settings.lessonsPerDay; period++) {
      const breakMatch = settings.breaks.find(b => b.afterPeriod === period);
      if (breakMatch) {
        currentMin += breakMatch.duration;
        while (currentMin >= 60) { currentMin -= 0.1; currentMin -= 59.9; currentHour += 1; }
      }

      const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      currentMin += settings.lessonDuration;
      while (currentMin >= 60) { currentMin -= 60; currentHour += 1; }
      const endStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      
      times.push(`${startStr}-${endStr}`);
    }
    return times;
  }, [settings.lessonsPerDay, settings.lessonDuration, settings.breaks]);

  // EXPORT 1: EXCEL (XLS/CSV with tabs so it parses flawlessly into rich columns)
  const handleExportExcel = () => {
    const activeClasses = selectedClassId === 'all' ? classes : classes.filter(c => c.id === selectedClassId);
    
    // Create Excel friendly layout text content (CSV syntax with tabular separation)
    let excelContent = `sep=\\t\r\nJADWAL PELAJARAN - ${settings.schoolName.toUpperCase()}\r\n`;
    excelContent += `Tahun Ajaran: ${settings.academicYear} \\t Semester: ${settings.semester}\\t Operator: ${settings.operatorName}\r\n\r\n`;

    activeClasses.forEach(cl => {
      excelContent += `ROMBEL: ${cl.name.toUpperCase()}\r\n`;
      // Header columns
      excelContent += `Jam Pelajaran\\tWaktu\\t` + DAYS_OF_WEEK.slice(0, settings.effectiveDays).join('\\t') + `\r\n`;

      // Fill periods
      for (let pIdx = 0; pIdx < settings.lessonsPerDay; pIdx++) {
        let rowStr = `Jam Ke-${pIdx + 1}\\t${periodTimes[pIdx] || ''}`;

        for (let dIdx = 0; dIdx < settings.effectiveDays; dIdx++) {
          const item = schedules.find(s => s.classId === cl.id && s.dayIndex === dIdx && s.periodIndex === pIdx);
          const sub = item?.subjectId ? (item.subjectId === 'UPACARA' ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } : subjects.find(s => s.id === item.subjectId)) : null;
          const label = sub ? `${sub.name} (${item?.teacherName || 'Pembina Upacara'})` : '-';
          rowStr += `\\t${label}`;
        }
        excelContent += rowStr + `\r\n`;
      }
      excelContent += `\r\n\r\n`;
    });

    // Un-escape tab strings
    const output = excelContent.replace(/\\t/g, '\t');

    const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Jadwal_${selectedClassId === 'all' ? 'Lengkap' : 'Kelas_' + selectedClassId}_JadwalKu.xls`;
    link.click();

    triggerFeedback('Sukses mengekspor Microsoft Excel! Berkas diunduh otomatis.');
  };

  // EXPORT 2: WORD (HTML format representing MS Word native parser layout)
  const handleExportWord = () => {
    const activeClasses = selectedClassId === 'all' ? classes : classes.filter(c => c.id === selectedClassId);
    
    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Jadwal Pelajaran JadwalKu</title>
        <style>
          body { font-family: 'Arial', sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #333333; padding: 6px; font-size: 11px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header-title { font-size: 16px; font-weight: bold; text-align: center; text-transform: uppercase; }
        </style>
      </head>
      <body>
    `;

    activeClasses.forEach(cl => {
      htmlContent += `
        <div style="page-break-after: always; margin-bottom: 40px;">
          <p class="header-title">${settings.schoolName}</p>
          <p style="text-align: center; font-size: 12px; margin-top: -10px;">Jadwal Pelajaran ${cl.name} - Tahun Pelajaran ${settings.academicYear}</p>
          
          <table>
            <thead>
              <tr>
                <th>Jam / Waktu</th>
                ${DAYS_OF_WEEK.slice(0, settings.effectiveDays).map(d => `<th>${d}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
      `;

      for (let pIdx = 0; pIdx < settings.lessonsPerDay; pIdx++) {
        htmlContent += `
          <tr>
            <td>Jam ke-${pIdx + 1}<br/>${periodTimes[pIdx] || ''}</td>
            ${Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
              const item = schedules.find(s => s.classId === cl.id && s.dayIndex === dIdx && s.periodIndex === pIdx);
              const sub = item?.subjectId ? (item.subjectId === 'UPACARA' ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } : subjects.find(s => s.id === item.subjectId)) : null;
              return `<td>${sub ? `<b>${sub.name}</b><br/><i>${item?.teacherName || (item.subjectId === 'UPACARA' ? 'Pembina Upacara' : 'Guru')}</i>` : '-'}</td>`;
            }).join('')}
          </tr>
        `;
      }

      htmlContent += `
            </tbody>
          </table>
          <br/>
          <table style="border: none; width: 100%;">
            <tr style="border: none;">
              <td style="border: none; text-align: left; width: 50%;">Mengetahui,<br/>Kepala Sekolah</td>
              <td style="border: none; text-align: right; width: 50%;">Jakarta, ${new Date(signDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Operator Kurikulum<br/><br/><br/><b>${settings.operatorName}</b></td>
            </tr>
          </table>
        </div>
      `;
    });

    htmlContent += `</body></html>`;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Jadwal_${selectedClassId === 'all' ? 'Lengkap' : 'Kelas_' + selectedClassId}_JadwalKu.doc`;
    link.click();

    triggerFeedback('Sukses mengekspor Microsoft Word! Berkas siap cetak berhasil diunduh.');
  };

  // EXPORT 3: PDF / DIRECT LANDSCAPE PRINT DIALOG
  const handlePrintPDF = () => {
    // Hide standard web app elements, launch window print on beautiful iframe or direct window triggers
    window.print();
    triggerFeedback('Sistem cetak PDF diaktifkan!');
  };

  // Formed single active class list for preview frame
  const selectedClassDetails = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950/65 text-emerald-600 rounded-xl">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">Ekspor & Cetak Jadwal Profesional</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Konfigurasi cetakan fisik jadwal kelas / master. Siap ekspor ke format PDF, Microsoft Excel, dan Microsoft Word.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white font-semibold px-4 py-2.5 rounded-lg shadow-xl text-xs flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Panel & Print View Options */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left config form panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 self-start">
          <h3 className="font-bold text-slate-850 dark:text-white text-sm">Opsi Lembar Cetakan</h3>

          <div className="space-y-4 text-xs font-semibold">
            {/* 1. Target Class selector */}
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Pilih Rombel Target</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl outline-none text-slate-800 dark:text-white focus:border-blue-500"
              >
                <option value="all">Cetak Seluruh Kelas (Master Sheet)</option>
                {classes.map(cl => (
                  <option key={cl.id} value={cl.id}>{cl.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Signature date picker */}
            <div className="space-y-1.5">
              <label className="text-slate-500 uppercase text-[10px]">Tanggal Tanda Tangan Dokumen</label>
              <input
                type="date"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-705 rounded-xl outline-none text-slate-800 dark:text-white"
              />
            </div>

            {/* 3. Export formats big action buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-2">
              <label className="text-slate-500 uppercase text-[10px] block mb-2">Pilih Format & Unduh</label>

              <button
                onClick={handlePrintPDF}
                className="w-full flex items-center justify-between p-3 bg-red-50/75 hover:bg-red-100/80 border border-red-100 dark:bg-slate-850 text-red-700 dark:text-red-400 rounded-xl transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-red-600" />
                  <div>
                    <h5 className="font-bold text-xs">PDF / Print Out</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Layout landscape rapi, Header dinas</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleExportExcel}
                className="w-full flex items-center justify-between p-3 bg-emerald-50/75 hover:bg-emerald-100/80 border border-emerald-100 dark:bg-slate-850 text-emerald-700 dark:text-emerald-400 rounded-xl transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h5 className="font-bold text-xs">Microsoft Excel</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Format tabular, menyesuaikan kolom</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleExportWord}
                className="w-full flex items-center justify-between p-3 bg-blue-50/75 hover:bg-blue-100/80 border border-blue-100 dark:bg-slate-850 text-blue-700 dark:text-blue-400 rounded-xl transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <h5 className="font-bold text-xs">Microsoft Word</h5>
                    <p className="text-[10px] text-slate-500 font-medium">Bentuk dokumen siap sunting & rilis</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Active Printable Preview Frame */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-xs text-slate-450 font-bold uppercase tracking-wider pl-1">
            <Eye className="w-4 h-4" />
            <span>Pratinjau Cetakan Fisik (WYSWYG)</span>
          </div>

          <div id="printable-schedule-area" className="bg-white text-black p-8 rounded-2xl border border-slate-205 shadow-md space-y-6 overflow-x-auto min-w-80">
            {/* INPRINT STYLE BLOCK */}
            <style>{`
              @media print {
                body { background: white !important; color: black !important; }
                #root { background: white !important; }
                .no-print, header, nav, .sidebar-root, button, select, input { display: none !important; }
                #printable-schedule-area { border: none !important; padding: 0 !important; width: 100% !important; margin: 0 !important; box-shadow: none !important; }
              }
            `}</style>
            
            {/* 1. Official Ministry logo and header lines */}
            <div className="flex items-center justify-between border-b-4 border-double border-black pb-4">
              {/* Symbolic School Shield Emblem */}
              <div className="w-16 h-16 border-2 border-black rounded-lg flex items-center justify-center font-extrabold text-xs text-center border-double font-serif shrink-0">
                SDN<br/>H.B
              </div>
              
              <div className="text-center flex-1 mx-4">
                <h4 className="font-serif font-extrabold text-[11px] leading-tight text-center uppercase tracking-wider">
                  PEMERINTAH KABUPATEN / KOTA ADMINISTRASI
                </h4>
                <h3 className="font-sans font-black text-sm uppercase text-center leading-tight">
                  DINAS PENDIDIKAN DAN KEBUDAYAAN KECAMATAN
                </h3>
                <h2 className="font-sans font-black text-base uppercase text-center leading-none text-blue-900">
                  {settings.schoolName.toUpperCase()}
                </h2>
                <p className="font-serif italic text-[10px] mt-1 text-slate-600 text-center">
                  Alamat Gedung Sekolah: Jl. Pendidikan Nasional No. 45, Kecamatan Harapan, Jakarta Pusat • Telp: (021) 555-1234
                </p>
              </div>

              <div className="w-16 h-16 border border-dashed border-slate-300 rounded flex items-center justify-center text-[10px] shrink-0 text-slate-400 uppercase font-bold text-center">
                LOGO<br/>DAERAH
              </div>
            </div>

            {/* 2. Headline Title info */}
            <div className="text-center space-y-1">
              <h3 className="font-black font-sans text-xs uppercase tracking-wide">
                DAFTAR JADWAL PELAJARAN SEKOLAH
              </h3>
              <p className="text-xs leading-none">
                Tahun Ajaran: <span className="font-bold">{settings.academicYear}</span> • Semester: <span className="font-bold">{settings.semester === 1 ? '1 (Ganjil)' : '2 (Genap)'}</span>
              </p>
            </div>

            {/* 3. Embedded Classes timetables maps */}
            {classes
              .filter(cl => selectedClassId === 'all' || cl.id === selectedClassId)
              .map(cl => {
                const classSchedules = schedules.filter(s => s.classId === cl.id);
                
                return (
                  <div key={cl.id} className="space-y-3 pt-4 border-t border-dashed border-slate-200">
                    <div className="flex justify-between items-center bg-gray-100 px-4 py-1 rounded">
                      <span className="font-black text-xs">ROMBEL: {cl.name.toUpperCase()}</span>
                      <span className="text-[10px] font-semibold text-slate-600">Wajib Belajar - {settings.effectiveDays} Hari Kerja</span>
                    </div>

                    <table className="w-full text-center border-collapse border border-black text-[10px]">
                      <thead>
                        <tr className="bg-gray-250 border-b border-black">
                          <th className="border border-black p-1.5 font-bold w-20">Jam / Waktu</th>
                          {DAYS_OF_WEEK.slice(0, settings.effectiveDays).map((day, dIdx) => (
                            <th key={dIdx} className="border border-black p-1.5 font-bold">{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: settings.lessonsPerDay }).map((_, pIdx) => {
                          const isBreakBefore = settings.breaks.find(b => b.afterPeriod === pIdx);
                          const elements = [];

                          if (isBreakBefore) {
                            elements.push(
                              <tr key={`print-break-${pIdx}`} className="bg-gray-100 italic">
                                <td className="border border-black p-1 text-[8px] font-mono select-none uppercase">Istirahat</td>
                                <td colSpan={settings.effectiveDays} className="border border-black p-1 text-[9px] font-bold">
                                  {isBreakBefore.label} ({isBreakBefore.duration} Menit)
                                </td>
                              </tr>
                            );
                          }

                          elements.push(
                            <tr key={`print-period-${pIdx}`}>
                              <td className="border border-black p-1 bg-gray-50/50">
                                <div className="font-bold">Ke-{pIdx + 1}</div>
                                <div className="text-[8px] font-mono leading-none mt-0.5">{periodTimes[pIdx]}</div>
                              </td>
                              {Array.from({ length: settings.effectiveDays }).map((_, dIdx) => {
                                const sVal = classSchedules.find(s => s.dayIndex === dIdx && s.periodIndex === pIdx);
                                const sub = sVal?.subjectId ? (sVal.subjectId === 'UPACARA' ? { id: 'UPACARA', name: 'UPACARA', color: '#475569', weeklyHours: 2 } : subjects.find(s => s.id === sVal.subjectId)) : null;
                                return (
                                  <td key={dIdx} className="border border-black p-1.5 align-top">
                                    {sub ? (
                                      <div className="space-y-0.5 leading-tight">
                                        <div className="font-bold">{sub.name}</div>
                                        <div className="text-[9px] text-slate-600 italic">👤 {sVal?.teacherName || (sVal?.subjectId === 'UPACARA' ? 'Pembina Upacara' : 'Guru')}</div>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400">-</span>
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
                );
              })}

            {/* 4. Signature Block seal footer */}
            <div className="pt-8 flex justify-between text-xs font-serif leading-relaxed">
              <div className="w-56 space-y-12">
                <p>Mengetahui,<br/>Kepala Sekolah {settings.schoolName}</p>
                <div className="space-y-0.5">
                  <p className="font-bold underline uppercase">Drs. H. Mulyono, M.Pd.</p>
                  <p className="text-[10px] text-slate-500">NIP. 19720512 200003 1 002</p>
                </div>
              </div>

              <div className="w-64 text-right space-y-12">
                <p>
                  Jakarta, {new Date(signDate).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  <br/>
                  Operator Akademik / Kurikulum
                </p>
                <div className="space-y-0.5">
                  <p className="font-bold underline text-right">{settings.operatorName}</p>
                  <p className="text-[10px] text-slate-500 text-right">Penanggungjawab Data Sekolah</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
