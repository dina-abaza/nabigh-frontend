'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, ghostButtonClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { VideoProvider, VideoSettings } from '@/lib/types';

function VideoSettingsContent() {
  const [providers, setProviders] = useState<VideoProvider[]>([]);
  const [current, setCurrent] = useState<VideoSettings | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [providersResponse, currentResponse] = await Promise.all([
          api.get('/video-settings/providers'),
          api.get('/video-settings'),
        ]);
        if (isMounted) {
          setProviders(providersResponse.data.data);
          setCurrent(currentResponse.data.data);
          if (currentResponse.data.data?.provider?.id) {
            setSelectedProviderId(currentResponse.data.data.provider.id);
          }
        }
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
  }, []);

  const selectedProvider = providers.find((provider) => provider.id === selectedProviderId);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);
    try {
      const response = await api.put('/video-settings', {
        provider: selectedProviderId,
        credentials,
      });
      setCurrent(response.data.data);
      setSuccessMessage('تم حفظ إعدادات مزود الفيديو');
    } catch (apiError) {
      setSaveError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsSaving(true);
    setSaveError(null);
    setSuccessMessage(null);
    try {
      await api.delete('/video-settings');
      setCurrent(null);
      setSelectedProviderId('');
      setCredentials({});
      setSuccessMessage('تم حذف إعداد المزود');
    } catch (apiError) {
      setSaveError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className={cardClass}>
        <h2 className="mb-2 font-heading font-bold text-[var(--navy-950)]">الحالة الحالية</h2>
        {current?.configured ? (
          <div className="flex flex-col gap-1 text-sm">
            <p>المزود: {current.provider?.name}</p>
            {current.credentials.map((credential) => (
              <p key={credential.key} className="text-[var(--ink-muted)]">
                {credential.key}: {credential.configured ? 'محفوظ ✓' : 'غير محفوظ'}
              </p>
            ))}
            <button
              onClick={handleDelete}
              disabled={isSaving}
              className={`${ghostButtonClass} !px-4 !py-1 mt-2 w-fit text-sm`}
            >
              حذف الإعداد الحالي
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--ink-muted)]">لا يوجد مزود فيديو مُعدّ حاليًا.</p>
        )}
      </div>

      <form onSubmit={handleSave} className={`${cardClass} flex flex-col gap-4`}>
        <h2 className="font-heading font-bold text-[var(--navy-950)]">اختيار / تحديث المزود</h2>
        <select
          value={selectedProviderId}
          onChange={(event) => {
            setSelectedProviderId(event.target.value);
            setCredentials({});
          }}
          className={inputClass}
        >
          <option value="">اختاري مزودًا...</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>
              {provider.name}
            </option>
          ))}
        </select>

        {selectedProvider?.credentials.map((field) => (
          <div key={field.key} className="flex flex-col gap-1">
            <label className="text-sm text-[var(--ink-muted)]">{field.label}</label>
            <input
              type="password"
              value={credentials[field.key] ?? ''}
              onChange={(event) =>
                setCredentials((previous) => ({ ...previous, [field.key]: event.target.value }))
              }
              required
              className={inputClass}
            />
          </div>
        ))}

        {saveError && <p className="text-sm text-[var(--bad)]">{saveError}</p>}
        {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage}</p>}

        <button
          type="submit"
          disabled={isSaving || !selectedProviderId}
          className={`${primaryButtonClass} w-fit`}
        >
          {isSaving ? '...جارٍ الحفظ' : 'حفظ'}
        </button>
      </form>
    </div>
  );
}

export default function VideoSettingsPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">
          إعداد مزود الفيديو
        </h1>
        <VideoSettingsContent />
      </main>
    </RequireRole>
  );
}
