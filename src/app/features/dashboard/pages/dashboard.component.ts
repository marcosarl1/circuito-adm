import { Component, computed, inject, signal } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { Event } from '../../../shared/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  events = signal<Event[]>([]);
  stats = computed(() => this.dashboardService.getStats(this.events()));

  // Por Mês paginação — 6 por página, mais recente primeiro
  porMesPage = signal(0);
  porMesPageSize = 6;
  porMesSorted = computed(() => [...this.stats().porMes].reverse());
  porMesTotalPages = computed(() => Math.max(1, Math.ceil(this.porMesSorted().length / this.porMesPageSize)));
  porMesVisible = computed(() => {
    const start = this.porMesPage() * this.porMesPageSize;
    return this.porMesSorted().slice(start, start + this.porMesPageSize);
  });

  prevPorMes() {
    if (this.porMesPage() > 0) this.porMesPage.update((p) => p - 1);
  }
  nextPorMes() {
    if (this.porMesPage() < this.porMesTotalPages() - 1) this.porMesPage.update((p) => p + 1);
  }

  proximosEventos = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);
    const MESES: Record<string, number> = {
      janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
    };
    const parse = (raw: string): Date | null => {
      try {
        const p = raw.toLowerCase().split(' ');
        const d = parseInt(p[0], 10);
        const m = MESES[p[2]];
        const y = parseInt(p[4], 10);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
      } catch { return null; }
    };
    return this.events()
      .map((e) => ({ e, d: parse(e.data_realizacao) }))
      .filter((x): x is { e: Event; d: Date } => !!x.d && x.d >= now && x.d <= in30)
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .slice(0, 5)
      .map((x) => x.e);
  });

  constructor() {
    this.dashboardService.getAllEvents().subscribe({
      next: (ev) => {
        this.events.set(ev);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
