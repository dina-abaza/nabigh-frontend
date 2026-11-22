'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass } from '@/lib/ui';
import type { Payment, PaymentStatus } from '@/lib/types';

const STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'قيد التحقق',
  paid: 'تم الدفع',
  failed: 'فشلت المحاولة',
  cancelled: 'ملغاة',
  refunded: 'مُستردة',
};

function amountDisplay(payment: Payment) {
  return `${(payment.amountMinor / 100).toFixed(2)} ${payment.currency}`;
}

function PaymentRow({ payment, onRefresh }: { payment: Payment; onRefresh: (id: string) => void }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refresh() {
    setIsRefreshing(true);
    await onRefresh(payment._id);
    setIsRefreshing(false);
  }

  return (
    <div className={`${cardClass} flex items-center justify-between`}>
      <div>
        <p className="font-semibold">{amountDisplay(payment)}</p>
        <p className="text-xs text-[var(--ink-muted)]">
          {payment.provider} · {payment.method}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">
          {STATUS_LABELS[payment.status]}
        </span>
        {payment.status === 'pending' && (
          <button onClick={refresh} disabled={isRefreshing} className={`${ghostButtonClass} !px-3 !py-1 text-xs`}>
            تحديث
          </button>
        )}
      </div>
    </div>
  );
}

function PaymentsContent() {
  const searchParams = useSearchParams();
  const highlightedId = searchParams.get('paymentId');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/payments/mine', { params: { limit: 50 } })
      .then((response) => {
        if (isMounted) setPayments(response.data.data.payments);
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

  const refreshOne = useCallback(async (paymentId: string) => {
    try {
      const response = await api.get(`/payments/mine/${paymentId}`);
      setPayments((previous) =>
        previous.map((payment) => (payment._id === paymentId ? response.data.data : payment)),
      );
    } catch {
      // ignore transient refresh errors
    }
  }, []);

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  const highlighted = payments.find((payment) => payment._id === highlightedId);
  const rest = payments.filter((payment) => payment._id !== highlightedId);

  return (
    <div className="flex flex-col gap-6">
      {highlighted && (
        <div>
          <p className="mb-2 text-sm font-semibold text-[var(--navy-950)]">آخر عملية دفع</p>
          <PaymentRow payment={highlighted} onRefresh={refreshOne} />
        </div>
      )}

      {rest.length > 0 || !highlighted ? (
        <div className="flex flex-col gap-3">
          {rest.map((payment) => (
            <PaymentRow key={payment._id} payment={payment} onRefresh={refreshOne} />
          ))}
          {payments.length === 0 && (
            <p className="text-center text-[var(--ink-muted)]">لا توجد عمليات دفع بعد</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default function PaymentsPage() {
  return (
    <RequireRole role="student">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">مدفوعاتي</h1>
        <PaymentsContent />
      </main>
    </RequireRole>
  );
}
