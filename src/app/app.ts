import { Component, inject, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { environment } from '../environments/environment';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare var grecaptcha: any; // DECLARACIÓN DE GOOGLE RECAPTCHA

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  apiUrl = environment.apiUrl; 

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
  
  // VARIABLES PARA DÍAS INHÁBILES
  diasBloqueados: string[] = [];
  diasInhabilesAdmin: any[] = [];
  nuevoDiaInhabil: any = { fecha: '', motivo: '' };

  // VARIABLES PARA RENDERIZAR GOOGLE RECAPTCHA
  widgetIdAgendar: any;
  widgetIdBuscar: any;

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  horariosDisponibles: string[] = [];
  cargandoHorarios: boolean = false; 
  folioExito: string = '';
  folioBusqueda: string = '';
  citaConsultada: any = null;
  cargandoConsulta: boolean = false;

  modoReagendar: boolean = false;
  folioReagendar: string = '';
  procesandoCita: boolean = false; 

  // CANDADO PARA EL BUCLE INFINITO
  evitarBucleCitas: boolean = false;

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

  citasDiaOriginales: any[] = []; 
  citasDia: any[] = []; 
  tramitesUnicos: string[] = []; 
  filtroTramite: string = '';
  fechaDashboard: string = new Date().toISOString().split('T')[0];
  textoBusquedaDashboard: string = '';
  
  mostrarForzarPassword: boolean = false;
  nuevaPassword = '';
  confirmarPassword = '';

  bitacoraLogs: any[] = [];
  cargandoBitacora: boolean = false;
  fechaBitacora: string = ''; 
  textoBusquedaBitacora: string = '';

  usuariosSistema: any[] = [];
  categoriasAdmin: any[] = []; 
  nuevoUsuario = { username: '', password: '', nombreCompleto: '', idRol: 2, idSede: 1 };
  
  registroAccesos: any[] = [];
  fechaAccesos: string = '';
  textoBusquedaAccesos: string = '';
  cargandoAccesos: boolean = false;
  paginaActualAccesos: number = 1;
  totalPaginasAccesos: number = 1;
  arregloPaginas: number[] = [];

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
  curpValida: boolean = true;
  mostrarMensajesAyuda: boolean = false;

  http = inject(HttpClient);
  cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarSedes();
    this.cargarUsuariosSoporte();
    this.cargarReglasCalendario();

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
    if (this.pasoActual === 4) {
      this.generarCalendario();
      this.renderCaptchaAgendar();
    }
    if (this.pasoActual === 6) {
      this.renderCaptchaBuscar();
    }
    this.cdr.detectChanges();
  }

  cargarReglasCalendario() {
    this.http.get(this.apiUrl + '/Configuracion/ReglasCalendario').subscribe({
      next: (res: any) => {
         this.diasInhabilesAdmin = res.diasInhabiles || [];
         this.diasBloqueados = this.diasInhabilesAdmin.map((d: any) => d.fecha.split('T')[0]);
         this.generarCalendario();
         this.cdr.detectChanges();
      }
    });
  }

  agregarDiaInhabil() {
    if (!this.nuevoDiaInhabil.fecha || !this.nuevoDiaInhabil.motivo) {
        this.abrirAlerta('Atención', 'Complete la fecha y el motivo para bloquear el día.', 'warning'); return;
    }
    this.http.post(this.apiUrl + '/Configuracion/DiasInhabiles', this.nuevoDiaInhabil).subscribe({
        next: (res: any) => { 
            this.abrirAlerta('Día Bloqueado', res.mensaje, 'success'); 
            this.nuevoDiaInhabil = { fecha: '', motivo: '' };
            this.cargarReglasCalendario(); 
        },
        error: () => this.abrirAlerta('Error', 'No se pudo bloquear el día.', 'error')
    });
  }

  eliminarDiaInhabil(id: number) {
    this.http.delete(`${this.apiUrl}/Configuracion/DiasInhabiles/${id}`).subscribe({
        next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.cargarReglasCalendario(); },
        error: () => this.abrirAlerta('Error', 'No se pudo eliminar.', 'error')
    });
  }

  soloNumeros(event: any) { const charCode = (event.which) ? event.which : event.keyCode; if (charCode < 48 || charCode > 57) { event.preventDefault(); } }
  soloLetras(event: any) { const charCode = (event.which) ? event.which : event.keyCode; if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 32 || charCode === 241 || charCode === 209) { return true; } event.preventDefault(); return false; }

  validarFormatoCURP() {
    if (this.ciudadano.curp) { this.ciudadano.curp = this.ciudadano.curp.toUpperCase(); }
    if (!this.ciudadano.curp || this.ciudadano.curp.length === 0) { this.curpValida = true; return; }
    const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/;
    this.curpValida = regexCURP.test(this.ciudadano.curp);
  }

  validarPasoDatos() {
    this.mostrarMensajesAyuda = true; 
    const tieneCurp = this.ciudadano.curp && this.ciudadano.curp.length === 18 && this.curpValida;
    const tieneNombre = this.ciudadano.nombre && this.ciudadano.nombre.trim().length > 0;
    if (!tieneCurp && !tieneNombre) { this.abrirAlerta('Faltan Datos', 'Debe ingresar al menos su CURP o su Nombre Completo para continuar.', 'warning'); return; }
    if (this.ciudadano.curp && this.ciudadano.curp.length > 0 && !this.curpValida) { this.abrirAlerta('CURP Inválida', 'La CURP ingresada no tiene un formato válido.', 'warning'); return; }
    if (this.ciudadano.telefono && this.ciudadano.telefono.length !== 10) { this.abrirAlerta('Teléfono Inválido', 'El número de teléfono debe ser exactamente de 10 dígitos.', 'warning'); return; }
    this.irAPaso4();
  }

  cargarAvisoGlobal() { if (this.usuarioSesion) return; this.http.get(this.apiUrl + '/Avisos/Activo').subscribe({ next: (res: any) => { if (res && res.titulo) { this.avisoGlobal = res; this.mostrarAvisoGlobal = true; this.cdr.detectChanges(); } } }); }
  cerrarAvisoGlobal() { this.mostrarAvisoGlobal = false; this.cdr.detectChanges(); }

  obtenerIconoCategoria(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('acta')) return 'fa-file-signature'; if (n.includes('curp')) return 'fa-id-card';
    if (n.includes('anotaciones')) return 'fa-pen-clip'; if (n.includes('constancia')) return 'fa-file-circle-check';
    if (n.includes('enmienda')) return 'fa-file-pen'; return 'fa-file-lines'; 
  }

  abrirAlerta(titulo: string, mensaje: string, icono: string = 'info') { this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = icono; this.alertaTipo = 'alerta'; this.mostrarAlerta = true; this.cdr.detectChanges(); }
  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void) { this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = 'warning'; this.alertaTipo = 'confirmacion'; this.accionConfirmacion = accion; this.mostrarAlerta = true; this.cdr.detectChanges(); }
  abrirInput(titulo: string, mensaje: string, accion: () => void) { this.alertaTitulo = titulo; this.alertaMensaje = mensaje; this.alertaIcono = 'info'; this.alertaTipo = 'input'; this.inputTemporal = ''; this.accionConfirmacion = accion; this.mostrarAlerta = true; this.cdr.detectChanges(); }
  cerrarAlerta() { this.mostrarAlerta = false; }
  ejecutarConfirmacion() { this.mostrarAlerta = false; this.accionConfirmacion(); }

  limpiarFormulario() {
    this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };
    this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = [];
    this.diasMes.forEach(d => d.seleccionado = false); this.folioBusqueda = ''; this.categoriaExpandida = null;
    this.modoReagendar = false; this.folioReagendar = ''; this.procesandoCita = false;
    this.curpValida = true; this.mostrarMensajesAyuda = false;
  }

  cargarSedes() { this.http.get(this.apiUrl + '/Sedes').subscribe({ next: (datos: any) => { this.sedes = datos; this.cdr.detectChanges(); } }); }
  cargarTramites() { this.http.get(this.apiUrl + '/Tramites').subscribe({ next: (datos: any) => { this.categorias = datos; this.cdr.detectChanges(); } }); }
  toggleCategoria(idCategoria: number) { this.categoriaExpandida = (this.categoriaExpandida === idCategoria) ? null : idCategoria; this.cdr.detectChanges(); }

  seleccionarSede(sede: any) {
    this.sedeSeleccionada = sede; 
    const nombreSede = sede.nombre.toLowerCase();
    this.esOtrosEstados = nombreSede.includes('otros');
    this.ciudadano.estadoRegistro = ''; this.ciudadano.municipioRegistro = '';
    
    if (nombreSede.includes('centro') || nombreSede.includes('direcci')) { this.municipiosRegistro = ['Ahualulco', 'Armadillo de los Infante', 'Cerro de San Pedro', 'Mexquitic de Carmona', 'San Luis Potosí', 'Santa María del Río', 'Soledad de Graciano Sánchez', 'Tierra Nueva', 'Villa de Arriaga', 'Villa de Reyes', 'Villa de Zaragoza', 'Villa de Pozos (Municipio 59)'].sort(); } 
    else if (nombreSede.includes('altiplano') || nombreSede.includes('charcas')) { this.municipiosRegistro = ['Catorce', 'Cedral', 'Charcas', 'Guadalcázar', 'Matehuala', 'Moctezuma', 'Salinas', 'Santo Domingo', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa Hidalgo'].sort(); } 
    else if (nombreSede.includes('huasteca') || nombreSede.includes('valles') || nombreSede.includes('tamazunchale')) { this.municipiosRegistro = ['Aquismón', 'Axtla de Terrazas', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Huehuetlán', 'Matlapa', 'San Antonio', 'San Martín Chalchicuautla', 'San Vicente Tancuayalab', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Xilitla'].sort(); } 
    else if (this.esOtrosEstados) { this.municipiosRegistro = [...this.todosLosMunicipiosSLP]; } else { this.municipiosRegistro = []; }

    this.pasoActual = 2; this.cargarTramites(); history.pushState({ paso: 2 }, '', '');
  }
  
  seleccionarTramite(tramite: any) { this.tramiteSeleccionado = tramite; this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
  
  renderCaptchaAgendar() {
      setTimeout(() => {
          if (typeof grecaptcha !== 'undefined') {
              const el = document.getElementById('captcha-agendar');
              if (el) {
                  el.innerHTML = ''; 
                  this.widgetIdAgendar = grecaptcha.render('captcha-agendar', { 
                      'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' 
                  });
              }
          }
      }, 150);
  }

  renderCaptchaBuscar() {
      setTimeout(() => {
          if (typeof grecaptcha !== 'undefined') {
              const el = document.getElementById('captcha-buscar');
              if (el) {
                  el.innerHTML = '';
                  this.widgetIdBuscar = grecaptcha.render('captcha-buscar', { 
                      'sitekey': '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI' 
                  });
              }
          }
      }, 150);
  }

  irAPaso4() { 
      this.pasoActual = 4; 
      this.cargarReglasCalendario(); 
      history.pushState({ paso: 4 }, '', ''); 
      this.cdr.detectChanges(); 
      this.renderCaptchaAgendar();
  }
  
  cambiarMes(delta: number) { this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1); this.generarCalendario(); }

  generarCalendario() {
    const year = this.mesActual.getFullYear(); const month = this.mesActual.getMonth();
    const primerDia = new Date(year, month, 1); const ultimoDia = new Date(year, month + 1, 0);
    this.diasMes = []; for (let i = 0; i < primerDia.getDay(); i++) { this.diasMes.push({ vacio: true }); }
    
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const fecha = new Date(year, month, i);
      const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6;
      const esInhabil = this.diasBloqueados.includes(fechaStr);
      const yaPaso = fecha < hoy;

      let seleccionado = false;
      if (this.fechaSeleccionada === fechaStr) seleccionado = true;

      const activo = !esFinde && !yaPaso && !esInhabil;
      this.diasMes.push({ vacio: false, fecha: fecha, dia: i, activo: activo, seleccionado: seleccionado });
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
    this.http.get<string[]>(`${this.apiUrl}/Citas/Horarios?idSede=${this.sedeSeleccionada.idSede}&idTramite=${this.tramiteSeleccionado.idTramite}&fecha=${this.fechaSeleccionada}`)
      .subscribe({
        next: (horas) => { 
            this.horariosDisponibles = horas; 
            this.cargandoHorarios = false; 
            this.cdr.detectChanges(); 
        },
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
    if (this.procesandoCita) return;
    const token = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse(this.widgetIdAgendar) : null;
    if (!token) {
        this.abrirAlerta('Seguridad', 'Por favor, marque la casilla "No soy un robot".', 'warning');
        return;
    }

    this.procesandoCita = true; 
    this.citaConsultada = null; 

    if (this.modoReagendar) {
      const payload = { nuevaFechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00` };
      this.http.put(`${this.apiUrl}/Citas/${this.folioReagendar}/reagendar`, payload).subscribe({
          next: (res: any) => {
              this.folioExito = this.folioReagendar;
              this.citaConsultada = { folio: this.folioExito, tramite: this.tramiteSeleccionado?.nombreTramite || 'Trámite', costo: this.tramiteSeleccionado?.costo || 0, fecha: this.fechaSeleccionada, hora: this.horaSeleccionada, sede: this.sedeSeleccionada?.nombre || '', ciudadano: this.ciudadano.nombre, curp: this.ciudadano.curp, requisitos: this.tramiteSeleccionado?.requisitos || '' };
              this.modoReagendar = false; this.folioReagendar = ''; this.pasoActual = 5; history.pushState({ paso: 5 }, '', ''); this.limpiarFormulario(); this.procesandoCita = false; this.cdr.detectChanges();
              if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdAgendar);
          },
          error: (err) => { 
              this.procesandoCita = false; 
              this.abrirAlerta('Error', err.error.mensaje || 'No se pudo reagendar.', 'error'); 
              if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdAgendar);
          }
      });
    } else {
      const navInfo = this.getBrowserInfo();
      const solicitud = { curp: this.ciudadano.curp, nombre: this.ciudadano.nombre, correo: this.ciudadano.correo, telefono: this.ciudadano.telefono, municipioRegistro: this.ciudadano.municipioRegistro, estadoRegistro: this.ciudadano.estadoRegistro, idTramite: this.tramiteSeleccionado.idTramite, idSede: this.sedeSeleccionada.idSede, fechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`, navegador: navInfo.browser, sistemaOperativo: navInfo.os, captchaToken: token };
      this.http.post(this.apiUrl + '/Citas', solicitud).subscribe({
        next: (res: any) => { 
            this.folioExito = res.folio; 
            this.citaConsultada = { folio: this.folioExito, tramite: this.tramiteSeleccionado.nombreTramite, costo: this.tramiteSeleccionado.costo, fecha: this.fechaSeleccionada, hora: this.horaSeleccionada, sede: this.sedeSeleccionada.nombre, ciudadano: this.ciudadano.nombre, curp: this.ciudadano.curp, requisitos: this.tramiteSeleccionado.requisitos };
            this.pasoActual = 5; history.pushState({ paso: 5 }, '', ''); this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' }; this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = []; this.diasMes.forEach(d => d.seleccionado = false); this.folioBusqueda = ''; this.categoriaExpandida = null; this.modoReagendar = false; this.folioReagendar = ''; this.procesandoCita = false; this.curpValida = true; this.mostrarMensajesAyuda = false; this.cdr.detectChanges(); 
            if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdAgendar);
        },
        error: (err) => { 
            this.procesandoCita = false; 
            this.abrirAlerta('Alerta', err.error.mensaje || "Error al registrar la cita", 'warning'); 
            if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdAgendar);
        }
      });
    }
  }

  exportarPDF(idTabla: string, tituloReporte: string) {
    const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png';
    img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); this.generarContenidoReporte(doc, idTabla, tituloReporte, 45); };
    img.onerror = () => { doc.setFontSize(16); doc.setTextColor(5, 90, 28); doc.text('Registro Civil del Estado de San Luis Potosí', 14, 15); this.generarContenidoReporte(doc, idTabla, tituloReporte, 25); };
  }

  generarContenidoReporte(doc: any, idTabla: string, tituloReporte: string, startY: number) {
    doc.setFontSize(13); doc.setTextColor(5, 90, 28); doc.setFont("helvetica", "bold"); doc.text(tituloReporte, 14, startY);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    let y = startY + 6; doc.text(`Generado el: ${new Date().toLocaleString()} por el usuario: ${this.usuarioSesion?.username || 'Sistema'}`, 14, y); y += 5; doc.text(`Sede Operativa: ${this.usuarioSesion?.sede || 'Global'}`, 14, y); y += 5;
    let filtroExtra = 'Mostrando todos los registros';
    if (idTabla === 'tablaCitas' && this.fechaDashboard) filtroExtra = `Filtrado por fecha: ${this.fechaDashboard}`;
    if (idTabla === 'tablaCitas' && this.filtroTramite) filtroExtra = `Filtrado por trámite: ${this.filtroTramite}`;
    if (idTabla === 'tablaBitacora' && this.fechaBitacora) filtroExtra = `Filtrado por fecha: ${this.fechaBitacora}`;
    doc.setFont("helvetica", "bold"); doc.text(`Filtros aplicados: ${filtroExtra}`, 14, y); y += 8;
    autoTable(doc, { html: `#${idTabla}`, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [200, 200, 200] },
      didParseCell: (data: any) => { if (data.section === 'body' && data.cell.text && data.cell.text.length > 0) { for (let i = 0; i < data.cell.text.length; i++) { data.cell.text[i] = data.cell.text[i].replace(/(\d{2}:\d{2})(\d{2}\/\d{2}\/\d{4})/, '$1\n$2'); } } }
    });
    doc.save(`${tituloReporte.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  }

  descargarAcuseOficial() {
    if (!this.citaConsultada) { this.abrirAlerta('Error', 'No hay datos cargados para generar el PDF.', 'error'); return; }
    try {
        const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png'; 
        img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); this.generarContenidoAcuse(doc, 45); };
        img.onerror = () => { doc.setFillColor(5, 90, 28); doc.rect(0, 0, 210, 30, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Poder Ejecutivo del Estado de San Luis Potosí", 105, 12, { align: "center" }); doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.text("Dirección del Registro Civil", 105, 20, { align: "center" }); this.generarContenidoAcuse(doc, 35); };
    } catch (error) { console.error(error); this.abrirAlerta('Error', 'No se pudo generar el PDF.', 'error'); }
  }

  generarContenidoAcuse(doc: any, startY: number) {
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.text("Acuse Oficial de Cita Agendada", 105, startY, { align: "center" }); doc.setDrawColor(5, 90, 28); doc.setLineWidth(0.5); doc.rect(15, startY + 10, 180, 50);
    let identificador = ""; if (this.citaConsultada.ciudadano && this.citaConsultada.ciudadano.trim() !== '') { identificador = this.citaConsultada.ciudadano; } else { identificador = `CURP: ${this.citaConsultada.curp}`; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 90, 28); doc.text(`Folio: ${this.citaConsultada.folio}`, 20, startY + 20); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50); doc.text(`Ciudadano/a: ${identificador}`, 20, startY + 30); doc.text(`Trámite: ${this.citaConsultada.tramite}`, 20, startY + 40); doc.text(`Fecha y Hora: ${this.citaConsultada.fecha} a las ${this.citaConsultada.hora} hrs`, 20, startY + 50); doc.setFont("helvetica", "bold"); doc.text(`Costo del Servicio: $${this.citaConsultada.costo}`, 130, startY + 50); doc.setFontSize(12); doc.setTextColor(5, 90, 28); doc.text("Requisitos del Trámite:", 15, startY + 75); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    const reqFormateados = this.citaConsultada.requisitos ? this.citaConsultada.requisitos.replace(/•/g, '- ') : 'Consulte requisitos en ventanilla.'; const reqText = doc.splitTextToSize(reqFormateados, 180); doc.text(reqText, 15, startY + 85); let nextY = startY + 85 + (reqText.length * 5) + 15; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(230, 0, 100); doc.text("Avisos Importantes y Penalización:", 15, nextY); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); const avisosText = doc.splitTextToSize("- El trámite es estrictamente personal. Es obligatorio presentar Identificación Oficial (ID) vigente.\n- SISTEMA DE PENALIZACIÓN: Si usted agenda su cita y NO asiste, el sistema lo bloqueará automáticamente, impidiéndole agendar un nuevo trámite durante 1 semana.", 180); doc.text(avisosText, 15, nextY + 10);
    doc.save(`Acuse_Cita_${this.citaConsultada.folio}.pdf`);
  }

  descargarPDFAccesos() {
    let url = `${this.apiUrl}/Usuarios/Accesos?page=1&pageSize=10000`; if (this.fechaAccesos) url += `&fecha=${this.fechaAccesos}`; if (this.textoBusquedaAccesos) url += `&busqueda=${this.textoBusquedaAccesos}`;
    this.http.get(url).subscribe({
        next: (res: any) => {
            const datos = res.datos || res.Datos; if (!datos || datos.length === 0) { this.abrirAlerta('Aviso', 'No hay registros para exportar.', 'warning'); return; }
            const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png';
            const generarTabla = (documento: any, startY: number) => {
                documento.setFontSize(13); documento.setTextColor(5, 90, 28); documento.setFont("helvetica", "bold"); documento.text("Registro Histórico de Accesos", 14, startY); documento.setFontSize(9); documento.setFont("helvetica", "normal"); documento.setTextColor(80, 80, 80); let y = startY + 6; documento.text(`Generado el: ${new Date().toLocaleString()} por el usuario: ${this.usuarioSesion?.username}`, 14, y); y += 5; documento.text(`Sede Operativa: ${this.usuarioSesion?.sede || 'Global'}`, 14, y); y += 5; let filtro = this.fechaAccesos ? `Filtrado por fecha: ${this.fechaAccesos}` : 'Mostrando todos los registros históricos'; documento.setFont("helvetica", "bold"); documento.text(`Filtros aplicados: ${filtro}`, 14, y); y += 8;
                const body = datos.map((a: any) => { const fInicio = new Date(a.fechaLogin).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }); const fFin = a.fechaLogout ? new Date(a.fechaLogout).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'EN LÍNEA'; return [a.idAcceso, a.username, fInicio, fFin]; });
                autoTable(documento, { head: [['ID Sesión', 'Usuario', 'Fecha y Hora Inicio', 'Fecha y Hora Cierre']], body: body, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200] } });
                documento.save(`Reporte_Accesos_${new Date().getTime()}.pdf`);
            };
            img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); generarTabla(doc, 45); }; img.onerror = () => { doc.setFontSize(16); doc.setTextColor(5, 90, 28); doc.text('Registro Civil del Estado de San Luis Potosí', 14, 15); generarTabla(doc, 25); };
        },
        error: () => this.abrirAlerta('Error', 'No se pudieron obtener los datos para el PDF.', 'error')
    });
  }

  cerrarSesionRemota(idAcceso: number) { this.abrirConfirmacion('Forzar Cierre de Sesión', '¿Está seguro de que desea cerrar la sesión seleccionada?', () => { this.http.put(`${this.apiUrl}/Usuarios/Accesos/${idAcceso}/cerrar`, {}).subscribe({ next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.cargarAccesosAdmin(this.paginaActualAccesos); }, error: (err) => { this.abrirAlerta('Error', err.error?.mensaje || 'No se pudo cerrar la sesión.', 'error'); } }); }); }

  irABuscarCita() { 
      this.pasoActual = 6; 
      this.limpiarFormulario(); 
      this.citaConsultada = null; 
      history.pushState({ paso: 6 }, '', ''); 
      this.cdr.detectChanges(); 
      this.renderCaptchaBuscar();
  }

  buscarCitaPorFolio() {
    const token = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse(this.widgetIdBuscar) : null;
    if (!token) { this.abrirAlerta('Seguridad', 'Por favor, complete el reCAPTCHA.', 'warning'); return; }
    if (!this.folioBusqueda || this.folioBusqueda.length < 8) return;

    this.cargandoConsulta = true;
    this.http.get(`${this.apiUrl}/Citas/${this.folioBusqueda.toUpperCase()}?captchaToken=${token}`).subscribe({
      next: (res: any) => { this.citaConsultada = res; this.pasoActual = 7; this.cargandoConsulta = false; history.pushState({ paso: 7 }, '', ''); this.cdr.detectChanges(); if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdBuscar); },
      error: (err) => { this.abrirAlerta('Folio no encontrado', err.error.mensaje || "Verifique el folio e intente de nuevo.", 'warning'); this.cargandoConsulta = false; this.cdr.detectChanges(); if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdBuscar); }
    });
  }

  prepararReagendar() { this.modoReagendar = true; this.folioReagendar = this.citaConsultada.folio; this.sedeSeleccionada = { idSede: this.citaConsultada.idSede, nombre: this.citaConsultada.sede }; this.tramiteSeleccionado = { idTramite: this.citaConsultada.idTramite, nombreTramite: this.citaConsultada.tramite, costo: this.citaConsultada.costo, requisitos: this.citaConsultada.requisitos }; this.ciudadano.nombre = this.citaConsultada.ciudadano; this.ciudadano.curp = this.citaConsultada.curp; this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = []; this.pasoActual = 4; this.cargarReglasCalendario(); history.pushState({ paso: 4 }, '', ''); this.cdr.detectChanges(); this.renderCaptchaAgendar(); }

  cancelarCita() { this.abrirConfirmacion('¿Cancelar Cita?', 'Si cancela perderá este horario y liberará el espacio.', () => { this.http.put(`${this.apiUrl}/Citas/${this.citaConsultada.folio}/cancelar`, {}).subscribe({ next: (res: any) => { this.abrirAlerta('Cita Cancelada', res.mensaje, 'success'); this.citaConsultada.estatus = 'CANCELADA'; this.cdr.detectChanges(); }, error: (err) => { this.abrirAlerta('Error', err.error.mensaje || "Error al cancelar", 'error'); } }); }); }

  irALogin() { this.pasoActual = 8; this.credenciales = { username: '', password: '' }; history.pushState({ paso: 8 }, '', ''); this.cdr.detectChanges(); }
  
  iniciarSesion() { 
    if (!this.credenciales.username || !this.credenciales.password) { 
      this.abrirAlerta('Atención', 'Por favor, ingrese usuario y contraseña.', 'warning'); 
      return; 
    } 
    this.cargandoLogin = true; 
    this.http.post(this.apiUrl + '/Auth/login', this.credenciales).subscribe({ 
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
      error: (err) => { 
        this.cargandoLogin = false; 
        this.abrirAlerta('Acceso Denegado', err.error.mensaje || 'Credenciales incorrectas.', 'error'); 
        this.cdr.detectChanges(); 
      } 
    }); 
  }

  guardarNuevaPasswordForzada() { const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/; if (!passwordRegex.test(this.nuevaPassword)) { this.abrirAlerta('Contraseña Débil', 'La contraseña no cumple con los requisitos mínimos de seguridad.', 'warning'); return; } if (this.nuevaPassword !== this.confirmarPassword) { this.abrirAlerta('Atención', 'Las contraseñas no coinciden.', 'warning'); return; } this.http.put(`${this.apiUrl}/Usuarios/${this.usuarioSesion.idUsuario}/password`, { password: this.nuevaPassword }).subscribe({ next: (res: any) => { this.mostrarForzarPassword = false; this.abrirAlerta('Éxito', 'Contraseña actualizada.', 'success'); this.usuarioSesion.requiereCambioPassword = false; this.procesarAccesoCorrecto(); }, error: () => this.abrirAlerta('Error', 'No se pudo actualizar.', 'error') }); }
  
  procesarAccesoCorrecto() { sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); sessionStorage.setItem('pasoRC', '9'); this.pasoActual = 9; this.cargarCitasDashboard(); if (this.usuarioSesion?.rol === 'Super Administrador') { this.cargarPeticionesAdmin(); } else { this.cargarMisPeticiones(); } history.pushState({ paso: 9 }, '', ''); this.cdr.detectChanges(); }
  
  cerrarSesion() { 
    if(this.usuarioSesion?.idAcceso) { 
      this.http.post(`${this.apiUrl}/Auth/logout/${this.usuarioSesion.idAcceso}`, {}).subscribe(); 
    } 
    this.usuarioSesion = null; 
    sessionStorage.removeItem('usuarioRC'); 
    sessionStorage.removeItem('pasoRC'); 
    
    
    this.regresarPaso1(); 
  }

  cargarCitasDashboard() { 
  // CANDADO REFORZADO
  if (this.evitarBucleCitas) return;
  this.evitarBucleCitas = true;

  let url = `${this.apiUrl}/Citas/PorSede/${this.usuarioSesion.idSede}`; 
  if (this.textoBusquedaDashboard && this.textoBusquedaDashboard.trim().length > 0) { 
    url += `?busqueda=${encodeURIComponent(this.textoBusquedaDashboard)}`; 
  } else { 
    url += `?fecha=${this.fechaDashboard}`; 
  } 
  
  this.http.get(url).subscribe({ 
    next: (res: any) => { 
      // Almacenamos temporalmente para no alertar al detector de Angular de inmediato
      const data = res; 
      const tramites = [...new Set(res.map((c: any) => c.tramite))] as string[];
      
      // Actualizamos las variables
      this.citasDiaOriginales = data; 
      this.tramitesUnicos = tramites; 
      this.aplicarFiltroTramite(); 

      // Rompemos el ciclo de detección de cambios con un setTimeout mínimo
      setTimeout(() => {
        this.evitarBucleCitas = false; 
        this.cdr.detectChanges(); 
      }, 50);
    }, 
    error: () => {
      this.evitarBucleCitas = false; 
      this.abrirAlerta('Error', 'No se pudieron cargar las citas.', 'error');
    } 
  }); 
}
  aplicarFiltroTramite() { if (this.filtroTramite) { this.citasDia = this.citasDiaOriginales.filter(c => c.tramite === this.filtroTramite); } else { this.citasDia = [...this.citasDiaOriginales]; } }
  limpiarBusqueda() { this.textoBusquedaDashboard = ''; this.filtroTramite = ''; this.cargarCitasDashboard(); }
  actualizarEstatusCita(folio: string, nuevoEstatus: string) { this.http.put(`${this.apiUrl}/Citas/${folio}/actualizarEstatus`, { nuevoEstatus: nuevoEstatus, idUsuarioInterno: this.usuarioSesion.idUsuario }).subscribe({ next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.cargarCitasDashboard(); }, error: () => this.abrirAlerta('Error', 'No se pudo actualizar.', 'error') }); }

  irABitacora() { this.pasoActual = 10; sessionStorage.setItem('pasoRC', '10'); this.cargarBitacora(); history.pushState({ paso: 10 }, '', ''); this.cdr.detectChanges(); }
  regresarADashboard() { this.pasoActual = 9; sessionStorage.setItem('pasoRC', '9'); history.pushState({ paso: 9 }, '', ''); this.cargarCitasDashboard(); if (this.usuarioSesion?.rol === 'Super Administrador') this.cargarPeticionesAdmin(); else this.cargarMisPeticiones(); this.cdr.detectChanges(); }
  cargarBitacora() { this.cargandoBitacora = true; let url = this.apiUrl + '/Bitacora'; const params = []; if (this.textoBusquedaBitacora && this.textoBusquedaBitacora.trim().length > 0) { params.push(`busqueda=${encodeURIComponent(this.textoBusquedaBitacora)}`); } else if (this.fechaBitacora) { params.push(`fecha=${this.fechaBitacora}`); } if (params.length > 0) { url += '?' + params.join('&'); } this.http.get(url).subscribe({ next: (res: any) => { this.bitacoraLogs = res; this.cargandoBitacora = false; this.cdr.detectChanges(); }, error: () => { this.abrirAlerta('Error', 'No se pudo cargar la bitácora.', 'error'); this.cargandoBitacora = false; this.cdr.detectChanges(); } }); }
  limpiarBusquedaBitacora() { this.textoBusquedaBitacora = ''; this.cargarBitacora(); }
 deshacerAccion(idBitacora: number) {
  this.abrirConfirmacion('¿Deshacer?', '¿Revertir este cambio?', () => {
    this.http.post(`${this.apiUrl}/Bitacora/Deshacer/${idBitacora}`, {}).subscribe({
      next: (res: any) => { this.abrirAlerta('Restaurado', res.mensaje, 'success'); this.cargarBitacora(); },
      error: (err) => { this.abrirAlerta('Error', err.error.mensaje || 'Error al deshacer.', 'error'); }
    });
  });
}

  cargarUsuariosSoporte() { this.http.get(this.apiUrl + '/Usuarios/Soporte').subscribe({ next: (res: any) => { this.usuariosSoporte = res; this.cdr.detectChanges(); } }); }
  cargarMisPeticiones() { if (!this.usuarioSesion) return; this.http.get(this.apiUrl + '/Peticiones/MisPeticiones/' + this.usuarioSesion.username).subscribe({ next: (res: any) => { this.misPeticiones = res; this.notificacionesNuevas = this.misPeticiones.filter((p: any) => p.estatus === 'RESUELTA' && p.leido === false).length; this.cdr.detectChanges(); } }); }
  abrirBandeja() { if (this.usuarioSesion?.rol === 'Super Administrador') { this.http.put(this.apiUrl + '/Peticiones/MarcarLeidasAdmin', {}).subscribe(); this.irACentroSoporte(); } else { this.mostrarBandeja = true; this.http.put(`${this.apiUrl}/Peticiones/MarcarLeidasUsuario/${this.usuarioSesion.username}`, {}).subscribe(); this.notificacionesNuevas = 0; this.cdr.detectChanges(); } }
  cerrarBandeja() { this.mostrarBandeja = false; this.cdr.detectChanges(); }
  abrirModalPeticion(desdeLogin: boolean = false) { this.peticionDesdeLogin = desdeLogin; this.nuevaPeticion = { username: desdeLogin ? '' : this.usuarioSesion?.username, tipo: desdeLogin ? 'RECUPERAR CONTRASEÑA' : 'SOPORTE TÉCNICO', descripcion: '' }; this.mostrarModalPeticion = true; this.cdr.detectChanges(); }
  cerrarModalPeticion() { this.mostrarModalPeticion = false; this.cdr.detectChanges(); }
  enviarPeticion() { if (!this.nuevaPeticion.username || !this.nuevaPeticion.descripcion) { this.abrirAlerta('Atención', 'Llene todos los campos.', 'warning'); return; } this.http.post(this.apiUrl + '/Peticiones', this.nuevaPeticion).subscribe({ next: (res: any) => { this.cerrarModalPeticion(); this.abrirAlerta('Enviada', res.mensaje, 'success'); if (this.usuarioSesion?.rol === 'Super Administrador') { this.cargarPeticionesAdmin(); } else if (this.usuarioSesion) { this.cargarMisPeticiones(); } }, error: () => this.abrirAlerta('Error', 'No se pudo enviar.', 'error') }); }
  cargarPeticionesAdmin() { this.http.get(this.apiUrl + '/Peticiones').subscribe({ next: (res: any) => { this.peticionesSistema = res; this.notificacionesNuevas = this.peticionesSistema.filter((p: any) => p.estatus === 'PENDIENTE' && p.leido === false).length; this.cdr.detectChanges(); } }); }
  resolverPeticion(id: number) { this.abrirInput('Responder', 'Mensaje de resolución:', () => { this.http.put(`${this.apiUrl}/Peticiones/${id}/resolver`, { respuesta: this.inputTemporal }).subscribe({ next: (res: any) => { this.abrirAlerta('Resuelto', res.mensaje, 'success'); this.cargarPeticionesAdmin(); }, error: () => this.abrirAlerta('Error', 'Error al resolver.', 'error') }); }); }

  irASuperAdmin() { this.pasoActual = 11; sessionStorage.setItem('pasoRC', '11'); this.cargarUsuariosAdmin(); this.cargarTramitesAdmin(); this.cargarAccesosAdmin(); this.cargarReglasCalendario(); history.pushState({ paso: 11 }, '', ''); this.cdr.detectChanges(); }
  irACentroSoporte() { this.pasoActual = 12; sessionStorage.setItem('pasoRC', '12'); this.cargarPeticionesAdmin(); history.pushState({ paso: 12 }, '', ''); this.cdr.detectChanges(); }

  cargarUsuariosAdmin() { this.http.get(this.apiUrl + '/Usuarios').subscribe({ next: (res: any) => { this.usuariosSistema = res; this.cdr.detectChanges(); } }); }
  cargarAccesosAdmin(paginaSolicitada: number = 1) { this.cargandoAccesos = true; let url = `${this.apiUrl}/Usuarios/Accesos?page=${paginaSolicitada}&pageSize=10`; if (this.textoBusquedaAccesos && this.textoBusquedaAccesos.trim().length > 0) { url += `&busqueda=${encodeURIComponent(this.textoBusquedaAccesos)}`; } else if (this.fechaAccesos) { url += `&fecha=${this.fechaAccesos}`; } this.http.get(url).subscribe({ next: (res: any) => { this.registroAccesos = res.datos; this.paginaActualAccesos = res.paginaActual; this.totalPaginasAccesos = res.totalPaginas; this.arregloPaginas = Array.from({ length: this.totalPaginasAccesos }, (_, i) => i + 1); this.cargandoAccesos = false; this.cdr.detectChanges(); }, error: () => { this.abrirAlerta('Error', 'No se pudieron cargar accesos.', 'error'); this.cargandoAccesos = false; this.cdr.detectChanges(); } }); }
  limpiarBusquedaAccesos() { this.textoBusquedaAccesos = ''; this.cargarAccesosAdmin(); }
  crearUsuario() { this.http.post(this.apiUrl + '/Usuarios', this.nuevoUsuario).subscribe({ next: (res: any) => { this.abrirAlerta('Éxito', res.mensaje, 'success'); this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', idRol: 2, idSede: 1 }; this.cargarUsuariosAdmin(); }, error: (err) => this.abrirAlerta('Error', err.error?.mensaje || 'Error al crear.', 'error') }); }
  toggleEstadoUsuario(id: number) { this.http.put(`${this.apiUrl}/Usuarios/${id}/estado`, {}).subscribe({ next: () => this.cargarUsuariosAdmin(), error: () => this.abrirAlerta('Error', 'No se pudo cambiar el estado.', 'error') }); }
  cambiarPasswordUsuario(id: number) { this.abrirInput('Restablecer', 'Contraseña temporal (Mín. 6 chars, 1 mayúscula, 1 número, 1 especial):', () => { const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/; if (!passwordRegex.test(this.inputTemporal)) { this.abrirAlerta('Error', 'La contraseña no cumple con los requisitos de seguridad.', 'error'); return; } this.http.put(`${this.apiUrl}/Usuarios/${id}/password`, { password: this.inputTemporal }).subscribe({ next: (res: any) => this.abrirAlerta('Actualizado', res.mensaje, 'success'), error: () => this.abrirAlerta('Error', 'No se pudo actualizar.', 'error') }); }); }
  cambiarSedeUsuario(usr: any) { const idSedeNueva = usr.idSede; this.http.put(`${this.apiUrl}/Usuarios/${usr.idUsuario}/sede`, { idSede: idSedeNueva }).subscribe({ next: (res: any) => { this.abrirAlerta('Actualizado', res.mensaje, 'success'); if (this.usuarioSesion && this.usuarioSesion.idUsuario === usr.idUsuario) { this.usuarioSesion.idSede = idSedeNueva; const sedeEncontrada = this.sedes.find(s => s.idSede === idSedeNueva); if (sedeEncontrada) { this.usuarioSesion.sede = sedeEncontrada.nombre; } sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); } }, error: () => { this.cargarUsuariosAdmin(); this.abrirAlerta('Error', 'No se pudo actualizar la sede.', 'error'); } }); }

  cargarTramitesAdmin() { this.http.get(this.apiUrl + '/Tramites/Admin').subscribe({ next: (res: any) => { this.categoriasAdmin = res.map((cat: any) => { const primerServicio = cat.tramites.length > 0 ? cat.tramites[0] : {}; return { idCategoria: cat.idCategoria, nombreCategoria: cat.nombreCategoria, costo: primerServicio.costo || 0, duracionMinutos: primerServicio.duracionMinutos || 30, limiteDiarioSede: primerServicio.limiteDiarioSede || 50, activo: cat.activa, fechaInicio: primerServicio.fechaInicioPermitida ? primerServicio.fechaInicioPermitida.split('T')[0] : '', fechaFin: primerServicio.fechaFinPermitida ? primerServicio.fechaFinPermitida.split('T')[0] : '' }; }); this.cdr.detectChanges(); } }); }
  
  actualizarCategoria(cat: any) { const payload = { duracionMinutos: cat.duracionMinutos, costo: cat.costo, activo: cat.activo, limiteDiario: cat.limiteDiarioSede, fechaInicio: cat.fechaInicio ? cat.fechaInicio : null, fechaFin: cat.fechaFin ? cat.fechaFin : null }; this.http.put(`${this.apiUrl}/Tramites/Categoria/${cat.idCategoria}`, payload).subscribe({ next: (res: any) => { this.abrirAlerta('Guardado', res.mensaje, 'success'); this.cargarTramites(); }, error: () => this.abrirAlerta('Error', 'No se pudo guardar la configuración.', 'error') }); }

  regresarPaso1() { this.pasoActual = 1; this.sedeSeleccionada = null; this.categorias = []; this.limpiarFormulario(); sessionStorage.removeItem('pasoRC'); history.pushState({ paso: 1 }, '', ''); this.cargarAvisoGlobal(); this.cdr.detectChanges(); }
  regresarPaso2() { this.pasoActual = 2; this.tramiteSeleccionado = null; history.pushState({ paso: 2 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso3() { this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
}