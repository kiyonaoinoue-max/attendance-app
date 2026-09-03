'use client';

import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { getAlertLevel, Student } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, AlertTriangle, Users, Globe, Briefcase, Clock, PlusIcon } from 'lucide-react';

export default function Dashboard() {
  const { students, settings } = useStore();

  const expiringStudents = students.filter((s) => {
    const level = getAlertLevel(s.residenceExpiry, settings.alertDaysBefore);
    return level === 'expired' || level === 'urgent' || level === 'warning';
  });

  const expiredCount = expiringStudents.filter(s => getAlertLevel(s.residenceExpiry, settings.alertDaysBefore) === 'expired').length;
  const urgentCount = expiringStudents.filter(s => getAlertLevel(s.residenceExpiry, settings.alertDaysBefore) === 'urgent').length;
  const warningCount = expiringStudents.filter(s => getAlertLevel(s.residenceExpiry, settings.alertDaysBefore) === 'warning').length;

  const totalStudents = students.length;

  const nationalities = students.reduce((acc, s) => {
    acc[s.nationality] = (acc[s.nationality] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topNationalities = Object.entries(nationalities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const workPermitYes = students.filter(s => s.workPermitStatus === 'yes').length;
  const workPermitNo = students.filter(s => s.workPermitStatus === 'no').length;
  const workPermitPending = students.filter(s => s.workPermitStatus === 'pending').length;

  const overworkStudents = students.filter(s => {
    const totalHours = s.partTimeJobs?.filter(job => job.isActive).reduce((sum, job) => sum + job.weeklyHours, 0) || 0;
    return totalHours > 28;
  }).length;

  return (
    <div className="container mx-auto p-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="mb-6 pt-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Student Visa Manager
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {settings.schoolName || '学校名未設定'}
          </p>
        </div>
        <Link href="/students/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5 shadow-sm">
            <PlusIcon className="w-4 h-4" />
            新規登録・入力
          </Button>
        </Link>
      </header>

      {/* Alert Cards Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-destructive" />
          在留期限アラート
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/students?filter=urgent_or_expired">
            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer h-full">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-destructive">期限切れ / 30日以内</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent className="px-4 pb-3 text-2xl font-bold text-destructive">
                {expiredCount + urgentCount} <span className="text-sm font-normal">名</span>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/students?filter=warning">
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer h-full">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-500">
                  {settings.alertDaysBefore || 60}日以内
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              </CardHeader>
              <CardContent className="px-4 pb-3 text-2xl font-bold text-amber-600 dark:text-amber-500">
                {warningCount} <span className="text-sm font-normal">名</span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/students">
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 cursor-pointer h-full">
              <CardHeader className="py-3 px-4 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-500">全学生一覧</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-500" />
              </CardHeader>
              <CardContent className="px-4 pb-3 text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                {totalStudents} <span className="text-sm font-normal">名</span>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      {/* Statistics Section */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 mt-8">
          <Users className="w-5 h-5 text-primary" />
          統計情報
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Total */}
          <Card className="shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 col-span-2 md:col-span-1 border-primary/10">
            <CardHeader className="py-3 px-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">総学生数</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold">{totalStudents} <span className="text-sm font-normal text-muted-foreground">名</span></div>
            </CardContent>
          </Card>

          {/* Nationalities */}
          <Card className="shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 col-span-2 md:col-span-1 border-primary/10">
            <CardHeader className="py-3 px-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">国籍（上位）</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-1">
                {topNationalities.length > 0 ? (
                  topNationalities.map(([country, count], i) => (
                    <div key={country} className="flex justify-between items-center text-sm">
                      <span className="truncate text-muted-foreground">{i + 1}. {country}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">データなし</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Work Permits */}
          <Card className="shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 col-span-2 md:col-span-1 border-primary/10">
            <CardHeader className="py-3 px-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">資格外活動許可</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground/50" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-1 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">許可あり</span><span className="font-semibold text-emerald-600 dark:text-emerald-500">{workPermitYes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">許可なし</span><span className="font-semibold">{workPermitNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">申請中</span><span className="font-semibold text-amber-600 dark:text-amber-500">{workPermitPending}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overwork Warning */}
          <Card className="shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 duration-200 col-span-2 md:col-span-1 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-100 dark:border-red-900/30">
            <CardHeader className="py-3 px-4 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-medium text-red-600 dark:text-red-400">28時間超過警告</CardTitle>
              <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{overworkStudents} <span className="text-sm font-normal">名</span></div>
              <p className="text-[10px] text-red-500/80 mt-1">週28時間以上勤務の可能性</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
