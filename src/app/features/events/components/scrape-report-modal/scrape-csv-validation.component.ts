import { Component, input, output } from '@angular/core';
import { ScrapeCsvSummary } from '../../models/scrape.model';
import {
  CsvSortButtonComponent,
  CsvSortKey,
} from './csv-sort-button.component';

export interface CsvChipCounts {
  duplicados: number;
  sem_preco: number;
  sem_imagem: number;
  passados: number;
}

export interface ScrapeCsvView {
  has: boolean;
  chips: CsvChipCounts;
  alerts: number;
  onlyAlerts: boolean;
  query: string;
  noQueryResult: boolean;
  empty: boolean;
  list: ScrapeCsvSummary[];
  sortBy: CsvSortKey;
  sortDir: 'asc' | 'desc';
  totalFiles: number;
  filteredCount: number;
}

@Component({
  selector: 'app-scrape-csv-validation',
  standalone: true,
  imports: [CsvSortButtonComponent],
  templateUrl: './scrape-csv-validation.component.html',
})
export class ScrapeCsvValidationComponent {
  view = input.required<ScrapeCsvView>();

  toggleOnlyAlerts = output<void>();
  showAll = output<void>();
  queryChange = output<string>();
  sortChange = output<CsvSortKey>();
}
