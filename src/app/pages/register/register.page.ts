import { Component, inject } from '@angular/core';
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
  mostrarPassword = false;
  cargando = false;
  mensajeError = '';

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
    this.mostrarPassword = !this.mostrarPassword;
  }

  async registrarse() {
    this.mensajeError = '';

    if (!this.email.trim() || !this.password || !this.confirmPassword) {
      this.mensajeError = 'Por favor completa todos los campos.';
      return;
    }

    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener mínimo 6 caracteres.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;
    try {
      await this.authService.register(this.email.trim(), this.password);
      const toast = await this.toastCtrl.create({
        message: 'Cuenta creada con éxito',
        duration: 2500,
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
      case 'auth/email-already-in-use':
        return 'El correo ya se encuentra registrado.';
      case 'auth/invalid-email':
        return 'El formato del correo es inválido.';
      case 'auth/weak-password':
        return 'La contraseña es muy débil (mínimo 6 caracteres).';
      case 'auth/configuration-not-found':
        return 'Servicio de autenticación no habilitado en Firebase Console.';
      default:
        return 'Error al registrar: ' + (codigo || 'Verifica tus datos.');
    }
  }
}
