'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { apiService } from '../../services/api';
import { useWebSocket } from '../../services/websocket';
import type { AlternativeFuelsData } from '../../types/api';

export function FuelOptimizationModule() {
  const [fuelData, setFuelData] = useState<AlternativeFuelsData[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    error: wsError 
  } = useWebSocket('plant-data');

  // Load initial data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load alternative fuels data
        const response = await apiService.getAlternativeFuelsData();
        setFuelData(response.data || []);

        // Load fuel optimization results if available
        try {
          // Note: Optimization endpoint may not be implemented yet
          // const optimization = await apiService.optimizeFuel();
          // setOptimizationResult(optimization);
        } catch (optError) {
          console.warn('Fuel optimization not available:', optError);
        }

        setLastUpdate(new Date());
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load fuel data';
        setError(errorMessage);
        console.error('❌ Fuel Optimization Module Error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Calculate KPIs from real data
  const kpis = React.useMemo(() => {
    if (!fuelData.length) {
      return {
        avgThermalSubstitution: 0,
        totalCO2Reduction: 0,
        costSavings: 0,
        efficiencyImprovement: optimizationResult?.efficiency_improvement || 0
      };
    }

    const avgThermalSubstitution = fuelData.reduce((sum, fuel) => 
      sum + (fuel.thermal_substitution_pct || 0), 0) / fuelData.length;
    
    // Calculate CO2 reduction based on available data
    const totalCO2Reduction = fuelData.reduce((sum, fuel) => 
      sum + ((fuel.thermal_substitution_pct || 0) * 0.1), 0); // Approximate calculation
    
    const costSavings = optimizationResult?.cost_savings || 0;

    return {
      avgThermalSubstitution,
      totalCO2Reduction,
      costSavings,
      efficiencyImprovement: optimizationResult?.efficiency_improvement || 0
    };
  }, [fuelData, optimizationResult]);

  console.log('� Fuel Optimization Backend Data:', {
    fuelData: fuelData.length,
    optimizationResult: !!optimizationResult,
    kpis,
    wsConnected,
    loading,
    error
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fuel Optimization</h1>
        <div className="text-sm text-muted-foreground flex items-center gap-4">
          <div>Last updated: {lastUpdate.toLocaleTimeString()}</div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            wsConnected 
              ? 'bg-green-100 text-green-800' 
              : fuelData.length > 0 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
          }`}>
            {loading ? 'Loading...' : error ? 'API Connection Failed' : wsConnected ? 'Live Data Connected' : 'API Connected (WebSocket Offline)'}
          </div>
        </div>
      </div>

      {/* Error/Loading States */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-800">
            ⚠️ Backend API connection failed: {error}. Module may show limited functionality.
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

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Thermal Substitution"
          value={loading ? "..." : `${kpis.avgThermalSubstitution.toFixed(1)}%`}
          change={loading ? undefined : { value: "+2.3%", type: "positive" }}
        />
        <KPICard
          title="CO₂ Reduction"
          value={loading ? "..." : `${kpis.totalCO2Reduction.toFixed(1)} t/h`}
          change={loading ? undefined : { value: "+0.8 t/h", type: "positive" }}
        />
        <KPICard
          title="Cost Savings"
          value={loading ? "..." : `₹${(kpis.costSavings / 100000).toFixed(2)}L`}
          change={loading ? undefined : { value: "+₹1.2L", type: "positive" }}
        />
        <KPICard
          title="Efficiency Gain"
          value={loading ? "..." : `${kpis.efficiencyImprovement.toFixed(1)}%`}
          change={loading ? undefined : { value: "+1.2%", type: "positive" }}
        />
      </div>

      {/* Alternative Fuel Mix Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alternative Fuel Mix</h3>
        {fuelData.length > 0 ? (
          <div className="space-y-4">
            {fuelData.map((fuel, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{fuel.fuel_type}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(fuel.thermal_substitution_pct || 0, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {(fuel.thermal_substitution_pct || 0).toFixed(1)}%
                  </span>
                  <span className="text-xs text-green-600 w-20">
                    CO₂ Impact: {fuel.fuel_type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {loading ? 'Loading fuel data...' : 'No alternative fuels data available'}
          </div>
        )}
      </Card>

      {/* AI Optimization Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Optimization Results</h3>
        {optimizationResult ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Efficiency Improvement</h4>
              <p className="text-2xl font-bold text-green-600">
                {kpis.efficiencyImprovement.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">vs current operation</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Cost Savings</h4>
              <p className="text-2xl font-bold text-green-600">
                ₹{(kpis.costSavings / 100000).toFixed(2)}L
              </p>
              <p className="text-sm text-muted-foreground">per month</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">CO₂ Reduction</h4>
              <p className="text-2xl font-bold text-green-600">
                {kpis.totalCO2Reduction.toFixed(1)} t/h
              </p>
              <p className="text-sm text-muted-foreground">emissions reduced</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            {loading ? (
              <div className="text-muted-foreground">Loading optimization results...</div>
            ) : (
              <div className="text-muted-foreground">
                <p>AI optimization not available</p>
                <p className="text-sm mt-1">Backend optimization service may be offline</p>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Backend Connection Status */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-3">🔥 Fuel Optimization Data Sources</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div>
            <div className="font-medium">Alternative Fuels Data</div>
            <div className="text-xs">{fuelData.length > 0 ? `✅ ${fuelData.length} fuel types loaded` : '⚠️ No data available'}</div>
          </div>
          <div>
            <div className="font-medium">AI Optimization</div>
            <div className="text-xs">{optimizationResult ? '✅ AI recommendations available' : '⚠️ Optimization offline'}</div>
          </div>
          <div>
            <div className="font-medium">Real-time Updates</div>
            <div className="text-xs">{wsConnected ? '✅ WebSocket connected' : '⚠️ Manual refresh only'}</div>
          </div>
          <div>
            <div className="font-medium">Backend API</div>
            <div className="text-xs">{error ? '⚠️ Connection failed' : '✅ Connected'}</div>
          </div>
          <div>
            <div className="font-medium">Last Update</div>
            <div className="text-xs">{lastUpdate.toLocaleTimeString()}</div>
          </div>
          <div>
            <div className="font-medium">Data Source</div>
            <div className="text-xs">Backend FastAPI</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <div className="font-medium text-blue-800">
            Overall Status: {loading ? '🔄 Loading...' : error ? '⚠️ API Connection Failed' : wsConnected ? '✅ All Systems Connected' : '⚠️ Partial Connection'}
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Fuel optimization: {optimizationResult ? 'AI-powered recommendations active' : 'Basic data display mode'}
          </div>
        </div>
      </Card>
    </div>
  );
}
