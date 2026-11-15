'use client';

import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass } from '@/lib/ui';
import type { TeacherProfile } from '@/lib/types';

function TeacherProfileContent() {
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/teachers/me')
      .then((response) => {
        if (isMounted) setProfile(response.data.data);
      })
      .catch((apiError) => {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  }

  if (error || !profile) {
    return <p className="text-[var(--bad)]">{error ?? 'تعذر تحميل ملف المدرس'}</p>;
  }

  return (
    <dl className={`flex flex-col gap-3 ${cardClass}`}>
      <div className="flex justify-between">
        <dt className="text-[var(--ink-muted)]">الاسم</dt>
        <dd>{profile.user.name}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ink-muted)]">البريد الإلكتروني</dt>
        <dd>{profile.user.email}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ink-muted)]">نسبة العمولة</dt>
        <dd className="font-heading font-bold text-[var(--navy-950)]">
          {profile.commissionPercent}%
        </dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ink-muted)]">عدد الدول المسموحة</dt>
        <dd>{profile.allowedCountryIds.length}</dd>
      </div>
      <div className="flex justify-between">
        <dt className="text-[var(--ink-muted)]">عدد المواد المسموحة</dt>
        <dd>{profile.allowedSubjectIds.length}</dd>
      </div>
      <p className="text-xs text-[var(--ink-muted)]">
        تفاصيل الدول والمواد (الأسماء) ستظهر هنا بعد ربط صفحات الكتالوج في مرحلة لاحقة.
      </p>
    </dl>
  );
}

export default function TeacherPage() {
  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          ملف المدرس
        </h1>
        <TeacherProfileContent />
      </main>
    </RequireRole>
  );
}
