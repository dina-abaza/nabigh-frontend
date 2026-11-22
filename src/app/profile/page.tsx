'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth, type AuthUser } from '@/context/AuthContext';
import { getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { cardClass, inputClass, primaryButtonClass } from '@/lib/ui';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { StudentSidebar } from '@/components/StudentSidebar';
import { DashboardTopbar } from '@/components/DashboardTopbar';
import { ADMIN_NAV_ITEMS, TEACHER_NAV_ITEMS } from '@/lib/nav';

const ROLE_LABELS: Record<string, string> = {
  student: 'طالب',
  teacher: 'مدرس',
  admin: 'مدير',
};

function ProfileForm({ user }: { user: AuthUser }) {
  const { updateProfile } = useAuth();
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ApiErrorDetail[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fieldError = (field: string) =>
    fieldErrors.find((detail) => detail.field === field)?.message;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors([]);
    setSuccessMessage(null);
    setIsSubmitting(true);
    try {
      await updateProfile({ name, avatarUrl });
      setSuccessMessage('تم حفظ التعديلات');
    } catch (error) {
      const { message, details } = getApiErrorMessage(error);
      setFormError(message);
      setFieldErrors(details);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <dl className={`flex flex-col gap-3 ${cardClass}`}>
        <div className="flex justify-between">
          <dt className="text-[var(--ink-muted)]">البريد الإلكتروني</dt>
          <dd>{user.email}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-[var(--ink-muted)]">الدور</dt>
          <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
        </div>
      </dl>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-[var(--ink-muted)]">الاسم</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={2}
            maxLength={100}
            className={inputClass}
          />
          {fieldError('name') && <p className="text-sm text-[var(--bad)]">{fieldError('name')}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="avatarUrl" className="text-sm text-[var(--ink-muted)]">رابط الصورة الشخصية (اختياري)</label>
          <input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
          {fieldError('avatarUrl') && (
            <p className="text-sm text-[var(--bad)]">{fieldError('avatarUrl')}</p>
          )}
        </div>

        {formError && <p className="text-sm text-[var(--bad)]">{formError}</p>}
        {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage}</p>}

        <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
          {isSubmitting ? '...جارٍ الحفظ' : 'حفظ التعديلات'}
        </button>
      </form>
    </>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      </main>
    );
  }

  const content = (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">ملفي الشخصي</h1>
      <ProfileForm key={user.id} user={user} />
    </main>
  );

  if (user.role === 'admin') {
    return (
      <div className="flex flex-1">
        <DashboardSidebar items={ADMIN_NAV_ITEMS} />
        <div className="flex flex-1 flex-col overflow-x-auto">
          <DashboardTopbar />
          {content}
        </div>
      </div>
    );
  }

  if (user.role === 'teacher') {
    return (
      <div className="flex flex-1">
        <DashboardSidebar items={TEACHER_NAV_ITEMS} />
        <div className="flex flex-1 flex-col overflow-x-auto">
          <DashboardTopbar />
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1">
      <StudentSidebar />
      <div className="flex flex-1 flex-col overflow-x-auto">
        <DashboardTopbar />
        {content}
      </div>
    </div>
  );
}
