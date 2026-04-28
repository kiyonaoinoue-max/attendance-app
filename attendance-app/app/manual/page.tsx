'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ManualPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">📖 操作マニュアル</h1>
            <p className="text-sm text-slate-500">アプリの使い方と便利な機能をまとめています</p>

            {/* 出席入力 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📋 出席入力</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm text-slate-600">
                        <p className="font-medium text-slate-700">基本操作</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>日付と時限を選択して、学生カードの横にあるボタン（出席・欠席・遅刻・早退）を押します</li>
                            <li>ボタンを押すと自動的に次の学生に移動します</li>
                            <li>「未入力に戻す」ボタンで記録を取り消せます</li>
                            <li>「取消」ボタンで直前の操作をやり直せます</li>
                        </ul>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm text-slate-600">
                        <p className="font-medium text-slate-700">学生カードの見方</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>各学生の下に5つのバー（HR・1〜4限）が表示されます</li>
                            <li><span className="inline-block w-3 h-3 bg-green-400 rounded mr-1"></span>緑 = 出席、<span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>赤 = 欠席、<span className="inline-block w-3 h-3 bg-yellow-400 rounded mr-1"></span>黄 = 遅刻、<span className="inline-block w-3 h-3 bg-orange-400 rounded mr-1"></span>橙 = 早退</li>
                            <li>バーをタップすると、その時限に直接切り替わります</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* 臨時差し替え */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">⚡ 臨時時間割差し替え</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 space-y-2 text-sm">
                        <p className="font-medium text-amber-800">急な授業変更があった場合の対処方法</p>
                        <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                            <li>出席入力ページで、変更したい時限ボタン（1限〜4限）を <strong>長押し（約0.6秒）</strong></li>
                            <li>差し替えダイアログが開くので、変更先の教科を選択</li>
                            <li>ボタンが琥珀色に変わり、教科名の前に⚡マークが付きます</li>
                            <li>差し替えは集計レポートと月間出席一覧にも自動反映されます</li>
                        </ol>
                        <p className="text-xs text-amber-600 mt-2">
                            ※ 元に戻す場合は、再度長押しして「差し替えを解除」を押してください<br />
                            ※ HRは差し替え対象外です
                        </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 space-y-2 text-sm">
                        <p className="font-medium text-green-800">💡 便利な使い方</p>
                        <p className="text-green-700">
                            あらかじめ教科管理で<strong>「LHR（ロングホームルーム）」や「特別活動」など必須時間0の教科</strong>を登録しておくと、
                            急な時間割変更にも柔軟に対応できます。
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-green-700">
                            <li>例：1限が急遽LHRに変更 → 長押しで「LHR」に差し替え</li>
                            <li>出席記録は残しつつ、必須時間0なので教科別の必須時間集計に影響しません</li>
                            <li>自習、学校行事、避難訓練なども同様に対応可能です</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* 月間出席一覧 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">📊 月間出席一覧・集計</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm text-slate-600">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>月間出席一覧は紙の出席簿と同じ形式です</li>
                            <li>右端の「ー」「＋」ボタンで縮小・拡大して広範囲を確認できます</li>
                            <li>グレーアウトされたコマは時間割に教科が未設定のため、集計対象外です</li>
                            <li>右端の青い列に出席率のサマリーが表示されます（集計レポートと同じ計算ロジック）</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* カレンダー・休講設定 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">🗓️ カレンダー・休講設定</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm text-slate-600">
                        <ul className="list-disc pl-5 space-y-1">
                            <li>カレンダーの日付をタップすると休日/通常日を切り替えられます</li>
                            <li>休講に設定した日は、出席記録は残りますが<strong>集計の分母からは除外</strong>されます</li>
                            <li>オリエンテーション等の特殊な日は「休講」に設定すると、出席記録を残しつつ通常授業の集計から外せます</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* 年度変更 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">🔄 年度が変わったら</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 space-y-2 text-sm">
                        <p className="font-medium text-blue-800">新年度への切り替え手順</p>
                        <ol className="list-decimal pl-5 space-y-1 text-slate-600">
                            <li>設定ページの「学期設定」で前期・後期の日付を新年度の日程に更新</li>
                            <li>「カレンダーを再生成・初期化」ボタンで新しいカレンダーを作成</li>
                            <li>必要に応じて祝日や休講日を手動で設定</li>
                            <li>教科管理ページで時間割に変更があれば更新</li>
                        </ol>
                        <p className="text-xs text-blue-600 mt-2">
                            ※ 過去の出席記録は日付ベースで保存されているため、設定を更新しても消えません<br />
                            ※ 集計レポートは選択した月・期間に応じて自動的に正しい期間で計算されます
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* データ同期 */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">☁️ データの同期・バックアップ</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-2 text-sm text-slate-600">
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>かんたんクラウド同期</strong>：「合言葉を発行」→ 6桁のコードを別端末で入力するだけ（5分間有効）</li>
                            <li><strong>オフラインバックアップ</strong>：エクスポートコードをコピーして暗号化されたテキストで保存できます</li>
                            <li>定期的にバックアップを取ることをおすすめします</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
