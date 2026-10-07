import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'prestameesta_theme';
const THEME_COLORS: Record<AppTheme, string> = { light: '#ffffff', dark: '#121212' };

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly currentTheme = signal<AppTheme>('light');
  readonly theme = this.currentTheme.asReadonly();
  readonly isDark = computed(() => this.currentTheme() === 'dark');
  private mediaQuery?: MediaQueryList;
  private initialized = false;

  initialize(): void {
    if (!this.isBrowser || this.initialized) return;
    this.initialized = true;
    const storedTheme = this.readStoredTheme();
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.apply(storedTheme ?? (this.mediaQuery.matches ? 'dark' : 'light'));
    this.mediaQuery.addEventListener('change', this.onSystemThemeChange);
  }

  toggle(): void {
    this.setTheme(this.currentTheme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: AppTheme): void {
    this.currentTheme.set(theme);
    if (this.isBrowser) {
      try { window.localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* Storage may be disabled by the browser. */ }
    }
    this.apply(theme);
  }

  private readonly onSystemThemeChange = (event: MediaQueryListEvent): void => {
    if (this.readStoredTheme() === null) this.apply(event.matches ? 'dark' : 'light');
  };

  private readStoredTheme(): AppTheme | null {
    try {
      const value = window.localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'light' || value === 'dark' ? value : null;
    } catch { return null; }
  }

  private apply(theme: AppTheme): void {
    this.currentTheme.set(theme);
    this.document.documentElement.classList.toggle('dark-theme', theme === 'dark');
    this.document.body?.classList.toggle('dark-theme', theme === 'dark');
    let meta = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      this.document.head.appendChild(meta);
    }
    meta.content = THEME_COLORS[theme];
  }
}
