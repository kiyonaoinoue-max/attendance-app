'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, TimerOff, AlertCircle, Minus, Plus, RotateCcw, Zap, X, Users } from 'lucide-react';
import { Student, AttendanceRecord, CalendarDay, Subject } from '@/types'; // Added imports
// ... imports
import { AttendanceStatus } from '@/types';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs

const STATUS_CONFIG: Record<AttendanceStatus, { label: string, color: string, icon: any }> = {
    present: { label: '出席', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
    absent: { label: '欠席', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    late: { label: '遅刻', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
    early_leave: { label: '早退', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TimerOff },
};

const PERIOD_LABELS = (count: number) => [
    { id: 0, label: 'HR' },
    ...Array.from({ length: count }, (_, i) => ({ id: i + 1, label: `${i + 1}限` }))
];

// Type for last action (for undo functionality)
interface LastAction {
    studentId: string;
    studentName: string;
    status: AttendanceStatus;
}

export default function AttendancePage() {
    const { students, attendanceRecords, calendar, toggleAttendance, settings, subjects, selectedGrade, setSelectedGrade, setTimetableOverride } = useStore();
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(0); // 0 = HR
    const [overrideDialogPeriod, setOverrideDialogPeriod] = useState<number | null>(null);
    const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
    const bulkTimersRef = useRef<NodeJS.Timeout[]>([]);
    const scrollRafRef = useRef<number | null>(null);

    const clearBulkTimers = useCallback(() => {
        bulkTimersRef.current.forEach(clearTimeout);
        bulkTimersRef.current = [];
        if (scrollRafRef.current) {
            cancelAnimationFrame(scrollRafRef.current);
            scrollRafRef.current = null;
        }
    }, []);

    const PERIODS = PERIOD_LABELS(settings.periodCount ?? 4);
    const [zoomLevel, setZoomLevel] = useState(1); // 0.4 to 1.4
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const studentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Input protection state
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastAction, setLastAction] = useState<LastAction | null>(null);

    // Bulk attendance (全出席) state

    // Filter students by selected Grade
    const filteredStudents: Student[] = students.filter((s: Student) => (s.grade || 1) === selectedGrade);

    // スクロール時に画面中央を通過したカードをアクティブ（風の追従）にするステートと処理
    const [scrollActiveStudentId, setScrollActiveStudentId] = useState<string | null>(null);

    useEffect(() => {
        const container = document.querySelector('main');
        if (!container) return;

        let timeoutId: NodeJS.Timeout;

        const handleScroll = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                // 一括自動処理中はスクロール追従を無効化する
                if (isBulkProcessing) {
                    setScrollActiveStudentId(null);
                    return;
                }

                const containerRect = container.getBoundingClientRect();
                const centerY = containerRect.top + containerRect.height / 2;

                let closestStudentId: string | null = null;
                let minDistance = Infinity;

                Object.entries(studentRefs.current).forEach(([id, el]) => {
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        const elementCenterY = rect.top + rect.height / 2;
                        const distance = Math.abs(elementCenterY - centerY);

                        // 画面の中央ライン付近（要素の高さの80%以内）にあるものを対象にする
                        if (distance < rect.height * 0.8 && distance < minDistance) {
                            minDistance = distance;
                            closestStudentId = id;
                        }
                    }
                });

                setScrollActiveStudentId(closestStudentId);
            }, 15); // 反応速度重視で15msでスロットル
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        return () => {
            container.removeEventListener('scroll', handleScroll);
            clearTimeout(timeoutId);
        };
    }, [filteredStudents, isBulkProcessing]);

    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkAnimatingIds, setBulkAnimatingIds] = useState<Set<string>>(new Set());
    const [isBulkProcessing, setIsBulkProcessing] = useState(false);
    const bulkLongPressRef = useRef<NodeJS.Timeout | null>(null);

    // Long press handlers for bulk present
    const handleBulkLongPressStart = useCallback(() => {
        bulkLongPressRef.current = setTimeout(() => {
            setShowBulkConfirm(true);
        }, 600);
    }, []);

    const handleBulkLongPressEnd = useCallback(() => {
        if (bulkLongPressRef.current) {
            clearTimeout(bulkLongPressRef.current);
            bulkLongPressRef.current = null;
        }
    }, []);

    // カスケードのstagger計算: easeInCubicで最初ゆっくり→後半加速
    const getStaggerDelay = useCallback((index: number, total: number) => {
        if (total <= 1) return 0;
        const TOTAL_DURATION = 4000; // 全体の目標時間(ms) ゆったりめ
        const t = index / (total - 1);
        const eased = Math.pow(t, 3); // easeInCubic: 最初はタメ、後半に一気に加速
        return Math.round(eased * TOTAL_DURATION);
    }, []);

    // Execute bulk present with cascade animation + auto-scroll
    const executeBulkPresent = useCallback(() => {
        setShowBulkConfirm(false);
        setIsBulkProcessing(true);
        clearBulkTimers();

        // 1. 最初はデータを更新せず、アニメーション用IDも空からスタート
        setBulkAnimatingIds(new Set());

        // すでに処理した生徒のIDをトラッキングするためのローカルSet
        const processedIds = new Set<string>();

        // 2. スクロール追従とデータ順次更新: アニメーションの進行に合わせてステータスを変更＆光らせる
        const container = document.querySelector('main');
        const totalDuration = 4000;
        if (container) {
            const containerHeight = container.clientHeight;
            const scrollEnd = container.scrollHeight - containerHeight;
            const startTime = performance.now();

            const animateScroll = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / totalDuration, 1);
                
                // アニメーション進行カーブ（easeInCubic）を適用
                const eased = Math.pow(progress, 3);
                
                // 開始スクロール位置（0）から最大スクロール位置（scrollEnd）まで、進行度に合わせて完全同期でスクロール
                container.scrollTop = scrollEnd * eased;

                // 現在の時間において、アクティブ（風が到達した）な生徒を特定し、順次「出席」に切り替える
                let updatedAny = false;
                filteredStudents.forEach((student, index) => {
                    const staggerDelay = getStaggerDelay(index, filteredStudents.length);
                    if (staggerDelay <= elapsed && !processedIds.has(student.id)) {
                        // データを出席に更新（チェックマークがピカッとつく）
                        toggleAttendance(student.id, date, period, 'present');
                        processedIds.add(student.id);
                        updatedAny = true;
                    }
                });

                // 新しく出席になった生徒がいれば、光るアニメーション状態を一括でReactに通知
                if (updatedAny) {
                    setBulkAnimatingIds(new Set(processedIds));
                }

                if (progress < 1) {
                    scrollRafRef.current = requestAnimationFrame(animateScroll);
                } else {
                    // 確実に最後は全員出席にして一番下までスクロールさせる
                    filteredStudents.forEach(student => {
                        if (!processedIds.has(student.id)) {
                            toggleAttendance(student.id, date, period, 'present');
                            processedIds.add(student.id);
                        }
                    });
                    setBulkAnimatingIds(new Set(processedIds));
                    container.scrollTop = scrollEnd;
                    
                    // すべての風が通り抜けた後、最後の余韻を待ってリセット処理を入れる
                    const finalTimer = setTimeout(() => {
                        setBulkAnimatingIds(new Set());
                        setIsBulkProcessing(false);
                        const mainEl = document.querySelector('main');
                        if (mainEl) {
                            mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        if (filteredStudents.length > 0) {
                            setSelectedStudentId(filteredStudents[0].id);
                        }
                    }, 1400); // 最後の生徒が光り始めてから1200msアニメーションするため、1400ms後にクリアして戻す
                    bulkTimersRef.current.push(finalTimer);
                }
            };
            scrollRafRef.current = requestAnimationFrame(animateScroll);
        }
    }, [filteredStudents, date, period, toggleAttendance, clearBulkTimers, getStaggerDelay]);

    // Full-day absent (1日欠席) state
    const [showDayAbsentConfirm, setShowDayAbsentConfirm] = useState(false);
    const absentLongPressRef = useRef<NodeJS.Timeout | null>(null);

    const handleAbsentLongPressStart = useCallback(() => {
        if (!selectedStudentId) return;
        absentLongPressRef.current = setTimeout(() => {
            setShowDayAbsentConfirm(true);
        }, 600);
    }, [selectedStudentId]);

    const handleAbsentLongPressEnd = useCallback(() => {
        if (absentLongPressRef.current) {
            clearTimeout(absentLongPressRef.current);
            absentLongPressRef.current = null;
        }
    }, []);

    const executeDayAbsent = useCallback(() => {
        if (!selectedStudentId) return;
        setShowDayAbsentConfirm(false);
        const periodCount = settings.periodCount ?? 4;
        // Mark all periods (0=HR, 1~periodCount) as absent
        for (let p = 0; p <= periodCount; p++) {
            toggleAttendance(selectedStudentId, date, p, 'absent');
        }
    }, [selectedStudentId, date, settings.periodCount, toggleAttendance]);

    // Bulk reset (全員未入力) state
    const [showBulkResetConfirm, setShowBulkResetConfirm] = useState(false);
    const resetLongPressRef = useRef<NodeJS.Timeout | null>(null);

    const handleResetLongPressStart = useCallback(() => {
        resetLongPressRef.current = setTimeout(() => {
            setShowBulkResetConfirm(true);
        }, 600);
    }, []);

    const handleResetLongPressEnd = useCallback(() => {
        if (resetLongPressRef.current) {
            clearTimeout(resetLongPressRef.current);
            resetLongPressRef.current = null;
        }
    }, []);

    const executeBulkReset = useCallback(() => {
        setShowBulkResetConfirm(false);
        setIsBulkProcessing(true);
        clearBulkTimers();
        filteredStudents.forEach((student, index) => {
            const timer = setTimeout(() => {
                toggleAttendance(student.id, date, period, null);
                if (index === filteredStudents.length - 1) {
                    const finalTimer = setTimeout(() => {
                        setIsBulkProcessing(false);
                        const container = document.querySelector('main');
                        if (container) {
                            container.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                    }, 400);
                    bulkTimersRef.current.push(finalTimer);
                }
            }, index * 30);
            bulkTimersRef.current.push(timer);
        });
    }, [filteredStudents, date, period, toggleAttendance, clearBulkTimers]);

    // Auto-select first student on data load or grade switch
    useEffect(() => {
        if (filteredStudents.length > 0) {
            // Only select if current selection is invalid or null
            const exists = filteredStudents.find((s: Student) => s.id === selectedStudentId);
            if (!exists) {
                setSelectedStudentId(filteredStudents[0].id);
            }
        } else {
            setSelectedStudentId(null);
        }
    }, [filteredStudents, selectedStudentId]);

    // Auto-scroll to selected student when selection changes (only if outside viewport)
    useEffect(() => {
        if (!selectedStudentId) return;

        // Small delay to ensure DOM is ready
        const timer = setTimeout(() => {
            const el = studentRefs.current[selectedStudentId];
            if (!el) return;

            // If selecting the first student, scroll main container to top to avoid header hiding and conflict
            if (filteredStudents.length > 0 && selectedStudentId === filteredStudents[0].id) {
                const container = document.querySelector('main');
                if (container) {
                    container.scrollTo({ top: 0, behavior: 'smooth' });
                }
                return;
            }

            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const headerOffset = 200;
            const bottomMargin = 100;

            // Check if element is outside the visible area
            const isOutOfView = rect.top < headerOffset || rect.bottom > (viewportHeight - bottomMargin);

            if (isOutOfView) {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 50);

        return () => clearTimeout(timer);
    }, [selectedStudentId, filteredStudents]);

    // Clean up bulk timers on parameter changes or unmount
    useEffect(() => {
        return () => clearBulkTimers();
    }, [date, period, selectedGrade, clearBulkTimers]);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleDateChange = (offset: number) => {
        const currentDate = parseISO(date);
        currentDate.setDate(currentDate.getDate() + offset);
        setDate(format(currentDate, 'yyyy-MM-dd'));
    };

    const getStatus = (studentId: string, p: number = period): AttendanceStatus | null => {
        const record = attendanceRecords.find(
            (r: AttendanceRecord) => r.studentId === studentId && r.date === date && r.period === p
        );
        return record?.status ?? null; // null = untouched
    };

    // Find if current day is holiday
    const currentDayConfig = calendar.find((c: CalendarDay) => c.date === date);
    const isHoliday = currentDayConfig?.isHoliday;

    // Determine Term (First/Second) for Timetable lookup
    // Assuming simple date check for now
    const d = parseISO(date);
    // Safe access with fallback defaults
    const secondTermStart = settings.secondTerm?.start || settings.termStartDate || format(new Date(), 'yyyy-MM-dd');
    const secondTermEnd = settings.secondTerm?.end || settings.termEndDate || format(new Date(), 'yyyy-MM-dd');
    const isSecondTerm = d >= parseISO(secondTermStart) && d <= parseISO(secondTermEnd);
    const termKey: 'first' | 'second' = isSecondTerm ? 'second' : 'first';
    const gradeKey: 'year1' | 'year2' = selectedGrade === 1 ? 'year1' : 'year2';

    // Get Subject Name for a period
    // Timetables updated to nested structure in previous step.
    const getSubjectName = (pId: number) => {
        if (pId === 0) return 'HR';
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayStr = days[d.getDay()];

        // Check override first
        const overrideKey = `${date}-${pId}`;
        const overrideSubjectId = settings.timetableOverrides?.[overrideKey];
        if (overrideSubjectId) {
            const subj = subjects.find((s: Subject) => s.id === overrideSubjectId);
            return subj ? `⚡${subj.name}` : `${pId}限`;
        }

        const key = `${dayStr}-${pId}`;
        const timetable = settings.timetables?.[gradeKey]?.[termKey] || {};
        const subjectId = timetable[key];
        if (!subjectId) return `${pId}限`;
        const subj = subjects.find((s: Subject) => s.id === subjectId);
        return subj ? subj.name : `${pId}限`;
    };

    // Check if a period has an override
    const hasOverride = (pId: number) => {
        const overrideKey = `${date}-${pId}`;
        return !!settings.timetableOverrides?.[overrideKey];
    };

    // Long press handlers for override
    const handlePeriodLongPressStart = (pId: number) => {
        if (pId === 0) return; // HR cannot be overridden
        longPressTimerRef.current = setTimeout(() => {
            setOverrideDialogPeriod(pId);
        }, 600);
    };

    const handlePeriodLongPressEnd = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
        }
    };

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">出席簿入力</h1>
                {/* Grade Switcher */}
                <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                    <button
                        className={cn("px-4 py-1 rounded text-sm font-bold transition-all", selectedGrade === 1 ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        onClick={() => setSelectedGrade(1)}
                    >
                        1年生
                    </button>
                    <button
                        className={cn("px-4 py-1 rounded text-sm font-bold transition-all", selectedGrade === 2 ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700")}
                        onClick={() => setSelectedGrade(2)}
                    >
                        2年生
                    </button>
                </div>

                {/* Zoom Control */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm ml-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(Math.max(0.4, zoomLevel - 0.1))}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-mono w-8 text-center">{Math.round(zoomLevel * 100)}%</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Date & Period Selection */}
            <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur pt-2 pb-4 space-y-4 shadow-sm border-b">
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-300 shadow-sm mx-1">
                    <Button variant="ghost" size="icon" onClick={() => handleDateChange(-1)} className="hover:bg-slate-100">
                        <ChevronLeft className="h-6 w-6 text-slate-900" />
                    </Button>
                    <div className="text-center cursor-pointer hover:bg-slate-50 px-4 py-1 rounded transition-colors" onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'date';
                        input.value = date;
                        input.onchange = (e) => setDate((e.target as HTMLInputElement).value);
                        input.showPicker();
                    }}>
                        <div className="font-bold text-xl text-slate-900">
                            {format(parseISO(date), 'yyyy年MM月dd日 (EEE)', { locale: ja })}
                        </div>
                        {isHoliday && <div className="text-xs text-red-600 font-extrabold">休講/休日</div>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDateChange(1)} className="hover:bg-slate-100">
                        <ChevronRight className="h-6 w-6 text-slate-900" />
                    </Button>
                </div>

                <div className="flex overflow-x-auto gap-2 pb-1 px-1 scrollbar-hide">
                    {PERIODS.map((p) => {
                        const subjectName = getSubjectName(p.id);
                        const isOverridden = hasOverride(p.id);
                        return (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setPeriod(p.id);
                                    if (filteredStudents.length > 0) {
                                        setSelectedStudentId(filteredStudents[0].id);
                                        const container = document.querySelector('main');
                                        if (container) {
                                            container.scrollTo({ top: 0, behavior: 'smooth' });
                                        }
                                    }
                                }}
                                onMouseDown={() => handlePeriodLongPressStart(p.id)}
                                onMouseUp={handlePeriodLongPressEnd}
                                onMouseLeave={handlePeriodLongPressEnd}
                                onTouchStart={() => handlePeriodLongPressStart(p.id)}
                                onTouchEnd={handlePeriodLongPressEnd}
                                className={cn(
                                    "flex-1 min-w-[80px] py-2 px-2 rounded-lg text-sm font-bold transition-all border-2 flex flex-col items-center justify-center gap-1",
                                    period === p.id
                                        ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-[1px]"
                                        : isOverridden
                                            ? "bg-amber-50 text-amber-800 border-amber-400 hover:bg-amber-100"
                                            : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                                )}
                            >
                                <span>{p.label}</span>
                                <span className={cn("text-[10px] font-normal truncate max-w-full px-1 rounded", period === p.id ? "bg-white/20" : isOverridden ? "bg-amber-200/50" : "bg-slate-100")}>
                                    {isHoliday ? '-' : subjectName}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {filteredStudents.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed">
                    {selectedGrade}年生の学生が登録されていません。<br />
                    「学生管理」メニューから学生を登録してください。
                </Card>
            ) : (
                <div className="relative">
                    {/* Left: Student List */}
                    <div className="mr-52 space-y-2 pb-40">
                        {filteredStudents.map((student: Student, index: number) => {
                            const currentPeriodStatus = getStatus(student.id, period);
                            const isSelected = selectedStudentId === student.id;

                            return (
                                <div
                                    key={student.id}
                                    ref={el => { studentRefs.current[student.id] = el }}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={cn(
                                        "flex items-center justify-between bg-white rounded-lg border shadow-sm select-none overflow-hidden cursor-pointer",
                                        "transition-all duration-300 ease-out hover:-translate-y-1 hover:scale-[1.005] hover:border-green-400 hover:shadow-md hover:shadow-green-100/80",
                                        isSelected ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 z-10" : "border-slate-200",
                                        scrollActiveStudentId === student.id && "!border-green-400 !shadow-md !shadow-green-100/80 -translate-y-1 scale-[1.005] bg-green-50/10",
                                        bulkAnimatingIds.has(student.id) && "animate-bulk-highlight"
                                    )}
                                    style={{
                                        padding: `${16 * zoomLevel}px`,
                                        minHeight: `${80 * zoomLevel}px`
                                    }}
                                >
                                    {/* Info & Grid */}
                                    <div className="flex flex-col gap-2 flex-1">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="font-bold text-slate-500"
                                                style={{ fontSize: `${14 * zoomLevel}px` }}
                                            >
                                                {student.studentNumber}
                                            </div>
                                            <div
                                                className="font-extrabold text-slate-900 leading-tight"
                                                style={{ fontSize: `${18 * zoomLevel}px` }}
                                            >
                                                {student.name}
                                            </div>
                                        </div>

                                        {/* 5-Period Grid */}
                                        <div className="flex gap-1 mt-1">
                                            {PERIODS.map((p) => {
                                                const status = getStatus(student.id, p.id);
                                                const isActive = period === p.id;
                                                const isUntouched = status === null;
                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setPeriod(p.id);
                                                            setSelectedStudentId(student.id);
                                                        }}
                                                        className={cn(
                                                            "h-6 flex-1 rounded text-[10px] flex items-center justify-center font-bold cursor-pointer transition-all border",
                                                            isUntouched ? 'bg-slate-100 text-slate-300 border-slate-200' :
                                                                status === 'present' ? 'bg-green-400 text-white border-green-500' :
                                                                    status === 'absent' ? 'bg-red-500 text-white border-red-600' :
                                                                        status === 'late' ? 'bg-yellow-400 text-yellow-900 border-yellow-500' :
                                                                            'bg-orange-400 text-white border-orange-500',
                                                            isActive ? 'ring-2 ring-blue-500 ring-offset-1 z-10' : 'opacity-80 hover:opacity-100'
                                                        )}
                                                        title={`${p.label}: ${isUntouched ? '未入力' : STATUS_CONFIG[status].label}`}
                                                    >
                                                        {isUntouched ? '-' : STATUS_CONFIG[status].label[0]}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Current Status Indicator (Mini) */}
                                    {currentPeriodStatus && (
                                        <div className={cn(
                                            "ml-4 px-2 py-1 rounded text-xs font-bold",
                                            STATUS_CONFIG[currentPeriodStatus].color
                                        )}>
                                            {STATUS_CONFIG[currentPeriodStatus].label}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Right: Fixed Control Panel */}
                    <div className="w-48 fixed top-[260px] right-8 bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-4 z-20">
                        <div className="text-center border-b pb-2">
                            <div className="text-xs text-slate-500">選択中</div>
                            <div className="font-bold text-lg truncate">
                                {selectedStudentId ? students.find(s => s.id === selectedStudentId)?.name : '選択なし'}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => {
                                const cfg = STATUS_CONFIG[s];
                                const Icon = cfg.icon;
                                const isPresentButton = s === 'present';
                                const isAbsentButton = s === 'absent';
                                return (
                                    <button
                                        key={s}
                                        disabled={isProcessing || isBulkProcessing}
                                        onClick={() => {
                                            if (!selectedStudentId || isProcessing || isBulkProcessing) return;

                                            // Set processing state to prevent rapid clicks
                                            setIsProcessing(true);

                                            // Save current action for undo
                                            const currentStudent = students.find(st => st.id === selectedStudentId);
                                            setLastAction({
                                                studentId: selectedStudentId,
                                                studentName: currentStudent?.name || '',
                                                status: s
                                            });

                                            toggleAttendance(selectedStudentId, date, period, s);

                                            // Auto-advance to next student with small delay
                                            const currentIndex = filteredStudents.findIndex(st => st.id === selectedStudentId);
                                            if (currentIndex < filteredStudents.length - 1) {
                                                const nextStudent = filteredStudents[currentIndex + 1];
                                                // Delay the selection change slightly
                                                setTimeout(() => {
                                                    setSelectedStudentId(nextStudent.id);
                                                    setIsProcessing(false);
                                                }, 300);
                                            } else {
                                                // Last student, just release lock
                                                setTimeout(() => setIsProcessing(false), 300);
                                            }
                                        }}
                                        // Long press on present button for bulk attendance
                                        // Long press on absent button for full-day absent
                                        {...(isPresentButton ? {
                                            onMouseDown: handleBulkLongPressStart,
                                            onMouseUp: handleBulkLongPressEnd,
                                            onMouseLeave: handleBulkLongPressEnd,
                                            onTouchStart: handleBulkLongPressStart,
                                            onTouchEnd: handleBulkLongPressEnd,
                                        } : isAbsentButton ? {
                                            onMouseDown: handleAbsentLongPressStart,
                                            onMouseUp: handleAbsentLongPressEnd,
                                            onMouseLeave: handleAbsentLongPressEnd,
                                            onTouchStart: handleAbsentLongPressStart,
                                            onTouchEnd: handleAbsentLongPressEnd,
                                        } : {})}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all relative",
                                            (isProcessing || isBulkProcessing) ? "opacity-50 cursor-not-allowed" : "hover:brightness-95 active:scale-95",
                                            cfg.color,
                                            "bg-opacity-20 border-opacity-50"
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="font-bold">{cfg.label}</span>
                                        {isPresentButton && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-green-500 opacity-60 font-medium">長押し:全員</span>
                                        )}
                                        {isAbsentButton && (
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-red-500 opacity-60 font-medium">長押し:1日</span>
                                        )}
                                    </button>
                                );
                            })}

                            {/* Undo Button */}
                            {lastAction && (
                                <button
                                    onClick={() => {
                                        // Revert the last action
                                        toggleAttendance(lastAction.studentId, date, period, null);
                                        setLastAction(null);
                                        // Optionally go back to that student
                                        setSelectedStudentId(lastAction.studentId);
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition-all active:scale-95 text-sm"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    <span className="truncate">取消: {lastAction.studentName}</span>
                                </button>
                            )}

                            {/* Reset Button */}
                            <button
                                disabled={isProcessing || isBulkProcessing}
                                onClick={() => {
                                    if (!selectedStudentId || isProcessing || isBulkProcessing) return;
                                    toggleAttendance(selectedStudentId, date, period, null);
                                    // No auto-advance for reset
                                }}
                                onMouseDown={handleResetLongPressStart}
                                onMouseUp={handleResetLongPressEnd}
                                onMouseLeave={handleResetLongPressEnd}
                                onTouchStart={handleResetLongPressStart}
                                onTouchEnd={handleResetLongPressEnd}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-lg border-2 border-slate-200 bg-slate-50 text-slate-500 transition-all mt-2 relative",
                                    (isProcessing || isBulkProcessing) ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-100 hover:text-slate-700 active:scale-95"
                                )}
                            >
                                <Minus className="h-6 w-6" />
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="font-bold text-[12px] whitespace-nowrap">未入力に戻す</span>
                                    <span className="text-[9px] text-slate-400 font-medium mt-0.5">長押し:全員</span>
                                </div>
                            </button>
                        </div>

                        <div className="text-xs text-center text-slate-400 mt-4 space-y-1">
                            <p>ボタンを押すと自動で次の人に移動します</p>
                        </div>
                    </div>
                </div>
            )}


            {isHoliday && (
                <div className="fixed bottom-20 left-4 right-4 bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
                    <AlertCircle className="h-6 w-6" />
                    <div className="text-sm font-bold">
                        注意: 今日は「休日」です。
                    </div>
                </div>
            )}

            {/* Override Dialog */}
            {overrideDialogPeriod !== null && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOverrideDialogPeriod(null)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Zap className="h-5 w-5 text-amber-500" />
                                {overrideDialogPeriod}限を差し替え
                            </h3>
                            <button onClick={() => setOverrideDialogPeriod(null)} className="p-1 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            {format(parseISO(date), 'M月d日(EEE)', { locale: ja })}の{overrideDialogPeriod}限の教科を臨時変更します
                        </p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {subjects.map(subj => {
                                const overrideKey = `${date}-${overrideDialogPeriod}`;
                                const isCurrentOverride = settings.timetableOverrides?.[overrideKey] === subj.id;
                                return (
                                    <button
                                        key={subj.id}
                                        onClick={() => {
                                            setTimetableOverride(date, overrideDialogPeriod!, subj.id);
                                            setOverrideDialogPeriod(null);
                                        }}
                                        className={cn(
                                            "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center justify-between",
                                            isCurrentOverride
                                                ? "border-amber-400 bg-amber-50 text-amber-800"
                                                : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className="font-medium">{subj.name}</span>
                                        {isCurrentOverride && <Zap className="h-4 w-4 text-amber-500" />}
                                    </button>
                                );
                            })}
                        </div>
                        {hasOverride(overrideDialogPeriod) && (
                            <button
                                onClick={() => {
                                    setTimetableOverride(date, overrideDialogPeriod!, null);
                                    setOverrideDialogPeriod(null);
                                }}
                                className="w-full p-2 rounded-lg border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all"
                            >
                                差し替えを解除（通常時間割に戻す）
                            </button>
                        )}
                        <p className="text-[10px] text-slate-400 text-center">
                            ※ 時限ボタンを長押しでこの画面を開けます
                        </p>
                    </div>
                </div>
            )}
            {/* Bulk Present Confirmation Dialog */}
            {showBulkConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkConfirm(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <Users className="h-5 w-5 text-green-600" />
                                </div>
                                全員出席
                            </h3>
                            <button onClick={() => setShowBulkConfirm(false)} className="p-1 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                            <p className="text-green-800 font-bold text-lg">
                                {PERIODS.find(p => p.id === period)?.label || `${period}限`}
                            </p>
                            <p className="text-green-600 text-sm mt-1">
                                {filteredStudents.length}名全員を「出席」にします
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkConfirm(false)}
                                className="flex-1 p-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeBulkPresent}
                                className="flex-1 p-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition-all active:scale-95 shadow-lg shadow-green-200 flex items-center justify-center gap-2"
                            >
                                <CheckCircle2 className="h-5 w-5" />
                                全員出席
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                            ※ 出席ボタンを長押しでこの画面を開けます
                        </p>
                    </div>
                </div>
            )}
            {/* Full-Day Absent Confirmation Dialog */}
            {showDayAbsentConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDayAbsentConfirm(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                                1日欠席
                            </h3>
                            <button onClick={() => setShowDayAbsentConfirm(false)} className="p-1 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                            <p className="text-red-800 font-bold text-lg">
                                {selectedStudentId ? students.find(s => s.id === selectedStudentId)?.name : ''}
                            </p>
                            <p className="text-red-600 text-sm mt-1">
                                {format(parseISO(date), 'M月d日(EEE)', { locale: ja })}の全{(settings.periodCount ?? 4) + 1}コマを「欠席」にします
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDayAbsentConfirm(false)}
                                className="flex-1 p-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeDayAbsent}
                                className="flex-1 p-3 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                            >
                                <XCircle className="h-5 w-5" />
                                1日欠席
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                            ※ 欠席ボタンを長押しでこの画面を開けます
                        </p>
                    </div>
                </div>
            )}
            {/* Bulk Reset Confirmation Dialog */}
            {showBulkResetConfirm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkResetConfirm(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm space-y-5 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <div className="p-2 bg-slate-100 rounded-lg">
                                    <Minus className="h-5 w-5 text-slate-600" />
                                </div>
                                全員未入力に戻す
                            </h3>
                            <button onClick={() => setShowBulkResetConfirm(false)} className="p-1 rounded-full hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                            <p className="text-slate-800 font-bold text-lg">
                                {PERIODS.find(p => p.id === period)?.label || `${period}限`}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">
                                {filteredStudents.length}名全員の入力を「未入力」に戻します
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowBulkResetConfirm(false)}
                                className="flex-1 p-3 rounded-lg border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={executeBulkReset}
                                className="flex-1 p-3 rounded-lg bg-slate-600 text-white font-bold hover:bg-slate-700 transition-all active:scale-95 shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                            >
                                <Minus className="h-5 w-5" />
                                全員リセット
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                            ※ 未入力ボタンを長押しでこの画面を開けます
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
