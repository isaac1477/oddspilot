import { useEffect, useState, useCallback } from 'react';

export type Route =
  | { name: 'discover' }
  | { name: 'market-detail'; id: string }
  | { name: 'portfolio' }
  | { name: 'compare'; ids?: string[] }
  | { name: 'about' };

function parseHash(): Route {
  const raw = window.location.hash.slice(1);
  const hash = raw.startsWith('/') ? raw.slice(1) : raw;
  if (!hash || hash === 'discover') return { name: 'discover' };
  if (hash === 'portfolio') return { name: 'portfolio' };
  if (hash === 'compare') return { name: 'compare' };
  if (hash.startsWith('compare/')) {
    const ids = hash.slice('compare/'.length).split(',').filter(Boolean);
    return { name: 'compare', ids };
  }
  if (hash.startsWith('market/')) {
    const id = hash.slice('market/'.length);
    return { name: 'market-detail', id };
  }
  if (hash === 'about') return { name: 'about' };
  return { name: 'discover' };
}

function routeToHash(route: Route): string {
  switch (route.name) {
    case 'discover': return '#/';
    case 'portfolio': return '#/portfolio';
    case 'compare': return route.ids?.length ? `#/compare/${route.ids.join(',')}` : '#/compare';
    case 'about': return '#/about';
    case 'market-detail': return `#/market/${route.id}`;
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const handler = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = useCallback((to: Route) => {
    window.location.hash = routeToHash(to);
  }, []);

  return { route, navigate };
}
