/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchoolSettings, ClassItem, Subject, Extracurricular, ScheduleItem } from './types';

export const INITIAL_SCHOOL_SETTINGS: SchoolSettings = {
  schoolName: 'SD Negeri Harapan Bangsa',
  academicYear: '2026/2027',
  semester: 1,
  effectiveDays: 5, // 5 Hari Sekolah (Senin - Jumat)
  lessonsPerDay: 8, // 8 jam pelajaran per hari
  lessonDuration: 35, // 35 menit per jam pelajaran
  breaks: [
    { id: 'b1', afterPeriod: 3, duration: 20, label: 'Istirahat I' },
    { id: 'b2', afterPeriod: 5, duration: 15, label: 'Istirahat II' }
  ],
  operatorName: 'Budi Santoso, S.Pd.'
};

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'c1', name: 'Kelas 1A' },
  { id: 'c2', name: 'Kelas 1B' },
  { id: 'c3', name: 'Kelas 2A' },
  { id: 'c4', name: 'Kelas 2B' },
  { id: 'c5', name: 'Kelas 3A' },
  { id: 'c6', name: 'Kelas 3B' },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Pendidikan Agama & Budi Pekerti (PAI)', color: '#ef4444', weeklyHours: 4 },
  { id: 's2', name: 'Pendidikan Pancasila (PPkn)', color: '#f97316', weeklyHours: 2 },
  { id: 's3', name: 'Bahasa Indonesia', color: '#10b981', weeklyHours: 6 },
  { id: 's4', name: 'Matematika', color: '#3b82f6', weeklyHours: 5 },
  { id: 's5', name: 'Ilmu Pengetahuan Alam & Sosial (IPAS)', color: '#06b6d4', weeklyHours: 4 },
  { id: 's6', name: 'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)', color: '#eab308', weeklyHours: 3 },
  { id: 's7', name: 'Seni Budaya & Prakarya', color: '#8b5cf6', weeklyHours: 4 },
  { id: 's8', name: 'Bahasa Inggris', color: '#ec4899', weeklyHours: 2 }
];

export const INITIAL_EXTRACURRICULARS: Extracurricular[] = [
  { id: 'e1', name: 'Pramuka (Wajib)', day: 4, timeStart: '14:00', timeEnd: '15:30' }, // Jumat
  { id: 'e2', name: 'Futsal', day: 2, timeStart: '14:30', timeEnd: '16:00' }, // Rabu
  { id: 'e3', name: 'Seni Tari', day: 1, timeStart: '14:00', timeEnd: '15:30' }, // Selasa
  { id: 'e4', name: 'Tahfidz Al-Qur\'an', day: 3, timeStart: '14:00', timeEnd: '15:15' }, // Kamis
  { id: 'e5', name: 'Drumband / Musik', day: 0, timeStart: '14:00', timeEnd: '15:30' }, // Senin
];

// Helper to seed scheduling items
export function generateInitialSchedules(classes: ClassItem[], subjects: Subject[], lessonsCount: number, effectiveDays: number): ScheduleItem[] {
  const items: ScheduleItem[] = [];
  
  // A simple deterministic allocation of classes to make a populated and valid-ish schedule
  classes.forEach((clf, classIndex) => {
    for (let day = 0; day < effectiveDays; day++) {
      for (let period = 0; period < lessonsCount; period++) {
        // Do not place classes if of certain patterns
        // Give each class a nice distribution of subjects
        // Subject selection based on day, period, classIndex
        const subjectIndex = (day + period + classIndex) % subjects.length;
        const sub = subjects[subjectIndex];
        
        let subId: string | null = sub.id;
        let teacherName = `Guru Mapel ${sub.name.split(' ')[0]}`;
        
        // Let's introduce some empty periods (e.g. Friday quiet afternoons, or late periods)
        if (day === 4 && period >= 5) {
          subId = null; // Jumat siang kosong/ekskul
        } else if (day === 0 && (period === 0 || period === 1)) {
          subId = 'UPACARA';
          teacherName = 'Pembina Upacara';
        }

        items.push({
          classId: clf.id,
          dayIndex: day,
          periodIndex: period,
          subjectId: subId,
          teacherName: subId === 'UPACARA' ? 'Pembina Upacara' : teacherName
        });
      }
    }
  });

  return items;
}
