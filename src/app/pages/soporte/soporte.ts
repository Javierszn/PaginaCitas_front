import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service'; // <--- NUESTRO MENSAJERO

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './soporte.html',
  styleUrls: ['./soporte.css']
})
export class SoporteComponent implements OnInit {
  usuarioSesion: any = null;
  peticionesSistema: any[] = [];
  notificacionesNuevas: number = 0;

  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private alertService = inject(AlertService); // <--- INYECTADO

  private extraerError(err: any, mensajePredeterminado: string): string {
    const cuerpo = err?.error;
    if (typeof cuerpo?.mensaje === 'string' && cuerpo.mensaje.trim()) return cuerpo.mensaje;
    if (typeof cuerpo?.detail === 'string' && cuerpo.detail.trim()) return cuerpo.detail;

    if (cuerpo?.errors && typeof cuerpo.errors === 'object') {
      const errores = Object.values(cuerpo.errors).flatMap((valor: any) => Array.isArray(valor) ? valor : [valor]);
      if (errores.length) return errores.join('\n');
    }

    if (typeof cuerpo?.title === 'string' && cuerpo.title.trim()) return cuerpo.title;
    if (typeof cuerpo === 'string' && cuerpo.trim() && !cuerpo.trim().startsWith('<')) return cuerpo;
    if (err?.status === 0) return 'No se pudo conectar con el servidor. Revisa la conexión y la URL de la API.';
    if (err?.status) return `${mensajePredeterminado} (HTTP ${err.status}${err.statusText ? `: ${err.statusText}` : ''})`;
    return mensajePredeterminado;
  }

  ngOnInit() {
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      // Guardia: Solo el Super Admin atiende el centro de soporte
      if(this.usuarioSesion.rol !== 'Super Administrador') {
         this.router.navigate(['/admin/dashboard']);
         return;
      }
      this.cargarPeticionesAdmin();
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarPeticionesAdmin() { 
    this.api.getPeticionesAdmin().subscribe({ 
      next: (res: any) => { 
        this.peticionesSistema = res; 
        this.notificacionesNuevas = this.peticionesSistema.filter((p: any) => p.estatus === 'PENDIENTE' && p.leido === false).length; 
        this.cdr.detectChanges(); 
      },
      error: () => this.alertService.mostrarAlerta('Error', 'No se pudieron cargar las peticiones.', 'error')
    }); 
  }
  
  resolverPeticion(id: number, tipo?: string) {
    if (tipo === 'RECUPERAR CONTRASEÑA') {
      this.alertService.mostrarInput(
        'Restablecer Contraseña',
        'Escriba la contraseña temporal que le va a dar al empleado:',
        (nuevaPassword?: string) => {
          if (!nuevaPassword) return;

          this.api.resolverPeticion(id, {
            respuesta: `Su contraseña temporal es: ${nuevaPassword}. Deberá cambiarla al iniciar sesión.`,
            nuevaPassword: nuevaPassword
          }).subscribe({
            next: (res: any) => {
              this.alertService.mostrarAlerta('Éxito', res.mensaje || 'Contraseña restablecida.', 'success');
              this.cargarPeticionesAdmin();
            },
            error: (err: any) => {
              const msj = this.extraerError(err, 'Error al restablecer la contraseña.');
              this.alertService.mostrarAlerta('Error', msj, 'error');
            }
          });
        }
      );
      return;
    }

    this.alertService.mostrarInput(
      'Resolver Petición',
      'Escriba el mensaje de resolución para el empleado:',
      (respuesta?: string) => {
        if (!respuesta?.trim()) return;
        if (respuesta.trim().length > 500) {
          this.alertService.mostrarAlerta('Atención', 'La respuesta no puede superar los 500 caracteres.', 'warning');
          return;
        }
        
        this.api.resolverPeticion(id, { respuesta: respuesta.trim() }).subscribe({
          next: (res: any) => { 
            this.alertService.mostrarAlerta('Éxito', res.mensaje || 'Petición marcada como resuelta.', 'success'); 
            this.cargarPeticionesAdmin(); 
          }, 
          error: (err: any) => {
            const msj = this.extraerError(err, 'Error al resolver la petición.');
            this.alertService.mostrarAlerta('Error', msj, 'error');
          }
        }); 
      }
    );
  }

  regresarADashboard() { 
    this.router.navigate(['/admin/dashboard']); 
  }
}
