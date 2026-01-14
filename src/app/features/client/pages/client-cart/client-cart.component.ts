import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientCartService, CartItem } from '../../../../core/services/client-cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner'; // Ensure imported if used or remove
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Table, Order } from '../../../../models/supabase.types';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
    selector: 'app-client-cart',
    standalone: true,
    imports: [
        CommonModule,
        MatListModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule,
        FormsModule,
        TranslatePipe
    ],
    template: `
    <div class="cart-container">
      <div class="page-header">
        <h1>{{ 'CART_TITLE' | translate }}</h1>
        <p *ngIf="tableId">{{ 'TABLE' | translate }} {{ tableId.substring(0,4) }}... (ID)</p>
      </div>
      
      <div class="loading-state-center" *ngIf="isInitialLoading">
        <div class="spinner"></div>
        <p>Cargando tu cuenta...</p>
      </div>

      <div class="empty-state" *ngIf="!isInitialLoading && cart.length === 0 && confirmedItems.length === 0">
        <div class="empty-icon-circle">
            <mat-icon>restaurant_menu</mat-icon>
        </div>
        <p>Tu carrito está vacío</p>
        <button class="btn-primary-ghost" (click)="goBack()">Ver Menú</button>
      </div>

      <div class="cart-content" *ngIf="cart.length > 0 || confirmedItems.length > 0">
        
        <!-- CONFIRMED ITEMS -->
        <div class="section-group" *ngIf="confirmedItems.length > 0">
            <div class="section-header">
                <mat-icon class="icon-success">check_circle</mat-icon>
                <span>{{ 'SECTION_KITCHEN' | translate }}</span>
            </div>
            
            <div class="item-row confirmed" *ngFor="let item of confirmedItems">
                <div class="item-info">
                    <span class="item-qty">{{ item.quantity }}x</span>
                    <span class="item-name">{{ item.product.name }}</span>
                </div>
                <div class="item-price">\${{ item.quantity * item.unit_price | number }}</div>
            </div>
            
            <div class="section-footer">
                <span>{{ 'SUBTOTAL_CONFIRMED' | translate }}</span>
                <span>\${{ confirmedTotal | number }}</span>
            </div>
        </div>

        <!-- NEW ITEMS -->
        <div class="section-group new-order" *ngIf="cart.length > 0">
            <div class="section-header">
                <mat-icon class="icon-pending">shopping_cart</mat-icon>
                <span>{{ 'SECTION_NEW' | translate }}</span>
            </div>

            <div class="item-card" *ngFor="let item of cart; let i = index">
                <div class="card-main">
                    <span class="item-name">{{ item.product.name }}</span>
                    <span class="item-price">\${{ item.product.price * item.quantity | number }}</span>
                </div>
                
                <div class="card-controls">
                    <div class="qty-control">
                        <button (click)="decrease(i)" class="qty-btn minus"><mat-icon>remove</mat-icon></button>
                        <span class="qty-val">{{ item.quantity }}</span>
                        <button (click)="increase(i)" class="qty-btn plus"><mat-icon>add</mat-icon></button>
                    </div>
                </div>
                
                <!-- Note Input -->
                <div class="item-notes">
                    <mat-form-field appearance="outline" class="note-field" subscriptSizing="dynamic">
                        <mat-icon matPrefix>edit_note</mat-icon>
                        <input matInput placeholder="Notas (ej. Sin cebolla)" 
                               [ngModel]="item.notes" 
                               (ngModelChange)="updateItemNote(i, $event)">
                    </mat-form-field>
                </div>
            </div>
        </div>

        <!-- FOOTER ACTIONS -->
        <div class="sticky-footer">
            <div class="total-row">
                <span>{{ 'TOTAL_PAY' | translate }}</span>
                <span class="total-amount">\${{ grandTotal | number }}</span>
            </div>
            
            <div class="action-buttons">
                <button class="btn-secondary" (click)="goBack()">
                   <mat-icon>add</mat-icon> {{ 'BTN_MORE' | translate }}
                </button>
                
                <button class="btn-primary" (click)="confirmOrder()" [disabled]="isProcessing || cart.length === 0" 
                        *ngIf="cart.length > 0">
                    {{ isProcessing ? ('SENDING' | translate) : ('BTN_CONFIRM' | translate) + ' (\$' + (total | number) + ')' }}
                </button>

                 <button class="btn-primary disabled-look" *ngIf="cart.length === 0">
                   {{ 'WAITING_ITEMS' | translate }}
                </button>
            </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .cart-container { 
        padding: 24px 20px 100px; /* Bottom padding for sticky footer */
        background: #faf9f6;
        min-height: 100vh;
        font-family: 'Outfit', sans-serif;
    }
    
    .page-header { margin-bottom: 24px; text-align: center; }
    .page-header h1 { font-weight: 800; color: #2C1810; margin: 0; font-size: 1.8rem; }
    .page-header p { color: #8c8c8c; margin: 4px 0 0; font-size: 0.9rem; }
    
    .loading-state-center {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 50px 0;
        gap: 16px;
    }
    .spinner {
      width: 40px; 
      height: 40px;
      border: 4px solid #eee;
      border-top-color: #D4AF37;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-top: 60px;
        gap: 16px;
    }
    .empty-icon-circle {
        width: 80px; height: 80px; background: #e0e0e0; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        color: #fff;
    }
    .empty-icon-circle mat-icon { font-size: 40px; width: 40px; height: 40px; }

    /* SECTIONS */
    .section-group {
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    }
    .section-group.new-order {
        border: 1px solid rgba(212, 175, 55, 0.3); /* Gold tint */
    }

    .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 16px;
        font-weight: 700;
        color: #2C1810;
        font-size: 0.95rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    .icon-success { color: #2e7d32; }
    .icon-pending { color: #D4AF37; }

    /* CONFIRMED ROW */
    .item-row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px dashed #eee;
    }
    .item-row:last-child { border-bottom: none; }
    .item-info { display: flex; gap: 8px; color: #444; }
    .item-qty { font-weight: 700; color: #2C1810; }
    .item-price { font-weight: 600; color: #666; }
    
    .section-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        font-weight: 700;
        color: #888;
        font-size: 0.9rem;
    }

    /* NEW ITEM CARD */
    .item-card {
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
    }
    .item-card:last-child { border-bottom: none; }
    .card-main {
        display: flex;
        justify-content: space-between;
        margin-bottom: 12px;
        font-weight: 600;
        color: #2C1810;
        font-size: 1.05rem;
    }
    
    .qty-control {
        display: inline-flex;
        align-items: center;
        background: #f5f5f5;
        border-radius: 24px;
        padding: 4px;
    }
    .qty-btn {
        width: 32px; height: 32px; border-radius: 50%; border: none;
        background: white; color: #2C1810;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
    }
    .qty-btn:active { background: #eee; }
    .qty-val { margin: 0 16px; font-weight: 700; min-width: 20px; text-align: center; }

    .item-notes {
        padding: 0 12px 0;
    }
    .note-field {
        width: 100%;
        font-size: 0.9rem;
    }
    .note-field ::ng-deep .mat-mdc-form-field-wrapper {
        padding-bottom: 0;
    }
    .note-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
    }

    /* FOOTER */
    .sticky-footer {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        background: white;
        padding: 20px;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.05);
        border-top-left-radius: 24px;
        border-top-right-radius: 24px;
        z-index: 100;
    }
    
    .total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
    }
    .total-row span:first-child { font-size: 1rem; color: #666; font-weight: 600; }
    .total-amount { font-size: 1.8rem; font-weight: 800; color: #2C1810; }

    .action-buttons {
        display: flex;
        gap: 12px;
    }
    
    button {
        font-family: 'Outfit', sans-serif;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.1s;
    }
    button:active { transform: scale(0.98); }

    .btn-primary {
        flex: 2;
        background: linear-gradient(135deg, #2C1810, #4A2C20);
        color: #D4AF37;
        border: none;
        height: 56px;
        border-radius: 16px;
        font-size: 1rem;
        box-shadow: 0 8px 20px rgba(44, 24, 16, 0.25);
    }
    .btn-primary:disabled { opacity: 0.7; }
    
    .btn-primary.disabled-look {
        background: #eee; color: #aaa; box-shadow: none;
    }

    .btn-secondary {
        flex: 1;
        background: #fff;
        border: 2px solid #f0f0f0;
        color: #2C1810;
        height: 56px;
        border-radius: 16px;
        font-size: 1rem;
        display: flex; align-items: center; justify-content: center; gap: 4px;
    }
    
    .btn-primary-ghost {
        background: transparent; border: 1px solid #D4AF37; color: #2C1810;
        padding: 10px 24px; border-radius: 24px; font-weight: 600;
    }
  `]
})
export class ClientCartComponent implements OnInit {
    cart: CartItem[] = [];
    confirmedItems: any[] = []; // Store DB items
    total = 0;
    confirmedTotal = 0;
    grandTotal = 0;

    isProcessing = false;
    isInitialLoading = true;
    tableId: string | null = null;

    constructor(
        private cartService: ClientCartService,
        private router: Router,
        private route: ActivatedRoute, // Inject ActivatedRoute
        private orderService: OrderService,
        private snackBar: MatSnackBar
    ) { }

    updateItemNote(index: number, note: string) {
        this.cartService.updateNote(index, note);
    }

    ngOnInit() {
        // 1. Check URL Params for Table ID (Priority)
        this.route.paramMap.subscribe(params => {
            const id = params.get('tableId');
            if (id) {
                this.tableId = id;
                this.cartService.setTableId(id); // Sync service
                // Load confirmed items (Previously ordered)
                this.loadConfirmedItems(id);
            }
        });

        // 2. Fallback to Service (if navigating internally without params)
        this.cartService.tableId$.subscribe(id => {
            if (id && !this.tableId) {
                this.tableId = id;
                // DO NOT Load confirmed items
            }
        });

        this.cartService.cart$.subscribe(cart => {
            this.cart = cart;
            this.calculateTotals();
        });
    }

    async loadConfirmedItems(tableId: string) {
        try {
            this.isInitialLoading = true;
            this.confirmedItems = await this.orderService.getActiveOrderItems(tableId);
            this.calculateTotals();
        } catch (error) {
            console.error('Error loading confirmed items', error);
        } finally {
            this.isInitialLoading = false;
        }
    }

    calculateTotals() {
        // Calculate Confirmed Total
        this.confirmedTotal = this.confirmedItems.reduce((sum, item) => {
            return sum + (item.quantity * item.unit_price);
        }, 0);

        // Active Cart Total
        this.total = this.cartService.totalPrice;

        this.grandTotal = this.total + this.confirmedTotal;
    }

    increase(index: number) {
        this.cartService.updateQuantity(index, this.cart[index].quantity + 1);
    }

    decrease(index: number) {
        this.cartService.updateQuantity(index, this.cart[index].quantity - 1);
    }

    goBack() {
        if (this.tableId) {
            this.router.navigate(['/client/menu', this.tableId]);
        } else {
            this.snackBar.open('Error: Mesa no identificada', 'Cerrar');
        }
    }

    async confirmOrder() {
        if (!this.tableId) {
            this.snackBar.open('Error: No hay mesa asignada. Escanea el QR nuevamente.', 'Cerrar');
            return;
        }

        this.isProcessing = true;
        try {
            await this.orderService.createClientOrder(this.tableId, this.cart);

            this.cartService.clearCart();
            this.snackBar.open('¡Pedido enviado a cocina!', 'Ok', { duration: 4000 });

            // Redirect to Menu instead of showing empty cart or history
            this.router.navigate(['/client/menu', this.tableId]);

        } catch (error) {
            console.error(error);
            this.snackBar.open('Error al enviar pedido', 'Cerrar');
        } finally {
            this.isProcessing = false;
        }
    }
}
