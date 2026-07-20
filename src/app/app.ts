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

  // --- VARIABLES REAGENDAR CITA ---
  modoReagendar: boolean = false;
  folioReagendar: string = '';

  mostrarAlerta: boolean = false;
  alertaTitulo: string = '';
  alertaMensaje: string = '';
  alertaIcono: string = 'info'; 
  alertaTipo: 'alerta' | 'confirmacion' | 'input' = 'alerta';
  accionConfirmacion: () => void = () => {};
  inputTemporal: string = '';

  avisoGlobal: any = null;
  mostrarAvisoGlobal: boolean = false;

  credenciales = { username: '', password: '' };
  cargandoLogin: boolean = false;
  usuarioSesion: any = null;
  citasDia: any[] = [];
  fechaDashboard: string = new Date().toISOString().split('T')[0];
  textoBusquedaDashboard: string = '';
  
  mostrarForzarPassword: boolean = false;
  nuevaPassword = '';
  confirmarPassword = '';

  bitacoraLogs: any[] = [];
  cargandoBitacora: boolean = false;
  fechaBitacora: string = ''; 
  textoBusquedaBitacora: string = '';

  // --- VARIABLES SUPER ADMIN ---
  usuariosSistema: any[] = [];
  categoriasAdmin: any[] = []; 
  nuevoUsuario = { username: '', password: '', nombreCompleto: '', idRol: 2 };
  
  // -- VARIABLES DE ACCESOS --
  registroAccesos: any[] = [];
  fechaAccesos: string = '';
  textoBusquedaAccesos: string = '';
  cargandoAccesos: boolean = false;
  // Variables nuevas para paginación
  paginaActualAccesos: number = 1;
  totalPaginasAccesos: number = 1;
  arregloPaginas: number[] = [];

  // --- VARIABLES SISTEMA DE PETICIONES (TICKETS Y NOTIFICACIONES) ---
  mostrarModalPeticion: boolean = false;
  mostrarBandeja: boolean = false; 
  peticionDesdeLogin: boolean = false;
  peticionesSistema: any[] = [];
  misPeticiones: any[] = [];
  notificacionesNuevas: number = 0;
  usuariosSoporte: any[] = []; 
  nuevaPeticion = { username: '', tipo: 'RECUPERAR CONTRASEÑA', descripcion: '' };

  municipiosRegistro: string[] = [];
  estadosRepublica: string[] = [ 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México (CDMX)', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas' ];
  todosLosMunicipiosSLP: string[] = [ 'Ahualulco', 'Alaquines', 'Aquismón', 'Armadillo de los Infante', 'Axtla de Terrazas', 'Cárdenas', 'Catorce', 'Cedral', 'Cerritos', 'Cerro de San Pedro', 'Charcas', 'Ciudad del Maíz', 'Ciudad Fernández', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Guadalcázar', 'Huehuetlán', 'Lagunillas', 'Matehuala', 'Matlapa', 'Mexquitic de Carmona', 'Moctezuma', 'Rayón', 'Rioverde', 'Salinas', 'San Antonio', 'San Ciro de Acosta', 'San Luis Potosí', 'San Martín Chalchicuautla', 'San Nicolás Tolentino', 'San Vicente Tancuayalab', 'Santa Catarina', 'Santa María del Río', 'Santo Domingo', 'Soledad de Graciano Sánchez', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Tierra Nueva', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Arriaga', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa de Reyes', 'Villa Hidalgo', 'Villa Juárez', 'Xilitla', 'Zaragoza', 'Villa de Pozos (Municipio 59)' ].sort();

  ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };

  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarSedes();
    this.cargarUsuariosSoporte();

    const sessionUser = sessionStorage.getItem('usuarioRC');
    const sessionPaso = sessionStorage.getItem('pasoRC');
    if (sessionUser && sessionPaso) {
      this.usuarioSesion = JSON.parse(sessionUser);
      this.pasoActual = parseInt(sessionPaso, 10);
      if (this.pasoActual === 9) { 
        this.cargarCitasDashboard(); 
        if (this.usuarioSesion?.rol === 'Super Administrador') this.cargarPeticionesAdmin();
        else this.cargarMisPeticiones(); 
      }
      if (this.pasoActual === 10) this.cargarBitacora();
      if (this.pasoActual === 11) { this.cargarUsuariosAdmin(); this.cargarTramitesAdmin(); this.cargarAccesosAdmin(); }
      if (this.pasoActual === 12) this.cargarPeticionesAdmin();
    } else {
      history.replaceState({ paso: 1 }, '', '');
      this.cargarAvisoGlobal();
    }
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (event.state && event.state.paso) {
      this.pasoActual = event.state.paso;
      if ([9, 10, 11, 12].includes(this.pasoActual)) {
        sessionStorage.setItem('pasoRC', this.pasoActual.toString());
      }
    } else { this.pasoActual = 1; }
    if (this.pasoActual === 2 && this.categorias.length === 0) this.cargarTramites();
    if (this.pasoActual === 4) this.generarCalendario();
    this.cdr.detectChanges();
  }

  cargarAvisoGlobal() {
    if (this.usuarioSesion) return;
    this.http.get('http://localhost:5076/api/Avisos/Activo').subscribe({
      next: (res: any) => { if (res && res.titulo) { this.avisoGlobal = res; this.mostrarAvisoGlobal = true; this.cdr.detectChanges(); } }
    });
  }

  cerrarAvisoGlobal() { this.mostrarAvisoGlobal = false; this.cdr.detectChanges(); }

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
    this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = icono;
    this.alertaTipo = 'alerta'; this.mostrarAlerta = true; this.cdr.detectChanges();
  }

  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void) {
    this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = 'warning';
    this.alertaTipo = 'confirmacion'; this.accionConfirmacion = accion;
    this.mostrarAlerta = true; this.cdr.detectChanges();
  }

  abrirInput(titulo: string, mensaje: string, accion: () => void) {
    this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = 'info';
    this.alertaTipo = 'input'; this.inputTemporal = ''; this.accionConfirmacion = accion;
    this.mostrarAlerta = true; this.cdr.detectChanges();
  }

  cerrarAlerta() { this.mostrarAlerta = false; }
  ejecutarConfirmacion() { this.mostrarAlerta = false; this.accionConfirmacion(); }

  limpiarFormulario() {
    this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };
    this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = [];
    this.diasMes.forEach(d => d.seleccionado = false); this.folioBusqueda = ''; this.categoriaExpandida = null;
    this.modoReagendar = false; this.folioReagendar = '';
  }

  cargarSedes() { this.http.get('http://localhost:5076/api/Sedes').subscribe({ next: (datos: any) => { this.sedes = datos; this.cdr.detectChanges(); } }); }
  cargarTramites() { this.http.get('http://localhost:5076/api/Tramites').subscribe({ next: (datos: any) => { this.categorias = datos; this.cdr.detectChanges(); } }); }

  toggleCategoria(idCategoria: number) { this.categoriaExpandida = (this.categoriaExpandida === idCategoria) ? null : idCategoria; this.cdr.detectChanges(); }

  seleccionarSede(sede: any) {
    this.sedeSeleccionada = sede; const nombreSede = sede.nombre.toLowerCase();
    this.esOtrosEstados = nombreSede.includes('otros');
    this.ciudadano.estadoRegistro = ''; this.ciudadano.municipioRegistro = '';
    
    if (nombreSede.includes('centro') || nombreSede.includes('potos')) { this.municipiosRegistro = ['Ahualulco', 'Armadillo de los Infante', 'Cerro de San Pedro', 'Mexquitic de Carmona', 'San Luis Potosí', 'Santa María del Río', 'Soledad de Graciano Sánchez', 'Tierra Nueva', 'Villa de Arriaga', 'Villa de Reyes', 'Villa de Zaragoza', 'Villa de Pozos (Municipio 59)'].sort(); } 
    else if (nombreSede.includes('altiplano') || nombreSede.includes('matehuala')) { this.municipiosRegistro = ['Catorce', 'Cedral', 'Charcas', 'Guadalcázar', 'Matehuala', 'Moctezuma', 'Salinas', 'Santo Domingo', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa Hidalgo'].sort(); } 
    else if (nombreSede.includes('huasteca') || nombreSede.includes('valles')) { this.municipiosRegistro = ['Aquismón', 'Axtla de Terrazas', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Huehuetlán', 'Matlapa', 'San Antonio', 'San Martín Chalchicuautla', 'San Vicente Tancuayalab', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Xilitla'].sort(); } 
    else if (nombreSede.includes('media') || nombreSede.includes('rioverde')) { this.municipiosRegistro = ['Alaquines', 'Cárdenas', 'Cerritos', 'Ciudad del Maíz', 'Ciudad Fernández', 'Lagunillas', 'Rayón', 'Rioverde', 'San Ciro de Acosta', 'San Nicolás Tolentino', 'Santa Catarina', 'Villa Juárez'].sort(); } 
    else if (this.esOtrosEstados) { this.municipiosRegistro = [...this.todosLosMunicipiosSLP]; } else { this.municipiosRegistro = []; }

    this.pasoActual = 2; this.cargarTramites(); history.pushState({ paso: 2 }, '', '');
  }

  seleccionarTramite(tramite: any) { this.tramiteSeleccionado = tramite; this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
  irAPaso4() { this.pasoActual = 4; this.generarCalendario(); history.pushState({ paso: 4 }, '', ''); this.cdr.detectChanges(); }
  cambiarMes(delta: number) { this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1); this.generarCalendario(); }

  generarCalendario() {
    const year = this.mesActual.getFullYear(); const month = this.mesActual.getMonth();
    const primerDia = new Date(year, month, 1); const ultimoDia = new Date(year, month + 1, 0);
    this.diasMes = []; for (let i = 0; i < primerDia.getDay(); i++) { this.diasMes.push({ vacio: true }); }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fecha = new Date(year, month, i); const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6; const yaPaso = fecha < hoy;
      let seleccionado = false;
      if (this.fechaSeleccionada) { const fs = new Date(this.fechaSeleccionada + 'T00:00:00'); if (fs.getTime() === fecha.getTime()) seleccionado = true; }
      this.diasMes.push({ vacio: false, fecha: fecha, dia: i, activo: !esFinde && !yaPaso, seleccionado: seleccionado });
    }
  }

  seleccionarFecha(dia: any) {
    if (!dia.activo || dia.vacio) return;
    this.diasMes.forEach(d => d.seleccionado = false); dia.seleccionado = true;
    const yyyy = dia.fecha.getFullYear(); const mm = String(dia.fecha.getMonth() + 1).padStart(2, '0'); const dd = String(dia.fecha.getDate()).padStart(2, '0');
    this.fechaSeleccionada = `${yyyy}-${mm}-${dd}`; this.horaSeleccionada = ''; this.horariosDisponibles = [];
    this.buscarHorariosBackend();
  }

  buscarHorariosBackend() {
    this.cargandoHorarios = true; 
    this.http.get<string[]>(`http://localhost:5076/api/Citas/Horarios?idSede=${this.sedeSeleccionada.idSede}&idTramite=${this.tramiteSeleccionado.idTramite}&fecha=${this.fechaSeleccionada}`)
      .subscribe({
        next: (horas) => { this.horariosDisponibles = horas; this.cargandoHorarios = false; this.cdr.detectChanges(); },
        error: () => { this.abrirAlerta('Error', 'No se pudieron cargar los horarios.', 'error'); this.cargandoHorarios = false; this.cdr.detectChanges(); }
      });
  }

  getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = "Desconocido"; let os = "Desconocido";
    if(ua.includes("Firefox")) browser = "Firefox";
    else if(ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if(ua.includes("Trident") || ua.includes("MSIE")) browser = "Internet Explorer";
    else if(ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
    else if(ua.includes("Chrome")) browser = "Chrome";
    else if(ua.includes("Safari")) browser = "Safari";
    if(ua.includes("Win")) os = "Windows";
    else if(ua.includes("Mac")) os = "MacOS/iOS";
    else if(ua.includes("Linux")) os = "Linux";
    else if(ua.includes("Android")) os = "Android";
    return { browser, os };
  }

  confirmarCita() {
    // Si estamos Reagendando, llamamos a la ruta PUT nueva
    if (this.modoReagendar) {
      const payload = { nuevaFechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00` };
      this.http.put(`http://localhost:5076/api/Citas/${this.folioReagendar}/reagendar`, payload).subscribe({
          next: (res: any) => {
              this.folioExito = this.folioReagendar;
              this.modoReagendar = false;
              this.folioReagendar = '';
              this.pasoActual = 5;
              history.pushState({ paso: 5 }, '', '');
              this.limpiarFormulario();
              this.cdr.detectChanges();
          },
          error: (err) => this.abrirAlerta('Error', err.error.mensaje || 'No se pudo reagendar.', 'error')
      });
    } else {
      // Flujo normal de Agendar Cita Nueva
      const navInfo = this.getBrowserInfo();
      const solicitud = {
        curp: this.ciudadano.curp, nombre: this.ciudadano.nombre, correo: this.ciudadano.correo, telefono: this.ciudadano.telefono,
        municipioRegistro: this.ciudadano.municipioRegistro, estadoRegistro: this.ciudadano.estadoRegistro,
        idTramite: this.tramiteSeleccionado.idTramite, idSede: this.sedeSeleccionada.idSede, 
        fechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`,
        navegador: navInfo.browser, sistemaOperativo: navInfo.os
      };
      this.http.post('http://localhost:5076/api/Citas', solicitud).subscribe({
        next: (res: any) => { this.folioExito = res.folio; this.pasoActual = 5; history.pushState({ paso: 5 }, '', ''); this.limpiarFormulario(); this.cdr.detectChanges(); },
        error: (err) => { this.abrirAlerta('Alerta', err.error.mensaje || "Error al registrar la cita", 'warning'); }
      });
    }
  }

  irABuscarCita() { this.pasoActual = 6; this.limpiarFormulario(); this.citaConsultada = null; history.pushState({ paso: 6 }, '', ''); this.cdr.detectChanges(); }

  buscarCitaPorFolio() {
    if (!this.folioBusqueda || this.folioBusqueda.length < 8) return;
    this.cargandoConsulta = true;
    this.http.get(`http://localhost:5076/api/Citas/${this.folioBusqueda.toUpperCase()}`).subscribe({
      next: (res: any) => { this.citaConsultada = res; this.pasoActual = 7; this.cargandoConsulta = false; history.pushState({ paso: 7 }, '', ''); this.cdr.detectChanges(); },
      error: (err) => { this.abrirAlerta('Folio no encontrado', err.error.mensaje || "Verifique el folio e intente de nuevo.", 'warning'); this.cargandoConsulta = false; this.cdr.detectChanges(); }
    });
  }

  // --- LÓGICA DE REAGENDAR (Desde Paso 7 al Paso 4) ---
  prepararReagendar() {
    this.modoReagendar = true;
    this.folioReagendar = this.citaConsultada.folio;
    
    // Fingimos que seleccionaron sede y trámite para que funcione el Paso 4
    this.sedeSeleccionada = { idSede: this.citaConsultada.idSede, nombre: this.citaConsultada.sede };
    this.tramiteSeleccionado = { idTramite: this.citaConsultada.idTramite, nombreTramite: this.citaConsultada.tramite };
    
    this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = [];
    
    this.pasoActual = 4;
    this.generarCalendario();
    history.pushState({ paso: 4 }, '', '');
    this.cdr.detectChanges();
  }

  cancelarCita() {
    this.abrirConfirmacion('¿Cancelar Cita?', 'Si cancela perderá este horario, liberará el espacio y tendrá que generar un folio nuevo.', () => {
        this.http.put(`http://localhost:5076/api/Citas/${this.citaConsultada.folio}/cancelar`, {}).subscribe({
          next: (res: any) => { this.abrirAlerta('Cita Cancelada', res.mensaje, 'success'); this.citaConsultada.estatus = 'CANCELADA'; this.cdr.detectChanges(); },
          error: (err) => { this.abrirAlerta('Error', err.error.mensaje || "Error al cancelar la cita", 'error'); }
        });
    });
  }

  irALogin() { this.pasoActual = 8; this.credenciales = { username: '', password: '' }; history.pushState({ paso: 8 }, '', ''); this.cdr.detectChanges(); }

  iniciarSesion() {
    if (!this.credenciales.username || !this.credenciales.password) { this.abrirAlerta('Atención', 'Por favor, ingrese su usuario y contraseña.', 'warning'); return; }
    this.cargandoLogin = true;
    this.http.post('http://localhost:5076/api/Auth/login', this.credenciales).subscribe({
      next: (res: any) => {
        this.cargandoLogin = false; 
        this.usuarioSesion = res;
        
        if (this.usuarioSesion.requiereCambioPassword) {
            this.mostrarForzarPassword = true;
            this.cdr.detectChanges();
            return;
        }
        this.procesarAccesoCorrecto();
      },
      error: (err) => { this.cargandoLogin = false; this.abrirAlerta('Acceso Denegado', err.error.mensaje || 'Usuario o contraseña incorrectos.', 'error'); this.cdr.detectChanges(); }
    });
  }

  guardarNuevaPasswordForzada() {
    if (this.nuevaPassword.length < 5) { this.abrirAlerta('Atención', 'La contraseña debe tener al menos 5 caracteres.', 'warning'); return; }
    if (this.nuevaPassword !== this.confirmarPassword) { this.abrirAlerta('Atención', 'Las contraseñas no coinciden.', 'warning'); return; }

    this.http.put(`http://localhost:5076/api/Usuarios/${this.usuarioSesion.idUsuario}/password`, { password: this.nuevaPassword }).subscribe({
        next: (res: any) => {
            this.mostrarForzarPassword = false;
            this.abrirAlerta('Éxito', 'Su contraseña fue actualizada. Bienvenido al sistema.', 'success');
            this.usuarioSesion.requiereCambioPassword = false;
            this.procesarAccesoCorrecto();
        },
        error: () => this.abrirAlerta('Error', 'No se pudo actualizar la contraseña.', 'error')
    });
  }

  procesarAccesoCorrecto() {
    sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion));
    sessionStorage.setItem('pasoRC', '9');
    this.pasoActual = 9; 
    this.cargarCitasDashboard(); 
    
    if (this.usuarioSesion?.rol === 'Super Administrador') {
        this.cargarPeticionesAdmin();
    } else {
        this.cargarMisPeticiones();
    }
    
    history.pushState({ paso: 9 }, '', ''); 
    this.cdr.detectChanges();
  }

  cerrarSesion() { 
    if(this.usuarioSesion?.idAcceso) {
        this.http.post(`http://localhost:5076/api/Auth/logout/${this.usuarioSesion.idAcceso}`, {}).subscribe();
    }
    this.usuarioSesion = null; sessionStorage.removeItem('usuarioRC'); sessionStorage.removeItem('pasoRC'); this.regresarPaso1(); 
  }

  // --- DASHBOARD EMPLEADOS ---
  cargarCitasDashboard() {
    let url = `http://localhost:5076/api/Citas/PorSede/${this.usuarioSesion.idSede}`;
    if (this.textoBusquedaDashboard && this.textoBusquedaDashboard.trim().length > 0) { url += `?busqueda=${encodeURIComponent(this.textoBusquedaDashboard)}`; } else { url += `?fecha=${this.fechaDashboard}`; }
    this.http.get(url).subscribe({ next: (res: any) => { this.citasDia = res; this.cdr.detectChanges(); }, error: () => this.abrirAlerta('Error', 'No se pudieron cargar las citas.', 'error') });
  }

  limpiarBusqueda() { this.textoBusquedaDashboard = ''; this.cargarCitasDashboard(); }

  actualizarEstatusCita(folio: string, nuevoEstatus: string) {
    this.http.put(`http://localhost:5076/api/Citas/${folio}/actualizarEstatus`, { nuevoEstatus: nuevoEstatus, idUsuarioInterno: this.usuarioSesion.idUsuario }).subscribe({
        next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.cargarCitasDashboard(); },
        error: () => this.abrirAlerta('Error', 'No se pudo actualizar la cita.', 'error')
    });
  }

  // --- BITÁCORA (ADMIN / SUPER ADMIN) ---
  irABitacora() { this.pasoActual = 10; sessionStorage.setItem('pasoRC', '10'); this.cargarBitacora(); history.pushState({ paso: 10 }, '', ''); this.cdr.detectChanges(); }
  regresarADashboard() { 
      this.pasoActual = 9; 
      sessionStorage.setItem('pasoRC', '9'); 
      history.pushState({ paso: 9 }, '', ''); 
      this.cargarCitasDashboard(); 
      if (this.usuarioSesion?.rol === 'Super Administrador') this.cargarPeticionesAdmin();
      else this.cargarMisPeticiones();
      this.cdr.detectChanges(); 
  }

  cargarBitacora() {
    this.cargandoBitacora = true; let url = 'http://localhost:5076/api/Bitacora'; const params = [];
    if (this.textoBusquedaBitacora && this.textoBusquedaBitacora.trim().length > 0) { params.push(`busqueda=${encodeURIComponent(this.textoBusquedaBitacora)}`); } else if (this.fechaBitacora) { params.push(`fecha=${this.fechaBitacora}`); }
    if (params.length > 0) { url += '?' + params.join('&'); }
    this.http.get(url).subscribe({
      next: (res: any) => { this.bitacoraLogs = res; this.cargandoBitacora = false; this.cdr.detectChanges(); },
      error: () => { this.abrirAlerta('Error', 'No se pudo cargar la bitácora.', 'error'); this.cargandoBitacora = false; this.cdr.detectChanges(); }
    });
  }
  limpiarBusquedaBitacora() { this.textoBusquedaBitacora = ''; this.cargarBitacora(); }

  deshacerAccion(idBitacora: number) {
    this.abrirConfirmacion('¿Deshacer este movimiento?', '¿Está completamente seguro de revertir este cambio a su estado anterior?', () => {
        this.http.post(`http://localhost:5076/api/Bitacora/Deshacer/${idBitacora}`, this.usuarioSesion.idUsuario).subscribe({
          next: (res: any) => { this.abrirAlerta('Restaurado', res.mensaje, 'success'); this.cargarBitacora(); },
          error: (err) => { this.abrirAlerta('Error', err.error.mensaje || 'No se pudo deshacer la acción.', 'error'); }
        });
    });
  }

  // --- MÉTODOS DE PETICIONES ---
  cargarUsuariosSoporte() {
    this.http.get('http://localhost:5076/api/Usuarios/Soporte').subscribe({
      next: (res: any) => { this.usuariosSoporte = res; this.cdr.detectChanges(); }
    });
  }

  cargarMisPeticiones() {
    if (!this.usuarioSesion) return;
    this.http.get('http://localhost:5076/api/Peticiones/MisPeticiones/' + this.usuarioSesion.username).subscribe({
      next: (res: any) => { 
          this.misPeticiones = res; 
          this.notificacionesNuevas = this.misPeticiones.filter((p: any) => p.estatus === 'RESUELTA' && p.leido === false).length;
          this.cdr.detectChanges(); 
      }
    });
  }

  abrirBandeja() {
    if (this.usuarioSesion?.rol === 'Super Administrador') {
        this.http.put('http://localhost:5076/api/Peticiones/MarcarLeidasAdmin', {}).subscribe();
        this.irACentroSoporte(); 
    } else {
        this.mostrarBandeja = true; 
        this.http.put(`http://localhost:5076/api/Peticiones/MarcarLeidasUsuario/${this.usuarioSesion.username}`, {}).subscribe();
        this.notificacionesNuevas = 0; 
        this.cdr.detectChanges();
    }
  }
  cerrarBandeja() { this.mostrarBandeja = false; this.cdr.detectChanges(); }

  abrirModalPeticion(desdeLogin: boolean = false) {
    this.peticionDesdeLogin = desdeLogin;
    this.nuevaPeticion = {
      username: desdeLogin ? '' : this.usuarioSesion?.username,
      tipo: desdeLogin ? 'RECUPERAR CONTRASEÑA' : 'SOPORTE TÉCNICO',
      descripcion: ''
    };
    this.mostrarModalPeticion = true;
    this.cdr.detectChanges();
  }
  cerrarModalPeticion() { this.mostrarModalPeticion = false; this.cdr.detectChanges(); }

  enviarPeticion() {
    if (!this.nuevaPeticion.username || !this.nuevaPeticion.descripcion) {
      this.abrirAlerta('Atención', 'Por favor, llene todos los campos requeridos.', 'warning'); return;
    }
    this.http.post('http://localhost:5076/api/Peticiones', this.nuevaPeticion).subscribe({
      next: (res: any) => {
        this.cerrarModalPeticion(); this.abrirAlerta('Solicitud Enviada', res.mensaje, 'success');
        if (this.usuarioSesion?.rol === 'Super Administrador') {
            this.cargarPeticionesAdmin();
        } else if (this.usuarioSesion) {
            this.cargarMisPeticiones();
        }
      },
      error: () => this.abrirAlerta('Error', 'No se pudo enviar la solicitud.', 'error')
    });
  }

  cargarPeticionesAdmin() {
    this.http.get('http://localhost:5076/api/Peticiones').subscribe({
      next: (res: any) => { 
          this.peticionesSistema = res; 
          this.notificacionesNuevas = this.peticionesSistema.filter((p: any) => p.estatus === 'PENDIENTE' && p.leido === false).length;
          this.cdr.detectChanges(); 
      }
    });
  }

  resolverPeticion(id: number) {
    this.abrirInput('Responder Ticket', 'Escriba un mensaje de resolución o soporte para el empleado:', () => {
      this.http.put(`http://localhost:5076/api/Peticiones/${id}/resolver`, { respuesta: this.inputTemporal }).subscribe({
        next: (res: any) => { this.abrirAlerta('Resuelto', res.mensaje, 'success'); this.cargarPeticionesAdmin(); },
        error: () => this.abrirAlerta('Error', 'No se pudo actualizar el ticket.', 'error')
      });
    });
  }

  // --- CONFIGURACIÓN DEL SISTEMA (SUPER ADMIN) ---
  irASuperAdmin() { 
    this.pasoActual = 11; sessionStorage.setItem('pasoRC', '11'); 
    this.cargarUsuariosAdmin(); this.cargarTramitesAdmin(); this.cargarAccesosAdmin();
    history.pushState({ paso: 11 }, '', ''); this.cdr.detectChanges(); 
  }

  irACentroSoporte() {
    this.pasoActual = 12; sessionStorage.setItem('pasoRC', '12'); 
    this.cargarPeticionesAdmin();
    history.pushState({ paso: 12 }, '', ''); this.cdr.detectChanges(); 
  }

  cargarUsuariosAdmin() {
    this.http.get('http://localhost:5076/api/Usuarios').subscribe({ next: (res: any) => { this.usuariosSistema = res; this.cdr.detectChanges(); } });
  }

  cargarAccesosAdmin(paginaSolicitada: number = 1) {
    this.cargandoAccesos = true;
    let url = `http://localhost:5076/api/Usuarios/Accesos?page=${paginaSolicitada}&pageSize=10`;
    
    if (this.textoBusquedaAccesos && this.textoBusquedaAccesos.trim().length > 0) {
      url += `&busqueda=${encodeURIComponent(this.textoBusquedaAccesos)}`;
    } else if (this.fechaAccesos) {
      url += `&fecha=${this.fechaAccesos}`;
    }
    
    this.http.get(url).subscribe({ 
      next: (res: any) => { 
          // Ahora recibimos un objeto paginado del backend
          this.registroAccesos = res.datos; 
          this.paginaActualAccesos = res.paginaActual;
          this.totalPaginasAccesos = res.totalPaginas;
          
          // Generamos un arreglo [1, 2, 3...] para pintar los botones en HTML
          this.arregloPaginas = Array.from({ length: this.totalPaginasAccesos }, (_, i) => i + 1);
          
          this.cargandoAccesos = false;
          this.cdr.detectChanges(); 
      },
      error: () => {
          this.abrirAlerta('Error', 'No se pudo cargar el registro de accesos.', 'error');
          this.cargandoAccesos = false;
          this.cdr.detectChanges(); 
      }
    });
  }

  limpiarBusquedaAccesos() {
    this.textoBusquedaAccesos = '';
    this.cargarAccesosAdmin();
  }

  crearUsuario() {
    this.http.post('http://localhost:5076/api/Usuarios', this.nuevoUsuario).subscribe({
      next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', idRol: 2 }; this.cargarUsuariosAdmin(); },
      error: (err) => this.abrirAlerta('Error', err.error?.mensaje || 'Error al crear usuario.', 'error')
    });
  }

  toggleEstadoUsuario(id: number) {
    this.http.put(`http://localhost:5076/api/Usuarios/${id}/estado`, {}).subscribe({
      next: () => this.cargarUsuariosAdmin(), error: () => this.abrirAlerta('Error', 'No se pudo cambiar el estado.', 'error')
    });
  }

  cambiarPasswordUsuario(id: number) {
    this.abrirInput('Restablecer Contraseña', 'Asigne una contraseña temporal. El usuario deberá cambiarla al iniciar sesión:', () => {
      if (this.inputTemporal.length < 5) { this.abrirAlerta('Error', 'La contraseña debe ser mayor a 5 caracteres.', 'error'); return; }
      this.http.put(`http://localhost:5076/api/Usuarios/${id}/password`, { password: this.inputTemporal }).subscribe({
        next: (res: any) => this.abrirAlerta('Actualizado', res.mensaje, 'success'),
        error: () => this.abrirAlerta('Error', 'No se pudo actualizar.', 'error')
      });
    });
  }

  cargarTramitesAdmin() {
    this.http.get('http://localhost:5076/api/Tramites/Admin').subscribe({
      next: (res: any) => { 
        this.categoriasAdmin = res.map((cat: any) => {
          const primerServicio = cat.tramites.length > 0 ? cat.tramites[0] : {};
          return {
            idCategoria: cat.idCategoria,
            nombreCategoria: cat.nombreCategoria,
            costo: primerServicio.costo || 0,
            duracionMinutos: primerServicio.duracionMinutos || 30,
            limiteDiarioSede: primerServicio.limiteDiarioSede || 50,
            activo: cat.activa
          };
        });
        this.cdr.detectChanges();
      }
    });
  }

  actualizarCategoria(cat: any) {
    const payload = { duracionMinutos: cat.duracionMinutos, costo: cat.costo, activo: cat.activo, limiteDiario: cat.limiteDiarioSede };
    this.http.put(`http://localhost:5076/api/Tramites/Categoria/${cat.idCategoria}`, payload).subscribe({
      next: (res: any) => {
          this.abrirAlerta('Guardado', res.mensaje, 'success');
          this.cargarTramites(); 
      },
      error: () => this.abrirAlerta('Error', 'No se pudo guardar la configuración.', 'error')
    });
  }

  // --- NAVEGACIÓN GENERAL ---
  regresarPaso1() { 
    this.pasoActual = 1; this.sedeSeleccionada = null; this.categorias = []; this.limpiarFormulario();
    sessionStorage.removeItem('pasoRC'); history.pushState({ paso: 1 }, '', ''); 
    this.cargarAvisoGlobal(); this.cdr.detectChanges(); 
  }
  regresarPaso2() { this.pasoActual = 2; this.tramiteSeleccionado = null; history.pushState({ paso: 2 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso3() { this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
}