'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { LogoMark } from '@/components/Logo';

export interface SidebarItem {
  href: string;
  label: string;
}

export function DashboardSidebar({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setIsOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة"
        className="fixed top-3 right-3 z-30 flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-[var(--navy-950)] text-white shadow-md md:hidden"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 max-w-[80vw] flex-none flex-col gap-1 overflow-y-auto border-e border-[#1d2a5c] bg-[var(--navy-950)] p-4 transition-transform duration-200 md:static md:z-auto md:w-56 md:max-w-none md:translate-x-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2 px-1">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <LogoMark size={28} />
            <span className="truncate font-heading text-sm font-extrabold text-white">نابغ</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="إغلاق القائمة"
            className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-xl leading-none text-[#c7cdee] md:hidden"
          >
            ×
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`truncate rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-e-[3px] border-[var(--gold-500)] bg-[var(--navy-700)] text-white'
                    : 'text-[#c7cdee] hover:text-white'
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
          className="mt-3 rounded-lg px-3 py-2 text-start text-sm font-semibold text-[#c7cdee] hover:text-white"
        >
          خروج
        </button>
      </aside>
    </>
  );
}
