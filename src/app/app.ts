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
  categorias: any[] = [];
  categoriaExpandida: number | null = null;
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
  folioBusqueda: string = '';
  citaConsultada: any = null;
  cargandoConsulta: boolean = false;

  mostrarAlerta: boolean = false;
  alertaTitulo: string = '';
  alertaMensaje: string = '';
  alertaIcono: string = 'info'; 
  alertaTipo: 'alerta' | 'confirmacion' = 'alerta';
  accionConfirmacion: () => void = () => {};

  avisoGlobal: any = null;
  mostrarAvisoGlobal: boolean = false;

  // --- VARIABLES PARA EL LOGIN, DASHBOARD Y BITÁCORA ---
  credenciales = { username: '', password: '' };
  cargandoLogin: boolean = false;
  usuarioSesion: any = null;
  citasDia: any[] = [];
  fechaDashboard: string = new Date().toISOString().split('T')[0];
  textoBusquedaDashboard: string = '';
  
  bitacoraLogs: any[] = [];
  cargandoBitacora: boolean = false;
  fechaBitacora: string = ''; // Lo dejamos vacío para que por defecto traiga todo el historial
  textoBusquedaBitacora: string = '';

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

  ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };

  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarSedes();
    
    // RECUPERACIÓN DE SESIÓN
    const sessionUser = sessionStorage.getItem('usuarioRC');
    const sessionPaso = sessionStorage.getItem('pasoRC');
    
    if (sessionUser && sessionPaso) {
      this.usuarioSesion = JSON.parse(sessionUser);
      this.pasoActual = parseInt(sessionPaso, 10);
      if (this.pasoActual === 9) this.cargarCitasDashboard();
      if (this.pasoActual === 10) this.cargarBitacora();
    } else {
      history.replaceState({ paso: 1 }, '', '');
      this.cargarAvisoGlobal(); // Si no hay sesión de admin, mostramos el aviso
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (event.state && event.state.paso) {
      this.pasoActual = event.state.paso;
      if (this.pasoActual === 9 || this.pasoActual === 10) {
        sessionStorage.setItem('pasoRC', this.pasoActual.toString());
      }
    } else {
      this.pasoActual = 1;
    }
    if (this.pasoActual === 2 && this.categorias.length === 0) this.cargarTramites();
    if (this.pasoActual === 4) this.generarCalendario();
    this.cdr.detectChanges();
  }

  cargarAvisoGlobal() {
    // PROTECCIÓN: Si es un empleado, no mostramos el aviso global
    if (this.usuarioSesion) return;

    this.http.get('http://localhost:5076/api/Avisos/Activo').subscribe({
      next: (res: any) => {
        if (res && res.titulo) {
          this.avisoGlobal = res;
          this.mostrarAvisoGlobal = true;
          this.cdr.detectChanges();
        }
      },
      error: () => console.log('No hay avisos activos.')
    });
  }

  cerrarAvisoGlobal() {
    this.mostrarAvisoGlobal = false;
    this.cdr.detectChanges();
  }

  obtenerIconoCategoria(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('acta')) return 'fa-file-signature';
    if (n.includes('curp')) return 'fa-id-card';
    if (n.includes('anotaciones')) return 'fa-pen-clip';
    if (n.includes('constancia')) return 'fa-file-circle-check';
    if (n.includes('enmienda')) return 'fa-file-pen';
    return 'fa-file-lines'; 
  }

  abrirAlerta(titulo: string, mensaje: string, icono: string = 'info') {
    this.alertaTitulo = titulo;
    this.alertaMensaje = mensaje;
    this.alertaIcono = icono;
    this.alertaTipo = 'alerta';
    this.mostrarAlerta = true;
    this.cdr.detectChanges();
  }

  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void) {
    this.alertaTitulo = titulo;
    this.alertaMensaje = mensaje;
    this.alertaIcono = 'warning';
    this.alertaTipo = 'confirmacion';
    this.accionConfirmacion = accion;
    this.mostrarAlerta = true;
    this.cdr.detectChanges();
  }

  cerrarAlerta() { this.mostrarAlerta = false; }
  ejecutarConfirmacion() { this.mostrarAlerta = false; this.accionConfirmacion(); }

  limpiarFormulario() {
    this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };
    this.fechaSeleccionada = '';
    this.horaSeleccionada = '';
    this.horariosDisponibles = [];
    this.diasMes.forEach(d => d.seleccionado = false);
    this.folioBusqueda = '';
    this.categoriaExpandida = null;
  }

  cargarSedes() {
    this.http.get('http://localhost:5076/api/Sedes').subscribe({
      next: (datos: any) => { this.sedes = datos; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  cargarTramites() {
    this.http.get('http://localhost:5076/api/Tramites').subscribe({
      next: (datos: any) => { this.categorias = datos; this.cdr.detectChanges(); },
      error: (err) => console.error(err)
    });
  }

  toggleCategoria(idCategoria: number) {
    this.categoriaExpandida = (this.categoriaExpandida === idCategoria) ? null : idCategoria;
    this.cdr.detectChanges();
  }

  seleccionarSede(sede: any) {
    this.sedeSeleccionada = sede;
    const nombreSede = sede.nombre.toLowerCase();
    this.esOtrosEstados = nombreSede.includes('otros');
    this.ciudadano.estadoRegistro = '';
    this.ciudadano.municipioRegistro = '';
    
    if (nombreSede.includes('centro') || nombreSede.includes('potos')) {
      this.municipiosRegistro = ['Ahualulco', 'Armadillo de los Infante', 'Cerro de San Pedro', 'Mexquitic de Carmona', 'San Luis Potosí', 'Santa María del Río', 'Soledad de Graciano Sánchez', 'Tierra Nueva', 'Villa de Arriaga', 'Villa de Reyes', 'Villa de Zaragoza', 'Villa de Pozos (Municipio 59)'].sort();
    } else if (nombreSede.includes('altiplano') || nombreSede.includes('matehuala')) {
      this.municipiosRegistro = ['Catorce', 'Cedral', 'Charcas', 'Guadalcázar', 'Matehuala', 'Moctezuma', 'Salinas', 'Santo Domingo', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa Hidalgo'].sort();
    } else if (nombreSede.includes('huasteca') || nombreSede.includes('valles')) {
      this.municipiosRegistro = ['Aquismón', 'Axtla de Terrazas', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Huehuetlán', 'Matlapa', 'San Antonio', 'San Martín Chalchicuautla', 'San Vicente Tancuayalab', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Xilitla'].sort();
    } else if (nombreSede.includes('media') || nombreSede.includes('rioverde')) {
      this.municipiosRegistro = ['Alaquines', 'Cárdenas', 'Cerritos', 'Ciudad del Maíz', 'Ciudad Fernández', 'Lagunillas', 'Rayón', 'Rioverde', 'San Ciro de Acosta', 'San Nicolás Tolentino', 'Santa Catarina', 'Villa Juárez'].sort();
    } else if (this.esOtrosEstados) {
      this.municipiosRegistro = [...this.todosLosMunicipiosSLP]; 
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
    for (let i = 0; i < primerDia.getDay(); i++) { this.diasMes.push({ vacio: true }); }

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

      this.diasMes.push({ vacio: false, fecha: fecha, dia: i, activo: !esFinde && !yaPaso, seleccionado: seleccionado });
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
          this.abrirAlerta('Error', 'No se pudieron cargar los horarios.', 'error');
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
        this.limpiarFormulario();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.abrirAlerta('Alerta', err.error.mensaje || "Error al registrar la cita", 'warning');
      }
    });
  }

  irABuscarCita() {
    this.pasoActual = 6;
    this.limpiarFormulario();
    this.citaConsultada = null;
    history.pushState({ paso: 6 }, '', '');
    this.cdr.detectChanges();
  }

  buscarCitaPorFolio() {
    if (!this.folioBusqueda || this.folioBusqueda.length < 8) return;
    this.cargandoConsulta = true;
    
    this.http.get(`http://localhost:5076/api/Citas/${this.folioBusqueda.toUpperCase()}`).subscribe({
      next: (res: any) => {
        this.citaConsultada = res;
        this.pasoActual = 7;
        this.cargandoConsulta = false;
        history.pushState({ paso: 7 }, '', '');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.abrirAlerta('Folio no encontrado', err.error.mensaje || "Verifique el folio e intente de nuevo.", 'warning');
        this.cargandoConsulta = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelarCita() {
    this.abrirConfirmacion(
      '¿Cancelar Cita?',
      'Si cancela, perderá este horario, liberará el espacio y tendrá que generar un folio nuevo.',
      () => {
        this.http.put(`http://localhost:5076/api/Citas/${this.citaConsultada.folio}/cancelar`, {}).subscribe({
          next: (res: any) => {
            this.abrirAlerta('Cita Cancelada', res.mensaje, 'success');
            this.citaConsultada.estatus = 'CANCELADA';
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.abrirAlerta('Error', err.error.mensaje || "Error al cancelar la cita", 'error');
          }
        });
      }
    );
  }

  // --- MÉTODOS DEL EMPLEADO / ADMIN ---
  irALogin() {
    this.pasoActual = 8;
    this.credenciales = { username: '', password: '' };
    history.pushState({ paso: 8 }, '', '');
    this.cdr.detectChanges();
  }

  iniciarSesion() {
    if (!this.credenciales.username || !this.credenciales.password) {
      this.abrirAlerta('Atención', 'Por favor, ingrese su usuario y contraseña.', 'warning');
      return;
    }
    
    this.cargandoLogin = true;
    this.http.post('http://localhost:5076/api/Auth/login', this.credenciales).subscribe({
      next: (res: any) => {
        this.cargandoLogin = false;
        this.usuarioSesion = res;
        sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion));
        sessionStorage.setItem('pasoRC', '9');

        this.pasoActual = 9; 
        this.cargarCitasDashboard(); 
        history.pushState({ paso: 9 }, '', '');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cargandoLogin = false;
        this.abrirAlerta('Acceso Denegado', err.error.mensaje || 'Usuario o contraseña incorrectos.', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  cerrarSesion() {
    this.usuarioSesion = null;
    sessionStorage.removeItem('usuarioRC');
    sessionStorage.removeItem('pasoRC');
    this.regresarPaso1();
  }

  cargarCitasDashboard() {
    let url = `http://localhost:5076/api/Citas/PorSede/${this.usuarioSesion.idSede}`;
    
    if (this.textoBusquedaDashboard && this.textoBusquedaDashboard.trim().length > 0) {
      url += `?busqueda=${encodeURIComponent(this.textoBusquedaDashboard)}`;
    } else {
      url += `?fecha=${this.fechaDashboard}`;
    }

    this.http.get(url).subscribe({
      next: (res: any) => { 
        this.citasDia = res; 
        this.cdr.detectChanges(); 
      },
      error: () => this.abrirAlerta('Error', 'No se pudieron cargar las citas.', 'error')
    });
  }

  limpiarBusqueda() {
    this.textoBusquedaDashboard = '';
    this.cargarCitasDashboard();
  }

  actualizarEstatusCita(folio: string, nuevoEstatus: string) {
    this.http.put(`http://localhost:5076/api/Citas/${folio}/actualizarEstatus`, {
        nuevoEstatus: nuevoEstatus,
        idUsuarioInterno: this.usuarioSesion.idUsuario
    }).subscribe({
        next: (res: any) => {
            this.abrirAlerta('Éxito', res.mensaje, 'success');
            this.cargarCitasDashboard(); 
        },
        error: (err) => this.abrirAlerta('Error', 'No se pudo actualizar la cita.', 'error')
    });
  }

  // --- MÉTODOS EXCLUSIVOS DE AUDITORÍA (ADMIN) ---
  irABitacora() {
    this.pasoActual = 10;
    sessionStorage.setItem('pasoRC', '10');
    this.cargarBitacora();
    history.pushState({ paso: 10 }, '', '');
    this.cdr.detectChanges();
  }

  regresarADashboard() {
    this.pasoActual = 9;
    sessionStorage.setItem('pasoRC', '9');
    history.pushState({ paso: 9 }, '', '');
    this.cargarCitasDashboard();
    this.cdr.detectChanges();
  }

  cargarBitacora() {
    this.cargandoBitacora = true;
    let url = 'http://localhost:5076/api/Bitacora';
    
    const params = [];
    if (this.textoBusquedaBitacora && this.textoBusquedaBitacora.trim().length > 0) {
      params.push(`busqueda=${encodeURIComponent(this.textoBusquedaBitacora)}`);
    } else if (this.fechaBitacora) {
      params.push(`fecha=${this.fechaBitacora}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    this.http.get(url).subscribe({
      next: (res: any) => {
        this.bitacoraLogs = res;
        this.cargandoBitacora = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.abrirAlerta('Error', 'No se pudo cargar la bitácora.', 'error');
        this.cargandoBitacora = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarBusquedaBitacora() {
    this.textoBusquedaBitacora = '';
    this.cargarBitacora();
  }

  deshacerAccion(idBitacora: number) {
    this.abrirConfirmacion(
      '¿Deshacer este movimiento?', 
      '¿Está completamente seguro de revertir este cambio a su estado anterior?', 
      () => {
        this.http.post(`http://localhost:5076/api/Bitacora/Deshacer/${idBitacora}`, this.usuarioSesion.idUsuario).subscribe({
          next: (res: any) => {
            this.abrirAlerta('Restaurado', res.mensaje, 'success');
            this.cargarBitacora(); 
          },
          error: (err) => {
            this.abrirAlerta('Error', err.error.mensaje || 'No se pudo deshacer la acción.', 'error');
          }
        });
      }
    );
  }

  regresarPaso1() { 
    this.pasoActual = 1; 
    this.sedeSeleccionada = null; 
    this.categorias = []; 
    this.limpiarFormulario();
    sessionStorage.removeItem('pasoRC'); // Limpiamos rastro
    history.pushState({ paso: 1 }, '', ''); 
    
    // Si nos regresamos al inicio y el aviso sigue prendido en el servidor, lo traemos de nuevo
    this.cargarAvisoGlobal();
    
    this.cdr.detectChanges(); 
  }
  regresarPaso2() { this.pasoActual = 2; this.tramiteSeleccionado = null; history.pushState({ paso: 2 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso3() { this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
}