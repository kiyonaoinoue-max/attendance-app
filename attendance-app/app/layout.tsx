import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { MainNav } from '@/components/main-nav';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '自動車整備専門学校 出席管理',
  description: '出席管理システム',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={cn(inter.className, "min-h-screen bg-slate-50")}>
        <div className="fixed inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="fixed inset-0 -z-20 bg-gradient-to-tr from-blue-100 via-white to-purple-100 opacity-60"></div>

        <div className="flex flex-col h-screen md:flex-row">
          <MainNav />
          <main className="flex-1 overflow-auto p-4 pb-20 md:pb-4 md:p-8">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
