import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, 
  IonButtons, IonIcon, IonSpinner, ToastController, AlertController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  cameraOutline, locationOutline, cloudOutline, 
  trashOutline, sendOutline, alertCircleOutline,
  navigateOutline, checkmarkCircleOutline, refreshOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { Preferences } from '@capacitor/preferences';
import { firstValueFrom } from 'rxjs';

import { IncidenciasService } from '../services/incidencias';
import { WeatherService } from '../services/weather';
import { CloudinaryService } from '../services/cloudinary';
import { DatosClima, Incidencia } from '../models/incidencia.model';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, 
    IonTitle, IonContent, IonButton, IonButtons, IonIcon, IonSpinner
  ],
})
export class Tab4Page implements OnInit {
  private fb = inject(FormBuilder);
  private incidenciasService = inject(IncidenciasService);
  private weatherService = inject(WeatherService);
  private cloudinaryService = inject(CloudinaryService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  private BORRADOR_KEY = 'borrador_incidencia_form';

  formIncidencia!: FormGroup;

  // Signals para controlar estados de la pantalla
  enviando = signal<boolean>(false);
  obteniendoGps = signal<boolean>(false);
  consultandoClima = signal<boolean>(false);
  fotoPrevisualizacion = signal<string | null>(null);
  
  // R4: Inicializado estrictamente en NULL para que la caja empiece vacía
  datosClima = signal<DatosClima | null>(null);

  tiposOp = [
    { value: 'bache', label: 'Bache' },
    { value: 'luminaria', label: 'Luminaria' },
    { value: 'alcantarilla', label: 'Alcantarilla' },
    { value: 'parque', label: 'Parque' },
    { value: 'senalizacion', label: 'Señalización' }
  ];

  prioridadesOp = [
    { value: 'baja', label: 'Baja', color: 'low' },
    { value: 'media', label: 'Media', color: 'medium' },
    { value: 'alta', label: 'Alta', color: 'high' }
  ];

  constructor() {
    addIcons({ 
      cameraOutline, locationOutline, cloudOutline, trashOutline, 
      sendOutline, alertCircleOutline, navigateOutline, 
      checkmarkCircleOutline, refreshOutline 
    });
  }

  ngOnInit() {
    this.inicializarFormulario();
    this.verificarBorradorAlIniciar();
  }

  ionViewWillEnter() {
    // Al entrar a la pestaña, si el código está vacío generar uno
    if (!this.formIncidencia.get('codigo')?.value) {
      this.generarNuevoCodigo();
    }
  }

  generarNuevoCodigo(): string {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const cod = `INC-${randomNum}`;
    this.formIncidencia.patchValue({ codigo: cod }, { emitEvent: false });
    return cod;
  }

  inicializarFormulario() {
    this.formIncidencia = this.fb.group({
      codigo: [''],
      tipo: ['bache', [Validators.required]],
      prioridad: ['media', [Validators.required]],
      sector: ['', [Validators.required]],
      direccion: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      latitud: [null],
      longitud: [null]
    });

    this.generarNuevoCodigo();

    this.formIncidencia.valueChanges.subscribe(val => {
      // Guardar borrador en tiempo real solo si hay información escrita
      if (val.descripcion || val.sector || val.direccion || this.fotoPrevisualizacion()) {
        this.guardarBorrador(val);
      }
    });
  }

  setTipo(val: string) {
    this.formIncidencia.patchValue({ tipo: val });
  }

  setPrioridad(val: string) {
    this.formIncidencia.patchValue({ prioridad: val });
  }

  // R8: Al volver a abrir la pantalla, si hay borrador ofrecer CONTINUAR o DESCARTAR
  async verificarBorradorAlIniciar() {
    const { value } = await Preferences.get({ key: this.BORRADOR_KEY });
    if (value) {
      try {
        const data = JSON.parse(value);
        if (data.descripcion || data.sector || data.direccion || data.foto) {
          const alert = await this.alertCtrl.create({
            header: 'Borrador Encontrado',
            subHeader: 'Se encontró un borrador sin guardar',
            message: '¿Deseas continuar completando el registro previo o prefieres descartarlo?',
            backdropDismiss: false,
            buttons: [
              {
                text: 'Descartar',
                role: 'destructive',
                handler: () => {
                  this.borrarBorrador(false);
                }
              },
              {
                text: 'Continuar',
                handler: () => {
                  this.cargarDatosBorrador(data);
                }
              }
            ]
          });
          await alert.present();
        }
      } catch (e) {
        console.error('Error parseando borrador:', e);
      }
    }
  }

  cargarDatosBorrador(data: any) {
    this.formIncidencia.patchValue({
      codigo: data.codigo || this.generarNuevoCodigo(),
      tipo: data.tipo || 'bache',
      prioridad: data.prioridad || 'media',
      sector: data.sector || '',
      direccion: data.direccion || '',
      descripcion: data.descripcion || '',
      latitud: data.latitud ?? null,
      longitud: data.longitud ?? null
    }, { emitEvent: false });

    if (data.foto) {
      this.fotoPrevisualizacion.set(data.foto);
    }
    this.mostrarToast('Borrador recuperado con éxito', 'success');
  }

  async guardarBorrador(valores: any) {
    const borradorData = {
      ...valores,
      foto: this.fotoPrevisualizacion()
    };
    await Preferences.set({
      key: this.BORRADOR_KEY,
      value: JSON.stringify(borradorData)
    });
  }

  async borrarBorrador(confirmar: boolean = true) {
    if (confirmar) {
      const alert = await this.alertCtrl.create({
        header: 'Descartar Borrador',
        message: '¿Estás seguro de que deseas limpiar todos los campos?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { 
            text: 'Limpiar', 
            role: 'destructive',
            handler: async () => {
              await this.ejecutarLimpieza();
            }
          }
        ]
      });
      await alert.present();
    } else {
      await this.ejecutarLimpieza();
    }
  }

  private async ejecutarLimpieza() {
    await Preferences.remove({ key: this.BORRADOR_KEY });
    this.formIncidencia.reset({ 
      codigo: '',
      tipo: 'bache', 
      prioridad: 'media', 
      sector: '',
      direccion: '',
      descripcion: '',
      latitud: null, 
      longitud: null 
    });
    this.generarNuevoCodigo();
    this.fotoPrevisualizacion.set(null);
    this.datosClima.set(null);
    this.mostrarToast('Formulario limpiado', 'medium');
  }

  // R5, R6: Capturar fotografía nativa con manejo de permisos
  
  // Comprime imagen DataURL a max 480px y jpeg 0.6 para optimización previa
  private comprimirImagen(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 480;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async tomarFotografia() {
    try {
      const image = await Camera.getPhoto({
        quality: 50,
        width: 600,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      if (image && image.dataUrl) {
        const fotoOptimizada = await this.comprimirImagen(image.dataUrl);
        this.fotoPrevisualizacion.set(fotoOptimizada);
        this.guardarBorrador(this.formIncidencia.value);
        this.mostrarToast('Fotografía capturada y optimizada para el servidor', 'success');
      }
    } catch (e: any) {
      const errStr = (e?.message || e?.toString() || '').toLowerCase();
      // Si el usuario canceló la captura voluntariamente, los datos permanecen intactos 
      if (errStr.includes('cancel') || errStr.includes('user cancelled')) {
        console.log('Captura fotográfica cancelada por el usuario (datos intactos)');
      } else {
        // Si el permiso fue denegado
        const alert = await this.alertCtrl.create({
          header: 'Permiso de Cámara Denegado',
          message: 'Se denegó el acceso a la cámara. Si la incidencia tiene Prioridad Alta, la fotografía es un requisito obligatorio para poder guardarla.',
          buttons: ['Entendido']
        });
        await alert.present();
      }
    }
  }

  // R7: Capturar GPS con solicitud de permisos y soporte manual
  async obtenerUbicacionGps() {
    this.obteniendoGps.set(true);
    try {
      // Solicita permiso si no está concedido y obtiene la posición actual
      const pos = await Geolocation.getCurrentPosition({ 
        timeout: 10000,
        enableHighAccuracy: true 
      });
      const lat = parseFloat(pos.coords.latitude.toFixed(6));
      const lng = parseFloat(pos.coords.longitude.toFixed(6));
      this.formIncidencia.patchValue({ latitud: lat, longitud: lng });
      this.obteniendoGps.set(false);
      this.mostrarToast('Coordenadas GPS obtenidas con éxito', 'success');
      
      // Consultar clima automáticamente con las coordenadas obtenidas 
      this.consultarClima(lat, lng);
    } catch (error: any) {
      this.obteniendoGps.set(false);
      const alert = await this.alertCtrl.create({
        header: 'Acceso GPS No Disponible',
        message: 'No fue posible acceder al GPS del dispositivo o el permiso fue denegado. Puede ingresar manualmente las coordenadas válidas en los campos de Latitud y Longitud.',
        buttons: [
          {
            text: 'Usar Coordenadas de Quito',
            handler: () => {
              this.formIncidencia.patchValue({ latitud: -0.180653, longitud: -78.467838 });
              this.consultarClima(-0.180653, -78.467838);
            }
          },
          {
            text: 'Ingresar Manualmente',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    }
  }

  // R4: Consulta meteorológica
  refrescarClimaManual() {
    const lat = this.formIncidencia.get('latitud')?.value;
    const lng = this.formIncidencia.get('longitud')?.value;

    if (lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      this.mostrarToast('Ingresa o captura coordenadas válidas primero para consultar el clima', 'warning');
      return;
    }

    this.consultarClima(Number(lat), Number(lng));
  }

  consultarClima(lat: number, lng: number): Promise<DatosClima | null> {
    this.consultandoClima.set(true);
    return new Promise((resolve) => {
      this.weatherService.getClima(lat, lng).subscribe({
        next: (res) => {
          this.consultandoClima.set(false);
          if (res) {
            this.datosClima.set(res);
            if (res.advertenciaLluvia) {
              this.mostrarToast(`¡Advertencia meteorológica! Lluvia de ${res.precipitacion} mm en la última hora`, 'warning');
            } else {
              this.mostrarToast('Condiciones climáticas actualizadas', 'success');
            }
            resolve(res);
          } else {
            this.mostrarToast('Servicio meteorológico no disponible, pero puede continuar', 'medium');
            resolve(null);
          }
        },
        error: () => {
          this.consultandoClima.set(false);
          this.mostrarToast('Error al conectar con el clima, pero se permite continuar', 'medium');
          resolve(null);
        }
      });
    });
  }

  // Método auxiliar para subir la imagen a Cloudinary
  private async subirFotoCloudinary(base64DataUrl: string): Promise<string> {
    try {
      const urlPublica = await firstValueFrom(
        this.cloudinaryService.subirImagen(base64DataUrl)
      );
      return urlPublica;
    } catch (error) {
      console.error('Error al subir imagen a Cloudinary:', error);
      throw error;
    }
  }

  // Guardar en MockAPI cumpliendo R4, R5, R6 y R7 + Cloudinary
  async guardarIncidencia() {
    const tipo = this.formIncidencia.get('tipo')?.value;
    const prioridad = this.formIncidencia.get('prioridad')?.value;
    const sector = this.formIncidencia.get('sector')?.value?.trim();
    const direccion = this.formIncidencia.get('direccion')?.value?.trim();
    const descripcion = this.formIncidencia.get('descripcion')?.value?.trim();
    const lat = this.formIncidencia.get('latitud')?.value;
    const lng = this.formIncidencia.get('longitud')?.value;

    // Validación R7: Para tipo bache, la ubicación es obligatoria (GPS o manual válidas)
    if (tipo === 'bache') {
      const tieneLat = lat !== null && lat !== '' && !isNaN(Number(lat));
      const tieneLng = lng !== null && lng !== '' && !isNaN(Number(lng));
      if (!tieneLat || !tieneLng) {
        const alert = await this.alertCtrl.create({
          header: 'Ubicación Obligatoria',
          message: 'Para incidencias de tipo Bache, la ubicación es obligatoria. Por favor capture el GPS o ingrese manualmente coordenadas válidas de Latitud y Longitud.',
          buttons: ['Aceptar']
        });
        await alert.present();
        return;
      }
    }

    // Validación R5 & R6: Para prioridad alta, se exige fotografía obligatoria
    if (prioridad === 'alta' && !this.fotoPrevisualizacion()) {
      const alert = await this.alertCtrl.create({
        header: 'Fotografía Obligatoria',
        message: 'Para incidencias de Prioridad Alta se exige evidencia fotográfica. Por favor tome una fotografía antes de guardar el reporte.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    // Validación de campos generales
    if (!sector || !direccion || !descripcion) {
      this.mostrarToast('Por favor completa todos los campos requeridos (*)', 'warning');
      return;
    }

    // Validación R4: Si hay coordenadas y aún no se ha consultado el clima, consultarlo antes de guardar
    if ((lat !== null && lng !== null) && !this.datosClima()) {
      this.mostrarToast('Consultando condiciones climáticas antes de guardar...', 'medium');
      await this.consultarClima(Number(lat), Number(lng));
    }

    this.enviando.set(true);

    // Evidencia fotográfica por defecto
    let fotoFinal = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7';

    // Subir a Cloudinary si se tomó foto
    if (this.fotoPrevisualizacion()) {
      try {
        this.mostrarToast('Subiendo fotografía a Cloudinary...', 'medium');
        fotoFinal = await this.subirFotoCloudinary(this.fotoPrevisualizacion()!);
      } catch (err) {
        this.enviando.set(false);
        this.mostrarToast('Error al subir la fotografía a Cloudinary. Intenta nuevamente.', 'danger');
        return;
      }
    }

    // Generar código único asegurado
    const codReporte = this.formIncidencia.value.codigo || `INC-${Math.floor(100 + Math.random() * 900)}`;

    const nuevaIncidencia: Incidencia = {
      codigo: codReporte,
      tipo: tipo,
      descripcion: descripcion,
      direccion: direccion,
      sector: sector,
      prioridad: prioridad,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      fotografia: fotoFinal,
      latitud: lat !== null ? Number(lat) : undefined,
      longitud: lng !== null ? Number(lng) : undefined,
      observacion: ''
    };

    this.incidenciasService.crearIncidencia(nuevaIncidencia).subscribe({
      next: async (creada) => {
        this.enviando.set(false);
        await Preferences.remove({ key: this.BORRADOR_KEY });
        this.mostrarToast(`¡Incidencia ${creada.codigo} registrada con éxito!`, 'success');
        
        // Limpiamos el formulario para futuros registros
        this.ejecutarLimpieza();
        
        // Redirigir al listado tab2
        this.router.navigate(['/tabs/tab2']);
      },
      error: (err) => {
        console.error('Error al guardar en MockAPI:', err);
        this.enviando.set(false);
        this.mostrarToast('Error al enviar el registro a MockAPI. Intenta de nuevo.', 'danger');
      }
    });
  }

  async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 3000,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}