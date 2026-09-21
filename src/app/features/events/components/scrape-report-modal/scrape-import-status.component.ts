import { Component, input } from '@angular/core';
import { ScrapeImportResult } from '../../models/scrape.model';

@Component({
  selector: 'app-scrape-import-status',
  standalone: true,
  imports: [],
  templateUrl: './scrape-import-status.component.html',
})
export class ScrapeImportStatusComponent {
  result = input<ScrapeImportResult | null>(null);
  importing = input(false);
  error = input<string | null>(null);
}
