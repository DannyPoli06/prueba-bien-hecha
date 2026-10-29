import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonBadge, IonButton, IonIcon, IonSpinner, IonRefresher, 
  IonRefresherContent 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { bookmark, bookmarkOutline, eyeOutline, locationOutline, bookmarkSharp } from 'ionicons/icons';
import { IncidenciasService } from '../services/incidencias';
import { SeguimientoService } from '../services/seguimiento';
import { Incidencia } from '../models/incidencia.model';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonBadge, IonButton, IonIcon, IonSpinner, IonRefresher, IonRefresherContent
  ],
})
export class Tab3Page implements OnInit {
  private incidenciasService = inject(IncidenciasService);
  private seguimientoService = inject(SeguimientoService);
  private router = inject(Router);

  incidenciasSeguidas = signal<Incidencia[]>([]);
  cargando = signal<boolean>(true);

  constructor() {
    addIcons({ bookmark, bookmarkOutline, eyeOutline, locationOutline, bookmarkSharp });
  }

  ngOnInit() {
    this.cargarSeguimiento();
  }

  // Al entrar a la pestaña siempre recarga las incidencias guardadas
  ionViewWillEnter() {
    this.cargarSeguimiento();
  }

  // R1: Lee los IDs locales de Preferences y consulta los datos en MockAPI
  async cargarSeguimiento(event?: any) {
    this.cargando.set(true);
    const idsGuardados = await this.seguimientoService.getSeguimientoIds();

    if (idsGuardados.length === 0) {
      this.incidenciasSeguidas.set([]);
      this.cargando.set(false);
      if (event) event.target.complete();
      return;
    }

    // Consultamos todas las incidencias y filtramos únicamente las que están guardadas localmente
    this.incidenciasService.getAllIncidencias().subscribe({
      next: (todas) => {
        const filtradas = todas.filter(item => item.id && idsGuardados.includes(item.id));
        this.incidenciasSeguidas.set(filtradas);
        this.cargando.set(false);
        if (event) event.target.complete();
      },
      error: (err) => {
        console.error('Error al cargar incidencias de seguimiento:', err);
        this.cargando.set(false);
        if (event) event.target.complete();
      }
    });
  }

  // R1: Remover de seguimiento local en vivo
  async desmarcar(id?: string) {
    if (!id) return;
    await this.seguimientoService.removerSeguimiento(id);
    // Filtramos la lista localmente para que desaparezca al instante de la pantalla
    this.incidenciasSeguidas.update(lista => lista.filter(item => item.id !== id));
  }

  verDetalle(id?: string) {
    if (id) {
      this.router.navigate(['/detalle-incidencia', id]);
    }
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
}