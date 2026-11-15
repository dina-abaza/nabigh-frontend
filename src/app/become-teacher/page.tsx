'use client';

import { useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { inputClass, primaryButtonClass } from '@/lib/ui';

export default function BecomeTeacherPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetail[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const fieldError = (field: string) =>
    fieldErrors.find((detail) => detail.field === field)?.message;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setIsSubmitting(true);
    try {
      await api.post('/teacher-applications', {
        name,
        email,
        password,
        ...(message ? { message } : {}),
      });
      setSubmitted(true);
    } catch (error) {
      const { message: errorMessage, details } = getApiErrorMessage(error);
      setFormError(errorMessage);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          تم استلام طلبك
        </h1>
        <p className="text-[var(--ink-muted)]">
          طلبك الآن قيد مراجعة الإدارة. بعد الموافقة سيمكنك تسجيل الدخول بنفس البريد الإلكتروني
          وكلمة المرور اللي كتبتها.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          الانضمام كمدرس
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-muted)]">
          أرسل طلبك وسيتم مراجعته من فريق نابغ قبل تفعيل حسابك.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-[var(--ink-muted)]">الاسم</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            minLength={2}
            maxLength={100}
            className={inputClass}
          />
          {fieldError('name') && <p className="text-sm text-[var(--bad)]">{fieldError('name')}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-[var(--ink-muted)]">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            maxLength={254}
            className={inputClass}
          />
          {fieldError('email') && <p className="text-sm text-[var(--bad)]">{fieldError('email')}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-[var(--ink-muted)]">كلمة المرور</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={12}
            className={inputClass}
          />
          <p className="text-xs text-[var(--ink-muted)]">
            ستستخدم هذه الكلمة لتسجيل الدخول بعد موافقة الإدارة على طلبك.
          </p>
          {fieldError('password') && (
            <p className="text-sm text-[var(--bad)]">{fieldError('password')}</p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="message" className="text-sm text-[var(--ink-muted)]">رسالة مختصرة عن خبرتك (اختياري)</label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            maxLength={2000}
            rows={4}
            className={inputClass}
          />
          {fieldError('message') && (
            <p className="text-sm text-[var(--bad)]">{fieldError('message')}</p>
          )}
        </div>

        {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? '...جارٍ الإرسال' : 'إرسال الطلب'}
        </button>
      </form>
    </main>
  );
}
