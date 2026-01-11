import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Table } from '../../../../models/supabase.types';
import { OrderService } from '../../../../core/services/order.service';

@Component({
    selector: 'app-table-bill-preview-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule
    ],
    template: `
    <div class="bill-preview-container">
      <div class="dialog-header">
        <h2>Cuenta - Mesa {{ data.table.number }}</h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="loading-state" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Calculando cuenta...</p>
      </div>

      <div class="content" *ngIf="!loading">
        <div class="empty-state" *ngIf="items.length === 0">
          <mat-icon>receipt</mat-icon>
          <p>No hay pedidos en esta sesión.</p>
        </div>

        <div class="order-list" *ngIf="items.length > 0">
          <div class="item-row" *ngFor="let item of items">
            <div class="item-details">
              <span class="qty">{{ item.quantity }}x</span>
              <span class="name">{{ item.product?.name || 'Producto' }}</span>
            </div>
            <span class="price">\${{ (item.unit_price * item.quantity) | number }}</span>
          </div>
        </div>

        <div class="summary-section">
          <div class="total-row">
            <span>Total a Pagar</span>
            <span class="amount">\${{ total | number }}</span>
          </div>
        </div>
      </div>

      <div class="dialog-actions">
        <button mat-stroked-button color="warn" (click)="close()">Cancelar</button>
        <button mat-raised-button color="primary" class="confirm-btn" (click)="confirmClose()">
          <mat-icon>payments</mat-icon>
          Cerrar Mesa y Finalizar
        </button>
      </div>
    </div>
  `,
    styles: [`
    .bill-preview-container {
      padding: 0;
      font-family: 'Outfit', sans-serif;
      color: #2C1810;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #eee;

      h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 700;
      }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
      color: #666;
    }

    .content {
      padding: 24px;
      max-height: 60vh;
      overflow-y: auto;
    }

    .empty-state {
      text-align: center;
      color: #999;
      padding: 20px;
      mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }
    }

    .order-list {
      margin-bottom: 24px;
    }

    .item-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px dashed #eee;
      font-size: 0.95rem;

      &:last-child {
        border-bottom: none;
      }

      .item-details {
        display: flex;
        gap: 8px;
        
        .qty {
          font-weight: 700;
          color: #D4AF37; /* Gold for qty */
        }
      }

      .price {
        font-weight: 600;
      }
    }

    .summary-section {
      background: #faf9f6;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #eee;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 1.1rem;
      font-weight: 800;
      
      .amount {
        color: #2e7d32;
        font-size: 1.4rem;
      }
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #eee;
      background: #fff;
    }

    .confirm-btn {
      background-color: #2C1810; /* Coffee dark */
      color: #fff;
    }
  `]
})
export class TableBillPreviewDialogComponent implements OnInit {
    items: any[] = [];
    total: number = 0;
    loading: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<TableBillPreviewDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { table: Table },
        private orderService: OrderService
    ) { }

    async ngOnInit() {
        try {
            this.items = await this.orderService.getActiveOrderItems(this.data.table.id);
            this.calculateTotal();
        } catch (error) {
            console.error('Error loading bill preview', error);
        } finally {
            this.loading = false;
        }
    }

    calculateTotal() {
        this.total = this.items.reduce((sum, item) => {
            // Assuming item has quantity and unit_price (based on OrderService response)
            return sum + (item.quantity * item.unit_price);
        }, 0);
    }

    close() {
        this.dialogRef.close(false);
    }

    confirmClose() {
        this.dialogRef.close(true);
    }
}
