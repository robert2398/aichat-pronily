import axios from 'axios';
import type { AxiosInstance } from 'axios';

interface APIUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string;
  chat_count: number;
  characters_created: number;
  avg_session_length: string;
}

export interface CharacterImage {
  id: number;
  character_id: number;
  user_id: number;
  s3_path: string;
  mime_type: string;
  created_at: string;
}

export interface APIPricingPlan {
  plan_id: number;
  plan_name: string;
  pricing_id: string;
  currency?: string;
  discount?: number;
  price: number;
  billing_cycle: string;
  coin_reward: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PricingPlan {
  plan_id: number;
  plan_name: string;
  pricing_id: string;
  currency?: string;
  discount?: number;
  price: number;
  billing_cycle: string;
  coin_reward: number;
  status: string;
  updated_at: string;
}

export interface APIPromo {
  promo_id: number;
  promo_name: string;
  coupon: string;
  stripe_promotion_id?: string;
  stripe_coupon_id?: string;
  percent_off: number;
  start_date: string;
  expiry_date: string;
  status: string;
  applied_count: number;
  created_at: string;
  updated_at: string;
}

export interface Promo {
  promo_id: number;
  promo_name: string;
  coupon: string;
  stripe_promotion_id?: string;
  stripe_coupon_id?: string;
  percent_off: number;
  start_date: string;
  expiry_date: string;
  status: string;
  applied_count: number;
  updated_at: string;
}

export interface APICharacter {
  id: number;
  name: string;
  gender: string;
  style: string;
  ethnicity: string;
  age: number;
  eye_colour: string;
  hair_style: string;
  hair_colour: string;
  body_type: string;
  breast_size: string | null;
  butt_size: string | null;
  dick_size: string | null;
  bio?: string;
  personality: string;
  voice_type: string;
  relationship_type: string;
  clothing: string;
  special_features: string;
  user_query_instructions: string;
  user_id: number;
  updated_at: string;
  image_url_s3: string | null;
  creator_role: string;
}

export interface Character {
  id: number;
  name: string;
  gender: string;
  style: string;
  ethnicity: string;
  age: number;
  eye_colour: string;
  hair_style: string;
  hair_colour: string;
  body_type: string;
  breast_size: string | null;
  butt_size: string | null;
  dick_size: string | null;
  bio?: string;
  personality: string;
  voice_type: string;
  relationship_type: string;
  clothing: string;
  special_features: string;
  user_query_instructions: string;
  user_id: number;
  updated_at: string;
  image_url_s3: string | null;
  creator_role: string;
  presigned_url?: string;
}

interface APIChatLog {
  id: number;
  session_id: string;
  character_id: number;
  role: string;
  content_type: string;
  user_query: string;
  ai_message: string;
  audio_url_user: string | null;
  audio_url_output: string | null;
  duration_input: number | null;
  duration_output: number | null;
  created_at: string;
}

interface ChatLog {
  id: number;
  session_id: string;
  character_id: number;
  role: string;
  content_type: string;
  user_query: string;
  ai_message: string;
  audio_url_user: string | null;
  audio_url_output: string | null;
  duration_input: number | null;
  duration_output: number | null;
  created_at: string;
}

interface ChatLogsFilters {
  character_id?: number;
  session_id?: string;
  content_type?: string;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
  user_id?: number;
}

export interface EngagementStats {
  total_messages: number;
  total_sessions: number;
  avg_messages_per_session: number;
  messages_per_character: { [key: string]: number };
  content_type_breakdown: { [key: string]: number };
  role_breakdown: { [key: string]: number };
  messages_over_time: { date: string; count: number }[];
  total_characters: number;
  most_used_character: string;
  prompt_usage_count: number;
  common_traits: { [key: string]: { [key: string]: number } };
}

export interface ChatModel {
  id: number;
  model_type: string;
  endpoint_id: string;
  chat_tone: string;
  prompt_standard: string;
  prompt_nsfw: string;
  prompt_ultra_nsfw: string;
  created_at: string;
  updated_at: string;
}

export interface ImageModel {
  id: number;
  model_type: string;
  endpoint_id: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export interface SpeechModel {
  id: number;
  model_type: string;
  endpoint_id: string;
  prompt: string;
  created_at: string;
  updated_at: string;
}

export interface EditChatModelResponse {
  detail: string;
  chat_model: ChatModel;
}

export interface EditImageModelResponse {
  detail: string;
  image_model: ImageModel;
}

export interface EditSpeechModelResponse {
  detail: string;
  speech_model: SpeechModel;
}

export interface AllModelsResponse {
  chat_models: ChatModel[];
  image_models: ImageModel[];
  speech_models: SpeechModel[];
}

export interface Config {
  id: number;
  parameter_name: string;
  parameter_value: string;
  parameter_description: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Subscription Plan Summary types
export interface SubscriptionPlanRow {
  plan_name: string;
  monthly_price: number | null; // may be null if not provided
  active_subscribers: number;
  retention_rate: number | null; // expect value 0-1 or percentage (backend unclear) – we'll normalize in component
  churn_rate: number | null;     // same as above
  avg_subscription_duration: number | null; // months (assumed)
}

export interface SubscriptionPlanSummaryResponse {
  as_of_date: string | null;
  total_active_subscribers: number;
  plans: SubscriptionPlanRow[];
  highest_retention_plan?: string | null;
  highest_churn_plan?: string | null; // not in sample but useful; component can derive if absent
}

class APIService {
  // Fetch all coin transactions for admin
  async getAllCoinTransactions(): Promise<any[]> {
    try {
  // Debug: log baseURL and endpoint for tracing
  const configuredBase = (this.api && this.api.defaults && this.api.defaults.baseURL) || import.meta.env.VITE_API_BASE_URL || (typeof window !== 'undefined' ? `${window.location.origin}/api/v1` : '');
  try { console.debug('[apiService] baseURL=', configuredBase); } catch {}
  const endpoint = '/admin/pricing/all-coin-transactions';
  const fullUrl = `${configuredBase.replace(/\/$/, '')}${endpoint}`;
  console.debug('[apiService] calling GET', fullUrl);
      // include auth header like the axios instance does
      let headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null;
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          headers['Authorization'] = `bearer ${tokenOnly}`;
        }
      } catch (e) {
        // ignore
      }
      console.debug('[apiService] GET headers=', Object.keys(headers));
      // use axios directly with full URL to avoid any instance baseURL issues
      const response = await axios.get<any[]>(fullUrl, { headers });
  console.debug('[apiService] received response for coin transactions, status=', response.status);
  return response.data;
    } catch (error) {
      console.error('Error fetching coin transactions:', error);
      throw error;
    }
  }
  private api: AxiosInstance;
  // ...existing code...

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Inject the currently signed-in user's token (if any) on each request.
    // Tokens are stored in localStorage under 'pronily:auth:token' by the sign-in flow.
    this.api.interceptors.request.use((config) => {
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('pronily:auth:token') : null;
        if (stored) {
          const tokenOnly = stored.replace(/^bearer\s+/i, '').trim();
          // axios headers typing can be weird in TS; cast to any for assignment
          (config.headers as any)['Authorization'] = `bearer ${tokenOnly}`;
        }
      } catch (e) {
        // ignore localStorage errors
      }
      return config;
    });
  }

  // Transform API response to match our UI data structure
  private transformUserData(apiUser: APIUser): User {
    return {
      id: apiUser.id,
      email: apiUser.email,
      full_name: apiUser.full_name,
      role: apiUser.role,
      status: apiUser.is_active ? 'Active' : 'Banned',
      created_at: apiUser.created_at.split('T')[0], // Format date
      chat_count: 0, // Not provided by API, placeholder
      characters_created: 0, // Not provided by API, placeholder
      avg_session_length: '—', // Not provided by API, placeholder
    };
  }

  // Transform API chat log response to match our UI data structure
  private transformChatLogData(apiChatLog: APIChatLog): ChatLog {
    return {
      id: apiChatLog.id,
      session_id: apiChatLog.session_id,
      character_id: apiChatLog.character_id,
      role: apiChatLog.role,
      content_type: apiChatLog.content_type.replace('ContentType.', '').toLowerCase(),
      user_query: apiChatLog.user_query,
      ai_message: apiChatLog.ai_message,
      audio_url_user: apiChatLog.audio_url_user,
      audio_url_output: apiChatLog.audio_url_output,
      duration_input: apiChatLog.duration_input,
      duration_output: apiChatLog.duration_output,
      created_at: apiChatLog.created_at,
    };
  }

  private transformCharacterData(apiCharacter: APICharacter): Character {
    return {
      id: apiCharacter.id,
      name: apiCharacter.name,
      gender: apiCharacter.gender,
      style: apiCharacter.style,
      ethnicity: apiCharacter.ethnicity,
      age: apiCharacter.age,
      eye_colour: apiCharacter.eye_colour,
      hair_style: apiCharacter.hair_style,
      hair_colour: apiCharacter.hair_colour,
      body_type: apiCharacter.body_type,
      breast_size: apiCharacter.breast_size,
      butt_size: apiCharacter.butt_size,
      dick_size: apiCharacter.dick_size,
  // map bio if present (APIs may vary between 'bio' or 'description')
  bio: (apiCharacter as any).bio ?? (apiCharacter as any).description ?? '',
      personality: apiCharacter.personality,
      voice_type: apiCharacter.voice_type,
      relationship_type: apiCharacter.relationship_type,
      clothing: apiCharacter.clothing,
      special_features: apiCharacter.special_features,
      user_query_instructions: apiCharacter.user_query_instructions,
      user_id: apiCharacter.user_id,
      updated_at: apiCharacter.updated_at,
      image_url_s3: apiCharacter.image_url_s3,
      creator_role: apiCharacter.creator_role,
    };
  }

  private transformPricingData(apiPlan: APIPricingPlan): PricingPlan {
    return {
      plan_id: apiPlan.plan_id,
      plan_name: apiPlan.plan_name,
      pricing_id: apiPlan.pricing_id,
  currency: apiPlan.currency,
  discount: apiPlan.discount ?? 0,
      price: apiPlan.price,
      billing_cycle: apiPlan.billing_cycle,
      coin_reward: apiPlan.coin_reward,
      status: apiPlan.status,
      updated_at: apiPlan.updated_at,
    };
  }

  private transformPromoData(apiPromo: APIPromo): Promo {
    return {
      promo_id: apiPromo.promo_id,
      promo_name: apiPromo.promo_name,
      coupon: apiPromo.coupon,
  stripe_promotion_id: apiPromo.stripe_promotion_id,
  stripe_coupon_id: apiPromo.stripe_coupon_id,
      percent_off: apiPromo.percent_off,
      start_date: apiPromo.start_date,
      expiry_date: apiPromo.expiry_date,
      status: apiPromo.status,
      applied_count: apiPromo.applied_count,
      updated_at: apiPromo.updated_at,
    };
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await this.api.get<APIUser[]>('/admin/users');
      return response.data.map(user => this.transformUserData(user));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getCharacters(): Promise<Character[]> {
    try {
      // Add timestamp to prevent caching and ensure fresh signed URLs
      const timestamp = Date.now();
      const response = await this.api.get<APICharacter[]>(`/admin/characters/get-all?_t=${timestamp}`);
      return response.data.map(character => this.transformCharacterData(character));
    } catch (error) {
      console.error('Error fetching characters:', error);
      throw error;
    }
  }

  async getPricingPlans(): Promise<PricingPlan[]> {
    try {
  // New public subscription endpoint
  const response = await this.api.get<APIPricingPlan[]>('/subscription/get-pricing');
      return response.data.map(plan => this.transformPricingData(plan));
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      throw error;
    }
  }

  async createPricingPlan(planData: { 
    plan_name: string; 
    pricing_id: string; 
    currency: string;
    price: number; 
    billing_cycle: string; 
    coin_reward: number;
    status: string; 
  }): Promise<{ success: boolean; message: string; data?: PricingPlan }> {
    try {
      const response = await this.api.post<{ detail: string; data?: APIPricingPlan }>('/admin/pricing/create-pricing', planData);
      return { 
        success: true, 
        message: response.data.detail,
        data: response.data.data ? this.transformPricingData(response.data.data) : undefined
      };
    } catch (error) {
      console.error('Error creating pricing plan:', error);
      throw error;
    }
  }

  async updatePricingPlan(planId: number, updates: { pricing_id?: string; price?: number; coin_reward?: number; status?: string; discount?: number }): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.put<{ detail: string }>(`/admin/pricing/edit-pricing/${planId}`, updates);
      return { success: true, message: response.data.detail };
    } catch (error) {
      console.error('Error updating pricing plan:', error);
      throw error;
    }
  }

  async getPromos(): Promise<Promo[]> {
    try {
  // Use public subscription endpoint for promos
  const response = await this.api.get<APIPromo[]>('/subscription/get-promo');
      return response.data.map(promo => this.transformPromoData(promo));
    } catch (error) {
      console.error('Error fetching promos:', error);
      throw error;
    }
  }

  async getChatLogs(filters?: ChatLogsFilters): Promise<ChatLog[]> {
    try {
      const params = new URLSearchParams();
      
      // If user_id is provided, use the specific user endpoint
      if (filters?.user_id) {
        params.append('user_id', filters.user_id.toString());
        
        const response = await this.api.get<APIChatLog[]>(`/chats/all?${params.toString()}`);
        let chatLogs = response.data.map(chatLog => this.transformChatLogData(chatLog));
        
        // Apply client-side filtering since the backend only supports user_id filtering
        if (filters?.character_id) {
          chatLogs = chatLogs.filter(log => log.character_id === filters.character_id);
        }
        if (filters?.session_id) {
          chatLogs = chatLogs.filter(log => log.session_id.toLowerCase().includes(filters.session_id!.toLowerCase()));
        }
        if (filters?.content_type) {
          chatLogs = chatLogs.filter(log => log.content_type === filters.content_type);
        }
        if (filters?.start_date) {
          chatLogs = chatLogs.filter(log => new Date(log.created_at) >= new Date(filters.start_date!));
        }
        if (filters?.end_date) {
          chatLogs = chatLogs.filter(log => new Date(log.created_at) <= new Date(filters.end_date!));
        }
        if (filters?.search) {
          chatLogs = chatLogs.filter(log =>
            log.user_query.toLowerCase().includes(filters.search!.toLowerCase()) ||
            log.ai_message.toLowerCase().includes(filters.search!.toLowerCase())
          );
        }
        
        return chatLogs;
      }
      
      // Fallback to admin endpoint for general chat logs (if available)
      if (filters?.character_id) params.append('character_id', filters.character_id.toString());
      if (filters?.session_id) params.append('session_id', filters.session_id);
      if (filters?.content_type) params.append('content_type', filters.content_type);
      if (filters?.start_date) params.append('start_date', filters.start_date);
      if (filters?.end_date) params.append('end_date', filters.end_date);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.per_page) params.append('per_page', filters.per_page.toString());

      const response = await this.api.get<APIChatLog[]>(`/chats/all${params.toString() ? '?' + params.toString() : ''}`);
      return response.data.map(chatLog => this.transformChatLogData(chatLog));
    } catch (error) {
      console.error('Error fetching chat logs:', error);
      throw error;
    }
  }

  async getCharactersByUserId(userId: number): Promise<Character[]> {
    try {
      const response = await this.api.get<{ characters: { character: APICharacter }[] }>(`/characters/fetch-by-user-id/${userId}`);
      return response.data.characters.map(item => this.transformCharacterData(item.character));
    } catch (error) {
      console.error('Error fetching characters:', error);
      throw error;
    }
  }

  async getEngagementStats(userId: number): Promise<EngagementStats> {
    try {
      const response = await this.api.get<EngagementStats>(`/admin/users/engagement-stats/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching engagement stats:', error);
      throw error;
    }
  }
  async createCheckoutSession(plan_name: string, email: string, frequency: string): Promise<{ session_id: string }> {
    try {
      const response = await this.api.post<{ session_id: string }>('/subscription/create-checkout-session', { plan_name, email, frequency });
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }
  async deactivateUser(userId: number): Promise<void> {
    try {
      await this.api.post(`/admin/users/deactivate/${userId}`);
    } catch (error) {
      console.error(`Error deactivating user ${userId}:`, error);
      throw error;
    }
  }
  async activateUser(userId: number): Promise<void> {
    try {
      await this.api.post(`/admin/users/activate/${userId}`);
    } catch (error) {
      console.error(`Error activating user ${userId}:`, error);
      throw error;
    }
  }
  async deleteUser(userId: number): Promise<void> {
    try {
      await this.api.post(`/admin/users/delete/${userId}`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }
  
  async editUser(userId: number, data: { full_name?: string; role?: string; status?: string }): Promise<void> {
    try {
      // Use PUT for edits to follow other endpoints' convention
      await this.api.put(`/admin/users/edit/${userId}`, data);
    } catch (error) {
      console.error(`Error editing user ${userId}:`, error);
      throw error;
    }
  }
  // ...existing code...

  async getAllModels(): Promise<AllModelsResponse> {
    try {
      const response = await this.api.get<AllModelsResponse>('/admin/models/get_all_models');
      return response.data;
    } catch (error) {
      console.error('Error fetching all models:', error);
      throw error;
    }
  }

  async editChatModel(modelId: number, data: Partial<ChatModel>): Promise<EditChatModelResponse> {
    try {
      const { id, created_at, updated_at, ...updateData } = data;
      const payload = { updates: updateData };
      const response = await this.api.put<EditChatModelResponse>(`/admin/models/update_chat_model/${modelId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error editing chat model ${modelId}:`, error);
      throw error;
    }
  }

  async editImageModel(modelId: number, data: Partial<ImageModel>): Promise<EditImageModelResponse> {
    try {
      const { id, created_at, updated_at, ...updateData } = data;
      const payload = { updates: updateData };
      const response = await this.api.put<EditImageModelResponse>(`/admin/models/update_image_model/${modelId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error editing image model ${modelId}:`, error);
      throw error;
    }
  }

  async editSpeechModel(modelId: number, data: Partial<SpeechModel>): Promise<EditSpeechModelResponse> {
    try {
      const { id, created_at, updated_at, ...updateData } = data;
      const payload = { updates: updateData };
      const response = await this.api.put<EditSpeechModelResponse>(`/admin/models/update_speech_model/${modelId}`, payload);
      return response.data;
    } catch (error) {
      console.error(`Error editing speech model ${modelId}:`, error);
      throw error;
    }
  }

  async getConfigs(): Promise<Config[]> {
    try {
      const response = await this.api.get<Config[]>('/admin/configs/');
      return response.data;
    } catch (error) {
      console.error('Error fetching configs:', error);
      throw error;
    }
  }

  async updateConfig(id: number, data: { parameter_value: string; parameter_description: string }): Promise<void> {
    try {
      await this.api.put(`/admin/configs/edit/${id}`, data);
    } catch (error) {
      console.error(`Error updating config ${id}:`, error);
      throw error;
    }
  }

  async createConfig(data: {
    parameter_name: string;
    parameter_value: string;
    parameter_description: string;
    category: string;
  }): Promise<void> {
    try {
      await this.api.post('/admin/configs/create', data);
    } catch (error) {
      console.error('Error creating config:', error);
      throw error;
    }
  }

  async deleteConfig(id: number): Promise<void> {
    try {
      await this.api.delete(`/admin/configs/delete/${id}`);
    } catch (error) {
      console.error(`Error deleting config ${id}:`, error);
      throw error;
    }
  }

  async updatePromo(promoId: number, data: {
    promo_name: string;
    percent_off: number;
    start_date: string;
    expiry_date: string;
    status: string;
  }): Promise<void> {
    try {
      await this.api.put(`/admin/pricing/edit-promo/${promoId}`, data);
    } catch (error) {
      console.error(`Error updating promo ${promoId}:`, error);
      throw error;
    }
  }

  async createPromo(data: {
    promo_name: string;
    coupon: string;
    percent_off: number;
    start_date: string;
    expiry_date: string;
    status: string;
  }): Promise<void> {
    try {
      await this.api.post('/admin/pricing/create-promo', data);
    } catch (error) {
      console.error('Error creating promo:', error);
      throw error;
    }
  }

  async createUser(payload: {
    full_name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.api.post('/admin/users/create', payload);
  }

  async setPassword(payload: {
    uid: number;
    token: string;
    password: string;
  }): Promise<void> {
    try {
      await this.api.post('/auth/set-password', payload);
    } catch (error) {
      console.error('Error setting password:', error);
      throw error;
    }
  }

  async createCharacter(payload: {
    name: string;
    gender: string;
    style: string;
    ethnicity: string;
    age: number;
    eye_colour: string;
    hair_style: string;
    hair_colour: string;
    body_type: string;
    breast_size: string | null;
    butt_size: string | null;
    dick_size: string | null;
    personality: string;
    voice_type: string;
    relationship_type: string;
    clothing: string;
    special_features: string;
    user_query_instructions: string | null;
  }): Promise<APICharacter> {
    try {
      const response = await this.api.post<APICharacter>('/characters/create', payload);
      return response.data;
    } catch (error) {
      console.error('Error creating character:', error);
      throw error;
    }
  }

  async editCharacter(characterId: number, payload: {
    name: string;
    gender: string;
    style: string;
    ethnicity: string;
    age: number;
    eye_colour: string;
    hair_style: string;
    hair_colour: string;
    body_type: string;
    breast_size: string | null;
    butt_size: string | null;
    dick_size: string | null;
    personality: string;
    voice_type: string;
    relationship_type: string;
    clothing: string;
    special_features: string;
    user_query_instructions: string | null;
  }): Promise<APICharacter> {
    try {
      const response = await this.api.post<APICharacter>(`/characters/edit-by-id/${characterId}`, payload);
      return response.data;
    } catch (error) {
      console.error('Error editing character:', error);
      throw error;
    }
  }

  async getPresignedUrlsByIds(payload: Record<number, string>): Promise<Record<number, string>> {
    try {
      const response = await this.api.post<Record<number, string>>('/admin/characters/presigned-urls-by-ids', payload);
      return response.data;
    } catch (error) {
      console.error('Error getting presigned URLs:', error);
      throw error;
    }
  }

  async getKpiMetrics(params: {
    asOfDate?: string;
    period?: string;
  } = {}): Promise<{
    total_revenue: number;
    active_users: number;
    conversion_rate: number;
    avg_order_value: number;
    currency: string;
    previous_period?: {
      total_revenue: number;
      active_users: number;
      conversion_rate: number;
      avg_order_value: number;
    };
  }> {
    try {
      console.log('🚀 API Service: Calling KPI metrics endpoint with params:', params);
      const response = await this.api.get('/admin/dashboard/metrics/summary', {
        params: {
          as_of_date: params.asOfDate,
          period: params.period || 'monthly',
        }
      });
      console.log('✅ API Service: KPI metrics response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ API Service: Error fetching KPI metrics:', error);
      throw error;
    }
  }

  /**
   * Revenue trends (stacked subscription vs coin revenue) over time.
   * GET /admin/dashboard/revenue/trends
   * Query params: start_date, end_date, interval (daily|weekly|monthly|quarterly), currency
   */
  async getRevenueTrends(params: {
    startDate: string;
    endDate: string;
    interval?: string; // optional; defaults to monthly if undefined
  }): Promise<{
    data: Array<{
      period: string;
      subscription_revenue: number;
      coin_revenue: number;
      total_revenue: number;
    }>;
    total_revenue_all_periods: number;
    avg_monthly_revenue: number;
  }> {
    try {
      const response = await this.api.get('/admin/dashboard/revenue/trends', {
        params: {
          start_date: params.startDate,
          end_date: params.endDate,
          interval: params.interval || 'monthly',
        },
      });
      const raw = response.data as any;
      const rows: any[] = Array.isArray(raw?.revenue_trends)
        ? raw.revenue_trends
        : Array.isArray(raw?.data)
          ? raw.data
          : [];
      return {
        data: rows.map(r => ({
          period: r.period,
          subscription_revenue: Number(r.subscription_revenue) || 0,
            coin_revenue: Number(r.coin_revenue) || 0,
          total_revenue: Number(r.total_revenue) || (Number(r.subscription_revenue)||0) + (Number(r.coin_revenue)||0),
        })),
        total_revenue_all_periods: Number(raw.total_revenue_all_periods) || rows.reduce((s, r) => s + ((Number(r.total_revenue) || (Number(r.subscription_revenue)||0)+(Number(r.coin_revenue)||0))), 0),
        avg_monthly_revenue: Number(raw.avg_monthly_revenue) || 0,
      };
    } catch (e) {
      console.error('[apiService.getRevenueTrends] failed', e);
      throw e;
    }
  }

  /**
   * Fetch subscription plan summary metrics
   * Primary admin endpoint: /admin/dashboard/subscriptions/plan-summary
   * (Prompt also referenced /api/monetization/... – if that exists we could fall back to it.)
   */
  async getSubscriptionPlanSummary(params: { asOfDate?: string } = {}): Promise<SubscriptionPlanSummaryResponse> {
    try {
      const response = await this.api.get('/admin/dashboard/subscriptions/plan-summary', {
        params: { as_of_date: params.asOfDate }
      });
      const raw = response.data as any;
      const plans: SubscriptionPlanRow[] = Array.isArray(raw?.plans)
        ? raw.plans.map((p: any) => ({
            plan_name: p.plan_name,
            monthly_price: p.monthly_price ?? null,
            active_subscribers: Number(p.active_subscribers) || 0,
            retention_rate: p.retention_rate === null || p.retention_rate === undefined ? null : Number(p.retention_rate),
            churn_rate: p.churn_rate === null || p.churn_rate === undefined ? null : Number(p.churn_rate),
            avg_subscription_duration: p.avg_subscription_duration === null || p.avg_subscription_duration === undefined ? null : Number(p.avg_subscription_duration),
          }))
        : [];

      // Derive highest churn if backend doesn't send it
      let highestChurn: string | null = raw?.highest_churn_plan ?? null;
      if (!highestChurn && plans.length) {
        const churnSorted = [...plans].filter(p => p.churn_rate !== null).sort((a,b) => (b.churn_rate||0) - (a.churn_rate||0));
        highestChurn = churnSorted[0]?.plan_name || null;
      }

      return {
        as_of_date: raw?.as_of_date ?? null,
        total_active_subscribers: Number(raw?.total_active_subscribers) || plans.reduce((s,p)=>s+p.active_subscribers,0),
        plans,
        highest_retention_plan: raw?.highest_retention_plan ?? (plans.length ? [...plans].filter(p=>p.retention_rate!==null).sort((a,b)=>(b.retention_rate||0)-(a.retention_rate||0))[0]?.plan_name : null),
        highest_churn_plan: highestChurn,
      };
    } catch (e) {
      console.error('[apiService.getSubscriptionPlanSummary] failed', e);
      throw e;
    }
  }

  /**
   * Subscription history time‑series.
   * Primary (anticipated) admin endpoint: /admin/dashboard/subscriptions/history
   * Prompt referenced raw base (/subscriptions/history) and /api/monetization/subscriptions/history – we'll try fallbacks.
   * Query params: start_date, end_date, metric=(active_count|new_subscriptions|cancellations), interval=(monthly|quarterly)
   */
  async getSubscriptionHistory(params: {
    startDate: string;
    endDate: string;
    metric: 'active_count' | 'new_subscriptions' | 'cancellations';
    interval: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  }): Promise<{ metric: string; interval: string; history: { period: string; value: number }[] }> {
    const endpoints = [
      '/admin/dashboard/subscriptions/history',
      '/subscriptions/history',
      '/api/monetization/subscriptions/history'
    ];
    const query = {
      start_date: params.startDate,
      end_date: params.endDate,
      metric: params.metric,
      interval: params.interval,
    } as const;
    let lastError: any = null;
    for (const ep of endpoints) {
      try {
        const res = await this.api.get(ep, { params: query });
        const raw = res.data as any;
        const historyArr: any[] = Array.isArray(raw?.history) ? raw.history : Array.isArray(raw?.data) ? raw.data : [];
        return {
          metric: raw?.metric || params.metric,
            interval: raw?.interval || params.interval,
          history: historyArr.map(r => ({ period: String(r.period), value: Number(r.value) || 0 }))
        };
      } catch (e) {
        lastError = e;
        // try next endpoint
      }
    }

    console.error('[apiService.getSubscriptionHistory] all endpoints failed', lastError);
    throw lastError;
  }

  // Fetch all orders for promo/pricing history
  async getAllOrders(): Promise<any[]> {
    try {
      const response = await this.api.get<any[]>('/admin/pricing/all-orders');
      return response.data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }
}

export const apiService = new APIService();