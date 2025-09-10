'use client';

import { useState } from 'react';
import { ModuleId } from '@/types/plant-data';

export function useActiveModule(initialModule: ModuleId = 'executive') {
  const [activeModule, setActiveModule] = useState<ModuleId>(initialModule);

  const switchModule = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
  };

  return {
    activeModule,
    switchModule,
  };
}
