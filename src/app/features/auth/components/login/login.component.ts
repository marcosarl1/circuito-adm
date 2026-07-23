import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

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
    this.showPassword.update((value) => !value);
  }

  submit() {
    this.submitted.set(true);

    const user = this.username().trim();
    const password = this.password().trim();

    if (!user || !password) {
      return; // os erros por campo já aparecem via usernameError()/passwordError()
    }

    this.loading.set(true);
    this.errorMessage.set('');

    setTimeout(() => {
      const ok = this.authService.login(user, password);
      if (ok) {
        this.router.navigate(['/events']);
      } else {
        this.errorMessage.set('Usuário ou senha incorretos.');
        this.loading.set(false);
      }
    }, 400);
  }
}
