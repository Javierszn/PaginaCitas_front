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
}