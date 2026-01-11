import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    icon?: string; // e.g., 'help_outline', 'warning', 'info'
    type?: 'info' | 'warning' | 'danger'; // Styles the button/icon
}

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="confirm-dialog-content">
      <div class="icon-header" [ngClass]="data.type || 'info'">
        <mat-icon>{{ data.icon || 'help_outline' }}</mat-icon>
      </div>

      <h2 mat-dialog-title class="dialog-title">{{ data.title }}</h2>
      
      <div mat-dialog-content class="dialog-message">
        <p>{{ data.message }}</p>
      </div>

      <div mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button (click)="onDismiss()" class="btn-cancel">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button mat-flat-button [color]="getButtonColor()" (click)="onConfirm()" class="btn-confirm">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .confirm-dialog-content {
      padding: 24px;
      text-align: center;
      font-family: 'Outfit', sans-serif;
      background: #faf9f6;
    }
    
    .icon-header {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F5EFEB;
      color: #2C1810;
    }

    .icon-header.warning { background: #fff8e1; color: #fbc02d; }
    .icon-header.danger { background: #ffebee; color: #d32f2f; }
    
    .icon-header mat-icon { font-size: 32px; width: 32px; height: 32px; }

    .dialog-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #2C1810;
      margin-bottom: 8px;
    }

    .dialog-message p {
      color: #6d6d6d;
      font-size: 1rem;
      line-height: 1.5;
      margin: 0;
    }

    .dialog-actions {
      margin-top: 24px;
      gap: 12px;
      justify-content: center;
    }

    .btn-cancel {
      color: #795548;
      font-weight: 600;
    }

    .btn-confirm {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      border-radius: 25px;
      padding: 0 24px;
      height: 48px;
    }
  `]
})
export class ConfirmDialogComponent {

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
    ) { }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onDismiss(): void {
        this.dialogRef.close(false);
    }

    getButtonColor(): string {
        return this.data.type === 'danger' ? 'warn' : 'primary';
    }
}
