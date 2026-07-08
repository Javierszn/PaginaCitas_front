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
  esOtrosEstados: boolean = false;
  
  mesActual: Date = new Date();
  diasMes: any[] = [];
  diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  
  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  horariosDisponibles: string[] = [];
  cargandoHorarios: boolean = false; 
  folioExito: string = '';

  municipiosRegistro: string[] = [];
  estadosRepublica: string[] = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 
    'Ciudad de México (CDMX)', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 
    'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 
    'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  todosLosMunicipiosSLP: string[] = [
    'Ahualulco', 'Alaquines', 'Aquismón', 'Armadillo de los Infante', 'Axtla de Terrazas', 'Cárdenas', 'Catorce', 'Cedral', 'Cerritos', 'Cerro de San Pedro', 'Charcas', 'Ciudad del Maíz', 'Ciudad Fernández', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Guadalcázar', 'Huehuetlán', 'Lagunillas', 'Matehuala', 'Matlapa', 'Mexquitic de Carmona', 'Moctezuma', 'Rayón', 'Rioverde', 'Salinas', 'San Antonio', 'San Ciro de Acosta', 'San Luis Potosí', 'San Martín Chalchicuautla', 'San Nicolás Tolentino', 'San Vicente Tancuayalab', 'Santa Catarina', 'Santa María del Río', 'Santo Domingo', 'Soledad de Graciano Sánchez', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Tierra Nueva', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Arriaga', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa de Reyes', 'Villa Hidalgo', 'Villa Juárez', 'Xilitla', 'Zaragoza', 'Villa de Pozos (Municipio 59)'
  ].sort();

  ciudadano = {
    nombre: '',
    curp: '',
    correo: '',
    telefono: '',
    municipioRegistro: '',
    estadoRegistro: '' 
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
    
    if (this.pasoActual === 2 && this.tramites.length === 0) this.cargarTramites();
    if (this.pasoActual === 4) this.generarCalendario();
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
    const nombreSede = sede.nombre.toLowerCase();
    this.esOtrosEstados = nombreSede.includes('otros');
    this.ciudadano.estadoRegistro = '';
    this.ciudadano.municipioRegistro = '';
    
    // Lógica estricta de municipios
    if (nombreSede.includes('centro') || nombreSede.includes('potos')) {
      this.municipiosRegistro = ['Ahualulco', 'Armadillo de los Infante', 'Cerro de San Pedro', 'Mexquitic de Carmona', 'San Luis Potosí', 'Santa María del Río', 'Soledad de Graciano Sánchez', 'Tierra Nueva', 'Villa de Arriaga', 'Villa de Reyes', 'Villa de Zaragoza', 'Villa de Pozos (Municipio 59)'].sort();
    } else if (nombreSede.includes('altiplano') || nombreSede.includes('matehuala')) {
      this.municipiosRegistro = ['Catorce', 'Cedral', 'Charcas', 'Guadalcázar', 'Matehuala', 'Moctezuma', 'Salinas', 'Santo Domingo', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa Hidalgo'].sort();
    } else if (nombreSede.includes('huasteca') || nombreSede.includes('valles')) {
      this.municipiosRegistro = ['Aquismón', 'Axtla de Terrazas', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Huehuetlán', 'Matlapa', 'San Antonio', 'San Martín Chalchicuautla', 'San Vicente Tancuayalab', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Xilitla'].sort();
    } else if (nombreSede.includes('media') || nombreSede.includes('rioverde')) {
      this.municipiosRegistro = ['Alaquines', 'Cárdenas', 'Cerritos', 'Ciudad del Maíz', 'Ciudad Fernández', 'Lagunillas', 'Rayón', 'Rioverde', 'San Ciro de Acosta', 'San Nicolás Tolentino', 'Santa Catarina', 'Villa Juárez'].sort();
    } else if (this.esOtrosEstados) {
      this.municipiosRegistro = [...this.todosLosMunicipiosSLP]; // Despliega los 59 completos
    } else {
      this.municipiosRegistro = [];
    }

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
    this.generarCalendario();
    history.pushState({ paso: 4 }, '', '');
    this.cdr.detectChanges();
  }

  cambiarMes(delta: number) {
    this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1);
    this.generarCalendario();
  }

  generarCalendario() {
    const year = this.mesActual.getFullYear();
    const month = this.mesActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);

    this.diasMes = [];
    
    for (let i = 0; i < primerDia.getDay(); i++) {
      this.diasMes.push({ vacio: true });
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fecha = new Date(year, month, i);
      const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;
      const yaPaso = fecha < hoy;
      
      let seleccionado = false;
      if (this.fechaSeleccionada) {
        const fs = new Date(this.fechaSeleccionada + 'T00:00:00');
        if (fs.getTime() === fecha.getTime()) seleccionado = true;
      }

      this.diasMes.push({
        vacio: false,
        fecha: fecha,
        dia: i,
        activo: !esFinde && !yaPaso,
        seleccionado: seleccionado
      });
    }
  }

  seleccionarFecha(dia: any) {
    if (!dia.activo || dia.vacio) return;
    
    this.diasMes.forEach(d => d.seleccionado = false);
    dia.seleccionado = true;

    const yyyy = dia.fecha.getFullYear();
    const mm = String(dia.fecha.getMonth() + 1).padStart(2, '0');
    const dd = String(dia.fecha.getDate()).padStart(2, '0');
    
    this.fechaSeleccionada = `${yyyy}-${mm}-${dd}`;
    this.horaSeleccionada = ''; 
    this.horariosDisponibles = [];
    this.buscarHorariosBackend();
  }

  buscarHorariosBackend() {
    this.cargandoHorarios = true; 
    this.http.get<string[]>(`http://localhost:5076/api/Citas/Horarios?idSede=${this.sedeSeleccionada.idSede}&fecha=${this.fechaSeleccionada}`)
      .subscribe({
        next: (horas) => { 
          this.horariosDisponibles = horas; 
          this.cargandoHorarios = false; 
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.cargandoHorarios = false;
          this.cdr.detectChanges();
        }
      });
  }

  confirmarCita() {
    const solicitud = {
      curp: this.ciudadano.curp,
      nombre: this.ciudadano.nombre,
      correo: this.ciudadano.correo,
      telefono: this.ciudadano.telefono,
      municipioRegistro: this.ciudadano.municipioRegistro,
      estadoRegistro: this.ciudadano.estadoRegistro,
      idTramite: this.tramiteSeleccionado.idTramite,
      idSede: this.sedeSeleccionada.idSede,
      fechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`
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

  regresarPaso1() { this.pasoActual = 1; this.sedeSeleccionada = null; this.tramites = []; history.pushState({ paso: 1 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso2() { this.pasoActual = 2; this.tramiteSeleccionado = null; history.pushState({ paso: 2 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso3() { this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
}