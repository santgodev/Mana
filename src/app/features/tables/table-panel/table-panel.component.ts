import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Table, Zone } from '../../../models/supabase.types';
import { TableService, ZoneService } from '../../../core/services';
import { TableDialogComponent } from '../table-dialog/table-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface StatItem {
  key: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-table-panel',
  templateUrl: './table-panel.component.html',
  styleUrls: ['./table-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule
    // TableDialogComponent // Imported as standalone
  ]
})
export class TablePanelComponent implements OnInit {
  tables$: Observable<Table[]>;
  stats$: Observable<StatItem[]>;
  zones$: Observable<Zone[]>; // Add zones observable
  filteredTables: Table[] = [];
  isGridView = true;
  selectedStatus = '';
  selectedZoneId = ''; // Add selectedZoneId

  constructor(
    private tableService: TableService,
    private zoneService: ZoneService, // Inject Service
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.tables$ = this.tableService.tables$;
    this.zones$ = this.zoneService.zones$; // Get zones
    this.tableService.loadTables();
    this.stats$ = this.getStats();
  }

  ngOnInit(): void {
    this.tables$.subscribe(tables => {
      this.filteredTables = tables;
    });
  }

  private getStats(): Observable<StatItem[]> {
    return this.tables$.pipe(
      map(tables => {
        const total = tables.length;
        const available = tables.filter(t => t.status === 'free').length;
        const occupied = tables.filter(t => t.status === 'occupied').length;
        // const reserved = tables.filter(t => t.status === 'reserved').length; // reserved not in TableStatus enum yet?
        // const maintenance = tables.filter(t => t.status === 'maintenance').length;

        return [
          { key: 'available', label: 'Disponibles', value: available },
          { key: 'occupied', label: 'Ocupadas', value: occupied },
          // Placeholder for others as enum might correspond differntly
          { key: 'reserved', label: 'Reservadas', value: 0 },
          { key: 'maintenance', label: 'Mantenimiento', value: 0 }
        ];
      })
    );
  }

  getStatIcon(key: string): string {
    const icons: { [key: string]: string } = {
      'available': 'check_circle',
      'occupied': 'restaurant',
      'reserved': 'event',
      'maintenance': 'build'
    };
    return icons[key] || 'help';
  }

  getStatIconClass(key: string): string {
    return key;
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
      'reserved': 'Reservada',
      'maintenance': 'Mantenimiento'
    };
    return texts[status] || 'Desconocido';
  }

  // getLocationText removed as 'location' is no longer on Table interface

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  filterTables(): void {
    this.tables$.subscribe(tables => {
      this.filteredTables = tables.filter(table => {
        const matchesStatus = !this.selectedStatus || table.status === this.selectedStatus;
        const matchesZone = !this.selectedZoneId || table.zone_id === this.selectedZoneId;
        return matchesStatus && matchesZone;
      });
    });
  }

  clearFilters(): void {
    this.selectedStatus = '';
    this.selectedZoneId = '';
    this.filterTables();
  }

  openTableDialog(table?: Table): void {
    const dialogRef = this.dialog.open(TableDialogComponent, {
      width: '600px',
      data: table || null,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.refreshTables();
        this.snackBar.open(
          table ? 'Mesa actualizada exitosamente' : 'Mesa creada exitosamente',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }

  openTable(table: Table): void {
    // Automatically open without prompt as requested
    // const defaultName = 'Cliente'; // Removed, service handles user ID now
    this.tableService.openTable(table.id).then(() => {
      this.refreshTables();
      this.snackBar.open(`Mesa ${table.number} abierta`, 'Cerrar', { duration: 2000 });
    }).catch((error: any) => {
      console.error('Error opening table:', error);
      this.snackBar.open(`Error: ${error.message || error.details || JSON.stringify(error)}`, 'Cerrar', { duration: 5000 });
    });
  }

  closeTable(table: Table): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Cerrar mesa ${table.number}`,
        message: '¿Estás seguro de cerrar esta mesa?',
        confirmText: 'Cerrar Mesa',
        icon: 'lock',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.closeTable(table.id).then(() => {
          this.refreshTables();
          this.snackBar.open(`Mesa ${table.number} cerrada`, 'Cerrar', { duration: 3000 });
        }).catch((error: any) => {
          console.error('Error closing table:', error);
          this.snackBar.open('Error al cerrar la mesa', 'Cerrar', { duration: 3000 });
        });
      }
    });
  }

  editTable(table: Table): void {
    this.openTableDialog(table);
  }

  private refreshTables(): void {
    this.tables$.subscribe(tables => {
      this.filteredTables = tables;
      this.filterTables();
    });
  }
}