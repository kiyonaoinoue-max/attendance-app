'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { CalendarCheck, Users, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useEffect, useState } from 'react';

export default function Home() {
  const { students, subjects, attendanceRecords } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayAttendance = attendanceRecords.filter(r => r.date === todayStr);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">
        出席管理ダッシュボード
        <span className="ml-4 text-sm font-normal text-slate-500">
          {format(new Date(), 'yyyy年MM月dd日 (EEE)', { locale: ja })}
        </span>
      </h1>

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
              <CardTitle className="text-sm font-medium">本日の入力件数</CardTitle>
              <CalendarCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayAttendance.length}件</div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4 text-slate-800">クイックアクション</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/attendance" className="block p-6 bg-blue-600 rounded-lg text-white text-center font-bold shadow hover:bg-blue-700 transition">
            今日の出席を入力する
          </Link>
          <Link href="/attendance" className="block p-6 bg-amber-500 rounded-lg text-white text-center font-bold shadow hover:bg-amber-600 transition">
            出席データの修正
          </Link>
          <Link href="/report" className="block p-6 bg-green-600 rounded-lg text-white text-center font-bold shadow hover:bg-green-700 transition">
            集計レポートを出力
          </Link>
        </div>
      </div>
    </div>
  );
}
