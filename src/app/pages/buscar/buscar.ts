import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service';
import jsPDF from 'jspdf';

declare var grecaptcha: any;

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './buscar.html',
  styleUrls: ['./buscar.css']
})
export class BuscarComponent implements OnInit {
  widgetIdBuscar: any;
  folioBusqueda: string = '';
  citaConsultada: any = null;
  cargandoConsulta: boolean = false;

  private api = inject(ApiService);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.renderCaptchaBuscar();
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

  buscarCitaPorFolio() {
    const token = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse(this.widgetIdBuscar) : null;
    if (!token) { this.alertService.mostrarAlerta('Seguridad', 'Por favor, complete el reCAPTCHA.', 'warning'); return; }
    if (!this.folioBusqueda || this.folioBusqueda.length < 8) return;

    this.cargandoConsulta = true;
    this.api.buscarCita(this.folioBusqueda.toUpperCase(), token).subscribe({
      next: (res: any) => { 
        this.citaConsultada = res; 
        this.cargandoConsulta = false; 
        this.cdr.detectChanges(); 
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdBuscar); 
      },
      error: (err: any) => { 
        this.alertService.mostrarAlerta('Folio no encontrado', err.error.mensaje || "Verifique el folio e intente de nuevo.", 'warning'); 
        this.cargandoConsulta = false; 
        this.cdr.detectChanges(); 
        if (typeof grecaptcha !== 'undefined') grecaptcha.reset(this.widgetIdBuscar); 
      }
    });
  }

  cancelarCita() { 
    this.alertService.mostrarConfirmacion('¿Cancelar Cita?', 'Si cancela perderá este horario y liberará el espacio.', () => { 
      this.api.cancelarCita(this.citaConsultada.folio).subscribe({ 
        next: (res: any) => { 
          this.alertService.mostrarAlerta('Cita Cancelada', res.mensaje, 'success'); 
          this.citaConsultada.estatus = 'CANCELADA'; 
          this.cdr.detectChanges(); 
        }, 
        error: (err: any) => { 
          this.alertService.mostrarAlerta('Error', err.error?.mensaje || "Error al cancelar", 'error'); 
        } 
      }); 
    }); 
  }

  prepararReagendar() { 
    // TRUCO SENIOR: Mandamos la cita por "paquetería invisible" al Router principal
    this.router.navigate(['/'], { state: { reagendar: this.citaConsultada } });
  }

  descargarAcuseOficial() {
    if (!this.citaConsultada) { this.alertService.mostrarAlerta('Error', 'No hay datos cargados.', 'error'); return; }
    try {
        const doc = new jsPDF(); const img = new Image(); img.src = 'images/Sin_titulo.png'; 
        img.onload = () => { doc.addImage(img, 'PNG', 15, 10, 180, 25); this.generarContenidoAcuse(doc, 45); };
        img.onerror = () => { doc.setFillColor(5, 90, 28); doc.rect(0, 0, 210, 30, 'F'); doc.setTextColor(255, 255, 255); doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.text("Poder Ejecutivo del Estado de San Luis Potosí", 105, 12, { align: "center" }); doc.setFontSize(12); doc.setFont("helvetica", "normal"); doc.text("Dirección del Registro Civil", 105, 20, { align: "center" }); this.generarContenidoAcuse(doc, 35); };
    } catch (error) { console.error(error); this.alertService.mostrarAlerta('Error', 'No se pudo generar el PDF.', 'error'); }
  }

  generarContenidoAcuse(doc: any, startY: number) {
    doc.setFontSize(14); doc.setTextColor(0, 0, 0); doc.text("Acuse Oficial de Cita Agendada", 105, startY, { align: "center" }); doc.setDrawColor(5, 90, 28); doc.setLineWidth(0.5); doc.rect(15, startY + 10, 180, 50);
    let identificador = ""; if (this.citaConsultada.ciudadano && this.citaConsultada.ciudadano.trim() !== '') { identificador = this.citaConsultada.ciudadano; } else { identificador = `CURP: ${this.citaConsultada.curp}`; }
    doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(5, 90, 28); doc.text(`Folio: ${this.citaConsultada.folio}`, 20, startY + 20); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50); doc.text(`Ciudadano/a: ${identificador}`, 20, startY + 30); doc.text(`Trámite: ${this.citaConsultada.tramite}`, 20, startY + 40); doc.text(`Fecha y Hora: ${this.citaConsultada.fecha} a las ${this.citaConsultada.hora} hrs`, 20, startY + 50); doc.setFont("helvetica", "bold"); doc.text(`Costo del Servicio: $${this.citaConsultada.costo}`, 130, startY + 50); doc.setFontSize(12); doc.setTextColor(5, 90, 28); doc.text("Requisitos del Trámite:", 15, startY + 75); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(50, 50, 50);
    const reqFormateados = this.citaConsultada.requisitos ? this.citaConsultada.requisitos.replace(/•/g, '- ') : 'Consulte requisitos en ventanilla.'; const reqText = doc.splitTextToSize(reqFormateados, 180); doc.text(reqText, 15, startY + 85); let nextY = startY + 85 + (reqText.length * 5) + 15; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.setTextColor(230, 0, 100); doc.text("Avisos Importantes y Penalización:", 15, nextY); doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0); const avisosText = doc.splitTextToSize("- El trámite es estrictamente personal. Es obligatorio presentar Identificación Oficial (ID) vigente.\n- SISTEMA DE PENALIZACIÓN: Si usted agenda su cita y NO asiste, el sistema lo bloqueará automáticamente, impidiéndole agendar un nuevo trámite durante 1 semana.", 180); doc.text(avisosText, 15, nextY + 10);
    doc.save(`Acuse_Cita_${this.citaConsultada.folio}.pdf`);
  }

  // === COMPATIBILIDAD DE BOTONES ===
  regresarPaso1() { this.router.navigate(['/']); }
  
  irABuscarCita() {
    this.citaConsultada = null;
    this.folioBusqueda = '';
    this.renderCaptchaBuscar();
    this.cdr.detectChanges();
  }
}