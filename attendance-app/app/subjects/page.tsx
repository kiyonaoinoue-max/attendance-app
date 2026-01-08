'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';

const DAYS = ['月', '火', '水', '木', '金'];
const PERIODS = [1, 2, 3, 4];

export default function SubjectsPage() {
    const { subjects, addSubject, deleteSubject, settings, updateSettings } = useStore();
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
                    <CardTitle>時間割設定</CardTitle>
                </CardHeader>
                <CardContent>
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
                                            {DAYS.map((d) => (
                                                <th key={d} className="border p-2 bg-slate-100 w-1/5">{d}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PERIODS.map(p => (
                                            <tr key={p}>
                                                <td className="border p-2 font-bold text-center bg-slate-50">{p}限</td>
                                                {DAYS.map((d, i) => {
                                                    const dayIndex = i + 1; // 1=Mon, ..., 5=Fri
                                                    const key = `${dayIndex}-${p}`;
                                                    const currentSubjectId = settings.firstTermTimetable?.[key] || '';

                                                    return (
                                                        <td key={key} className="border p-2">
                                                            <select
                                                                className="w-full p-2 border rounded text-xs"
                                                                value={currentSubjectId}
                                                                onChange={(e) => {
                                                                    updateSettings({
                                                                        firstTermTimetable: {
                                                                            ...settings.firstTermTimetable,
                                                                            [key]: e.target.value
                                                                        }
                                                                    });
                                                                }}
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
                                            {DAYS.map((d) => (
                                                <th key={d} className="border p-2 bg-slate-100 w-1/5">{d}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PERIODS.map(p => (
                                            <tr key={p}>
                                                <td className="border p-2 font-bold text-center bg-slate-50">{p}限</td>
                                                {DAYS.map((d, i) => {
                                                    const dayIndex = i + 1; // 1=Mon, ..., 5=Fri
                                                    const key = `${dayIndex}-${p}`;
                                                    const currentSubjectId = settings.secondTermTimetable?.[key] || '';

                                                    return (
                                                        <td key={key} className="border p-2">
                                                            <select
                                                                className="w-full p-2 border rounded text-xs"
                                                                value={currentSubjectId}
                                                                onChange={(e) => {
                                                                    updateSettings({
                                                                        secondTermTimetable: {
                                                                            ...settings.secondTermTimetable,
                                                                            [key]: e.target.value
                                                                        }
                                                                    });
                                                                }}
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
