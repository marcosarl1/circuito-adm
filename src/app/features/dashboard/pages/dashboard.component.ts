import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DashboardService, DashboardStats } from '../services/dashboard.service';
import { Event } from '../../../shared/models/event.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ChartCoreComponent } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import 'apexcharts/bar';
import 'apexcharts/donut';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [IconComponent, ChartCoreComponent, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  loading = signal(true);
  error = signal<string | null>(null);
  hasError = computed(() => !!this.error());
  serverStats = signal<DashboardStats | null>(null);
  stats = computed(() => {
    const s = this.serverStats();
    if (!s)
      return {
        total: 0,
        ativos: 0,
        passados: 0,
        proximos30d: 0,
        proximos90d: 0,
        semPreco: 0,
        patrocinados: 0,
        semImagem: 0,
        semLink: 0,
        semRegulamento: 0,
        valorMedio: 0,
        lote1Count: 0,
        porMes: [],
        porEstado: [],
        porCidade: [],
        porDistancia: [],
        porOrganizador: [],
        porFonte: [],
        densidade: [],
        choques: 0,
        statusInscricoes: { abertas: 0, emBreve: 0, encerradas: 0 },
        densidadeFimDeSemana: [],
        finsDeSemanaLivres: 0,
        totalChoquesFimDeSemana: 0,
        scraperHealth: [],
        proximosEventos: [],
      } as DashboardStats;
    return this.enrichWithFimDeSemana(s);
  });

  private enrichWithFimDeSemana(s: DashboardStats): DashboardStats {
    if (s.densidadeFimDeSemana && s.densidadeFimDeSemana.length) return s;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const densidadePorDia = new Map<string, number>(s.densidade.map((d) => [d.data, d.count]));
    const dow = now.getDay();
    const daysToSat = (6 - dow + 7) % 7;
    const firstSat = new Date(now);
    firstSat.setDate(now.getDate() + daysToSat);
    firstSat.setHours(0, 0, 0, 0);
    const densidadeFimDeSemana = [] as DashboardStats['densidadeFimDeSemana'];
    for (let i = 0; i < 12; i++) {
      const sat = new Date(firstSat);
      sat.setDate(firstSat.getDate() + i * 7);
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const satKey = sat.toISOString().slice(0, 10);
      const sunKey = sun.toISOString().slice(0, 10);
      const satCount = densidadePorDia.get(satKey) ?? 0;
      const sunCount = densidadePorDia.get(sunKey) ?? 0;
      const total = satCount + sunCount;
      const nivel = total === 0 ? 'livre' : total >= 3 ? 'choque' : 'moderado';
      const monthRaw = sun.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const month = monthRaw.charAt(0).toUpperCase() + monthRaw.slice(1);
      const label = `${String(sat.getDate()).padStart(2, '0')}-${String(sun.getDate()).padStart(2, '0')} ${month}`;
      densidadeFimDeSemana.push({
        sabado: satKey,
        domingo: sunKey,
        label,
        total,
        nivel: nivel as DashboardStats['densidadeFimDeSemana'][number]['nivel'],
        detalhe: [{ data: satKey, count: satCount }, { data: sunKey, count: sunCount }],
      });
    }
    return {
      ...s,
      densidadeFimDeSemana,
      finsDeSemanaLivres: densidadeFimDeSemana.filter((f) => f.nivel === 'livre').length,
      totalChoquesFimDeSemana: densidadeFimDeSemana.filter((f) => f.nivel === 'choque').length,
    };
  }

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
    const sh = this.serverStats()?.scraperHealth;
    if (sh && sh.length) {
      const now = Date.now();
      return sh
        .map((h) => {
          const maxMs = h.maxDataColeta ? new Date(h.maxDataColeta).getTime() : 0;
          const diffMs = now - maxMs;
          const diffH = Math.floor(diffMs / 3600000);
          const diffD = Math.floor(diffH / 24);
          let relativo = '—';
          let status: 'ok' | 'atrasado' = 'ok';
          const dataSync = maxMs
            ? new Date(maxMs).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            : '—';
          if (!maxMs || isNaN(maxMs)) {
            relativo = 'sem dados';
            status = 'atrasado';
          } else if (diffH < 1) {
            relativo = 'há poucos minutos';
          } else if (diffH < 24) {
            relativo = `há ${diffH}h`;
          } else if (diffD === 1) {
            relativo = 'há 1 dia';
          } else if (diffD < 15) {
            relativo = `há ${diffD} dias`;
          } else {
            relativo = `há ${diffD} dias`;
            status = 'atrasado';
          }
          return {
            fonte: h.fonte,
            display: h.display,
            maxMs: isNaN(maxMs) ? 0 : maxMs,
            count: h.count,
            semLink: h.semLink,
            semRegulamento: h.semRegulamento,
            semImagem: h.semImagem,
            semPreco: h.semPreco,
            relativo,
            status,
            dataSync,
            diffD: isNaN(diffD) ? 0 : diffD,
            totalPendencias: h.semLink + h.semRegulamento + h.semImagem + h.semPreco,
          };
        })
        .sort((a, b) => b.maxMs - a.maxMs);
    }
    return [];
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
    const server = this.serverStats()?.proximosEventos ?? [];
    return server.map((p) => ({
      _id: p._id,
      nome_evento: p.nome_evento,
      data_realizacao: p.data_realizacao,
      cidade: p.cidade,
      estado: p.estado,
      organizador: p.organizador,
      datas_realizacao: p.datas_realizacao,
    })) as unknown as Event[];
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.serverStats.set(null);
    this.dashboardService.getDashboardStats().subscribe({
      next: (s) => {
        this.serverStats.set(s);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        const msg = err instanceof Error && err.message ? err.message : 'Falha ao carregar estatísticas. Verifique sua conexão.';
        this.error.set(msg);
        this.loading.set(false);
      },
    });
  }

  retry(): void {
    this.load();
  }
}
