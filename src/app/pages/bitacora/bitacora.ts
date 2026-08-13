import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
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
  bitacoraLogs: any[] = [];
  cargandoBitacora: boolean = false;
  fechaBitacora: string = ''; 
  textoBusquedaBitacora: string = '';
  paginaActualBitacora: number = 1;
  totalPaginasBitacora: number = 1;

  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      this.cargarBitacora(1);
    } else {
      this.router.navigate(['/login']);
    }
  }

  cargarBitacora(paginaSolicitada: number = 1) { 
    this.cargandoBitacora = true; 
    let queryParams = `?pagina=${paginaSolicitada}&registrosPorPagina=50`; 
    const args = []; 
    if (this.textoBusquedaBitacora && this.textoBusquedaBitacora.trim().length > 0) { 
      args.push(`busqueda=${encodeURIComponent(this.textoBusquedaBitacora)}`); 
    } else if (this.fechaBitacora) { 
      args.push(`fecha=${this.fechaBitacora}`); 
    } 
    if (args.length > 0) { queryParams += '&' + args.join('&'); } 
    
    this.api.getBitacora(queryParams).subscribe({ 
      next: (res: any) => { 
        this.bitacoraLogs = res.datos || []; 
        this.paginaActualBitacora = res.paginaActual || 1;
        this.totalPaginasBitacora = res.totalPaginas || 1;
        this.cargandoBitacora = false; 
        this.cdr.detectChanges(); 
      }, 
      error: () => { 
        alert('Error: No se pudo cargar la bitácora.'); 
        this.cargandoBitacora = false; 
        this.cdr.detectChanges(); 
      } 
    }); 
  }

  limpiarBusquedaBitacora() { 
    this.textoBusquedaBitacora = ''; 
    this.cargarBitacora(1); 
  }

  deshacerAccion(idBitacora: number) {
    if (confirm('¿Está seguro de que desea revertir este cambio?')) {
      this.api.deshacerBitacora(idBitacora).subscribe({
        next: (res: any) => { 
          alert(res.mensaje); 
          this.cargarBitacora(this.paginaActualBitacora); 
        },
        error: (err: any) => { 
          alert(err.error?.mensaje || 'Error al deshacer la acción.'); 
        }
      });
    }
  }

  regresarADashboard() { 
    this.router.navigate(['/admin/dashboard']); 
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
    if (this.fechaBitacora) filtroExtra = `Filtrado por fecha: ${this.fechaBitacora}`;
    doc.setFont("helvetica", "bold"); doc.text(`Filtros aplicados: ${filtroExtra}`, 14, y); y += 8;
    autoTable(doc, { html: `#${idTabla}`, startY: y, theme: 'grid', headStyles: { fillColor: [5, 90, 28], textColor: 255 }, alternateRowStyles: { fillColor: [255, 255, 255] }, styles: { fontSize: 7, cellPadding: 1, textColor: [0, 0, 0], lineColor: [200, 200, 200] } });
    doc.save(`${tituloReporte.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  }
}