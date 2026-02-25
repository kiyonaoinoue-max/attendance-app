'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']; // Key format matching attendance/report pages
const DAY_LABELS = ['月', '火', '水', '木', '金']; // Display labels

const getPeriods = (count: number) => Array.from({ length: count }, (_, i) => i + 1);

export default function SubjectsPage() {
    const { subjects, addSubject, deleteSubject, settings, updateSettings, selectedGrade, setSelectedGrade } = useStore();
    const [formData, setFormData] = useState({ name: '', teacher: '', requiredHours: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.requiredHours) return;

        addSubject({
            name: formData.name,
            teacher: formData.teacher,
            requiredHours: parseInt(formData.requiredHours)
        });
        setFormData({ name: '', teacher: '', requiredHours: '' });
    };

    const gradeKey: 'year1' | 'year2' = selectedGrade === 1 ? 'year1' : 'year2';

    const updateTimetable = (term: 'first' | 'second', key: string, value: string) => {
        // Deep copy struct to avoid mutation, with safe defaults
        const currentTimetables = settings.timetables || { year1: { first: {}, second: {} }, year2: { first: {}, second: {} } };
        const newTimetables = {
            year1: {
                first: { ...(currentTimetables.year1?.first || {}) },
                second: { ...(currentTimetables.year1?.second || {}) }
            },
            year2: {
                first: { ...(currentTimetables.year2?.first || {}) },
                second: { ...(currentTimetables.year2?.second || {}) }
            }
        };

        // Update specific entry
        newTimetables[gradeKey][term][key] = value;

        updateSettings({ timetables: newTimetables });
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">教科管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle>新規教科登録</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="flex-[2] space-y-2 w-full">
                            <label className="text-sm font-medium">教科名</label>
                            <Input
                                placeholder="例: 自動車工学 I"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-medium">担当教員</label>
                            <Input
                                placeholder="例: 鈴木 先生"
                                value={formData.teacher}
                                onChange={e => setFormData({ ...formData, teacher: e.target.value })}
                            />
                        </div>
                        <div className="flex-1 space-y-2 w-full">
                            <label className="text-sm font-medium">必須履修時間 (H)</label>
                            <Input
                                type="number"
                                placeholder="例: 60"
                                value={formData.requiredHours}
                                onChange={e => setFormData({ ...formData, requiredHours: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full md:w-auto">登録</Button>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>登録教科一覧</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="p-3">教科名</th>
                                    <th className="p-3">担当教員</th>
                                    <th className="p-3">必須時間</th>
                                    <th className="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {subjects.map((subject) => (
                                    <tr key={subject.id} className="border-t">
                                        <td className="p-3 font-medium">{subject.name}</td>
                                        <td className="p-3">{subject.teacher}</td>
                                        <td className="p-3">{subject.requiredHours} 時間</td>
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteSubject(subject.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {subjects.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            教科が登録されていません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>時間割設定</CardTitle>
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
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Period Count Toggle */}
                    <div className="mb-6 space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-700 min-w-[80px]">コマ数:</span>
                            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                                {([4, 6, 8] as const).map((count) => (
                                    <button
                                        key={count}
                                        className={cn(
                                            "px-5 py-2 rounded text-sm font-bold transition-all",
                                            settings.periodCount === count
                                                ? "bg-white shadow text-slate-900"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                        onClick={() => {
                                            const hourDefault = count === 4 ? 1.8 : 1.0;
                                            updateSettings({ periodCount: count, hourPerPeriod: hourDefault });
                                        }}
                                    >
                                        {count}限
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-700 min-w-[80px]">1コマ:</span>
                            <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                                {(settings.periodCount === 4
                                    ? [{ value: 1.8, label: '1.8h' }, { value: 1.5, label: '1.5h' }]
                                    : [{ value: 1.0, label: '1.0h' }, { value: 0.83, label: '0.83h (50分)' }, { value: 0.75, label: '0.75h (45分)' }]
                                ).map((opt) => (
                                    <button
                                        key={opt.value}
                                        className={cn(
                                            "px-5 py-2 rounded text-sm font-bold transition-all",
                                            settings.hourPerPeriod === opt.value
                                                ? "bg-white shadow text-slate-900"
                                                : "text-slate-500 hover:text-slate-700"
                                        )}
                                        onClick={() => updateSettings({ hourPerPeriod: opt.value })}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <span className="text-xs text-slate-400">※ 集計出力時の履修時間計算に使用</span>
                        </div>
                    </div>

                    <Tabs defaultValue="first" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="first">前期 ({settings.firstTerm?.start} 〜 {settings.firstTerm?.end})</TabsTrigger>
                            <TabsTrigger value="second">後期 ({settings.secondTerm?.start} 〜 {settings.secondTerm?.end})</TabsTrigger>
                        </TabsList>

                        <TabsContent value="first">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse border border-slate-200">
                                    <thead>
                                        <tr>
                                            <th className="border p-2 bg-slate-100">時限 \ 曜日</th>
                                            {DAY_LABELS.map((d, i) => (
                                                <th key={DAYS[i]} className="border p-2 bg-slate-100 w-1/5">{d}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPeriods(settings.periodCount).map(p => (
                                            <tr key={p}>
                                                <td className="border p-2 font-bold text-center bg-slate-50">{p}限</td>
                                                {DAYS.map((dayKey, i) => {
                                                    const key = `${dayKey}-${p}`;
                                                    const currentSubjectId = settings.timetables?.[gradeKey]?.['first']?.[key] || '';

                                                    return (
                                                        <td key={key} className="border p-2">
                                                            <select
                                                                className="w-full p-2 border rounded text-xs"
                                                                value={currentSubjectId}
                                                                onChange={(e) => updateTimetable('first', key, e.target.value)}
                                                            >
                                                                <option value="">(未設定)</option>
                                                                {subjects.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>

                        <TabsContent value="second">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm border-collapse border border-slate-200">
                                    <thead>
                                        <tr>
                                            <th className="border p-2 bg-slate-100">時限 \ 曜日</th>
                                            {DAY_LABELS.map((d, i) => (
                                                <th key={DAYS[i]} className="border p-2 bg-slate-100 w-1/5">{d}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPeriods(settings.periodCount).map(p => (
                                            <tr key={p}>
                                                <td className="border p-2 font-bold text-center bg-slate-50">{p}限</td>
                                                {DAYS.map((dayKey, i) => {
                                                    const key = `${dayKey}-${p}`;
                                                    const currentSubjectId = settings.timetables?.[gradeKey]?.['second']?.[key] || '';

                                                    return (
                                                        <td key={key} className="border p-2">
                                                            <select
                                                                className="w-full p-2 border rounded text-xs"
                                                                value={currentSubjectId}
                                                                onChange={(e) => updateTimetable('second', key, e.target.value)}
                                                            >
                                                                <option value="">(未設定)</option>
                                                                {subjects.map(s => (
                                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                    <p className="mt-4 text-xs text-muted-foreground">
                        ※ ここで設定した時間割に基づいて、各時限の出席がどの教科の履修時間に加算されるかが決定されます。
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
