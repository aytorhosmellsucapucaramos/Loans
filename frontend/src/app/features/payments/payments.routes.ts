import { Routes } from '@angular/router';

import { PaymentDetailPageComponent } from './pages/payment-detail-page/payment-detail-page.component';
import { PaymentsPageComponent } from './pages/payments-page/payments-page.component';

export const PAYMENTS_ROUTES: Routes = [
  { path: '', component: PaymentsPageComponent },
  { path: ':id', component: PaymentDetailPageComponent },
];
