'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NAVIGATION_ITEMS } from '@/constants';
import { ModuleId } from '@/types/plant-data';

interface SidebarProps {
  activeModule: ModuleId;
  onModuleChange: (moduleId: ModuleId) => void;
}

export function Sidebar({ activeModule, onModuleChange }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-16 z-30 h-[calc(100vh-4rem)] w-64 border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="space-y-2 p-4">
        {NAVIGATION_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant={activeModule === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start gap-3",
              activeModule === item.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => onModuleChange(item.id)}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="text-sm">{item.label}</span>
          </Button>
        ))}
      </nav>
    </aside>
  );
}
