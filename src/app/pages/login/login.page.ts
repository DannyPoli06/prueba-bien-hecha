import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  lockClosed, mailOutline, lockClosedOutline,
  logInOutline, personAddOutline, alertCircleOutline,
  eyeOutline, eyeOffOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
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
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastCtrl = inject(ToastController);

  email = '';
  password = '';

  // Reactividad con Signals para evitar bloqueos en la interfaz
  mostrarPassword = signal<boolean>(false);
  cargando = signal<boolean>(false);
  mensajeError = signal<string>('');

  constructor() {
    addIcons({
      lockClosed,
      mailOutline,
      lockClosedOutline,
      logInOutline,
      personAddOutline,
      alertCircleOutline,
      eyeOutline,
      eyeOffOutline
    });
  }

  togglePassword() {
    this.mostrarPassword.update((val) => !val);
  }

  async iniciarSesion() {
    this.mensajeError.set('');

    const correoLimpio = (this.email || '').trim();
    const claveLimpia = this.password || '';

    // Validacion de campos vacios
    if (!correoLimpio || !claveLimpia) {
      this.mensajeError.set('Por favor ingresa tu correo y contraseña.');
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

    this.cargando.set(true);

    try {
      await this.authService.login(correoLimpio, claveLimpia);
      this.mostrarToast('Bienvenido a Reportes Quito', 'success');
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
      case 'auth/invalid-email':
        return 'El formato del correo es inválido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas o usuario no registrado.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos fallidos. Intenta más tarde.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Revisa tu acceso a internet.';
      case 'auth/configuration-not-found':
        return 'Servicio de autenticación no habilitado en Firebase Console.';
      default:
        return 'Error al iniciar sesión: ' + (codigo || 'Verifica tus datos.');
    }
  }
}
