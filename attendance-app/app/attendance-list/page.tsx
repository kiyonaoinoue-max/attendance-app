'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format, parseISO, eachDayOfInterval, getDay, isSameMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
// ... imports
import { AttendanceStatus } from '@/types';

// Symbol mapping for "Paper Attendance Book" style
const STATUS_SYMBOLS: Record<AttendanceStatus, { symbol: string, color: string }> = {
    present: { symbol: '○', color: 'text-green-600' },
    absent: { symbol: '×', color: 'text-red-500' }, // Using '×' (multiplication sign) or '✕'
    late: { symbol: '△', color: 'text-yellow-600' },
    early_leave: { symbol: '早', color: 'text-orange-500' },
};

const getPeriods = (count: number) => [0, ...Array.from({ length: count }, (_, i) => i + 1)]; // 0=HR

export default function AttendanceListPage() {
    const { students, attendanceRecords, calendar, settings } = useStore();
    const [mounted, setMounted] = useState(false);
    const [targetMonth, setTargetMonth] = useState(new Date());
    const [selectedGrade, setSelectedGrade] = useState<number>(1);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // --- Logic ---
    const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
    const endOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0);
    const daysInMonth = eachDayOfInterval({ start: startOfMonth, end: endOfMonth });

    const getStatusConfig = (status: AttendanceStatus | null) => {
        if (!status) return { symbol: '・', color: 'text-slate-300' };
        const config: Record<string, { symbol: string; color: string }> = {
            present: { symbol: '○', color: 'text-green-600' },
            absent: { symbol: '×', color: 'text-red-600' },
            late: { symbol: '△', color: 'text-orange-500' },
            early_leave: { symbol: '早', color: 'text-orange-500' },
        };
        return config[status] || { symbol: '?', color: 'text-gray-400' };
    };

    const getStatus = (studentId: string, d: string, p: number) => {
        const record = attendanceRecords.find(
            (r: AttendanceRecord) => r.studentId === studentId && r.date === d && r.period === p
        );
        return record ? record.status : null;
    };

    const filteredStudents = students.filter(s => (s.grade || 1) === selectedGrade);

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(targetMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setTargetMonth(newDate);
    };

    // Helper to get status symbol
    const getStatusSymbol = (studentId: string, dateStr: string, period: number) => {
        const record = attendanceRecords.find(r => r.studentId === studentId && r.date === dateStr && r.period === period);
        if (!record) return null;
        return STATUS_SYMBOLS[record.status];
    };

    return (
        <div className="space-y-4 pb-10">
            {/* Header / Nav */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">月間出席一覧</h1>
                </div>

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

                <div className="flex items-center bg-white rounded-lg border shadow-sm p-1">
                    <Button variant="ghost" size="icon" onClick={() => handleMonthChange(-1)}>
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="px-4 font-bold text-lg min-w-[140px] text-center">
                        {format(targetMonth, 'yyyy年 M月', { locale: ja })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => handleMonthChange(1)}>
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Matrix Table Container */}
            <Card className="overflow-hidden border-slate-300 shadow-md">
                <div className="overflow-x-auto">
                    {/* 
                        Use inline-block or flex to allow sticky column.
                        We'll use a standard table structure.
                    */}
                    <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full border-collapse border-spacing-0">
                            <thead>
                                <tr>
                                    {/* Sticky Name Column Header */}
                                    <th className="sticky left-0 z-20 bg-slate-100 border-b border-r border-slate-300 p-2 min-w-[120px] text-center font-bold text-sm shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        氏名
                                    </th>
                                    {/* Date Headers */}
                                    {daysInMonth.map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const calConfig = calendar.find(c => c.date === dateStr);
                                        const isHoliday = calConfig?.isHoliday;
                                        const dayOfWeek = getDay(day);
                                        const isSat = dayOfWeek === 6;
                                        const isSun = dayOfWeek === 0;

                                        return (
                                            <th key={dateStr} colSpan={1 + (settings.periodCount ?? 4)} className={cn(
                                                "border-b border-r border-slate-300 text-center min-w-[150px]", // 30px * 5
                                                isHoliday ? "bg-red-50" : isSat ? "bg-blue-50" : isSun ? "bg-red-50" : "bg-white"
                                            )}>
                                                <div className={cn(
                                                    "py-1 text-xs font-bold",
                                                    (isHoliday || isSun) ? "text-red-600" : isSat ? "text-blue-600" : "text-slate-700"
                                                )}>
                                                    {format(day, 'd(EEE)', { locale: ja })}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                                <tr>
                                    {/* Sub-header for Sticky Col */}
                                    <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-300 p-1 text-[10px] text-center text-slate-500 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                        No.
                                    </th>
                                    {/* Period Headers (Repeated) */}
                                    {daysInMonth.map(day => (
                                        getPeriods(settings.periodCount ?? 4).map(p => (
                                            <th key={`${day.toISOString()}-${p}`} className={cn(
                                                "border-b border-r border-slate-200 p-1 text-[10px] text-center font-normal w-[30px]",
                                                p === 0 ? "bg-slate-100 text-slate-600" : "bg-white text-slate-400"
                                            )}>
                                                {p === 0 ? 'HR' : p}
                                            </th>
                                        ))
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan={1 + daysInMonth.length * (1 + (settings.periodCount ?? 4))} className="p-8 text-center text-muted-foreground">
                                            {selectedGrade}年生の学生は登録されていません。
                                        </td>
                                    </tr>
                                ) : filteredStudents.map((student, idx) => (
                                    <tr key={student.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                        {/* Sticky Name Cell */}
                                        <td className="sticky left-0 z-10 bg-white border-b border-r border-slate-300 px-2 py-1 text-sm font-bold text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px]">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-[10px] text-slate-400 w-4">{student.studentNumber}</span>
                                                <span>{student.name}</span>
                                            </div>
                                        </td>

                                        {/* Attendance Cells */}
                                        {daysInMonth.map(day => {
                                            const dateStr = format(day, 'yyyy-MM-dd');
                                            const calConfig = calendar.find(c => c.date === dateStr);
                                            const isHoliday = calConfig?.isHoliday || getDay(day) === 0 || getDay(day) === 6;

                                            return getPeriods(settings.periodCount ?? 4).map(p => {
                                                const status = getStatusSymbol(student.id, dateStr, p);
                                                return (
                                                    <td key={`${dateStr}-${p}`} className={cn(
                                                        "border-b border-r border-slate-200 text-center h-[32px] p-0 align-middle",
                                                        isHoliday ? "bg-slate-100/50" : "", // Holiday background
                                                        p === 0 && !isHoliday ? "bg-slate-50/50" : "" // Subtle HR background
                                                    )}>
                                                        {status ? (
                                                            <span className={cn("font-bold text-sm", status.color)}>
                                                                {status.symbol}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-200 text-[10px]">-</span>
                                                        )}
                                                    </td>
                                                );
                                            });
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>
            <div className="text-xs text-slate-500 text-right pr-2">
                ※ 横にスクロールしてご覧ください
            </div>
        </div>
    );
}
