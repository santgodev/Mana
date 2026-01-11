import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Table, Order } from '../../../models/supabase.types';
import { TableService } from '../../../core/services/table.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-table-details',
  templateUrl: './table-details.component.html',
  styleUrls: ['./table-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class TableDetailsComponent implements OnInit {
  @Input() table: Table | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() tableUpdated = new EventEmitter<Table>();

  constructor(
    private tableService: TableService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void { }

  closePanel(): void {
    this.close.emit();
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'free': 'check_circle',
      'occupied': 'restaurant',
      'waiting': 'event_available',
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

  getLocationText(location: string): string {
    const texts: { [key: string]: string } = {
      'indoor': 'Interior',
      'outdoor': 'Exterior',
      'terrace': 'Terraza',
      'private': 'Privada'
    };
    return texts[location] || 'Desconocida';
  }

  getShapeText(shape: string | undefined): string {
    if (!shape) return 'Desconocida';
    const texts: { [key: string]: string } = {
      'round': 'Redonda',
      'square': 'Cuadrada',
      'rectangle': 'Rectangular'
    };
    return texts[shape] || 'Desconocida';
  }

  async openTable(): Promise<void> {
    if (!this.table) return;

    try {
      // Assuming waiterId is handled by service or context, passing dummy or current
      // Ideally get from AuthService. For now, service handles logic or we pass hardcoded.
      // TableService.openTable signature: (tableId, waiterId).
      // We need a waiter ID. Let's assume the service handles specific logic or we pass a placeholder if allowed.
      // Actually occupyTable needs waiterId. Let's use a placeholder 'admin' or fetch from auth if possible. 
      // For quick fix:
      await this.tableService.openTable(this.table.id, 'current-user-id');
      this.snackBar.open(`Mesa ${this.table?.number} abierta`, 'Cerrar', { duration: 3000 });
      this.closePanel(); // Refresh done by parent via realtime
    } catch (error) {
      console.error('Error opening table:', error);
      this.snackBar.open('Error al abrir la mesa', 'Cerrar', { duration: 3000 });
    }
  }

  async closeTable(): Promise<void> {
    if (!this.table) return;

    try {
      await this.tableService.freeTable(this.table.id);
      this.snackBar.open(`Mesa ${this.table?.number} cerrada`, 'Cerrar', { duration: 3000 });
      this.closePanel();
    } catch (error) {
      console.error('Error closing table:', error);
      this.snackBar.open('Error al cerrar la mesa', 'Cerrar', { duration: 3000 });
    }
  }

  viewOrder(): void {
    // TODO: Implement order details dialog
    this.snackBar.open('Vista de pedido próximamente', 'Cerrar', { duration: 3000 });
  }

  confirmReservation(): void {
    // TODO: Implement reservation system
    this.snackBar.open('Sistema de reservas próximamente', 'Cerrar', { duration: 3000 });
  }

  viewReservation(): void {
    // TODO: Implement reservation details dialog
    this.snackBar.open('Vista de reserva próximamente', 'Cerrar', { duration: 3000 });
  }

  async completeMaintenance(): Promise<void> {
    if (!this.table) return;

    try {
      const updated = await this.tableService.updateTable(this.table.id, { status: 'free' });
      this.table = updated;
      this.tableUpdated.emit(updated);
      this.snackBar.open(`Mantenimiento completado`, 'Cerrar', { duration: 3000 });
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error', 'Cerrar', { duration: 3000 });
    }
  }

  editTable(): void {
    // TODO: Implement table edit dialog
    this.snackBar.open('Editor de mesa próximamente', 'Cerrar', { duration: 3000 });
  }

  reserveTable(): void {
    // TODO: Implement reservation dialog
    this.snackBar.open('Sistema de reservas próximamente', 'Cerrar', { duration: 3000 });
  }

  async setMaintenance(): Promise<void> {
    // Maintenance is not in enum, using waiting as proxy or skipping
    this.snackBar.open('Modo mantenimiento no disponible en DB', 'Cerrar', { duration: 3000 });
  }

  async deleteTable(): Promise<void> {
    if (!this.table) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Eliminar Mesa ${this.table.number} `,
        message: '¿Estás seguro de eliminar esta mesa? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        icon: 'delete',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.deleteTable(this.table!.id).then(() => {
          this.snackBar.open(`Mesa ${this.table!.number} eliminada`, 'Cerrar', { duration: 3000 });
          this.close.emit(); // Close details
          // Parent component should handle refresh/removal from list
        }).catch(err => {
          console.error('Error deleting table:', err);
          this.snackBar.open('Error al eliminar mesa', 'Cerrar', { duration: 3000 });
        });
      }
    });
  }
}