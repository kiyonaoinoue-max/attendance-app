'use client';
import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Clock, TimerOff, AlertCircle, Minus, Plus } from 'lucide-react';
import { AttendanceStatus } from '@/types';

const STATUS_CONFIG: Record<AttendanceStatus, { label: string, color: string, icon: any }> = {
    present: { label: '出席', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle2 },
    absent: { label: '欠席', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    late: { label: '遅刻', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
    early_leave: { label: '早退', color: 'bg-orange-100 text-orange-800 border-orange-300', icon: TimerOff },
};

const PERIODS = [
    { id: 0, label: 'HR' },
    { id: 1, label: '1限' },
    { id: 2, label: '2限' },
    { id: 3, label: '3限' },
    { id: 4, label: '4限' },
];

export default function AttendancePage() {
    const { students, attendanceRecords, calendar, toggleAttendance } = useStore();
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(0); // 0 = HR
    const [zoomLevel, setZoomLevel] = useState(1); // 0.4 to 1.4
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const studentRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Auto-select first student on mount/data load
    useEffect(() => {
        if (students.length > 0 && !selectedStudentId) {
            setSelectedStudentId(students[0].id);
        }
    }, [students, selectedStudentId]);

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
            r => r.studentId === studentId && r.date === date && r.period === p
        );
        return record?.status ?? null; // null = untouched
    };

    // Find if current day is holiday
    const currentDayConfig = calendar.find(c => c.date === date);
    const isHoliday = currentDayConfig?.isHoliday;

    return (
        <div className="space-y-4 pb-20">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900">出席簿入力</h1>
                {/* Zoom Control */}
                <div className="flex items-center gap-2 bg-white p-1 rounded-lg border shadow-sm">
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
                    {PERIODS.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => setPeriod(p.id)}
                            className={cn(
                                "flex-1 min-w-[60px] py-2 px-4 rounded-lg text-sm font-bold transition-all border-2",
                                period === p.id
                                    ? "bg-slate-900 text-white border-slate-900 shadow-md transform -translate-y-[1px]"
                                    : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {students.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground border-dashed">
                    学生が登録されていません。<br />
                    「学生管理」メニューから学生を登録してください。
                </Card>
            ) : (
                <div className="flex gap-4 items-start">
                    {/* Left: Student List */}
                    <div className="flex-1 space-y-2 pb-40">
                        {students.map((student, index) => {
                            const currentPeriodStatus = getStatus(student.id, period);
                            const isSelected = selectedStudentId === student.id;

                            return (
                                <div
                                    key={student.id}
                                    ref={el => { studentRefs.current[student.id] = el }}
                                    onClick={() => setSelectedStudentId(student.id)}
                                    className={cn(
                                        "flex items-center justify-between bg-white rounded-lg border shadow-sm transition-all select-none overflow-hidden cursor-pointer",
                                        isSelected ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2 z-10" : "border-slate-200 hover:border-slate-300"
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
                    <div className="w-48 sticky top-40 bg-white rounded-xl border border-slate-200 shadow-xl p-4 space-y-4">
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
                                return (
                                    <button
                                        key={s}
                                        onClick={() => {
                                            if (!selectedStudentId) return;
                                            toggleAttendance(selectedStudentId, date, period, s);

                                            // Auto-advance
                                            const currentIndex = students.findIndex(st => st.id === selectedStudentId);
                                            if (currentIndex < students.length - 1) {
                                                const nextStudent = students[currentIndex + 1];
                                                setSelectedStudentId(nextStudent.id);
                                                // Scroll logic handled by scrollIntoView in useEffect or manual trigger? 
                                                // Let's do manual trigger here since we have refs
                                                const el = studentRefs.current[nextStudent.id];
                                                if (el) {
                                                    // Scroll with offset
                                                    const y = el.getBoundingClientRect().top + window.scrollY - 200; // Offset for header
                                                    window.scrollTo({ top: y, behavior: 'smooth' });
                                                }
                                            }
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:brightness-95 active:scale-95",
                                            cfg.color,
                                            "bg-opacity-20 border-opacity-50" // Muted background
                                        )}
                                    >
                                        <Icon className="h-6 w-6" />
                                        <span className="font-bold">{cfg.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="text-xs text-center text-slate-400 mt-4">
                            ボタンを押すと自動で次の人に移動します
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
        </div>
    );
}
