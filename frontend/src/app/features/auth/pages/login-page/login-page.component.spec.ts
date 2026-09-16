import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { LoginPageComponent } from './login-page.component';

describe('LoginPageComponent', () => {
  it('crea el formulario de inicio de sesión', async () => {
    await TestBed.configureTestingModule({ imports: [LoginPageComponent, RouterTestingModule, HttpClientTestingModule] }).compileComponents();
    expect(TestBed.createComponent(LoginPageComponent).componentInstance.form.controls.email).toBeTruthy();
  });
});
