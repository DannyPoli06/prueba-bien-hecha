import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { DatosClima } from '../models/incidencia.model';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private http = inject(HttpClient);

  // Endpoint oficial de Open-Meteo para pronóstico y tiempo actual
  private apiUrl = 'https://api.open-meteo.com/v1/forecast';

  constructor() {}

  // R4: Consultar el clima externo pasando coordenadas GPS
  getClima(lat: number, lng: number): Observable<DatosClima | null> {
    const params = new HttpParams()
      .set('latitude', lat.toString())
      .set('longitude', lng.toString())
      .set('current', 'temperature_2m,precipitation')
      .set('hourly', 'precipitation')
      .set('forecast_days', '1');

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => {
        const temperatura = res?.current?.temperature_2m ?? 0;
        
        // Obtenemos la precipitación de la última hora registrada en el arreglo por horas
        const precipitaciónHoras = res?.hourly?.precipitation || [];
        const precipitacionUltimaHora = precipitaciónHoras.length > 0 
          ? precipitaciónHoras[precipitaciónHoras.length - 1] 
          : (res?.current?.precipitation ?? 0);

        // Traducimos el valor numérico a una condición descriptiva
        let condicion = 'Despejado / Normal';
        if (precipitacionUltimaHora > 0 && precipitacionUltimaHora <= 5) {
          condicion = 'Lluvia ligera';
        } else if (precipitacionUltimaHora > 5) {
          condicion = 'Lluvia intensa';
        }

        return {
          temperatura,
          precipitacion: precipitacionUltimaHora,
          condicion,
          advertenciaLluvia: precipitacionUltimaHora > 5 // R4: Advertencia si es > 5mm
        };
      }),
      catchError(error => {
        console.error('Error al consultar el servicio de clima:', error);
        // R4: Si el servicio falla, devolvemos null para informar al inspector sin bloquear el flujo
        return of(null);
      })
    );
  }
}