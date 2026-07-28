import {
  afterRenderEffect,
  Component,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import {
  Combobox,
  ComboboxPopup,
  ComboboxWidget,
} from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';

export interface ComboboxOption {
  value: string;
  label: string;
  prefix?: string;
}

@Component({
  selector: 'app-combobox',
  imports: [
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
  ],
  templateUrl: './combobox.component.html',
})
export class ComboboxComponent {
  private overlay = inject(Overlay);

  id = input.required<string>();
  items = input.required<readonly ComboboxOption[]>();
  value = model<string | null>(null);
  placeholder = input('Selecionar...');
  emptyMessage = input('Nenhuma opção encontrada');
  ariaLabelledby = input<string | undefined>();
  ariaRequired = input(false, { transform: booleanAttribute });

  popupExpanded = signal(false);
  searchTerm = signal('');
  private isFiltering = signal(false);
  selectedValues = signal<string[]>([]);
  private listbox = viewChild(Listbox);
  readonly scrollStrategy = this.overlay.scrollStrategies.close();

  filteredItems = computed(() => {
    if (!this.isFiltering()) return this.items();

    const term = this.normalize(this.searchTerm().trim());
    if (!term) return this.items();

    return this.items().filter(
      (item) =>
        this.normalize(item.label).includes(term) ||
        (item.prefix ? this.normalize(item.prefix).includes(term) : false),
    );
  });

  constructor() {
    effect(() => {
      const selected = this.items().find((item) => item.value === this.value());
      this.selectedValues.set(selected ? [selected.value] : []);

      if (!this.popupExpanded()) {
        this.searchTerm.set(selected?.label ?? '');
        this.isFiltering.set(false);
      }
    });

    afterRenderEffect(() => {
      this.listbox()?.scrollActiveItemIntoView();
    });
  }

  openPopup() {
    this.isFiltering.set(false);
    this.popupExpanded.set(true);
  }

  togglePopup() {
    if (this.popupExpanded()) {
      this.popupExpanded.set(false);
      return;
    }

    this.openPopup();
  }

  onSearch(value: string) {
    this.searchTerm.set(value);
    this.isFiltering.set(true);
    this.popupExpanded.set(true);
  }

  select(value: string) {
    this.value.set(value);
    this.popupExpanded.set(false);
  }

  commitSelection() {
    const value = this.selectedValues()[0];
    if (value) {
      this.select(value);
      return;
    }

    this.popupExpanded.set(false);
  }

  private normalize(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }
}
