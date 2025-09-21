'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from '@/components/timestamp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { apiService } from '@/services/api';
import { useWebSocket } from '@/services/websocket';
import { CombinedPlantData } from '@/types/api';

interface CrossProcessMetrics {
  overallEfficiency: number;
  energyOptimization: number;
  productionIncrease: number;
  integrationScore: number;
}

export function CrossProcessModule() {
  const [plantData, setPlantData] = useState<CombinedPlantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const { 
    isConnected: wsConnected, 
    error: wsError,
    lastMessage
  } = useWebSocket('plant-data');

  const fetchPlantData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBackendStatus('connecting');

      const response = await apiService.getCombinedPlantData();
      setPlantData(response.data || null);
      setBackendStatus('connected');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plant data');
      setBackendStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlantData();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.data) {
      const combinedData: CombinedPlantData = {
        plant_overview: lastMessage.data.plant_overview || null,
        grinding: lastMessage.data.grinding ? [lastMessage.data.grinding] : [],
        kiln: lastMessage.data.kiln ? [lastMessage.data.kiln] : [],
        raw_material: lastMessage.data.raw_material ? [lastMessage.data.raw_material] : [],
        utilities: lastMessage.data.utilities || [],
        quality: lastMessage.data.quality || [],
        alternative_fuels: lastMessage.data.alternative_fuels || [],
        recommendations: lastMessage.data.recommendations || [],
        created_at: new Date().toISOString()
      };
      setPlantData(combinedData);
      setBackendStatus('connected');
      setError(null);
      setIsLoading(false);
    }
  }, [lastMessage]);

  const calculateMetrics = (data: CombinedPlantData | null): CrossProcessMetrics => {
    if (!data) {
      return {
        overallEfficiency: 0,
        energyOptimization: 0,
        productionIncrease: 0,
        integrationScore: 0
      };
    }

    // Calculate overall efficiency from all processes
    const rawMaterialEfficiency = data.raw_material.length > 0 ? 
      data.raw_material.reduce((sum, item) => sum + (item.feed_rate_tph || 0), 0) / data.raw_material.length : 0;
    const kilnEfficiency = data.kiln.length > 0 ?
      data.kiln.reduce((sum, item) => sum + Math.min(100, 100 - Math.abs(item.burning_zone_temp_c - 1450) / 10), 0) / data.kiln.length : 0;
    const qualityEfficiency = data.quality.length > 0 ?
      data.quality.reduce((sum, item) => sum + (item.compressive_strength_28d_mpa ? (item.compressive_strength_28d_mpa / 50) * 100 : 0), 0) / data.quality.length : 0;
    const utilityEfficiency = data.utilities.length > 0 ?
      data.utilities.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / data.utilities.length : 0;

    const overallEfficiency = (rawMaterialEfficiency + kilnEfficiency + qualityEfficiency + utilityEfficiency) / 4;

    // Calculate energy optimization potential
    const totalPowerConsumption = data.utilities.reduce((sum, item) => sum + item.power_consumption_kw, 0);
    const avgEfficiency = data.utilities.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / data.utilities.length || 0;
    const energyOptimization = Math.max(0, (100 - avgEfficiency) / 8); // Convert efficiency gap to optimization percentage

    return {
      overallEfficiency: Math.min(100, overallEfficiency),
      energyOptimization,
      productionIncrease: Math.min(15, overallEfficiency - 80), // Production increase based on efficiency
      integrationScore: Math.min(100, overallEfficiency + 5) // Integration score slightly higher
    };
  };

  const getOverallEfficiencyData = (data: CombinedPlantData | null) => {
    const baseEfficiency = data ? calculateMetrics(data).overallEfficiency : 0;
    if (baseEfficiency === 0) {
      return [];
    }
    return [
      { time: '00:00', current: Math.max(70, baseEfficiency - 2.3), aiOptimized: Math.min(100, baseEfficiency + 4.3) },
      { time: '04:00', current: Math.max(70, baseEfficiency - 1.4), aiOptimized: Math.min(100, baseEfficiency + 4.9) },
      { time: '08:00', current: baseEfficiency, aiOptimized: Math.min(100, baseEfficiency + 5.6) },
      { time: '12:00', current: baseEfficiency, aiOptimized: Math.min(100, baseEfficiency + 5.6) },
      { time: '16:00', current: Math.min(100, baseEfficiency + 0.7), aiOptimized: Math.min(100, baseEfficiency + 6.2) },
      { time: '20:00', current: Math.max(70, baseEfficiency + 0.3), aiOptimized: Math.min(100, baseEfficiency + 5.8) },
    ];
  };

  const getProcessIntegrationData = (data: CombinedPlantData | null) => {
    if (!data) {
      return [];
    }

    const rawMaterialEff = data.raw_material.length > 0 ? 
      data.raw_material.reduce((sum, item) => sum + (item.feed_rate_tph || 0), 0) / data.raw_material.length : 0;
    const kilnEff = data.kiln.length > 0 ?
      data.kiln.reduce((sum, item) => sum + Math.min(100, 100 - Math.abs(item.burning_zone_temp_c - 1450) / 10), 0) / data.kiln.length : 0;
    const qualityEff = data.quality.length > 0 ?
      data.quality.reduce((sum, item) => sum + (item.compressive_strength_28d_mpa ? (item.compressive_strength_28d_mpa / 50) * 100 : 0), 0) / data.quality.length : 0;
    const fuelEff = data.alternative_fuels.length > 0 ?
      data.alternative_fuels.reduce((sum, item) => sum + (item.thermal_substitution_pct || 0), 0) / data.alternative_fuels.length : 0;
    const utilityEff = data.utilities.length > 0 ?
      data.utilities.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / data.utilities.length : 0;

    return [
      { process: 'Raw Materials', current: Math.min(100, rawMaterialEff), target: Math.min(100, rawMaterialEff + 8), improvement: Math.min(20, 100 - rawMaterialEff) },
      { process: 'Kiln Operations', current: Math.min(100, kilnEff), target: Math.min(100, kilnEff + 8), improvement: Math.min(20, 100 - kilnEff) },
      { process: 'Quality Control', current: Math.min(100, qualityEff), target: Math.min(100, qualityEff + 5), improvement: Math.min(20, 100 - qualityEff) },
      { process: 'Fuel Optimization', current: Math.min(100, fuelEff), target: Math.min(100, fuelEff + 12), improvement: Math.min(25, 100 - fuelEff) },
      { process: 'Utilities', current: Math.min(100, utilityEff), target: Math.min(100, utilityEff + 7), improvement: Math.min(20, 100 - utilityEff) },
    ];
  };

  const getEnergyFlowData = (data: CombinedPlantData | null) => {
    if (!data || !data.utilities.length) {
      return [];
    }

    // Group utilities by equipment type and calculate consumption
    const grouped = data.utilities.reduce((acc, item) => {
      const type = item.equipment_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, typeof data.utilities>);

    return Object.entries(grouped).slice(0, 4).map(([type, items]) => {
      const totalConsumption = items.reduce((sum, item) => sum + item.power_consumption_kw, 0) / 10; // Scale down
      const avgEfficiency = items.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / items.length;
      const optimized = totalConsumption * (avgEfficiency / 100);
      const savings = ((totalConsumption - optimized) / totalConsumption) * 100;

      return {
        source: type,
        consumption: Number(totalConsumption.toFixed(1)),
        optimized: Number(optimized.toFixed(1)),
        savings: Number(savings.toFixed(1))
      };
    });
  };

  const metrics = calculateMetrics(plantData);
  const overallEfficiencyData = getOverallEfficiencyData(plantData);
  const processIntegrationData = getProcessIntegrationData(plantData);
  const energyFlowData = getEnergyFlowData(plantData);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Cross-Process Integration</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading integration data...</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cross-Process Integration</h2>
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Overall Efficiency"
          value={`${metrics.overallEfficiency.toFixed(1)}%`}
          change={{ value: `AI Target: ${(metrics.overallEfficiency + 5.6).toFixed(1)}%`, type: "positive" }}
        >
          <Progress value={(metrics.overallEfficiency / (metrics.overallEfficiency + 5.6)) * 100} className="mt-2" />
        </KPICard>

        <KPICard
          title="Energy Optimization"
          value={`${metrics.energyOptimization.toFixed(1)}%`}
          change={{ value: "Savings potential", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            {(101.3 - metrics.energyOptimization).toFixed(1)} → {(101.3 - metrics.energyOptimization * 1.5).toFixed(1)} kWh/t
          </div>
        </KPICard>

        <KPICard
          title="Production Increase"
          value={`${metrics.productionIncrease.toFixed(1)}%`}
          change={{ value: "vs current throughput", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            {metrics.productionIncrease > 0 ? `${(4907 * (1 + metrics.productionIncrease / 100)).toFixed(0)} t/day` : 'No data available'}
          </div>
        </KPICard>

        <KPICard
          title="Integration Score"
          value={`${metrics.integrationScore.toFixed(1)}%`}
          change={{ value: "Process synchronization", type: "positive" }}
        >
          <Progress value={metrics.integrationScore} className="mt-2" />
        </KPICard>
      </div>

      {/* Main Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overall Plant Efficiency Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overallEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[80, 95]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="current"
                    stackId="1"
                    stroke={CHART_COLORS.warning}
                    fill={CHART_COLORS.warning}
                    fillOpacity={0.6}
                    name="Current Efficiency"
                  />
                  <Area
                    type="monotone"
                    dataKey="aiOptimized"
                    stackId="2"
                    stroke={CHART_COLORS.success}
                    fill={CHART_COLORS.success}
                    fillOpacity={0.6}
                    name="AI Optimized"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Process Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processIntegrationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[70, 100]} />
                  <YAxis dataKey="process" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="current" fill={CHART_COLORS.secondary} name="Current" />
                  <Bar dataKey="target" fill={CHART_COLORS.primary} name="AI Target" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Flow and Process Details */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Energy Flow Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {energyFlowData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.source}</span>
                    <Badge variant="outline" className="text-green-600">
                      -{item.savings}%
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Current: {item.consumption} kWh/t</span>
                    <span>Target: {item.optimized} kWh/t</span>
                  </div>
                  <Progress value={(item.optimized / item.consumption) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integration Opportunities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Waste Heat Recovery
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Integrate preheater exhaust with raw mill drying
              </p>
              <div className="flex justify-between text-xs">
                <span>Potential Savings:</span>
                <span className="font-medium">12% energy reduction</span>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Process Synchronization
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Optimize mill-kiln coordination for stable operation
              </p>
              <div className="flex justify-between text-xs">
                <span>Potential Improvement:</span>
                <span className="font-medium">15% throughput increase</span>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                Predictive Control
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-200 mb-2">
                AI-driven cross-process parameter optimization
              </p>
              <div className="flex justify-between text-xs">
                <span>Implementation Status:</span>
                <span className="font-medium">75% complete</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Process Improvement Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Process</th>
                  <th className="text-center p-2">Current Efficiency</th>
                  <th className="text-center p-2">AI Target</th>
                  <th className="text-center p-2">Improvement</th>
                  <th className="text-center p-2">Priority</th>
                  <th className="text-center p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {processIntegrationData.map((item, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2 font-medium">{item.process}</td>
                    <td className="text-center p-2">{item.current}%</td>
                    <td className="text-center p-2">{item.target}%</td>
                    <td className="text-center p-2 text-green-600">+{item.improvement}%</td>
                    <td className="text-center p-2">
                      <Badge variant={item.improvement > 10 ? "destructive" : "secondary"}>
                        {item.improvement > 10 ? "High" : "Medium"}
                      </Badge>
                    </td>
                    <td className="text-center p-2">
                      <Badge variant="outline" className="text-blue-600">
                        In Progress
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
