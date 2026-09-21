import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { ApexOptions } from 'apexcharts';

interface ApexChartInstance {
  render(): Promise<void>;
  destroy(): void;
}

@Component({
  selector: 'app-lazy-apex-chart',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div #chart></div>`,
})
export class LazyApexChartComponent implements OnDestroy {
  options = input.required<ApexOptions>();

  private chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chart');
  private zone = inject(NgZone);
  private chart?: ApexChartInstance;
  private destroyed = false;

  constructor() {
    effect(() => {
      const options = this.options();
      void this.render(options);
    });
  }

  private async render(options: ApexOptions): Promise<void> {
    const { default: ApexCharts } = await import('apexcharts/core');
    if (this.destroyed) return;
    this.zone.runOutsideAngular(() => {
      this.chart?.destroy();
      const Ctor = ApexCharts as unknown as new (
        el: HTMLElement,
        opts: ApexOptions,
      ) => ApexChartInstance;
      const instance = new Ctor(this.chartEl().nativeElement, options);
      this.chart = instance;
      void instance.render();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.chart?.destroy();
    this.chart = undefined;
  }
}
