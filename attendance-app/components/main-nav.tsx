'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, BookOpen, CalendarCheck, FileSpreadsheet, Settings, Home } from 'lucide-react';

const navItems = [
    { href: '/', label: 'ホーム', icon: Home },
    { href: '/attendance', label: '出席入力', icon: CalendarCheck },
    { href: '/students', label: '学生管理', icon: Users },
    { href: '/subjects', label: '教科管理', icon: BookOpen },
    { href: '/report', label: '集計・出力', icon: FileSpreadsheet },
    { href: '/settings', label: '設定', icon: Settings },
];

export function MainNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:relative md:border-t-0 md:border-r md:w-64 md:h-screen md:flex-col md:p-4">
            <div className="flex justify-around md:flex-col md:space-y-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center p-2 text-xs md:flex-row md:text-sm md:p-3 md:rounded-lg",
                                isActive
                                    ? "text-blue-600 bg-blue-50"
                                    : "text-slate-600 hover:bg-slate-50"
                            )}
                        >
                            <Icon className="h-6 w-6 md:mr-3 md:h-5 md:w-5" />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
