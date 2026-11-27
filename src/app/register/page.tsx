'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { inputClass, primaryButtonClass } from '@/lib/ui';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      await register({ name, email, password });
      router.push('/profile');
    } catch (error) {
      const { message, details } = getApiErrorMessage(error);
      setFormError(message);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
        إنشاء حساب طالب
      </h1>

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
          {fieldError('password') && (
            <p className="text-sm text-[var(--bad)]">{fieldError('password')}</p>
          )}
        </div>

        {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? '...جارٍ الإنشاء' : 'إنشاء الحساب'}
        </button>
      </form>

      <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        أو
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <GoogleSignInButton onError={setFormError} onSuccess={() => router.push('/profile')} />

      <p className="text-center text-sm text-[var(--ink-muted)]">
        لديك حساب؟{' '}
        <Link href="/login" className="font-semibold text-[var(--navy-950)] underline">
          سجّل الدخول
        </Link>
      </p>
    </main>
  );
}
