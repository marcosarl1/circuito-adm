import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ChartCoreComponent } from 'ng-apexcharts';
import type { ApexOptions } from 'ng-apexcharts';
import 'apexcharts/bar';

@Component({
  selector: 'app-bar-chart',
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
      [chart]="options().chart!"
      [plotOptions]="options().plotOptions!"
      [colors]="options().colors!"
      [dataLabels]="options().dataLabels!"
      [xaxis]="options().xaxis!"
      [yaxis]="options().yaxis!"
      [grid]="options().grid!"
      [tooltip]="options().tooltip!"
      [legend]="options().legend!"
      [noData]="options().noData!"
      [states]="options().states!"
      [class]="klass()"
    ></apx-chart-core>
  `,
})
export class BarChartComponent {
  options = input.required<ApexOptions>();
  klass = input('w-full');
}
