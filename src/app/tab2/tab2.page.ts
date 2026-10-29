import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
  IonBadge, IonButton, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, 
  IonSpinner, IonRefresher, IonRefresherContent, IonSearchbar, IonButtons 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  bookmarkOutline, bookmark, eyeOutline, locationOutline, 
  optionsOutline, warningOutline, alertCircleOutline, arrowDownCircleOutline, 
  checkmarkCircleOutline, syncOutline, timeOutline 
} from 'ionicons/icons';

import { IncidenciasService } from '../services/incidencias';
import { SeguimientoService } from '../services/seguimiento';
import { Incidencia } from '../models/incidencia.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, IonHeader, IonToolbar, IonTitle, IonContent, 
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, 
    IonBadge, IonButton, IonIcon, IonInfiniteScroll, IonInfiniteScrollContent, 
    IonSpinner, IonRefresher, IonRefresherContent, IonSearchbar, IonButtons
  ],
})
export class Tab2Page implements OnInit {
  private incidenciasService = inject(IncidenciasService);
  private seguimientoService = inject(SeguimientoService);
  private router = inject(Router);

  incidencias = signal<Incidencia[]>([]);
  seguimientoIds = signal<string[]>([]);
  cargando = signal<boolean>(true);
  
  mostrarFiltros = signal<boolean>(false);
  textoBusqueda = signal<string>('');
  prioridadFiltro = signal<string>('');
  estadoFiltro = signal<string>('');

  paginaActual = 1;
  limitePorPagina = 5;
  hayMasDatos = true;

  incidenciasFiltradas = computed(() => {
    let lista = this.incidencias();
    const query = this.textoBusqueda().toLowerCase().trim();
    const prio = this.prioridadFiltro().toLowerCase();
    const est = this.estadoFiltro().toLowerCase();

    if (query) {
      lista = lista.filter(i => 
        (i.sector || '').toLowerCase().includes(query) ||
        (i.direccion || '').toLowerCase().includes(query) ||
        (i.tipo || '').toLowerCase().includes(query) ||
        (i.codigo || '').toLowerCase().includes(query)
      );
    }

    if (prio) {
      lista = lista.filter(i => (i.prioridad || '').toLowerCase().includes(prio));
    }

    if (est) {
      lista = lista.filter(i => (i.estado || '').toLowerCase().includes(est));
    }

    return lista;
  });

  constructor() {
    addIcons({ 
      bookmarkOutline, bookmark, eyeOutline, locationOutline, 
      optionsOutline, warningOutline, alertCircleOutline, arrowDownCircleOutline, 
      checkmarkCircleOutline, syncOutline, timeOutline 
    });
  }

  ngOnInit() {
    this.cargarPrimerosDatos();
  }

  ionViewWillEnter() {
    this.cargarSeguimientoIds();
  }

  async cargarSeguimientoIds() {
    const ids = await this.seguimientoService.getSeguimientoIds();
    this.seguimientoIds.set(ids);
  }

  cargarPrimerosDatos(event?: any) {
    this.paginaActual = 1;
    this.hayMasDatos = true;
    this.cargando.set(true);

    this.incidenciasService.getIncidenciasPaginadas(this.paginaActual, this.limitePorPagina).subscribe({
      next: (data: Incidencia[]) => {
        this.incidencias.set(data);
        this.cargando.set(false);
        if (event) event.target.complete();
        if (data.length < this.limitePorPagina) {
          this.hayMasDatos = false;
        }
      },
      error: (err: any) => {
        console.error('Error al cargar incidencias:', err);
        this.cargando.set(false);
        if (event) event.target.complete();
      }
    });
  }

  cargarMasDatos(event: any) {
    if (!this.hayMasDatos) {
      event.target.disabled = true;
      event.target.complete();
      return;
    }

    this.paginaActual++;
    this.incidenciasService.getIncidenciasPaginadas(this.paginaActual, this.limitePorPagina).subscribe({
      next: (nuevosDatos: Incidencia[]) => {
        if (nuevosDatos.length > 0) {
          this.incidencias.update(lista => [...lista, ...nuevosDatos]);
        }
        
        if (nuevosDatos.length < this.limitePorPagina) {
          this.hayMasDatos = false;
        }
        event.target.complete();
      },
      error: (err: any) => {
        console.error('Error al cargar más páginas:', err);
        event.target.complete();
      }
    });
  }

  
  setFiltroEstado(val: string) {
    this.estadoFiltro.set(this.estadoFiltro() === val ? '' : val);
  }

  setFiltroPrioridad(val: string) {
    this.prioridadFiltro.set(this.prioridadFiltro() === val ? '' : val);
  }

  limpiarFiltros() {
    this.estadoFiltro.set('');
    this.prioridadFiltro.set('');
    this.textoBusqueda.set('');
  }

  toggleFiltrosPanel() {
    this.mostrarFiltros.update(v => !v);
  }

  onBuscarInput(event: any) {
    this.textoBusqueda.set(event.detail?.value || '');
  }

  async toggleSeguimiento(id?: string) {
    if (!id) return;
    const esSeguido = this.seguimientoIds().includes(id);

    if (esSeguido) {
      await this.seguimientoService.removerSeguimiento(id);
    } else {
      await this.seguimientoService.agregarSeguimiento(id);
    }

    await this.cargarSeguimientoIds();
  }

  esSeguido(id?: string): boolean {
    if (!id) return false;
    return this.seguimientoIds().includes(id);
  }

  verDetalle(id?: string) {
    if (id) {
      this.router.navigate(['/detalle-incidencia', id]);
    }
  }

  // Clase CSS para los badges superiores de estado (Plomo, Celeste, Verde)
  getClaseBadgeEstado(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('proc')) return 'badge-status-proceso';
    if (e.includes('res') || e.includes('complet')) return 'badge-status-resuelta';
    return 'badge-status-pendiente';
  }

  // Clase para el puntito de prioridad a la derecha
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

  getTextoBotonEstado(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('proc')) return 'EN PROCESO... ESPERE';
    if (e.includes('res') || e.includes('complet')) return 'RESUELTA';
    return 'PENDIENTE (VER / EDITAR)';
  }

  getClaseBotonEstado(estado?: string): string {
    const e = (estado || '').toLowerCase();
    if (e.includes('proc')) return 'btn-en-proceso';
    if (e.includes('res') || e.includes('complet')) return 'btn-resuelta';
    return 'btn-pendiente';
  }
}