'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth, type UserRole } from '@/context/AuthContext';

export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const allowedRoles = Array.isArray(role) ? role : [role];

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      </main>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-[var(--bad)]">هذه الصفحة غير متاحة لدورك الحالي.</p>
      </main>
    );
  }

  return <>{children}</>;
}
