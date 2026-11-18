'use client';

import { Fragment, useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage, type ApiErrorDetail } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { CatalogPicker, EMPTY_CATALOG_SELECTION, type CatalogSelection } from '@/components/CatalogPicker';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { CatalogItem, Pagination, TeacherProfile } from '@/lib/types';

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

function TeacherPermissionsPanel({
  teacher,
  onSaved,
  onCancel,
}: {
  teacher: TeacherProfile;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [countries, setCountries] = useState<CatalogItem[]>([]);
  const [allowedCountryIds, setAllowedCountryIds] = useState<string[]>(teacher.allowedCountryIds);
  const [allowedSubjectIds, setAllowedSubjectIds] = useState<string[]>(teacher.allowedSubjectIds);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<CatalogSelection>(EMPTY_CATALOG_SELECTION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/catalog/countries', { params: { limit: 100 } })
      .then((response) => setCountries(response.data.data.countries))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let isMounted = true;
    const missing = allowedSubjectIds.filter((id) => !subjectNames[id]);
    if (missing.length === 0) return;
    Promise.all(
      missing.map((id) =>
        api
          .get(`/catalog/subjects/${id}`)
          .then((response) => [id, response.data.data.name.ar] as const)
          .catch(() => [id, id] as const),
      ),
    ).then((pairs) => {
      if (isMounted) {
        setSubjectNames((previous) => ({ ...previous, ...Object.fromEntries(pairs) }));
      }
    });
    return () => {
      isMounted = false;
    };
  }, [allowedSubjectIds, subjectNames]);

  function toggleCountry(id: string) {
    setAllowedCountryIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }

  function addSubject() {
    if (!picker.subjectId || allowedSubjectIds.includes(picker.subjectId)) return;
    setAllowedSubjectIds((previous) => [...previous, picker.subjectId]);
    setPicker(EMPTY_CATALOG_SELECTION);
  }

  function removeSubject(id: string) {
    setAllowedSubjectIds((previous) => previous.filter((item) => item !== id));
  }

  async function handleSave() {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await api.patch(`/teachers/${teacher._id}`, { allowedCountryIds, allowedSubjectIds });
      setSuccessMessage('تم الحفظ');
      onSaved();
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--line)] p-4">
      <div>
        <h3 className="mb-2 text-sm font-bold text-[var(--navy-950)]">الدول المسموحة</h3>
        <div className="flex flex-wrap gap-2">
          {countries.map((country) => (
            <button
              key={country._id}
              onClick={() => toggleCountry(country._id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                allowedCountryIds.includes(country._id)
                  ? 'border-[var(--navy-950)] bg-[var(--navy-950)] text-white'
                  : 'border-[var(--line)]'
              }`}
            >
              {country.name.ar}
            </button>
          ))}
          {countries.length === 0 && (
            <span className="text-sm text-[var(--ink-muted)]">مفيش دول في الكتالوج بعد</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-bold text-[var(--navy-950)]">المواد المسموحة</h3>
        <div className="mb-2 flex flex-wrap gap-2">
          {allowedSubjectIds.map((id) => (
            <span
              key={id}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-1 text-sm"
            >
              {subjectNames[id] ?? '...'}
              <button onClick={() => removeSubject(id)} className="text-[var(--bad)]">
                ×
              </button>
            </span>
          ))}
          {allowedSubjectIds.length === 0 && (
            <span className="text-sm text-[var(--ink-muted)]">مفيش مواد مسموحة بعد</span>
          )}
        </div>
        <p className="text-xs text-[var(--ink-muted)]">
          اختاري دولة ومنهج ومرحلة وصف ومادة، ثم دوسي &quot;+ إضافة المادة&quot; — اختيارها من القوائم لوحده مش
          كافي.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <CatalogPicker value={picker} onChange={setPicker} />
          <button
            onClick={addSubject}
            disabled={!picker.subjectId}
            className={`${ghostButtonClass} !px-3 !py-1 text-sm`}
          >
            + إضافة المادة
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage} ✓</p>}

      <div className="flex gap-2">
        <button onClick={handleSave} disabled={isSubmitting} className={`${primaryButtonClass} w-fit`}>
          {isSubmitting ? '...جارٍ الحفظ' : 'حفظ الصلاحيات'}
        </button>
        <button onClick={onCancel} className="text-sm font-semibold text-[var(--ink-muted)] underline">
          إغلاق بدون حفظ
        </button>
      </div>
    </div>
  );
}

function AdminTeachersContent() {
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [permissionsEditingId, setPermissionsEditingId] = useState<string | null>(null);
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
                <Fragment key={teacher._id}>
                <tr className="border-b border-[var(--line)] last:border-0">
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
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleUserStatus(teacher)}
                        disabled={pendingUserId === teacher.user._id}
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {teacher.user.status === 'active' ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button
                        onClick={() => setPermissionsEditingId(teacher._id)}
                        disabled={permissionsEditingId === teacher._id}
                        className="rounded-full border border-[var(--line)] px-3 py-1 text-xs disabled:opacity-50"
                      >
                        الدول والمواد
                      </button>
                    </div>
                  </td>
                </tr>
                {permissionsEditingId === teacher._id && (
                  <tr>
                    <td colSpan={5} className="p-0">
                      <TeacherPermissionsPanel
                        teacher={teacher}
                        onSaved={refresh}
                        onCancel={() => setPermissionsEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
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
