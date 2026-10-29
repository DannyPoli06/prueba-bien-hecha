export type EstadoIncidencia = 'pendiente' | 'en proceso' | 'resuelta';
export type PrioridadIncidencia = 'baja' | 'media' | 'alta';
export type TipoIncidencia = 'bache' | 'luminaria' | 'senalizacion' | 'alcantarilla' | 'parque' | 'otro';

export interface Incidencia {
  id?: string;
  codigo: string;
  tipo: TipoIncidencia;
  descripcion: string;
  direccion: string;
  sector: string;
  fecha: string;
  estado: EstadoIncidencia;
  prioridad: PrioridadIncidencia;
  fotografia?: string;
  latitud?: number;
  longitud?: number;
  observacion?: string;
}

export interface DatosClima {
  temperatura: number;
  precipitacion: number;
  condicion: string;
  advertenciaLluvia: boolean;
}