import { Component, input, output } from '@angular/core';
import { ScrapeScraperResult } from '../../models/scrape.model';

export interface ScrapeSourcesView {
  has: boolean;
  label: string | null;
  remaining: number;
  expanded: boolean;
  showExpand: boolean;
  total: number;
  failures: number;
  query: string;
  empty: boolean;
  list: ScrapeScraperResult[];
  selected: ScrapeScraperResult | null;
  selectedName: string | null;
}

@Component({
  selector: 'app-scrape-sources',
  standalone: true,
  imports: [],
  templateUrl: './scrape-sources.component.html',
})
export class ScrapeSourcesComponent {
  view = input.required<ScrapeSourcesView>();

  queryChange = output<string>();
  toggleExpanded = output<void>();
  toggleDetail = output<string>();
  closeDetail = output<void>();

  hasDetail(scraper: ScrapeScraperResult): boolean {
    return Boolean(scraper.detail || scraper.stderr);
  }
}
