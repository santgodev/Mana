import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ProductService, StationService } from '../../../../core/services';
import { Station } from '../../../../models/supabase.types';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    FormsModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Nueva Categoría</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Nombre de la Categoría</mat-label>
        <input matInput [(ngModel)]="categoryName" placeholder="Ej. Bebidas, Postres" required>
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width mt-2">
        <mat-label>Cocina / Estación</mat-label>
        <mat-select [(ngModel)]="selectedStationId" required>
            <mat-option *ngFor="let station of stationService.stations$ | async" [value]="station.id">
                {{ station.name }}
            </mat-option>
        </mat-select>
        <mat-hint>¿Quién prepara esto?</mat-hint>
      </mat-form-field>

    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="!categoryName || !selectedStationId">Guardar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    .mt-2 { margin-top: 1rem; }
  `]
})
export class CategoryDialogComponent implements OnInit {
  categoryName = '';
  selectedStationId: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<CategoryDialogComponent>,
    private productService: ProductService,
    public stationService: StationService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.stationService.loadStations();
  }

  async save() {
    if (!this.categoryName || !this.selectedStationId) return;

    try {
      await this.productService.createCategory({
        name: this.categoryName,
        station_id: this.selectedStationId,
        active: true
      });
      this.snackBar.open('Categoría creada', 'Ok', { duration: 2000 });
      this.dialogRef.close(true);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error al crear categoría', 'Cerrar');
    }
  }
}
