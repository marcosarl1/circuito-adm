import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

export interface ScraperStatusView {
  fonte: string;
  display: string;
  count: number;
  semLink: number;
  semRegulamento: number;
  semImagem: number;
  semPreco: number;
  relativo: string;
  status: 'ok' | 'atrasado';
  dataSync: string;
  diffD: number;
  totalPendencias: number;
}

@Component({
  selector: 'app-dashboard-health',
  standalone: true,
  imports: [IconComponent, RouterLink],
  templateUrl: './system-health.component.html',
})
export class SystemHealthComponent {
  scrapers = input.required<ScraperStatusView[]>();
  open = input.required<Set<string>>();

  toggle = output<string>();

  isOpen(fonte: string): boolean {
    return this.open().has(fonte);
  }
}
