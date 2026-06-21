import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiKeyModalComponent } from './components/api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ApiKeyModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'admin-panel';
}
