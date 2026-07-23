import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiKeyModalComponent } from './shared/components/api-key-modal/api-key-modal.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ApiKeyModalComponent],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'admin-panel';
}
