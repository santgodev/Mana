import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Zone } from '../../../../models/supabase.types';

@Component({
    selector: 'app-zone-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatSlideToggleModule
    ],
    template: `
    <h2 mat-dialog-title>{{ isEdit ? 'Editar Zona' : 'Nueva Zona' }}</h2>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="form-container">
          <mat-form-field appearance="outline">
            <mat-label>Nombre de la Zona</mat-label>
            <input matInput formControlName="name" placeholder="Ej. Terraza Principal" required>
            <mat-icon matSuffix>edit</mat-icon>
            <mat-error *ngIf="form.get('name')?.hasError('required')">El nombre es obligatorio</mat-error>
          </mat-form-field>

          <div class="row">
            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Tipo</mat-label>
              <mat-select formControlName="type">
                <mat-option value="indoor">Interior</mat-option>
                <mat-option value="outdoor">Exterior</mat-option>
                <mat-option value="terrace">Terraza</mat-option>
                <mat-option value="private">Privado</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="half-width">
              <mat-label>Piso</mat-label>
              <input matInput type="number" formControlName="floor" min="0">
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Capacidad (Personas)</mat-label>
            <input matInput type="number" formControlName="capacity" min="1">
            <mat-icon matSuffix>groups</mat-icon>
          </mat-form-field>

          <div class="toggle-row">
            <mat-slide-toggle formControlName="active" color="primary">
              Zona Activa
            </mat-slide-toggle>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
          {{ isEdit ? 'Guardar Cambios' : 'Crear Zona' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
    styles: [`
    .form-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-top: 8px;
    }
    .row {
      display: flex;
      gap: 16px;
    }
    .half-width {
      flex: 1;
    }
    .toggle-row {
      margin-top: 8px;
      margin-bottom: 8px;
    }
    mat-dialog-content {
      min-width: 350px;
    }
  `]
})
export class ZoneDialogComponent {
    form: FormGroup;
    isEdit: boolean;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ZoneDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { zone?: Zone }
    ) {
        this.isEdit = !!data.zone;
        this.form = this.fb.group({
            name: [data.zone?.name || '', [Validators.required]],
            type: [data.zone?.type || 'indoor', [Validators.required]],
            floor: [data.zone?.floor || 1, [Validators.required, Validators.min(0)]],
            capacity: [data.zone?.capacity || 20, [Validators.required, Validators.min(1)]],
            active: [data.zone?.active !== false] // Default true, unless explicitly false
        });
    }

    onSubmit() {
        if (this.form.valid) {
            this.dialogRef.close(this.form.value);
        }
    }

    onCancel() {
        this.dialogRef.close();
    }
}
