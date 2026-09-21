import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import 'apexcharts/donut';

@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [ChartCoreComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    apx-chart-core {
      display: block;
      width: 100%;
    }
  `,
  template: `
    <apx-chart-core
      [series]="options().series!"
      [labels]="options().labels!"
      [colors]="options().colors!"
      [chart]="options().chart!"
      [plotOptions]="options().plotOptions!"
      [dataLabels]="options().dataLabels!"
      [legend]="options().legend!"
      [stroke]="options().stroke!"
      [tooltip]="options().tooltip!"
      [responsive]="options().responsive!"
      [class]="klass()"
    ></apx-chart-core>
  `,
})
export class DonutChartComponent {
  options = input.required<ApexOptions>();
  klass = input('w-full');
}
