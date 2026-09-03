import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { A11yModule, InteractivityChecker } from '@angular/cdk/a11y';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
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
  imports: [A11yModule, IconComponent],
  templateUrl: './scrape-report-modal.component.html',
})
export class ScrapeReportModalComponent implements AfterViewInit, OnDestroy {
  report = input<ScrapeReport | null>(null);
  importing = input(false);
  importResult = input<ScrapeImportResult | null>(null);
  error = input<string | null>(null);

  import = output<void>();
  close = output<void>();

  private el = inject(ElementRef<HTMLElement>);
  private checker = inject(InteractivityChecker, { optional: true });
  private previousOverflow: string | null = null;
  private previousActiveElement: HTMLElement | null = null;

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

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    this.trapTab(event);
  }

  ngAfterViewInit(): void {
    this.previousActiveElement = document.activeElement as HTMLElement | null;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // focus first focusable inside modal
    queueMicrotask(() => {
      const target =
        (this.el.nativeElement.querySelector('[data-autofocus]') as HTMLElement | null) ??
        this.findFocusable()[0];
      target?.focus();
    });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.previousOverflow ?? '';
    this.previousActiveElement?.focus?.();
  }

  private findFocusable(): HTMLElement[] {
    const root = this.el.nativeElement;
    const nodes = root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    return (Array.from(nodes) as HTMLElement[]).filter((n) => {
      if (n.closest('[hidden]') || n.getAttribute('aria-hidden') === 'true') return false;
      if (this.checker) return this.checker.isTabbable(n);
      return n.tabIndex >= 0 || n instanceof HTMLButtonElement || n instanceof HTMLAnchorElement;
    });
  }

  private trapTab(event: KeyboardEvent): void {
    const focusable = this.findFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (event.shiftKey) {
      if (active === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  // badge system
  expanded = signal(false);
  selectedDetail = signal<string | null>(null);
  scraperQuery = signal('');
  csvQuery = signal('');

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

  filteredScrapers = computed<ScrapeScraperResult[]>(() => {
    const list = this.report()?.scrapers ?? [];
    const q = this.scraperQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => s.nome.toLowerCase().includes(q));
  });

  visibleScrapers = computed<ScrapeScraperResult[]>(() => {
    const list = this.filteredScrapers();
    if (this.expanded() || list.length <= 8) return list;
    return list.slice(0, 8);
  });

  remaining = computed(() => {
    const total = this.filteredScrapers().length;
    if (this.expanded() || total <= 8) return 0;
    return total - 8;
  });

  scraperCountLabel = computed(() => {
    const total = this.report()?.scrapers.length ?? 0;
    const filtered = this.filteredScrapers().length;
    if (!this.scraperQuery().trim()) return null;
    return `${filtered} de ${total}`;
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
    const q = this.csvQuery().trim().toLowerCase();
    if (q) {
      list = list.filter((c) => c.fonte.toLowerCase().includes(q));
    }
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

  csvChipCounts = computed(() => {
    const csvs = this.report()?.csvs ?? [];
    return {
      duplicados: csvs.filter((c) => c.duplicados > 0).length,
      sem_preco: csvs.filter((c) => c.sem_preco > 0).length,
      sem_imagem: csvs.filter((c) => c.sem_imagem > 0).length,
      passados: csvs.filter((c) => c.eventos_passados > 0).length,
    };
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
    return (
      !csv.ok ||
      csv.duplicados > 0 ||
      csv.sem_preco > 0 ||
      csv.sem_imagem > 0 ||
      csv.eventos_passados > 0
    );
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }


}
