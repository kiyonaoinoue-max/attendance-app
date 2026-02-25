'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isSameMonth, eachDayOfInterval, isSaturday, isSunday, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { utils, writeFile } from 'xlsx';
import { cn } from '@/lib/utils';

export default function ReportPage() {
    const { students, attendanceRecords, settings, subjects, calendar, selectedGrade, setSelectedGrade } = useStore();
    const [mounted, setMounted] = useState(false);
    const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // Filter students
    const filteredStudents = students.filter(s => (s.grade || 1) === selectedGrade);

    // --- Logic ---
    // Find the earliest record date to prevent "Ghost Attendance" in past
    const sortedRecordDates = attendanceRecords
        .map(r => r.date)
        .sort((a, b) => a.localeCompare(b));
    const minRecordDate = sortedRecordDates.length > 0 ? sortedRecordDates[0] : format(new Date(), 'yyyy-MM-dd');

    const getValidDays = (start: Date, end: Date) => {
        if (start > end) return [];
        const days = eachDayOfInterval({ start, end });
        return days.filter(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const calConfig = calendar.find(c => c.date === dStr);
            if (calConfig?.isHoliday) return false;
            // Default to Mon-Fri if no calendar
            if (calendar.length > 0) return true;
            return !isSaturday(d) && !isSunday(d);
        });
    };

    const calcStats = (studentId: string, start: Date, end: Date) => {
        // Cap the end date at "Today" (end of today) to avoid counting future days
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const effectiveEnd = end > today ? today : end;
        let validDays = getValidDays(start, effectiveEnd);

        // Filter out "Pre-history" days (days before first app usage) from denominator
        validDays = validDays.filter(d => format(d, 'yyyy-MM-dd') >= minRecordDate);

        // Further filter: Only include days where this student has at least one attendance record
        // This prevents counting days where no attendance was entered
        const daysWithRecords = new Set(
            attendanceRecords
                .filter(r => r.studentId === studentId)
                .map(r => r.date)
        );
        validDays = validDays.filter(d => daysWithRecords.has(format(d, 'yyyy-MM-dd')));

        // Get student grade for timetable lookup
        const student = students.find(s => s.id === studentId);
        const gradeKey: 'year1' | 'year2' = (student?.grade || 1) === 1 ? 'year1' : 'year2';

        // Cumulative Hours and Attendance Tracking
        let subjectHours: Record<string, number> = {};
        let subjectHeldHours: Record<string, number> = {};
        subjects.forEach(s => {
            subjectHours[s.id] = 0;
            subjectHeldHours[s.id] = 0;
        });

        // Count total slots and present count based on TIMETABLE (not fixed 4)
        let totalSlots = 0;
        let presentCount = 0;

        validDays.forEach(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const dayIndex = getDay(d);

            // Map dayIndex to simplified day string for key: "Sun", "Mon", etc.
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const dayStr = days[dayIndex];

            // Determine term based on date
            const secondTermStart = settings.secondTerm?.start || '';
            const secondTermEnd = settings.secondTerm?.end || '';
            const isSecondTerm = secondTermStart && secondTermEnd && dStr >= secondTermStart && dStr <= secondTermEnd;
            const termKey: 'first' | 'second' = isSecondTerm ? 'second' : 'first';

            // New Nested Structure
            const timetable = settings.timetables?.[gradeKey]?.[termKey];

            const periodCount = settings.periodCount ?? 4;
            const hourPerPeriod = settings.hourPerPeriod ?? 1.8;

            Array.from({ length: periodCount }, (_, i) => i + 1).forEach(period => {
                const key = `${dayStr}-${period}`;
                const subjectId = timetable?.[key];

                // Only count this slot if timetable has a subject set
                if (subjectId) {
                    totalSlots++; // Count as scheduled slot

                    const record = attendanceRecords.find(r => r.studentId === studentId && r.date === dStr && r.period === period);

                    if (record) {
                        // Explicit record exists
                        // Late (遅刻) and early_leave (早退) count as PRESENT
                        if (record.status !== 'absent') {
                            presentCount++;
                            subjectHours[subjectId] = (subjectHours[subjectId] || 0) + hourPerPeriod;
                        }
                        // Absent does not count as present, no hours added
                    }
                    // No record for this period = not entered yet, do NOT count as present
                }
            });
        });

        // Calculate attendance rate
        const attendanceRate = totalSlots > 0 ? ((presentCount / totalSlots) * 100).toFixed(1) : '0.0';

        // Counts for late and early leave
        const late = attendanceRecords.filter(r => r.studentId === studentId && r.status === 'late' && parseISO(r.date) >= start && parseISO(r.date) <= end).length;
        const early = attendanceRecords.filter(r => r.studentId === studentId && r.status === 'early_leave' && parseISO(r.date) >= start && parseISO(r.date) <= end).length;

        // Round subject hours to 1 decimal place
        Object.keys(subjectHours).forEach(key => {
            subjectHours[key] = Math.round(subjectHours[key] * 10) / 10;
            subjectHeldHours[key] = Math.round(subjectHeldHours[key] * 10) / 10;
        });

        return {
            rate: attendanceRate,
            present: presentCount,
            total: totalSlots,
            subjectHours,
            subjectHeldHours,
            late,
            early
        };
    };

    const renderTable = (start: Date, end: Date) => (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse border border-slate-200">
                <thead className="bg-slate-100 text-slate-700">
                    <tr>
                        <th className="border p-2">番号</th>
                        <th className="border p-2 min-w-[100px]">氏名</th>
                        <th className="border p-2">出席率</th>
                        <th className="border p-2 text-red-600">遅刻</th>
                        <th className="border p-2 text-orange-600">早退</th>
                        {subjects.map(s => (
                            <th key={s.id} className="border p-2 min-w-[120px]">
                                {s.name}<br /><span className="text-xs font-normal">出席/必須</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {filteredStudents.length === 0 ? (
                        <tr>
                            <td colSpan={5 + subjects.length} className="p-8 text-center text-muted-foreground">
                                {selectedGrade}年生の学生は登録されていません。
                            </td>
                        </tr>
                    ) : filteredStudents.map(student => {
                        const stat = calcStats(student.id, start, end);
                        return (
                            <tr key={student.id} className="border-t hover:bg-slate-50">
                                <td className="border p-2 font-medium">{student.studentNumber}</td>
                                <td className="border p-2">{student.name}</td>
                                <td className="border p-2 font-bold">
                                    {stat.rate}%
                                    <span className="text-xs text-muted-foreground block">({stat.present}/{stat.total})</span>
                                </td>
                                <td className="border p-2">{stat.late}</td>
                                <td className="border p-2">{stat.early}</td>
                                {subjects.map(s => {
                                    const current = stat.subjectHours[s.id] || 0;
                                    return (
                                        <td key={s.id} className="border p-2">
                                            <div className="flex justify-between">
                                                <span>{current.toFixed(1)}h</span>
                                                <span className="text-slate-400">/ {s.requiredHours}h</span>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="mt-2 text-xs text-slate-500 text-right">
                ※履修時間は1コマ{settings.hourPerPeriod ?? 1.8}時間で計算
            </div>
        </div>
    );

    const handleExport = () => {
        const wb = utils.book_new();

        const createSheet = (sheetName: string, start: Date, end: Date) => {
            const data: (string | number)[][] = [
                ['学籍番号', '氏名', 'クラス', `出席率(%)`, '遅刻', '早退', ...subjects.map(s => `${s.name} (出席/必須)`)]
            ];
            // Export filtered students only? Or all? Usually export matches view.
            filteredStudents.forEach(s => {
                const stat = calcStats(s.id, start, end);
                data.push([
                    s.studentNumber, s.name, s.className, `${stat.rate}%`, stat.late, stat.early,
                    ...subjects.map(subj => `${(stat.subjectHours[subj.id] || 0).toFixed(1)} / ${subj.requiredHours}`)
                ]);
            });
            const ws = utils.aoa_to_sheet(data);
            utils.book_append_sheet(wb, ws, sheetName);
        };

        // 1. Monthly (Current Selected)
        const [y, m] = targetMonth.split('-').map(Number);
        createSheet(`${m}月`, new Date(y, m - 1, 1), new Date(y, m, 0));

        // 2. First Term
        if (settings.firstTerm?.start) {
            createSheet('前期', parseISO(settings.firstTerm.start), parseISO(settings.firstTerm.end));
        }

        // 3. Second Term
        if (settings.secondTerm?.start) {
            createSheet('後期', parseISO(settings.secondTerm.start), parseISO(settings.secondTerm.end));
        }

        // 4. Annual
        if (settings.firstTerm?.start && settings.secondTerm?.end) {
            createSheet('年間', parseISO(settings.firstTerm.start), parseISO(settings.secondTerm.end));
        }

        writeFile(wb, `attendance_report_${selectedGrade}yr_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const [y, m] = targetMonth.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0);

    // --- Yearly Rate Logic ---
    const renderYearlyTrend = () => {
        // Generate months: Apr of Current Year -> Mar of Next Year
        const today = new Date();
        const currentYear = today.getMonth() < 3 ? today.getFullYear() - 1 : today.getFullYear(); // School year starts in April

        const months = [];
        for (let i = 0; i < 12; i++) {
            months.push(new Date(currentYear, 3 + i, 1)); // Apr is 3
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse border border-slate-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border p-2 sticky left-0 bg-slate-100 z-10">氏名</th>
                            {months.map(m => (
                                <th key={m.toString()} className="border p-2 min-w-[60px] text-center">
                                    {m.getMonth() + 1}月
                                </th>
                            ))}
                            <th className="border p-2 bg-slate-200">年間Avg</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="p-8 text-center text-muted-foreground">
                                    {selectedGrade}年生の学生は登録されていません。
                                </td>
                            </tr>
                        ) : filteredStudents.map(student => {
                            let totalPresent = 0;
                            let totalSlots = 0;

                            const monthlyRates = months.map(m => {
                                const start = startOfMonth(m);
                                const end = endOfMonth(m);
                                // Reuse calcStats
                                const stat = calcStats(student.id, start, end);

                                // Accumulate for yearly avg (only if valid slots exist)
                                if (stat.total > 0) {
                                    totalPresent += stat.present;
                                    totalSlots += stat.total;
                                }

                                return stat.total > 0 ? stat.rate : '-';
                            });

                            const yearlyRate = totalSlots > 0 ? ((totalPresent / totalSlots) * 100).toFixed(1) : '-';

                            return (
                                <tr key={student.id} className="border-t hover:bg-slate-50">
                                    <td className="border p-2 font-medium sticky left-0 bg-white z-10">{student.name}</td>
                                    {monthlyRates.map((rate, i) => (
                                        <td key={i} className="border p-2 text-center text-xs">
                                            {rate === '-' ? <span className="text-slate-300">-</span> : `${rate}%`}
                                        </td>
                                    ))}
                                    <td className="border p-2 text-center font-bold bg-slate-50">
                                        {yearlyRate !== '-' ? `${yearlyRate}%` : '-'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">集計・レポート</h1>
                <div className="flex gap-4 items-center">
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

                    <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                        Excel出力 ({selectedGrade}年)
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>集計ビュー ({selectedGrade}年生)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="month">
                        <TabsList className="grid w-full grid-cols-5 mb-4">
                            <TabsTrigger value="month">月別 ({targetMonth})</TabsTrigger>
                            <TabsTrigger value="first">前期</TabsTrigger>
                            <TabsTrigger value="second">後期</TabsTrigger>
                            <TabsTrigger value="year">年間</TabsTrigger>
                            <TabsTrigger value="trend">出席率推移</TabsTrigger>
                        </TabsList>

                        <TabsContent value="month">
                            <div className="mb-4 text-right">
                                <input type="month" value={targetMonth} onChange={e => setTargetMonth(e.target.value)} className="border p-1 rounded" />
                            </div>
                            {renderTable(monthStart, monthEnd)}
                        </TabsContent>

                        <TabsContent value="first">
                            {settings.firstTerm ? (
                                <>
                                    <div className="mb-2 font-bold text-center">
                                        {settings.firstTerm.start} 〜 {settings.firstTerm.end}
                                    </div>
                                    {renderTable(parseISO(settings.firstTerm.start), parseISO(settings.firstTerm.end))}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    前期の設定がありません。「設定」画面で期間を設定してください。
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="second">
                            {settings.secondTerm ? (
                                <>
                                    <div className="mb-2 font-bold text-center">
                                        {settings.secondTerm.start} 〜 {settings.secondTerm.end}
                                    </div>
                                    {renderTable(parseISO(settings.secondTerm.start), parseISO(settings.secondTerm.end))}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    後期の設定がありません。「設定」画面で期間を設定してください。
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="year">
                            {settings.firstTerm && settings.secondTerm ? (
                                <>
                                    <div className="mb-2 font-bold text-center">
                                        {settings.firstTerm.start} 〜 {settings.secondTerm.end}
                                    </div>
                                    {renderTable(parseISO(settings.firstTerm.start), parseISO(settings.secondTerm.end))}
                                </>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    年間期間を計算できません。「設定」画面で前期・後期の期間を設定してください。
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="trend">
                            <div className="mb-4 font-bold text-center">
                                年間出席率推移 (4月〜翌3月)
                            </div>
                            {renderYearlyTrend()}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <h3 className="font-bold mb-2">集計ロジック</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>期間</strong>: 設定画面で指定した「前期」「後期」の期間に基づいて計算されます。</li>
                    <li><strong>Excel出力</strong>: 選択中の学年のみを含むファイルを生成します。</li>
                </ul>
            </div>
        </div>
    );
}
