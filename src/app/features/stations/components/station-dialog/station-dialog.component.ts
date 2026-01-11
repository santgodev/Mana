import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { Station } from '../../../../models/supabase.types';

@Component({
    selector: 'app-station-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        FormsModule
    ],
    template: `
    <h2 mat-dialog-title>{{ data.id ? 'Editar' : 'Nueva' }} Estación</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" style="width: 100%; margin-top: 10px;">
        <mat-label>Nombre de la Estación</mat-label>
        <input matInput [(ngModel)]="data.name" placeholder="Ej. Bar, Cocina Caliente">
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-flat-button color="primary" [mat-dialog-close]="data.name" [disabled]="!data.name">Guardar</button>
    </mat-dialog-actions>
  `
})
export class StationDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<StationDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: Partial<Station>
    ) { }

    onCancel(): void {
        this.dialogRef.close();
    }
}
