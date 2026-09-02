import { Component, computed, HostListener, input, output, signal } from '@angular/core';
import {
  ScrapeCsvSummary,
  ScrapeImportResult,
  ScrapeReport,
  ScrapeScraperResult,
} from '../../models/scrape.model';

type SortKey =
  | 'total'
  | 'duplicados'
  | 'fonte'
  | 'sem_preco'
  | 'sem_imagem'
  | 'passados';

@Component({
  selector: 'app-scrape-report-modal',
  imports: [],
  templateUrl: './scrape-report-modal.component.html',
})
export class ScrapeReportModalComponent {
  report = input<ScrapeReport | null>(null);
  importing = input(false);
  importResult = input<ScrapeImportResult | null>(null);
  error = input<string | null>(null);

  import = output<void>();
  close = output<void>();

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    // close detail first, then modal
    if (this.selectedDetail()) {
      this.selectedDetail.set(null);
      event.preventDefault();
      return;
    }
    this.close.emit();
  }

  // badge system
  expanded = signal(false);
  selectedDetail = signal<string | null>(null);

  // filtros / ordenação CSV
  onlyAlerts = signal(false);
  sortBy = signal<SortKey>('total');
  sortDir = signal<'asc' | 'desc'>('desc');

  summary = computed(() => {
    const scrapers = this.report()?.scrapers ?? [];
    return {
      total: scrapers.length,
      ok: scrapers.filter((s) => s.ok).length,
      fail: scrapers.filter((s) => !s.ok).length,
      duration: scrapers.reduce((acc, s) => acc + (s.duration_s ?? 0), 0),
    };
  });

  hasScrapers = computed(() => (this.report()?.scrapers.length ?? 0) > 0);
  hasCsvs = computed(() => (this.report()?.csvs.length ?? 0) > 0);

  visibleScrapers = computed<ScrapeScraperResult[]>(() => {
    const list = this.report()?.scrapers ?? [];
    if (this.expanded() || list.length <= 8) return list;
    return list.slice(0, 8);
  });

  remaining = computed(() => {
    const total = this.report()?.scrapers?.length ?? 0;
    if (this.expanded() || total <= 8) return 0;
    return total - 8;
  });

  selectedScraper = computed<ScrapeScraperResult | null>(() => {
    const name = this.selectedDetail();
    if (!name) return null;
    return this.report()?.scrapers.find((s) => s.nome === name) ?? null;
  });

  // timeline
  timelineMeta = computed(() => {
    const r = this.report();
    if (!r) return null;
    const scrapers = r.scrapers ?? [];
    if (!scrapers.length) return null;
    const max = Math.max(...scrapers.map((s) => s.duration_s), 0.1);
    const totalFromScrapers = scrapers.reduce((a, s) => a + s.duration_s, 0);
    let totalWall: number | null = null;
    if (r.started_at && r.finished_at) {
      const s = new Date(r.started_at).getTime();
      const e = new Date(r.finished_at).getTime();
      if (!Number.isNaN(s) && !Number.isNaN(e) && e > s) totalWall = (e - s) / 1000;
    }
    const startLabel = r.started_at ? this.formatDate(r.started_at) : null;
    const endLabel = r.finished_at ? this.formatDate(r.finished_at) : null;
    return { max, totalWall, totalFromScrapers, startLabel, endLabel };
  });

  timelineBars = computed(() => {
    const meta = this.timelineMeta();
    const scrapers = this.report()?.scrapers ?? [];
    if (!meta || !scrapers.length) return [];
    const max = meta.max || 1;
    // keep original order but mark bottleneck
    return scrapers.map((s) => ({
      ...s,
      width: Math.max(6, (s.duration_s / max) * 100),
      isBottleneck: s.duration_s === max && max > 0,
    }));
  });

  // csvs filtrados e ordenados
  filteredAndSortedCsvs = computed<ScrapeCsvSummary[]>(() => {
    let list = this.report()?.csvs ?? [];
    if (this.onlyAlerts()) {
      list = list.filter((c) => this.isWithAlerts(c));
    }
    const key = this.sortBy();
    const dir = this.sortDir();
    const sorted = [...list].sort((a, b) => {
      if (key === 'fonte') {
        return dir === 'asc'
          ? a.fonte.localeCompare(b.fonte)
          : b.fonte.localeCompare(a.fonte);
      }
      if (key === 'duplicados') {
        return dir === 'asc' ? a.duplicados - b.duplicados : b.duplicados - a.duplicados;
      }
      if (key === 'sem_preco') {
        return dir === 'asc' ? a.sem_preco - b.sem_preco : b.sem_preco - a.sem_preco;
      }
      if (key === 'sem_imagem') {
        return dir === 'asc' ? a.sem_imagem - b.sem_imagem : b.sem_imagem - a.sem_imagem;
      }
      if (key === 'passados') {
        return dir === 'asc'
          ? a.eventos_passados - b.eventos_passados
          : b.eventos_passados - a.eventos_passados;
      }
      // total
      return dir === 'asc' ? a.total - b.total : b.total - a.total;
    });
    return sorted;
  });

  alertsCount = computed(() => {
    const csvs = this.report()?.csvs ?? [];
    return csvs.filter((c) => this.isWithAlerts(c)).length;
  });

  totalEventsCount = computed(() => {
    const csvs = this.report()?.csvs ?? [];
    return csvs.reduce((a, c) => a + c.total, 0);
  });

  toggleExpanded() {
    this.expanded.update((v) => !v);
  }

  toggleDetail(nome: string) {
    this.selectedDetail.update((curr) => (curr === nome ? null : nome));
  }

  hasDetail(scraper: ScrapeScraperResult): boolean {
    return Boolean(scraper.detail || scraper.stderr);
  }

  isWithAlerts(csv: ScrapeCsvSummary): boolean {
    return !csv.ok || csv.duplicados > 0 || csv.sem_preco > 0 || csv.sem_imagem > 0;
  }

  toggleOnlyAlerts() {
    this.onlyAlerts.update((v) => !v);
  }

  setSort(key: SortKey) {
    if (this.sortBy() === key) {
      this.sortDir.update((d) => (d === 'desc' ? 'asc' : 'desc'));
    } else {
      this.sortBy.set(key);
      this.sortDir.set(key === 'fonte' ? 'asc' : 'desc');
    }
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }
}
