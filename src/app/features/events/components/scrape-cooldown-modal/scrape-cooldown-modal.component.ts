import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-scrape-cooldown-modal',
  templateUrl: './scrape-cooldown-modal.component.html',
})
export class ScrapeCooldownModalComponent {
  lastFinishedAt = input<string | null>(null);

  proceed = output<void>();
  cancel = output<void>();

  get diasAtras(): number {
    const finished = this.finishedTime();
    if (finished === null) return 0;
    return Math.floor((Date.now() - finished) / 86_400_000);
  }

  get dataFormatada(): string {
    const d = this.finishedDate();
    if (!d) return '';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  get horaFormatada(): string {
    const d = this.finishedDate();
    if (!d) return '';
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private finishedTime(): number | null {
    const raw = this.lastFinishedAt();
    if (!raw) return null;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? null : t;
  }

  private finishedDate(): Date | null {
    const t = this.finishedTime();
    return t === null ? null : new Date(t);
  }
}
