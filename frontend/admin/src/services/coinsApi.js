import axios from 'axios'

// Dedicated API client for Coins-related endpoints
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const coinsClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Attach bearer token similar to api.ts
coinsClient.interceptors.request.use((config) => {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null
    if (stored) {
      const tokenOnly = stored.replace(/^bearer\s+/i, '').trim()
      config.headers = config.headers || {}
      config.headers['Authorization'] = `bearer ${tokenOnly}`
    }
  } catch {}
  return config
})

export const coinsApi = {
  /**
   * GET /admin/dashboard/coins/purchases-summary
   * params: start_date, end_date, interval (optional)
   */
  async getPurchasesSummary({ startDate, endDate, interval }) {
    const res = await coinsClient.get('/admin/dashboard/coins/purchases-summary', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(interval ? { interval } : {}),
      },
    })
    return res.data
  },

  /**
   * GET /admin/dashboard/coins/usage-by-feature
   * params: start_date, end_date, feature (optional)
   */
  async getUsageByFeature({ startDate, endDate, feature }) {
    const res = await coinsClient.get('/admin/dashboard/coins/usage-by-feature', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(feature && feature !== 'all' ? { feature } : {}),
      },
    })
    return res.data
  },

  /**
   * GET /admin/dashboard/coins/trends
   * params: start_date, end_date, interval (optional)
   */
  async getTrends({ startDate, endDate, interval }) {
    const res = await coinsClient.get('/admin/dashboard/coins/trends', {
      params: {
        start_date: startDate,
        end_date: endDate,
        ...(interval ? { interval } : {}),
      },
    })
    return res.data
  },
}

export default coinsApi
