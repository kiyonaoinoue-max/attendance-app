export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early_leave';

export interface Student {
  id: string;
  studentNumber: number; // 出席番号
  name: string;
  className: string;
  grade: number; // 1 or 2
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
  holidayName?: string; // 祝日名（例: 昭和の日）
  overrideNote?: string; // 休講理由など
}

export interface AppSettings {
  termStartDate: string;
  termEndDate: string;
  firstTerm: { start: string; end: string };
  secondTerm: { start: string; end: string };
  // Period configuration
  periodCount: 4 | 6 | 8;
  hourPerPeriod: number;
  // Timetables structured by Grade -> Term
  timetables: {
    year1: {
      first: Record<string, string>;
      second: Record<string, string>;
    };
    year2: {
      first: Record<string, string>;
      second: Record<string, string>;
    };
  };
  // Temporary timetable overrides for specific dates
  // key: "yyyy-MM-dd-period" (e.g. "2026-04-28-2"), value: subjectId
  timetableOverrides?: Record<string, string>;
}

export interface AppState {
  students: Student[];
  subjects: Subject[];
  attendanceRecords: AttendanceRecord[];
  calendar: CalendarDay[];
  settings: AppSettings;
  syncCode: string | null;
  syncExpiresAt: number | null;
  lastSyncTime: number | null;
  selectedGrade: number;

  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;

  setSelectedGrade: (grade: number) => void;

  addSubject: (subject: Omit<Subject, 'id'>) => void;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  toggleAttendance: (studentId: string, date: string, period: number, status: AttendanceStatus | null) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;

  generateCalendar: (start: string, end: string) => void;
  applyNationalHolidays: () => Promise<void>;
  toggleHoliday: (date: string) => void;

  setTimetableOverride: (date: string, period: number, subjectId: string | null) => void;

  exportData: () => string;
  importData: (code: string) => boolean;

  setSyncState: (code: string | null, expiresAt: number | null) => void;
  setLastSyncTime: (time: number) => void;

  // Reset functions
  resetSettings: () => void;
  resetAttendance: () => void;
  resetAll: () => void;

  // License
  licenseKey: string | null;
  licenseExpiry: number | null;
  evalUsed: boolean;
  activateLicense: (key: string) => false | 'pro' | 'eval' | 'eval_used';
  getLicenseStatus: () => 'free' | 'pro' | 'eval' | 'expired';
}
