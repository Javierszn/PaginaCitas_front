import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service'; // NUEVO MENSAJERO
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  usuarioSesion: any = null;
  citasDiaOriginales: any[] = []; 
  citasDia: any[] = []; 
  tramitesUnicos: string[] = []; 
  filtroTramite: string = '';
  fechaDashboard: string = new Date().toISOString().split('T')[0];
  textoBusquedaDashboard: string = '';
  paginaActualCitas: number = 1;
  totalPaginasCitas: number = 1;
  evitarBucleCitas: boolean = false;
  
  notificacionesNuevas: number = 0; 
  mostrarBandeja: boolean = false;
  mostrarModalPeticion: boolean = false;
  misPeticiones: any[] = [];
  nuevaPeticion = { username: '', tipo: 'SOPORTE TÉCNICO', descripcion: '' };
  
  peticionDesdeLogin: boolean = false;
  usuariosSoporte: any[] = [];

  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef); 
  private alertService = inject(AlertService); // INYECCIÓN

  ngOnInit() {
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      this.cargarCitasDashboard(1);

      if (this.usuarioSesion.rol === 'Super Administrador') {
        this.api.getPeticionesAdmin().subscribe({ 
          next: (res: any) => { 
            // ARREGLO DEL BUG: Eliminamos clones (datos repetidos) de la base de datos
            const unicas = res.filter((v:any, i:number, a:any) => a.findIndex((t:any) => t.idPeticion === v.idPeticion) === i);
            this.notificacionesNuevas = unicas.filter((p: any) => p.estatus === 'PENDIENTE' && !p.leido).length; 
            this.cdr.detectChanges(); 
          } 
        });
      } else {
        this.cargarMisPeticiones();
      }
    } else {
      this.router.navigate(['/login']);
    }
  }
  
  cerrarSesion() {
    if(this.usuarioSesion?.idAcceso) { 
      this.api.logout(this.usuarioSesion.idAcceso).subscribe({
        next: () => this.limpiarRastrosDeSesion(), 
        error: () => this.limpiarRastrosDeSesion() 
      }); 
    } else {
      this.limpiarRastrosDeSesion();
    }
  }
  
  limpiarRastrosDeSesion() {
    sessionStorage.removeItem('usuarioRC'); 
    sessionStorage.removeItem('pasoRC'); 
    this.router.navigate(['/login']); 
  }

  cargarCitasDashboard(paginaSolicitada: number = 1) { 
    if (this.evitarBucleCitas) return;
    this.evitarBucleCitas = true;

    let queryParams = `?pagina=${paginaSolicitada}&registrosPorPagina=50`; 
    if (this.textoBusquedaDashboard && this.textoBusquedaDashboard.trim().length > 0) { 
      queryParams += `&busqueda=${encodeURIComponent(this.textoBusquedaDashboard)}`; 
    } else { 
      queryParams += `&fecha=${this.fechaDashboard}`; 
    } 
    
    this.api.getCitasPorSede(this.usuarioSesion.idSede, queryParams).subscribe({ 
      next: (res: any) => { 
        const data = res.datos || []; 
        this.paginaActualCitas = res.paginaActual || 1;
        this.totalPaginasCitas = res.totalPaginas || 1;
        const tramites = [...new Set(data.map((c: any) => c.tramite))] as string[];
        this.citasDiaOriginales = data; 
        this.tramitesUnicos = tramites; 
        this.aplicarFiltroTramite(); 
        this.evitarBucleCitas = false; 
        this.cdr.detectChanges(); 
      }, 
      error: () => {
        this.evitarBucleCitas = false; 
        this.alertService.mostrarAlerta('Error', 'No se pudieron cargar las citas.', 'error');
        this.cdr.detectChanges();
      } 
    }); 
  }

  aplicarFiltroTramite() { 
    if (this.filtroTramite) { this.citasDia = this.citasDiaOriginales.filter(c => c.tramite === this.filtroTramite); } 
    else { this.citasDia = [...this.citasDiaOriginales]; } 
    this.cdr.detectChanges();
  }

  limpiarBusqueda() { this.textoBusquedaDashboard = ''; this.filtroTramite = ''; this.cargarCitasDashboard(1); }

  actualizarEstatusCita(folio: string, nuevoEstatus: string) { 
    this.api.actualizarEstatusCita(folio, { nuevoEstatus: nuevoEstatus, idUsuarioInterno: this.usuarioSesion.idUsuario }).subscribe({ 
      next: (res: any) => { 
        this.alertService.mostrarAlerta('Éxito', res.mensaje, 'success'); 
        this.cargarCitasDashboard(this.paginaActualCitas); 
      }, 
      error: () => this.alertService.mostrarAlerta('Error', 'Error al actualizar estatus.', 'error') 
    }); 
  }
  
  abrirConfirmacion(titulo: string, msj: string, accion: any) { 
    this.alertService.mostrarConfirmacion(titulo, msj, () => { accion(); });
  }

  irABitacora() { this.router.navigate(['/admin/bitacora']); } 
  irASuperAdmin() { this.router.navigate(['/admin/super']); } 

  exportarPDF(idTabla: string, tituloReporte: string) {
    const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png';
    img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); this.generarContenidoReporte(doc, idTabla, tituloReporte, 45); };
    img.onerror = () => { doc.setFontSize(16); doc.setTextColor(5, 90, 28); doc.text('Registro Civil', 14, 15); this.generarContenidoReporte(doc, idTabla, tituloReporte, 25); };
  }

  generarContenidoReporte(doc: any, idTabla: string, tituloReporte: string, startY: number) {
    doc.setFontSize(13); doc.setTextColor(5, 90, 28); doc.setFont("helvetica", "bold"); doc.text(tituloReporte, 14, startY);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(80, 80, 80);
    let y = startY + 6; doc.text(`Generado el: ${new Date().toLocaleString()} por el usuario: ${this.usuarioSesion?.username || 'Sistema'}`, 14, y); y += 5; doc.text(`Sede Operativa: ${this.usuarioSesion?.sede || 'Global'}`, 14, y); y += 5;
    let filtroExtra = 'Mostrando todos los registros';
    if (this.fechaDashboard) filtroExtra = `Filtrado por fecha: ${this.fechaDashboard}`;
    if (this.filtroTramite) filtroExtra = `Filtrado por trámite: ${this.filtroTramite}`;
    doc.setFont("helvetica", "bold"); doc.text(`Filtros aplicados: ${filtroExtra}`, 14, y); y += 8;
    autoTable(doc, { html: `#${idTabla}`, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [200, 200, 200] },
      didParseCell: (data: any) => { if (data.section === 'body' && data.cell.text && data.cell.text.length > 0) { for (let i = 0; i < data.cell.text.length; i++) { data.cell.text[i] = data.cell.text[i].replace(/(\d{2}:\d{2})(\d{2}\/\d{2}\/\d{4})/, '$1\n$2'); } } }
    });
    doc.save(`${tituloReporte.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  }

  cargarMisPeticiones() {
    if (!this.usuarioSesion) return;
    this.api.getMisPeticiones(this.usuarioSesion.username).subscribe({
      next: (res: any) => {
        // ARREGLO DEL BUG: Eliminamos datos duplicados del backend
        const unicas = res.filter((v:any, i:number, a:any) => a.findIndex((t:any) => t.idPeticion === v.idPeticion) === i);
        this.misPeticiones = unicas;
        this.notificacionesNuevas = this.misPeticiones.filter((p: any) => p.estatus === 'RESUELTA' && !p.leido).length;
        this.cdr.detectChanges();
      }
    });
  }

  abrirBandeja() {
    if (this.usuarioSesion?.rol === 'Super Administrador') {
      this.api.marcarLeidasAdmin().subscribe();
      this.router.navigate(['/admin/soporte']);
    } else {
      this.mostrarBandeja = true;
      this.api.marcarLeidasUsuario(this.usuarioSesion.username).subscribe();
      this.notificacionesNuevas = 0;
      this.cdr.detectChanges();
    }
  }

  cerrarBandeja() { this.mostrarBandeja = false; this.cdr.detectChanges(); }

  abrirModalPeticion(desdeLogin: boolean = false) {
    this.nuevaPeticion = { username: this.usuarioSesion?.username, tipo: 'SOPORTE TÉCNICO', descripcion: '' };
    this.mostrarModalPeticion = true;
    this.cdr.detectChanges();
  }

  cerrarModalPeticion() { this.mostrarModalPeticion = false; this.cdr.detectChanges(); }

  enviarPeticion() {
    if (!this.nuevaPeticion.username || !this.nuevaPeticion.descripcion) {
      this.alertService.mostrarAlerta('Atención', 'Llene todos los campos.', 'warning'); return;
    }
    this.api.enviarPeticion(this.nuevaPeticion).subscribe({
      next: (res: any) => {
        this.cerrarModalPeticion();
        this.alertService.mostrarAlerta('¡Enviada!', res.mensaje, 'success');
        this.cargarMisPeticiones();
      },
      error: () => this.alertService.mostrarAlerta('Error', 'No se pudo enviar la solicitud.', 'error')
    });
  }
}