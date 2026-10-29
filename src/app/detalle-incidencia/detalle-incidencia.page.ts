import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, 
  IonContent, IonCard, IonCardContent, IonBadge, IonButton, 
  IonIcon, IonSpinner, ToastController, AlertController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  locationOutline, timeOutline, alertCircleOutline, 
  checkmarkCircleOutline, syncOutline, createOutline, 
  mapOutline, arrowBackOutline, chatboxEllipsesOutline 
} from 'ionicons/icons';

import { IncidenciasService } from '../services/incidencias';
import { Incidencia } from '../models/incidencia.model';

@Component({
  selector: 'app-detalle-incidencia',
  templateUrl: './detalle-incidencia.page.html',
  styleUrls: ['./detalle-incidencia.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonBackButton, IonContent, IonCard, IonCardContent, 
    IonBadge, IonButton, IonIcon, IonSpinner
  ],
})
export class DetalleIncidenciaPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private incidenciasService = inject(IncidenciasService);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  incidencia = signal<Incidencia | null>(null);
  cargando = signal<boolean>(true);
  guardandoEstado = signal<boolean>(false);

  constructor() {
    addIcons({ 
      locationOutline, timeOutline, alertCircleOutline, 
      checkmarkCircleOutline, syncOutline, createOutline, 
      mapOutline, arrowBackOutline, chatboxEllipsesOutline 
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarDetalle(id);
    } else {
      this.cargando.set(false);
      this.mostrarToast('No se especificó una incidencia válida', 'danger');
    }
  }

  cargarDetalle(id: string) {
    this.cargando.set(true);
    this.incidenciasService.getIncidenciaById(id).subscribe({
      next: (data: Incidencia) => {
        this.incidencia.set(data);
        this.cargando.set(false);
      },
      error: (err: any) => {
        console.error('Error al obtener detalle:', err);
        this.cargando.set(false);
        this.mostrarToast('Error al cargar los datos desde el servidor', 'danger');
      }
    });
  }

  // Reglas de actualización de estado y validación
  async intentarCambiarEstado(nuevoEstado: 'pendiente' | 'en proceso' | 'resuelta') {
    const actual = this.incidencia();
    if (!actual || !actual.id) return;

    const estadoActual = (actual.estado || 'pendiente').toLowerCase();

    // Regla 1: Mismo estado
    if (estadoActual === nuevoEstado) {
      this.mostrarToast(`La incidencia ya se encuentra en estado: ${nuevoEstado.toUpperCase()}`, 'medium');
      return;
    }

    // Regla 2: Una incidencia resuelta NO puede regresar a pendiente ni en proceso
    if (estadoActual === 'resuelta') {
      const alert = await this.alertCtrl.create({
        header: 'Acción No Permitida',
        message: 'Una incidencia resuelta no puede regresar al estado pendiente ni en proceso conforme a las reglas del sistema.',
        buttons: ['Entendido']
      });
      await alert.present();
      return;
    }

    // Regla 3: Si pasa a resuelta, es OBLIGATORIO ingresar una observación
    if (nuevoEstado === 'resuelta') {
      const alert = await this.alertCtrl.create({
        header: 'Marcar como Resuelta',
        subHeader: 'Observación obligatoria requerida',
        inputs: [
          {
            name: 'observacion',
            type: 'textarea',
            placeholder: 'Detalla los trabajos realizados y observaciones finales...',
            value: actual.observacion || ''
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Guardar y Resolver',
            handler: (data) => {
              const obs = (data.observacion || '').trim();
              if (!obs) {
                this.mostrarToast('Debe ingresar una observación para marcar como Resuelta', 'warning');
                return false; // Evita cerrar el diálogo
              }
              this.ejecutarActualizacion(actual.id!, nuevoEstado, obs);
              return true;
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    // Para cualquier otro cambio permitido (ej. pendiente -> en proceso)
    this.ejecutarActualizacion(actual.id, nuevoEstado, actual.observacion);
  }

  private ejecutarActualizacion(id: string, nuevoEstado: string, observacion?: string) {
    this.guardandoEstado.set(true);

    this.incidenciasService.actualizarEstado(id, nuevoEstado, observacion).subscribe({
      next: (actualizado: Incidencia) => {
        this.incidencia.set(actualizado);
        this.guardandoEstado.set(false);
        this.mostrarToast(`Estado actualizado con éxito a "${nuevoEstado.toUpperCase()}"`, 'success');
      },
      error: (err: any) => {
        console.error('Error al actualizar estado:', err);
        this.guardandoEstado.set(false);
        this.mostrarToast('No se pudo actualizar el estado en MockAPI', 'danger');
      }
    });
  }

  getColorEstado(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('pend')) return 'warning';
    if (e.includes('proc')) return 'primary';
    return 'success';
  }

  getColorPrioridad(prioridad?: string): string {
    const p = (prioridad || '').toLowerCase();
    if (p.includes('alt') || p.includes('high')) return 'priority-high';
    if (p.includes('med')) return 'priority-medium';
    return 'priority-low';
  }

  getClaseBadgePrioridad(prioridad?: string): string {
    const p = (prioridad || '').toLowerCase();
    if (p.includes('alt') || p.includes('high')) return 'badge-p-high';
    if (p.includes('med')) return 'badge-p-medium';
    return 'badge-p-low';
  }

  async mostrarToast(mensaje: string, color: 'success' | 'warning' | 'danger' | 'medium') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color: color
    });
    toast.present();
  }
}