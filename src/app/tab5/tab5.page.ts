import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonSpinner,
  ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  personCircle, checkmarkCircle, mailOutline, keyOutline, 
  logOutOutline, lockClosed, alertCircleOutline, checkmarkCircleOutline, 
  lockClosedOutline, logInOutline, personAddOutline 
} from 'ionicons/icons';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-tab5',
  templateUrl: './tab5.page.html',
  styleUrls: ['./tab5.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonLabel,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
  ]
})
export class Tab5Page {
  authService = inject(AuthService);
  private toastCtrl = inject(ToastController);

  email = '';
  password = '';
  cargando = false;
  mensajeError = '';
  mensajeExito = '';

  constructor() {
    addIcons({
      personCircle,
      checkmarkCircle,
      mailOutline,
      keyOutline,
      logOutOutline,
      lockClosed,
      alertCircleOutline,
      checkmarkCircleOutline,
      lockClosedOutline,
      logInOutline,
      personAddOutline
    });
  }

  async mostrarToast(mensaje: string, color: string = 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'top',
      color: color
    });
    await toast.present();
  }

  async iniciarSesion() {
    this.limpiarMensajes();

    if (!this.email || !this.password) {
      this.mensajeError = 'Por favor completa el correo y la contraseña.';
      return;
    }

    this.cargando = true;
    try {
      await this.authService.login(this.email, this.password);
      this.mostrarToast('Inicio de sesión exitoso', 'success');
      this.password = '';
    } catch (err: any) {
      console.error('Error al iniciar sesion:', err);
      this.mensajeError = this.traducirError(err?.code || err?.message);
      this.mostrarToast(this.mensajeError, 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async registrarse() {
    this.limpiarMensajes();

    if (!this.email || !this.password) {
      this.mensajeError = 'Por favor completa el correo y la contraseña.';
      return;
    }

    if (this.password.length < 6) {
      this.mensajeError = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    this.cargando = true;
    try {
      await this.authService.register(this.email, this.password);
      this.mensajeExito = 'Usuario registrado con éxito en Firebase.';
      this.mostrarToast('Usuario registrado correctamente', 'success');
      this.password = '';
    } catch (err: any) {
      console.error('Error al registrarse:', err);
      this.mensajeError = this.traducirError(err?.code || err?.message);
      this.mostrarToast(this.mensajeError, 'danger');
    } finally {
      this.cargando = false;
    }
  }

  async cerrarSesion() {
    await this.authService.logout();
    this.mostrarToast('Has cerrado la sesión', 'warning');
    this.limpiarMensajes();
  }

  private limpiarMensajes() {
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  private traducirError(codigo: string): string {
    switch (codigo) {
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/user-disabled':
        return 'Este usuario ha sido deshabilitado.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas. Verifica correo o contraseña.';
      case 'auth/email-already-in-use':
        return 'El correo ya está registrado en Firebase.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      default:
        return 'Error de autenticación: ' + (codigo || 'Verifica los datos.');
    }
  }
}
