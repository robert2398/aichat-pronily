declare module '../services/engagementApi' {
  export const engagementApi: {
    getFeatureBreakdown: (params: { startDate: string; endDate: string; cohort?: string }) => Promise<{
      start_date?: string;
      end_date?: string;
      feature_breakdown: Array<{ feature: string; total_actions: number; unique_users: number; coins_spent: number }>;
      totals?: { actions: number; users: number; coins: number };
    }>;
    getTopCharacters: (params: { startDate: string; endDate: string; metric?: string; limit?: number }) => Promise<{
      start_date?: string;
      end_date?: string;
      metric?: string;
      top_characters: Array<{ character_id: string | number; character_name: string | null; coins_spent: number; interactions: number; unique_users: number }>
    }>;
  }
  const _default: typeof engagementApi
  export default _default
}
