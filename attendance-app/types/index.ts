export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface Student {
  id: string;
  studentNumber: number; // 出席番号
  name: string;
  className: string;
}

export interface Subject {
  id: string;
  name: string;
  teacher: string;
  requiredHours: number;
}

export interface AttendanceRecord {
  studentId: string;
  date: string; // ISO date string YYYY-MM-DD
  period: number; // 0 for HR, 1-4 for periods
  status: AttendanceStatus;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  isHoliday: boolean;
  overrideNote?: string; // 休講理由など
}

export interface AppSettings {
  termStartDate: string;
  termEndDate: string;
  firstTerm: { start: string; end: string };
  secondTerm: { start: string; end: string };
  firstTermTimetable: Record<string, string>; // 前期時間割
  secondTermTimetable: Record<string, string>; // 後期時間割
}
