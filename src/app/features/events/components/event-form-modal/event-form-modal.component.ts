import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  type OnInit,
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { LoadingService } from '../../../../core/services/loading.service';
import { EventFormState } from '../../models/event-form-state.model';
import { EventMainFormComponent } from './event-main-form.component';
import { EventMediaPricingComponent } from './event-media-pricing.component';
import { EventRouteKitsComponent } from './event-route-kits.component';

@Component({
  selector: 'app-event-form-modal',
  imports: [
    ScrollingModule,
    EventMainFormComponent,
    EventMediaPricingComponent,
    EventRouteKitsComponent,
  ],
  templateUrl: './event-form-modal.component.html',
})
export class EventFormModalComponent implements OnInit, AfterViewInit, OnDestroy {
  private loadingService = inject(LoadingService);

  formData = model.required<EventFormState>();
  loading = this.loadingService.loading;
  editingId = input<string | null>(null);

  save = output<void>();
  cancel = output<void>();
  addKit = output<void>();
  removeKit = output<number>();

  private el = inject(ElementRef<HTMLElement>);
  private checker = inject(InteractivityChecker, { optional: true });
  private previousOverflow: string | null = null;
  private previousActiveElement: HTMLElement | null = null;

  submitted = signal(false);

  ngOnInit(): void {
    const defaultState = this.formData().estado || 'PB';
    this.formData.update((f) => ({ ...f, estado: defaultState }));
  }

  ngAfterViewInit() {
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

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.handleCancel();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    this.trapTab(event);
  }

  private findFocusable(): HTMLElement[] {
    const root = this.el.nativeElement;
    const nodes = root.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1")]',
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

  handleSave(): void {
    this.submitted.set(true);
    this.save.emit();
  }

  handleCancel(): void {
    this.submitted.set(false);
    this.cancel.emit();
  }
}
