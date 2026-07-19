import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./login.component.html",
})
export class LoginComponent {
  username = "";
  password = "";
  showPassword = false;
  loading = false;
  errorMessage = "";

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  submit() {
    if (!this.username || !this.password) {
      this.errorMessage = "Preencha usuário e senha.";
      return;
    }

    this.loading = true;
    this.errorMessage = "";

    setTimeout(() => {
      const ok = this.authService.login(this.username, this.password);

      if (ok) {
        this.router.navigate(["/events"]);
      } else {
        this.errorMessage = "Usuário ou senha incorretos.";
        this.loading = false;
      }
    }, 400);
  }
}
