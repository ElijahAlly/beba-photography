import type { PricingResponse } from '@cinderella/api-types';

/**
 * Loads the env-driven pricing config (cached app-wide) and exposes currency
 * formatting helpers. Shared by the public /pricing page and the new-shoot flow
 * so prices are never duplicated in the frontend either.
 */
export const usePricing = () => {
  const api = useApi();
  const data = useState<PricingResponse | null>('pricing', () => null);
  const loading = useState<boolean>('pricing.loading', () => false);

  const load = async () => {
    if (data.value || loading.value) return data.value;
    loading.value = true;
    try {
      data.value = await api<PricingResponse>('/api/pricing');
    } catch {
      data.value = { currency: 'usd', packages: [] };
    } finally {
      loading.value = false;
    }
    return data.value;
  };

  const currency = computed(() => data.value?.currency ?? 'usd');
  const packages = computed(() => data.value?.packages ?? []);

  const fmt = (cents: number, cur = currency.value) =>
    new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur.toUpperCase(),
      maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100);

  const unitLabel = (unit: string) => (unit === 'hour' ? '/hr' : '');

  return { data, loading, load, currency, packages, fmt, unitLabel };
};
