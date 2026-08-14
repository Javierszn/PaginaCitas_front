import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './super-admin.html',
  styleUrls: ['./super-admin.css']
})
export class SuperAdminComponent implements OnInit {
  usuarioSesion: any = null;
  
  sedes: any[] = [];
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
  
  diasInhabilesAdmin: any[] = [];
  nuevoDiaInhabil: any = { fecha: '', motivo: '' };

  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private alertService = inject(AlertService); 

  ngOnInit() {
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      if(this.usuarioSesion.rol !== 'Super Administrador') {
         this.router.navigate(['/admin/dashboard']);
         return;
      }
      
      this.cargarSedes();
      this.cargarUsuariosAdmin(); 
      this.cargarTramitesAdmin(); 
      this.cargarAccesosAdmin(1);
      this.cargarReglasCalendario();
    } else {
      this.router.navigate(['/login']);
    }
  }

  regresarADashboard() { this.router.navigate(['/admin/dashboard']); }

  cargarSedes() { this.api.getSedes().subscribe({ next: (datos: any) => { this.sedes = datos; this.cdr.detectChanges(); } }); }
  
  cargarUsuariosAdmin() { this.api.getUsuarios().subscribe({ next: (res: any) => { this.usuariosSistema = res; this.cdr.detectChanges(); } }); }
  
  // ALIAS PARA QUE FUNCIONE LA PAGINACIÓN SIN IMPORTAR CÓMO SE LLAME EN TU HTML
  cargarAccesos(pag: number) { this.cargarAccesosAdmin(pag); }
  cambiarPaginaAccesos(pag: number) { this.cargarAccesosAdmin(pag); }

  cargarAccesosAdmin(paginaSolicitada: number = 1) { 
    this.cargandoAccesos = true; 
    let urlParams = `?pagina=${paginaSolicitada}&registrosPorPagina=10`; 
    if (this.textoBusquedaAccesos && this.textoBusquedaAccesos.trim().length > 0) { urlParams += `&busqueda=${encodeURIComponent(this.textoBusquedaAccesos)}`; } else if (this.fechaAccesos) { urlParams += `&fecha=${this.fechaAccesos}`; } 
    this.api.getAccesos(urlParams).subscribe({ 
      next: (res: any) => { 
        this.registroAccesos = res.datos || []; 
        this.paginaActualAccesos = res.paginaActual || 1; 
        this.totalPaginasAccesos = res.totalPaginas || 1; 
        this.arregloPaginas = Array.from({ length: this.totalPaginasAccesos }, (_, i) => i + 1); 
        this.cargandoAccesos = false; 
        this.cdr.detectChanges(); 
      }, 
      error: () => { this.alertService.mostrarAlerta('Error', 'No se pudieron cargar accesos.', 'error'); this.cargandoAccesos = false; this.cdr.detectChanges(); } 
    }); 
  }
  
  limpiarBusquedaAccesos() { this.textoBusquedaAccesos = ''; this.cargarAccesosAdmin(1); }
  
  crearUsuario() { 
    // CORRECCIÓN: Forzamos a que el Rol y la Sede se envíen como números (Int) y no como texto
    const payloadSeguro = {
      ...this.nuevoUsuario,
      idRol: Number(this.nuevoUsuario.idRol),
      idSede: Number(this.nuevoUsuario.idSede)
    };

    this.api.crearUsuario(payloadSeguro).subscribe({ 
      next: (res: any) => { 
        this.alertService.mostrarAlerta('Éxito', res.mensaje, 'success'); 
        this.nuevoUsuario = { username: '', password: '', nombreCompleto: '', idRol: 2, idSede: 1 }; 
        this.cargarUsuariosAdmin(); 
      }, 
      error: (err: any) => this.alertService.mostrarAlerta('Error', err.error?.mensaje || 'Error al crear el usuario.', 'error') 
    }); 
  }
  
  toggleEstadoUsuario(id: number) { 
    this.api.toggleEstadoUsuario(id).subscribe({ 
      next: () => this.cargarUsuariosAdmin(), 
      error: () => this.alertService.mostrarAlerta('Error', 'No se pudo cambiar el estado.', 'error') 
    }); 
  }
  
  cambiarPasswordUsuario(id: number) { 
    this.alertService.mostrarInput(
      'Restablecer Contraseña', 
      'Contraseña temporal (Mín. 6 chars, 1 mayúscula, 1 número, 1 especial):', 
      (pwd?: string) => {
        if(!pwd) return;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/; 
        if (!passwordRegex.test(pwd)) { 
          this.alertService.mostrarAlerta('Error', 'La contraseña no cumple con los requisitos de seguridad.', 'warning'); 
          return; 
        } 
        this.api.cambiarPasswordUsuario(id, { password: pwd }).subscribe({ 
          next: (res: any) => this.alertService.mostrarAlerta('Actualizado', res.mensaje, 'success'), 
          error: () => this.alertService.mostrarAlerta('Error', 'No se pudo actualizar la contraseña.', 'error') 
        }); 
      }
    );
  }
  
  cambiarSedeUsuario(usr: any) { 
    const idSedeNueva = Number(usr.idSede); 
    this.api.cambiarSedeUsuario(usr.idUsuario, { idSede: idSedeNueva }).subscribe({ 
      next: (res: any) => { 
        this.alertService.mostrarAlerta('Actualizado', res.mensaje, 'success'); 
        if (this.usuarioSesion && this.usuarioSesion.idUsuario === usr.idUsuario) { 
          this.usuarioSesion.idSede = idSedeNueva; 
          const sedeEncontrada = this.sedes.find(s => s.idSede === idSedeNueva); 
          if (sedeEncontrada) { this.usuarioSesion.sede = sedeEncontrada.nombre; } 
          sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); 
        } 
      }, 
      error: () => { this.cargarUsuariosAdmin(); this.alertService.mostrarAlerta('Error', 'No se pudo actualizar la sede.', 'error'); } 
    }); 
  }

  cargarTramitesAdmin() { this.api.getTramitesAdmin().subscribe({ next: (res: any) => { this.categoriasAdmin = res.map((cat: any) => { const primerServicio = cat.tramites.length > 0 ? cat.tramites[0] : {}; return { idCategoria: cat.idCategoria, nombreCategoria: cat.nombreCategoria, costo: primerServicio.costo || 0, duracionMinutos: primerServicio.duracionMinutos || 30, limiteDiarioSede: primerServicio.limiteDiarioSede || 50, activo: cat.activa, fechaInicio: primerServicio.fechaInicioPermitida ? primerServicio.fechaInicioPermitida.split('T')[0] : '', fechaFin: primerServicio.fechaFinPermitida ? primerServicio.fechaFinPermitida.split('T')[0] : '' }; }); this.cdr.detectChanges(); } }); }
  
  actualizarCategoria(cat: any) { const payload = { duracionMinutos: Number(cat.duracionMinutos), costo: Number(cat.costo), activo: cat.activo, limiteDiario: Number(cat.limiteDiarioSede), fechaInicio: cat.fechaInicio ? cat.fechaInicio : null, fechaFin: cat.fechaFin ? cat.fechaFin : null }; this.api.actualizarCategoria(cat.idCategoria, payload).subscribe({ next: (res: any) => { this.alertService.mostrarAlerta('Guardado', res.mensaje, 'success'); this.cargarTramitesAdmin(); }, error: () => this.alertService.mostrarAlerta('Error', 'No se pudo guardar la configuración.', 'error') }); }

  cargarReglasCalendario() { this.api.getReglasCalendario().subscribe({ next: (res: any) => { this.diasInhabilesAdmin = res.diasInhabiles || []; this.cdr.detectChanges(); } }); }
  
  agregarDiaInhabil() { if (!this.nuevoDiaInhabil.fecha || !this.nuevoDiaInhabil.motivo) { this.alertService.mostrarAlerta('Atención', 'Complete la fecha y el motivo para bloquear el día.', 'warning'); return; } this.api.agregarDiaInhabil(this.nuevoDiaInhabil).subscribe({ next: (res: any) => { this.alertService.mostrarAlerta('Día Bloqueado', res.mensaje, 'success'); this.nuevoDiaInhabil = { fecha: '', motivo: '' }; this.cargarReglasCalendario(); }, error: () => this.alertService.mostrarAlerta('Error', 'No se pudo bloquear el día.', 'error') }); }
  
  eliminarDiaInhabil(id: number) { this.api.eliminarDiaInhabil(id).subscribe({ next: (res: any) => { this.alertService.mostrarAlerta('Éxito', res.mensaje, 'success'); this.cargarReglasCalendario(); }, error: () => this.alertService.mostrarAlerta('Error', 'No se pudo eliminar el día.', 'error') }); }

  // ALIAS PARA CERRAR SESIÓN (Por si tu HTML llama a la función de otra manera)
  cerrarSesion(idAcceso: number) { this.cerrarSesionRemota(idAcceso); }
  forzarCierreSesion(idAcceso: number) { this.cerrarSesionRemota(idAcceso); }

  cerrarSesionRemota(idAcceso: number) { 
    this.alertService.mostrarConfirmacion(
      'Forzar Cierre de Sesión', 
      '¿Está seguro de que desea cerrar la sesión seleccionada?', 
      () => { 
        this.api.cerrarSesionRemota(idAcceso).subscribe({ 
          next: (res: any) => { 
            this.alertService.mostrarAlerta('Éxito', res.mensaje, 'success'); 
            this.cargarAccesosAdmin(this.paginaActualAccesos); 
          }, 
          error: (err: any) => { 
            this.alertService.mostrarAlerta('Error', err.error?.mensaje || 'No se pudo cerrar la sesión.', 'error'); 
          } 
        }); 
      }
    ); 
  }

  descargarPDFAccesos() {
    let queryParams = `?pagina=1&registrosPorPagina=10000`; 
    if (this.fechaAccesos) queryParams += `&fecha=${this.fechaAccesos}`; 
    if (this.textoBusquedaAccesos) queryParams += `&busqueda=${this.textoBusquedaAccesos}`;
    
    this.api.getAccesos(queryParams).subscribe({
        next: (res: any) => {
            const datos = res.datos || []; if (datos.length === 0) { this.alertService.mostrarAlerta('Aviso', 'No hay registros para exportar.', 'warning'); return; }
            const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png';
            const generarTabla = (documento: any, startY: number) => {
                documento.setFontSize(13); documento.setTextColor(5, 90, 28); documento.setFont("helvetica", "bold"); documento.text("Registro Histórico de Accesos", 14, startY); documento.setFontSize(9); documento.setFont("helvetica", "normal"); documento.setTextColor(80, 80, 80); let y = startY + 6; documento.text(`Generado el: ${new Date().toLocaleString()} por el usuario: ${this.usuarioSesion?.username}`, 14, y); y += 5; documento.text(`Sede Operativa: ${this.usuarioSesion?.sede || 'Global'}`, 14, y); y += 5; let filtro = this.fechaAccesos ? `Filtrado por fecha: ${this.fechaAccesos}` : 'Mostrando todos los registros históricos'; documento.setFont("helvetica", "bold"); documento.text(`Filtros aplicados: ${filtro}`, 14, y); y += 8;
                const body = datos.map((a: any) => { const fInicio = new Date(a.fechaLogin).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }); const fFin = a.fechaLogout ? new Date(a.fechaLogout).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : 'EN LÍNEA'; return [a.idAcceso, a.username, fInicio, fFin]; });
                autoTable(documento, { head: [['ID Sesión', 'Usuario', 'Fecha y Hora Inicio', 'Fecha y Hora Cierre']], body: body, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 8, cellPadding: 2, textColor: [0, 0, 0], lineColor: [200, 200, 200] } });
                documento.save(`Reporte_Accesos_${new Date().getTime()}.pdf`);
            };
            img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); generarTabla(doc, 45); }; img.onerror = () => { doc.setFontSize(16); doc.setTextColor(5, 90, 28); doc.text('Registro Civil del Estado de San Luis Potosí', 14, 15); generarTabla(doc, 25); };
        },
        error: () => this.alertService.mostrarAlerta('Error', 'No se pudieron obtener los datos para el PDF.', 'error')
    });
  }
}