import { Component, input, output } from '@angular/core';

export type CsvSortKey =
  | 'total'
  | 'duplicados'
  | 'fonte'
  | 'sem_preco'
  | 'sem_imagem'
  | 'passados';

@Component({
  selector: 'app-csv-sort-button',
  standalone: true,
  imports: [],
  template: `
    <button
      type="button"
      class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 min-h-[44px] text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-teal-500)]"
      [class.bg-[rgba(142,202,230,0.14)]]="active()"
      [class.text-[var(--foreground)]]="active()"
      [class.text-[var(--color-text-secondary)]]="!active()"
      [class.hover:text-[var(--foreground)]]="!active()"
      (click)="sort.emit(sortKey())"
      [attr.title]="active() ? 'Ordenado ' + dir() : idleTitle()"
    >
      {{ label() }}
      @if (active()) {
        <svg
          width="16"
          height="16"
          viewBox="0 0 256 256"
          fill="currentColor"
          class="shrink-0"
          aria-hidden="true"
        >
          <path
            [attr.d]="
              dir() === 'asc'
                ? 'M205.66,117.66a8,8,0,0,1-11.32,0L136,59.31V216a8,8,0,0,1-16,0V59.31L61.66,117.66a8,8,0,0,1-11.32-11.32l72-72a8,8,0,0,1,11.32,0l72,72A8,8,0,0,1,205.66,117.66Z'
                : 'M205.66,149.66l-72,72a8,8,0,0,1-11.32,0l-72-72a8,8,0,0,1,11.32-11.32L120,196.69V40a8,8,0,0,1,16,0V196.69l58.34-58.35a8,8,0,0,1,11.32,11.32Z'
            "
          ></path>
        </svg>
      } @else {
        <svg
          width="16"
          height="16"
          viewBox="0 0 256 256"
          fill="currentColor"
          class="shrink-0 opacity-50"
          aria-hidden="true"
        >
          <path
            d="M117.66,170.34a8,8,0,0,1,0,11.32l-32,32a8,8,0,0,1-11.32,0l-32-32a8,8,0,0,1,11.32-11.32L72,188.69V48a8,8,0,0,1,16,0V188.69l18.34-18.35A8,8,0,0,1,117.66,170.34Zm96-96-32-32a8,8,0,0,0-11.32,0l-32,32a8,8,0,0,0,11.32,11.32L168,67.31V208a8,8,0,0,0,16,0V67.31l18.34,18.35a8,8,0,0,0,11.32-11.32Z"
          ></path>
        </svg>
      }
    </button>
  `,
})
export class CsvSortButtonComponent {
  label = input.required<string>();
  sortKey = input.required<CsvSortKey>();
  active = input.required<boolean>();
  dir = input.required<'asc' | 'desc'>();
  idleTitle = input.required<string>();

  sort = output<CsvSortKey>();
}
