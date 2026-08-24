import { Component, input, output } from '@angular/core';
import {
  ScrapeImportResult,
  ScrapeReport,
} from '../../models/scrape.model';

@Component({
  selector: 'app-scrape-report-modal',
  templateUrl: './scrape-report-modal.component.html',
})
export class ScrapeReportModalComponent {
  report = input<ScrapeReport | null>(null);
  importing = input(false);
  importResult = input<ScrapeImportResult | null>(null);
  error = input<string | null>(null);

  import = output<void>();
  close = output<void>();
}
