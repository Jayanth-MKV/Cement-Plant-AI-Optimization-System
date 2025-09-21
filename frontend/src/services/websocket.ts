'use client';

import { 
  API_CONFIG, 
  WEBSOCKET_ROUTES, 
  API_ERROR_MESSAGES, 
  API_SUCCESS_MESSAGES 
} from '@/constants/api';
import type { 
  CombinedPlantData, 
  AIRecommendation, 
  WebSocketStatus 
} from '@/types/api';

export interface WebSocketMessage {
  type: 'initial' | 'update' | 'plant_update' | 'alert' | 'welcome' | 'error';
  data?: any;
  message?: string;
  timestamp?: string;
  created_at?: string;
}

export interface PlantDataMessage extends WebSocketMessage {
  type: 'initial' | 'update' | 'plant_update';
  data: {
    grinding?: {
      id: number;
      created_at: string;
      mill_id: number;
      mill_type: string;
      total_feed_rate_tph: number;
      power_consumption_kw: number;
      // ... other grinding fields
    };
    kiln?: {
      id: number;
      created_at: string;
      kiln_id: number;
      burning_zone_temp_c: number;
      fuel_rate_tph: number;
      coal_rate_tph: number;
      alt_fuel_rate_tph: number;
      // ... other kiln fields
    };
    raw_material?: {
      id: number;
      created_at: string;
      material_type: string;
      feed_rate_tph: number;
      moisture_pct: number;
      // ... other raw material fields
    };
    recommendations?: AIRecommendation[];
  };
}

export interface AlertMessage extends WebSocketMessage {
  type: 'alert';
  data: {
    priority: number;
    message: string;
    recommendation?: AIRecommendation;
  };
}

type WebSocketEventHandler = (message: WebSocketMessage) => void;
type WebSocketErrorHandler = (error: Error) => void;
type WebSocketStatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000; // 5 seconds
  private clientId: string;
  private currentStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' = 'disconnected';
  
  private eventHandlers: Set<WebSocketEventHandler> = new Set();
  private errorHandlers: Set<WebSocketErrorHandler> = new Set();
  private statusHandlers: Set<WebSocketStatusHandler> = new Set();

  constructor() {
    this.clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Plant Data WebSocket Connection
  connectToPlantData(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.notifyStatus('connecting');
        const wsUrl = `${API_CONFIG.WEBSOCKET_URL}${WEBSOCKET_ROUTES.PLANT_DATA}?client_id=${this.clientId}`;
        
        console.log('🔌 Connecting to plant data WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.reconnectAttempts = 0;
          this.notifyStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            // Enhanced logging for WebSocket data
            console.log('📨 WebSocket message received:', message);
            
            if (message.data) {
              console.group('🔍 WebSocket Data Structure Analysis');
              console.log('Message Type:', message.type);
              console.log('Data Keys:', Object.keys(message.data));
              
              if (message.data.grinding) {
                console.log('🔧 Grinding Data:', message.data.grinding);
                console.log('Grinding Keys:', Object.keys(message.data.grinding));
              }
              
              if (message.data.kiln) {
                console.log('🔥 Kiln Data:', message.data.kiln);
                console.log('Kiln Keys:', Object.keys(message.data.kiln));
              }
              
              if (message.data.raw_material) {
                console.log('🗿 Raw Material Data:', message.data.raw_material);
                console.log('Raw Material Keys:', Object.keys(message.data.raw_material));
              }
              
              if (message.data.recommendations) {
                console.log('🤖 Recommendations Data:', message.data.recommendations);
                console.log('Recommendations Count:', message.data.recommendations.length);
                if (message.data.recommendations.length > 0) {
                  console.log('First Recommendation Keys:', Object.keys(message.data.recommendations[0]));
                }
              } else if (message.type === 'initial') {
                console.log('❌ No recommendations data in initial WebSocket message');
              }
              
              // Check for utilities, quality, alternative_fuels (only log missing for initial messages)
              if (message.data.utilities) {
                console.log('⚡ Utilities Data:', message.data.utilities);
              } else if (message.type === 'initial') {
                console.log('❌ No utilities data in WebSocket (expected - API only)');
              }
              
              if (message.data.quality) {
                console.log('🔬 Quality Data:', message.data.quality);
              } else if (message.type === 'initial') {
                console.log('❌ No quality data in WebSocket (expected - API only)');
              }
              
              if (message.data.alternative_fuels) {
                console.log('⛽ Alternative Fuels Data:', message.data.alternative_fuels);
              } else if (message.type === 'initial') {
                console.log('❌ No alternative fuels data in WebSocket (expected - API only)');
              }
              
              console.groupEnd();
            }
            
            this.notifyEventHandlers(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
            this.notifyErrorHandlers(new Error('Failed to parse WebSocket message'));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.notifyErrorHandlers(new Error(API_ERROR_MESSAGES.WEBSOCKET_CONNECTION_FAILED));
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event);
          this.notifyStatus('disconnected');
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        reject(error);
      }
    });
  }

  // Alerts WebSocket Connection
  connectToAlerts(priorityFilter?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.notifyStatus('connecting');
        let wsUrl = `${API_CONFIG.WEBSOCKET_URL}${WEBSOCKET_ROUTES.ALERTS}`;
        
        if (priorityFilter) {
          wsUrl += `?priority_filter=${priorityFilter}`;
        }
        
        console.log('🚨 Connecting to alerts WebSocket:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ Alerts WebSocket connected successfully');
          this.reconnectAttempts = 0;
          this.notifyStatus('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('🚨 Alert message received:', message);
            this.notifyEventHandlers(message);
          } catch (error) {
            console.error('❌ Error parsing alert message:', error);
            this.notifyErrorHandlers(new Error('Failed to parse alert message'));
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ Alerts WebSocket error:', error);
          this.notifyErrorHandlers(new Error('Alerts WebSocket connection failed'));
        };

        this.ws.onclose = (event) => {
          console.log('🚨 Alerts WebSocket connection closed:', event);
          this.notifyStatus('disconnected');
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error('Alerts WebSocket connection timeout'));
          }
        }, 10000);

      } catch (error) {
        console.error('❌ Error creating alerts WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    this.notifyStatus('reconnecting');

    this.reconnectTimeout = setTimeout(() => {
      this.connectToPlantData().catch(error => {
        console.error('❌ Reconnection failed:', error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.notifyErrorHandlers(new Error('Failed to reconnect after maximum attempts'));
        }
      });
    }, delay);
  }

  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      console.log('🔌 Disconnecting WebSocket');
      this.ws.close(1000, 'Client initiated disconnect');
      this.ws = null;
    }

    this.reconnectAttempts = 0;
    this.notifyStatus('disconnected');
  }

  // Send message to WebSocket (if needed for future functionality)
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ Cannot send message: WebSocket is not connected');
    }
  }

  // Event handlers management
  onMessage(handler: WebSocketEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  onError(handler: WebSocketErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  onStatusChange(handler: WebSocketStatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  private notifyEventHandlers(message: WebSocketMessage): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Error in WebSocket event handler:', error);
      }
    });
  }

  private notifyErrorHandlers(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (err) {
        console.error('❌ Error in WebSocket error handler:', err);
      }
    });
  }

  private notifyStatus(status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting'): void {
    this.currentStatus = status;
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('❌ Error in WebSocket status handler:', error);
      }
    });
  }

  // Utility methods
  getStatus(): string {
    return this.currentStatus;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'disconnecting';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  getClientId(): string {
    return this.clientId;
  }
}

// Create singleton instances for different WebSocket types
export const plantDataWebSocket = new WebSocketService();
export const alertsWebSocket = new WebSocketService();

// React Hook for WebSocket connection
import { useEffect, useCallback, useState } from 'react';

export interface UseWebSocketOptions {
  autoConnect?: boolean;
  alertsPriorityFilter?: number;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  status: string;
  lastMessage: WebSocketMessage | null;
  error: Error | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  send: (message: any) => void;
}

export function useWebSocket(
  type: 'plant-data' | 'alerts' = 'plant-data',
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const wsService = type === 'alerts' ? alertsWebSocket : plantDataWebSocket;

  const connect = useCallback(async () => {
    try {
      if (type === 'alerts') {
        await wsService.connectToAlerts(options.alertsPriorityFilter);
      } else {
        await wsService.connectToPlantData();
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [type, options.alertsPriorityFilter, wsService]);

  const disconnect = useCallback(() => {
    wsService.disconnect();
  }, [wsService]);

  const send = useCallback((message: any) => {
    wsService.send(message);
  }, [wsService]);

  useEffect(() => {
    const unsubscribeMessage = wsService.onMessage((message) => {
      setLastMessage(message);
      setError(null);
    });

    const unsubscribeError = wsService.onError((err) => {
      setError(err);
    });

    const unsubscribeStatus = wsService.onStatusChange((newStatus) => {
      setStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    });

    // Auto-connect if requested and not already connected
    if (options.autoConnect !== false && wsService.getStatus() !== 'connected') {
      connect().catch(err => {
        console.error('❌ Auto-connect failed:', err);
      });
    } else if (wsService.getStatus() === 'connected') {
      // Already connected, just update local state
      setStatus('connected');
      setIsConnected(true);
    }

    // Cleanup on unmount - don't disconnect shared plant-data connection
    return () => {
      unsubscribeMessage();
      unsubscribeError();
      unsubscribeStatus();
      // Don't auto-disconnect shared connections to avoid reconnecting on tab changes
      // Let the connection persist across component mounts/unmounts
    };
  }, []); // Empty dependency array to prevent re-running

  return {
    isConnected,
    status,
    lastMessage,
    error,
    connect,
    disconnect,
    send,
  };
}