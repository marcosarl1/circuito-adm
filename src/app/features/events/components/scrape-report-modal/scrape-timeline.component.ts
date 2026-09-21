import { Component, input } from '@angular/core';
import { ScrapeScraperResult } from '../../models/scrape.model';

export interface TimelineMetaView {
  totalWall: number | null;
  totalFromScrapers: number;
  startLabel: string | null;
  endLabel: string | null;
}

export interface TimelineBarView extends ScrapeScraperResult {
  width: number;
  isBottleneck: boolean;
}

export interface ScrapeTimelineView {
  show: boolean;
  meta: TimelineMetaView | null;
  bars: TimelineBarView[];
}

@Component({
  selector: 'app-scrape-timeline',
  standalone: true,
  imports: [],
  templateUrl: './scrape-timeline.component.html',
})
export class ScrapeTimelineComponent {
  view = input.required<ScrapeTimelineView>();
}
