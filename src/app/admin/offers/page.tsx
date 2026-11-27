'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { CatalogItem, OfferStatus, SubjectOffer, TeacherRef } from '@/lib/types';

const STATUS_LABELS: Record<OfferStatus, string> = {
  pending_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

function catalogName(value: CatalogItem | string): string {
  return typeof value === 'string' ? value : value.name.ar;
}

function teacherName(value: TeacherRef | string): string {
  return typeof value === 'string' ? value : value.user.name;
}

function OfferReviewRow({ offer, onChanged }: { offer: SubjectOffer; onChanged: () => void }) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function review(decision: 'approve' | 'reject') {
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/subject-offers/${offer._id}/review`, {
        decision,
        ...(reviewNote ? { reviewNote } : {}),
      });
      setIsReviewing(false);
      onChanged();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={cardClass}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[var(--ink)]">
            {catalogName(offer.gradeId)} — {catalogName(offer.subjectId)}
          </p>
          <p className="break-words text-sm text-[var(--ink-muted)]">المدرس: {teacherName(offer.teacherId)}</p>
          <p className="font-heading text-sm">{piastresToEgp(offer.price)} ج.م</p>
        </div>
        <span className="flex-none rounded-full border border-[var(--line)] px-3 py-1 text-xs text-[var(--ink-muted)]">
          {STATUS_LABELS[offer.status]}
        </span>
      </div>

      {error && <p className="mt-2 text-sm text-[var(--bad)]">{error}</p>}

      {offer.status === 'pending_review' && (
        <div className="mt-3">
          {!isReviewing ? (
            <button onClick={() => setIsReviewing(true)} className={`${ghostButtonClass} !px-4 !py-1 text-sm`}>
              مراجعة
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="ملاحظة المراجعة (مطلوبة عند الرفض)"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                rows={2}
                className={inputClass}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => review('approve')}
                  disabled={isSubmitting}
                  className={`${primaryButtonClass} !px-4 !py-1 text-sm`}
                >
                  اعتماد
                </button>
                <button
                  onClick={() => review('reject')}
                  disabled={isSubmitting}
                  className={`${ghostButtonClass} !px-4 !py-1 text-sm`}
                >
                  رفض
                </button>
                <button onClick={() => setIsReviewing(false)} className="text-sm text-[var(--ink-muted)]">
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AdminOffersContent() {
  const [offers, setOffers] = useState<SubjectOffer[]>([]);
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
        const response = await api.get('/subject-offers/manage', {
          params: { limit: 100, ...(status ? { status } : {}) },
        });
        if (isMounted) setOffers(response.data.data.offers);
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
  }, [status, reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
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
      ) : offers.length === 0 ? (
        <p className="text-center text-[var(--ink-muted)]">لا توجد عروض</p>
      ) : (
        <div className="flex flex-col gap-3">
          {offers.map((offer) => (
            <OfferReviewRow key={offer._id} offer={offer} onChanged={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOffersPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          عروض أسعار المواد الكاملة
        </h1>
        <AdminOffersContent />
      </main>
    </RequireRole>
  );
}
