'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, AlertTriangle, Lock } from 'lucide-react'; // Added icons
import Link from 'next/link'; // Added Link

export default function StudentsPage() {
    const { students, addStudent, updateStudent, deleteStudent, getLicenseStatus } = useStore();
    const [formData, setFormData] = useState({ id: '', studentNumber: '', name: '', className: '', grade: '1' });
    const [bulkData, setBulkData] = useState({ startNumber: '', className: '', grade: '1', names: '' });
    const [mounted, setMounted] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const licenseStatus = getLicenseStatus();
    // Check limit: 5 students for free plan
    // Note: If currently editing existing student, limit doesn't apply
    const isLimitReached = licenseStatus !== 'pro' && students.length >= 5;

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Guard against force submit
        if (!isEditMode && isLimitReached) return;

        if (!formData.studentNumber || !formData.name) return;

        const gradeNum = parseInt(formData.grade);

        if (isEditMode && formData.id) {
            updateStudent(formData.id, {
                studentNumber: parseInt(formData.studentNumber),
                name: formData.name,
                className: formData.className || 'Aクラス',
                grade: gradeNum
            });
            setIsEditMode(false);
            alert('修正しました');
        } else {
            addStudent({
                studentNumber: parseInt(formData.studentNumber),
                name: formData.name,
                className: formData.className || 'Aクラス',
                grade: gradeNum
            });
            alert('登録しました');
        }

        // Reset form (keep class/grade for convenience)
        setFormData({ id: '', studentNumber: '', name: '', className: formData.className, grade: formData.grade });
    };

    const handleEdit = (student: any) => {
        setFormData({
            id: student.id,
            studentNumber: student.studentNumber.toString(),
            name: student.name,
            className: student.className,
            grade: (student.grade || 1).toString()
        });
        setIsEditMode(true);
        // Switch tab to single if needed, but assuming user stays on list or scrolls up
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setIsEditMode(false);
        setFormData({ id: '', studentNumber: '', name: '', className: '', grade: '1' });
    };

    const handleBulkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLimitReached) return; // Block bulk add if limit reached

        if (!bulkData.startNumber || !bulkData.names) return;

        const namesList = bulkData.names.split('\n').map(n => n.trim()).filter(n => n);

        // Check if adding these would exceed limit
        if (licenseStatus !== 'pro' && (students.length + namesList.length) > 5) {
            alert(`無料プランの上限は5名です。\n現在${students.length}名登録済みです。追加可能な人数を超えています。`);
            return;
        }

        let currentNumber = parseInt(bulkData.startNumber);
        const targetClass = bulkData.className || 'Aクラス';
        const targetGrade = parseInt(bulkData.grade);

        namesList.forEach(name => {
            addStudent({
                studentNumber: currentNumber,
                name: name,
                className: targetClass,
                grade: targetGrade
            });
            currentNumber++;
        });

        setBulkData({ startNumber: '', className: 'Aクラス', names: '', grade: bulkData.grade });
        alert(`${namesList.length}名の学生を一括登録しました。`);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">学生管理</h1>

            {/* Limit Alert */}
            {isLimitReached && !isEditMode && (
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-amber-800 flex items-start gap-3 shadow-sm animate-in slide-in-from-top-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0 text-amber-600" />
                    <div>
                        <div className="font-bold">無料プランの登録上限（5名）に達しました</div>
                        <div className="text-sm mt-1">
                            これ以上学生を追加するには、Proライセンスへのアップグレードが必要です。
                        </div>
                        <Link href="/settings" className="inline-flex items-center gap-1 text-sm font-bold underline mt-2 text-amber-900 hover:text-amber-700">
                            設定ページでライセンスを入力 <Lock className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            )}

            <Card className={isEditMode ? "border-2 border-orange-400" : (isLimitReached ? "opacity-60 grayscale pointer-events-none" : "")}>
                <CardHeader>
                    <CardTitle>{isEditMode ? '学生情報の修正' : '学生登録'}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="single">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="single" disabled={isEditMode || isLimitReached}>個別登録/修正</TabsTrigger>
                            <TabsTrigger value="bulk" disabled={isEditMode || isLimitReached}>一括登録（リスト）</TabsTrigger>
                        </TabsList>

                        <TabsContent value="single">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">学年</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={formData.grade}
                                            onChange={e => setFormData({ ...formData, grade: e.target.value })}
                                        >
                                            <option value="1">1年</option>
                                            <option value="2">2年</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">出席番号</label>
                                        <Input
                                            type="number"
                                            placeholder="Example: 101"
                                            value={formData.studentNumber}
                                            onChange={e => setFormData({ ...formData, studentNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-medium">氏名</label>
                                        <Input
                                            placeholder="Example: 山田 太郎"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">クラス</label>
                                        <Input
                                            placeholder="Example: Aクラス"
                                            value={formData.className}
                                            onChange={e => setFormData({ ...formData, className: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-end gap-2 md:col-span-3 justify-end">
                                        {isEditMode && (
                                            <Button type="button" variant="outline" onClick={handleCancelEdit}>
                                                キャンセル
                                            </Button>
                                        )}
                                        <Button type="submit" className={isEditMode ? "bg-orange-500 hover:bg-orange-600" : ""}>
                                            {isEditMode ? '修正を保存' : '登録'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="bulk">
                            <form onSubmit={handleBulkSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">学年</label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                            value={bulkData.grade}
                                            onChange={e => setBulkData({ ...bulkData, grade: e.target.value })}
                                        >
                                            <option value="1">1年</option>
                                            <option value="2">2年</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">開始出席番号 (連番)</label>
                                        <Input
                                            type="number"
                                            placeholder="Example: 101"
                                            value={bulkData.startNumber}
                                            onChange={e => setBulkData({ ...bulkData, startNumber: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">クラス</label>
                                        <Input
                                            placeholder="Example: Aクラス"
                                            value={bulkData.className}
                                            onChange={e => setBulkData({ ...bulkData, className: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">氏名リスト (改行区切り)</label>
                                    <Textarea
                                        placeholder="山田 太郎&#13;&#10;鈴木 次郎"
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
                    <div className="rounded-md border overflow-x-auto">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="bg-slate-100 text-slate-700">
                                <tr>
                                    <th className="p-3">学年</th>
                                    <th className="p-3">No.</th>
                                    <th className="p-3">氏名</th>
                                    <th className="p-3">クラス</th>
                                    <th className="p-3 text-right">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} className="border-t">
                                        <td className="p-3">
                                            <span className={student.grade === 2 ? "bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold" : "bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold"}>
                                                {student.grade || 1}年
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium">{student.studentNumber}</td>
                                        <td className="p-3">{student.name}</td>
                                        <td className="p-3">{student.className}</td>
                                        <td className="p-3 text-right flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(student)}
                                            >
                                                編集
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => {
                                                    if (confirm(`${student.name}さんを削除しますか？\n（出席データも削除されます）`)) {
                                                        deleteStudent(student.id);
                                                    }
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
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
