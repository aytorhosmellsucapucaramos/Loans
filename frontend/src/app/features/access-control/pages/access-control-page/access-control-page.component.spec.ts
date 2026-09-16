import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AccessControlPageComponent } from './access-control-page.component';

describe('AccessControlPageComponent', () => {
  it('se crea', async () => {
    await TestBed.configureTestingModule({ imports: [AccessControlPageComponent, HttpClientTestingModule, NoopAnimationsModule] }).compileComponents();
    expect(TestBed.createComponent(AccessControlPageComponent).componentInstance).toBeTruthy();
  });
});
