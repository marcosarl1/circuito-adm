import { Component, input } from '@angular/core';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface ScrapeHeaderView {
  hasReport: boolean;
  fontes: number;
  ok: number;
  falhas: number;
  duration: number;
  eventos: number;
  arquivos: number | null;
  tempoReal: number | null;
  tempoSomado: number;
}

@Component({
  selector: 'app-scrape-report-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './scrape-report-header.component.html',
})
export class ScrapeReportHeaderComponent {
  view = input.required<ScrapeHeaderView>();
}
