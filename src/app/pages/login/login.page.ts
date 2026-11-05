import { Component, inject } from '@angular/core';
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
  mostrarPassword = false;
  cargando = false;
  mensajeError = '';

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
    this.mostrarPassword = !this.mostrarPassword;
  }

  async iniciarSesion() {
    this.mensajeError = '';

    if (!this.email.trim() || !this.password) {
      this.mensajeError = 'Por favor ingresa tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    try {
      await this.authService.login(this.email.trim(), this.password);
      const toast = await this.toastCtrl.create({
        message: 'Bienvenido a Reportes Quito',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
      this.router.navigate(['/tabs/tab1']);
    } catch (err: any) {
      this.mensajeError = this.obtenerMensajeError(err?.code || err?.message);
    } finally {
      this.cargando = false;
    }
  }

  private obtenerMensajeError(codigo: string): string {
    switch (codigo) {
      case 'auth/invalid-email':
        return 'El formato del correo es inválido.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas. Verifica correo o contraseña.';
      case 'auth/configuration-not-found':
        return 'Servicio de autenticación no habilitado en Firebase Console.';
      default:
        return 'Error al iniciar sesión: ' + (codigo || 'Verifica tus datos.');
    }
  }
}
