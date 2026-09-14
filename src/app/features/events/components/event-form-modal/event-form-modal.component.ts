import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  AfterViewInit,
  Component,
  computed,
  type OnInit,
  ElementRef,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { InteractivityChecker } from '@angular/cdk/a11y';
import { FormsModule } from '@angular/forms';
import { LoadingService } from '../../../../core/services/loading.service';
import { ESTADOS_BRASILEIROS } from '../../../../shared/constants/ufs.constants';
import {
  ComboboxComponent,
  ComboboxOption,
} from '../../../../shared/components/combobox/combobox.component';
import { EventFormState, KitForm } from '../../models/event-form-state.model';

@Component({
  selector: 'app-event-form-modal',
  imports: [FormsModule, ScrollingModule, ComboboxComponent],
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

  private firstField = viewChild<ElementRef<HTMLInputElement>>('firstField');
  private el = inject(ElementRef<HTMLElement>);
  private checker = inject(InteractivityChecker, { optional: true });
  private previousOverflow: string | null = null;
  private previousActiveElement: HTMLElement | null = null;

  submitted = signal(false);

  nomeError = computed(() =>
    !this.formData().nome_evento.trim() && this.submitted() ? 'Nome é obrigatório' : '',
  );
  dataError = computed(() =>
    !this.formData().data_realizacao.trim() && this.submitted() ? 'Data é obrigatória' : '',
  );
  cidadeError = computed(() =>
    !this.formData().cidade.trim() && this.submitted() ? 'Cidade é obrigatória' : '',
  );
  estadoError = computed(() =>
    !this.formData().estado.trim() && this.submitted() ? 'Estado é obrigatório' : '',
  );
  organizadorError = computed(() =>
    !this.formData().organizador.trim() && this.submitted() ? 'Organizador é obrigatório' : '',
  );
  urlInscricaoError = computed(() =>
    !this.formData().url_inscricao.trim() && this.submitted()
      ? 'Link de inscrição é obrigatório'
      : '',
  );

  readonly stateOptions: ComboboxOption[] = ESTADOS_BRASILEIROS.map((uf) => ({
    value: uf.sigla,
    label: uf.nome,
    prefix: uf.sigla,
  }));

  readonly sponsoredOptions: ComboboxOption[] = [
    { value: 'true', label: 'Sim' },
    { value: 'false', label: 'Não' },
  ];

  ngOnInit(): void {
    const defaultState = this.formData().estado || 'PB';
    this.patch({ estado: defaultState });
  }

  ngAfterViewInit() {
    this.previousActiveElement = document.activeElement as HTMLElement | null;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    queueMicrotask(() => {
      const target =
        (this.el.nativeElement.querySelector('[data-autofocus]') as HTMLElement | null) ??
        this.firstField()?.nativeElement ??
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

  patch(partial: Partial<EventFormState>) {
    this.formData.update((f) => ({ ...f, ...partial }));
  }

  updatePercurso(field: keyof EventFormState['percurso'], value: string) {
    this.formData.update((f) => ({
      ...f,
      percurso: { ...f.percurso, [field]: value },
    }));
  }

  updateKit(index: number, field: keyof KitForm, value: string) {
    this.formData.update((f) => ({
      ...f,
      kits: f.kits.map((kit, i) =>
        i === index ? { ...kit, [field]: value } : kit,
      ),
    }));
  }

  toDateTimeLocal(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  fromDatetimeLocal(value: string): string {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
  }
}
