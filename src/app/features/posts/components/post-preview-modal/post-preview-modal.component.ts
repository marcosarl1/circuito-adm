
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
import { PostFormState } from '../../../../shared/models/post.model';

@Component({
  selector: 'app-post-preview-modal',
  imports: [],
  templateUrl: './post-preview-modal.component.html',
})
export class PostPreviewModalComponent implements AfterViewInit, OnDestroy {
  formData = input.required<PostFormState>();
  imagePreview = input('');
  close = output<void>();

  private el = inject(ElementRef<HTMLElement>);
  private checker = inject(InteractivityChecker, { optional: true });
  private previousOverflow: string | null = null;
  private previousActiveElement: HTMLElement | null = null;

  paragraphs = computed<string[]>(() => {
    const conteudo = this.formData().conteudoText;
    if (!conteudo) return [];
    return conteudo
      .split('\n')
      .map((p: string) => p.trim())
      .filter(Boolean);
  });

  formattedDate = computed<string>(() => {
    const raw = this.formData().data; // yyyy-MM-dd
    if (!raw) return '';
    const d = new Date(raw + 'T12:00:00');
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  });

  // keep method for backward compat if template still calls it
  getParagraphs(): string[] {
    return this.paragraphs();
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
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
