import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http = inject(HttpClient);


  private cloudName = 'qhzxq0qs';
  private uploadPreset = 'incidencias_preset';
  private cloudinaryUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

//recibe los datos meidante BASE64 y los devuelve en una URl de la imagen en cloudinary
  subirImagen(base64DataUrl: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', base64DataUrl);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post<any>(this.cloudinaryUrl, formData).pipe(
      map(res => res.secure_url)
    );
  }
}