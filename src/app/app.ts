import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // <--- AQUÍ ESTÁ EL RESCATISTA
import { Router, RouterModule } from '@angular/router';
import { AlertService } from './alert.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule], // <--- Y AQUÍ LO DECLARAMOS
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
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