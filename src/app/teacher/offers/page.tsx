'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { CatalogPicker, EMPTY_CATALOG_SELECTION, type CatalogSelection } from '@/components/CatalogPicker';
import { cardClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { egpToPiastres, piastresToEgp } from '@/lib/money';
import type { CatalogItem, OfferStatus, SubjectOffer } from '@/lib/types';

const STATUS_LABELS: Record<OfferStatus, string> = {
  pending_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

function catalogName(value: CatalogItem | string): string {
  return typeof value === 'string' ? value : value.name.ar;
}

function CreateOfferForm({ onCreated }: { onCreated: () => void }) {
  const [selection, setSelection] = useState<CatalogSelection>(EMPTY_CATALOG_SELECTION);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetail[]>([]);

  const fieldError = (field: string) =>
    fieldErrors.find((detail) => detail.field === field)?.message;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setIsSubmitting(true);
    try {
      await api.post('/subject-offers', {
        gradeId: selection.gradeId,
        subjectId: selection.subjectId,
        price: egpToPiastres(price),
      });
      setSelection(EMPTY_CATALOG_SELECTION);
      setPrice('');
      onCreated();
    } catch (error) {
      const { message, details } = getApiErrorMessage(error);
      setFormError(message);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <CatalogPicker value={selection} onChange={setSelection} />
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-[var(--ink-muted)]">السعر (جنيه مصري / المادة كاملة)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            required
            className={`w-40 ${inputClass}`}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !selection.subjectId}
          className={primaryButtonClass}
        >
          {isSubmitting ? '...جارٍ الإرسال' : 'إرسال للمراجعة'}
        </button>
      </div>
      {(fieldError('gradeId') || fieldError('subjectId') || fieldError('price')) && (
        <p className="text-sm text-[var(--bad)]">تأكدي من اختيار الصف والمادة والسعر بشكل صحيح.</p>
      )}
      {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}
    </form>
  );
}

function EditOfferPrice({ offer, onSaved }: { offer: SubjectOffer; onSaved: () => void }) {
  const [price, setPrice] = useState(piastresToEgp(offer.price));
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/subject-offers/${offer._id}`, { price: egpToPiastres(price) });
      setIsEditing(false);
      onSaved();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing) {
    return (
      <button onClick={() => setIsEditing(true)} className="text-xs underline text-[var(--navy-950)]">
        تعديل السعر
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step="0.01"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
        className={`w-24 ${inputClass} !py-1`}
      />
      <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} !px-3 !py-1 text-xs`}>
        حفظ
      </button>
      <button type="button" onClick={() => setIsEditing(false)} className="text-xs text-[var(--ink-muted)]">
        إلغاء
      </button>
      {error && <span className="text-xs text-[var(--bad)]">{error}</span>}
    </form>
  );
}

function TeacherOffersContent() {
  const [offers, setOffers] = useState<SubjectOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;
    api
      .get('/subject-offers/mine', { params: { limit: 100 } })
      .then((response) => {
        if (isMounted) setOffers(response.data.data.offers);
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
  }, [reloadKey]);

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">عرض سعر مادة كاملة جديد</h2>
        <CreateOfferForm onCreated={refresh} />
      </div>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : (
        <div className={`overflow-x-auto ${cardClass} !p-0`}>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <th className="p-3">الصف</th>
                <th className="p-3">المادة</th>
                <th className="p-3">السعر</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {offers.map((offer) => (
                <tr key={offer._id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3">{catalogName(offer.gradeId)}</td>
                  <td className="p-3">{catalogName(offer.subjectId)}</td>
                  <td className="p-3 font-heading">{piastresToEgp(offer.price)} ج.م</td>
                  <td className="p-3">{STATUS_LABELS[offer.status]}</td>
                  <td className="p-3">
                    <EditOfferPrice offer={offer} onSaved={refresh} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {offers.length === 0 && (
            <p className="p-4 text-center text-[var(--ink-muted)]">لا توجد عروض بعد</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function TeacherOffersPage() {
  return (
    <RequireRole role="teacher">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          عروض أسعار المواد الكاملة
        </h1>
        <TeacherOffersContent />
      </main>
    </RequireRole>
  );
}
