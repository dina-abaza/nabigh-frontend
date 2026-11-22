'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass } from '@/lib/ui';
import type { Subscription, SubscriptionStatus } from '@/lib/types';

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'نشط',
  cancelled: 'ملغى',
  pending_payment: 'بانتظار الدفع',
};

function courseTitle(subscription: Subscription): string {
  return typeof subscription.courseId === 'string' ? subscription.courseId : subscription.courseId.title;
}

function courseId(subscription: Subscription): string {
  return typeof subscription.courseId === 'string' ? subscription.courseId : subscription.courseId._id;
}

function MyCoursesContent() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/subscriptions/mine', { params: { limit: 100 } })
      .then((response) => {
        if (isMounted) setSubscriptions(response.data.data.subscriptions);
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

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  if (subscriptions.length === 0) {
    return (
      <div className={cardClass}>
        <p className="text-[var(--ink-muted)]">
          مفيش كورسات مشترك فيها لسه. تصفحي{' '}
          <Link href="/courses" className="font-semibold text-[var(--navy-950)] underline">
            الكورسات المتاحة
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {subscriptions.map((subscription) => (
        <div key={subscription._id} className={`${cardClass} flex items-center justify-between`}>
          <div>
            <p className="font-semibold text-[var(--ink)]">{courseTitle(subscription)}</p>
            <p className="text-sm text-[var(--ink-muted)]">{STATUS_LABELS[subscription.status]}</p>
          </div>
          {subscription.status === 'active' && (
            <Link
              href={`/learn/${courseId(subscription)}`}
              className="rounded-full bg-[var(--gold-500)] px-4 py-1.5 text-sm font-bold text-[var(--navy-950)]"
            >
              ادخلي الكورس
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

export default function MyCoursesPage() {
  return (
    <RequireRole role="student">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">كورساتي</h1>
        <MyCoursesContent />
      </main>
    </RequireRole>
  );
}
