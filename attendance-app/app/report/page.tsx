'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO, isSameMonth, eachDayOfInterval, isSaturday, isSunday, getDay, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { utils, writeFile } from 'xlsx';

export default function ReportPage() {
    const { students, subjects, attendanceRecords, calendar, settings } = useStore();
    const [mounted, setMounted] = useState(false);
    const [targetMonth, setTargetMonth] = useState(format(new Date(), 'yyyy-MM'));

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    // --- Logic ---
    const getValidDays = (start: Date, end: Date) => {
        if (start > end) return [];
        const days = eachDayOfInterval({ start, end });
        return days.filter(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const calConfig = calendar.find(c => c.date === dStr);
            if (calConfig?.isHoliday) return false;
            if (calendar.length > 0) return true;
            return !isSaturday(d) && !isSunday(d);
        });
    };

    const calcStats = (studentId: string, start: Date, end: Date) => {
        const validDays = getValidDays(start, end);

        // Attendance Rate (4 periods only)
        const totalSlots = validDays.length * 4;
        let attendanceRate = '0.0';
        let presentCount = 0;

        if (totalSlots > 0) {
            // Absences in valid days/periods
            const absences = attendanceRecords.filter(r => {
                if (r.studentId !== studentId) return false;
                if (r.status !== 'absent') return false;
                if (r.period === 0) return false;
                // Check date range
                const d = parseISO(r.date);
                if (d < start || d > end) return false;

                // Helper: check if holiday (already handled by getValidDays for logic, but record might exist on holiday?)
                // We should filter absences that are on Valid Days
                return validDays.some(vd => isSameMonth(vd, d) && vd.getDate() === d.getDate());
            }).length;

            presentCount = totalSlots - absences;
            attendanceRate = ((presentCount / totalSlots) * 100).toFixed(1);
        }

        // Cumulative Hours
        let subjectHours: Record<string, number> = {};
        subjects.forEach(s => subjectHours[s.id] = 0);

        validDays.forEach(d => {
            const dStr = format(d, 'yyyy-MM-dd');
            const dayIndex = getDay(d);
            [1, 2, 3, 4].forEach(period => {
                const key = `${dayIndex}-${period}`;
                const subjectId = settings.timetable?.[key];
                if (subjectId) {
                    const record = attendanceRecords.find(r => r.studentId === studentId && r.date === dStr && r.period === period);
                    const isAbsent = record?.status === 'absent';
                    if (!isAbsent) subjectHours[subjectId] = (subjectHours[subjectId] || 0) + 1;
                }
            });
        });

        // Counts
        const late = attendanceRecords.filter(r => r.studentId === studentId && r.status === 'late' && parseISO(r.date) >= start && parseISO(r.date) <= end).length;
        const early = attendanceRecords.filter(r => r.studentId === studentId && r.status === 'early_leave' && parseISO(r.date) >= start && parseISO(r.date) <= end).length;

        return {
            rate: attendanceRate,
            present: presentCount,
            total: totalSlots,
            subjectHours,
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
                                {s.name}<br /><span className="text-xs font-normal">履修/必須</span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => {
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
                                    const diff = s.requiredHours - current;
                                    return (
                                        <td key={s.id} className="border p-2">
                                            <div className="flex justify-between">
                                                <span>{current}h</span>
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
        </div>
    );

    const handleExport = () => {
        const wb = utils.book_new();

        const createSheet = (sheetName: string, start: Date, end: Date) => {
            const data: (string | number)[][] = [
                ['学籍番号', '氏名', 'クラス', `出席率(%)`, '遅刻', '早退', ...subjects.map(s => `${s.name} (履修/必須)`)]
            ];
            students.forEach(s => {
                const stat = calcStats(s.id, start, end);
                data.push([
                    s.studentNumber, s.name, s.className, `${stat.rate}%`, stat.late, stat.early,
                    ...subjects.map(subj => `${stat.subjectHours[subj.id] || 0} / ${subj.requiredHours}`)
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

        writeFile(wb, `attendance_report_full_${format(new Date(), 'yyyyMMdd')}.xlsx`);
    };

    const [y, m] = targetMonth.split('-').map(Number);
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">集計・レポート</h1>
                <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                    Excel一括出力 (全シート)
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>集計ビュー</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="month">
                        <TabsList className="grid w-full grid-cols-4 mb-4">
                            <TabsTrigger value="month">月別 ({targetMonth})</TabsTrigger>
                            <TabsTrigger value="first">前期</TabsTrigger>
                            <TabsTrigger value="second">後期</TabsTrigger>
                            <TabsTrigger value="year">年間</TabsTrigger>
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
                    </Tabs>
                </CardContent>
            </Card>

            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                <h3 className="font-bold mb-2">集計ロジック</h3>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>期間</strong>: 設定画面で指定した「前期」「後期」の期間に基づいて計算されます。</li>
                    <li><strong>Excel出力</strong>: 「月別」「前期」「後期」「年間」の4つのシートを含むファイルを生成します。</li>
                </ul>
            </div>
        </div>
    );
}
