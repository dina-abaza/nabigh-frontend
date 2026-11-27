'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/Logo';

const ITEMS = [
  { href: '/', label: 'الرئيسية' },
  { href: '/my-courses', label: 'كورساتي' },
  { href: '/payments', label: 'مدفوعاتي' },
  { href: '/profile', label: 'ملفي الشخصي' },
];

function initials(name?: string) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

export function StudentSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 flex-none items-center justify-between border-b border-[var(--line)] bg-white px-4 md:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <LogoMark size={26} />
          <span className="truncate font-heading text-sm font-extrabold text-[var(--navy-950)]">نابغ</span>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          aria-label="فتح القائمة"
          className="flex h-9 w-9 flex-none items-center justify-center rounded-lg text-[var(--ink)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-none flex-col gap-1 overflow-y-auto border-e border-[var(--line)] bg-white p-4 transition-transform duration-200 md:static md:z-auto md:w-52 md:max-w-none md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-[var(--line)] pb-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--gold-100)] text-xs font-bold text-[#a9690f]">
              {initials(user?.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user?.name}</p>
              <p className="text-[11px] text-[var(--ink-muted)]">طالب</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق القائمة"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xl leading-none text-[var(--ink-muted)] md:hidden"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`truncate rounded-lg px-3 py-2 text-sm font-semibold ${
                  isActive ? 'bg-[var(--paper)] text-[var(--navy-950)]' : 'text-[var(--ink-muted)]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => {
            logout();
            router.push('/');
          }}
          className="mt-3 rounded-lg px-3 py-2 text-start text-sm font-semibold text-[var(--ink-muted)]"
        >
          خروج
        </button>
      </aside>
    </>
  );
}
