import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { CashService } from '../../../../core/services/cash.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
    selector: 'app-cash-closure-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSnackBarModule
    ],
    template: `
    <h2 mat-dialog-title>Cierre de Caja</h2>
    <mat-dialog-content>
        <div class="summary-box">
            <div class="row">
                <span>Total Esperado (Sistema):</span>
                <span class="value">{{ data.summary.expectedTotal | currency:'CAD':'symbol-narrow':'1.0-0' }}</span>
            </div>
        </div>

        <form [formGroup]="form">
            <div class="input-section">
                <mat-label>Dinero Real (Contado)</mat-label>
                <div class="amount-input">
                    <span class="symbol">$</span>
                    <input type="number" formControlName="realAmount" placeholder="0">
                </div>
            </div>

            <!-- Calculated Difference -->
            <div class="diff-box" *ngIf="form.get('realAmount')?.value !== ''" 
                 [class.perfect]="difference === 0" 
                 [class.error]="difference !== 0">
                <span>Diferencia:</span>
                <span class="diff-value">
                    {{ difference > 0 ? '+' : '' }}{{ difference | currency:'CAD':'symbol-narrow':'1.0-0' }}
                </span>
                <small *ngIf="difference === 0">¡Caja Cuadrada!</small>
                <small *ngIf="difference < 0">Faltante</small>
                <small *ngIf="difference > 0">Sobrante</small>
            </div>

            <mat-form-field appearance="outline" style="width: 100%; margin-top: 16px;">
                <mat-label>Observaciones de Cierre</mat-label>
                <textarea matInput formControlName="notes" rows="3" placeholder="Ej. Sobran 200 pesos por el redondeo..."></textarea>
                <mat-error *ngIf="form.get('notes')?.hasError('required')">Requerido si hay diferencia</mat-error>
            </mat-form-field>
        </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
        <button mat-button (click)="dialogRef.close()">Cancelar</button>
        <button mat-raised-button color="warn" 
            (click)="onCloseShift()" 
            [disabled]="form.invalid || isLoading">
            {{ isLoading ? 'Cerrando...' : 'CERRAR CAJA DEFINITIVAMENTE' }}
        </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .summary-box {
        background: #f5f5f5;
        padding: 16px;
        border-radius: 8px;
        margin-bottom: 24px;
        font-family: 'Poppins', sans-serif;
    }
    .row { display: flex; justify-content: space-between; font-size: 1.1rem; }
    .value { font-weight: 700; color: #2C1810; }
    
    .input-section { margin-bottom: 16px; }
    .amount-input {
        display: flex; align-items: center; border: 2px solid #ccc; border-radius: 8px; padding: 8px 16px;
    }
    .amount-input input {
        border: none; outline: none; font-size: 1.5rem; font-weight: 700; width: 100%;
    }
    .symbol { font-size: 1.5rem; color: #888; margin-right: 8px; }

    .diff-box {
        padding: 12px; border-radius: 8px; text-align: center; display: flex; flex-direction: column; align-items: center;
        font-weight: 600;
    }
    .diff-box.perfect { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
    .diff-box.error { background: #ffebee; color: #c62828; border: 1px solid #ffcdd2; }
    .diff-value { font-size: 1.2rem; }
  `]
})
export class CashClosureDialogComponent implements OnInit {
    form: FormGroup;
    isLoading = false;
    difference = 0;

    constructor(
        private fb: FormBuilder,
        private cashService: CashService,
        private authService: AuthService,
        public dialogRef: MatDialogRef<CashClosureDialogComponent>, // Public for template access
        private snackBar: MatSnackBar,
        private dialog: MatDialog, // Inject MatDialog service
        @Inject(MAT_DIALOG_DATA) public data: { summary: any, shiftId: string }
    ) {
        this.form = this.fb.group({
            realAmount: ['', [Validators.required, Validators.min(0)]],
            notes: ['']
        });
    }

    ngOnInit() {
        this.form.get('realAmount')?.valueChanges.subscribe(val => {
            const real = parseFloat(val) || 0;
            this.difference = real - this.data.summary.expectedTotal;

            if (Math.abs(this.difference) > 0) {
                this.form.get('notes')?.setValidators(Validators.required);
            } else {
                this.form.get('notes')?.clearValidators();
            }
            this.form.get('notes')?.updateValueAndValidity();
        });
    }

    async onCloseShift() {
        if (this.form.invalid) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Cerrar Caja',
                message: '¿Estás seguro de cerrar la caja? Esta acción no se puede deshacer.',
                confirmText: 'Cerrar Caja',
                icon: 'point_of_sale',
                type: 'warning'
            }
        });

        dialogRef.afterClosed().subscribe(async result => {
            if (!result) return;

            this.isLoading = true;
            try {
                const user = await this.authService.getCurrentUser();
                if (!user) throw new Error('No user');

                await this.cashService.closeShift(
                    this.data.shiftId,
                    {
                        expected: this.data.summary.expectedTotal,
                        real: this.form.value.realAmount,
                        notes: this.form.value.notes,
                        closedBy: user.id
                    }
                );

                this.snackBar.open('Caja cerrada correctamente', 'Ok', { duration: 3000 });
                this.dialogRef.close(true);

            } catch (e) {
                console.error(e);
                this.snackBar.open('Error al cerrar caja', 'Cerrar');
            } finally {
                this.isLoading = false;
            }
        });
    }
}
