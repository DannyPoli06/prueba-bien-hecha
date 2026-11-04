import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http = inject(HttpClient);

  // ⚠️ PON AQUÍ TU CLOUD NAME Y TU UPLOAD PRESET DE CLOUDINARY
  private cloudName = 'qhzxq0qs';
  private uploadPreset = 'incidencias_preset';
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  /**
   * Sube una imagen en formato DataUrl/Base64 a Cloudinary
   * y devuelve únicamente la URL pública HTTPS.
   */
  subirImagen(base64DataUrl: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', base64DataUrl);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post<any>(this.cloudinaryUrl, formData).pipe(
      map(res => res.secure_url)
    );
  }
}