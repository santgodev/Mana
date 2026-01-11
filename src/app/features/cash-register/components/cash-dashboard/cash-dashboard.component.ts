import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CashService } from '../../../../core/services/cash.service';
import { AuthService } from '../../../../core/services/auth.service';
import { CashShift, CashTransaction } from '../../../../models/supabase.types';
import { MatDialog } from '@angular/material/dialog';
import { TransactionDialogComponent } from '../transaction-dialog/transaction-dialog.component';
import { CashClosureDialogComponent } from '../cash-closure-dialog/cash-closure-dialog.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-cash-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatListModule
    ],
    template: `
    <div class="dashboard-grid">
       <!-- Header Info -->
       <div class="header-status">
           <div class="status-badge pulse">
               <span class="dot"></span> Caja Abierta
           </div>
           <div class="shift-info">
               <span>Inicio: {{ shift.opened_at | date:'shortTime' }}</span>
               <span class="user-pill">{{ (userEmail$ | async) }}</span>
           </div>
       </div>

       <!-- Metrics Cards -->
       <div class="metrics-row">
           <div class="metric-card base">
               <span class="label">Base Inicial</span>
               <span class="value">{{ summary.base | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
           </div>
           
           <div class="metric-card incomes">
               <span class="label">Ventas + Entradas</span>
               <span class="value success">+{{ (summary.totalSalesCash + summary.totalIncomes) | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
           </div>

           <div class="metric-card expenses">
               <span class="label">Gastos / Salidas</span>
               <span class="value danger">-{{ summary.totalExpenses | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
           </div>

           <div class="metric-card total-expected">
               <span class="label">Total en Caja (Estimado)</span>
               <span class="value gold">{{ summary.expectedTotal | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
           </div>
       </div>

       <!-- Actions -->
       <div class="actions-toolbar">
           <button mat-raised-button color="warn" (click)="openTransaction('expense')">
               <mat-icon>remove_circle</mat-icon> Registrar Gasto
           </button>
           
           <button mat-raised-button class="income-btn" (click)="openTransaction('income')">
               <mat-icon>add_circle</mat-icon> Ingreso Extra
           </button>

           <span class="spacer"></span>
           
           <button mat-stroked-button class="close-btn" (click)="openClosure()">
               <mat-icon>lock</mat-icon> Cerrar Caja
           </button>
       </div>

       <!-- Transactions History -->
       <div class="history-section">
           <h3>Movimientos Recientes</h3>
           <mat-list>
               <mat-list-item *ngFor="let t of recentTransactions">
                   <mat-icon matListItemIcon [class.red-icon]="t.type === 'expense'" [class.green-icon]="t.type === 'income'">
                       {{ t.type === 'expense' ? 'arrow_downward' : 'arrow_upward' }}
                   </mat-icon>
                   <span matListItemTitle>{{ t.description }}</span>
                   <span matListItemLine>{{ t.created_at | date:'mediumTime' }}</span>
                   <span matListItemMeta [class.red-text]="t.type === 'expense'" [class.green-text]="t.type === 'income'">
                       {{ t.amount | currency:'CAD':'symbol-narrow':'1.0-0' }}
                   </span>
               </mat-list-item>
               <mat-list-item *ngIf="recentTransactions.length === 0">
                   <span matListItemTitle style="color: #999; text-align: center">Sin movimientos manueles hoy</span>
               </mat-list-item>
           </mat-list>
       </div>
    </div>
  `,
    styles: [`
    .dashboard-grid {
        display: flex;
        flex-direction: column;
        gap: 24px;
        padding: 24px;
        max-width: 1600px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
    }
    .header-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        padding: 16px 24px;
        border-radius: 16px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }
    .status-badge {
        background: #e8f5e9;
        color: #2e7d32;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .dot {
        width: 10px; height: 10px; background: #2e7d32; border-radius: 50%;
    }
    .shift-info {
        display: flex;
        gap: 16px;
        align-items: center;
        color: #666;
    }
    .metrics-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
    }
    .metric-card {
        background: white;
        padding: 24px;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        gap: 8px;
    }
    .metric-card.total-expected {
        background: radial-gradient(circle at top right, #3e2217, #2C1810);
        color: white;
    }
    .metric-card.total-expected .label { color: rgba(255,255,255,0.7); }
    .label { font-size: 0.9rem; color: #888; font-weight: 500; }
    .value { font-size: 2rem; font-weight: 700; font-family: 'Poppins', sans-serif; }
    
    .value.success { color: #2e7d32; }
    .value.danger { color: #c62828; }
    .value.gold { color: #D4AF37; }

    .actions-toolbar {
        display: flex;
        gap: 16px;
        padding: 24px;
        background: #fafaf9;
        border-radius: 20px;
        align-items: center;
    }
    .spacer { flex: 1; }
    .income-btn { background-color: #2e7d32 !important; color: white !important; }
    .close-btn { border-color: #2C1810; color: #2C1810; border-width: 2px; }

    .history-section {
        display: flex;
        flex-direction: column;
        /* Align with the inner content of the cards above (24px padding) */
        padding: 0 24px; 
    }
    .history-section h3 {
        margin: 0 0 16px 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: #2C1810;
        font-family: 'Poppins', sans-serif;
    }
    mat-list {
        background: transparent !important;
        padding-top: 0 !important;
    }
    mat-list-item {
        margin-bottom: 8px;
        border-radius: 12px;
        /* optional: add a subtle background to items to make them distinct 'rows' */
        /* background: white; */ 
    }
    .red-icon { color: #c62828; }
    .green-icon { color: #2e7d32; }
    .red-text { color: #c62828; font-weight: 600; }
    .green-text { color: #2e7d32; font-weight: 600; }
  `]
})
export class CashDashboardComponent implements OnInit {
    @Input() shift!: CashShift;
    summary = {
        base: 0,
        totalSalesCash: 0,
        totalIncomes: 0,
        totalExpenses: 0,
        expectedTotal: 0
    };
    recentTransactions: CashTransaction[] = [];
    userEmail$;

    constructor(
        private cashService: CashService,
        private authService: AuthService,
        private dialog: MatDialog
    ) {
        this.userEmail$ = this.authService.user$.pipe(map(u => u?.email));
    }

    ngOnInit() {
        this.refreshData();
    }

    async refreshData() {
        if (!this.shift) return;
        try {
            this.summary = await this.cashService.getShiftSummary(this.shift.id);
            this.recentTransactions = await this.cashService.getShiftTransactions(this.shift.id);
        } catch (e) {
            console.error('Error fetching cash summary', e);
        }
    }

    openTransaction(type: 'expense' | 'income') {
        const dialogRef = this.dialog.open(TransactionDialogComponent, {
            width: '500px',
            data: { type }
        });

        dialogRef.afterClosed().subscribe(res => {
            if (res) this.refreshData();
        });
    }

    openClosure() {
        const dialogRef = this.dialog.open(CashClosureDialogComponent, {
            width: '600px',
            data: { summary: this.summary, shiftId: this.shift.id }
        });
    }
}
