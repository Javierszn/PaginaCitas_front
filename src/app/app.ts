import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  pasoActual: number = 1;
  sedes: any[] = [];
  tramites: any[] = [];
  
  sedeSeleccionada: any = null;
  tramiteSeleccionado: any = null;
  
  // Variables para paso 4 y 5
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  horariosDisponibles: string[] = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
  folioExito: string = '';

  ciudadano = {
    nombre: '',
    curp: '',
    correo: '',
    telefono: ''
  };

  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarSedes();
    history.replaceState({ paso: 1 }, '', '');
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (event.state && event.state.paso) {
      this.pasoActual = event.state.paso;
    } else {
      this.pasoActual = 1;
    }
    
    // Recargar datos si regresamos a pasos donde se perdieron
    if (this.pasoActual === 2 && this.tramites.length === 0) this.cargarTramites();
    this.cdr.detectChanges();
  }

  cargarSedes() {
    this.http.get('http://localhost:5076/api/Sedes').subscribe({
      next: (datos: any) => { this.sedes = datos; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  cargarTramites() {
    this.http.get('http://localhost:5076/api/Tramites').subscribe({
      next: (datos: any) => { this.tramites = datos; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  seleccionarSede(sede: any) {
    this.sedeSeleccionada = sede;
    this.pasoActual = 2;
    this.cargarTramites();
    history.pushState({ paso: 2 }, '', '');
  }

  seleccionarTramite(tramite: any) {
    this.tramiteSeleccionado = tramite;
    this.pasoActual = 3;
    history.pushState({ paso: 3 }, '', '');
    this.cdr.detectChanges();
  }

  irAPaso4() {
    this.pasoActual = 4;
    history.pushState({ paso: 4 }, '', '');
    this.cdr.detectChanges();
  }

  confirmarCita() {
    // Combinar fecha y hora para el formato DateTime de C#
    const fechaCompleta = `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`;
    
    const solicitud = {
      curp: this.ciudadano.curp,
      idTramite: this.tramiteSeleccionado.idTramite,
      idSede: this.sedeSeleccionada.idSede,
      fechaHora: fechaCompleta
    };

    this.http.post('http://localhost:5076/api/Citas', solicitud).subscribe({
      next: (res: any) => {
        this.folioExito = res.folio;
        this.pasoActual = 5;
        history.pushState({ paso: 5 }, '', '');
        this.cdr.detectChanges();
      },
      error: (err) => {
        alert(err.error.mensaje || "Error al registrar la cita");
      }
    });
  }

  regresarPaso1() {
    this.pasoActual = 1;
    this.sedeSeleccionada = null;
    this.tramites = [];
    history.pushState({ paso: 1 }, '', '');
    this.cdr.detectChanges();
  }

  regresarPaso2() {
    this.pasoActual = 2;
    this.tramiteSeleccionado = null;
    history.pushState({ paso: 2 }, '', '');
    this.cdr.detectChanges();
  }

  regresarPaso3() {
    this.pasoActual = 3;
    history.pushState({ paso: 3 }, '', '');
    this.cdr.detectChanges();
  }
}