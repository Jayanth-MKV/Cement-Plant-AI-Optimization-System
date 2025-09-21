'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';
import { apiService } from '@/services/api';
import { useWebSocket } from '@/services/websocket';
import { AIRecommendation } from '@/types/api';

export function AIInsightsModule() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  // WebSocket connection for real-time recommendations
  const { 
    isConnected: wsConnected, 
    error: wsError,
    lastMessage
  } = useWebSocket('plant-data'); // Use plant-data since recommendations come with initial data

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBackendStatus('connecting');

      const response = await apiService.getAIRecommendations();
      setRecommendations(response.data || []);
      setBackendStatus('connected');
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load AI recommendations');
      setBackendStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.data?.recommendations) {
      setRecommendations(lastMessage.data.recommendations);
      setBackendStatus('connected');
      setError(null);
      setIsLoading(false);
      
      // Update recommendations with fresh WebSocket data
      setRecommendations(lastMessage.data.recommendations);
      setBackendStatus('connected');
      setError(null); // Clear any previous errors
    }
  }, [lastMessage]);

  const categorizeRecommendations = (recommendations: AIRecommendation[]) => {
    const immediateActions = recommendations.filter(r => r.priority_level >= 8);
    const predictiveAlerts = recommendations.filter(r => r.priority_level >= 6 && r.priority_level < 8);
    const optimizationOpportunities = recommendations.filter(r => r.priority_level < 6);

    return {
      immediateActions: immediateActions.length > 0 ? immediateActions : [],
      predictiveAlerts: predictiveAlerts.length > 0 ? predictiveAlerts : [],
      optimizationOpportunities: optimizationOpportunities.length > 0 ? optimizationOpportunities : []
    };
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const { immediateActions, predictiveAlerts, optimizationOpportunities } = categorizeRecommendations(recommendations);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading AI insights...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              backendStatus === 'connected' ? 'bg-green-500' : 
              backendStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-sm text-muted-foreground">
              Backend {backendStatus}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Insights
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            ⚠️ {error} - No recommendations available
          </p>
        </div>
      )}

      <div>
  
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Immediate Actions
              <Badge variant="outline">{optimizationOpportunities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationOpportunities.map((opportunity, index) => (
                <div key={index} className="text-sm p-3 bg-green-50 dark:bg-green-950 rounded-md">
                  {opportunity.description}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
