'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { api, getApiErrorMessage } from '@/lib/api';
import { RequireRole } from '@/components/RequireRole';
import { cardClass, inputClass, primaryButtonClass } from '@/lib/ui';
import type { FeeRule, PaymentGatewayConfig, PaymentProviderDef } from '@/lib/types';

function feeRuleKey(method: string, currency: string) {
  return `${method}__${currency}`;
}

function GatewayCard({
  definition,
  config,
  onSaved,
}: {
  definition: PaymentProviderDef;
  config: PaymentGatewayConfig;
  onSaved: (next: PaymentGatewayConfig) => void;
}) {
  const [enabled, setEnabled] = useState(config.enabled);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [methods, setMethods] = useState<string[]>(config.methods);
  const [currencies, setCurrencies] = useState<string[]>(config.currencies);
  const [feeRules, setFeeRules] = useState<Record<string, { percentBps: string; fixedMinor: string }>>(
    () =>
      Object.fromEntries(
        config.feeRules.map((rule) => [
          feeRuleKey(rule.method, rule.currency),
          { percentBps: String(rule.percentBps), fixedMinor: String(rule.fixedMinor) },
        ]),
      ),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const activeCombinations = useMemo(
    () => methods.flatMap((method) => currencies.map((currency) => ({ method, currency }))),
    [methods, currencies],
  );

  function toggleIn(list: string[], setList: (value: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const payloadFeeRules: FeeRule[] = activeCombinations.map(({ method, currency }) => {
        const entry = feeRules[feeRuleKey(method, currency)] ?? { percentBps: '0', fixedMinor: '0' };
        return {
          method,
          currency,
          percentBps: Number(entry.percentBps) || 0,
          fixedMinor: Number(entry.fixedMinor) || 0,
        };
      });
      const credentialsToSend = Object.fromEntries(
        Object.entries(credentials).filter(([, value]) => value.trim() !== ''),
      );
      const response = await api.put(`/payments/manage/gateways/${definition.id}`, {
        enabled,
        ...(Object.keys(credentialsToSend).length > 0 ? { credentials: credentialsToSend } : {}),
        methods,
        currencies,
        feeRules: payloadFeeRules,
      });
      setSuccessMessage(response.data.data.enabled ? 'تم الحفظ والتفعيل' : 'تم الحفظ (غير مفعّلة)');
      onSaved(response.data.data);
      setCredentials({});
    } catch (apiError) {
      setError(getApiErrorMessage(apiError).message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className={`${cardClass} flex flex-col gap-4`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading font-bold text-[var(--navy-950)]">{definition.name}</h2>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
          مفعّلة
        </label>
      </div>

      {definition.webhookUrl ? (
        <p className="text-xs text-[var(--ink-muted)]">
          رابط Webhook لتسجيله عند المزود: <code className="font-mono">{definition.webhookUrl}</code>
        </p>
      ) : (
        <p className="text-xs text-[var(--ink-muted)]">
          رابط الـ Webhook مش متاح لسه — محتاج ضبط عنوان عام (HTTPS) للسيرفر أولًا.
        </p>
      )}

      <div>
        <p className="mb-2 text-sm font-semibold">بيانات الاعتماد</p>
        <div className="flex flex-col gap-2">
          {definition.credentials.map((field) => (
            <div key={field.key} className="flex flex-col gap-1">
              <label className="text-xs text-[var(--ink-muted)]">
                {field.label}
                {config.configuredCredentials.includes(field.key) && ' (محفوظ ✓)'}
              </label>
              <input
                type="password"
                placeholder={config.configuredCredentials.includes(field.key) ? '•••••• (سيبيه فاضي لو مش هتغيّره)' : ''}
                value={credentials[field.key] ?? ''}
                onChange={(event) =>
                  setCredentials((previous) => ({ ...previous, [field.key]: event.target.value }))
                }
                className={inputClass}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">العملات</p>
        <div className="flex flex-wrap gap-2">
          {definition.currencies.map((currency) => (
            <button
              type="button"
              key={currency}
              onClick={() => toggleIn(currencies, setCurrencies, currency)}
              className={`rounded-full border px-3 py-1 text-sm ${
                currencies.includes(currency)
                  ? 'border-[var(--navy-950)] bg-[var(--navy-950)] text-white'
                  : 'border-[var(--line)]'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">وسائل الدفع</p>
        <div className="flex flex-wrap gap-2">
          {definition.methods.map((method) => (
            <button
              type="button"
              key={method.id}
              onClick={() => toggleIn(methods, setMethods, method.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                methods.includes(method.id)
                  ? 'border-[var(--navy-950)] bg-[var(--navy-950)] text-white'
                  : 'border-[var(--line)]'
              }`}
            >
              {method.name}
              {method.liveOnly && ' (Live فقط)'}
            </button>
          ))}
        </div>
      </div>

      {activeCombinations.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-semibold">قواعد الرسوم</p>
          <div className="flex flex-col gap-2">
            {activeCombinations.map(({ method, currency }) => {
              const key = feeRuleKey(method, currency);
              const methodName = definition.methods.find((item) => item.id === method)?.name ?? method;
              const value = feeRules[key] ?? { percentBps: '0', fixedMinor: '0' };
              return (
                <div key={key} className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="w-48 text-[var(--ink-muted)]">
                    {methodName} · {currency}
                  </span>
                  <label className="flex items-center gap-1">
                    نسبة (نقطة أساس)
                    <input
                      type="number"
                      min={0}
                      value={value.percentBps}
                      onChange={(event) =>
                        setFeeRules((previous) => ({
                          ...previous,
                          [key]: { ...value, percentBps: event.target.value },
                        }))
                      }
                      className={`w-20 ${inputClass} !py-1`}
                    />
                  </label>
                  <label className="flex items-center gap-1">
                    مبلغ ثابت
                    <input
                      type="number"
                      min={0}
                      value={value.fixedMinor}
                      onChange={(event) =>
                        setFeeRules((previous) => ({
                          ...previous,
                          [key]: { ...value, fixedMinor: event.target.value },
                        }))
                      }
                      className={`w-20 ${inputClass} !py-1`}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-[var(--bad)]">{error}</p>}
      {successMessage && <p className="text-sm font-semibold text-green-700">{successMessage}</p>}

      <button type="submit" disabled={isSaving} className={`${primaryButtonClass} w-fit`}>
        {isSaving ? '...جارٍ الحفظ' : 'حفظ'}
      </button>
    </form>
  );
}

function AdminPaymentGatewaysContent() {
  const [providers, setProviders] = useState<PaymentProviderDef[]>([]);
  const [configs, setConfigs] = useState<Record<string, PaymentGatewayConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [providersResponse, configsResponse] = await Promise.all([
          api.get('/payments/manage/gateways/providers'),
          api.get('/payments/manage/gateways'),
        ]);
        if (isMounted) {
          setProviders(providersResponse.data.data);
          setConfigs(
            Object.fromEntries(
              (configsResponse.data.data as PaymentGatewayConfig[]).map((config) => [config.id, config]),
            ),
          );
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

  if (isLoading) return <p className="text-[var(--ink-muted)]">...جارٍ التحميل</p>;
  if (error) return <p className="text-[var(--bad)]">{error}</p>;

  return (
    <div className="flex flex-col gap-6">
      {providers.map((definition) => {
        const config = configs[definition.id];
        if (!config) return null;
        return (
          <GatewayCard
            key={definition.id}
            definition={definition}
            config={config}
            onSaved={(next) => setConfigs((previous) => ({ ...previous, [definition.id]: next }))}
          />
        );
      })}
    </div>
  );
}

export default function AdminPaymentGatewaysPage() {
  return (
    <RequireRole role="admin">
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-4 sm:p-8">
        <h1 className="font-heading text-2xl font-extrabold text-[var(--navy-950)]">بوابات الدفع</h1>
        <AdminPaymentGatewaysContent />
      </main>
    </RequireRole>
  );
}
