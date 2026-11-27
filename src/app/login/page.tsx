'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getApiErrorMessage } from '@/lib/api';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { inputClass, primaryButtonClass } from '@/lib/ui';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      router.push('/profile');
    } catch (error) {
      const { message } = getApiErrorMessage(error);
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-4 sm:p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">تسجيل الدخول</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-[var(--ink-muted)]">البريد الإلكتروني</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-[var(--ink-muted)]">كلمة المرور</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className={inputClass}
          />
        </div>

        {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? '...جارٍ الدخول' : 'دخول'}
        </button>
      </form>

      <div className="flex items-center gap-2 text-sm text-[var(--ink-muted)]">
        <span className="h-px flex-1 bg-[var(--line)]" />
        أو
        <span className="h-px flex-1 bg-[var(--line)]" />
      </div>

      <GoogleSignInButton onError={setFormError} onSuccess={() => router.push('/profile')} />

      <p className="text-center text-sm text-[var(--ink-muted)]">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-[var(--navy-950)] underline">
          أنشئ حسابًا
        </Link>
      </p>
    </main>
  );
}
