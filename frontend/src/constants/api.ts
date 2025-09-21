// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  WEBSOCKET_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  TIMEOUT: 10000, // 10 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// Data Routes - Plant data endpoints
export const DATA_ROUTES = {
  PLANT_OVERVIEW: '/api/data/plant-overview',
  RAW_MATERIAL: '/api/data/raw-material',
  GRINDING: '/api/data/grinding', 
  KILN: '/api/data/kiln',
  QUALITY: '/api/data/quality',
  ALTERNATIVE_FUELS: '/api/data/alternative-fuels',
  UTILITIES: '/api/data/utilities',
  COMBINED: '/api/data/combined', // Gets all plant data in one call
} as const;

// AI Routes - AI optimization and recommendations
export const AI_ROUTES = {
  RECOMMENDATIONS: '/api/ai/recommendations',
  OPTIMIZE_BASE: '/api/ai/optimize', // Base path for optimization
  OPTIMIZE: {
    FEED: '/api/ai/optimize/feed',
    GRINDING: '/api/ai/optimize/grinding', 
    KILN: '/api/ai/optimize/kiln',
    FUEL: '/api/ai/optimize/fuel',
    QUALITY: '/api/ai/optimize/quality',
  },
  MARK_ACTION: (recommendationId: number) => `/api/ai/recommendations/${recommendationId}/action`,
  OPTIMIZATION_HISTORY: '/api/ai/optimization-history',
  KPI_SUMMARY: '/api/ai/kpi-summary',
} as const;

// Analytics Routes - Advanced analytics and reports
export const ANALYTICS_ROUTES = {
  PLANT_REPORT: '/api/analytics/plant-report',
  CHEMISTRY: '/api/analytics/chemistry',
  GRINDING_EFFICIENCY: '/api/analytics/grinding',
  FUEL_MIX: '/api/analytics/fuel',
  MATH: {
    OEE: '/api/analytics/math/oee',
  },
  ADVANCED: {
    CIRCULATING_LOAD: '/api/analytics/advanced/circulating-load',
    SEPARATOR: '/api/analytics/advanced/separator',
  },
  HEALTH: '/api/analytics/health',
} as const;

// WebSocket Routes - Real-time connections
export const WEBSOCKET_ROUTES = {
  PLANT_DATA: '/ws/plant-data',
  ALERTS: '/ws/alerts',
  STATUS: '/ws/status',
} as const;

// System Routes - Health checks and status
export const SYSTEM_ROUTES = {
  ROOT: '/',
  HEALTH: '/health',
} as const;

// Route to Module Mapping - Which routes serve which frontend modules
export const MODULE_ROUTES = {
  EXECUTIVE_DASHBOARD: {
    primary: [DATA_ROUTES.COMBINED, DATA_ROUTES.PLANT_OVERVIEW],
    secondary: [ANALYTICS_ROUTES.PLANT_REPORT, AI_ROUTES.KPI_SUMMARY],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  FUEL_OPTIMIZATION: {
    primary: [DATA_ROUTES.ALTERNATIVE_FUELS, DATA_ROUTES.KILN],
    secondary: [AI_ROUTES.OPTIMIZE.FUEL, ANALYTICS_ROUTES.FUEL_MIX],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  RAW_MATERIALS: {
    primary: [DATA_ROUTES.RAW_MATERIAL],
    secondary: [AI_ROUTES.OPTIMIZE.FEED, ANALYTICS_ROUTES.CHEMISTRY],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  KILN_OPERATIONS: {
    primary: [DATA_ROUTES.KILN],
    secondary: [AI_ROUTES.OPTIMIZE.KILN, ANALYTICS_ROUTES.CHEMISTRY],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  QUALITY_CONTROL: {
    primary: [DATA_ROUTES.QUALITY],
    secondary: [AI_ROUTES.OPTIMIZE.QUALITY, ANALYTICS_ROUTES.CHEMISTRY],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  UTILITIES: {
    primary: [DATA_ROUTES.UTILITIES],
    secondary: [ANALYTICS_ROUTES.GRINDING_EFFICIENCY, ANALYTICS_ROUTES.MATH.OEE],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  GRINDING_OPERATIONS: {
    primary: [DATA_ROUTES.GRINDING],
    secondary: [AI_ROUTES.OPTIMIZE.GRINDING, ANALYTICS_ROUTES.GRINDING_EFFICIENCY],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
  AI_INSIGHTS: {
    primary: [AI_ROUTES.RECOMMENDATIONS, AI_ROUTES.OPTIMIZATION_HISTORY],
    secondary: [AI_ROUTES.KPI_SUMMARY, ANALYTICS_ROUTES.HEALTH],
    websocket: WEBSOCKET_ROUTES.ALERTS,
  },
  CROSS_PROCESS: {
    primary: [DATA_ROUTES.COMBINED],
    secondary: [ANALYTICS_ROUTES.PLANT_REPORT, ANALYTICS_ROUTES.MATH.OEE],
    websocket: WEBSOCKET_ROUTES.PLANT_DATA,
  },
} as const;

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
} as const;

// Request Parameters - Common query parameters
export const QUERY_PARAMS = {
  LIMIT: 'limit',
  PRIORITY_FILTER: 'priority_filter', 
  TARGET_TSR: 'target_tsr',
  AVAILABILITY_PCT: 'availability_pct',
  PERFORMANCE_PCT: 'performance_pct',
  QUALITY_PCT: 'quality_pct',
  CLIENT_ID: 'client_id',
} as const;

// Error Messages
export const API_ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error - please check your connection',
  SERVER_ERROR: 'Server error - please try again later',
  TIMEOUT_ERROR: 'Request timeout - please try again',
  INVALID_RESPONSE: 'Invalid response from server',
  WEBSOCKET_CONNECTION_FAILED: 'Failed to connect to real-time updates',
  WEBSOCKET_RECONNECTING: 'Reconnecting to real-time updates...',
} as const;

// Success Messages
export const API_SUCCESS_MESSAGES = {
  DATA_LOADED: 'Data loaded successfully',
  OPTIMIZATION_STARTED: 'Optimization started successfully',
  RECOMMENDATION_MARKED: 'Recommendation marked as completed',
  WEBSOCKET_CONNECTED: 'Real-time updates connected',
} as const;