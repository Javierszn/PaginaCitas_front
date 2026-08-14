import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service'; // <--- EL MENSAJERO OFICIAL
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './bitacora.html',
  styleUrls: ['./bitacora.css']
})
export class BitacoraComponent implements OnInit {
  usuarioSesion: any = null;
  registrosBitacora: any[] = [];
  fechaBitacora: string = '';
  textoBusquedaBitacora: string = '';
  cargandoBitacora: boolean = false;
  
  paginaActual: number = 1;
  totalPaginas: number = 1;
  arregloPaginas: number[] = [];

  private api = inject(ApiService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      if(this.usuarioSesion.rol !== 'Super Administrador' && this.usuarioSesion.rol !== 'Administrador') {
         this.router.navigate(['/admin/dashboard']);
         return;
      }
      this.cargarBitacora(1);
    } else {
      this.router.navigate(['/login']);
    }
  }

  regresarADashboard() { this.router.navigate(['/admin/dashboard']); }

  cargarBitacora(paginaSolicitada: number = 1) {
    this.cargandoBitacora = true;
    
    // El truco para asegurar que el backend atrape la paginación
    let urlParams = `?pagina=${paginaSolicitada}&page=${paginaSolicitada}&registrosPorPagina=10&pageSize=10`;
    if (this.textoBusquedaBitacora && this.textoBusquedaBitacora.trim().length > 0) {
      urlParams += `&busqueda=${encodeURIComponent(this.textoBusquedaBitacora)}`;
    } else if (this.fechaBitacora) {
      urlParams += `&fecha=${this.fechaBitacora}`;
    }

    this.api.getBitacora(urlParams).subscribe({
      next: (res: any) => {
        this.registrosBitacora = res.datos || res.data || res || [];
        this.paginaActual = Number(res.paginaActual || paginaSolicitada);
        this.totalPaginas = Number(res.totalPaginas || res.total || 1);
        this.arregloPaginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
        
        this.cargandoBitacora = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.alertService.mostrarAlerta('Error', 'No se pudo cargar la bitácora.', 'error');
        this.cargandoBitacora = false;
        this.cdr.detectChanges();
      }
    });
  }

  limpiarBusqueda() {
    this.textoBusquedaBitacora = '';
    this.fechaBitacora = '';
    this.cargarBitacora(1);
  }

  // === ALIAS PARA EVITAR ERRORES EN TU HTML ===
  cambiarPagina(pag: number) { this.cargarBitacora(pag); }
  deshacer(id: number) { this.deshacerCambio(id); }

  deshacerCambio(idBitacora: number) {
    this.alertService.mostrarConfirmacion(
      'Deshacer Acción',
      '¿Está seguro de que desea deshacer este cambio y restaurar el valor anterior?',
      () => {
        this.api.deshacerBitacora(idBitacora).subscribe({
          next: (res: any) => {
            this.alertService.mostrarAlerta('Éxito', res.mensaje || 'El cambio ha sido deshecho.', 'success');
            this.cargarBitacora(this.paginaActual);
          },
          error: (err: any) => {
            const msj = err.error?.mensaje || 'No se pudo deshacer el cambio.';
            this.alertService.mostrarAlerta('Error', msj, 'error');
          }
        });
      }
    );
  }

  descargarPDF() {
    let queryParams = `?pagina=1&registrosPorPagina=10000`;
    if (this.fechaBitacora) queryParams += `&fecha=${this.fechaBitacora}`;
    if (this.textoBusquedaBitacora) queryParams += `&busqueda=${this.textoBusquedaBitacora}`;

    this.api.getBitacora(queryParams).subscribe({
        next: (res: any) => {
            const datos = res.datos || [];
            if (datos.length === 0) { this.alertService.mostrarAlerta('Aviso', 'No hay registros para exportar.', 'warning'); return; }
            
            const doc = new jsPDF(); 
            const img = new Image(); 
            img.src = 'images/Sin_titulo.png';
            
            const generarTabla = (documento: any, startY: number) => {
                documento.setFontSize(13); documento.setTextColor(5, 90, 28); documento.setFont("helvetica", "bold"); documento.text("Bitácora de Movimientos", 14, startY); documento.setFontSize(9); documento.setFont("helvetica", "normal"); documento.setTextColor(80, 80, 80); let y = startY + 6; documento.text(`Generado el: ${new Date().toLocaleString()} por el usuario: ${this.usuarioSesion?.username}`, 14, y); y += 5; documento.text(`Sede Operativa: ${this.usuarioSesion?.sede || 'Global'}`, 14, y); y += 8;
                
                const body = datos.map((a: any) => {
                    const f = new Date(a.fechaHora || a.fecha).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
                    return [f, a.empleado || a.usuario, a.accion, a.folioCita || a.idRegistro, a.valorAnterior, a.valorNuevo];
                });
                
                autoTable(documento, { head: [['Fecha / Hora', 'Empleado', 'Acción', 'Folio / ID', 'Valor Anterior', 'Valor Nuevo']], body: body, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 7, cellPadding: 2, textColor: [0, 0, 0] } });
                documento.save(`Bitacora_${new Date().getTime()}.pdf`);
            };
            
            img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); generarTabla(doc, 45); };
            img.onerror = () => { doc.text('Registro Civil', 14, 15); generarTabla(doc, 25); };
        },
        error: () => this.alertService.mostrarAlerta('Error', 'No se pudieron obtener los datos para el PDF.', 'error')
    });
  }
}