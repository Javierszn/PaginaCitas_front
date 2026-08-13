import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';

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

  private api = inject(ApiService);
  private router = inject(Router);

  ngOnInit() {
    // GUARDIA DE SEGURIDAD: Verificamos si hay alguien en sesión
    const sessionUser = sessionStorage.getItem('usuarioRC');
    if (sessionUser) {
      this.usuarioSesion = JSON.parse(sessionUser);
      this.cargarCitasDashboard(1);
    } else {
      // Si es un intruso, lo mandamos al login
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
      }, 
      error: () => {
        this.evitarBucleCitas = false; 
        alert('Error: No se pudieron cargar las citas.');
      } 
    }); 
  }

  aplicarFiltroTramite() { 
    if (this.filtroTramite) { 
      this.citasDia = this.citasDiaOriginales.filter(c => c.tramite === this.filtroTramite); 
    } else { 
      this.citasDia = [...this.citasDiaOriginales]; 
    } 
  }

  limpiarBusqueda() { 
    this.textoBusquedaDashboard = ''; 
    this.filtroTramite = ''; 
    this.cargarCitasDashboard(1); 
  }

  actualizarEstatusCita(folio: string, nuevoEstatus: string) { 
    this.api.actualizarEstatusCita(folio, { nuevoEstatus: nuevoEstatus, idUsuarioInterno: this.usuarioSesion.idUsuario }).subscribe({ 
      next: (res: any) => { 
        alert(res.mensaje); 
        this.cargarCitasDashboard(this.paginaActualCitas); 
      }, 
      error: () => alert('Error al actualizar estatus.') 
    }); 
  }
  
  abrirConfirmacion(titulo: string, msj: string, accion: any) {
     if(confirm(titulo + "\n" + msj)) { accion(); }
  }

  // Enlaces en "Mantenimiento" mientras terminamos de extraer las demás pantallas
  irABitacora() { alert('Módulo de auditoría en refactorización'); } 
  irASuperAdmin() { alert('Módulo Super Admin en refactorización'); } 
  abrirBandeja() { alert('Bandeja en refactorización'); }
  abrirModalPeticion(b: boolean) { alert('Soporte en refactorización'); }
  exportarPDF(t: string, n: string) { alert('Reportes PDF en refactorización'); }
}