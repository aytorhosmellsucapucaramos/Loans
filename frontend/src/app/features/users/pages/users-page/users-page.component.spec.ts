import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { UsersPageComponent } from './users-page.component';

describe('UsersPageComponent', () => {
  it('se crea', async () => {
    await TestBed.configureTestingModule({ imports: [UsersPageComponent, HttpClientTestingModule, NoopAnimationsModule] }).compileComponents();
    expect(TestBed.createComponent(UsersPageComponent).componentInstance).toBeTruthy();
  });
});
