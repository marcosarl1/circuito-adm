import { Component, input } from '@angular/core';
import { DashboardStats } from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [],
  templateUrl: './summary-cards.component.html',
})
export class SummaryCardsComponent {
  stats = input.required<DashboardStats>();
  ticketMedio = input.required<string>();
}
