import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Incidencia } from '../models/incidencia.model';

@Injectable({
  providedIn: 'root'
})
export class IncidenciasService {
  private http = inject(HttpClient);
  
  // Reemplaza esta URL con la URL base de tu recurso en MockAPI
  private apiUrl = 'https://6ae2a35dbbb54129229a288c.mockapi.io/api/v1-buena/incidencias';

  constructor() {}

  // R2 & R3: Obtener incidencias con paginación desde el servidor remoto
  getIncidenciasPaginadas(page: number = 1, limit: number = 5): Observable<Incidencia[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<Incidencia[]>(this.apiUrl, { params });
  }

  // Obtener todas las incidencias (útil para el Dashboard de R10 y filtros globales)
  getAllIncidencias(): Observable<Incidencia[]> {
    return this.http.get<Incidencia[]>(this.apiUrl);
  }

  // Obtener una sola incidencia por su ID (para la pantalla de detalle R9)
  getIncidenciaById(id: string): Observable<Incidencia> {
    return this.http.get<Incidencia>(`${this.apiUrl}/${id}`);
  }

  // R5: Registrar una nueva incidencia en la API remota
  crearIncidencia(incidencia: Incidencia): Observable<Incidencia> {
    return this.http.post<Incidencia>(this.apiUrl, incidencia);
  }

  // R9: Actualizar el estado de una incidencia con observación
  actualizarEstado(id: string, estado: string, observacion?: string): Observable<Incidencia> {
    const body = {
      estado,
      ...(observacion ? { observacion } : {})
    };
    return this.http.put<Incidencia>(`${this.apiUrl}/${id}`, body);
  }
}