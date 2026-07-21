import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';


export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const usuarioString = sessionStorage.getItem('usuarioRC');
  if (usuarioString) {
    const usuario = JSON.parse(usuarioString);
   
    if (usuario.token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${usuario.token}` }
      });
    }
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};