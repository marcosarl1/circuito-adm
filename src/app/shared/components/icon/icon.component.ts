import { Component, Input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroArrowRightStartOnRectangle,
  heroBars3,
  heroCalendarDays,
  heroCheckCircle,
  heroCircleStack,
  heroClock,
  heroNewspaper,
  heroXMark,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      heroCircleStack,
      heroCheckCircle,
      heroClock,
      heroXMark,
      heroArrowDownTray,
      heroCalendarDays,
      heroNewspaper,
      heroArrowRightStartOnRectangle,
      heroBars3,
    }),
  ],
  template: `<ng-icon [name]="name" [size]="size" [color]="color" [strokeWidth]="strokeWidth" [class]="klass" style="display:flex;align-items:center;justify-content:center;line-height:0"></ng-icon>`,
})
export class IconComponent {
  @Input() name!: string;
  @Input() size = '14';
  @Input() color = 'currentColor';
  @Input() strokeWidth = '1.5';
  @Input() klass = '';
}
