import { 
  API_CONFIG, 
  DATA_ROUTES, 
  AI_ROUTES, 
  ANALYTICS_ROUTES,
  SYSTEM_ROUTES,
  HTTP_METHODS,
  API_ERROR_MESSAGES 
} from '@/constants/api';
import type {
  PlantOverview,
  RawMaterialData,
  GrindingData,
  KilnData,
  QualityData,
  AlternativeFuelsData,
  UtilitiesData,
  AIRecommendation,
  OptimizationResult,
  CombinedPlantData,
  PlantReport,
  OptimizationRequest,
  ChemistryAnalysis,
  GrindingEfficiency,
  FuelMixOptimization,
  OEECalculation,
  KPISummary,
  APIResponse,
} from '@/types/api';

class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

class APIService {
  private baseURL: string;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
  }

  private async fetchWithRetry<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<APIResponse<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${url}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new APIError(
          `HTTP error! status: ${response.status}`,
          response.status
        );
      }

      const data = await response.json();
      
      return {
        data,
        success: true,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (attempt < this.retryAttempts && (error as any)?.name !== 'AbortError') {
        console.warn(`API call failed (attempt ${attempt}), retrying...`, error);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.fetchWithRetry<T>(url, options, attempt + 1);
      }

      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof Error
        ? error.message
        : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Data API Methods
  async getPlantOverview(): Promise<APIResponse<PlantOverview>> {
    return this.fetchWithRetry<PlantOverview>(DATA_ROUTES.PLANT_OVERVIEW);
  }

  async getRawMaterialData(limit: number = 3): Promise<APIResponse<RawMaterialData[]>> {
    return this.fetchWithRetry<RawMaterialData[]>(
      `${DATA_ROUTES.RAW_MATERIAL}?limit=${limit}`
    );
  }

  async getGrindingData(limit: number = 2): Promise<APIResponse<GrindingData[]>> {
    return this.fetchWithRetry<GrindingData[]>(
      `${DATA_ROUTES.GRINDING}?limit=${limit}`
    );
  }

  async getKilnData(limit: number = 1): Promise<APIResponse<KilnData[]>> {
    return this.fetchWithRetry<KilnData[]>(
      `${DATA_ROUTES.KILN}?limit=${limit}`
    );
  }

  async getQualityData(limit: number = 1): Promise<APIResponse<QualityData[]>> {
    return this.fetchWithRetry<QualityData[]>(
      `${DATA_ROUTES.QUALITY}?limit=${limit}`
    );
  }

  async getAlternativeFuelsData(limit: number = 2): Promise<APIResponse<AlternativeFuelsData[]>> {
    return this.fetchWithRetry<AlternativeFuelsData[]>(
      `${DATA_ROUTES.ALTERNATIVE_FUELS}?limit=${limit}`
    );
  }

  async getUtilitiesData(limit: number = 10): Promise<APIResponse<UtilitiesData[]>> {
    return this.fetchWithRetry<UtilitiesData[]>(
      `${DATA_ROUTES.UTILITIES}?limit=${limit}`
    );
  }

  async getCombinedPlantData(): Promise<APIResponse<CombinedPlantData>> {
    return this.fetchWithRetry<CombinedPlantData>(DATA_ROUTES.COMBINED);
  }

  // AI API Methods
  async getAIRecommendations(
    limit: number = 5, 
    priorityFilter?: number
  ): Promise<APIResponse<AIRecommendation[]>> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (priorityFilter) {
      params.append('priority_filter', priorityFilter.toString());
    }
    return this.fetchWithRetry<AIRecommendation[]>(
      `${AI_ROUTES.RECOMMENDATIONS}?${params.toString()}`
    );
  }

  async triggerOptimization(
    processArea: 'feed' | 'grinding' | 'kiln' | 'fuel' | 'quality',
    request?: OptimizationRequest
  ): Promise<APIResponse<any>> {
    return this.fetchWithRetry<any>(
      AI_ROUTES.OPTIMIZE[processArea.toUpperCase() as keyof typeof AI_ROUTES.OPTIMIZE],
      {
        method: HTTP_METHODS.POST,
        body: request ? JSON.stringify(request) : undefined,
      }
    );
  }

  async markRecommendationAction(recommendationId: number): Promise<APIResponse<any>> {
    return this.fetchWithRetry<any>(
      AI_ROUTES.MARK_ACTION(recommendationId),
      {
        method: HTTP_METHODS.POST,
      }
    );
  }

  async getOptimizationHistory(limit: number = 10): Promise<APIResponse<OptimizationResult[]>> {
    return this.fetchWithRetry<OptimizationResult[]>(
      `${AI_ROUTES.OPTIMIZATION_HISTORY}?limit=${limit}`
    );
  }

  async getKPISummary(): Promise<APIResponse<KPISummary>> {
    return this.fetchWithRetry<KPISummary>(AI_ROUTES.KPI_SUMMARY);
  }

  // Analytics API Methods
  async getPlantReport(): Promise<APIResponse<PlantReport>> {
    return this.fetchWithRetry<PlantReport>(ANALYTICS_ROUTES.PLANT_REPORT);
  }

  async getChemistryAnalysis(): Promise<APIResponse<ChemistryAnalysis>> {
    return this.fetchWithRetry<ChemistryAnalysis>(ANALYTICS_ROUTES.CHEMISTRY);
  }

  async getGrindingEfficiency(): Promise<APIResponse<GrindingEfficiency>> {
    return this.fetchWithRetry<GrindingEfficiency>(ANALYTICS_ROUTES.GRINDING_EFFICIENCY);
  }

  async getFuelMixOptimization(targetTsr: number = 30): Promise<APIResponse<FuelMixOptimization>> {
    return this.fetchWithRetry<FuelMixOptimization>(
      `${ANALYTICS_ROUTES.FUEL_MIX}?target_tsr=${targetTsr}`
    );
  }

  async calculateOEE(
    availability: number = 87,
    performance: number = 92,
    quality: number = 95
  ): Promise<APIResponse<OEECalculation>> {
    const params = new URLSearchParams({
      availability_pct: availability.toString(),
      performance_pct: performance.toString(),
      quality_pct: quality.toString(),
    });
    return this.fetchWithRetry<OEECalculation>(
      `${ANALYTICS_ROUTES.MATH.OEE}?${params.toString()}`
    );
  }

  // System API Methods
  async healthCheck(): Promise<APIResponse<{ status: string; timestamp: string; version: string }>> {
    return this.fetchWithRetry<{ status: string; timestamp: string; version: string }>(
      SYSTEM_ROUTES.HEALTH
    );
  }

  async getSystemInfo(): Promise<APIResponse<any>> {
    return this.fetchWithRetry<any>(SYSTEM_ROUTES.ROOT);
  }
}

// Create singleton instance
export const apiService = new APIService();

// Export individual service functions for easier importing
export const {
  getPlantOverview,
  getRawMaterialData,
  getGrindingData,
  getKilnData,
  getQualityData,
  getAlternativeFuelsData,
  getUtilitiesData,
  getCombinedPlantData,
  getAIRecommendations,
  triggerOptimization,
  markRecommendationAction,
  getOptimizationHistory,
  getKPISummary,
  getPlantReport,
  getChemistryAnalysis,
  getGrindingEfficiency,
  getFuelMixOptimization,
  calculateOEE,
  healthCheck,
  getSystemInfo,
} = apiService;