import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service';
import { environment } from '../../../environments/environment';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credenciales = { username: '', password: '' };
  mostrarPasswordLogin = false;
  cargandoLogin: boolean = false;
  mostrarForzarPassword: boolean = false;
  nuevaPassword = '';
  confirmarPassword = '';
  cargandoCambioPassword = false;
  errorCambioPassword: string | null = null;
  mostrarNuevaPassword = false;
  mostrarConfirmarPassword = false;
  usuarioSesion: any = null;

  private api = inject(ApiService);
  private router = inject(Router);
  private alertService = inject(AlertService); 
  // EL DESCONGELADOR:
  private cdr = inject(ChangeDetectorRef); 

  iniciarSesion() { 
    if (!this.credenciales.username || !this.credenciales.password) { 
      this.alertService.mostrarAlerta('Atención', 'Por favor, ingrese usuario y contraseña.', 'warning'); 
      return; 
    } 
    this.cargandoLogin = true; 
    this.api.login(this.credenciales).subscribe({ 
      next: (res: any) => { 
        this.cargandoLogin = false; 
        this.usuarioSesion = res; 

        if (this.usuarioSesion.requiereCambioPassword) { 
          // El endpoint de cambio exige autenticación. Guardar temporalmente
          // el token recibido en login permite que el interceptor lo envíe
          // mientras el usuario completa el cambio obligatorio.
          sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion));
          this.mostrarForzarPassword = true;
          this.cdr.detectChanges(); 
          return; 
        } 
        this.procesarAccesoCorrecto(); 
      }, 
      error: (err: any) => { 
        this.cargandoLogin = false; 
        // Lanzamos tu alerta original y bonita:
        this.alertService.mostrarAlerta('Acceso Denegado', err.error?.mensaje || 'Credenciales incorrectas.', 'error'); 
        // Apagamos la bolita de carga:
        this.cdr.detectChanges(); 
      } 
    }); 
  }

  guardarNuevaPasswordForzada() { 
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/; 
    if (!passwordRegex.test(this.nuevaPassword)) { 
      this.alertService.mostrarAlerta('Contraseña Débil', 'La contraseña no cumple con los requisitos mínimos de seguridad.', 'warning'); 
      return; 
    } 
    if (this.nuevaPassword !== this.confirmarPassword) { 
      this.alertService.mostrarAlerta('Atención', 'Las contraseñas no coinciden.', 'warning'); 
      return; 
    } 
    this.errorCambioPassword = null;
    this.cargandoCambioPassword = true;
    this.api.cambiarPasswordUsuario(this.usuarioSesion.idUsuario, { password: this.nuevaPassword }).pipe(
      finalize(() => {
        this.cargandoCambioPassword = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: () => {
        this.mostrarForzarPassword = false;
        this.alertService.mostrarAlerta('Éxito', 'Contraseña personal actualizada correctamente.', 'success');
        this.usuarioSesion.requiereCambioPassword = false;
        this.procesarAccesoCorrecto();
      },
      error: (err: any) => {
        this.errorCambioPassword = err.error?.mensaje || 'No se pudo guardar la contraseña. Revise la conexión e inténtelo nuevamente.';
        this.cdr.detectChanges();
      }
    }); 
  }
  
  procesarAccesoCorrecto() { 
    sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); 
    this.router.navigate(['/admin/dashboard']); 
  }
  mostrarModalRecuperacion: boolean = false;
  usernameRecuperacion: string = '';
  enviandoRecuperacion: boolean = false;
  siteKeyRecaptcha: string = environment.recaptchaSiteKey;
  widgetIdRecuperacion: any = null;

  abrirModalRecuperacion() {
    this.usernameRecuperacion = '';
    this.enviandoRecuperacion = false;
    this.mostrarModalRecuperacion = true;
    setTimeout(() => {
      if (typeof grecaptcha !== 'undefined') {
        const el = document.getElementById('captcha-recuperacion');
        if (el) {
          el.innerHTML = '';
          this.widgetIdRecuperacion = grecaptcha.render('captcha-recuperacion', {
            'sitekey': environment.recaptchaSiteKey
          });
        }
      }
    }, 150);
  }

  cerrarModalRecuperacion() {
    this.mostrarModalRecuperacion = false;
    try {
      if (typeof grecaptcha !== 'undefined' && this.widgetIdRecuperacion !== null) {
        grecaptcha.reset(this.widgetIdRecuperacion);
      }
    } catch (error) {
      console.warn('No se pudo reiniciar el CAPTCHA de recuperación.', error);
    } finally {
      this.widgetIdRecuperacion = null;
      this.cdr.detectChanges();
    }
  }

  solicitarRecuperacion() {
    if (this.enviandoRecuperacion) return;

    if (!this.usernameRecuperacion || this.usernameRecuperacion.trim() === '') {
      this.alertService.mostrarAlerta('Atención', 'Ingrese su nombre de usuario.', 'warning');
      return;
    }

    const token = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse(this.widgetIdRecuperacion) : null;
    if (!token) {
      this.alertService.mostrarAlerta('Atención', 'Por favor, marque la casilla de seguridad reCAPTCHA.', 'warning');
      return;
    }

    const peticion = {
      username: this.usernameRecuperacion.trim(),
      tipo: 'RECUPERAR CONTRASEÑA',
      descripcion: 'El empleado ha solicitado restablecer su contraseña desde la pantalla de login.'
    };

    this.enviandoRecuperacion = true;
    this.api.enviarPeticion(peticion, token).pipe(
      finalize(() => {
        this.enviandoRecuperacion = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (res: any) => {
        this.alertService.mostrarAlerta(
          'Solicitud recibida',
          res.mensaje || 'Si la cuenta corresponde a un usuario registrado, la solicitud se enviará para revisión. Si no existe, no se generará un ticket.',
          'success'
        );
        this.cerrarModalRecuperacion();
      },
      error: (err: any) => {
        this.alertService.mostrarAlerta('Error', err.error?.mensaje || 'Hubo un error al enviar la solicitud.', 'error');
        if (typeof grecaptcha !== 'undefined' && this.widgetIdRecuperacion !== null) grecaptcha.reset(this.widgetIdRecuperacion);
      }
    });
  }
}

declare var grecaptcha: any;
