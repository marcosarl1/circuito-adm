import { Component, input, output } from '@angular/core';
import type { ApexOptions } from 'apexcharts';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { BarChartComponent } from '../bar-chart/bar-chart.component';

export interface MesResumo {
  label: string;
  count: number;
}

export interface EstadoResumo {
  estado: string;
  count: number;
}

export interface CidadeResumo {
  cidade: string;
  count: number;
}

@Component({
  selector: 'app-dashboard-trends',
  standalone: true,
  imports: [IconComponent, BarChartComponent],
  templateUrl: './trends-section.component.html',
})
export class TrendsSectionComponent {
  evolucao = input.required<ApexOptions>();
  meses = input.required<MesResumo[]>();
  localView = input.required<'estado' | 'cidade'>();
  estados = input.required<EstadoResumo[]>();
  estadoMax = input.required<number>();
  estadoPage = input.required<number>();
  estadoTotalPages = input.required<number>();
  cidades = input.required<CidadeResumo[]>();
  cidadeMax = input.required<number>();
  cidadePage = input.required<number>();
  cidadeTotalPages = input.required<number>();

  toggleLocal = output<'estado' | 'cidade'>();
  prevEstado = output<void>();
  nextEstado = output<void>();
  prevCidade = output<void>();
  nextCidade = output<void>();
}
