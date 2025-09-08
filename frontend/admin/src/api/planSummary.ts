import { useQuery } from '@tanstack/react-query'

// Fetch distinct subscription plan names from the plan summary endpoint.
// Attaches bearer token from localStorage key 'pronily:auth:token' (same convention
// used elsewhere in the admin app) to avoid 401 responses.
export async function fetchPlans(tokenOverride?: string): Promise<string[]> {
  const base = import.meta.env.VITE_API_BASE_URL
  if (!base) console.warn('[fetchPlans] VITE_API_BASE_URL missing')
  const url = `${base}/admin/dashboard/subscriptions/plan-summary`
  try {
    // Retrieve stored token (or use explicit override) and normalize
    const stored = tokenOverride || (typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null)
    let headers: HeadersInit = {}
    if (stored) {
      const tokenOnly = stored.replace(/^bearer\s+/i, '').trim()
      headers = { Authorization: `bearer ${tokenOnly}` }
    }

    const res = await fetch(url, { headers })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: any = await res.json()
    let raw: string[] = []
    if (Array.isArray(json?.plans)) {
      raw = json.plans.map((p: any) => p?.plan_name)
    } else if (Array.isArray(json?.planDistribution)) {
      raw = json.planDistribution.map((p: any) => p?.plan_name)
    }
    const cleaned = Array.from(new Set(raw.filter(Boolean).map((s) => String(s).trim())))
    cleaned.sort((a, b) => a.localeCompare(b))
    return cleaned
  } catch (e) {
    console.error('[fetchPlans] failed', e)
    throw e
  }
}

export function usePlansQuery() {
  return useQuery({
    queryKey: ['plan-summary'],
  // react-query passes a context object to queryFn; we ignore and call fetchPlans with no override.
  queryFn: () => fetchPlans(),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}
