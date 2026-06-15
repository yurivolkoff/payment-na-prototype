const KEY = 'payment-na-prototype-high-contrast';

export function initHighContrastFromStorage(): void {
  try {
    const enabled = localStorage.getItem(KEY) === '1';
    if (enabled) {
      document.documentElement.dataset.theme = 'high-contrast';
    }
  } catch {
    // localStorage unavailable; ignore.
  }
}

export function isHighContrast(): boolean {
  return document.documentElement.dataset.theme === 'high-contrast';
}

export function toggleHighContrast(): boolean {
  const next = !isHighContrast();
  if (next) {
    document.documentElement.dataset.theme = 'high-contrast';
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    localStorage.setItem(KEY, next ? '1' : '0');
  } catch {
    // ignore
  }
  return next;
}
