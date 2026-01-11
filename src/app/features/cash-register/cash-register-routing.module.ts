import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CashLayoutComponent } from './pages/cash-layout/cash-layout.component';

const routes: Routes = [
    { path: '', component: CashLayoutComponent },
    { path: 'history', loadComponent: () => import('./pages/sales-history/sales-history.component').then(m => m.SalesHistoryComponent) }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
// Routing module for Cash Register
export class CashRegisterRoutingModule { }
