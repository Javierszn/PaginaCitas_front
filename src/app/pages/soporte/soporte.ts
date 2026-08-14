import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';

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
      error: () => alert('Error al cargar las peticiones.')
    }); 
  }
  
  resolverPeticion(id: number) { 
    let respuesta = prompt('Mensaje de resolución (Respuesta al empleado):');
    if(!respuesta) return;
    
    this.api.resolverPeticion(id, { respuesta: respuesta }).subscribe({ 
      next: (res: any) => { 
        alert(res.mensaje); 
        this.cargarPeticionesAdmin(); 
      }, 
      error: () => alert('Error al resolver la petición.') 
    }); 
  }

  regresarADashboard() { 
    this.router.navigate(['/admin/dashboard']); 
  }
}