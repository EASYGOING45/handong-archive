export type Route =
  | { kind: 'home' }
  | { kind: 'quiz' }
  | { kind: 'result'; payload: string }
  | { kind: 'notfound' };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  if (h === '' || h === '/') return { kind: 'home' };
  if (h === 'q' || h === 'quiz') return { kind: 'quiz' };
  if (h.startsWith('r/')) return { kind: 'result', payload: h.slice(2) };
  return { kind: 'notfound' };
}

export function navigate(to: Route): void {
  switch (to.kind) {
    case 'home': location.hash = '#/'; break;
    case 'quiz': location.hash = '#/q'; break;
    case 'result': location.hash = `#/r/${to.payload}`; break;
    case 'notfound': location.hash = '#/'; break;
  }
}

export function onRouteChange(cb: (r: Route) => void): void {
  const handler = (): void => cb(parseHash(location.hash));
  window.addEventListener('hashchange', handler);
  handler();
}
