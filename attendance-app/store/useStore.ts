import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Student, Subject, AttendanceRecord, AppSettings, CalendarDay, AttendanceStatus } from '@/types';
import { startOfYear, endOfYear, eachDayOfInterval, isSaturday, isSunday, format } from 'date-fns';

interface AppState {
    students: Student[];
    subjects: Subject[];
    attendanceRecords: AttendanceRecord[];
    calendar: CalendarDay[];
    settings: AppSettings;

    // Actions
    addStudent: (student: Omit<Student, 'id'>) => void;
    updateStudent: (id: string, data: Partial<Student>) => void;
    deleteStudent: (id: string) => void;

    addSubject: (subject: Omit<Subject, 'id'>) => void;
    updateSubject: (id: string, data: Partial<Subject>) => void;
    deleteSubject: (id: string) => void;

    toggleAttendance: (studentId: string, date: string, period: number, status?: AttendanceStatus | null) => void;

    updateSettings: (settings: Partial<AppSettings>) => void;
    generateCalendar: (start: string, end: string) => void;
    toggleHoliday: (date: string) => void;

    exportData: () => string;
    importData: (json: string) => boolean;
    syncCode: string | null;
    syncExpiresAt: number | null;
    setSyncState: (code: string | null, expiresAt: number | null) => void;
    lastSyncTime: number | null;
    setLastSyncTime: (time: number) => void;
}

const DEFAULT_STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late', 'early_leave'];

export const useStore = create<AppState>()(
    persist(
        (set, get) => ({
            students: [],
            subjects: [],
            attendanceRecords: [],
            calendar: [],
            settings: {
                termStartDate: format(startOfYear(new Date()), 'yyyy-MM-dd'),
                termEndDate: format(endOfYear(new Date()), 'yyyy-MM-dd'),
                firstTerm: {
                    start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
                    end: format(new Date(), 'yyyy-MM-dd')
                },
                secondTerm: {
                    start: format(new Date(), 'yyyy-MM-dd'),
                    end: format(endOfYear(new Date()), 'yyyy-MM-dd')
                },
                firstTermTimetable: {},
                secondTermTimetable: {},
            },
            syncCode: null,
            syncExpiresAt: null,
            lastSyncTime: null,

            addStudent: (student) => set((state) => ({
                students: [
                    ...state.students,
                    { ...student, id: crypto.randomUUID() },
                ].sort((a, b) => a.studentNumber - b.studentNumber) // Keep sorted by Number
            })),

            updateStudent: (id, data) => set((state) => ({
                students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s))
                    .sort((a, b) => (data.studentNumber ? a.studentNumber - b.studentNumber : 0) || a.studentNumber - b.studentNumber)
            })),

            deleteStudent: (id) => set((state) => ({
                students: state.students.filter((s) => s.id !== id),
                attendanceRecords: state.attendanceRecords.filter((r) => r.studentId !== id),
            })),

            addSubject: (subject) => set((state) => ({
                subjects: [...state.subjects, { ...subject, id: crypto.randomUUID() }]
            })),

            updateSubject: (id, data) => set((state) => ({
                subjects: state.subjects.map((s) => (s.id === id ? { ...s, ...data } : s))
            })),

            deleteSubject: (id) => set((state) => ({
                subjects: state.subjects.filter((s) => s.id !== id)
            })),

            toggleAttendance: (studentId, date, period, status) => set((state) => {
                const record = state.attendanceRecords.find(
                    (r) => r.studentId === studentId && r.date === date && r.period === period
                );

                let newStatus: AttendanceStatus;

                if (status === null) {
                    // Explicitly clear the status (remove record)
                    newStatus = null as any; // Marker to filter out
                } else if (status) {
                    // Specific status requested
                    newStatus = status;
                } else if (record) {
                    // Record exists, cycle to next status
                    const currentIndex = DEFAULT_STATUS_CYCLE.indexOf(record.status);
                    const nextIndex = (currentIndex + 1) % DEFAULT_STATUS_CYCLE.length;
                    newStatus = DEFAULT_STATUS_CYCLE[nextIndex];
                } else {
                    // No record (untouched) - first tap sets to 'present'
                    newStatus = 'present';
                }

                const otherRecords = state.attendanceRecords.filter(
                    (r) => !(r.studentId === studentId && r.date === date && r.period === period)
                );

                // Always keep the record to distinguish touched vs untouched
                return {
                    attendanceRecords: status === null
                        ? otherRecords
                        : [
                            ...otherRecords,
                            { studentId, date, period, status: newStatus }
                        ]
                };
            }),

            updateSettings: (settings) => set((state) => ({
                settings: { ...state.settings, ...settings }
            })),

            generateCalendar: (start, end) => {
                const dates = eachDayOfInterval({ start: new Date(start), end: new Date(end) });
                const calendar: CalendarDay[] = dates.map(d => ({
                    date: format(d, 'yyyy-MM-dd'),
                    isHoliday: isSaturday(d) || isSunday(d)
                }));
                set({ calendar });
            },

            toggleHoliday: (date) => set((state) => ({
                calendar: state.calendar.map(c =>
                    c.date === date ? { ...c, isHoliday: !c.isHoliday } : c
                )
            })),

            exportData: () => {
                const state = get();
                const data = {
                    students: state.students,
                    subjects: state.subjects,
                    attendanceRecords: state.attendanceRecords,
                    calendar: state.calendar,
                    settings: state.settings,
                };
                // Evaluate explicit checking for UTF-8 characters if needed, but for now simple btoa
                // Use Buffer or unicode safe encoding if Japanese characters are involved (yes they are!).
                // simple btoa on UTF-16 string might break.
                // Better to use: btoa(unescape(encodeURIComponent(JSON.stringify(data))))
                return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
            },

            importData: (code) => {
                try {
                    const json = decodeURIComponent(escape(atob(code)));
                    const data = JSON.parse(json);
                    // Validate basic structure?
                    if (!data.students || !data.settings) throw new Error("Invalid Format");

                    set({
                        students: data.students,
                        subjects: data.subjects,
                        attendanceRecords: data.attendanceRecords,
                        calendar: data.calendar,
                        settings: data.settings
                    });
                    // Force persist? persist middleware handles set.
                    return true;
                } catch (e) {
                    console.error(e);
                    return false;
                }
            },
            setSyncState: (code, expiresAt) => set({ syncCode: code, syncExpiresAt: expiresAt }),
            setLastSyncTime: (time) => set({ lastSyncTime: time }),
        }),
        {
            name: 'attendance-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
