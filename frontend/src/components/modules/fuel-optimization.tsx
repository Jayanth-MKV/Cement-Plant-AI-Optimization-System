'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { useKilnOperations, useAlternativeFuels, useOptimizationResults } from '../../hooks/use-supabase-data';

// Mock data as fallback
const mockKilnData = [
  { thermal_substitution_pct: 25.5, specific_heat_consumption_mjkg: 3.85, co2_emissions_tph: 850 }
];

const mockFuelData = [
  { fuel_type: 'Coal', thermal_substitution_pct: 75, co2_reduction_tph: 2.3 },
  { fuel_type: 'Biomass', thermal_substitution_pct: 10, co2_reduction_tph: 0.1 },
  { fuel_type: 'Pet Coke', thermal_substitution_pct: 8, co2_reduction_tph: 3.1 },
  { fuel_type: 'RDF', thermal_substitution_pct: 7, co2_reduction_tph: 0.8 }
];

const mockOptimizationData = [
  { optimization_type: 'fuel', improvement_pct: 12.5, cost_saved_usd: 125000 }
];

export function FuelOptimizationModule() {
  const { data: kilnData, loading: kilnLoading, error: kilnError } = useKilnOperations();
  const { data: fuelData, loading: fuelLoading, error: fuelError } = useAlternativeFuels();
  const { data: optimizationData, loading: optimizationLoading, error: optimizationError } = useOptimizationResults('fuel');

  console.log('🔥 Fuel Optimization Component Data:');
  console.log('Kiln data:', { data: kilnData, loading: kilnLoading, error: kilnError });
  console.log('Fuel data:', { data: fuelData, loading: fuelLoading, error: fuelError });
  console.log('Optimization data:', { data: optimizationData, loading: optimizationLoading, error: optimizationError });

  // Use real data if available, otherwise fallback to mock data
  const currentKilnData = kilnData.length > 0 ? kilnData : mockKilnData;
  const currentFuelData = fuelData.length > 0 ? fuelData : mockFuelData;
  const currentOptimizationData = optimizationData.length > 0 ? optimizationData : mockOptimizationData;

  // Calculate KPIs from real or mock data
  const avgThermalSubstitution = currentKilnData.reduce((sum, item) => sum + (item.thermal_substitution_pct || 0), 0) / currentKilnData.length;
  const avgHeatConsumption = currentKilnData.reduce((sum, item) => sum + (item.specific_heat_consumption_mjkg || 0), 0) / currentKilnData.length;
  const totalCO2Reduction = currentFuelData.reduce((sum, item) => sum + (item.co2_reduction_tph || 0), 0);
  const avgEfficiencyImprovement = currentOptimizationData.reduce((sum, item) => sum + (item.improvement_pct || 0), 0) / currentOptimizationData.length;

  console.log('📊 Calculated KPIs:', {
    avgThermalSubstitution,
    avgHeatConsumption,
    totalCO2Reduction,
    avgEfficiencyImprovement
  });

  const isLoading = kilnLoading || fuelLoading || optimizationLoading;
  const hasError = kilnError || fuelError || optimizationError;

  if (hasError) {
    console.error('❌ Fuel Optimization Errors:', { kilnError, fuelError, optimizationError });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Fuel Optimization</h1>
        <div className="text-sm text-gray-500">
          {isLoading ? 'Loading data...' : `Using ${kilnData.length > 0 ? 'live' : 'mock'} data`}
        </div>
      </div>

      {hasError && (
        <Card className="p-4 border-red-200 bg-red-50">
          <p className="text-red-600">
            Error loading data: {kilnError || fuelError || optimizationError}. Using fallback data.
          </p>
        </Card>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Thermal Substitution"
          value={isLoading ? "..." : `${avgThermalSubstitution.toFixed(1)}%`}
          change={isLoading ? undefined : { value: "+2.3%", type: "positive" }}
        />
        <KPICard
          title="Heat Consumption"
          value={isLoading ? "..." : `${avgHeatConsumption.toFixed(2)} MJ/kg`}
          change={isLoading ? undefined : { value: "-0.15 MJ/kg", type: "positive" }}
        />
        <KPICard
          title="CO₂ Reduction"
          value={isLoading ? "..." : `${totalCO2Reduction.toFixed(1)} tph`}
          change={isLoading ? undefined : { value: "+0.8 tph", type: "positive" }}
        />
        <KPICard
          title="Efficiency Gain"
          value={isLoading ? "..." : `${avgEfficiencyImprovement.toFixed(1)}%`}
          change={isLoading ? undefined : { value: "+1.2%", type: "positive" }}
        />
      </div>

      {/* Fuel Mix Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Alternative Fuel Mix</h3>
        <div className="space-y-4">
          {currentFuelData.map((fuel, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="font-medium">{fuel.fuel_type}</span>
              <div className="flex items-center space-x-4">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${fuel.thermal_substitution_pct}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12">
                  {fuel.thermal_substitution_pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Optimization Results */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Optimization Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Efficiency Improvement</h4>
            <p className="text-2xl font-bold text-green-600">
              {avgEfficiencyImprovement.toFixed(1)}%
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Cost Savings</h4>
            <p className="text-2xl font-bold text-green-600">
              ${currentOptimizationData[0]?.cost_saved_usd?.toLocaleString() || '125,000'}
            </p>
          </div>
        </div>
      </Card>

      {/* Data Source Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Data Source Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p>• Kiln Operations: {kilnData.length} records {kilnData.length > 0 ? '(Live Data)' : '(Mock Data)'}</p>
          <p>• Alternative Fuels: {fuelData.length} records {fuelData.length > 0 ? '(Live Data)' : '(Mock Data)'}</p>
          <p>• Optimization Results: {optimizationData.length} records {optimizationData.length > 0 ? '(Live Data)' : '(Mock Data)'}</p>
          <p className="mt-2 font-medium">
            Status: {isLoading ? 'Loading...' : hasError ? 'Error - Using Fallback' : 'Connected to Supabase'}
          </p>
        </div>
      </Card>
    </div>
  );
}
