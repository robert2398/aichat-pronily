import axios from 'axios'

// Lightweight client mirroring coinsApi pattern
const engagementClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

engagementClient.interceptors.request.use((config) => {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null
    if (stored) {
      const tokenOnly = stored.replace(/^bearer\s+/i, '').trim()
      ;(config.headers ??= {})
      ;(config.headers)['Authorization'] = `bearer ${tokenOnly}`
    }
  } catch {}
  return config
})

export const engagementApi = {
  async getFeatureBreakdown(params) {
    const res = await engagementClient.get('/admin/dashboard/engagement/feature-breakdown', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        ...(params.cohort && params.cohort !== 'all' ? { cohort: params.cohort } : {}),
      },
    })
    const data = res.data ?? {}
    const rows = Array.isArray(data.feature_breakdown) ? data.feature_breakdown : []
    // Compute totals for convenience
    const totals = rows.reduce((acc, r) => ({
      actions: acc.actions + (Number(r.total_actions) || 0),
      users: acc.users + (Number(r.unique_users) || 0),
      coins: acc.coins + (Number(r.coins_spent) || 0),
    }), { actions: 0, users: 0, coins: 0 })
    return { ...data, totals }
  },

  async getTopCharacters(params) {
    const res = await engagementClient.get('/admin/dashboard/engagement/top-characters', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        metric: params.metric || 'coins_spent',
        limit: params.limit ?? 10,
      },
    })
    return res.data ?? { top_characters: [] }
  },
}

export default engagementApi
