'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function SiteHeader() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-[var(--line)] bg-white px-6 py-4">
      <Logo />

      <nav className="flex items-center gap-4 text-sm font-medium text-[var(--ink-muted)]">
        {isLoading ? null : user ? (
          <>
            <Link href="/profile" className="text-[var(--navy-950)] hover:underline">
              ملفي
            </Link>
            {user.role === 'teacher' && (
              <Link href="/teacher" className="text-[var(--navy-950)] hover:underline">
                ملف المدرس
              </Link>
            )}
            {user.role === 'admin' && (
              <>
                <Link href="/admin/users" className="text-[var(--navy-950)] hover:underline">
                  المستخدمون
                </Link>
                <Link href="/admin/teachers" className="text-[var(--navy-950)] hover:underline">
                  المدرسون
                </Link>
                <Link href="/admin/applications" className="text-[var(--navy-950)] hover:underline">
                  طلبات المدرسين
                </Link>
              </>
            )}
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="rounded-full border border-[var(--line)] px-4 py-1.5 text-sm font-semibold text-[var(--ink)]"
            >
              خروج
            </button>
          </>
        ) : (
          <>
            <Link href="/become-teacher" className="hover:underline">
              انضم كمدرس
            </Link>
            <Link href="/login" className="text-[var(--navy-950)] hover:underline">
              دخول
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-[var(--gold-500)] px-4 py-1.5 text-sm font-bold text-[var(--navy-950)]"
            >
              حساب جديد
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
