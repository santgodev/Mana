import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CashService } from '../../../../core/services/cash.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
    selector: 'app-transaction-dialog',
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
    <h2 mat-dialog-title>
        {{ data.type === 'expense' ? 'Registrar Gasto (Salida)' : 'Registrar Ingreso Extra' }}
    </h2>
    
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-dialog-content>
            <p *ngIf="data.type === 'expense'" style="color: #666; margin-bottom: 20px;">
                Registra salidas de dinero por compras, pagos a proveedores o retiros.
            </p>
            
            <mat-form-field appearance="outline" style="width: 100%;">
                <mat-label>Monto</mat-label>
                <input matInput type="number" formControlName="amount" placeholder="0">
                <mat-error *ngIf="form.get('amount')?.hasError('required')">Requerido</mat-error>
            </mat-form-field>
            
            <mat-form-field appearance="outline" style="width: 100%;">
                <mat-label>Descripción / Motivo</mat-label>
                <textarea matInput formControlName="description" rows="3" placeholder="Ej. Compra de limones"></textarea>
                <mat-error *ngIf="form.get('description')?.hasError('required')">Requerido para auditoría</mat-error>
            </mat-form-field>
        </mat-dialog-content>
        
        <mat-dialog-actions align="end">
            <button mat-button type="button" (click)="dialogRef.close()">Cancelar</button>
            <button mat-raised-button 
                [color]="data.type === 'expense' ? 'warn' : 'primary'" 
                type="submit" 
                [disabled]="form.invalid || isLoading">
                {{ isLoading ? 'Guardando...' : 'Registrar' }}
            </button>
        </mat-dialog-actions>
    </form>
  `,
    styles: [],
})
export class TransactionDialogComponent {
    form: FormGroup;
    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private cashService: CashService,
        private authService: AuthService,
        public dialogRef: MatDialogRef<TransactionDialogComponent>, // Changed to public
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: { type: 'expense' | 'income' }
    ) {
        this.form = this.fb.group({
            amount: ['', [Validators.required, Validators.min(1)]],
            description: ['', Validators.required]
        });
    }

    async onSubmit() {
        if (this.form.invalid) return;
        this.isLoading = true;

        try {
            const user = await this.authService.getCurrentUser();
            if (!user) { throw new Error('Usuario no identificado'); }

            const shift = this.cashService.currentShiftValue;
            if (!shift) { throw new Error('No hay turno abierto'); }

            await this.cashService.addTransaction(
                shift.id,
                this.data.type,
                this.form.value.amount,
                this.form.value.description,
                user.id
            );

            this.snackBar.open('Movimiento registrado', 'Ok', { duration: 2000 });
            this.dialogRef.close(true);

        } catch (e) {
            console.error(e);
            this.snackBar.open('Error al registrar', 'Cerrar');
        } finally {
            this.isLoading = false;
        }
    }
}
