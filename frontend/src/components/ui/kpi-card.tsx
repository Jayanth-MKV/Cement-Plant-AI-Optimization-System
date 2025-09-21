import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function KPICard({ 
  title, 
  value, 
  change, 
  icon, 
  className,
  children 
}: KPICardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="h-full flex flex-col">
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs text-muted-foreground",
            change.type === 'positive' && "text-green-600",
            change.type === 'negative' && "text-red-600"
          )}>
            {change.value}
          </p>
        )}
        {children && <div className="mt-2 h-16 overflow-hidden">{children}</div>}
      </CardContent>
    </Card>
  );
}
