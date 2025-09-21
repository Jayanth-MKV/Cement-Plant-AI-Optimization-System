"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
// NOTE: Temporarily using hardcoded AI insights for demo/offline usage.
// Remove these imports when re-enabling live backend + websocket integration.
// import { apiService } from '@/services/api';
// import { useWebSocket } from '@/services/websocket';
import { AIRecommendation } from "@/types/api";

export function AIInsightsModule() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<
    "connected" | "disconnected" | "connecting"
  >("connected");

  // WebSocket connection for real-time recommendations
  // WebSocket disabled for hardcoded mode
  // const { isConnected: wsConnected, error: wsError, lastMessage } = useWebSocket('plant-data');

  // Hardcoded demo insights reflecting backend AI optimizers (see docs/features/doc.md)
  const demoRecommendations: AIRecommendation[] = [
    {
      id: 1,
      created_at: new Date().toISOString(),
      recommendation_type: "raw_material_variability",
      process_area: "Raw Materials",
      description:
        "Feed variability score elevated (72/100). Reduce moisture by 1.5% and adjust feeder rate -3 tph to stabilize kiln chemistry.",
      priority_level: 7,
      expected_savings_usd: 8500,
      action_taken: false,
    },
    {
      id: 2,
      created_at: new Date().toISOString(),
      recommendation_type: "grinding_energy_optimization",
      process_area: "Grinding",
      description:
        "Mill differential pressure trending high. Suggest separator speed -2% and feed rate +1.5 tph for projected 3.2% kWh/ton reduction.",
      priority_level: 8,
      expected_savings_usd: 12400,
      action_taken: false,
    },
    {
      id: 3,
      created_at: new Date().toISOString(),
      recommendation_type: "kiln_fuel_mix",
      process_area: "Kiln",
      description:
        "Burning zone temp slightly above optimal (1458°C vs 1450°C). Increase alt fuel TSR from 18% to 21% and lower coal rate 0.7 tph for CO₂ cut ~2.4%.",
      priority_level: 9,
      expected_savings_usd: 17300,
      action_taken: false,
    },
    {
      id: 4,
      created_at: new Date().toISOString(),
      recommendation_type: "quality_defect_prevention",
      process_area: "Quality",
      description:
        "Early strength variance detected. Adjust gypsum addition +0.3% and maintain Blaine 3400–3450 to avoid 7-day strength drop.",
      priority_level: 6,
      expected_savings_usd: 5600,
      action_taken: false,
    },
    {
      id: 5,
      created_at: new Date().toISOString(),
      recommendation_type: "alternative_fuel_optimization",
      process_area: "Fuels",
      description:
        "Moisture in RDF batch higher (27%). Pre-dry or blend with higher CV biomass to target net CV 18.5 MJ/kg enabling +3% TSR.",
      priority_level: 5,
      expected_savings_usd: 4100,
      action_taken: false,
    },
    {
      id: 6,
      created_at: new Date().toISOString(),
      recommendation_type: "predictive_maintenance",
      process_area: "Utilities",
      description:
        "Fan bearing vibration trending upward (RMS +18% in 7d). Schedule lubrication & alignment within 72h to avoid unplanned stop.",
      priority_level: 8,
      expected_savings_usd: 9200,
      action_taken: false,
    },
    {
      id: 7,
      created_at: new Date().toISOString(),
      recommendation_type: "cross_process_roi",
      process_area: "Strategic",
      description:
        "Top 3 ROI actions: (1) Raise TSR +3% (2) Grinding kWh/t -3% (3) Reduce variability index <60. Combined annual impact ~$640k.",
      priority_level: 9,
      expected_savings_usd: 640000,
      action_taken: false,
    },
    {
      id: 8,
      created_at: new Date().toISOString(),
      recommendation_type: "nl_query_response",
      process_area: "Operator Assist",
      description:
        "Operator asked: “How to cut CO₂ today?” – Suggest increase alt fuel blend, optimize kiln temp band ±5°C, and reduce idle fan load.",
      priority_level: 6,
      expected_savings_usd: 3100,
      action_taken: false,
    },
    {
      id: 9,
      created_at: new Date().toISOString(),
      recommendation_type: "emissions_control",
      process_area: "Kiln",
      description:
        "NOx drift above baseline. Tighten secondary air control loop and lower primary air 2% to restore stable combustion profile.",
      priority_level: 7,
      expected_savings_usd: 4800,
      action_taken: false,
    },
    {
      id: 10,
      created_at: new Date().toISOString(),
      recommendation_type: "clinker_factor_reduction",
      process_area: "Quality",
      description:
        "LSF stable. Trial +2% mineralizer addition + +1% SCM substitution to safely reduce clinker factor while holding strength KPIs.",
      priority_level: 5,
      expected_savings_usd: 22000,
      action_taken: false,
    },
    {
      id: 11,
      created_at: new Date().toISOString(),
      recommendation_type: "thermal_efficiency",
      process_area: "Kiln",
      description:
        "Preheater exit gas temp 14°C above target. Inspect for minor build-up in stage 4 – potential 1.1% heat consumption improvement.",
      priority_level: 6,
      expected_savings_usd: 9600,
      action_taken: false,
    },
    {
      id: 12,
      created_at: new Date().toISOString(),
      recommendation_type: "energy_baseload_reduction",
      process_area: "Utilities",
      description:
        "Idle air compressor cycling inefficiency detected. Consolidate loads to 2 units off-peak – est. 4% baseload kWh cut.",
      priority_level: 6,
      expected_savings_usd: 7800,
      action_taken: false,
    },
  ];

  const fetchRecommendations = () => {
    // Simulate async loading delay if desired
    setIsLoading(true);
    setTimeout(() => {
      setRecommendations(demoRecommendations);
      setIsLoading(false);
      setBackendStatus("connected");
    }, 400);
  };

  useEffect(() => {
    fetchRecommendations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categorizeRecommendations = (recommendations: AIRecommendation[]) => {
    const immediateActions = recommendations.filter(
      (r) => r.priority_level >= 8
    );
    const predictiveAlerts = recommendations.filter(
      (r) => r.priority_level >= 6 && r.priority_level < 8
    );
    const optimizationOpportunities = recommendations.filter(
      (r) => r.priority_level < 6
    );

    return {
      immediateActions: immediateActions.length > 0 ? immediateActions : [],
      predictiveAlerts: predictiveAlerts.length > 0 ? predictiveAlerts : [],
      optimizationOpportunities:
        optimizationOpportunities.length > 0 ? optimizationOpportunities : [],
    };
  };

  const handleRefresh = () => {
    fetchRecommendations();
  };

  const { immediateActions, predictiveAlerts, optimizationOpportunities } =
    categorizeRecommendations(recommendations);

  const loadingState = (
    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
      <span>Loading AI insights...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div
              className={`w-2 h-2 rounded-full ${
                backendStatus === "connected"
                  ? "bg-green-500"
                  : backendStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-sm text-muted-foreground">
              {backendStatus === "connected"
                ? "Demo data active"
                : `Backend ${backendStatus}`}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh Insights
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">
            ⚠️ {error} - No recommendations available
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              High Priority / Immediate
              <Badge variant="outline">{immediateActions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && loadingState}
            <div className="space-y-3">
              {immediateActions.map((r) => (
                <div
                  key={r.id}
                  className="text-sm p-3 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40"
                >
                  <p className="font-medium">{r.process_area}</p>
                  <p>{r.description}</p>
                  {r.expected_savings_usd && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Est. Impact: ${r.expected_savings_usd.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              Predictive / Preventive
              <Badge variant="outline">{predictiveAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && loadingState}
            <div className="space-y-3">
              {predictiveAlerts.map((r) => (
                <div
                  key={r.id}
                  className="text-sm p-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40"
                >
                  <p className="font-medium">{r.process_area}</p>
                  <p>{r.description}</p>
                  {r.expected_savings_usd && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Est. Impact: ${r.expected_savings_usd.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
              Optimization Opportunities
              <Badge variant="outline">
                {optimizationOpportunities.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && loadingState}
            <div className="space-y-3">
              {optimizationOpportunities.map((r) => (
                <div
                  key={r.id}
                  className="text-sm p-3 rounded-md border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40"
                >
                  <p className="font-medium">{r.process_area}</p>
                  <p>{r.description}</p>
                  {r.expected_savings_usd && (
                    <p className="text-xs mt-1 text-muted-foreground">
                      Est. Impact: ${r.expected_savings_usd.toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
