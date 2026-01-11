import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { Profile } from '../../models/supabase.types';
import { AuthService } from '../../core/services/auth.service';

interface Notification {
  id: number;
  title: string;
  message: string;
  icon: string;
  time: string;
  read: boolean;
}

@Component({
  selector: 'app-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrls: ['./toolbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule
  ]
})
export class ToolbarComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  currentUser: Profile | null = null;
  notificationCount = 3;
  notifications: Notification[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to profile changes
    this.authService.profile$.subscribe(profile => {
      this.currentUser = profile;
    });
    this.loadNotifications();
  }

  private loadNotifications(): void {
    // Mock notifications
    this.notifications = [
      {
        id: 1,
        title: 'Stock Bajo',
        message: 'El producto "Laptop HP Pavilion" tiene stock bajo (5 unidades)',
        icon: 'warning',
        time: 'Hace 2 horas',
        read: false
      },
      {
        id: 2,
        title: 'Nueva Venta',
        message: 'Se registró una nueva venta por $199.99',
        icon: 'point_of_sale',
        time: 'Hace 4 horas',
        read: false
      },
      {
        id: 3,
        title: 'Inventario Actualizado',
        message: 'Se actualizó el inventario de productos electrónicos',
        icon: 'inventory',
        time: 'Ayer',
        read: true
      }
    ];
  }

  onProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSettings(): void {
    this.router.navigate(['/settings']);
  }

  onLogout(): void {
    this.authService.signOut();
  }
}
