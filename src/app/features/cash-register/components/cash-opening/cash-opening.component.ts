import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CashService } from '../../../../core/services/cash.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { map } from 'rxjs/operators';

@Component({
    selector: 'app-cash-opening',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatSnackBarModule
    ],
    template: `
    <div class="opening-container">
       <mat-card class="opening-card">
        <mat-card-content class="centered-content">
            <div class="header-content">
                <mat-icon class="large-icon">point_of_sale</mat-icon>
                <h2 class="title">Apertura de Caja</h2>
                <p class="subtitle">Inicia el turno ingresando la base</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="openShift()">
                <div class="amount-input-wrapper">
                    <span class="currency-symbol">$</span>
                    <input type="number" formControlName="baseAmount" placeholder="0" class="giant-input">
                </div>
                <!-- Errors remain the same -->
                <mat-error *ngIf="form.get('baseAmount')?.hasError('required') && form.get('baseAmount')?.touched">
                    El monto base es obligatorio
                </mat-error>
                <mat-error *ngIf="form.get('baseAmount')?.hasError('min')">
                    El monto debe ser positivo
                </mat-error>
                
                <div class="info-row">
                    <mat-icon>person</mat-icon>
                    <span>Usuario: {{ (userEmail$ | async) || 'Desconocido' }}</span>
                </div>
                
                <div class="actions">
                    <button type="submit" mat-raised-button color="primary" class="open-btn" [disabled]="form.invalid || isLoading">
                         {{ isLoading ? 'Abriendo...' : 'ABRIR CAJA' }}
                    </button>
                </div>
            </form>
        </mat-card-content>
       </mat-card>
    </div>
  `,
    styles: [`
    :host {
        display: block;
        width: 100%;
        height: 100%;
    }
    .opening-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        padding: 24px;
        box-sizing: border-box;
    }
    .opening-card {
        width: 100%;
        max-width: 480px;
        padding: 40px;
        text-align: center;
        border-radius: 24px;
        background: white;
        box-shadow: 0 20px 60px rgba(0,0,0,0.08);
        border: 1px solid rgba(0,0,0,0.03);
    }
    .centered-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
    }
    .header-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 24px;
    }
    .large-icon {
        font-size: 64px;
        width: 64px;
        height: 64px; 
        margin-bottom: 24px; 
        color: #D4AF37;
    }
    .title {
        font-family: 'Poppins', sans-serif;
        font-size: 2rem;
        font-weight: 600;
        margin: 0 0 8px 0;
        color: #2C1810;
        text-align: center;
    }
    .subtitle {
        font-size: 1rem;
        color: #888;
        margin: 0;
        text-align: center;
    }
    mat-error {
        display: block;
        text-align: center;
        margin-top: 8px;
        margin-bottom: 8px;
        font-weight: 500;
    }
    form {
        width: 100%;
    }
    .amount-input-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 24px auto; /* Slightly reduced margin */
        background: #f9f9f9;
        border-radius: 16px;
        padding: 16px;
        border: 2px solid transparent;
        transition: all 0.3s ease;
        max-width: 280px; 
        width: 100%;
    }
    .amount-input-wrapper:focus-within {
        background: white;
        border-color: #D4AF37;
        box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
    }
    .currency-symbol {
        font-size: 2rem;
        color: #D4AF37;
        font-weight: 600;
        flex: 1; /* Takes 50% of space */
        text-align: right;
        padding-right: 8px; /* Spacing from center seam */
        margin: 0;
    }
    .giant-input {
        font-size: 3rem;
        border: none;
        outline: none;
        width: 100%; /* Resets fixed width */
        min-width: 0;
        flex: 1; /* Takes 50% of space */
        text-align: left; /* Aligns number starting from center seam */
        font-weight: 700;
        color: #2C1810;
        font-family: 'Outfit', sans-serif;
        background: transparent;
        padding-left: 8px; /* Spacing from center seam */
    }
    /* Hide spin buttons */
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    .info-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #666;
        margin-bottom: 32px;
        padding: 8px 16px;
        background: #f5f5f5;
        border-radius: 50px;
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
    }
    .open-btn {
        width: 100%;
        padding: 16px;
        font-size: 1.1rem;
        border-radius: 16px;
        background: linear-gradient(135deg, #2C1810 0%, #D4AF37 100%);
        color: white;
        font-weight: 600;
        letter-spacing: 0.5px;
        box-shadow: 0 8px 20px rgba(44, 24, 16, 0.2);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    .open-btn:not([disabled]):hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 25px rgba(44, 24, 16, 0.3);
    }
    .open-btn:disabled {
        opacity: 0.7;
        background: #ccc;
        box-shadow: none;
    }
  `]
})
export class CashOpeningComponent {
    form: FormGroup;
    isLoading = false;
    userEmail$;

    constructor(
        private fb: FormBuilder,
        private cashService: CashService,
        private authService: AuthService,
        private snackBar: MatSnackBar
    ) {
        this.userEmail$ = this.authService.user$.pipe(map(u => u?.email));
        this.form = this.fb.group({
            baseAmount: ['', [Validators.required, Validators.min(0)]]
        });
    }

    async openShift() {
        if (this.form.invalid) return;

        this.isLoading = true;
        const user = await this.authService.getCurrentUser();

        if (!user) {
            this.snackBar.open('Error: Usuario no identificado', 'Cerrar');
            this.isLoading = false;
            return;
        }

        try {
            await this.cashService.openShift(this.form.value.baseAmount, user.id);
            this.snackBar.open('Caja abierta correctamente', 'Ok', { duration: 2000 });
        } catch (error) {
            console.error(error);
            this.snackBar.open('Error al abrir la caja', 'Cerrar');
        } finally {
            this.isLoading = false;
        }
    }
}
