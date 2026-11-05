import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  personAdd, mailOutline, lockClosedOutline, checkmarkDoneOutline,
  personAddOutline, logInOutline, alertCircleOutline,
  eyeOutline, eyeOffOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class RegisterPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  email = '';
  password = '';
  confirmPassword = '';

  // Reactividad con Signals para evitar bloqueos de UI
  mostrarPassword = signal<boolean>(false);
  cargando = signal<boolean>(false);
  mensajeError = signal<string>('');

  constructor() {
    addIcons({
      personAdd,
      mailOutline,
      lockClosedOutline,
      checkmarkDoneOutline,
      personAddOutline,
      logInOutline,
      alertCircleOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  togglePassword() {
    this.mostrarPassword.update((val) => !val);
  }

  async registrarse() {
    this.mensajeError.set('');

    const correoLimpio = (this.email || '').trim();
    const claveLimpia = this.password || '';
    const confirmacionLimpia = this.confirmPassword || '';

    // Validacion de campos vacios
    if (!correoLimpio || !claveLimpia || !confirmacionLimpia) {
      this.mensajeError.set('Por favor completa todos los campos.');
      this.mostrarToast('Por favor completa todos los campos', 'warning');
      this.cargando.set(false);
      return;
    }

    // Validacion de formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correoLimpio)) {
      this.mensajeError.set('El formato del correo electrónico no es válido.');
      this.mostrarToast('Correo electrónico no válido', 'warning');
      this.cargando.set(false);
      return;
    }

    // Validacion de longitud de clave
    if (claveLimpia.length < 6) {
      this.mensajeError.set('La contraseña debe tener mínimo 6 caracteres.');
      this.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      this.cargando.set(false);
      return;
    }

    // Validacion de coincidencia de claves
    if (claveLimpia !== confirmacionLimpia) {
      this.mensajeError.set('Las contraseñas no coinciden.');
      this.mostrarToast('Las contraseñas no coinciden', 'warning');
      this.cargando.set(false);
      return;
    }

    this.cargando.set(true);

    try {
      await this.authService.register(correoLimpio, claveLimpia);
      this.mostrarToast('Cuenta creada con éxito en Firebase', 'success');
      this.router.navigate(['/tabs/tab1']);
    } catch (err: any) {
      const mensaje = this.obtenerMensajeError(err?.code || err?.message);
      this.mensajeError.set(mensaje);
      this.mostrarToast(mensaje, 'danger');
    } finally {
      this.cargando.set(false);
    }
  }

  private async mostrarToast(mensaje: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'top',
      color: color
    });
    await toast.present();
  }

  private obtenerMensajeError(codigo: string): string {
    switch (codigo) {
      case 'auth/email-already-in-use':
        return 'El correo ya se encuentra registrado.';
      case 'auth/invalid-email':
        return 'El formato del correo es inválido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil (mínimo 6 caracteres).';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revisa tu acceso a internet.';
      case 'auth/configuration-not-found':
        return 'Servicio de autenticación no habilitado en Firebase Console.';
      default:
        return 'Error al registrar: ' + (codigo || 'Verifica tus datos.');
    }
  }
}
