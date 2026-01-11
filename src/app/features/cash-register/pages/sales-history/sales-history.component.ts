import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SupabaseService } from '../../../../core/services/supabase.service';
import { CashShift } from '../../../../models/supabase.types';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div class="history-container">
      <div class="welcome-section">
        <h1 class="welcome-title">Historial de Cierres</h1>
        <p class="welcome-subtitle">Registro histórico de dinero y ventas por turno</p>
      </div>

      <mat-card class="history-card">
        <div class="table-container">
          <table mat-table [dataSource]="shifts" class="w-full">
            
            <!-- Date Column -->
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef> Fecha </th>
              <td mat-cell *matCellDef="let element"> 
                <div class="date-cell">
                  <mat-icon class="date-icon">event</mat-icon>
                  <span>{{ element.opened_at | date:'dd MMM yyyy, HH:mm' }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Base Column -->
            <ng-container matColumnDef="base">
              <th mat-header-cell *matHeaderCellDef> Base </th>
              <td mat-cell *matCellDef="let element" class="amount-cell"> {{ element.base_amount | currency }} </td>
            </ng-container>

            <!-- Expected Column -->
            <ng-container matColumnDef="expected">
              <th mat-header-cell *matHeaderCellDef> Esperado </th>
              <td mat-cell *matCellDef="let element" class="amount-cell"> {{ element.final_cash_expected | currency }} </td>
            </ng-container>

            <!-- Real Column -->
            <ng-container matColumnDef="real">
              <th mat-header-cell *matHeaderCellDef> Real </th>
              <td mat-cell *matCellDef="let element" class="amount-cell"> 
                <span class="font-bold highlight-amount">{{ element.final_cash_real | currency }}</span> 
              </td>
            </ng-container>

            <!-- Difference Column -->
            <ng-container matColumnDef="difference">
              <th mat-header-cell *matHeaderCellDef> Diferencia </th>
              <td mat-cell *matCellDef="let element" 
                  [class.text-red-500]="element.difference < 0" 
                  [class.text-green-500]="element.difference > 0"
                  class="amount-cell">
                <span *ngIf="element.difference > 0">+</span>
                {{ element.difference | currency }}
              </td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef> Estado </th>
              <td mat-cell *matCellDef="let element">
                <span class="status-badge" [class.closed]="element.status === 'closed'">
                  {{ element.status === 'closed' ? 'Cerrado' : 'Abierto' }}
                </span>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="history-row"></tr>
          </table>
        </div>

        <div *ngIf="shifts.length === 0" class="empty-state">
          <mat-icon>history_toggle_off</mat-icon>
          <p>No hay registros disponibles</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .history-container {
      padding: 0;
      position: relative;
      z-index: 1;
    }

    .welcome-section {
      margin-bottom: 30px;
      text-align: center;
      padding: 40px 20px;
      background: var(--gradient-card, linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%));
      border-radius: 20px;
      box-shadow: var(--shadow-soft, 0 8px 30px rgba(0,0,0,0.04));
      border: 1px solid var(--border-light, rgba(0,0,0,0.05));
      position: relative;
      overflow: hidden;
    }

    .welcome-section::before {
      content: '📜';
      position: absolute;
      top: -20px;
      right: -20px;
      font-size: 8rem;
      opacity: 0.1;
      transform: rotate(15deg);
    }

    .welcome-title {
      font-size: 2.5rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
      margin: 0 0 12px 0;
      color: #2C1810;
    }

    .welcome-subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }

    .history-card {
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      border: 1px solid rgba(0,0,0,0.05);
      overflow: hidden;
    }

    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    th.mat-header-cell {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      color: #7f8c8d;
      font-size: 0.9rem;
      padding: 24px 16px;
    }

    td.mat-cell {
      padding: 16px;
      font-family: 'Inter', sans-serif;
      color: #2c3e50;
      border-bottom-color: #f0f0f0;
    }

    .history-row:hover {
      background-color: #fafafa;
    }

    .date-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .date-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #D4AF37;
    }

    .amount-cell {
      font-feature-settings: "tnum";
      font-variant-numeric: tabular-nums;
    }

    .highlight-amount {
      color: #2C1810;
      font-weight: 700;
    }

    .text-red-500 { color: #e74c3c; font-weight: 600; }
    .text-green-500 { color: #27ae60; font-weight: 600; }

    .status-badge {
      padding: 6px 12px;
      border-radius: 30px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #eee;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge.closed {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .empty-state {
      padding: 60px 20px;
      text-align: center;
      color: #bdc3c7;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state p {
      font-size: 1.1rem;
      margin: 0;
    }
  `]
})
export class SalesHistoryComponent implements OnInit {
  displayedColumns: string[] = ['date', 'base', 'expected', 'real', 'difference', 'status'];
  shifts: CashShift[] = [];

  constructor(private supabase: SupabaseService) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  async loadHistory() {
    const { data, error } = await this.supabase.client
      .from('cash_shifts')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(30); // Last 30 shifts

    if (data) {
      this.shifts = data as CashShift[];
    }
    if (error) {
      console.error('Error loading history', error);
    }
  }
}
