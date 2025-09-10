'use client';

import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useActiveModule } from '@/hooks/use-active-module';
import { ExecutiveDashboard } from '@/components/modules/executive-dashboard';
import { RawMaterialsModule } from '@/components/modules/raw-materials';
import { KilnOperationsModule } from '@/components/modules/kiln-operations';
import { QualityControlModule } from '@/components/modules/quality-control';
import { FuelOptimizationModule } from '@/components/modules/fuel-optimization';
import { CrossProcessModule } from '@/components/modules/cross-process';
import { UtilitiesModule } from '@/components/modules/utilities';
import { AIInsightsModule } from '@/components/modules/ai-insights';

export function MainLayout() {
  const { activeModule, switchModule } = useActiveModule();

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'executive':
        return <ExecutiveDashboard />;
      case 'rawmaterials':
        return <RawMaterialsModule />;
      case 'kiln':
        return <KilnOperationsModule />;
      case 'quality':
        return <QualityControlModule />;
      case 'fuel':
        return <FuelOptimizationModule />;
      case 'integration':
        return <CrossProcessModule />;
      case 'utilities':
        return <UtilitiesModule />;
      case 'insights':
        return <AIInsightsModule />;
      default:
        return <ExecutiveDashboard />;
    }
  };

  return (
    <div className="h-screen w-full bg-background overflow-hidden">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar 
          activeModule={activeModule} 
          onModuleChange={switchModule} 
        />
        
        <main className="flex-1 ml-64 overflow-y-auto overflow-x-hidden h-full">
          <div className="p-4">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
