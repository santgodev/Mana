import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { ClientCartService, CartItem } from '../../../core/services';
import { TranslationService, Language } from '../../../core/services/translation.service';
import { TableService } from '../../../core/services/table.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatRippleModule
  ],
  template: `
    <div class="client-layout">
      <!-- Premium Navbar -->
      <div class="premium-navbar">
        <div class="brand-logo">
            <span class="brand-text">Coffee<span class="gold">House</span></span>
        </div>
        
        <div class="navbar-actions">
            <!-- Language Toggle -->
            <div class="lang-toggle" (click)="toggleLanguage()" mat-ripple>
                <img [src]="currentLang === 'es' ? 'https://flagcdn.com/w40/co.png' : 'https://flagcdn.com/w40/us.png'" alt="Lang">
                <span>{{ currentLang.toUpperCase() }}</span>
            </div>

            <!-- Table Info -->
            <div class="table-badge" *ngIf="tableName">
                <span>{{ tableName }}</span>
            </div>

            <!-- Cart Trigger -->
            <div class="cart-trigger" (click)="goToCart()" mat-ripple>
                <div class="icon-box">
                    <mat-icon>shopping_bag</mat-icon>
                </div>
                <div class="badge-dot" *ngIf="cartCount > 0">{{ cartCount }}</div>
            </div>
        </div>
      </div>

      <div class="client-content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .client-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #faf9f6;
      font-family: 'Outfit', sans-serif;
    }
    
    .premium-navbar {
      height: 70px;
      padding: 0 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.03);
      position: sticky;
      top: 0;
      z-index: 999;
      border-bottom: 1px solid rgba(0,0,0,0.03);
    }

    .brand-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #2C1810;
    }
    .gold { color: #D4AF37; }

    .navbar-actions {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .lang-toggle {
        display: flex;
        align-items: center;
        gap: 6px;
        background: #F5EFEB;
        padding: 8px 16px; /* Larger touch area */
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.8rem;
        color: #2C1810;
        cursor: pointer;
        transition: transform 0.2s;
        border: 1px solid rgba(0,0,0,0.05);
        margin-right: 8px;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
    }
    .lang-toggle:active { transform: scale(0.95); }
    .lang-toggle img { width: 18px; height: 18px; border-radius: 50%; object-fit: cover; }

    .table-badge {
        background: #F5EFEB;
        color: #8B5A2B;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 0.85rem;
        display: none; 
    }
    @media (min-width: 380px) { .table-badge { display: block; } }

    .cart-trigger {
        position: relative;
        cursor: pointer;
        width: 48px; height: 48px;
        display: flex; align-items: center; justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
    }
    .cart-trigger:active { background: #f0f0f0; }

    .icon-box {
        color: #2C1810;
        display: flex; align-items: center; justify-content: center;
    }
    .icon-box mat-icon { font-size: 26px; width: 26px; height: 26px; }

    .badge-dot {
        position: absolute;
        top: 6px; right: 6px;
        background: #D4AF37;
        color: white;
        font-weight: 700;
        font-size: 0.7rem;
        height: 18px; min-width: 18px;
        border-radius: 9px;
        padding: 0 5px;
        display: flex; align-items: center; justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .client-content {
      flex: 1;
      overflow-y: auto;
      scroll-behavior: smooth;
    }
  `]
})
export class ClientLayoutComponent {
  cartCount = 0;
  tableId: string | null = null;
  tableName: string | null = null;
  currentLang: Language = 'es';

  constructor(
    private cartService: ClientCartService,
    private router: Router,
    private translation: TranslationService,
    private tableService: TableService
  ) {
    this.cartService.cart$.subscribe((cart: CartItem[]) => {
      this.cartCount = cart.reduce((acc: number, item: CartItem) => acc + item.quantity, 0);
    });
    this.cartService.tableId$.subscribe(id => {
      this.tableId = id;
      if (id) {
        this.loadTableInfo(id);
      }
    });
    this.translation.currentLang$.subscribe(lang => this.currentLang = lang);
  }

  toggleLanguage() {
    const newLang = this.currentLang === 'es' ? 'en' : 'es';
    this.translation.setLanguage(newLang);
  }

  goToCart() {
    if (this.tableId) {
      this.router.navigate(['/client/cart', this.tableId]);
    } else {
      this.router.navigate(['/client/cart']);
    }
  }
  loadTableInfo(id: string) {
    this.tableService.getTableById(id).then((table: any) => {
      if (table) {
        this.tableName = `Mesa ${table.number}`;
      }
    }).catch((err: any) => console.error('Error loading table info', err));
  }
}
