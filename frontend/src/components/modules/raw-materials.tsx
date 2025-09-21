'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { apiService } from '../../services/api';
import { useWebSocket } from '../../services/websocket';
import type { RawMaterialData } from '../../types/api';

export function RawMaterialsModule() {
  const [rawMaterialData, setRawMaterialData] = useState<RawMaterialData[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    error: wsError 
  } = useWebSocket('plant-data');

  // Control states for sliders
  const [limestoneRate, setLimestoneRate] = React.useState([195]);
  const [clayRate, setClayRate] = React.useState([41]);

  // Load initial data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load raw material data
        const response = await apiService.getRawMaterialData();
        setRawMaterialData(response.data || []);

        // Initialize slider values from data
        if (response.data && response.data.length > 0) {
          const limestoneItem = response.data.find(item => 
            item.material_type?.toLowerCase().includes('limestone'));
          const clayItem = response.data.find(item => 
            item.material_type?.toLowerCase().includes('clay'));
          
          if (limestoneItem) setLimestoneRate([limestoneItem.feed_rate_tph || 0]);
          if (clayItem) setClayRate([clayItem.feed_rate_tph || 0]);
        }

        setLastUpdate(new Date());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load raw material data';
        setError(errorMessage);
        console.error('❌ Raw Materials Module Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate current feed rates from database
  const getCurrentFeedRates = () => {
    if (rawMaterialData.length === 0) {
      return { limestone: 0, clay: 0, iron: 0, sand: 0 };
    }

    // Group by material type and get the latest feed rate for each
    const materialRates = rawMaterialData.reduce((acc, item) => {
      const materialType = item.material_type?.toLowerCase();
      if (materialType && !acc[materialType]) {
        acc[materialType] = item.feed_rate_tph || 0;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      limestone: materialRates.limestone || 0,
      clay: materialRates.clay || 0,
      iron: materialRates.iron_ore || materialRates.iron || 0,
      sand: materialRates.silica_sand || materialRates.sand || 0
    };
  };

  const currentRates = getCurrentFeedRates();

  // Generate feed rate trend data from recent records
  const feedRateData = React.useMemo(() => {
    if (rawMaterialData.length === 0) {
      // No data available - return empty array
      return [];
    }

    // Generate trend from recent data
    return rawMaterialData.slice(0, 6).reverse().map((item, index) => {
      const isLimestone = item.material_type?.toLowerCase().includes('limestone');
      const isClay = item.material_type?.toLowerCase().includes('clay');
      
      return {
        time: `${index * 4}:00`,
        limestone: isLimestone ? (item.feed_rate_tph || 0) : currentRates.limestone,
        clay: isClay ? (item.feed_rate_tph || 0) : currentRates.clay
      };
    });
  }, [rawMaterialData, currentRates]);

  console.log('🏗️ Raw Materials Backend Data:', {
    rawMaterialData: rawMaterialData.length,
    optimizationResult: !!optimizationResult,
    currentRates,
    wsConnected,
    loading,
    error
  });

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Raw Material Optimizer</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="rawMaterialAI" defaultChecked className="h-4 w-4" />
            <label htmlFor="rawMaterialAI" className="text-sm font-medium">
              AI Optimization
            </label>
          </div>
          <div className="text-sm text-muted-foreground flex items-center gap-4">
            <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              wsConnected 
                ? 'bg-green-100 text-green-800' 
                : rawMaterialData.length > 0 
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}>
              {loading ? 'Loading...' : error ? 'API Connection Failed' : wsConnected ? 'Live Data Connected' : 'API Connected (WebSocket Offline)'}
            </div>
          </div>
        </div>
      </div>

      {/* Error/Loading States */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-800">
            ⚠️ Backend API connection failed: {error}. No data available.
          </p>
        </Card>
      )}

      {wsError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Real-time updates unavailable: {wsError.message}. Data will refresh manually.
          </p>
        </div>
      )}

      {/* Data Status Alert */}
      {loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            🔄 Loading raw material data from backend...
          </p>
        </div>
      )}

      {/* Control Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="control-card">
          <CardContent className="flex flex-col p-4">
            <h3 className="text-base font-semibold mb-3">Limestone Feed Rate</h3>
            <div className="flex flex-col justify-between min-h-[200px]">
              <div className="space-y-2">
                <Slider
                  value={limestoneRate}
                  onValueChange={setLimestoneRate}
                  max={250}
                  min={150}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-base font-bold">{limestoneRate[0]} t/h</div>
              </div>
              <div className="space-y-1 text-xs mt-4">
                <div className="flex justify-between">
                  <span>CaO:</span>
                  <span>--%</span>
                </div>
                <div className="flex justify-between">
                  <span>SiO₂:</span>
                  <span>--%</span>
                </div>
                <div className="flex justify-between">
                  <span>Moisture:</span>
                  <span>--%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="control-card">
          <CardContent className="flex flex-col p-4">
            <h3 className="text-base font-semibold mb-3">Clay Feed Rate</h3>
            <div className="flex flex-col justify-between min-h-[200px]">
              <div className="space-y-2">
                <Slider
                  value={clayRate}
                  onValueChange={setClayRate}
                  max={60}
                  min={30}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-center text-base font-bold">{clayRate[0]} t/h</div>
              </div>
              <div className="space-y-1 text-xs mt-4">
                <div className="flex justify-between">
                  <span>SiO₂:</span>
                  <span>--%</span>
                </div>
                <div className="flex justify-between">
                  <span>Al₂O₃:</span>
                  <span>--%</span>
                </div>
                <div className="flex justify-between">
                  <span>Moisture:</span>
                  <span>--%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="efficiency-card">
          <CardContent className="flex flex-col p-4">
            <h3 className="text-base font-semibold mb-3">Grinding Efficiency</h3>
            <div className="flex flex-col justify-center min-h-[200px]">
            <div className="flex items-center justify-center space-x-4 mb-3">
              <div className="text-center">
                <span className="text-xs text-muted-foreground">Current</span>
                <div className="text-lg font-bold">--%</div>
              </div>
              <div className="text-lg">→</div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground">AI Optimized</span>
                <div className="text-lg font-bold text-green-600">--%</div>
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-medium">
                {rawMaterialData.length > 0 ? 'No savings data available' : 'No savings data'}
              </span>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardContent className="flex flex-col p-4">
            <h3 className="text-base font-semibold mb-3">Feed Rate Optimization</h3>
            <div className="w-full h-[200px]">
              {feedRateData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No feed rate data available</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={feedRateData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      fontSize={10}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="limestone" 
                      stroke={CHART_COLORS.primary} 
                      name="Limestone"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clay" 
                      stroke={CHART_COLORS.secondary} 
                      name="Clay"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Source Summary */}
      <Card className="p-4 bg-green-50 border-green-200">
        <h4 className="font-medium text-green-900 mb-3">🏗️ Raw Materials Data Sources</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
          <div>
            <div className="font-medium">Raw Material Feed</div>
            <div className="text-xs">{rawMaterialData.length} records {rawMaterialData.length > 0 ? '✅ Live' : '❌ No Data'}</div>
            <div className="text-xs mt-1">
              Current rates: Limestone {currentRates.limestone}t/h, Clay {currentRates.clay}t/h
            </div>
          </div>
          <div>
            <div className="font-medium">Optimization Results</div>
            <div className="text-xs">{optimizationResult ? '✅ AI recommendations available' : '⚠️ Optimization offline'}</div>
            <div className="text-xs mt-1">
              Status: {loading ? '🔄 Loading...' : error ? '❌ Error - No Data Available' : '✅ Connected'}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="font-medium text-green-800">
            Feed Rates: {rawMaterialData.length > 0 ? 'Calculated from live database' : 'No data available'}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Material types in database: {rawMaterialData.map(item => item.material_type).filter(Boolean).slice(0, 3).join(', ')}
          </div>
        </div>
      </Card>
    </div>
  );
}
