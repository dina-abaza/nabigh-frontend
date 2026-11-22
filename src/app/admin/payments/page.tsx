'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { Pagination, Payment, PaymentStatus } from '@/lib/types';

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

function PaymentManageRow({ payment, onChanged }: { payment: Payment; onChanged: () => void }) {
  const [isRefunding, setIsRefunding] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/payments/manage/${payment._id}/confirm`);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function refund() {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.post(`/payments/manage/${payment._id}/refund`, { reason });
      setIsRefunding(false);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold">{amountDisplay(payment)}</p>
          <p className="text-xs text-[var(--ink-muted)]">
            {payment.provider} · {payment.method}
          </p>
        </div>
        <span className="rounded-full border border-[var(--line)] px-3 py-1 text-xs">
          {STATUS_LABELS[payment.status]}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {payment.status === 'pending' && (
          <button onClick={confirm} disabled={isSubmitting} className={`${primaryButtonClass} !px-4 !py-1 text-sm`}>
            تأكيد الدفع
          </button>
        )}
        {payment.status === 'paid' &&
          (!isRefunding ? (
            <button
              onClick={() => setIsRefunding(true)}
              className={`${ghostButtonClass} !px-4 !py-1 text-sm`}
            >
              استرداد
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                placeholder="سبب الاسترداد"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className={`${inputClass} !py-1 text-sm`}
              />
              <button onClick={refund} disabled={isSubmitting || !reason} className={`${primaryButtonClass} !px-3 !py-1 text-sm`}>
                تأكيد الاسترداد
              </button>
              <button onClick={() => setIsRefunding(false)} className="text-sm text-[var(--ink-muted)]">
                إلغاء
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}

function AdminPaymentsContent() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/payments/manage', {
          params: { page, limit: 20, ...(status ? { status } : {}) },
        });
        if (isMounted) {
          setPayments(response.data.data.payments);
          setPagination(response.data.data.pagination);
        }
      } catch (apiError) {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [page, status, reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <select
        value={status}
        onChange={(event) => {
          setPage(1);
          setStatus(event.target.value);
        }}
        className={`w-fit ${inputClass}`}
      >
        <option value="">كل الحالات</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : payments.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد دفعات</p>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <PaymentManageRow key={payment._id} payment={payment} onChanged={refresh} />
          ))}
        </div>
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            className={`${ghostButtonClass} !px-4 !py-1`}
          >
            السابق
          </button>
          <span className="text-[var(--ink-muted)]">
            صفحة {pagination.page} من {pagination.pages}
          </span>
          <button
            onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}
            disabled={page >= pagination.pages}
            className={`${ghostButtonClass} !px-4 !py-1`}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminPaymentsPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">المدفوعات</h1>
        <AdminPaymentsContent />
      </main>
    </RequireRole>
  );
}
