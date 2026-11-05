import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class SeguimientoService {
  private STORAGE_KEY = 'incidencias_seguimiento';

  constructor() {}

  // Obtener la lista de IDs de incidencias guardadas en el teléfono
  async getSeguimientoIds(): Promise<string[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  // Marcar una incidencia 
  async agregarSeguimiento(id: string): Promise<void> {
    const ids = await this.getSeguimientoIds();
    if (!ids.includes(id)) {
      ids.push(id);
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(ids)
      });
    }
  }

  // Desmarcar una incidencia del seguimiento local
  async removerSeguimiento(id: string): Promise<void> {
    let ids = await this.getSeguimientoIds();
    ids = ids.filter(item => item !== id);
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(ids)
    });
  }

  // Verificar si un ID ya está marcado
  async esSeguido(id: string): Promise<boolean> {
    const ids = await this.getSeguimientoIds();
    return ids.includes(id);
  }
}