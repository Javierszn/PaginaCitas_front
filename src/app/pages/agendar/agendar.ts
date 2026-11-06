import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service';
import { ordenarSedesParaMostrar } from '../../sede-utils';
import jsPDF from 'jspdf';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';
declare var grecaptcha: any;

@Component({
  selector: 'app-agendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './agendar.html',
  styleUrls: ['./agendar.css']
})
export class AgendarComponent implements OnInit, OnDestroy {
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
  diasBloqueados: string[] = [];
  diasInhabilesAdmin: any[] = [];

  widgetIdAgendar: any;

  fechaSeleccionada: string = '';
  horaSeleccionada: string = '';
  horariosDisponibles: string[] = [];
  cargandoHorarios: boolean = false; 
  segundosReserva: number = 0;
  private venceReservaHorario = 0;
  private intervaloReserva: ReturnType<typeof setInterval> | null = null;
  folioExito: string = '';
  citaConsultada: any = null; 

  modoReagendar: boolean = false;
  folioReagendar: string = '';
  procesandoCita: boolean = false; 

  avisoGlobal: any = null;
  mostrarAvisoGlobal: boolean = false;

  municipiosRegistro: string[] = [];
  ladaSeleccionada = '52';
  ladasPaises = [
    { pais: 'México', codigo: '52' }, { pais: 'Estados Unidos', codigo: '1' }, { pais: 'Canadá', codigo: '1' },
    { pais: 'Argentina', codigo: '54' }, { pais: 'Bolivia', codigo: '591' }, { pais: 'Brasil', codigo: '55' },
    { pais: 'Chile', codigo: '56' }, { pais: 'Colombia', codigo: '57' }, { pais: 'Costa Rica', codigo: '506' },
    { pais: 'Cuba', codigo: '53' }, { pais: 'Ecuador', codigo: '593' }, { pais: 'El Salvador', codigo: '503' },
    { pais: 'Guatemala', codigo: '502' }, { pais: 'Honduras', codigo: '504' }, { pais: 'Nicaragua', codigo: '505' },
    { pais: 'Panamá', codigo: '507' }, { pais: 'Paraguay', codigo: '595' }, { pais: 'Perú', codigo: '51' },
    { pais: 'Puerto Rico', codigo: '1' }, { pais: 'República Dominicana', codigo: '1' }, { pais: 'Uruguay', codigo: '598' },
    { pais: 'Venezuela', codigo: '58' }, { pais: 'España', codigo: '34' }, { pais: 'Reino Unido', codigo: '44' },
    { pais: 'Francia', codigo: '33' }, { pais: 'Alemania', codigo: '49' }, { pais: 'Italia', codigo: '39' },
    { pais: 'Portugal', codigo: '351' }, { pais: 'Países Bajos', codigo: '31' }, { pais: 'Bélgica', codigo: '32' },
    { pais: 'Suiza', codigo: '41' }, { pais: 'Suecia', codigo: '46' }, { pais: 'Noruega', codigo: '47' },
    { pais: 'Dinamarca', codigo: '45' }, { pais: 'Irlanda', codigo: '353' }, { pais: 'Polonia', codigo: '48' },
    { pais: 'Rusia', codigo: '7' }, { pais: 'Turquía', codigo: '90' }, { pais: 'Israel', codigo: '972' },
    { pais: 'Arabia Saudita', codigo: '966' }, { pais: 'Emiratos Árabes Unidos', codigo: '971' }, { pais: 'India', codigo: '91' },
    { pais: 'China', codigo: '86' }, { pais: 'Japón', codigo: '81' }, { pais: 'Corea del Sur', codigo: '82' },
    { pais: 'Filipinas', codigo: '63' }, { pais: 'Australia', codigo: '61' }, { pais: 'Nueva Zelanda', codigo: '64' },
    { pais: 'Sudáfrica', codigo: '27' }, { pais: 'Egipto', codigo: '20' }, { pais: 'Marruecos', codigo: '212' }
  ];
  estadosRepublica: string[] = [ 'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México (CDMX)', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas' ];
  todosLosMunicipiosSLP: string[] = [ 'Ahualulco', 'Alaquines', 'Aquismón', 'Armadillo de los Infante', 'Axtla de Terrazas', 'Cárdenas', 'Catorce', 'Cedral', 'Cerritos', 'Cerro de San Pedro', 'Charcas', 'Ciudad del Maíz', 'Ciudad Fernández', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Guadalcázar', 'Huehuetlán', 'Lagunillas', 'Matehuala', 'Matlapa', 'Mexquitic de Carmona', 'Moctezuma', 'Rayón', 'Rioverde', 'Salinas', 'San Antonio', 'San Ciro de Acosta', 'San Luis Potosí', 'San Martín Chalchicuautla', 'San Nicolás Tolentino', 'San Vicente Tancuayalab', 'Santa Catarina', 'Santa María del Río', 'Santo Domingo', 'Soledad de Graciano Sánchez', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Tierra Nueva', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Arriaga', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa de Reyes', 'Villa Hidalgo', 'Villa Juárez', 'Xilitla', 'Zaragoza', 'Villa de Pozos (Municipio 59)' ].sort();

  ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };
  curpValida: boolean = true;
  mostrarMensajesAyuda: boolean = false;

  private api = inject(ApiService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargarSedes();
    this.cargarReglasCalendario();

    if (history.state && history.state.reagendar) {
      const cita = history.state.reagendar;
      this.modoReagendar = true;
      this.folioReagendar = cita.folio;
      this.sedeSeleccionada = { idSede: cita.idSede, nombre: cita.sede };
      this.tramiteSeleccionado = { idTramite: cita.idTramite, nombreTramite: cita.tramite, costo: cita.costo, requisitos: cita.requisitos };
      this.ciudadano.nombre = cita.ciudadano;
      this.ciudadano.curp = cita.curp;
      this.pasoActual = 4;
      this.iniciarCuentaRegresiva();
      setTimeout(() => this.renderCaptchaAgendar(), 200);
      history.replaceState({}, ''); 
    } else {
      history.replaceState({ paso: 1 }, '', '');
      this.cargarAvisoGlobal();
    }
  }

  ngOnDestroy() {
    this.detenerCuentaRegresiva();
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (event.state && event.state.paso) { this.pasoActual = event.state.paso; } else { this.pasoActual = 1; }
    if (this.pasoActual !== 4) this.detenerCuentaRegresiva();
    else this.iniciarCuentaRegresiva();
    if (this.pasoActual === 2 && this.categorias.length === 0) this.cargarTramites();
    if (this.pasoActual === 4) { this.generarCalendario(); this.renderCaptchaAgendar(); }
    this.cdr.detectChanges();
  }


  abrirAlerta(titulo: string, mensaje: string, icono: string = 'info') { this.alertService.mostrarAlerta(titulo, mensaje, icono); }
  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void) { this.alertService.mostrarConfirmacion(titulo, mensaje, accion); }

  cargarReglasCalendario() { this.api.getReglasCalendario().subscribe({ next: (res: any) => { this.diasInhabilesAdmin = res.diasInhabiles || []; this.diasBloqueados = this.diasInhabilesAdmin.map((d: any) => d.fecha.split('T')[0]); this.generarCalendario(); this.cdr.detectChanges(); } }); }
  soloNumeros(event: any) { const charCode = (event.which) ? event.which : event.keyCode; if (charCode < 48 || charCode > 57) { event.preventDefault(); } }
  normalizarTelefonoLocal() { this.ciudadano.telefono = (this.ciudadano.telefono || '').replace(/\D/g, '').slice(0, 15 - this.ladaSeleccionada.length); }
  obtenerTelefonoCompleto() { return `${this.ladaSeleccionada}${(this.ciudadano.telefono || '').replace(/\D/g, '')}`; }
  soloLetras(event: any) { const charCode = (event.which) ? event.which : event.keyCode; if ((charCode >= 65 && charCode <= 90) || (charCode >= 97 && charCode <= 122) || charCode === 32 || charCode === 241 || charCode === 209) { return true; } event.preventDefault(); return false; }
  validarFormatoCURP() { if (this.ciudadano.curp) { this.ciudadano.curp = this.ciudadano.curp.toUpperCase(); } if (!this.ciudadano.curp || this.ciudadano.curp.length === 0) { this.curpValida = true; return; } const regexCURP = /^[A-Z]{4}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d$/; this.curpValida = regexCURP.test(this.ciudadano.curp); }
  
  validarPasoDatos() { this.mostrarMensajesAyuda = true; const tieneCurp = this.ciudadano.curp && this.ciudadano.curp.length === 18 && this.curpValida; const tieneNombre = this.ciudadano.nombre && this.ciudadano.nombre.trim().length > 0; if (!tieneCurp && !tieneNombre) { this.abrirAlerta('Faltan Datos', 'Debe ingresar al menos su CURP o su Nombre Completo para continuar.', 'warning'); return; } if (this.ciudadano.curp && this.ciudadano.curp.length > 0 && !this.curpValida) { this.abrirAlerta('CURP Inválida', 'La CURP ingresada no tiene un formato válido.', 'warning'); return; } const telefono = this.obtenerTelefonoCompleto(); if (!this.ciudadano.telefono || telefono.length < 8 || telefono.length > 15) { this.abrirAlerta('Teléfono Inválido', 'El teléfono es obligatorio y debe incluir una lada y un número válido.', 'warning'); return; } this.irAPaso4(); }

  cargarAvisoGlobal() {
    this.avisoGlobal = {
      titulo: 'Aviso de horario',
      imagenUrl: 'images/aviso-horas.jpeg'
    };
    this.mostrarAvisoGlobal = true;
    this.cdr.detectChanges();
  }
  cerrarAvisoGlobal() { this.mostrarAvisoGlobal = false; this.cdr.detectChanges(); }

  obtenerIconoCategoria(nombre: string): string { const n = nombre.toLowerCase(); if (n.includes('acta')) return 'fa-file-signature'; if (n.includes('curp')) return 'fa-id-card'; if (n.includes('anotaciones')) return 'fa-pen-clip'; if (n.includes('constancia')) return 'fa-file-circle-check'; if (n.includes('enmienda')) return 'fa-file-pen'; return 'fa-file-lines'; }

  limpiarFormulario(preservarAcuse: boolean = false) { this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' }; this.fechaSeleccionada = ''; this.horaSeleccionada = ''; this.horariosDisponibles = []; this.diasMes.forEach(d => d.seleccionado = false); this.categoriaExpandida = null; this.modoReagendar = false; this.folioReagendar = ''; this.procesandoCita = false; this.curpValida = true; this.mostrarMensajesAyuda = false; if (!preservarAcuse) this.citaConsultada = null; }

  cargarSedes() {
    this.api.getSedes().subscribe({
      next: (datos: any) => {
        this.sedes = ordenarSedesParaMostrar(datos);
        this.cdr.detectChanges();
      }
    });
  }
  esSedeOtrosEstados(sede: any): boolean { return (sede?.nombre || '').toLocaleLowerCase().includes('otros estados'); }
  cargarTramites() { this.api.getTramites(this.sedeSeleccionada?.idSede).subscribe({ next: (datos: any) => { this.categorias = datos; this.cdr.detectChanges(); } }); }
  toggleCategoria(idCategoria: number) { this.categoriaExpandida = (this.categoriaExpandida === idCategoria) ? null : idCategoria; this.cdr.detectChanges(); }

  seleccionarSede(sede: any) {
    this.sedeSeleccionada = sede;
    const nombreSede = sede.nombre.toLowerCase();
    this.esOtrosEstados = nombreSede.includes('otros');
    this.ciudadano.estadoRegistro = '';
    this.ciudadano.municipioRegistro = '';

    if (nombreSede.includes('rioverde') || nombreSede.includes('zona sur')) {
      this.municipiosRegistro = ['Alaquines', 'Cárdenas', 'Cerritos', 'Ciudad Fernández', 'Lagunillas', 'Rayón', 'Rioverde', 'San Ciro de Acosta', 'San Nicolás Tolentino', 'Santa Catarina', 'Villa Juárez'].sort();
    } else if (nombreSede.includes('centro') || nombreSede.includes('direcci')) {
      this.municipiosRegistro = ['Ahualulco', 'Armadillo de los Infante', 'Cerro de San Pedro', 'Mexquitic de Carmona', 'San Luis Potosí', 'Santa María del Río', 'Soledad de Graciano Sánchez', 'Tierra Nueva', 'Villa de Arriaga', 'Villa de Reyes', 'Villa de Zaragoza', 'Villa de Pozos (Municipio 59)'].sort();
    } else if (nombreSede.includes('altiplano') || nombreSede.includes('charcas')) {
      this.municipiosRegistro = ['Catorce', 'Cedral', 'Charcas', 'Guadalcázar', 'Matehuala', 'Moctezuma', 'Salinas', 'Santo Domingo', 'Vanegas', 'Venado', 'Villa de Arista', 'Villa de Guadalupe', 'Villa de la Paz', 'Villa de Ramos', 'Villa Hidalgo'].sort();
    } else if (nombreSede.includes('huasteca') || nombreSede.includes('valles') || nombreSede.includes('tamazunchale')) {
      this.municipiosRegistro = ['Aquismón', 'Axtla de Terrazas', 'Ciudad Valles', 'Coxcatlán', 'Ébano', 'El Naranjo', 'Huehuetlán', 'Matlapa', 'San Antonio', 'San Martín Chalchicuautla', 'San Vicente Tancuayalab', 'Tamasopo', 'Tamazunchale', 'Tampacán', 'Tampamolón Corona', 'Tamuín', 'Tancanhuitz', 'Tanlajás', 'Tanquián de Escobedo', 'Xilitla'].sort();
    } else if (this.esOtrosEstados) {
      this.municipiosRegistro = [...this.todosLosMunicipiosSLP];
    } else {
      this.municipiosRegistro = [];
    }
    this.pasoActual = 2;
    this.cargarTramites();
    history.pushState({ paso: 2 }, '', '');
  }
  
  seleccionarTramite(tramite: any) { this.tramiteSeleccionado = tramite; this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
  
 renderCaptchaAgendar() { 
    setTimeout(() => { 
      if (typeof grecaptcha !== 'undefined') { 
        const el = document.getElementById('captcha-agendar'); 
        if (el) { 
          el.innerHTML = ''; 
          this.widgetIdAgendar = grecaptcha.render('captcha-agendar', { 
            'sitekey': environment.recaptchaSiteKey 
          }); 
        } 
      } 
    }, 150); 
  }
  irAPaso4() { this.pasoActual = 4; this.cargarReglasCalendario(); this.iniciarCuentaRegresiva(); history.pushState({ paso: 4 }, '', ''); this.cdr.detectChanges(); this.renderCaptchaAgendar(); }
  cambiarMes(delta: number) { this.mesActual = new Date(this.mesActual.getFullYear(), this.mesActual.getMonth() + delta, 1); this.generarCalendario(); }

  generarCalendario() { const year = this.mesActual.getFullYear(); const month = this.mesActual.getMonth(); const primerDia = new Date(year, month, 1); const ultimoDia = new Date(year, month + 1, 0); this.diasMes = []; for (let i = 0; i < primerDia.getDay(); i++) { this.diasMes.push({ vacio: true }); } const hoy = new Date(); hoy.setHours(0, 0, 0, 0); for (let i = 1; i <= ultimoDia.getDate(); i++) { const fecha = new Date(year, month, i); const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`; const esFinde = fecha.getDay() === 0 || fecha.getDay() === 6; const esInhabil = this.diasBloqueados.includes(fechaStr); const yaPaso = fecha < hoy; let seleccionado = false; if (this.fechaSeleccionada === fechaStr) seleccionado = true; const activo = !esFinde && !yaPaso && !esInhabil; this.diasMes.push({ vacio: false, fecha: fecha, dia: i, activo: activo, seleccionado: seleccionado }); } }

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

  private iniciarCuentaRegresiva() {
    if (this.intervaloReserva) return;
    this.venceReservaHorario = Date.now() + 10 * 60 * 1000;
    this.actualizarCuentaRegresiva();
    this.intervaloReserva = setInterval(() => this.actualizarCuentaRegresiva(), 1000);
  }

  seleccionarHora(hora: string) {
    if (!this.fechaSeleccionada || !this.horariosDisponibles.includes(hora)) return;
    this.horaSeleccionada = hora;
  }

  private actualizarCuentaRegresiva() {
    this.segundosReserva = Math.max(0, Math.ceil((this.venceReservaHorario - Date.now()) / 1000));
    if (this.segundosReserva === 0 && this.pasoActual === 4) {
      this.expirarTiempoCalendario();
    }
    this.cdr.detectChanges();
  }

  private expirarTiempoCalendario() {
    this.detenerCuentaRegresiva();
    this.horaSeleccionada = '';
    this.fechaSeleccionada = '';
    this.diasMes.forEach(d => d.seleccionado = false);
    this.horariosDisponibles = [];
    this.pasoActual = 3;
    history.replaceState({ paso: 3 }, '', '');
    this.abrirAlerta('Tiempo agotado', 'Pasaron 10 minutos en la selección de fecha y hora. Vuelva a elegir el horario para continuar.', 'warning');
  }

  obtenerCuentaRegresiva(): string {
    const minutos = Math.floor(this.segundosReserva / 60);
    const segundos = this.segundosReserva % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }

  private detenerCuentaRegresiva() {
    if (this.intervaloReserva) clearInterval(this.intervaloReserva);
    this.intervaloReserva = null;
    this.venceReservaHorario = 0;
    this.segundosReserva = 0;
  }

  buscarHorariosBackend() { this.cargandoHorarios = true; this.api.getHorarios(this.sedeSeleccionada.idSede, this.tramiteSeleccionado.idTramite, this.fechaSeleccionada).subscribe({ next: (horas) => { this.horariosDisponibles = horas; this.cargandoHorarios = false; this.cdr.detectChanges(); }, error: () => { this.abrirAlerta('Error', 'No se pudieron cargar los horarios.', 'error'); this.cargandoHorarios = false; this.cdr.detectChanges(); } }); }

  getBrowserInfo() { const ua = navigator.userAgent; let browser = "Desconocido"; let os = "Desconocido"; if(ua.includes("Firefox")) browser = "Firefox"; else if(ua.includes("Opera") || ua.includes("OPR")) browser = "Opera"; else if(ua.includes("Trident") || ua.includes("MSIE")) browser = "Internet Explorer"; else if(ua.includes("Edge") || ua.includes("Edg")) browser = "Edge"; else if(ua.includes("Chrome")) browser = "Chrome"; else if(ua.includes("Safari")) browser = "Safari"; if(ua.includes("Win")) os = "Windows"; else if(ua.includes("Mac")) os = "MacOS/iOS"; else if(ua.includes("Linux")) os = "Linux"; else if(ua.includes("Android")) os = "Android"; return { browser, os }; }

  confirmarCita() {
    if (this.procesandoCita) return;

    const token = typeof grecaptcha !== 'undefined'
      ? grecaptcha.getResponse(this.widgetIdAgendar)
      : null;
    if (!token) {
      this.abrirAlerta('Seguridad', 'Por favor, marque la casilla "No soy un robot".', 'warning');
      return;
    }

    this.procesandoCita = true;
    this.citaConsultada = null;

    const solicitud = {
      curp: this.ciudadano.curp,
      nombre: this.ciudadano.nombre,
      correo: this.ciudadano.correo,
      telefono: this.obtenerTelefonoCompleto(),
      municipioRegistro: this.ciudadano.municipioRegistro,
      estadoRegistro: this.ciudadano.estadoRegistro,
      idTramite: this.tramiteSeleccionado.idTramite,
      idSede: this.sedeSeleccionada.idSede,
      fechaHora: `${this.fechaSeleccionada}T${this.horaSeleccionada}:00`,
      navegador: this.getBrowserInfo().browser,
      sistemaOperativo: this.getBrowserInfo().os,
      captchaToken: token
    };

    const peticion = this.modoReagendar
      ? this.api.reagendarCita(this.folioReagendar, { nuevaFechaHora: solicitud.fechaHora })
      : this.api.agendarCita(solicitud);

    peticion.pipe(
      finalize(() => {
        this.procesandoCita = false;
        try {
          if (typeof grecaptcha !== 'undefined' && this.widgetIdAgendar !== null) {
            grecaptcha.reset(this.widgetIdAgendar);
          }
        } catch (error) {
          console.warn('No se pudo reiniciar el CAPTCHA de agenda.', error);
        } finally {
          this.cdr.detectChanges();
        }
      })
    ).subscribe({
      next: (res: any) => {
        if (this.modoReagendar) {
          this.folioExito = this.folioReagendar;
          this.citaConsultada = {
            folio: this.folioExito,
            tramite: this.tramiteSeleccionado?.nombreTramite || 'Trámite',
            costo: this.tramiteSeleccionado?.costo || 0,
            fecha: this.fechaSeleccionada,
            hora: this.horaSeleccionada,
            sede: this.sedeSeleccionada?.nombre || '',
            ciudadano: this.ciudadano.nombre,
            curp: this.ciudadano.curp,
            requisitos: this.tramiteSeleccionado?.requisitos || ''
          };
          this.modoReagendar = false;
          this.folioReagendar = '';
          this.detenerCuentaRegresiva();
          this.pasoActual = 5;
          history.pushState({ paso: 5 }, '', '');
          this.limpiarFormulario(true);
          return;
        }

        this.folioExito = res.folio;
        this.detenerCuentaRegresiva();
        this.citaConsultada = {
          folio: this.folioExito,
          tramite: this.tramiteSeleccionado.nombreTramite,
          costo: this.tramiteSeleccionado.costo,
          fecha: this.fechaSeleccionada,
          hora: this.horaSeleccionada,
          sede: this.sedeSeleccionada.nombre,
          ciudadano: this.ciudadano.nombre,
          curp: this.ciudadano.curp,
          requisitos: this.tramiteSeleccionado.requisitos
        };
        this.pasoActual = 5;
        history.pushState({ paso: 5 }, '', '');
        this.ciudadano = { nombre: '', curp: '', correo: '', telefono: '', municipioRegistro: '', estadoRegistro: '' };
        this.fechaSeleccionada = '';
        this.horaSeleccionada = '';
        this.horariosDisponibles = [];
        this.diasMes.forEach(d => d.seleccionado = false);
        this.modoReagendar = false;
        this.folioReagendar = '';
        this.curpValida = true;
        this.mostrarMensajesAyuda = false;
      },
      error: (err: any) => {
        const mensaje = err?.error?.mensaje || (this.modoReagendar
          ? 'No se pudo reagendar la cita. Inténtelo de nuevo.'
          : 'No se pudo registrar la cita. Inténtelo de nuevo.');
        this.abrirAlerta(this.modoReagendar ? 'Error' : 'Alerta', mensaje, 'warning');
      }
    });
  }
  descargarAcuseOficial() { if (!this.citaConsultada) { this.abrirAlerta('Error', 'No hay datos cargados para generar el PDF.', 'error'); return; } try { const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png'; img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); this.generarContenidoAcuse(doc, 45); }; img.onerror = () => { doc.setFillColor(5, 90, 28); doc.rect(0, 0, 210, 30, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Poder Ejecutivo del Estado de San Luis Potosí", 105, 12, { align: "center" }); doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.text("Dirección del Registro Civil", 105, 20, { align: "center" }); this.generarContenidoAcuse(doc, 35); }; } catch (error) { console.error(error); this.abrirAlerta('Error', 'No se pudo generar el PDF.', 'error'); } }

  generarContenidoAcuse(doc: any, startY: number) { doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.text("Acuse Oficial de Cita Agendada", 105, startY, { align: "center" }); doc.setDrawColor(5, 90, 28); doc.setLineWidth(0.5); doc.rect(15, startY + 10, 180, 50); let identificador = ""; if (this.citaConsultada.ciudadano && this.citaConsultada.ciudadano.trim() !== '') { identificador = this.citaConsultada.ciudadano; } else { identificador = `CURP: ${this.citaConsultada.curp}`; } doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 90, 28); doc.text(`Folio: ${this.citaConsultada.folio}`, 20, startY + 20); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50); doc.text(`Ciudadano/a: ${identificador}`, 20, startY + 30); doc.text(`Trámite: ${this.citaConsultada.tramite}`, 20, startY + 40); doc.text(`Fecha y Hora: ${this.citaConsultada.fecha} a las ${this.citaConsultada.hora} hrs`, 20, startY + 50); doc.setFont("helvetica", "bold"); doc.text(`Costo del Servicio: $${this.citaConsultada.costo}`, 130, startY + 50); doc.setFontSize(12); doc.setTextColor(5, 90, 28); doc.text("Requisitos del Trámite:", 15, startY + 75); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50); const reqFormateados = this.citaConsultada.requisitos ? this.citaConsultada.requisitos.replace(/•/g, '- ') : 'Consulte requisitos en ventanilla.'; const reqText = doc.splitTextToSize(reqFormateados, 180); doc.text(reqText, 15, startY + 85); let nextY = startY + 85 + (reqText.length * 5) + 15; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(230, 0, 100); doc.text("Avisos Importantes y Penalización:", 15, nextY); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); const avisosText = doc.splitTextToSize("- El trámite es estrictamente personal. Es obligatorio presentar Identificación Oficial (ID) vigente.\n- SISTEMA DE PENALIZACIÓN: Si usted agenda su cita y NO asiste, el sistema lo bloqueará automáticamente, impidiéndole agendar un nuevo trámite durante 1 semana.", 180); doc.text(avisosText, 15, nextY + 10); doc.save(`Acuse_Cita_${this.citaConsultada.folio}.pdf`); }

  regresarPaso1() { this.detenerCuentaRegresiva(); this.pasoActual = 1; this.sedeSeleccionada = null; this.categorias = []; this.limpiarFormulario(); history.pushState({ paso: 1 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso2() { this.detenerCuentaRegresiva(); this.pasoActual = 2; this.tramiteSeleccionado = null; history.pushState({ paso: 2 }, '', ''); this.cdr.detectChanges(); }
  regresarPaso3() { this.detenerCuentaRegresiva(); this.pasoActual = 3; history.pushState({ paso: 3 }, '', ''); this.cdr.detectChanges(); }
}
