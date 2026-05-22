const STORAGE_KEY = 'husky-review-theme';

export function initTheme(): void {
  if (typeof window === 'undefined') {
    return;
  }
  const root = document.documentElement;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark') {
    root.classList.add('dark');
    return;
  }
  if (stored === 'light') {
    root.classList.remove('dark');
    return;
  }
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export function setTheme(mode: 'light' | 'dark'): void {
  const root = document.documentElement;
  root.classList.toggle('dark', mode === 'dark');
  localStorage.setItem(STORAGE_KEY, mode);
}

export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}
