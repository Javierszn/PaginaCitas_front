import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private alertSubject = new Subject<any>();
  alert$ = this.alertSubject.asObservable();

  mostrarAlerta(titulo: string, mensaje: string, icono: string = 'info') {
    this.alertSubject.next({ tipo: 'alerta', titulo, mensaje, icono });
  }

  mostrarConfirmacion(titulo: string, mensaje: string, accion: () => void) {
    this.alertSubject.next({ tipo: 'confirmacion', titulo, mensaje, icono: 'warning', accion });
  }

  mostrarInput(titulo: string, mensaje: string, accion: (valor: string) => void) {
    this.alertSubject.next({ tipo: 'input', titulo, mensaje, icono: 'info', accion });
  }
}