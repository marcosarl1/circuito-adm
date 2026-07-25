import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoadingService } from '../../../../core/services/loading.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private loadingService = inject(LoadingService);

  username = signal('');
  password = signal('');
  showPassword = signal(false);
  loading = this.loadingService.loading;
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

    this.errorMessage.set('');

    this.loadingService.show();
    setTimeout(() => {
      const ok = this.authService.login(user, password);
      this.loadingService.hide();
      if (ok) {
        this.router.navigate(['/events']);
      } else {
        this.errorMessage.set('Usuário ou senha incorretos.');
      }
    }, 400);
  }
}
