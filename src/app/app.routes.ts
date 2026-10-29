import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'detalle-incidencia/:id',
    loadComponent: () =>
      import('./detalle-incidencia/detalle-incidencia.page').then(
        (m) => m.DetalleIncidenciaPage
      ),
  },
];