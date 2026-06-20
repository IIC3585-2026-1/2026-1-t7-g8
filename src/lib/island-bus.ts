export const EVT_SELECTION_CHANGED = 'crypto:selection-changed';
export const EVT_REQUEST_SELECTION = 'crypto:request-selection';

export const STORAGE_KEY = 'crypto:selection';

export type SelectionChangedDetail = { symbols: string[] };

export function dispatchSelection(symbols: readonly string[]): void {
  if (typeof window === 'undefined') return;
  const detail: SelectionChangedDetail = { symbols: Array.from(symbols) };
  window.dispatchEvent(new CustomEvent(EVT_SELECTION_CHANGED, { detail }));
}

export function requestSelection(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(EVT_REQUEST_SELECTION));
}
