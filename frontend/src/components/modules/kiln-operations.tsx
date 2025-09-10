'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Slider } from '@/components/ui/slider';
import { Timestamp } from '@/components/timestamp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/constants';

const temperatureData = [
  { zone: 'Preheater Top', temp: 352.4 },
  { zone: 'Preheater Bottom', temp: 897.6 },
  { zone: 'Calciner', temp: 901.3 },
  { zone: 'Kiln Inlet', temp: 1067.2 },
  { zone: 'Burning Zone', temp: 1467.8 },
  { zone: 'Cooler Inlet', temp: 1243.5 },
];

export function KilnOperationsModule() {
  const [coalRate, setCoalRate] = React.useState([90]);
  const [altFuelRate, setAltFuelRate] = React.useState([20]);

  return (
    <div className="h-full w-full flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Kiln Operations</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: <Timestamp />
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 h-[35%]">
        <KPICard
          title="Kiln Efficiency"
          value="86.3%"
          change={{ value: "+2.1% from target", type: "positive" }}
        />

        <KPICard
          title="Burning Zone Temp"
          value="1462.3°C"
          change={{ value: "Optimal range", type: "positive" }}
        />

        <KPICard
          title="Production Rate"
          value="188.2 t/h"
          change={{ value: "+5.7% vs target", type: "positive" }}
        />

        <KPICard
          title="Energy Savings"
          value="9.7%"
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
