import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { ApexOptions } from 'apexcharts';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { DonutChartComponent } from '../donut-chart/donut-chart.component';
import { Event } from '../../../../shared/models/event.model';

export interface DistanciaResumo {
  distancia: string;
  count: number;
}

export interface FonteResumo {
  fonte: string;
  count: number;
}

export interface InscricoesResumo {
  abertas: number;
  emBreve: number;
  encerradas: number;
}

@Component({
  selector: 'app-dashboard-operational',
  standalone: true,
  imports: [BarChartComponent, DonutChartComponent, RouterLink],
  templateUrl: './operational-section.component.html',
})
export class OperationalSectionComponent {
  distancias = input.required<ApexOptions>();
  distanciasTabela = input.required<DistanciaResumo[]>();
  view = input.required<'fontes' | 'inscricoes'>();
  fontes = input.required<ApexOptions>();
  fontesTop = input.required<FonteResumo[]>();
  pieColors = input.required<string[]>();
  inscricoesTotal = input.required<number>();
  statusDonut = input.required<ApexOptions>();
  inscricoes = input.required<InscricoesResumo>();
  proximos = input.required<Event[]>();
  proximos30d = input.required<number>();

  viewChange = output<'fontes' | 'inscricoes'>();
}
