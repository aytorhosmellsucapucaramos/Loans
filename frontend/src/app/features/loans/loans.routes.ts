import { Routes } from '@angular/router';

import { LoanDetailPageComponent } from './pages/loan-detail-page/loan-detail-page.component';
import { LoansPageComponent } from './pages/loans-page/loans-page.component';

export const LOANS_ROUTES: Routes = [
  { path: '', component: LoansPageComponent },
  { path: ':id', component: LoanDetailPageComponent },
];
