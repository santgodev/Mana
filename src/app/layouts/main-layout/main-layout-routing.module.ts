import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainLayoutComponent } from './main-layout.component';
import { RoleGuard } from '../../core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'tables',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'waiter'] },
        loadChildren: () => import('../../features/tables/tables.module').then(m => m.TablesModule)
      },
      {
        path: 'dashboard',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'waiter'] },
        loadChildren: () => import('../../features/dashboard/dashboard.module').then(m => m.DashboardModule)
      },

      {
        path: 'inventory',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('../../features/inventory/inventory.module').then(m => m.InventoryModule)
      },
      {
        path: 'caja',
        canActivate: [RoleGuard],
        data: { roles: ['admin', 'waiter'] },
        loadChildren: () => import('../../features/cash-register/cash-register.module').then(m => m.CashRegisterModule)
      },
      {
        path: 'sales',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('../../features/sales/sales.module').then(m => m.SalesModule)
      },
      {
        path: 'reports',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('../../features/reports/reports.module').then(m => m.ReportsModule)
      },
      {
        path: 'stations',
        canActivate: [RoleGuard],
        data: { roles: ['admin'] },
        loadComponent: () => import('../../features/stations/pages/stations-list/stations-list.component').then(m => m.StationsListComponent)
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainLayoutRoutingModule { }