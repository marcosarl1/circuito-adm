import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DashboardService } from '../services/dashboard.service';
import { Event } from '../../../shared/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChartComponent } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, ChartComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal<string | null>(null);
  hasError = computed(() => !!this.error());
  events = signal<Event[]>([]);
  stats = computed(() => this.dashboardService.getStats(this.events()));

  porMesSorted = computed(() => [...this.stats().porMes].reverse());

  porEstadoPage = signal(0);
  porEstadoPageSize = 8;
  porEstadoTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.stats().porEstado.length / this.porEstadoPageSize),
    ),
  );
  porEstadoVisible = computed(() => {
    const s = this.porEstadoPage() * this.porEstadoPageSize;
    return this.stats().porEstado.slice(s, s + this.porEstadoPageSize);
  });
  prevPorEstado() {
    if (this.porEstadoPage() > 0) this.porEstadoPage.update((p) => p - 1);
  }
  nextPorEstado() {
    if (this.porEstadoPage() < this.porEstadoTotalPages() - 1)
      this.porEstadoPage.update((p) => p + 1);
  }

  // Toggle Estados ↔ Cidades dentro do mesmo card
  localView = signal<'estado' | 'cidade'>('estado');
  toggleLocalView(v: 'estado' | 'cidade') {
    this.localView.set(v);
    this.porEstadoPage.set(0);
    this.porCidadePage.set(0);
  }
  porCidadePage = signal(0);
  porCidadePageSize = 8;
  porCidadeTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(this.stats().porCidade.length / this.porCidadePageSize),
    ),
  );
  porCidadeVisible = computed(() => {
    const s = this.porCidadePage() * this.porCidadePageSize;
    return this.stats().porCidade.slice(s, s + this.porCidadePageSize);
  });
  prevPorCidade() {
    if (this.porCidadePage() > 0) this.porCidadePage.update((p) => p - 1);
  }
  nextPorCidade() {
    if (this.porCidadePage() < this.porCidadeTotalPages() - 1)
      this.porCidadePage.update((p) => p + 1);
  }
  porCidadeMax = computed(() =>
    Math.max(1, ...this.stats().porCidade.map((c) => c.count)),
  );

  // Top Fontes — pizza interativa bonita e reativa
  porFonteSorted = computed(() =>
    [...this.stats().porFonte].sort((a, b) => b.count - a.count).slice(0, 6),
  );
  porFonteTotal = computed(() =>
    this.porFonteSorted().reduce((s, f) => s + f.count, 0),
  );

  // Bar scaling: max instead of total for perceptible differences
  porEstadoMax = computed(() =>
    Math.max(1, ...this.stats().porEstado.map((e) => e.count)),
  );

  readonly PIE_COLORS = [
    '#fb8500',
    '#219ebc',
    '#ffb703',
    '#8ecae6',
    '#f72585',
    '#06d6a0',
  ];

  statusInscricoesTotal = computed(() => {
    const s = this.stats().statusInscricoes;
    return (s?.abertas ?? 0) + (s?.emBreve ?? 0) + (s?.encerradas ?? 0);
  });

  operacionalView = signal<'fontes' | 'inscricoes'>('fontes');
  setOperacionalView(v: 'fontes' | 'inscricoes') {
    this.operacionalView.set(v);
  }

  scraperOpen = signal<Set<string>>(new Set());
  toggleScraper(fonte: string) {
    const s = new Set(this.scraperOpen());
    if (s.has(fonte)) s.delete(fonte);
    else s.add(fonte);
    this.scraperOpen.set(s);
  }
  isScraperOpen(fonte: string) {
    return this.scraperOpen().has(fonte);
  }

  scraperStatus = computed(() => {
    const IGNORADAS = ['manual', 'ticketsports'];
    const map = new Map<
      string,
      {
        fonte: string;
        display: string;
        maxMs: number;
        count: number;
        semLink: number;
        semRegulamento: number;
        semImagem: number;
        semPreco: number;
      }
    >();
    for (const e of this.events()) {
      const raw = (e.site_coleta || '').trim();
      const key = raw.toLowerCase();
      if (!raw || raw === '—' || IGNORADAS.some((ig) => key.includes(ig)))
        continue;
      const ms = e.data_coleta ? new Date(e.data_coleta).getTime() : 0;
      const prev = map.get(key);
      const semLink = !(e as unknown as { url_inscricao?: string })
        .url_inscricao
        ? 1
        : 0;
      const linkEdital = (e as unknown as { link_edital?: string }).link_edital;
      const semRegulamento =
        !linkEdital || linkEdital === 'edital não encontrado' ? 1 : 0;
      const semImagem = !e.url_imagem ? 1 : 0;
      const semPreco =
        !e.precos_entries || e.precos_entries.length === 0 ? 1 : 0;
      if (!prev) {
        map.set(key, {
          fonte: key,
          display: raw,
          maxMs: isNaN(ms) ? 0 : ms,
          count: 1,
          semLink,
          semRegulamento,
          semImagem,
          semPreco,
        });
      } else {
        prev.count += 1;
        prev.semLink += semLink;
        prev.semRegulamento += semRegulamento;
        prev.semImagem += semImagem;
        prev.semPreco += semPreco;
        if (!isNaN(ms) && ms > prev.maxMs) prev.maxMs = ms;
      }
    }
    const now = Date.now();
    return [...map.values()]
      .sort((a, b) => b.maxMs - a.maxMs)
      .map((v) => {
        const diffMs = now - v.maxMs;
        const diffH = Math.floor(diffMs / 3600000);
        const diffD = Math.floor(diffH / 24);
        let relativo = '—';
        let status: 'ok' | 'atrasado' = 'ok';
        const dataSync = v.maxMs
          ? new Date(v.maxMs).toLocaleString('pt-BR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '—';
        if (!v.maxMs) {
          relativo = 'sem dados';
          status = 'atrasado';
        } else if (diffH < 1) {
          relativo = 'há poucos minutos';
          status = 'ok';
        } else if (diffH < 24) {
          relativo = `há ${diffH}h`;
          status = 'ok';
        } else if (diffD === 1) {
          relativo = 'há 1 dia';
          status = 'ok';
        } else if (diffD < 15) {
          relativo = `há ${diffD} dias`;
          status = 'ok';
        } else {
          relativo = `há ${diffD} dias`;
          status = 'atrasado';
        }
        const totalPendencias =
          v.semLink + v.semRegulamento + v.semImagem + v.semPreco;
        return { ...v, relativo, status, dataSync, diffD, totalPendencias };
      });
  });

  statusDonutOptions = computed<ApexOptions>(() => {
    const s = this.stats().statusInscricoes;
    const abertas = s?.abertas ?? 0;
    const emBreve = s?.emBreve ?? 0;
    const encerradas = s?.encerradas ?? 0;
    const total = abertas + emBreve + encerradas;
    return {
      series: [abertas, emBreve, encerradas],
      labels: ['Abertas', 'Em breve', 'Encerradas'],
      colors: ['#06d6a0', '#ffb703', '#475569'],
      chart: {
        type: 'donut',
        height: 190,
        background: 'transparent',
        toolbar: { show: false },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '62%',
            labels: {
              show: true,
              name: { show: true, color: '#bae6f5', fontSize: '11px' },
              value: {
                show: true,
                color: '#ffffff',
                fontSize: '18px',
                fontWeight: 700,
                formatter: (v: string) => v,
              },
              total: {
                show: true,
                label: 'Total',
                color: '#bae6f5',
                fontSize: '11px',
                fontWeight: 600,
                formatter: () => String(total),
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      stroke: { show: true, width: 2, colors: ['#00090e'] },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => `${val} eventos` },
      },
      responsive: [{ breakpoint: 480, options: { chart: { height: 200 } } }],
    };
  });

  eventosColumnOptions = computed<ApexOptions>(() => {
    const raw = this.stats().porMes;
    const map = new Map(raw.map((r) => [r.label, r.count]));
    const now = new Date();
    const last6: { key: string; short: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const shortRaw = d
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '');
      const short = shortRaw.charAt(0).toUpperCase() + shortRaw.slice(1);
      last6.push({ key, short });
    }
    const categories = last6.map((m) => m.short);
    const values = last6.map((m) => map.get(m.key) ?? 0);
    const hasData = values.some((v) => v > 0);
    return {
      series: [{ name: 'Eventos', data: values }],
      chart: {
        type: 'bar',
        height: 260,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: 'inherit',
        animations: { enabled: true, easing: 'easeinout', speed: 400 },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: '42%',
          distributed: false,
          borderRadiusApplication: 'end',
        },
      },
      colors: ['#fb8500'],
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        labels: {
          style: { colors: '#bae6f5', fontSize: '11px', fontWeight: 500 },
          rotate: 0,
          trim: false,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        decimalsInFloat: 0,
        labels: {
          style: { colors: '#bae6f5', fontSize: '11px' },
          formatter: (v: number) => String(Math.round(v)),
        },
      },
      grid: {
        borderColor: 'rgba(142,202,230,0.08)',
        yaxis: { lines: { show: true } },
        xaxis: { lines: { show: false } },
        padding: { left: 8, right: 8 },
      },
      tooltip: {
        theme: 'dark',
        x: { show: true },
        y: {
          formatter: (val: number) => `${val} evento${val === 1 ? '' : 's'}`,
        },
      },
      legend: { show: false },
      noData: {
        text: hasData ? '' : 'Sem eventos nos últimos 6 meses',
        style: { color: '#8ecae6', fontSize: '12px' },
      },
      states: { hover: { filter: { type: 'lighten', value: 0.08 } } },
    };
  });

  distanciasChartOptions = computed<ApexOptions>(() => {
    const data = [...this.stats().porDistancia]
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    return {
      series: [{ name: 'Eventos', data: data.map((d) => d.count) }],
      chart: {
        type: 'bar',
        height: 280,
        background: 'transparent',
        toolbar: { show: false },
        fontFamily: 'inherit',
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '55%',
          distributed: true,
        },
      },
      colors: this.PIE_COLORS,
      dataLabels: { enabled: false },
      xaxis: {
        categories: data.map((d) => d.distancia),
        labels: { style: { colors: '#bae6f5', fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#bae6f5', fontSize: '11px' } } },
      grid: {
        borderColor: 'rgba(142,202,230,0.08)',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
      tooltip: {
        theme: 'dark',
        y: { formatter: (val: number) => `${val} eventos` },
      },
      legend: { show: false },
    };
  });

  chartOptions = computed<ApexOptions>(() => ({
    series: this.porFonteSorted().map((f) => f.count),
    labels: this.porFonteSorted().map((f) => f.fonte),
    colors: this.PIE_COLORS,
    chart: {
      type: 'donut',
      height: 220,
      background: 'transparent',
      toolbar: { show: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '58%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 600,
              formatter: () => String(this.porFonteTotal()),
            },
            value: { color: '#ffffff', fontSize: '16px', fontWeight: 700 },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: true, width: 2, colors: ['#00090e'] },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val: number) => `${val} eventos` },
    },
    responsive: [{ breakpoint: 480, options: { chart: { height: 200 } } }],
  }));

  isEmpty = computed(
    () => !this.loading() && !this.hasError() && this.stats().total === 0,
  );

  proximosEventos = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const in30 = new Date(now);
    in30.setDate(now.getDate() + 30);
    const MESES: Record<string, number> = {
      janeiro: 1,
      fevereiro: 2,
      marco: 3,
      março: 3,
      abril: 4,
      maio: 5,
      junho: 6,
      julho: 7,
      agosto: 8,
      setembro: 9,
      outubro: 10,
      novembro: 11,
      dezembro: 12,
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
      } catch {
        return null;
      }
    };
    return this.events()
      .map((e) => ({
        e,
        d: parse(
          e.data_realizacao,
          (e as unknown as { datas_realizacao?: unknown }).datas_realizacao,
        ),
      }))
      .filter(
        (x): x is { e: Event; d: Date } => !!x.d && x.d >= now && x.d <= in30,
      )
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .slice(0, 5)
      .map((x) => x.e);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.getAllEvents().subscribe({
      next: (ev) => {
        this.events.set(ev);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const msg =
          err instanceof Error && err.message
            ? err.message
            : 'Falha ao carregar estatísticas. Verifique sua conexão.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.load();
  }
}
