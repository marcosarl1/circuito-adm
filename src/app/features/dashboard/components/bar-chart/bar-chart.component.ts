import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { ApexOptions } from 'apexcharts';
import { LazyApexChartComponent } from '../lazy-apex-chart/lazy-apex-chart.component';
import 'apexcharts/bar';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [LazyApexChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block w-full' },
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    app-lazy-apex-chart {
      display: block;
      width: 100%;
    }
  `,
  template: `<app-lazy-apex-chart [options]="options()" [class]="klass()" />`,
})
export class BarChartComponent {
  options = input.required<ApexOptions>();
  klass = input('w-full');
}
