import { Component, afterNextRender, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { WarmupService } from './core/services/warmup.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'admin-panel';
  private warmup = inject(WarmupService);

  constructor() {
    afterNextRender(() => this.warmup.warm());
  }
}
