'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { CalendarCheck, Users, BookOpen, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function Home() {
  const { students, subjects, attendanceRecords, syncCode, syncExpiresAt } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const [remainingTime, setRemainingTime] = useState<string>("");

  useEffect(() => {
    if (!syncExpiresAt) {
      setRemainingTime("");
      return;
    }
    const timer = setInterval(() => {
      const diff = Math.floor((syncExpiresAt - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingTime("");
      } else {
        const m = Math.floor(diff / 60);
        const s = diff % 60;
        setRemainingTime(`${m}:${s.toString().padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [syncExpiresAt]);

  if (!mounted) return null;

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Calculate unique students who attended (present, late, early_leave) today
  // Filter out absent records
  const attendingStudentIds = new Set(
    attendanceRecords
      .filter(r => r.date === todayStr && ['present', 'late', 'early_leave'].includes(r.status))
      .map(r => r.studentId)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        出席管理ダッシュボード
        <span className="ml-4 text-sm font-normal text-slate-500">
          {format(new Date(), 'yyyy年MM月dd日 (EEE)', { locale: ja })}
        </span>
      </h1>

      {/* Prominent Attendance Input Button */}
      <Link href="/attendance" className="block w-full p-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all group relative overflow-hidden">
        <div className="relative z-10 flex items-center justify-center gap-3">
          <CalendarCheck className="w-8 h-8 text-white" />
          <span className="text-2xl font-bold text-white tracking-wide">今日の出席を入力する</span>
        </div>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>

      {/* Sync Status Display */}
      {remainingTime && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <span className="font-bold">⚠️ クラウド同期待機中（合言葉発行済み）</span>
            <span className="text-sm">別の端末で合言葉を入力してください</span>
          </div>
          <div className="font-mono font-bold text-xl">
            残り {remainingTime}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/students">
          <Card className="hover:bg-slate-50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録学生数</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}名</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/subjects">
          <Card className="hover:bg-slate-50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">登録教科数</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}科目</div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/attendance">
          <Card className="hover:bg-slate-50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">本日の出席人数</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendingStudentIds.size}名</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/attendance-list" className="block p-6 bg-purple-100 border-2 border-purple-200 rounded-lg text-purple-700 text-center font-bold hover:bg-white hover:border-purple-300 transition flex items-center justify-center gap-2">
            <CalendarDays className="w-5 h-5" />
            <span>出席一覧 (月間)</span>
          </Link>
          <Link href="/attendance" className="block p-6 bg-slate-100 border-2 border-slate-200 rounded-lg text-slate-600 text-center font-bold hover:bg-white hover:border-slate-300 transition flex items-center justify-center gap-2">
            <span>📅</span> 過去の出席を修正
          </Link>
          <Link href="/report" className="block p-6 bg-green-600 rounded-lg text-white text-center font-bold shadow hover:bg-green-700 transition flex items-center justify-center gap-2">
            <span>📊</span> 集計レポートを出力
          </Link>
        </div>
      </div>

      <div className="mt-12 flex justify-center pb-8">
        <Link href="/settings" className="text-sm text-slate-400 hover:text-slate-600 underline decoration-dotted transition-colors flex items-center gap-1">
          <span>☁️</span> データバックアップ・同期
        </Link>
      </div>
    </div>
  );
}
