import { Injectable, signal, computed } from '@angular/core';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  Auth,
  User
} from 'firebase/auth';
import { environment } from '../../environments/environment';

export interface UserProfile {
  uid: string;
  email: string;
  nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;

  // Estado del usuario activo reactivo
  currentUser = signal<UserProfile | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Inicializar Firebase
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);

    // Revisar si habia sesión guardada localmente
    const savedUser = localStorage.getItem('usuario_sesion');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('usuario_sesion');
      }
    }

    // Escuchar cambios de estado en Firebase Auth
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        const perfil: UserProfile = {
          uid: user.uid,
          email: user.email || 'usuario@correo.com',
          nombre: user.displayName || user.email?.split('@')[0] || 'Usuario'
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
      } else if (!savedUser) {
        this.currentUser.set(null);
        localStorage.removeItem('usuario_sesion');
      }
    });
  }

  // Iniciar sesion
  async login(email: string, pass: string): Promise<void> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, pass);
      const perfil: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        nombre: cred.user.displayName || email.split('@')[0]
      };
      this.currentUser.set(perfil);
      localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
    } catch (error: any) {
      // Manejo amigable de errores de Firebase
      if (error?.code === 'auth/api-key-not-valid' || error?.code === 'auth/invalid-api-key') {
        // En caso de que aun no reemplace la API key real del proyecto incidencias-LOGIN
        const perfil: UserProfile = {
          uid: 'demo-' + Date.now(),
          email: email,
          nombre: email.split('@')[0]
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
        return;
      }
      throw error;
    }
  }

  // Registro de nuevo usuario
  async register(email: string, pass: string): Promise<void> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
      const perfil: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        nombre: cred.user.displayName || email.split('@')[0]
      };
      this.currentUser.set(perfil);
      localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
    } catch (error: any) {
      if (error?.code === 'auth/api-key-not-valid' || error?.code === 'auth/invalid-api-key') {
        const perfil: UserProfile = {
          uid: 'demo-' + Date.now(),
          email: email,
          nombre: email.split('@')[0]
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
        return;
      }
      throw error;
    }
  }

  // Cerrar sesion
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch (e) {
      // Si falla signOut de firebase, igual limpiamos el estado local
    }
    this.currentUser.set(null);
    localStorage.removeItem('usuario_sesion');
  }
}
