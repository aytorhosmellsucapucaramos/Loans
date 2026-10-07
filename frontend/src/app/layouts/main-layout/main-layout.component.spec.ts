import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BreakpointObserver } from '@angular/cdk/layout';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { MainLayoutComponent } from './main-layout.component';

@Component({ standalone: true, template: '' })
class RouteStubComponent {}

describe('MainLayoutComponent mobile navigation', () => {
  it('shows only permitted links in primary navigation and More', async () => {
    const permissions = new Set(['customers.read', 'cash.read', 'reports.read']);
    const auth = {
      user$: of({ firstName: 'Ana', lastName: 'Quispe' }),
      hasPermission: (permission: string) => permissions.has(permission),
      logout: jasmine.createSpy('logout'),
    };

    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([{ path: 'reports', component: RouteStubComponent }]),
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: true, breakpoints: {} }) } },
        { provide: AuthService, useValue: auth },
        { provide: ThemeService, useValue: { isDark: () => false, toggle: jasmine.createSpy('toggle') } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainLayoutComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.primaryNavigation().map((item) => item.path)).toEqual(['/dashboard', '/customers']);
    expect(component.moreNavigation().map((item) => item.path)).toEqual(['/cash', '/reports']);
    expect(component.moreNavigation().some((item) => item.path === '/audit' || item.path === '/users')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.mobile-nav')).not.toBeNull();
    const themeToggle = fixture.nativeElement.querySelector('[aria-label="Cambiar a modo oscuro"]') as HTMLButtonElement;
    expect(themeToggle).not.toBeNull();
    themeToggle.click();
    expect(TestBed.inject(ThemeService).toggle).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('.mobile-nav a').length).toBe(2);

    (fixture.nativeElement.querySelector('.more-button') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const menuText = document.body.querySelector('.mat-mdc-menu-panel')?.textContent ?? '';
    expect(menuText).toContain('Caja');
    expect(menuText).toContain('Reportes');
    expect(menuText).not.toContain('Auditoría');
    expect(menuText).not.toContain('Usuarios');

    await TestBed.inject(Router).navigateByUrl('/reports');
    fixture.detectChanges();
    expect(component.isMoreActive()).toBeTrue();
  });

  it('keeps the authorized sidebar on desktop and hides bottom navigation', async () => {
    const auth = { user$: of(null), hasPermission: (permission: string) => permission === 'customers.read', logout: jasmine.createSpy('logout') };
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        provideRouter([{ path: 'reports', component: RouteStubComponent }]),
        { provide: BreakpointObserver, useValue: { observe: () => of({ matches: false, breakpoints: {} }) } },
        { provide: AuthService, useValue: auth },
        { provide: ThemeService, useValue: { isDark: () => true, toggle: jasmine.createSpy('toggle') } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.sidebar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.mobile-nav')).toBeNull();
    const sidebarText = fixture.nativeElement.querySelector('.sidebar')?.textContent ?? '';
    expect(sidebarText).toContain('Dashboard');
    expect(sidebarText).toContain('Clientes');
    expect(sidebarText).not.toContain('Usuarios');
    expect(sidebarText).not.toContain('Auditoría');
    expect(fixture.nativeElement.querySelector('[aria-label="Cambiar a modo claro"]')).not.toBeNull();
  });
});
