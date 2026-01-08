'use client';
import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CloudUpload, CloudDownload, Copy, CheckCircle2 } from 'lucide-react';
import { CalendarDay } from '@/types';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SettingsPage() {
    const { settings, calendar, updateSettings, generateCalendar, toggleHoliday, exportData, importData } = useStore();
    const [mounted, setMounted] = useState(false);
    const [viewDate, setViewDate] = useState(new Date());
    const [syncCode, setSyncCode] = useState('');
    const [cloudCode, setCloudCode] = useState<string | null>(null);
    const [cloudExpiresAt, setCloudExpiresAt] = useState<number | null>(null);
    const [importCloudCode, setImportCloudCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const handleGenerate = () => {
        if (confirm('カレンダーを再生成しますか？既存の設定（手動設定した休日など）は上書きされます。')) {
            generateCalendar(settings.termStartDate, settings.termEndDate);
        }
    };

    const handleMonthChange = (offset: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + offset);
        setViewDate(newDate);
    };

    const currentMonthDays = calendar.filter(d => isSameMonth(parseISO(d.date), viewDate));

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">設定</h1>

            <Card>
                <CardHeader>
                    <CardTitle>学期設定・カレンダー生成</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-700">前期</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">開始日</label>
                                <Input
                                    type="date"
                                    value={settings.firstTerm?.start || ''}
                                    onChange={e => updateSettings({
                                        firstTerm: { ...settings.firstTerm, start: e.target.value },
                                        termStartDate: e.target.value // Sync default
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">終了日</label>
                                <Input
                                    type="date"
                                    value={settings.firstTerm?.end || ''}
                                    onChange={e => updateSettings({
                                        firstTerm: { ...settings.firstTerm, end: e.target.value }
                                    })}
                                />
                            </div>
                        </div>

                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <h3 className="font-bold text-sm text-slate-700">後期</h3>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">開始日</label>
                                <Input
                                    type="date"
                                    value={settings.secondTerm?.start || ''}
                                    onChange={e => updateSettings({
                                        secondTerm: { ...settings.secondTerm, start: e.target.value }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">終了日</label>
                                <Input
                                    type="date"
                                    value={settings.secondTerm?.end || ''}
                                    onChange={e => updateSettings({
                                        secondTerm: { ...settings.secondTerm, end: e.target.value },
                                        termEndDate: e.target.value // Sync default
                                    })}
                                />
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleGenerate} variant="outline" className="w-full md:w-auto">
                        カレンダーを再生成・初期化
                    </Button>
                    <p className="text-xs text-muted-foreground">
                        ※ 土日を休日として自動判定します。
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>カレンダー確認・休日設定</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleMonthChange(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="font-medium">
                            {format(viewDate, 'yyyy年 M月', { locale: ja })}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleMonthChange(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {calendar.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            カレンダーが生成されていません。上のボタンから生成してください。
                        </div>
                    ) : (
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
                                <div key={d} className={`py-2 font-bold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}`}>
                                    {d}
                                </div>
                            ))}

                            {/* Padding for start of month (simplified, assuming date-fns helps but let's just list days) */}
                            {/* To simplify rendering without complex grid logic, I'll just list the days found in this month */}
                            {/* Note: This simple view might not align correctly with day of week column headers if not carefully done. */}
                            {/* Better approach: iterate days of month and place in grid using getDay() */}

                            {(() => {
                                const days = currentMonthDays;
                                if (days.length === 0) return <div className="col-span-7 py-4">この月の日付はありません</div>;

                                const firstDay = parseISO(days[0].date);
                                const startPad = firstDay.getDay(); // 0 (Sun) to 6 (Sat)

                                const cells = [];
                                for (let i = 0; i < startPad; i++) {
                                    cells.push(<div key={`pad-${i}`} className="p-2"></div>);
                                }

                                days.forEach(day => {
                                    const dateObj = parseISO(day.date);
                                    const isHoliday = day.isHoliday;
                                    cells.push(
                                        <button
                                            key={day.date}
                                            onClick={() => toggleHoliday(day.date)}
                                            className={`
                        p-2 rounded hover:bg-slate-100 flex flex-col items-center justify-center min-h-[40px]
                        ${isHoliday ? 'bg-red-50 text-red-600' : ''}
                        ${format(new Date(), 'yyyy-MM-dd') === day.date ? 'ring-2 ring-blue-500' : ''}
                      `}
                                        >
                                            <span>{dateObj.getDate()}</span>
                                            {isHoliday && <span className="text-[10px]">休</span>}
                                        </button>
                                    );
                                });

                                return cells;
                            })()}
                        </div>
                    )}
                </CardContent>
            </Card>



            <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CloudUpload className="h-5 w-5 text-blue-600" />
                        かんたんクラウド同期（推奨）
                    </CardTitle>
                    <CardDescription>
                        一時発行される「合言葉」を使って、手軽にデータを他の端末に移動できます。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Export Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700">データを送る（発行）</h3>
                        <div className="flex items-start gap-4">
                            <Button
                                onClick={async () => {
                                    setIsLoading(true);
                                    try {
                                        const data = exportData();
                                        const res = await fetch('/api/sync/store', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ data }) // data is already base64 string
                                        });
                                        const json = await res.json();
                                        if (res.ok) {
                                            setCloudCode(json.code);
                                            setCloudExpiresAt(Date.now() + (json.expiresIn * 1000));
                                        } else {
                                            alert('エラーが発生しました: ' + (json.error || 'Unknown error'));
                                        }
                                    } catch (e) {
                                        alert('通信エラーが発生しました');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                                {isLoading ? '発行中...' : '合言葉を発行'}
                            </Button>

                            {cloudCode && (
                                <div className="flex-1 bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm animate-in fade-in zoom-in">
                                    <div className="text-xs text-slate-500 mb-1">この合言葉を別の端末で入力してください</div>
                                    <div className="text-3xl font-extrabold tracking-widest text-slate-900 mb-2 select-all">
                                        {cloudCode}
                                    </div>
                                    <div className="text-xs text-red-500 font-bold">
                                        有効期限: 1時間
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-px bg-slate-200" />

                    {/* Import Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700">データを受け取る（入力）</h3>
                        <div className="flex gap-2 max-w-sm">
                            <Input
                                placeholder="6桁の合言葉を入力"
                                value={importCloudCode}
                                onChange={(e) => setImportCloudCode(e.target.value)}
                                className="font-mono text-lg tracking-widest text-center"
                                maxLength={6}
                            />
                            <Button
                                onClick={async () => {
                                    if (importCloudCode.length !== 6) return alert('6桁のコードを入力してください');
                                    setIsLoading(true);
                                    try {
                                        const res = await fetch(`/api/sync/retrieve?code=${importCloudCode}`);
                                        const json = await res.json();
                                        if (res.ok && json.data) {
                                            if (confirm('現在のデータが上書きされます。よろしいですか？')) {
                                                if (importData(json.data)) {
                                                    alert('同期が完了しました！');
                                                    setImportCloudCode('');
                                                    window.location.reload();
                                                } else {
                                                    alert('データの読み込みに失敗しました。');
                                                }
                                            }
                                        } else {
                                            alert('エラー: ' + (json.error || 'データの取得に失敗しました'));
                                        }
                                    } catch (e) {
                                        alert('通信エラーが発生しました');
                                    } finally {
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading}
                                variant="secondary"
                            >
                                受取
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="opacity-80">
                <CardHeader>
                    <CardTitle className="text-base text-slate-600">オフライン転送（旧方式）</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        このコードを使って、他のブラウザや端末にデータを引き継ぐことができます。<br />
                        ※ インポートすると、現在のデータは全て上書きされますのでご注意ください。
                    </p>
                    <div className="space-y-2">
                        <Textarea
                            placeholder="ここに同期コードが表示されます / 入力してください"
                            value={syncCode}
                            onChange={(e) => setSyncCode(e.target.value)}
                            className="font-mono text-xs min-h-[100px]"
                        />
                    </div>
                    <div className="flex gap-4">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const code = exportData();
                                setSyncCode(code);
                                navigator.clipboard.writeText(code).then(() => alert('コードをコピーしました'));
                            }}
                        >
                            データをエクスポート（コピー）
                        </Button>
                        <Button
                            variant="secondary"
                            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-200"
                            onClick={() => {
                                if (!syncCode) return alert('コードを入力してください');
                                if (confirm('現在のデータが全て上書きされます。よろしいですか？')) {
                                    if (importData(syncCode)) {
                                        alert('インポートが完了しました。ページを再読み込みします。');
                                        window.location.reload();
                                    } else {
                                        alert('インポートに失敗しました。コードが正しいか確認してください。');
                                    }
                                }
                            }}
                        >
                            データをインポート（上書き）
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
