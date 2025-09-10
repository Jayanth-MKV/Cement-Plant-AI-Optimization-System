import { NavigationItem } from '@/types/plant-data';

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    id: 'executive',
    label: 'Executive Dashboard',
    icon: '📊'
  },
  {
    id: 'rawmaterials',
    label: 'Raw Materials',
    icon: '⚡'
  },
  {
    id: 'kiln',
    label: 'Kiln Operations',
    icon: '🔥'
  },
  {
    id: 'quality',
    label: 'Quality Control',
    icon: '✅'
  },
  {
    id: 'fuel',
    label: 'Fuel Optimization',
    icon: '⛽'
  },
  {
    id: 'integration',
    label: 'Cross-Process',
    icon: '🔗'
  },
  {
    id: 'utilities',
    label: 'Utilities',
    icon: '⚙️'
  },
  {
    id: 'insights',
    label: 'AI Insights',
    icon: '🤖'
  }
];

export const CHART_COLORS = {
  primary: '#1FB8CD',
  secondary: '#FFC185',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
} as const;

export const STATUS_COLORS = {
  success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
} as const;

export const REFRESH_INTERVALS = {
  REAL_TIME: 1000,
  FAST: 5000,
  NORMAL: 10000,
  SLOW: 30000
} as const;
