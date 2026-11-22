'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ITEMS = [
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

  return (
    <aside className="flex w-52 flex-none flex-col gap-1 border-e border-[var(--line)] bg-white p-4">
      <div className="mb-3 flex items-center gap-2 border-b border-[var(--line)] pb-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[var(--gold-100)] text-xs font-bold text-[#a9690f]">
          {initials(user?.name)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{user?.name}</p>
          <p className="text-[11px] text-[var(--ink-muted)]">طالب</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
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
  );
}
