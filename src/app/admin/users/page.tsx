'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { AdminUser, Pagination, UserStatus } from '@/lib/types';

const ROLE_LABELS: Record<string, string> = {
  student: 'طالب',
  teacher: 'مدرس',
  admin: 'مدير',
};

function CreateStudentForm({ onCreated }: { onCreated: () => void }) {
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
      await api.post('/users', { name, email, password });
      setName('');
      setEmail('');
      setPassword('');
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
      <button type="submit" disabled={isSubmitting} className={primaryButtonClass}>
        {isSubmitting ? '...جارٍ الإنشاء' : 'إنشاء طالب'}
      </button>
      {formError && <p className="w-full text-sm text-[var(--bad)]">{formError}</p>}
    </form>
  );
}

function AdminUsersContent() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/users', {
          params: {
            page,
            limit: 20,
            ...(role ? { role } : {}),
            ...(status ? { status } : {}),
          },
        });
        if (isMounted) {
          setUsers(response.data.data.users);
          setPagination(response.data.data.pagination);
        }
      } catch (apiError) {
        if (isMounted) setError(getApiErrorMessage(apiError).message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [page, role, status, reloadKey]);

  async function toggleStatus(user: AdminUser) {
    const nextStatus: UserStatus = user.status === 'active' ? 'suspended' : 'active';
    setPendingUserId(user._id);
    try {
      await api.patch(`/users/${user._id}`, { status: nextStatus });
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
        <h2 className="mb-3 font-heading font-bold text-[var(--navy-950)]">إنشاء حساب طالب</h2>
        <CreateStudentForm onCreated={refresh} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={role}
          onChange={(event) => {
            setPage(1);
            setRole(event.target.value);
          }}
          className={inputClass}
        >
          <option value="">كل الأدوار</option>
          <option value="student">طالب</option>
          <option value="teacher">مدرس</option>
          <option value="admin">مدير</option>
        </select>
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value);
          }}
          className={inputClass}
        >
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="suspended">موقوف</option>
        </select>
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
                <th className="p-3">الدور</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-b border-[var(--line)] last:border-0">
                  <td className="p-3">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{ROLE_LABELS[user.role] ?? user.role}</td>
                  <td className="p-3">{user.status === 'active' ? 'نشط' : 'موقوف'}</td>
                  <td className="p-3">
                    {user.role !== 'admin' && (
                      <button
                        onClick={() => toggleStatus(user)}
                        disabled={pendingUserId === user._id}
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <p className="p-4 text-center text-[var(--ink-muted)]">لا يوجد مستخدمون</p>
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

export default function AdminUsersPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          إدارة المستخدمين
        </h1>
        <AdminUsersContent />
      </main>
    </RequireRole>
  );
}
