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
  
  resolverPeticion(id: number) { 
    this.alertService.mostrarInput(
      'Resolver Petición',
      'Escriba el mensaje de resolución para el empleado:',
      (respuesta?: string) => {
        if(!respuesta) return;
        
        this.api.resolverPeticion(id, { respuesta: respuesta }).subscribe({ 
          next: (res: any) => { 
            this.alertService.mostrarAlerta('Éxito', res.mensaje || 'Petición marcada como resuelta.', 'success'); 
            this.cargarPeticionesAdmin(); 
          }, 
          error: (err: any) => {
            const msj = err.error?.mensaje || 'Error al resolver la petición.';
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