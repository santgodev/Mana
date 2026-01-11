import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/tables', pathMatch: 'full' },
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  // Products route is handled inside MainLayout

  {
    path: 'kitchen',
    loadComponent: () => import('./features/kitchen/components/kitchen-board/kitchen-board.component').then(m => m.KitchenBoardComponent)
    // Security disabled for dev
  },
  {
    path: '',
    loadChildren: () => import('./layouts/main-layout/main-layout.module').then(m => m.MainLayoutModule)
  },
  {
    path: 'client',
    loadComponent: () => import('./features/client/layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      {
        path: 'menu',
        loadComponent: () => import('./features/client/pages/client-menu/client-menu.component').then(m => m.ClientMenuComponent)
      },
      {
        path: 'menu/:tableId',
        loadComponent: () => import('./features/client/pages/client-menu/client-menu.component').then(m => m.ClientMenuComponent)
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/client/pages/client-cart/client-cart.component').then(m => m.ClientCartComponent)
      },
      {
        path: 'cart/:tableId',
        loadComponent: () => import('./features/client/pages/client-cart/client-cart.component').then(m => m.ClientCartComponent)
      },
      { path: '', redirectTo: 'menu', pathMatch: 'full' }
    ]
  },
  {
    path: 'pricing',
    loadComponent: () => import('./features/landing/pricing-calculator/pricing-calculator.component').then(m => m.PricingCalculatorComponent)
  },
  { path: '**', redirectTo: '/tables' }
];