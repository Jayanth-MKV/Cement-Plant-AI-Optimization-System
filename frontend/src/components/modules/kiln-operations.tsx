'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Slider } from '@/components/ui/slider';
import { Timestamp } from '@/components/timestamp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { apiService } from '@/services/api';
import { useWebSocket } from '@/services/websocket';
import { KilnData } from '@/types/api';

interface KilnMetrics {
  efficiency: number;
  burningZoneTemp: number;
  productionRate: number;
  energySavings: number;
}

export function KilnOperationsModule() {
  const [kilnData, setKilnData] = useState<KilnData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  const [coalRate, setCoalRate] = React.useState([90]);
  const [altFuelRate, setAltFuelRate] = React.useState([20]);

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    error: wsError,
    lastMessage
  } = useWebSocket('plant-data');

  const fetchKilnData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBackendStatus('connecting');

      const response = await apiService.getKilnData();
      setKilnData(response.data || []);
      setBackendStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load kiln data');
      setBackendStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKilnData();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.data?.kiln) {
      const newKilnData = lastMessage.data.kiln;
      setKilnData(prevData => {
        const filteredPrevData = prevData.filter(item => item.id !== newKilnData.id);
        return [newKilnData, ...filteredPrevData];
      });
      setBackendStatus('connected');
      setError(null);
      setIsLoading(false);
      
      // Update slider values based on new data
      if (newKilnData.coal_rate_tph) {
        setCoalRate([newKilnData.coal_rate_tph]);
      }
      if (newKilnData.alt_fuel_rate_tph) {
        setAltFuelRate([newKilnData.alt_fuel_rate_tph]);
      }
      
      setBackendStatus('connected');
      setError(null); // Clear any previous errors
    }
  }, [lastMessage]);

  const calculateMetrics = (data: KilnData[]): KilnMetrics => {
    if (!data.length) {
      return {
        efficiency: 0,
        burningZoneTemp: 0,
        productionRate: 0,
        energySavings: 0
      };
    }

    const latest = data[data.length - 1];
    const avgTemp = data.reduce((sum, item) => sum + item.burning_zone_temp_c, 0) / data.length;
    const avgHeatConsumption = data.reduce((sum, item) => sum + (item.specific_heat_consumption_mjkg || 0), 0) / data.length;
    
    // Calculate efficiency based on temperature control and heat consumption
    const tempEfficiency = Math.min(100, Math.max(0, 100 - Math.abs(avgTemp - 1450) / 10));
    const heatEfficiency = Math.min(100, Math.max(0, 100 - (avgHeatConsumption - 3.0) * 10));
    const efficiency = (tempEfficiency + heatEfficiency) / 2;

    // Calculate production rate based on fuel rate
    const avgFuelRate = data.reduce((sum, item) => sum + item.fuel_rate_tph, 0) / data.length;
    const productionRate = avgFuelRate * 2.1; // Rough conversion

    // Calculate energy savings based on thermal substitution
    const avgThermalSub = data.reduce((sum, item) => sum + (item.thermal_substitution_pct || 0), 0) / data.length;
    const energySavings = avgThermalSub * 0.8; // Rough conversion

    return {
      efficiency,
      burningZoneTemp: avgTemp,
      productionRate,
      energySavings
    };
  };

  const getTemperatureData = (data: KilnData[]) => {
    if (!data.length) {
      return [];
    }

    const latest = data[data.length - 1];
    const baseTemp = latest.burning_zone_temp_c;
    
    return [
      { zone: 'Preheater Top', temp: Math.round(baseTemp * 0.24) },
      { zone: 'Preheater Bottom', temp: Math.round(baseTemp * 0.61) },
      { zone: 'Calciner', temp: Math.round(baseTemp * 0.62) },
      { zone: 'Kiln Inlet', temp: Math.round(baseTemp * 0.73) },
      { zone: 'Burning Zone', temp: Math.round(baseTemp) },
      { zone: 'Cooler Inlet', temp: Math.round(baseTemp * 0.85) },
    ];
  };

  const metrics = calculateMetrics(kilnData);
  const temperatureData = getTemperatureData(kilnData);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Kiln Operations</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading kiln data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kiln Operations</h2>
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
          <p className="text-sm text-muted-foreground">
            Last updated: <Timestamp />
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            ⚠️ {error} - No data available
          </p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-[35%]">
        <KPICard
          title="Kiln Efficiency"
          value={`${metrics.efficiency.toFixed(1)}%`}
          change={{ value: metrics.efficiency > 0 ? `${(metrics.efficiency - 84.2).toFixed(1)}% from target` : "No data available", type: metrics.efficiency > 84.2 ? "positive" : "negative" }}
        />

        <KPICard
          title="Burning Zone Temp"
          value={`${metrics.burningZoneTemp.toFixed(1)}°C`}
          change={{ value: Math.abs(metrics.burningZoneTemp - 1450) < 20 ? "Optimal range" : "Outside range", type: Math.abs(metrics.burningZoneTemp - 1450) < 20 ? "positive" : "negative" }}
        />

        <KPICard
          title="Production Rate"
          value={`${metrics.productionRate.toFixed(1)} t/h`}
          change={{ value: `${((metrics.productionRate - 178) / 178 * 100).toFixed(1)}% vs target`, type: metrics.productionRate > 178 ? "positive" : "negative" }}
        />

        <KPICard
          title="Energy Savings"
          value={`${metrics.energySavings.toFixed(1)}%`}
          change={{ value: "vs baseline", type: "positive" }}
        />
      </div>

      {/* Temperature Zones and Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Temperature Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={temperatureData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="temp" 
                    stroke={CHART_COLORS.error} 
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fuel Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium">Coal Consumption</label>
              <div className="mt-2">
                <Slider
                  value={coalRate}
                  onValueChange={setCoalRate}
                  max={120}
                  min={60}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>60 t/h</span>
                  <span className="font-medium">{coalRate[0]} t/h</span>
                  <span>120 t/h</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Alternative Fuel Rate</label>
              <div className="mt-2">
                <Slider
                  value={altFuelRate}
                  onValueChange={setAltFuelRate}
                  max={40}
                  min={10}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10%</span>
                  <span className="font-medium">{altFuelRate[0]}%</span>
                  <span>40%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
