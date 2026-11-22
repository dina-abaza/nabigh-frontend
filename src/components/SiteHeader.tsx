'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Logo } from '@/components/Logo';

export function SiteHeader() {
  const { user, isLoading } = useAuth();

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] bg-white px-6 py-4">
      <Logo />

      <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-[var(--ink-muted)]">
        <Link href="/courses" className="hover:underline">
          الكورسات
        </Link>

        {isLoading ? null : user ? (
          <Link
            href="/profile"
            className="rounded-full bg-[var(--navy-950)] px-4 py-1.5 text-sm font-bold text-white"
          >
            حسابي
          </Link>
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
