import { computed, inject, Service, signal } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'circuito_auth';

@Service()
export class AuthService {
  private router = inject(Router);

  private isAuthenticatedSignal = signal<boolean>(this.checkSessionStorage());

  isAuthenticated = computed(() => this.isAuthenticatedSignal());

  private checkSessionStorage(): boolean {
    try {
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  }

  login(username: string, password: string): boolean {
    if (!username || !password) {
      return false;
    }

    const isValid =
      username === environment.adminUser && password === environment.adminPass;
    if (isValid) {
      try {
        sessionStorage.setItem(SESSION_KEY, 'true');
        this.isAuthenticatedSignal.set(true);
      } catch (error) {
        return false;
      }
    }
    return isValid;
  }

  logout(): void {
    try {
      sessionStorage.removeItem(SESSION_KEY);
      this.isAuthenticatedSignal.set(false);
    } catch (error) {
      console.error('Falha ao limpar autenticação');
    } finally {
      this.router.navigate(['/login']);
    }
  }
}
