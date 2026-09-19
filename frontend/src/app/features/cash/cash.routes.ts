import { Routes } from '@angular/router';
import { CashHistoryPageComponent } from './pages/cash-history-page/cash-history-page.component';
import { CashPageComponent } from './pages/cash-page/cash-page.component';
export const CASH_ROUTES: Routes = [{ path: '', component: CashPageComponent }, { path: 'history', component: CashHistoryPageComponent }];
