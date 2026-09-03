import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Student, Settings } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState {
  // 学生データ
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  importStudents: (students: Student[]) => void;
  bulkUpdateVisa: (updates: Array<{ id: string; residenceCardNumber?: string; residenceExpiry?: string }>) => void;

  // 設定
  settings: Settings;
  updateSettings: (data: Partial<Settings>) => void;

  // UI状態
  selectedGrade: number;
  setSelectedGrade: (grade: number) => void;
}

const defaultSettings: Settings = {
  schoolName: '',
  schoolAddress: '',
  alertDaysBefore: 60,
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 学生データ
      students: [],

      addStudent: (studentData) =>
        set((state) => ({
          students: [...state.students, { ...studentData, id: (studentData as Student).id || uuidv4() }],
        })),

      updateStudent: (id, data) =>
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...data } : s
          ),
        })),

      deleteStudent: (id) =>
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
        })),

      importStudents: (importedStudents) =>
        set((state) => {
          const existingNumbers = new Set(state.students.map((s) => s.studentNumber));
          const newStudents = importedStudents.filter(
            (s) => !existingNumbers.has(s.studentNumber)
          );
          return {
            students: [...state.students, ...newStudents],
          };
        }),

      bulkUpdateVisa: (updates) =>
        set((state) => {
          const updateMap = new Map(updates.map((u) => [u.id, u]));
          return {
            students: state.students.map((s) => {
              const u = updateMap.get(s.id);
              if (!u) return s;
              return {
                ...s,
                ...(u.residenceCardNumber !== undefined && u.residenceCardNumber !== '' ? { residenceCardNumber: u.residenceCardNumber } : {}),
                ...(u.residenceExpiry !== undefined && u.residenceExpiry !== '' ? { residenceExpiry: u.residenceExpiry } : {}),
              };
            }),
          };
        }),

      // 設定
      settings: defaultSettings,

      updateSettings: (data) =>
        set((state) => ({
          settings: { ...state.settings, ...data },
        })),

      // UI状態
      selectedGrade: 1,
      setSelectedGrade: (grade) => set({ selectedGrade: grade }),
    }),
    {
      name: 'student-visa-manager-storage',
    }
  )
);
