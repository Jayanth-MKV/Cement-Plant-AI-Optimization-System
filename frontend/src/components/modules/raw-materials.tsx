'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Timestamp } from '@/components/timestamp';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '@/constants';
import { useRawMaterialFeed, useOptimizationResults } from '../../hooks/use-supabase-data';

// Mock data as fallback
const mockFeedRateData = [
  { time: '00:00', limestone: 195, clay: 39 },
  { time: '04:00', limestone: 198, clay: 41 },
  { time: '08:00', limestone: 201, clay: 42 },
  { time: '12:00', limestone: 198, clay: 41 },
  { time: '16:00', limestone: 202, clay: 43 },
  { time: '20:00', limestone: 199, clay: 41 },
];

export function RawMaterialsModule() {
  // Fetch real data
  const { data: rawMaterialData, loading: rawMaterialLoading, error: rawMaterialError } = useRawMaterialFeed();
  const { data: optimizationData, loading: optimizationLoading, error: optimizationError } = useOptimizationResults('raw_material');

  console.log('🏗️ Raw Materials Module Data:');
  console.log('Raw Material Feed:', { count: rawMaterialData.length, loading: rawMaterialLoading, error: rawMaterialError });
  console.log('Optimization Results:', { count: optimizationData.length, loading: optimizationLoading, error: optimizationError });

  const isLoading = rawMaterialLoading || optimizationLoading;
  const hasError = rawMaterialError || optimizationError;

  // Calculate current feed rates from database
  const getCurrentFeedRates = () => {
    if (rawMaterialData.length === 0) {
      return { limestone: 198, clay: 41, iron: 12, sand: 8 };
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
      limestone: materialRates.limestone || 198,
      clay: materialRates.clay || 41,
      iron: materialRates.iron_ore || materialRates.iron || 12,
      sand: materialRates.silica_sand || materialRates.sand || 8
    };
  };

  const currentRates = getCurrentFeedRates();

  // Generate feed rate trend data from recent records
  const feedRateData = rawMaterialData.length > 0 ? 
    rawMaterialData.slice(0, 6).reverse().map((item, index) => {
      const isLimestone = item.material_type?.toLowerCase().includes('limestone');
      const isClay = item.material_type?.toLowerCase().includes('clay');
      
      return {
        time: `${index * 4}:00`,
        limestone: isLimestone ? (item.feed_rate_tph || 198) : 198,
        clay: isClay ? (item.feed_rate_tph || 41) : 41
      };
    }) : mockFeedRateData;

  const [limestoneRate, setLimestoneRate] = React.useState([currentRates.limestone]);
  const [clayRate, setClayRate] = React.useState([currentRates.clay]);

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
          <div className="text-sm text-muted-foreground">
            Last updated: <Timestamp /> | Status: {isLoading ? 'Loading...' : hasError ? 'Error - Using Fallback' : 'Live Data Connected'}
          </div>
        </div>
      </div>

      {/* Data Status Alert */}
      {hasError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            ⚠️ Raw material feed data unavailable. Using fallback values for optimization controls.
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
                  <span>49.85%</span>
                </div>
                <div className="flex justify-between">
                  <span>SiO₂:</span>
                  <span>14.23%</span>
                </div>
                <div className="flex justify-between">
                  <span>Moisture:</span>
                  <span>9.67%</span>
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
                  <span>61.24%</span>
                </div>
                <div className="flex justify-between">
                  <span>Al₂O₃:</span>
                  <span>17.56%</span>
                </div>
                <div className="flex justify-between">
                  <span>Moisture:</span>
                  <span>19.82%</span>
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
                <div className="text-lg font-bold">83.5%</div>
              </div>
              <div className="text-lg">→</div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground">AI Optimized</span>
                <div className="text-lg font-bold text-green-600">91.2%</div>
              </div>
            </div>
            <div className="text-center">
              <span className="text-xs font-medium">Potential Savings: 17.3%</span>
            </div>
            </div>
          </CardContent>
        </Card>

        <Card className="chart-card">
          <CardContent className="flex flex-col p-4">
            <h3 className="text-base font-semibold mb-3">Feed Rate Optimization</h3>
            <div className="w-full h-[200px]">
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
            <div className="text-xs">{rawMaterialData.length} records {rawMaterialData.length > 0 ? '✅ Live' : '⚠️ Mock'}</div>
            <div className="text-xs mt-1">
              Current rates: Limestone {currentRates.limestone}t/h, Clay {currentRates.clay}t/h
            </div>
          </div>
          <div>
            <div className="font-medium">Optimization Results</div>
            <div className="text-xs">{optimizationData.length} records {optimizationData.length > 0 ? '✅ Live' : '⚠️ Mock'}</div>
            <div className="text-xs mt-1">
              Status: {isLoading ? '🔄 Loading...' : hasError ? '⚠️ Error - Using Fallback' : '✅ Connected'}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-green-200">
          <div className="font-medium text-green-800">
            Feed Rates: {rawMaterialData.length > 0 ? 'Calculated from live database' : 'Using fallback mock values'}
          </div>
          <div className="text-xs text-green-600 mt-1">
            Material types in database: {rawMaterialData.map(item => item.material_type).filter(Boolean).slice(0, 3).join(', ')}
          </div>
        </div>
      </Card>
    </div>
  );
}
