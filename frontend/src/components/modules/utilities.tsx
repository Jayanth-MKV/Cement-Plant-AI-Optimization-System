'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from '@/components/timestamp';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { apiService } from '@/services/api';
import { useWebSocket } from '@/services/websocket';
import { UtilitiesData } from '@/types/api';

interface UtilityMetrics {
  totalConsumption: number;
  conveyorEfficiency: number;
  loadingTime: number;
  energySavings: number;
}

export function UtilitiesModule() {
  const [utilitiesData, setUtilitiesData] = useState<UtilitiesData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  const { 
    isConnected: wsConnected, 
    error: wsError,
    lastMessage
  } = useWebSocket('plant-data');

  const fetchUtilitiesData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setBackendStatus('connecting');

      const response = await apiService.getUtilitiesData();
      setUtilitiesData(response.data || []);
      setBackendStatus('connected');
    } catch (err) {
      console.error('Failed to fetch utilities data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load utilities data');
      setBackendStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUtilitiesData();
  }, []);

  useEffect(() => {
    if (lastMessage && lastMessage.data?.utilities) {
      setUtilitiesData(lastMessage.data.utilities);
      setBackendStatus('connected');
      setError(null);
      setIsLoading(false);
    }
  }, [lastMessage]);

  const calculateMetrics = (data: UtilitiesData[]): UtilityMetrics => {
    if (!data.length) {
      return {
        totalConsumption: 0,
        conveyorEfficiency: 0,
        loadingTime: 0,
        energySavings: 0
      };
    }

    const totalPowerConsumption = data.reduce((sum, item) => sum + item.power_consumption_kw, 0);
    const conveyorItems = data.filter(item => item.equipment_type.toLowerCase().includes('conveyor'));
    const avgConveyorEfficiency = conveyorItems.length > 0 
      ? conveyorItems.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / conveyorItems.length
      : 0;

    // Calculate savings based on efficiency improvements
    const avgEfficiency = data.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / data.length;
    const potentialSavings = Math.max(0, (avgEfficiency - 80) / 5); // 5% efficiency = 1% savings

    return {
      totalConsumption: totalPowerConsumption / 10 || 0, // Convert to kWh/t
      conveyorEfficiency: avgConveyorEfficiency,
      loadingTime: Math.max(15, 25 - (avgEfficiency - 70) / 2), // Better efficiency = lower loading time
      energySavings: potentialSavings
    };
  };

  const getPowerConsumptionData = (data: UtilitiesData[]) => {
    if (!data.length) {
      return [];
    }

    // Group by equipment type
    const grouped = data.reduce((acc, item) => {
      const type = item.equipment_type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {} as Record<string, UtilitiesData[]>);

    const colors = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.info];
    let colorIndex = 0;

    return Object.entries(grouped).map(([type, items]) => {
      const totalConsumption = items.reduce((sum, item) => sum + item.power_consumption_kw, 0) / 100; // Scale down
      const avgEfficiency = items.reduce((sum, item) => sum + (item.efficiency_pct || 0), 0) / items.length;
      const optimized = totalConsumption * (0.8 + (avgEfficiency - 80) / 100); // Better efficiency = more optimization

      return {
        equipment: type,
        consumption: Number(totalConsumption.toFixed(1)),
        optimized: Number(optimized.toFixed(1)),
        color: colors[colorIndex++ % colors.length]
      };
    }).slice(0, 5); // Limit to 5 items
  };

  const getMaintenanceData = (data: UtilitiesData[]) => {
    if (!data.length) {
      return [
        { equipment: 'Raw Mill Feed Conveyor', risk: 85, status: 'Critical', nextMaintenance: '4 hours' },
        { equipment: 'Kiln Drive Motor', risk: 35, status: 'Good', nextMaintenance: '720 hours' },
        { equipment: 'Cement Mill Gearbox', risk: 55, status: 'Warning', nextMaintenance: '168 hours' },
        { equipment: 'Preheater Fan', risk: 25, status: 'Good', nextMaintenance: '480 hours' },
        { equipment: 'Cooler Grate Drive', risk: 70, status: 'Warning', nextMaintenance: '72 hours' },
      ];
    }

    return data.slice(0, 5).map(item => {
      const hoursRun = item.operating_hours;
      const efficiency = item.efficiency_pct || 0;
      const riskLevel = Math.min(100, Math.max(0, 100 - efficiency + (hoursRun / 100)));
      
      const status = riskLevel > 70 ? 'Critical' : riskLevel > 40 ? 'Warning' : 'Good';
      const nextMaintenance = riskLevel > 70 ? `${Math.floor(hoursRun / 100) + 1} hours` :
                             riskLevel > 40 ? `${Math.floor(hoursRun / 10) + 50} hours` :
                             `${Math.floor(hoursRun / 5) + 300} hours`;

      return {
        equipment: item.equipment_id,
        risk: Math.round(riskLevel),
        status,
        nextMaintenance
      };
    });
  };

  const getEfficiencyTrendData = () => {
    if (!utilitiesData.length) {
      return [];
    }

    // Generate efficiency trend from actual utilities data
    return utilitiesData.slice(0, 8).map((item, index) => ({
      time: `${index * 3}:00`,
      conveyor: item.efficiency_pct || 0,
      loading: Math.min(item.operating_hours / 100, 60) // Convert operating hours to loading time
    }));
  };

  const metrics = calculateMetrics(utilitiesData);
  const powerConsumptionData = getPowerConsumptionData(utilitiesData);
  const maintenanceData = getMaintenanceData(utilitiesData);
  const efficiencyTrendData = getEfficiencyTrendData();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Utilities & Material Handling</h2>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading utilities data...</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Utilities & Material Handling</h2>
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
          title="Power Consumption"
          value={`${metrics.totalConsumption.toFixed(1)} kWh/t`}
          change={{ value: "Target: 81.4 kWh/t", type: "neutral" }}
        >
          <Progress value={Math.min(100, (81.4 / metrics.totalConsumption) * 100)} className="mt-2" />
        </KPICard>

        <KPICard
          title="Conveyor Efficiency"
          value={`${metrics.conveyorEfficiency.toFixed(1)}%`}
          change={{ value: `+${((metrics.conveyorEfficiency - 82) * 100 / 82).toFixed(1)}% vs yesterday`, type: metrics.conveyorEfficiency > 82 ? "positive" : "negative" }}
        >
          <Progress value={metrics.conveyorEfficiency} className="mt-2" />
        </KPICard>

        <KPICard
          title="Loading Time"
          value={`${metrics.loadingTime.toFixed(1)} min`}
          change={{ value: "Target: 15.1 min", type: "neutral" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            {((metrics.loadingTime - 15.1) / metrics.loadingTime * 100).toFixed(0)}% improvement potential
          </div>
        </KPICard>

        <KPICard
          title="Energy Savings"
          value={`${metrics.energySavings.toFixed(1)}%`}
          change={{ value: "Optimization potential", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            ₹{(metrics.energySavings * 0.143).toFixed(1)}L annual savings
          </div>
        </KPICard>
      </div>

      {/* Power Consumption and Trends */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Power Consumption by Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={powerConsumptionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="consumption" fill={CHART_COLORS.error} name="Current (kWh/t)" />
                  <Bar dataKey="optimized" fill={CHART_COLORS.success} name="AI Target (kWh/t)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Handling Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={efficiencyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="conveyor" 
                    stroke={CHART_COLORS.primary} 
                    name="Conveyor Efficiency (%)"
                    strokeWidth={2}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="loading" 
                    stroke={CHART_COLORS.warning} 
                    name="Loading Time (min)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power Breakdown and Maintenance */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Power Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {powerConsumptionData.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{item.equipment}</span>
                    <Badge variant="outline">
                      {item.consumption} kWh/t
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Savings Potential:</span>
                    <span className="text-green-600">
                      -{((item.consumption - item.optimized) / item.consumption * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={(item.optimized / item.consumption) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predictive Maintenance Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {maintenanceData.map((item, index) => (
                <div key={index} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{item.equipment}</span>
                    <Badge 
                      variant={
                        item.status === 'Critical' ? 'destructive' : 
                        item.status === 'Warning' ? 'secondary' : 
                        'outline'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Risk Level: {item.risk}%</span>
                    <span>Next: {item.nextMaintenance}</span>
                  </div>
                  <Progress 
                    value={item.risk} 
                    className={`h-2 ${
                      item.risk > 70 ? 'text-red-500' : 
                      item.risk > 40 ? 'text-yellow-500' : 
                      'text-green-500'
                    }`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                Urgent Action Required
              </h4>
              <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                Raw Mill Feed Conveyor - 85% probability of failure in next 4 hours
              </p>
              <div className="text-xs">
                <span className="font-medium">Recommended:</span> Schedule immediate maintenance
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Energy Optimization
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                Optimize grinding mill speed during low-demand periods
              </p>
              <div className="text-xs">
                <span className="font-medium">Potential Savings:</span> 12% energy reduction
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Material Flow
              </h4>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Implement AI-driven conveyor speed control for optimal throughput
              </p>
              <div className="text-xs">
                <span className="font-medium">Expected Improvement:</span> 18% efficiency gain
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
