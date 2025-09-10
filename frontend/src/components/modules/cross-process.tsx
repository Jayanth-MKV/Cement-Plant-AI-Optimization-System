'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from '@/components/timestamp';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { CHART_COLORS } from '@/constants';

const overallEfficiencyData = [
  { time: '00:00', current: 85.2, aiOptimized: 91.8 },
  { time: '04:00', current: 86.1, aiOptimized: 92.4 },
  { time: '08:00', current: 87.5, aiOptimized: 93.1 },
  { time: '12:00', current: 87.5, aiOptimized: 93.1 },
  { time: '16:00', current: 88.2, aiOptimized: 93.7 },
  { time: '20:00', current: 87.8, aiOptimized: 93.3 },
];

const processIntegrationData = [
  { process: 'Raw Materials', current: 81.9, target: 89.2, improvement: 8.9 },
  { process: 'Kiln Operations', current: 86.3, target: 94.1, improvement: 9.0 },
  { process: 'Quality Control', current: 90.9, target: 95.2, improvement: 4.7 },
  { process: 'Fuel Optimization', current: 75.4, target: 87.8, improvement: 16.4 },
  { process: 'Utilities', current: 78.6, target: 85.3, improvement: 8.5 },
];

const energyFlowData = [
  { source: 'Raw Mill', consumption: 32.2, optimized: 28.7, savings: 10.9 },
  { source: 'Kiln System', consumption: 45.8, optimized: 41.2, savings: 10.0 },
  { source: 'Cement Mill', consumption: 28.4, optimized: 25.1, savings: 11.6 },
  { source: 'Utilities', consumption: 15.6, optimized: 13.8, savings: 11.5 },
];

export function CrossProcessModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cross-Process Integration</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: <Timestamp />
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Overall Efficiency"
          value="87.5%"
          change={{ value: "AI Target: 93.1%", type: "positive" }}
        >
          <Progress value={94} className="mt-2" />
        </KPICard>

        <KPICard
          title="Energy Optimization"
          value="11.2%"
          change={{ value: "Savings potential", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            101.3 → 88.7 kWh/t
          </div>
        </KPICard>

        <KPICard
          title="Production Increase"
          value="9.9%"
          change={{ value: "vs current throughput", type: "positive" }}
        >
          <div className="text-xs text-muted-foreground mt-1">
            4,907 → 5,451 t/day
          </div>
        </KPICard>

        <KPICard
          title="Integration Score"
          value="89.3%"
          change={{ value: "Process synchronization", type: "positive" }}
        >
          <Progress value={89.3} className="mt-2" />
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
