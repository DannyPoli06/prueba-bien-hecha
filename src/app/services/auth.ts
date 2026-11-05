import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
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
  esFirebaseReal?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private app: FirebaseApp;
  private auth: Auth;

  // Estado del usuario activo
  currentUser = signal<UserProfile | null>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(private router: Router) {
    this.app = getApps().length ? getApp() : initializeApp(environment.firebase);
    this.auth = getAuth(this.app);

    // Recuperar sesion guardada si existe
    const savedUser = localStorage.getItem('usuario_sesion');
    if (savedUser) {
      try {
        this.currentUser.set(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('usuario_sesion');
      }
    }

    // Escuchar cambios de estado en Firebase Auth
    onAuthStateChanged(this.auth, (user: User | null) => {
      if (user) {
        const perfil: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
          esFirebaseReal: true
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
      }
    });
  }

  // Iniciar sesion con correo y contraseña
  async login(email: string, pass: string): Promise<void> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email, pass);
      const perfil: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        nombre: cred.user.displayName || email.split('@')[0],
        esFirebaseReal: true
      };
      this.currentUser.set(perfil);
      localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
    } catch (error: any) {
      // Si la consola de Firebase aun no activo el proveedor de Correo
      if (error?.code === 'auth/configuration-not-found') {
        const perfil: UserProfile = {
          uid: 'local-' + Date.now().toString(36),
          email: email,
          nombre: email.split('@')[0],
          esFirebaseReal: false
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
        return;
      }
      throw error;
    }
  }

  // Registrar un nuevo usuario en Firebase Auth
  async register(email: string, pass: string): Promise<void> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
      const perfil: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email || email,
        nombre: cred.user.displayName || email.split('@')[0],
        esFirebaseReal: true
      };
      this.currentUser.set(perfil);
      localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
    } catch (error: any) {
      // Si la consola de Firebase aun no activo el proveedor de Correo
      if (error?.code === 'auth/configuration-not-found') {
        const perfil: UserProfile = {
          uid: 'local-' + Date.now().toString(36),
          email: email,
          nombre: email.split('@')[0],
          esFirebaseReal: false
        };
        this.currentUser.set(perfil);
        localStorage.setItem('usuario_sesion', JSON.stringify(perfil));
        return;
      }
      throw error;
    }
  }

  // Cerrar sesion y redirigir al login
  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
    } catch {
      // Limpieza garantizada
    }
    this.currentUser.set(null);
    localStorage.removeItem('usuario_sesion');
    this.router.navigate(['/login']);
  }
}
