import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - maybe redirect to login
      console.warn('Unauthorized access - token may be expired')
    }
    return Promise.reject(error)
  }
)

export const dashboardApi = {
  // Get KPI metrics summary
  getKpiMetrics: async (params = {}) => {
    const response = await apiClient.get('/admin/dashboard/metrics/summary', {
      params: {
        as_of_date: params.asOfDate,
        period: params.period || 'monthly',
        cohort: params.cohort,
      }
    })
    return response.data
  },

  // Future API endpoints can be added here
  getRevenueTrends: async (params = {}) => {
    // Placeholder for revenue trends API
    throw new Error('API not implemented yet')
  },

  getCoinsPurchased: async (params = {}) => {
    // Placeholder for coins purchased API
    throw new Error('API not implemented yet')
  },
}

export default dashboardApi
