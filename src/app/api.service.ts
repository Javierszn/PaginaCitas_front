import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // === AUTH ===
  login(credenciales: any) { return this.http.post(`${this.apiUrl}/Auth/login`, credenciales); }
  logout(idAcceso: number) { return this.http.post(`${this.apiUrl}/Auth/logout/${idAcceso}`, {}); }

  // === CONFIGURACIÓN Y CATÁLOGOS ===
  getReglasCalendario() { return this.http.get(`${this.apiUrl}/Configuracion/ReglasCalendario`); }
  agregarDiaInhabil(dia: any) { return this.http.post(`${this.apiUrl}/Configuracion/DiasInhabiles`, dia); }
  eliminarDiaInhabil(id: number) { return this.http.delete(`${this.apiUrl}/Configuracion/DiasInhabiles/${id}`); }
  getAvisoActivo() { return this.http.get(`${this.apiUrl}/Avisos/Activo`); }
  getSedes() { return this.http.get(`${this.apiUrl}/Sedes`); }
  getTramites() { return this.http.get(`${this.apiUrl}/Tramites`); }
  getTramitesAdmin() { return this.http.get(`${this.apiUrl}/Tramites/Admin`); }
  actualizarCategoria(id: number, payload: any) { return this.http.put(`${this.apiUrl}/Tramites/Categoria/${id}`, payload); }

  // === CITAS CIUDADANO ===
  getHorarios(idSede: number, idTramite: number, fecha: string) { return this.http.get<string[]>(`${this.apiUrl}/Citas/Horarios?idSede=${idSede}&idTramite=${idTramite}&fecha=${fecha}`); }
  agendarCita(solicitud: any) { return this.http.post(`${this.apiUrl}/Citas`, solicitud); }
  buscarCita(folio: string, token: string) { return this.http.get(`${this.apiUrl}/Citas/${folio}?captchaToken=${token}`); }
  cancelarCita(folio: string) { return this.http.put(`${this.apiUrl}/Citas/${folio}/cancelar`, {}); }
  reagendarCita(folio: string, payload: any) { return this.http.put(`${this.apiUrl}/Citas/${folio}/reagendar`, payload); }

  // === GESTIÓN DE CITAS (EMPLEADOS) ===
  getCitasPorSede(idSede: number, urlParams: string) { return this.http.get(`${this.apiUrl}/Citas/PorSede/${idSede}${urlParams}`); }
  actualizarEstatusCita(folio: string, payload: any) { return this.http.put(`${this.apiUrl}/Citas/${folio}/actualizarEstatus`, payload); }

  // === BITÁCORA ===
  getBitacora(urlParams: string) { return this.http.get(`${this.apiUrl}/Bitacora${urlParams}`); }
  deshacerBitacora(id: number) { return this.http.post(`${this.apiUrl}/Bitacora/Deshacer/${id}`, {}); }

  // === USUARIOS Y ACCESOS ===
  getUsuarios() { return this.http.get(`${this.apiUrl}/Usuarios`); }
  getUsuariosSoporte() { return this.http.get(`${this.apiUrl}/Usuarios/Soporte`); }
  crearUsuario(usuario: any) { return this.http.post(`${this.apiUrl}/Usuarios`, usuario); }
  toggleEstadoUsuario(id: number) { return this.http.put(`${this.apiUrl}/Usuarios/${id}/estado`, {}); }
  cambiarPasswordUsuario(id: number, payload: any) { return this.http.put(`${this.apiUrl}/Usuarios/${id}/password`, payload); }
  cambiarSedeUsuario(id: number, payload: any) { return this.http.put(`${this.apiUrl}/Usuarios/${id}/sede`, payload); }
  getAccesos(urlParams: string) { return this.http.get(`${this.apiUrl}/Usuarios/Accesos${urlParams}`); }
  cerrarSesionRemota(id: number) { return this.http.put(`${this.apiUrl}/Usuarios/Accesos/${id}/cerrar`, {}); }

  // === PETICIONES ===
  getMisPeticiones(username: string) { return this.http.get(`${this.apiUrl}/Peticiones/MisPeticiones/${username}`); }
  getPeticionesAdmin() { return this.http.get(`${this.apiUrl}/Peticiones`); }
  marcarLeidasUsuario(username: string) { return this.http.put(`${this.apiUrl}/Peticiones/MarcarLeidasUsuario/${username}`, {}); }
  marcarLeidasAdmin() { return this.http.put(`${this.apiUrl}/Peticiones/MarcarLeidasAdmin`, {}); }
  enviarPeticion(payload: any) { return this.http.post(`${this.apiUrl}/Peticiones`, payload); }
  resolverPeticion(id: number, payload: any) { return this.http.put(`${this.apiUrl}/Peticiones/${id}/resolver`, payload); }
}