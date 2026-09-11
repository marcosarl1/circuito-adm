import { Component, Input } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  heroArrowDownTray,
  heroArrowPath,
  heroArrowRightStartOnRectangle,
  heroArrowUpTray,
  heroBars3,
  heroCalendarDays,
  heroChartBar,
  heroCheck,
  heroCheckCircle,
  heroChevronLeft,
  heroChevronRight,
  heroChevronUp,
  heroChevronDown,
  heroCircleStack,
  heroClipboard,
  heroClipboardDocument,
  heroClock,
  heroCloudArrowUp,
  heroLockClosed,
  heroLockOpen,
  heroMagnifyingGlass,
  heroNewspaper,
  heroPhoto,
  heroPlus,
  heroUserCircle,
  heroXMark,
} from '@ng-icons/heroicons/outline';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [NgIconComponent],
  providers: [
    provideIcons({
      heroCircleStack,
      heroCheck,
      heroCheckCircle,
      heroClock,
      heroXMark,
      heroArrowDownTray,
      heroArrowUpTray,
      heroCalendarDays,
      heroNewspaper,
      heroPhoto,
      heroLockClosed,
      heroLockOpen,
      heroClipboard,
      heroClipboardDocument,
      heroArrowRightStartOnRectangle,
      heroBars3,
      heroMagnifyingGlass,
      heroPlus,
      heroArrowPath,
      heroCloudArrowUp,
      heroUserCircle,
      heroChartBar,
      heroChevronLeft,
      heroChevronRight,
      heroChevronUp,
      heroChevronDown,
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
