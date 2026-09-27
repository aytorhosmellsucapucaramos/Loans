import { ElementRef } from '@angular/core';

import { ScrollableTableComponent } from './scrollable-table.component';

describe('ScrollableTableComponent', () => {
  it('shows only edge indicators that match horizontal scroll position', () => {
    const viewport = document.createElement('div');
    let scrollLeft = 0;
    Object.defineProperty(viewport, 'clientWidth', { value: 100 });
    Object.defineProperty(viewport, 'scrollWidth', { value: 300 });
    Object.defineProperty(viewport, 'scrollLeft', { get: () => scrollLeft, set: (value: number) => { scrollLeft = value; } });
    const component = new ScrollableTableComponent();
    component.viewport = new ElementRef(viewport);

    component.ngAfterContentInit();
    expect(component.hasOverflow()).toBeTrue();
    expect(component.canScrollLeft()).toBeFalse();
    expect(component.canScrollRight()).toBeTrue();

    viewport.scrollLeft = 80;
    viewport.dispatchEvent(new Event('scroll'));
    expect(component.canScrollLeft()).toBeTrue();
    expect(component.canScrollRight()).toBeTrue();

    viewport.scrollLeft = 200;
    viewport.dispatchEvent(new Event('scroll'));
    expect(component.canScrollLeft()).toBeTrue();
    expect(component.canScrollRight()).toBeFalse();
    component.ngOnDestroy();
  });

  it('hides indicators when table fits viewport', () => {
    const viewport = document.createElement('div');
    Object.defineProperty(viewport, 'clientWidth', { value: 300 });
    Object.defineProperty(viewport, 'scrollWidth', { value: 300 });
    const component = new ScrollableTableComponent();
    component.viewport = new ElementRef(viewport);

    component.ngAfterContentInit();

    expect(component.hasOverflow()).toBeFalse();
    expect(viewport.hasAttribute('tabindex')).toBeFalse();
    component.ngOnDestroy();
  });
});
