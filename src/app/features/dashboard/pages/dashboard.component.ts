import { Component, computed, inject, signal } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { Event } from '../../../shared/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, NgApexchartsModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  events = signal<Event[]>([]);
  stats = computed(() => this.dashboardService.getStats(this.events()));

  // Paginação — 6 por página
  porMesPage = signal(0);
  porMesPageSize = 6;
  porMesSorted = computed(() => [...this.stats().porMes].reverse());
  porMesTotalPages = computed(() => Math.max(1, Math.ceil(this.porMesSorted().length / this.porMesPageSize)));
  porMesVisible = computed(() => {
    const start = this.porMesPage() * this.porMesPageSize;
    return this.porMesSorted().slice(start, start + this.porMesPageSize);
  });
  prevPorMes() { if (this.porMesPage() > 0) this.porMesPage.update((p) => p - 1); }
  nextPorMes() { if (this.porMesPage() < this.porMesTotalPages() - 1) this.porMesPage.update((p) => p + 1); }

  porEstadoPage = signal(0);
  porEstadoPageSize = 6;
  porEstadoTotalPages = computed(() => Math.max(1, Math.ceil(this.stats().porEstado.length / this.porEstadoPageSize)));
  porEstadoVisible = computed(() => {
    const s = this.porEstadoPage() * this.porEstadoPageSize;
    return this.stats().porEstado.slice(s, s + this.porEstadoPageSize);
  });
  prevPorEstado() { if (this.porEstadoPage() > 0) this.porEstadoPage.update((p) => p - 1); }
  nextPorEstado() { if (this.porEstadoPage() < this.porEstadoTotalPages() - 1) this.porEstadoPage.update((p) => p + 1); }

  proximosPage = signal(0);
  proximosPageSize = 6;
  proximosTotalPages = computed(() => Math.max(1, Math.ceil(this.proximosEventos().length / this.proximosPageSize)));
  proximosVisible = computed(() => {
    const s = this.proximosPage() * this.proximosPageSize;
    return this.proximosEventos().slice(s, s + this.proximosPageSize);
  });
  prevProximos() { if (this.proximosPage() > 0) this.proximosPage.update((p) => p - 1); }
  nextProximos() { if (this.proximosPage() < this.proximosTotalPages() - 1) this.proximosPage.update((p) => p + 1); }

  // Top Fontes — pizza interativa bonita e reativa
  porFonteSorted = computed(() => [...this.stats().porFonte].sort((a, b) => b.count - a.count).slice(0, 6));
  porFonteTotal = computed(() => this.porFonteSorted().reduce((s, f) => s + f.count, 0));
  fonteHover = signal<string | null>(null);

  // Bar scaling: max instead of total for perceptible differences
  porMesMax = computed(() => Math.max(1, ...this.stats().porMes.map((m) => m.count)));
  porEstadoMax = computed(() => Math.max(1, ...this.stats().porEstado.map((e) => e.count)));

  readonly PIE_COLORS = ['#fb8500', '#219ebc', '#ffb703', '#8ecae6', '#f72585', '#06d6a0'];

  chartOptions = computed<ApexOptions>(() => ({
    series: this.porFonteSorted().map((f) => f.count),
    labels: this.porFonteSorted().map((f) => f.fonte),
    colors: this.PIE_COLORS,
    chart: { type: 'donut', height: 220, background: 'transparent', toolbar: { show: false } },
    plotOptions: { pie: { donut: { size: '58%', labels: { show: true, total: { show: true, label: 'Total', color: '#ffffff', fontSize: '12px', fontWeight: 600, formatter: () => String(this.porFonteTotal()) }, value: { color: '#ffffff', fontSize: '16px', fontWeight: 700 } } } } },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: ['#00090e'] },
    tooltip: { theme: 'dark', y: { formatter: (val: number) => `${val} eventos` } },
    responsive: [{ breakpoint: 480, options: { chart: { height: 200 } } }],
  }));

  pieSlices = computed(() => {
    const data = this.porFonteSorted();
    const total = this.porFonteTotal();
    if (total === 0) return [];
    let acc = 0;
    return data.map((item, idx) => {
      const start = (acc / total) * 2 * Math.PI - Math.PI / 2;
      acc += item.count;
      const end = (acc / total) * 2 * Math.PI - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const r = 42, cx = 50, cy = 50;
      const x1 = cx + r * Math.cos(start), y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
      return {
        ...item,
        color: this.PIE_COLORS[idx % this.PIE_COLORS.length],
        path,
        percent: (item.count / total) * 100,
      };
    });
  });

  proximosEventos = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);
    const MESES: Record<string, number> = {
      janeiro: 1, fevereiro: 2, marco: 3, março: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
    };
    const parse = (raw: string, datasISO?: unknown): Date | null => {
      if (datasISO && Array.isArray(datasISO) && datasISO.length > 0) {
        const d = new Date(datasISO[0] as string);
        if (!isNaN(d.getTime())) return d;
      }
      if (!raw) return null;
      const iso = new Date(raw);
      if (!isNaN(iso.getTime()) && raw.includes('-')) return iso;
      try {
        const p = raw.toLowerCase().trim().split(/\s+/);
        const d = parseInt(p[0], 10);
        const m = MESES[p[2]];
        const y = parseInt(p[4], 10);
        if (!d || !m || !y) return null;
        return new Date(y, m - 1, d);
      } catch { return null; }
    };
    return this.events()
      .map((e) => ({ e, d: parse(e.data_realizacao, (e as unknown as { datas_realizacao?: unknown }).datas_realizacao) }))
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
