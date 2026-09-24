import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../api.service';
import { AlertService } from '../../alert.service'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  credenciales = { username: '', password: '' };
  cargandoLogin: boolean = false;
  mostrarForzarPassword: boolean = false;
  nuevaPassword = '';
  confirmarPassword = '';
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
    this.api.cambiarPasswordUsuario(this.usuarioSesion.idUsuario, { password: this.nuevaPassword }).subscribe({ 
      next: (res: any) => { 
        this.mostrarForzarPassword = false; 
        this.alertService.mostrarAlerta('Éxito', 'Contraseña actualizada correctamente.', 'success'); 
        this.usuarioSesion.requiereCambioPassword = false; 
        this.procesarAccesoCorrecto(); 
      }, 
      error: () => {
        this.alertService.mostrarAlerta('Error', 'No se pudo actualizar la contraseña.', 'error');
        this.cdr.detectChanges();
      }
    }); 
  }
  
  procesarAccesoCorrecto() { 
    sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); 
    this.router.navigate(['/admin/dashboard']); 
  }
 solicitarRecuperacion() {
    // 1. Usamos la ventana nativa del navegador para pedir el usuario
    const usernameIngresado = prompt('Ingrese su nombre de usuario para solicitar la recuperación al Super Administrador:');

    // 2. Si el usuario cancela o deja vacío, detenemos el proceso
    if (!usernameIngresado || usernameIngresado.trim() === '') {
      return;
    }

    // 3. Armamos el ticket de soporte
    const peticion = {
      usernameSolicitante: usernameIngresado.trim(),
      tipoPeticion: 'RECUPERAR CONTRASEÑA',
      descripcion: 'El empleado ha solicitado restablecer su contraseña desde la pantalla de login.'
    };
    
    // 4. Enviamos la petición y NOS SUSCRIBIMOS para que realmente se ejecute
    this.api.crearPeticionSoporte(peticion).subscribe({
      next: () => {
        this.alertService.mostrarAlerta('¡Ticket Enviado!', 'Su solicitud fue enviada al Super Admin. Espere a que sea procesada.', 'success');
      },
      error: (err: any) => {
        this.alertService.mostrarAlerta('Error', err.error?.mensaje || 'Hubo un error al enviar la solicitud.', 'error');
      }
    });
  }
}