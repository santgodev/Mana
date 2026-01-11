import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { CashService } from '../../../../core/services/cash.service';
import { CashShift } from '../../../../models/supabase.types';
import { CashDashboardComponent } from '../../components/cash-dashboard/cash-dashboard.component';
import { CashOpeningComponent } from '../../components/cash-opening/cash-opening.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';

@Component({
  selector: 'app-cash-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    CashDashboardComponent,
    CashOpeningComponent
  ],
  template: `
    <div class="cash-layout-container">
      <!-- Global Header for Cash Module -->
      <div class="cash-header" *ngIf="!isLoading">
        <h1>🧾 Caja Registradora</h1>
        <button *ngIf="!(isHandset$ | async)" mat-stroked-button routerLink="/caja/history" class="history-btn">
          <mat-icon>history</mat-icon> Ver Historial
        </button>
      </div>

      <!-- Loading State -->
      <mat-progress-bar *ngIf="isLoading" mode="indeterminate"></mat-progress-bar>

      <ng-container *ngIf="!isLoading">
        <!-- If Shift is Open -> Show Dashboard -->
        <app-cash-dashboard *ngIf="currentShift; else openingTemplate" [shift]="currentShift"></app-cash-dashboard>
        
        <!-- Else -> Show Opening Screen -->
        <ng-template #openingTemplate>
           <app-cash-opening></app-cash-opening>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      font-family: 'Inter', sans-serif;
    }
    .cash-layout-container {
      display: flex;
      flex-direction: column;
      flex: 1;
      width: 100%;
      padding: 24px;
      box-sizing: border-box;
    }
    
    /* Premium Header Style (Matched with Inventory) */
    .cash-header {
      margin-bottom: 32px;
      padding: 30px;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid rgba(0, 0, 0, 0.03);
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .cash-header::before {
      content: '🧾';
      position: absolute;
      top: -20px;
      right: -20px;
      font-size: 8rem;
      opacity: 0.05;
      transform: rotate(15deg);
      pointer-events: none;
    }

    .cash-header h1 {
      font-family: 'Poppins', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0;
      background: linear-gradient(135deg, #2C1810 0%, #D4AF37 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .history-btn {
      position: relative;
      z-index: 2;
      color: #2C1810;
      border-color: rgba(44, 24, 16, 0.2);
    }
  `]
})
export class CashLayoutComponent implements OnInit {
  currentShift: CashShift | null = null;
  isLoading = true;
  isHandset$: Observable<boolean>;

  constructor(
    private cashService: CashService,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    this.cashService.currentShift$.subscribe(shift => {
      this.currentShift = shift;
      this.isLoading = false;
    });
  }
}
