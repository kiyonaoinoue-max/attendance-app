'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { CalendarCheck, Users, BookOpen, CalendarDays, BarChart3, Settings, Clock } from 'lucide-react';
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
  const attendingStudentIds = new Set(
    attendanceRecords
      .filter(r => r.date === todayStr && ['present', 'late', 'early_leave'].includes(r.status))
      .map(r => r.studentId)
  );

  return (
    <div className="space-y-8">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl" />
        <div className="relative bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/50 shadow-lg">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            出席管理ダッシュボード
          </h1>
          <p className="text-slate-500 mt-1">
            {format(new Date(), 'yyyy年MM月dd日 (EEEE)', { locale: ja })}
          </p>
        </div>
      </div>

      {/* Prominent Attendance Input Button - Enhanced */}
      <Link
        href="/attendance"
        className="block w-full p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.15),transparent_40%)]" />
        <div className="relative z-10 flex items-center justify-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">今日の出席を入力する</span>
        </div>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </Link>

      {/* Sync Status Display */}
      {remainingTime && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 text-amber-800 px-6 py-4 rounded-xl flex items-center justify-between shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <span className="font-bold">クラウド同期待機中</span>
              <span className="text-sm ml-2 text-amber-600">別の端末で合言葉を入力してください</span>
            </div>
          </div>
          <div className="font-mono font-bold text-2xl text-amber-700">
            {remainingTime}
          </div>
        </div>
      )}

      {/* Stats Cards - Enhanced floating effect */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/students" className="group">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-bl-[60px]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">登録学生数</CardTitle>
                <div className="p-2 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-cyan-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{students.length}<span className="text-lg text-slate-500 ml-1">名</span></div>
              </CardContent>
            </Card>
          </div>
        </Link>

        <Link href="/subjects" className="group">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-teal-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-bl-[60px]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">登録教科数</CardTitle>
                <div className="p-2 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
                  <BookOpen className="h-5 w-5 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{subjects.length}<span className="text-lg text-slate-500 ml-1">科目</span></div>
              </CardContent>
            </Card>
          </div>
        </Link>

        <Link href="/attendance" className="group">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/30 to-purple-500/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Card className="relative bg-white/90 backdrop-blur-sm border-0 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 rounded-xl overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-bl-[60px]" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">本日の出席人数</CardTitle>
                <div className="p-2 bg-gradient-to-br from-violet-100 to-purple-100 rounded-lg">
                  <CalendarCheck className="h-5 w-5 text-violet-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-800">{attendingStudentIds.size}<span className="text-lg text-slate-500 ml-1">名</span></div>
              </CardContent>
            </Card>
          </div>
        </Link>
      </div>

      {/* Quick Actions - Enhanced */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-700 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
          クイックアクション
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/attendance-list"
            className="group relative block p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200/50 rounded-xl text-purple-700 font-bold transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/50 to-transparent rounded-bl-[40px] group-hover:scale-125 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              <CalendarDays className="w-6 h-6" />
              <span>出席一覧 (月間)</span>
            </div>
          </Link>

          <Link
            href="/attendance"
            className="group relative block p-6 bg-gradient-to-br from-slate-50 to-gray-100 border border-slate-200/50 rounded-xl text-slate-600 font-bold transition-all duration-300 hover:shadow-xl hover:shadow-slate-500/20 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-slate-200/50 to-transparent rounded-bl-[40px] group-hover:scale-125 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="text-xl">📅</span>
              <span>過去の出席を修正</span>
            </div>
          </Link>

          <Link
            href="/report"
            className="group relative block p-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl text-white font-bold shadow-lg shadow-green-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/40 hover:-translate-y-1 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-bl-[40px] group-hover:scale-125 transition-transform duration-300" />
            <div className="relative flex items-center justify-center gap-3">
              <BarChart3 className="w-6 h-6" />
              <span>集計レポートを出力</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Settings Link - Enhanced */}
      <div className="mt-12 flex justify-center pb-4">
        <Link
          href="/settings"
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-all duration-300 hover:shadow-lg"
        >
          <Settings className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
          <span className="text-sm">データバックアップ・同期</span>
        </Link>
      </div>

      {/* Copyright */}
      <div className="flex justify-center pb-8">
        <small className="text-gray-400">© 2026 Craftman Works</small>
      </div>
    </div>
  );
}
