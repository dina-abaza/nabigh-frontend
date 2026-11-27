'use client';

import { useAuth } from '@/context/AuthContext';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 18) return 'مساء الخير';
  return 'مساء الخير';
}

export function DashboardTopbar() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="flex items-center justify-between border-b border-[var(--line)] bg-white py-3 pr-16 pl-6 md:px-6">
      <p className="truncate text-sm text-[var(--ink-muted)]">
        {greeting()}، <span className="font-bold text-[var(--ink)]">{user.name}</span> 👋
      </p>
    </div>
  );
}
