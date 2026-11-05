import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'tabs',
    canActivate: [authGuard],
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'detalle-incidencia/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./detalle-incidencia/detalle-incidencia.page').then(
        (m) => m.DetalleIncidenciaPage
      ),
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
