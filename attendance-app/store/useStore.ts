import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Student, Subject, AttendanceRecord, AppSettings, CalendarDay, AttendanceStatus, AppState } from '@/types';
import { startOfYear, endOfYear, format, eachDayOfInterval, isSaturday, isSunday } from 'date-fns';

const DEFAULT_STATUS_CYCLE: AttendanceStatus[] = ['present', 'absent', 'late', 'early_leave'];

// Helper to migrate old settings to new structure if needed
const migrateSettings = (savedSettings: any): AppSettings => {
    // Check if new structure exists
    if (savedSettings.timetables) {
        return savedSettings as AppSettings;
    }

    // Migration from flat structure
    return {
        termStartDate: savedSettings.termStartDate || format(startOfYear(new Date()), 'yyyy-MM-dd'),
        termEndDate: savedSettings.termEndDate || format(endOfYear(new Date()), 'yyyy-MM-dd'),
        firstTerm: savedSettings.firstTerm || {
            start: format(startOfYear(new Date()), 'yyyy-MM-dd'),
            end: format(new Date(), 'yyyy-MM-dd')
        },
        secondTerm: savedSettings.secondTerm || {
            start: format(new Date(), 'yyyy-MM-dd'),
            end: format(endOfYear(new Date()), 'yyyy-MM-dd')
        },
        timetables: {
            year1: {
                first: savedSettings.firstTermTimetable || (savedSettings.timetables?.year1?.first || {}),
                second: savedSettings.secondTermTimetable || (savedSettings.timetables?.year1?.second || {})
            },
            year2: {
                first: (savedSettings.timetables?.year2?.first || {}),
                second: (savedSettings.timetables?.year2?.second || {})
            }
        }
    } as AppSettings;
};

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
                periodCount: 4,
                hourPerPeriod: 1.8,
                timetables: {
                    year1: { first: {}, second: {} },
                    year2: { first: {}, second: {} }
                }
            } as AppSettings, // Type assertion for cleaner init
            syncCode: null,
            syncExpiresAt: null,
            lastSyncTime: null,
            selectedGrade: 1,

            addStudent: (student) => set((state) => {
                // License Limit Check
                const status = get().getLicenseStatus();
                if (status !== 'pro' && status !== 'eval' && state.students.length >= 5) {
                    // Ideally throw error or return false, but simple guard here
                    return state;
                }

                return {
                    students: [
                        ...state.students,
                        { ...student, id: crypto.randomUUID(), grade: student.grade || 1 }, // Default to grade 1
                    ].sort((a, b) => {
                        // Sort by Grade, then Number
                        if (a.grade !== b.grade) return (a.grade || 1) - (b.grade || 1);
                        return a.studentNumber - b.studentNumber;
                    })
                };
            }),

            updateStudent: (id, data) => set((state) => ({
                students: state.students.map((s) => (s.id === id ? { ...s, ...data } : s))
                    .sort((a, b) => {
                        // Re-sort
                        const gradeA = (a.id === id && data.grade) ? data.grade : (a.grade || 1);
                        const gradeB = (b.id === id && data.grade) ? data.grade : (b.grade || 1);
                        const numA = (a.id === id && data.studentNumber) ? data.studentNumber : a.studentNumber;
                        const numB = (b.id === id && data.studentNumber) ? data.studentNumber : b.studentNumber;

                        if (gradeA !== gradeB) return gradeA - gradeB;
                        return numA - numB;
                    })
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

            setSelectedGrade: (grade) => set({ selectedGrade: grade }),

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
                    licenseKey: state.licenseKey,
                    licenseExpiry: state.licenseExpiry,
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
                        settings: data.settings,
                        ...(data.licenseKey !== undefined && { licenseKey: data.licenseKey }),
                        ...(data.licenseExpiry !== undefined && { licenseExpiry: data.licenseExpiry })
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

            // Reset functions
            resetSettings: () => set({
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
                    periodCount: 4,
                    hourPerPeriod: 1.8,
                    timetables: {
                        year1: { first: {}, second: {} },
                        year2: { first: {}, second: {} }
                    }
                },
                calendar: []
            }),

            resetAttendance: () => set({ attendanceRecords: [] }),

            // License
            licenseKey: null,
            licenseExpiry: null,

            activateLicense: (key) => {
                // Hardcoded validation for MVP
                // In production, this should check against an API or hash
                const VALID_KEY = "ANTIG2026PRO";
                const EVAL_KEY = "EVAL20261M";

                if (key === VALID_KEY) {
                    const oneYearFromNow = new Date();
                    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

                    set({
                        licenseKey: key,
                        licenseExpiry: oneYearFromNow.getTime()
                    });
                    return 'pro';
                }

                if (key === EVAL_KEY) {
                    const oneMonthFromNow = new Date();
                    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

                    set({
                        licenseKey: key,
                        licenseExpiry: oneMonthFromNow.getTime()
                    });
                    return 'eval';
                }

                return false;
            },

            getLicenseStatus: () => {
                const state = get();
                if (!state.licenseKey || !state.licenseExpiry) return 'free';

                if (Date.now() > state.licenseExpiry) return 'expired';

                const EVAL_KEY = "EVAL20261M";
                if (state.licenseKey === EVAL_KEY) return 'eval';

                return 'pro';
            },

            resetAll: () => set({
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
                    periodCount: 4,
                    hourPerPeriod: 1.8,
                    timetables: {
                        year1: { first: {}, second: {} },
                        year2: { first: {}, second: {} }
                    }
                },
                syncCode: null,
                syncExpiresAt: null,
                lastSyncTime: null,
                licenseKey: null,
                licenseExpiry: null
            }),
        }),
        {
            name: 'attendance-storage',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            migrate: (persistedState: any, version: number) => {
                if (version === 0) {
                    // Migration from v0 (no version) to v1
                    const oldSettings = persistedState.settings || {};
                    const newSettings = migrateSettings(oldSettings);
                    return {
                        ...persistedState,
                        settings: newSettings,
                        // Ensure all students have a grade
                        students: (persistedState.students || []).map((s: any) => ({
                            ...s,
                            grade: s.grade || 1
                        }))
                    };
                }
                return persistedState;
            },
        }
    )
);
