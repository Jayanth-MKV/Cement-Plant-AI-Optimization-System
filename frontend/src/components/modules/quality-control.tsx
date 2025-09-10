'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPICard } from '@/components/ui/kpi-card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Timestamp } from '@/components/timestamp';

export function QualityControlModule() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Quality Control</h2>
        <p className="text-sm text-muted-foreground">
          Last updated: <Timestamp />
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="AI Quality Score"
          value="90.9%"
          change={{ value: "+2.1% this week", type: "positive" }}
        />
        <KPICard
          title="Vision Accuracy"
          value="98.54%"
          change={{ value: "Defect detection", type: "positive" }}
        />
        <KPICard
          title="Compliance Rate"
          value="98.7%"
          change={{ value: "Specification compliance", type: "positive" }}
        />
        <KPICard
          title="Defects Today"
          value="8"
          change={{ value: "5 corrections made", type: "neutral" }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Real-time Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Compressive Strength</span>
                <span>45.5 MPa</span>
              </div>
              <Progress value={91} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Fineness (Blaine)</span>
                <span>348.7 m²/kg</span>
              </div>
              <Progress value={87} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Setting Time</span>
                <span>64.4 min</span>
              </div>
              <Progress value={82} className="mt-1" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Free Lime Content</span>
                <span>1.36%</span>
              </div>
              <Progress value={94} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Defect Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">98.54%</div>
              <div className="text-sm text-muted-foreground">Vision Accuracy</div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">8</div>
                <div className="text-muted-foreground">Defects Detected</div>
              </div>
              <div>
                <div className="font-medium">0.35%</div>
                <div className="text-muted-foreground">False Positive Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-50">Warning</Badge>
              <span className="text-sm">Quality deviation predicted in 6 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50">Good</Badge>
              <span className="text-sm">All parameters within spec</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
