import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  username = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal('');
  submitted = signal(false);

  usernameError = computed(() =>
    this.submitted() && !this.username().trim() ? 'Usuário é obrigatório' : '',
  );
  passwordError = computed(() =>
    this.submitted() && !this.password().trim() ? 'Senha é obrigatória' : '',
  );

  togglePasswordVisibility(): void {
    if (this.loading()) return;
    this.showPassword.update((value) => !value);
  }

  onUsernameChange(value: string): void {
    this.username.set(value);
    if (this.errorMessage()) this.errorMessage.set('');
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
    if (this.errorMessage()) this.errorMessage.set('');
  }

  submit() {
    if (this.loading()) return;
    this.submitted.set(true);

    const user = this.username().trim();
    const password = this.password().trim();

    if (!user || !password) {
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);

    this.authService.login(user, password)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (ok) => {
          this.loading.set(false);
          if (ok) {
            this.router.navigate(['/events']);
          } else {
            this.errorMessage.set('Usuário ou senha incorretos.');
          }
        },
        error: () => {
          this.loading.set(false);
          this.errorMessage.set('Falha de conexão. Tente novamente.');
        },
      });
  }
}
