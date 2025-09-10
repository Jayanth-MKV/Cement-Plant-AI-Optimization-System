'use client';

import { useState, useEffect } from 'react';

export function Timestamp() {
  const [timestamp, setTimestamp] = useState<string>('');

  useEffect(() => {
    const updateTimestamp = () => {
      setTimestamp(new Date().toLocaleString());
    };

    // Set initial timestamp
    updateTimestamp();
    
    // Update every 10 seconds
    const interval = setInterval(updateTimestamp, 10000);

    return () => clearInterval(interval);
  }, []);

  return <span>{timestamp || '--'}</span>;
}
