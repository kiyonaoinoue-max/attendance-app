'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';

export default function StudentsPage() {
    const { students, addStudent, deleteStudent } = useStore();
    const [formData, setFormData] = useState({ studentNumber: '', name: '', className: '' });
    const [bulkData, setBulkData] = useState({ startNumber: '', className: '', names: '' });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.studentNumber || !formData.name) return;

        addStudent({
            studentNumber: parseInt(formData.studentNumber),
            name: formData.name,
            className: formData.className || 'Aクラス' // Default
        });
        setFormData({ studentNumber: '', name: '', className: 'Aクラス' });
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bulkData.startNumber || !bulkData.names) return;

        // Split by newline and filter empty
        const namesList = bulkData.names.split('\n').map(n => n.trim()).filter(n => n);
        let currentNumber = parseInt(bulkData.startNumber);
        const targetClass = bulkData.className || 'Aクラス';

        namesList.forEach(name => {
            addStudent({
                studentNumber: currentNumber,
                name: name,
                className: targetClass
            });
            currentNumber++;
        });

        setBulkData({ startNumber: '', className: 'Aクラス', names: '' });
        alert(`${namesList.length}名の学生を一括登録しました。`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">学生管理</h1>

            <Card>
                <CardHeader>
                    <CardTitle>学生登録</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="single">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="single">個別登録</TabsTrigger>
                            <TabsTrigger value="bulk">一括登録（リスト）</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single">
                            <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-sm font-medium">出席番号</label>
                                    <Input
                                        type="number"
                                        placeholder="例: 101"
                                        value={formData.studentNumber}
                                        onChange={e => setFormData({ ...formData, studentNumber: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex-[2] space-y-2 w-full">
                                    <label className="text-sm font-medium">氏名</label>
                                    <Input
                                        placeholder="例: 山田 太郎"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex-1 space-y-2 w-full">
                                    <label className="text-sm font-medium">クラス</label>
                                    <Input
                                        placeholder="例: 1年A組"
                                        value={formData.className}
                                        onChange={e => setFormData({ ...formData, className: e.target.value })}
                                    />
                                </div>
                                <Button type="submit" className="w-full md:w-auto">登録</Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="bulk">
                            <form onSubmit={handleBulkSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">開始出席番号 (連番で自動付与)</label>
                                        <Input
                                            type="number"
                                            placeholder="例: 101"
                                            value={bulkData.startNumber}
                                            onChange={e => setBulkData({ ...bulkData, startNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">クラス</label>
                                        <Input
                                            placeholder="例: 1年A組"
                                            value={bulkData.className}
                                            onChange={e => setBulkData({ ...bulkData, className: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">氏名リスト (改行区切りで貼り付け)</label>
                                    <Textarea
                                        placeholder="山田 太郎&#13;&#10;鈴木 次郎&#13;&#10;佐藤 花子"
                                        className="min-h-[150px]"
                                        value={bulkData.names}
                                        onChange={e => setBulkData({ ...bulkData, names: e.target.value })}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">リストを一括登録</Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>登録学生一覧 ({students.length}名)</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="p-3">出席番号</th>
                                    <th className="p-3">氏名</th>
                                    <th className="p-3">クラス</th>
                                    <th className="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} className="border-t">
                                        <td className="p-3 font-medium">{student.studentNumber}</td>
                                        <td className="p-3">{student.name}</td>
                                        <td className="p-3">{student.className}</td>
                                        <td className="p-3 text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => deleteStudent(student.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            学生が登録されていません
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
