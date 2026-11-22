'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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

  return (
    <aside className="flex w-56 flex-none flex-col gap-1 border-e border-[#1d2a5c] bg-[var(--navy-950)] p-4">
      <div className="mb-4 flex items-center gap-2 px-1">
        <LogoMark size={28} />
        <span className="font-heading text-sm font-extrabold text-white">نابغ</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
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
        className="rounded-lg px-3 py-2 text-start text-sm font-semibold text-[#c7cdee] hover:text-white"
      >
        خروج
      </button>
    </aside>
  );
}
