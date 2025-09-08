import axios from 'axios'

export interface PromotionPerformanceRow {
  promo_code: string
  promo_name?: string | null
  times_redeemed: number
  coin_purchase_count: number
  subscription_count: number
  total_discount_given: number
  total_revenue_generated: number
  avg_revenue_per_use: number
  new_customers_acquired?: number | null
  status?: 'active' | 'expired' | string
}

export interface PromotionsPerformanceResponse {
  start_date?: string
  end_date?: string
  status?: 'active' | 'expired' | 'all'
  promotions: PromotionPerformanceRow[]
}

export interface TopSpenderRow {
  user_id: number | string
  user_email?: string | null
  subscription_plan: string | null
  total_revenue: number
  subscription_fees?: number | null
  coin_purchase_revenue?: number | null
  coins_purchased?: number | null
  coins_spent?: number | null
  avatar_url?: string | null
}

export interface TopSpendersResponse {
  start_date?: string
  end_date?: string
  metric?: 'revenue'
  top_spenders: TopSpenderRow[]
}

export interface UserLifetimeValueResponse {
  user_id: number
  total_revenue: number
  coins_purchase_value: number
  subscription_value: number
  total_coins_acquired: number
  total_coins_spent: number
  lifetime_duration_months: number | null
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

client.interceptors.request.use((config) => {
  try {
    const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null
    if (stored) {
      const tokenOnly = stored.replace(/^bearer\s+/i, '').trim()
      const h = (config.headers ?? {}) as any
      h['Authorization'] = `bearer ${tokenOnly}`
      config.headers = h
    }
  } catch {}
  return config
})

export const marketingApi = {
  async getPromotionsPerformance(params: { startDate: string; endDate: string; status?: 'active' | 'expired' | 'all' }): Promise<PromotionsPerformanceResponse> {
    const res = await client.get('/admin/dashboard/promotions/performance', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        status: params.status && params.status !== 'all' ? params.status : undefined,
      },
    })
    const data = (res.data || {}) as PromotionsPerformanceResponse
    data.promotions = Array.isArray((data as any).promotions) ? (data as any).promotions.map((p: any) => ({
      promo_code: String(p.promo_code ?? p.code ?? ''),
      promo_name: p.promo_name ?? p.name ?? null,
      times_redeemed: Number(p.times_redeemed ?? p.redemptions ?? 0) || 0,
      coin_purchase_count: Number(p.coin_purchase_count ?? 0) || 0,
      subscription_count: Number(p.subscription_count ?? 0) || 0,
      total_discount_given: Number(p.total_discount_given ?? p.discount_total ?? 0) || 0,
      total_revenue_generated: Number(p.total_revenue_generated ?? p.revenue_generated ?? 0) || 0,
      avg_revenue_per_use: Number(p.avg_revenue_per_use ?? 0) || 0,
      new_customers_acquired: p.new_customers_acquired === undefined ? null : Number(p.new_customers_acquired) || 0,
      status: p.status,
    })) : []
    return data
  },

  async getTopSpenders(params: { startDate: string; endDate: string; limit?: number; metric?: 'revenue'; plan?: string | null }): Promise<TopSpendersResponse> {
    const res = await client.get('/admin/dashboard/users/top-spenders', {
      params: {
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit ?? 20,
        metric: params.metric || 'revenue',
        plan: params.plan && params.plan !== 'all' ? params.plan : undefined,
      },
    })
    const data = (res.data || {}) as TopSpendersResponse
    data.top_spenders = Array.isArray((data as any).top_spenders) ? (data as any).top_spenders.map((u: any) => ({
      user_id: u.user_id,
      user_email: u.user_email ?? null,
      subscription_plan: u.subscription_plan ?? null,
      total_revenue: Number(u.total_revenue ?? 0) || 0,
      subscription_fees: u.subscription_fees === undefined ? null : Number(u.subscription_fees) || 0,
      coin_purchase_revenue: u.coin_purchase_revenue === undefined ? null : Number(u.coin_purchase_revenue) || 0,
      coins_purchased: u.coins_purchased === undefined ? null : Number(u.coins_purchased) || 0,
      coins_spent: u.coins_spent === undefined ? null : Number(u.coins_spent) || 0,
      avatar_url: u.avatar_url ?? null,
    })) : []
    return data
  },

  async getUserLifetimeValue(params: { userId: number | string }): Promise<UserLifetimeValueResponse> {
    const res = await client.get('/admin/dashboard/users/lifetime-value', { params: { user_id: params.userId } })
    const d = res.data || {}
    return {
      user_id: Number(d.user_id ?? params.userId),
      total_revenue: Number(d.total_revenue ?? 0) || 0,
      coins_purchase_value: Number(d.coins_purchase_value ?? 0) || 0,
      subscription_value: Number(d.subscription_value ?? 0) || 0,
      total_coins_acquired: Number(d.total_coins_acquired ?? 0) || 0,
      total_coins_spent: Number(d.total_coins_spent ?? 0) || 0,
      lifetime_duration_months: d.lifetime_duration_months == null ? null : Number(d.lifetime_duration_months) || 0,
    }
  },
}

export default marketingApi
