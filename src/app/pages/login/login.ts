import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { ApiService } from '../../api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],  
  templateUrl: './login.html',  // <-- Corregido
  styleUrls: ['./login.css']    // <-- Corregido
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

  iniciarSesion() { 
    if (!this.credenciales.username || !this.credenciales.password) { 
      alert('Por favor, ingrese usuario y contraseña.'); 
      return; 
    } 
    this.cargandoLogin = true; 
    this.api.login(this.credenciales).subscribe({ 
      next: (res: any) => { 
        this.cargandoLogin = false; 
        this.usuarioSesion = res; 

        if (this.usuarioSesion.requiereCambioPassword) { 
          this.mostrarForzarPassword = true; 
          return; 
        } 
        this.procesarAccesoCorrecto(); 
      }, 
      error: (err: any) => { 
        this.cargandoLogin = false; 
        alert(err.error?.mensaje || 'Credenciales incorrectas.'); 
      } 
    }); 
  }

  guardarNuevaPasswordForzada() { 
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/; 
    if (!passwordRegex.test(this.nuevaPassword)) { 
      alert('La contraseña no cumple con los requisitos mínimos de seguridad.'); 
      return; 
    } 
    if (this.nuevaPassword !== this.confirmarPassword) { 
      alert('Las contraseñas no coinciden.'); 
      return; 
    } 
    this.api.cambiarPasswordUsuario(this.usuarioSesion.idUsuario, { password: this.nuevaPassword }).subscribe({ 
      next: (res: any) => { 
        this.mostrarForzarPassword = false; 
        alert('Contraseña actualizada con éxito.'); 
        this.usuarioSesion.requiereCambioPassword = false; 
        this.procesarAccesoCorrecto(); 
      }, 
      error: () => alert('Error: No se pudo actualizar la contraseña.') 
    }); 
  }
  
  procesarAccesoCorrecto() { 
    sessionStorage.setItem('usuarioRC', JSON.stringify(this.usuarioSesion)); 
    
    if (this.usuarioSesion?.rol === 'Super Administrador') { 
      this.router.navigate(['/admin/super']);
    } else { 
      this.router.navigate(['/admin/dashboard']); 
    } 
  }
}