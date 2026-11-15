import { useEffect, useState } from 'react';
import { portfolioStore } from '@/services/portfolioStore';
import type { Portfolio } from '@/types';

export function usePortfolio(): Portfolio {
  const [portfolio, setPortfolio] = useState<Portfolio>(portfolioStore.get());

  useEffect(() => {
    return portfolioStore.subscribe(setPortfolio);
  }, []);

  return portfolio;
}
