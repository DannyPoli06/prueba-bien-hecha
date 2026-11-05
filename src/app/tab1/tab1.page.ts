import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonGrid, 
  IonRow, IonCol, IonCard, IonCardContent, IonIcon, 
  IonSpinner, IonRefresher, IonRefresherContent,
  IonButtons, IonButton
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  documentTextOutline, warningOutline, timeOutline, 
  constructOutline, checkmarkCircleOutline, alertCircleOutline,
  shieldCheckmarkOutline, flameOutline, logOutOutline
} from 'ionicons/icons';
import { IncidenciasService } from '../services/incidencias';
import { AuthService } from '../services/auth';
import { Incidencia } from '../models/incidencia.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonIcon, 
    IonSpinner, IonRefresher, IonRefresherContent,
    IonButtons, IonButton
  ],
})
export class Tab1Page implements OnInit {
  private incidenciasService = inject(IncidenciasService);
  private authService = inject(AuthService);

  cargando = signal<boolean>(true);
  total = signal<number>(0);

  // Estados de gestión
  totalPendientes = signal<number>(0);
  totalEnProceso = signal<number>(0);
  totalResueltas = signal<number>(0);

  // Niveles de prioridad
  totalAlta = signal<number>(0);
  totalMedia = signal<number>(0);
  totalBaja = signal<number>(0);

  constructor() {
    addIcons({
      documentTextOutline,
      warningOutline,
      timeOutline,
      constructOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      shieldCheckmarkOutline,
      flameOutline,
      logOutOutline
    });
  }

  async cerrarSesion() {
    await this.authService.logout();
  }

  ngOnInit() {
    this.cargarDatos();
  }

  ionViewWillEnter() {
    this.cargarDatos();
  }

  cargarDatos(event?: any) {
    this.cargando.set(true);

    this.incidenciasService.getAllIncidencias().subscribe({
      next: (data: Incidencia[]) => {
        if (data && Array.isArray(data)) {
          this.total.set(data.length);

          let pendientesCount = 0;
          let enProcesoCount = 0;
          let resueltasCount = 0;

          let altaCount = 0;
          let mediaCount = 0;
          let bajaCount = 0;

          data.forEach((item) => {
            const estadoClean = (item.estado || '').toLowerCase().trim();
            const prioridadClean = (item.prioridad || '').toLowerCase().trim();

            // 1. Conteo de Estados
            if (estadoClean.includes('pend')) {
              pendientesCount++;
            } else if (estadoClean.includes('proc')) {
              enProcesoCount++;
            } else if (estadoClean.includes('resu') || estadoClean.includes('complet')) {
              resueltasCount++;
            } else {
              pendientesCount++;
            }

            // 2. Conteo de Prioridades
            if (prioridadClean.includes('alt') || prioridadClean.includes('high')) {
              altaCount++;
            } else if (prioridadClean.includes('med')) {
              mediaCount++;
            } else {
              bajaCount++;
            }
          });

          this.totalPendientes.set(pendientesCount);
          this.totalEnProceso.set(enProcesoCount);
          this.totalResueltas.set(resueltasCount);

          this.totalAlta.set(altaCount);
          this.totalMedia.set(mediaCount);
          this.totalBaja.set(bajaCount);
        }

        this.cargando.set(false);
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error al conectar con MockAPI:', err);
        this.cargando.set(false);
        if (event) event.target.complete();
      }
    });
  }
}
