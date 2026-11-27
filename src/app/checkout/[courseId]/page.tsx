'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { piastresToEgp } from '@/lib/money';
import type { Course, PublicPaymentGateway } from '@/lib/types';

function needsBillingDetails(providerId: string) {
  return providerId === 'paymob' || providerId === 'paytabs';
}

function CheckoutContent({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [gateways, setGateways] = useState<PublicPaymentGateway[]>([]);
  const [providerId, setProviderId] = useState('');
  const [methodId, setMethodId] = useState('');
  const [currency, setCurrency] = useState('');
  const [billing, setBilling] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([api.get(`/courses/${courseId}`), api.get('/payments/gateways')])
      .then(([courseResponse, gatewaysResponse]) => {
        if (isMounted) {
          setCourse(courseResponse.data.data);
          setGateways(gatewaysResponse.data.data);
        }
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
  }, [courseId]);

  const selectedGateway = gateways.find((gateway) => gateway.id === providerId);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await api.post('/payments/checkout', {
        courseId,
        provider: providerId,
        method: methodId,
        currency,
        ...(needsBillingDetails(providerId) ? { billingDetails: billing } : {}),
      });
      window.location.assign(response.data.data.checkoutUrl);
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (!course) return <p className="text-[var(--bad)]">{error ?? 'تعذر تحميل الكورس'}</p>;

  if (gateways.length === 0) {
    return (
      <div className={cardClass}>
        <p className="text-[var(--ink-muted)]">
          لا توجد وسيلة دفع متاحة حاليًا. حاولي مرة أخرى لاحقًا أو تواصلي مع الدعم.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <p className="font-semibold">{course.title}</p>
        <p className="font-heading text-xl font-extrabold">{piastresToEgp(course.price)} ج.م</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-[var(--ink-muted)]">بوابة الدفع</label>
          <select
            value={providerId}
            onChange={(event) => {
              setProviderId(event.target.value);
              setMethodId('');
              setCurrency('');
            }}
            required
            className={inputClass}
          >
            <option value="">اختاري...</option>
            {gateways.map((gateway) => (
              <option key={gateway.id} value={gateway.id}>
                {gateway.name}
              </option>
            ))}
          </select>
        </div>

        {selectedGateway && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-[var(--ink-muted)]">وسيلة الدفع</label>
              <select value={methodId} onChange={(event) => setMethodId(event.target.value)} required className={inputClass}>
                <option value="">اختاري...</option>
                {selectedGateway.methods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-[var(--ink-muted)]">العملة</label>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)} required className={inputClass}>
                <option value="">اختاري...</option>
                {selectedGateway.currencies.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {needsBillingDetails(providerId) && (
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--line)] p-4">
            <p className="text-sm font-semibold">بيانات الفوترة</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                placeholder="الاسم الأول"
                value={billing.firstName}
                onChange={(event) => setBilling((previous) => ({ ...previous, firstName: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="الاسم الأخير"
                value={billing.lastName}
                onChange={(event) => setBilling((previous) => ({ ...previous, lastName: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={billing.email}
                onChange={(event) => setBilling((previous) => ({ ...previous, email: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="رقم الهاتف (مع كود الدولة)"
                value={billing.phone}
                onChange={(event) => setBilling((previous) => ({ ...previous, phone: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="الشارع"
                value={billing.street}
                onChange={(event) => setBilling((previous) => ({ ...previous, street: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="المدينة"
                value={billing.city}
                onChange={(event) => setBilling((previous) => ({ ...previous, city: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="المحافظة/الولاية"
                value={billing.state}
                onChange={(event) => setBilling((previous) => ({ ...previous, state: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder={providerId === 'paymob' ? 'الدولة (مثال: EGY)' : 'الدولة (مثال: EG)'}
                value={billing.country}
                onChange={(event) => setBilling((previous) => ({ ...previous, country: event.target.value }))}
                required
                className={inputClass}
              />
              <input
                placeholder="الرمز البريدي"
                value={billing.zipCode}
                onChange={(event) => setBilling((previous) => ({ ...previous, zipCode: event.target.value }))}
                required
                className={inputClass}
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

        <button type="submit" disabled={isSubmitting || !methodId || !currency} className={primaryButtonClass}>
          {isSubmitting ? '...جارٍ التحويل لصفحة الدفع' : 'ادفعي الآن'}
        </button>
      </form>
    </div>
  );
}

export default function CheckoutPage() {
  const params = useParams<{ courseId: string }>();
  return (
    <RequireRole role="student">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">إتمام الاشتراك</h1>
        <CheckoutContent courseId={params.courseId} />
      </main>
    </RequireRole>
  );
}
