import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Download, Zap, Users, GraduationCap, Cloud, FileSpreadsheet, Lock, ExternalLink, ArrowRight, Menu } from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Navigation */}
            <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="bg-indigo-600 p-2 rounded-lg">
                            <Check className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                            Daily Attendance Pro
                        </span>
                    </div>
                    <div className="hidden md:flex items-center space-x-6">
                        <Link href="#features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">機能</Link>
                        <Link href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">料金</Link>
                        <Link href="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">ダッシュボード</Link>
                    </div>
                    <Button asChild className="bg-slate-900 text-white hover:bg-slate-800">
                        <Link href="/">今すぐ始める</Link>
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 overflow-hidden relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                    <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium mb-8 animate-fade-in-up">
                        <Zap className="w-4 h-4 mr-2" />
                        先生のための新しい出席管理ツール
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight tracking-tight">
                        出席管理を、<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                            もっとシンプルに。
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        複雑な機能はいりません。毎日の出席確認を、かつてないほどスムーズに。<br className="hidden md:block" />
                        タブレット一台で、クラス全員の出席状況を一目で把握できます。
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button asChild size="lg" className="h-12 px-8 text-lg bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
                            <Link href="/">
                                無料で使い始める <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="h-12 px-8 text-lg border-2">
                            <Link href="#pricing">
                                プランを見る
                            </Link>
                        </Button>
                    </div>

                    {/* App Preview Mockup */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="relative rounded-2xl bg-slate-900 p-2 shadow-2xl ring-1 ring-slate-900/10">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-20"></div>
                            <div className="relative rounded-xl bg-slate-50 overflow-hidden border border-slate-200 aspect-[16/10] flex items-center justify-center">
                                {/* Placeholder for App Screenshot */}
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600">
                                        <Check className="w-10 h-10" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Coming Soon: App Screenshot</p>
                                    <p className="text-xs text-slate-400 mt-2">実際のダッシュボード画面が表示されます</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white relative">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">選ばれる理由</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            現場の先生の声から生まれた、本当に必要な機能だけを搭載しました。
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            {
                                icon: <GraduationCap className="h-6 w-6" />,
                                title: "2年制カリキュラム",
                                description: "1年次・2年次の進級に合わせて、教科や学生データをスムーズに引き継げます。",
                                color: "bg-blue-100 text-blue-600"
                            },
                            {
                                icon: <Cloud className="h-6 w-6" />,
                                title: "かんたんクラウド同期",
                                description: "「合言葉」を入れるだけで、iPadとiPhone、PC間でのデータ移行が一瞬で完了。",
                                color: "bg-indigo-100 text-indigo-600"
                            },
                            {
                                icon: <FileSpreadsheet className="h-6 w-6" />,
                                title: "Excelレポート出力",
                                description: "月次の出席率や公欠日数を自動集計し、Excel形式でダウンロード可能。",
                                color: "bg-green-100 text-green-600"
                            },
                            {
                                icon: <Zap className="h-6 w-6" />,
                                title: "オフライン対応",
                                description: "ネット環境が悪い教室でも大丈夫。データは端末に保存され、いつでも閲覧できます。",
                                color: "bg-amber-100 text-amber-600"
                            }
                        ].map((feature, i) => (
                            <Card key={i} className="border-0 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                <CardHeader>
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                                        {feature.icon}
                                    </div>
                                    <CardTitle className="text-xl font-bold text-slate-900">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">シンプルな料金プラン</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            まずは無料で試してみませんか？ 必要な機能に合わせていつでもアップグレードできます。
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <Card className="border border-slate-200 shadow-xl bg-white/80 backdrop-blur-sm relative">
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-bold text-slate-900">Free</CardTitle>
                                <CardDescription>個人利用・お試しに最適</CardDescription>
                                <div className="mt-6 mb-2">
                                    <span className="text-5xl font-bold text-slate-900">¥0</span>
                                    <span className="text-slate-500">/年</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4 pt-6">
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        学生登録数 5名まで
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        基本的な出席管理機能
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        Excelレポート出力
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        クラウド同期機能
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full h-12 text-lg bg-slate-900 hover:bg-slate-800" variant="default">
                                    <Link href="/">無料で始める</Link>
                                </Button>
                            </CardFooter>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="border-2 border-indigo-600 shadow-2xl bg-white relative transform md:-translate-y-4">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                おすすめ
                            </div>
                            <CardHeader className="text-center pb-2">
                                <CardTitle className="text-2xl font-bold text-slate-900">Pro</CardTitle>
                                <CardDescription>クラス全体の管理に</CardDescription>
                                <div className="mt-6 mb-2">
                                    <span className="text-5xl font-bold text-slate-900">¥1,200</span>
                                    <span className="text-slate-500">/年</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-4 pt-6">
                                    <li className="flex items-center font-bold text-slate-900">
                                        <Check className="h-5 w-5 text-green-500 mr-2 stroke-[3px]" />
                                        学生登録数 無制限
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        全ての機能を利用可能
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        優先サポート
                                    </li>
                                    <li className="flex items-center text-slate-600">
                                        <Check className="h-5 w-5 text-indigo-600 mr-2" />
                                        今後の新機能をいち早く体験
                                    </li>
                                </ul>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                <Button asChild className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-200">
                                    <Link href="https://example.com/base-shop" target="_blank" rel="noopener noreferrer">
                                        <Lock className="w-4 h-4 mr-2" />
                                        ライセンスを購入する
                                    </Link>
                                </Button>
                                <p className="text-xs text-center text-slate-400">
                                    外部サイト(BASE)へ移動します
                                </p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="container mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-8">
                        毎日の業務を、もっと快適に。
                    </h2>
                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
                        ダウンロード不要。ブラウザですぐに始められます。<br />
                        まずは無料版で、その便利さを体験してください。
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="h-14 px-8 text-xl bg-white text-slate-900 hover:bg-slate-100 hover:scale-105 transition-all">
                            <Link href="/">
                                無料で使い始める
                            </Link>
                        </Button>
                    </div>
                    <div className="mt-12 pt-8 border-t border-slate-800 text-slate-500 text-sm">
                        Powered by Craftman Works
                    </div>
                </div>
            </section>
        </div>
    );
}
