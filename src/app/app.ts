import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- AQUÍ ESTÁ EL RESCATISTA
import { Router, RouterModule } from '@angular/router';
import { AlertService } from './alert.service';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // <--- Y AQUÍ LO DECLARAMOS
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit, OnDestroy {
  // Solo conservamos las variables de tu Modal de Alertas Originales
  mostrarAlerta: boolean = false;
  alertaTitulo: string = '';
  alertaMensaje: string = '';
  alertaIcono: string = 'info'; 
  alertaTipo: 'alerta' | 'confirmacion' | 'input' = 'alerta';
  accionConfirmacion: (valor?: string) => void = () => {};
  inputTemporal: string = '';

  private router = inject(Router);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);

  // Intervalo para el polling de verificación de sesión remota
  private intervaloSesion: any;
  private readonly INTERVALO_MS = 30000; // 30 segundos

  ngOnInit() {
    // Escuchamos al Mensajero para saber cuándo dibujar una de tus alertas
    this.alertService.alert$.subscribe(alerta => {
      this.alertaTitulo = alerta.titulo;
      this.alertaMensaje = alerta.mensaje;
      this.alertaIcono = alerta.icono;
      this.alertaTipo = alerta.tipo;
      this.accionConfirmacion = alerta.accion || (() => {});
      this.inputTemporal = '';
      this.mostrarAlerta = true;
      this.cdr.detectChanges();
    });

    // NUEVO: arrancamos el vigilante de sesión remota
    this.iniciarVigilanteDeSesion();
  }

  ngOnDestroy() {
    if (this.intervaloSesion) {
      clearInterval(this.intervaloSesion);
    }
  }

  // Revisa periódicamente si el Super Admin forzó el cierre de esta sesión
  // desde el panel (Registro_Accesos.fecha_logout ya no es null).
  private iniciarVigilanteDeSesion() {
    this.intervaloSesion = setInterval(() => {
      const sessionUser = sessionStorage.getItem('usuarioRC');
      if (!sessionUser) return; // no hay sesión activa, nada que revisar

      const usuario = JSON.parse(sessionUser);
      if (!usuario?.username) return;

      this.api.verificarEstadoSesion(usuario.username).subscribe({
        next: (res: any) => {
          if (!res?.activa) {
            this.forzarCierreLocal();
          }
        },
        // Si el token ya expiró o el backend responde 401/403, también cerramos localmente
        error: (err: any) => {
          if (err.status === 401 || err.status === 403) {
            this.forzarCierreLocal();
          }
        }
      });
    }, this.INTERVALO_MS);
  }

  private forzarCierreLocal() {
    sessionStorage.removeItem('usuarioRC');
    sessionStorage.removeItem('pasoRC');
    if (this.intervaloSesion) {
      clearInterval(this.intervaloSesion);
    }
    this.router.navigate(['/login']).then(() => window.location.reload());
  }

  // Cierra tus alertas originales
  cerrarAlerta() { this.mostrarAlerta = false; }
  
  // Ejecuta la acción de tu confirmación o input original
  ejecutarConfirmacion() { 
    this.mostrarAlerta = false; 
    if (this.alertaTipo === 'input') { this.accionConfirmacion(this.inputTemporal); } 
    else { this.accionConfirmacion(); }
  }

  // El botón global del encabezado
  irABuscarCita() { 
    this.router.navigate(['/buscar']); 
  }

  // EL BOTÓN DEL LOGO QUE LLEVA A LA PÁGINA PRINCIPAL
  regresarPaso1() { 
    if (this.router.url === '/') {
      window.location.reload(); 
    } else {
      this.router.navigate(['/']).then(() => window.scrollTo(0, 0));
    }
  }
}