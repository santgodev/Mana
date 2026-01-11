import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Table } from '../../../models/supabase.types';
import { TableService } from '../../../core/services';

export interface TableDialogData {
  table?: Table;
  zoneId?: string;
}

@Component({
  selector: 'app-table-dialog',
  templateUrl: './table-dialog.component.html',
  styleUrls: ['./table-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ]
})
export class TableDialogComponent implements OnInit {
  tableForm: FormGroup;
  isEdit = false;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private tableService: TableService,
    private dialogRef: MatDialogRef<TableDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TableDialogData
  ) {
    this.isEdit = !!data.table;
    this.tableForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.table) {
      this.populateForm();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      number: ['', [Validators.required]],
      capacity: [4, [Validators.required, Validators.min(1), Validators.max(20)]],
      status: ['free'],
      shape: ['square'] // Added shape support
    });
  }

  private populateForm(): void {
    if (this.data.table) {
      this.tableForm.patchValue({
        number: this.data.table.number,
        capacity: this.data.table.capacity,
        status: this.data.table.status,
        shape: this.data.table.shape
      });
    }
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'free': 'check_circle',
      'occupied': 'restaurant',
      'waiting': 'event',
      'paying': 'attach_money'
    };
    return icons[status] || 'help';
  }

  getStatusText(status: string): string {
    const texts: { [key: string]: string } = {
      'free': 'Disponible',
      'occupied': 'Ocupada',
      'waiting': 'Esperando',
      'paying': 'Pagando'
    };
    return texts[status] || 'Desconocido';
  }

  onSave(): void {
    if (this.tableForm.valid) {
      this.isLoading = true;
      const formValue = this.tableForm.value;

      // Default position for new tables
      const newPos = { x_position: 100, y_position: 100 };

      if (this.isEdit && this.data.table) {
        const updateData: Partial<Table> = {
          ...formValue
        };

        this.tableService.updateTable(this.data.table.id, updateData).then(() => {
          this.isLoading = false;
          this.dialogRef.close(true);
        }).catch(error => {
          console.error('Error updating table:', error);
          this.isLoading = false;
        });
      } else {
        // Create Mode
        if (!this.data.zoneId) {
          console.error('Zone ID required for creation');
          this.isLoading = false;
          return;
        }

        const createData: Partial<Table> = {
          ...formValue,
          zone_id: this.data.zoneId,
          ...newPos
        };

        this.tableService.createTable(createData as any).then(() => {
          this.isLoading = false;
          this.dialogRef.close(true);
        }).catch(error => {
          console.error('Error creating table:', error);
          this.isLoading = false;
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
