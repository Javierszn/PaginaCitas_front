import { Routes } from '@angular/router';
import { authGuard } from './auth.guard'; // Importamos a nuestro cadenero

export const routes: Routes = [
  // === ZONA PÚBLICA (CIUDADANOS) ===
  { 
    path: '', 
    loadComponent: () => import('./pages/agendar/agendar').then(m => m.AgendarComponent) 
  },
  { 
    path: 'buscar', 
    loadComponent: () => import('./pages/buscar/buscar').then(m => m.BuscarComponent) 
  },
  { 
    path: 'login', 
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) 
  },

  // === ZONA PRIVADA (EMPLEADOS - PROTEGIDA POR EL GUARDIA) ===
  { 
    path: 'admin/dashboard', 
    canActivate: [authGuard], 
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) 
  },
  { 
    path: 'admin/bitacora', 
    canActivate: [authGuard], 
    loadComponent: () => import('./pages/bitacora/bitacora').then(m => m.BitacoraComponent) 
  },
  { 
    path: 'admin/super', 
    canActivate: [authGuard], 
    loadComponent: () => import('./pages/super-admin/super-admin').then(m => m.SuperAdminComponent) 
  },
  { 
    path: 'admin/soporte', 
    canActivate: [authGuard], 
    loadComponent: () => import('./pages/soporte/soporte').then(m => m.SoporteComponent) 
  }
];