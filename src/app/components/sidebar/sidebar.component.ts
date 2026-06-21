import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  menuItems = [
    { label: 'Eventos', route: '/events', icon: 'EV' },
    { label: 'Postagens', route: '/posts', icon: 'PO' }
  ];

  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
