'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">CementAI</h1>
          <span className="text-sm text-muted-foreground">
            Autonomous Plant Operations
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            AI Optimized
          </Badge>
        </div>
      </div>
    </header>
  );
}
