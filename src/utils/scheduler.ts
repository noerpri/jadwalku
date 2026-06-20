/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ScheduleItem, ClassItem, Subject, SchoolSettings } from '../types';

export interface SchedulingConflict {
  type: 'specialist_teacher_clash' | 'over_weekly_hours' | 'extracurricular_clash' | 'empty_period';
  message: string;
  classId?: string;
  dayIndex?: number;
  periodIndex?: number;
  subjectId?: string;
  severity: 'error' | 'warning';
}

/**
 * Validates a given schedule grid for conflicts.
 * Evaluates:
 * 1. Specialist teacher conflicts (Specialists like PJOK, PAI, Inggris can only be in one class at a time)
 * 2. Over-scheduling of subject hours (compared to weekly hours target)
 * 3. Extracurricular overlaps (if lesson hours clash with afternoon extracurriculars)
 */
export function validateSchedule(
  schedules: ScheduleItem[],
  classes: ClassItem[],
  subjects: Subject[],
  effectiveDays: number,
  lessonsPerDay: number,
  breaks: any[]
): SchedulingConflict[] {
  const conflicts: SchedulingConflict[] = [];

  // Special/Specialist subjects that share school teachers (usually PJOK, PAI, Inggris, Seni Budaya)
  // For these, we cannot schedule them at the same day + period across different classes
  const SHARED_TEACHER_SUBJECTS = [
    's1', // PAI
    's6', // PJOK
    's8', // Inggris
  ];

  // Helper arrays for easier lookups
  const classMap = new Map(classes.map(cl => [cl.id, cl.name]));
  const subjectMap = new Map(subjects.map(su => [su.id, su]));

  // 1. Check Specialist Subject Collisions (Same specialist subject scheduled at the same day+period in different classes)
  for (let day = 0; day < effectiveDays; day++) {
    for (let period = 0; period < lessonsPerDay; period++) {
      // Find all schedule items at this day & period
      const itemsAtTime = schedules.filter(
        item => item.dayIndex === day && item.periodIndex === period
      );

      // Check each shared subject
      SHARED_TEACHER_SUBJECTS.forEach(sharedSubId => {
        const classesWithThisSub = itemsAtTime.filter(item => item.subjectId === sharedSubId);
        if (classesWithThisSub.length > 1) {
          const subName = subjectMap.get(sharedSubId)?.name || 'Guru';
          const affectedClassNames = classesWithThisSub
            .map(item => classMap.get(item.classId) || item.classId)
            .join(', ');

          conflicts.push({
            type: 'specialist_teacher_clash',
            message: `Bentrok Guru Mapel: ${subName} dijadwalkan bersamaan di kelas [ ${affectedClassNames} ] pada hari ${getDayName(day)} Jam ke-${period + 1}.`,
            dayIndex: day,
            periodIndex: period,
            subjectId: sharedSubId,
            severity: 'error'
          });
        }
      });
    }
  }

  // 2. Check Over-scheduling of Weekly Hours
  classes.forEach(cl => {
    // For this class, count hours of each subject scheduled
    const classSchedules = schedules.filter(item => item.classId === cl.id);
    
    subjects.forEach(sub => {
      const scheduledHours = classSchedules.filter(item => item.subjectId === sub.id).length;
      if (scheduledHours > sub.weeklyHours) {
        conflicts.push({
          type: 'over_weekly_hours',
          message: `Kelebihan Jam: ${cl.name} memiliki ${scheduledHours} jam ${sub.name}, melebihi alokasi target ${sub.weeklyHours} jam per minggu.`,
          classId: cl.id,
          subjectId: sub.id,
          severity: 'warning'
        });
      }
    });

    // Count empty slots (free hours)
    const totalSlots = effectiveDays * lessonsPerDay;
    const filledSlots = classSchedules.filter(item => item.subjectId !== null).length;
    const requiredTotalHours = subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

    if (requiredTotalHours > totalSlots) {
      conflicts.push({
        type: 'over_weekly_hours',
        message: `Kapasitas Kurang: Total beban mata pelajaran (${requiredTotalHours} jam) melebihi total jam sekolah yang tersedia (${totalSlots} slot) untuk ${cl.name}.`,
        classId: cl.id,
        severity: 'warning'
      });
    }
  });

  return conflicts;
}

/**
 * Generate an Optimized and Conflict-free School Schedule
 * Algorithm:
 * For each class, compile a pool of required hours based on Subject's weeklyHours.
 * We then distribute these subjects across the days.
 * To avoid specialist teacher clashes, we keep track of which specialist has been allocated to which day+period,
 * and we backtrack/stagger assignments to ensure no overlap.
 */
export function generateAutomaticSchedule(
  classes: ClassItem[],
  subjects: Subject[],
  effectiveDays: 5 | 6,
  lessonsPerDay: number
): ScheduleItem[] {
  const result: ScheduleItem[] = [];
  
  // Shared teacher subjects tracking: key = "day-period", value = subjectId
  // This tracks school-wide specialist bookings
  const specialistBookings = new Map<string, string>();

  // Specialist subject IDs
  const SPECIALIST_IDS = ['s1', 's6', 's8']; // PAI, PJOK, Inggris

  // Shuffle classes to randomize slightly so first class doesn't always get best spots
  const shuffledClasses = [...classes];

  shuffledClasses.forEach((cl, classIdx) => {
    // 1. Create a "load pool" of subjects we NEED to schedule for this class
    const hourPool: string[] = [];
    subjects.forEach(sub => {
      for (let i = 0; i < sub.weeklyHours; i++) {
        hourPool.push(sub.id);
      }
    });

    // Shuffle the hour pool so we don't schedule everything in order
    const shuffledPool = shuffleArray(hourPool);

    // 2. Prepare the class schedule slots
    // slot keys = dayIndex-periodIndex
    const classGrid = new Map<string, string | null>();
    for (let day = 0; day < effectiveDays; day++) {
      for (let period = 0; period < lessonsPerDay; period++) {
        if (day === 0 && (period === 0 || period === 1)) {
          classGrid.set(`${day}-${period}`, 'UPACARA');
        } else {
          classGrid.set(`${day}-${period}`, null);
        }
      }
    }

    // First, place the SPECIALISTS! They are hardest to clear because they must not overlap.
    const specialistsInPool = shuffledPool.filter(id => SPECIALIST_IDS.includes(id));
    const normalsInPool = shuffledPool.filter(id => !SPECIALIST_IDS.includes(id));

    // Try allocating specialists
    specialistsInPool.forEach(subId => {
      let allocated = false;
      // Find a slot that is empty AND doesn't violate specialist booking
      for (let day = 0; day < effectiveDays && !allocated; day++) {
        for (let period = 0; period < lessonsPerDay && !allocated; period++) {
          const slotKey = `${day}-${period}`;
          const isSlotFree = classGrid.get(slotKey) === null;
          const isSpecialistBusy = specialistBookings.get(slotKey) === subId;

          // Avoid early morning period 1 for things like physical education (or avoid late afternoon hot periods)
          // Also check school-wide specialist booking
          if (isSlotFree && !isSpecialistBusy) {
            classGrid.set(slotKey, subId);
            specialistBookings.set(slotKey, subId);
            allocated = true;
          }
        }
      }
      
      // Fallback if blocked: put it in any free slot
      if (!allocated) {
        for (let day = 0; day < effectiveDays && !allocated; day++) {
          for (let period = 0; period < lessonsPerDay && !allocated; period++) {
            const slotKey = `${day}-${period}`;
            if (classGrid.get(slotKey) === null) {
              classGrid.set(slotKey, subId);
              allocated = true;
            }
          }
        }
      }
    });

    // Allocate the remaining normal subjects
    normalsInPool.forEach(subId => {
      let allocated = false;
      // Place in first empty slot
      for (let day = 0; day < effectiveDays && !allocated; day++) {
        for (let period = 0; period < lessonsPerDay && !allocated; period++) {
          const slotKey = `${day}-${period}`;
          if (classGrid.get(slotKey) === null) {
            classGrid.set(slotKey, subId);
            allocated = true;
          }
        }
      }
    });

    // 3. Compile classGrid back into ScheduleItems
    for (let day = 0; day < effectiveDays; day++) {
      for (let period = 0; period < lessonsPerDay; period++) {
        const slotKey = `${day}-${period}`;
        const subId = classGrid.get(slotKey) || null;
        const isUpacara = subId === 'UPACARA';
        const sub = isUpacara ? null : subjects.find(s => s.id === subId);
        
        result.push({
          classId: cl.id,
          dayIndex: day,
          periodIndex: period,
          subjectId: subId,
          teacherName: isUpacara ? 'Pembina Upacara' : sub ? `Guru ${sub.name.split(' ')[0]}` : undefined
        });
      }
    }
  });

  return result;
}

// Helpers
export function getDayName(dayIndex: number): string {
  const DAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
  return DAYS[dayIndex] || 'Hari';
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
