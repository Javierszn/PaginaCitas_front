import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  let requestClonado = req;

  // 1. EL TRUCO QUE BORRÉ: Recuperar tu token y pegarlo en todas las peticiones
  const sessionString = sessionStorage.getItem('usuarioRC');
  if (sessionString) {
    const usuario = JSON.parse(sessionString);
    if (usuario && usuario.token) {
      requestClonado = req.clone({
        setHeaders: {
          Authorization: `Bearer ${usuario.token}`
        }
      });
    }
  }

  return next(requestClonado).pipe(
    catchError((err) => {
      // Solo 401 significa que la sesión ya no es válida. Un 403 indica falta
      // de permiso para esa acción y no debe cerrar una sesión autenticada.
      if (err.status === 401 && !req.url.includes('/login')) {
        
        // Limpiamos la memoria
        sessionStorage.removeItem('usuarioRC');
        sessionStorage.removeItem('pasoRC');
        
        // Te regresamos al Login de forma segura y recargamos para matar "fantasmas"
        router.navigate(['/login']).then(() => {
            window.location.reload();
        });
      }
      
      return throwError(() => err);
    })
  );
};
