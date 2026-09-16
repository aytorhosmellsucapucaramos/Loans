import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  it('se crea', async () => {
    await TestBed.configureTestingModule({ imports: [DashboardPageComponent, HttpClientTestingModule] }).compileComponents();
    expect(TestBed.createComponent(DashboardPageComponent).componentInstance).toBeTruthy();
  });
});
