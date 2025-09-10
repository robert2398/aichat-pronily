import axios from 'axios'

export interface PurchasesBreakdownRow { date: string; coins_purchased: number }
export interface PurchasesSummaryResponse {
  start_date: string
  end_date: string
  total_purchase_transactions: number
  total_coins_purchased: number
  breakdown?: PurchasesBreakdownRow[]
}

export interface UsageByFeatureRow {
  feature: string
  // may contain spent and/or credited depending on flow
  coins_spent?: number
  coins_credited?: number
  // generic percentage (single-mode) if provided
  percentage?: number
}
export interface UsageByFeatureResponse {
  start_date: string
  end_date: string
  total_coins_spent?: number
  total_coins_credited?: number
  by_feature: UsageByFeatureRow[]
}

export interface CoinTrendsRow { period: string; coins_purchased: number; coins_spent: number }
export interface CoinTrendsResponse {
  interval: string
  coin_trends: CoinTrendsRow[]
  net_coins_change: number
  purchase_to_spend_ratio: number
}

const coinsClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

coinsClient.interceptors.request.use((config) => {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null
    if (stored) {
      const tokenOnly = stored.replace(/^bearer\s+/i, '').trim()
      ;(config.headers as any) = (config.headers as any) || {}
      ;(config.headers as any)['Authorization'] = `bearer ${tokenOnly}`
    }
  } catch {}
  return config
})

export const coinsApi = {
  async getPurchasesSummary(params: { startDate: string; endDate: string; interval?: string }): Promise<PurchasesSummaryResponse> {
    const res = await coinsClient.get('/admin/dashboard/coins/purchases-summary', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        ...(params.interval ? { interval: params.interval } : {}),
      },
    })
    return res.data
  },

  async getUsageByFeature(params: { startDate: string; endDate: string; feature?: string; flow?: 'spent' | 'credited' | 'both' }): Promise<UsageByFeatureResponse> {
    const res = await coinsClient.get('/admin/dashboard/coins/usage-by-feature', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        ...(params.feature && params.feature !== 'all' ? { feature: params.feature } : {}),
        ...(params.flow ? { flow: params.flow } : {}),
      },
    })
    return res.data
  },

  async getTrends(params: { startDate: string; endDate: string; interval?: string }): Promise<CoinTrendsResponse> {
    const res = await coinsClient.get('/admin/dashboard/coins/trends', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        ...(params.interval ? { interval: params.interval } : {}),
      },
    })
    return res.data
  },
}

export default coinsApi
