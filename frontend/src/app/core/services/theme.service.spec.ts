import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;
  let originalPreference: string | null;

  beforeEach(() => {
    originalPreference = localStorage.getItem('prestameesta_theme');
    localStorage.removeItem('prestameesta_theme');
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
    TestBed.configureTestingModule({ providers: [ThemeService] });
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    if (originalPreference === null) localStorage.removeItem('prestameesta_theme');
    else localStorage.setItem('prestameesta_theme', originalPreference);
    document.documentElement.classList.remove('dark-theme');
    document.body.classList.remove('dark-theme');
  });

  it('uses the system preference when there is no saved choice and follows later changes', () => {
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      addEventListener: (_type: string, callback: EventListenerOrEventListenerObject) => { listener = callback as (event: MediaQueryListEvent) => void; },
    } as MediaQueryList);

    service.initialize();

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBeTrue();
    expect(document.body.classList.contains('dark-theme')).toBeTrue();
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#121212');

    listener?.({ matches: false } as MediaQueryListEvent);
    expect(service.theme()).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#ffffff');
  });

  it('restores a saved theme and does not let system changes override it', () => {
    localStorage.setItem('prestameesta_theme', 'light');
    let listener: ((event: MediaQueryListEvent) => void) | undefined;
    spyOn(window, 'matchMedia').and.returnValue({
      matches: true,
      addEventListener: (_type: string, callback: EventListenerOrEventListenerObject) => { listener = callback as (event: MediaQueryListEvent) => void; },
    } as MediaQueryList);

    service.initialize();
    listener?.({ matches: true } as MediaQueryListEvent);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBeFalse();
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#ffffff');
  });

  it('toggles and persists a manual selection', () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: false, addEventListener: () => undefined } as unknown as MediaQueryList);
    service.initialize();
    service.toggle();

    expect(service.isDark()).toBeTrue();
    expect(localStorage.getItem('prestameesta_theme')).toBe('dark');
    service.toggle();
    expect(localStorage.getItem('prestameesta_theme')).toBe('light');
  });
});
