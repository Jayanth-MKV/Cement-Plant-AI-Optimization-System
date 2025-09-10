'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from '@/components/timestamp';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts';
import { CHART_COLORS } from '@/constants';

const powerConsumptionData = [
  { equipment: 'Grinding Mills', consumption: 38.6, optimized: 33.2, color: CHART_COLORS.primary },
  { equipment: 'Kiln Fans', consumption: 19.7, optimized: 17.1, color: CHART_COLORS.secondary },
  { equipment: 'Compressors', consumption: 15.0, optimized: 13.2, color: CHART_COLORS.success },
  { equipment: 'Conveyors', consumption: 8.8, optimized: 7.9, color: CHART_COLORS.warning },
  { equipment: 'Lighting & Others', consumption: 14.4, optimized: 13.0, color: CHART_COLORS.info },
];

const efficiencyTrendData = [
  { time: '00:00', conveyor: 82.1, loading: 22.5 },
  { time: '04:00', conveyor: 83.8, loading: 21.2 },
  { time: '08:00', conveyor: 84.9, loading: 19.7 },
  { time: '12:00', conveyor: 84.9, loading: 19.7 },
  { time: '16:00', conveyor: 85.7, loading: 18.9 },
  { time: '20:00', conveyor: 85.2, loading: 19.3 },
];

const maintenanceData = [
  { equipment: 'Raw Mill Feed Conveyor', risk: 85, status: 'Critical', nextMaintenance: '4 hours' },
  { equipment: 'Kiln Drive Motor', risk: 35, status: 'Good', nextMaintenance: '720 hours' },
  { equipment: 'Cement Mill Gearbox', risk: 55, status: 'Warning', nextMaintenance: '168 hours' },
  { equipment: 'Preheater Fan', risk: 25, status: 'Good', nextMaintenance: '480 hours' },
  { equipment: 'Cooler Grate Drive', risk: 70, status: 'Warning', nextMaintenance: '72 hours' },
];

export function UtilitiesModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Utilities & Material Handling</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: <Timestamp />
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Power Consumption"
          value="95.5 kWh/t"
          change={{ value: "Target: 81.4 kWh/t", type: "neutral" }}
        >
          <Progress value={85.2} className="mt-2" />
        </KPICard>

        <KPICard
          title="Conveyor Efficiency"
          value="84.9%"
          change={{ value: "+2.8% vs yesterday", type: "positive" }}
        >
          <Progress value={84.9} className="mt-2" />
        </KPICard>

        <KPICard
          title="Loading Time"
          value="19.7 min"
          change={{ value: "Target: 15.1 min", type: "neutral" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            23% improvement potential
          </div>
        </KPICard>

        <KPICard
          title="Energy Savings"
          value="14.7%"
          change={{ value: "Optimization potential", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            ₹2.1L annual savings
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
