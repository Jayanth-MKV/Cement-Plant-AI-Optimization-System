'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw } from 'lucide-react';

export function AIInsightsModule() {
  const immediateActions = [
    "Reduce kiln temperature by 5°C to optimize fuel consumption",
    "Increase limestone feed rate by 8 tons/hour for better raw mix",
    "Switch to 22% alternative fuel mix for cost optimization",
    "Adjust grinding mill speed to 15.2 RPM for efficiency"
  ];

  const predictiveAlerts = [
    "Raw mill bearing temperature trending high - maintenance in 72 hours",
    "Quality deviation predicted in 6 hours due to clay moisture content",
    "Energy cost spike expected tomorrow - switch to biomass fuel",
    "Clinker cooler efficiency declining - inspect grate plates"
  ];

  const optimizationOpportunities = [
    "Implement waste heat recovery - potential 12% energy savings",
    "Optimize preheater cyclone efficiency - 3% production increase possible",
    "Alternative fuel blend optimization - ₹2.3M annual savings",
    "Preventive maintenance scheduling - 15% downtime reduction"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">AI Insights</h2>
        <Button variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Immediate Actions
              <Badge variant="secondary">{immediateActions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {immediateActions.map((action, index) => (
                <div key={index} className="text-sm p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                  {action}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Predictive Alerts
              <Badge variant="destructive">{predictiveAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {predictiveAlerts.map((alert, index) => (
                <div key={index} className="text-sm p-3 bg-yellow-50 dark:bg-yellow-950 rounded-md">
                  {alert}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Optimization Opportunities
              <Badge variant="outline">{optimizationOpportunities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationOpportunities.map((opportunity, index) => (
                <div key={index} className="text-sm p-3 bg-green-50 dark:bg-green-950 rounded-md">
                  {opportunity}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
