import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', children: [] }, 

  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'admin/dashboard', 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) 
  },
  { 
    path: 'admin/bitacora', 
    loadComponent: () => import('./pages/bitacora/bitacora').then(m => m.BitacoraComponent) 
  }
];