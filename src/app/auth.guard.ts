import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const sessionUser = sessionStorage.getItem('usuarioRC');

  // Si hay sesión activa, el cadenero lo deja pasar
  if (sessionUser) {
    return true; 
  } else {
    // Si no hay sesión, lo patea al login inmediatamente
    router.navigate(['/login']);
    return false;
  }
};