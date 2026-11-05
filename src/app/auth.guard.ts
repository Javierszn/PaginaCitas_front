import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const sessionUser = sessionStorage.getItem('usuarioRC');

  if (!sessionUser) return router.createUrlTree(['/login']);

  try {
    const usuario = JSON.parse(sessionUser);
    if (!usuario?.token || !usuario?.rol) throw new Error('Sesión incompleta');

    const rolesPermitidos = route.data['roles'] as string[] | undefined;
    if (rolesPermitidos?.length && !rolesPermitidos.includes(usuario.rol)) {
      return router.createUrlTree(['/admin/dashboard']);
    }

    return true;
  } catch {
    sessionStorage.removeItem('usuarioRC');
    sessionStorage.removeItem('pasoRC');
    return router.createUrlTree(['/login']);
  }
};
