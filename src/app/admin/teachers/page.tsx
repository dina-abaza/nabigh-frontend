'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { Pagination, TeacherProfile } from '@/lib/types';

function CreateTeacherForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('20');
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
      await api.post('/teachers', {
        name,
        email,
        password,
        commissionPercent: Number(commissionPercent),
      });
      setName('');
      setEmail('');
      setPassword('');
      setCommissionPercent('20');
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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-start gap-3">
      <div className="flex flex-col gap-1">
        <input
          placeholder="الاسم"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
        {fieldError('name') && <p className="text-xs text-[var(--bad)]">{fieldError('name')}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="email"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          className={inputClass}
        />
        {fieldError('email') && <p className="text-xs text-[var(--bad)]">{fieldError('email')}</p>}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="password"
          placeholder="كلمة المرور"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={12}
          className={inputClass}
        />
        {fieldError('password') && (
          <p className="text-xs text-[var(--bad)]">{fieldError('password')}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <input
          type="number"
          min={0}
          max={100}
          placeholder="العمولة %"
          value={commissionPercent}
          onChange={(event) => setCommissionPercent(event.target.value)}
          required
          className={`w-28 ${inputClass}`}
        />
        {fieldError('commissionPercent') && (
          <p className="text-xs text-[var(--bad)]">{fieldError('commissionPercent')}</p>
        )}
      </div>
      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? '...جارٍ الإنشاء' : 'إنشاء مدرس'}
      </button>
      {formError && <p className="w-full text-sm text-[var(--bad)]">{formError}</p>}
    </form>
  );
}

function EditCommissionForm({
  teacher,
  onSaved,
  onCancel,
}: {
  teacher: TeacherProfile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [commissionPercent, setCommissionPercent] = useState(String(teacher.commissionPercent));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await api.patch(`/teachers/${teacher._id}`, { commissionPercent: Number(commissionPercent) });
      onSaved();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={100}
        value={commissionPercent}
        onChange={(event) => setCommissionPercent(event.target.value)}
        className={`w-20 ${inputClass} !py-1`}
      />
      <button type="submit" disabled={isSubmitting} className={`${primaryButtonClass} !px-3 !py-1 text-xs`}>
        حفظ
      </button>
      <button type="button" onClick={onCancel} className="text-xs text-[var(--ink-muted)]">
        إلغاء
      </button>
      {error && <p className="text-xs text-[var(--bad)]">{error}</p>}
    </form>
  );
}

function AdminTeachersContent() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function loadTeachers() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/teachers', { params: { page, limit: 20 } });
        if (isMounted) {
          setTeachers(response.data.data.teachers);
          setPagination(response.data.data.pagination);
        }
      } catch (apiError) {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadTeachers();
    return () => {
      isMounted = false;
    };
  }, [page, reloadKey]);

  async function toggleUserStatus(teacher: TeacherProfile) {
    const nextStatus = teacher.user.status === 'active' ? 'suspended' : 'active';
    setPendingUserId(teacher.user._id);
    try {
      await api.patch(`/users/${teacher.user._id}`, { status: nextStatus });
      refresh();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setPendingUserId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">إنشاء مدرس مباشرة</h2>
        <CreateTeacherForm onCreated={refresh} />
      </div>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}

      {isLoading ? (
        <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>
      ) : (
        <div className={`overflow-x-auto ${cardClass} !p-0`}>
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-[var(--line)] text-[var(--ink-muted)]">
                <th className="p-3">الاسم</th>
                <th className="p-3">البريد الإلكتروني</th>
                <th className="p-3">العمولة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3">{teacher.user.name}</td>
                  <td className="p-3">{teacher.user.email}</td>
                  <td className="p-3">
                    {editingId === teacher._id ? (
                      <EditCommissionForm
                        teacher={teacher}
                        onSaved={() => {
                          setEditingId(null);
                          refresh();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setEditingId(teacher._id)}
                        className="font-heading font-bold text-[var(--navy-950)] underline"
                      >
                        {teacher.commissionPercent}%
                      </button>
                    )}
                  </td>
                  <td className="p-3">{teacher.user.status === 'active' ? 'نشط' : 'موقوف'}</td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleUserStatus(teacher)}
                      disabled={pendingUserId === teacher.user._id}
                      className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
                    >
                      {teacher.user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {teachers.length === 0 && (
            <p className="p-4 text-center text-[var(--ink-muted)]">لا يوجد مدرسون</p>
          )}
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

export default function AdminTeachersPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          إدارة المدرسين
        </h1>
        <AdminTeachersContent />
      </main>
    </RequireRole>
  );
}
