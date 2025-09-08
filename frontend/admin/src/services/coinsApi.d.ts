export interface PurchasesBreakdownRow { date: string; coins_purchased: number }
export interface PurchasesSummaryResponse {
  start_date: string
  end_date: string
  total_purchase_transactions: number
  total_coins_purchased: number
  breakdown?: PurchasesBreakdownRow[]
}

export interface UsageByFeatureRow { feature: string; coins_spent: number; percentage?: number }
export interface UsageByFeatureResponse {
  start_date: string
  end_date: string
  total_coins_spent: number
  by_feature: UsageByFeatureRow[]
}

export interface CoinTrendsRow { period: string; coins_purchased: number; coins_spent: number }
export interface CoinTrendsResponse {
  interval: string
  coin_trends: CoinTrendsRow[]
  net_coins_change: number
  purchase_to_spend_ratio: number
}

export const coinsApi: {
  getPurchasesSummary(params: { startDate: string; endDate: string; interval?: string }): Promise<PurchasesSummaryResponse>
  getUsageByFeature(params: { startDate: string; endDate: string; feature?: string }): Promise<UsageByFeatureResponse>
  getTrends(params: { startDate: string; endDate: string; interval?: string }): Promise<CoinTrendsResponse>
}

export default coinsApi
