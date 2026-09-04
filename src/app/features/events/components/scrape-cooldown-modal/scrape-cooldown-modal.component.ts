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
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';

@Component({
  selector: 'app-scrape-cooldown-modal',
  templateUrl: './scrape-cooldown-modal.component.html',
})
export class ScrapeCooldownModalComponent implements AfterViewInit, OnDestroy {
  lastFinishedAt = input<string | null>(null);

  proceed = output<void>();
  cancel = output<void>();

  private el = inject(ElementRef<HTMLElement>);
  private checker = inject(InteractivityChecker, { optional: true });
  private previousOverflow: string | null = null;
  private previousActiveElement: HTMLElement | null = null;

  private finishedTime = computed<number | null>(() => {
    const raw = this.lastFinishedAt();
    if (!raw) return null;
    const t = new Date(raw).getTime();
    return Number.isNaN(t) ? null : t;
  });

  private finishedDate = computed<Date | null>(() => {
    const t = this.finishedTime();
    return t === null ? null : new Date(t);
  });

  diasAtras = computed<number>(() => {
    const finished = this.finishedTime();
    if (finished === null) return 0;
    return Math.floor((Date.now() - finished) / 86_400_000);
  });

  dataFormatada = computed<string>(() => {
    const d = this.finishedDate();
    if (!d) return '';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  });

  horaFormatada = computed<string>(() => {
    const d = this.finishedDate();
    if (!d) return '';
    return d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  hasValidDate = computed<boolean>(() => this.finishedDate() !== null);

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.cancel.emit();
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
}
