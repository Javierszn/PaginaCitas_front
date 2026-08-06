import { HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionUser = sessionStorage.getItem('usuarioRC');
  let authReq = req;

  if (sessionUser) {
    const usuario = JSON.parse(sessionUser);
    if (usuario.token) {
      authReq = req.clone({
        setHeaders: { Authorization: `Bearer ${usuario.token}` }
      });
    }
  }

  return next(authReq).pipe(
    catchError((error) => {
      // AQUÍ ESTÁ EL CAMBIO: Excluimos la ruta de login para que el app.ts maneje el error con tu diseño
      if (error.status === 401 && !req.url.includes('/Auth/login')) {
        sessionStorage.removeItem('usuarioRC');
        sessionStorage.removeItem('pasoRC');
        alert('Tu sesión ha expirado o ha sido cerrada remotamente por seguridad. Vuelve a iniciar sesión.');
        window.location.reload(); 
      }
      return throwError(() => error);
    })
  );
};