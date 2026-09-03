'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { v4 as uuidv4 } from 'uuid';
import { Student } from '@/types';

export default function SettingsPage() {
  const { settings, updateSettings, students, importStudents } = useStore();
  
  const [schoolName, setSchoolName] = useState(settings.schoolName);
  const [schoolAddress, setSchoolAddress] = useState(settings.schoolAddress);
  const [alertDaysBefore, setAlertDaysBefore] = useState(settings.alertDaysBefore);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);

  const handleSaveSettings = () => {
    updateSettings({
      schoolName,
      schoolAddress,
      alertDaysBefore: Number(alertDaysBefore) || 60,
    });
    alert('設定を保存しました。');
  };

  const [pasteCode, setPasteCode] = useState('');

  // アテンダンスプロの各種出力形式（JSONファイル、Base64エクスポート文字列、オブジェクト形式）をパースする汎用関数
  const parseAndImportAttendanceProData = (text: string) => {
    try {
      let json: any;
      const trimmed = text.trim();
      try {
        json = JSON.parse(trimmed);
      } catch {
        // Base64エンコード文字列の場合のデコード処理
        const decoded = decodeURIComponent(escape(atob(trimmed)));
        json = JSON.parse(decoded);
      }

      const rawStudents = Array.isArray(json) ? json : json.students;
      if (!Array.isArray(rawStudents)) {
        alert('学生データが見つかりませんでした。アテンダンスプロのバックアップ・エクスポートデータか確認してください。');
        return;
      }

      const newStudents: Student[] = rawStudents.map((item: any) => ({
        id: uuidv4(),
        name: item.name || '',
        nameKana: item.nameKana || '',
        nameRomaji: item.nameRomaji || '',
        studentNumber: item.studentNumber || '',
        grade: Number(item.grade) || 1,
        className: item.className || '',
        residenceCardNumber: '',
        residenceStatus: '留学',
        residenceExpiry: '',
        renewalHistory: [],
        nationality: item.nationality || '',
        homeCountryEducation: '',
        japaneseSchoolName: '',
        enrollmentDate: '',
        partTimeJobs: [],
        workPermitStatus: 'pending',
        workPermitExpiry: '',
        notes: '',
      }));

      const existingNumbers = new Set(students.map((s) => s.studentNumber));
      const toImport = newStudents.filter((s) => s.studentNumber && !existingNumbers.has(s.studentNumber));
      const skipped = newStudents.length - toImport.length;

      importStudents(toImport);
      setImportResult({ imported: toImport.length, skipped });
      setPasteCode('');
    } catch (error) {
      alert('データの読み込みに失敗しました。正しいエクスポートコードまたはJSONデータか確認してください。');
    }
  };

  const handleImportAttendanceProFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        parseAndImportAttendanceProData(event.target.result as string);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleBackup = () => {
    const backupData = {
      students,
      settings,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `student_visa_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.students && json.settings) {
          useStore.setState({
            students: json.students,
            settings: json.settings,
          });
          alert('データを復元しました。');
          window.location.reload();
        } else {
          alert('不正なバックアップファイルです。');
        }
      } catch (error) {
        alert('ファイルの読み込みに失敗しました。');
      }
    };
    reader.readAsText(file);
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  const handleClearData = () => {
    useStore.setState({
      students: [],
      settings: { schoolName: '', schoolAddress: '', alertDaysBefore: 60 },
    });
    alert('全データを削除しました。');
    window.location.reload();
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold mb-6">設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>学校情報</CardTitle>
          <CardDescription>学校の基本情報を設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">学校名</Label>
            <Input
              id="schoolName"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="〇〇日本語学校"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schoolAddress">学校住所</Label>
            <Input
              id="schoolAddress"
              value={schoolAddress}
              onChange={(e) => setSchoolAddress(e.target.value)}
              placeholder="東京都..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>アラート設定</CardTitle>
          <CardDescription>在留期限の警告表示タイミングを設定します</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alertDaysBefore">在留期限の何日前から警告を表示するか</Label>
            <Input
              id="alertDaysBefore"
              type="number"
              min={1}
              value={alertDaysBefore}
              onChange={(e) => setAlertDaysBefore(Number(e.target.value))}
            />
          </div>
          <Button onClick={handleSaveSettings}>設定を保存</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>データ管理</CardTitle>
          <CardDescription>データのインポート・エクスポート、削除を行います</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-bold">Attendance Proからインポート</Label>
            <p className="text-sm text-muted-foreground">
              アテンダンスプロの設定画面で「データをエクスポート（コピー）」を押してコピーしたコードを貼り付けるか、JSONファイルを選択して取り込めます。
            </p>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-600">方法1：コピーしたコードを貼り付けて取り込む</Label>
              <div className="flex gap-2">
                <Textarea
                  placeholder="アテンダンスプロでコピーしたエクスポートコードをここに貼り付け"
                  value={pasteCode}
                  onChange={(e) => setPasteCode(e.target.value)}
                  className="font-mono text-xs min-h-[70px]"
                />
              </div>
              <Button
                onClick={() => {
                  if (!pasteCode.trim()) return alert('コードを入力してください');
                  parseAndImportAttendanceProData(pasteCode);
                }}
                disabled={!pasteCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                コードから読み込む
              </Button>
            </div>

            <div className="pt-2 space-y-2">
              <Label className="text-xs font-semibold text-slate-600">方法2：ファイルを選択して取り込む</Label>
              <div className="flex items-center gap-4">
                <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="sm">
                  📁 JSON / バックアップファイルを選択
                </Button>
                <input
                  type="file"
                  accept=".json,.txt"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImportAttendanceProFile}
                />
              </div>
            </div>

            {importResult && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium animate-in fade-in">
                ✅ インポート完了: {importResult.imported}件追加（重複 {importResult.skipped}件をスキップ）
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>バックアップと復元</Label>
            <div className="flex gap-4">
              <Button onClick={handleBackup} variant="secondary">
                バックアップをダウンロード
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">復元 (リストア)</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>データを復元しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      現在のデータは上書きされます。この操作は取り消せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={() => restoreInputRef.current?.click()}>
                      ファイルを選択して復元
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <input
                type="file"
                accept=".json"
                className="hidden"
                ref={restoreInputRef}
                onChange={handleRestore}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-red-600">危険な操作</Label>
            <div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">データ全削除</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>本当に全てのデータを削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この操作は取り消せません。設定とすべての学生データが完全に消去されます。
                      事前にバックアップを取ることをお勧めします。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData} className="bg-red-600 hover:bg-red-700">
                      はい、全て削除します
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
