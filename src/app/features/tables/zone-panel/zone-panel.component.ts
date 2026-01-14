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
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Zone, ZoneStats } from '../../../models/supabase.types'; // Update to use Supabase types
import { ZoneService } from '../../../core/services/zone.service'; // Update to core
import { ZoneDialogComponent } from './zone-dialog/zone-dialog.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

interface StatItem {
  key: string;
  label: string;
  value: number;
}

@Component({
  selector: 'app-zone-panel',
  templateUrl: './zone-panel.component.html',
  styleUrls: ['./zone-panel.component.scss'],
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
    MatTooltipModule,
    MatDialogModule
  ]
})
export class ZonePanelComponent implements OnInit {
  zones$: Observable<Zone[]>;
  stats$: Observable<StatItem[]>;
  filteredZones: Zone[] = [];
  isGridView = true;
  selectedType = '';
  selectedFloor = '';

  constructor(
    private zoneService: ZoneService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.zones$ = this.zoneService.getZones();
    this.stats$ = this.getStats();
  }

  ngOnInit(): void {
    this.zones$.subscribe(zones => {
      this.filteredZones = zones;
    });
    // Auto-seed if empty
    this.zoneService.ensureZonesExist();
  }

  private getStats(): Observable<StatItem[]> {
    return this.zoneService.getZoneStats().pipe(
      map(stats => [
        { key: 'zones', label: 'Zonas', value: stats.totalZones },
        { key: 'tables', label: 'Mesas', value: stats.totalTables },
        { key: 'available', label: 'Disponibles', value: stats.availableTables },
        { key: 'occupied', label: 'Ocupadas', value: stats.occupiedTables }
      ])
    );
  }

  getStatIcon(key: string): string {
    const icons: { [key: string]: string } = {
      'zones': 'location_on',
      'tables': 'table_restaurant',
      'available': 'check_circle',
      'occupied': 'restaurant'
    };
    return icons[key] || 'help';
  }

  getStatIconClass(key: string): string {
    return key;
  }

  getZoneTypeIcon(type: string | undefined): string {
    if (!type) return 'help';
    const icons: { [key: string]: string } = {
      'indoor': 'home',
      'outdoor': 'park',
      'terrace': 'balcony',
      'private': 'lock',
      'floor': 'stairs'
    };
    return icons[type] || 'help';
  }

  getZoneTypeText(type: string | undefined): string {
    if (!type) return 'Desconocido';
    const texts: { [key: string]: string } = {
      'indoor': 'Interior',
      'outdoor': 'Exterior',
      'terrace': 'Terraza',
      'private': 'Privada',
      'floor': 'Piso'
    };
    return texts[type] || 'Desconocido';
  }

  getTableCountByStatus(zone: Zone, status: string): number {
    return (zone.tables || []).filter(table => table.status === status).length;
  }

  toggleView(): void {
    this.isGridView = !this.isGridView;
  }

  filterZones(): void {
    this.zones$.subscribe(zones => {
      this.filteredZones = zones.filter(zone => {
        const matchesType = !this.selectedType || zone.type === this.selectedType;
        const matchesFloor = !this.selectedFloor || zone.floor?.toString() === this.selectedFloor;
        return matchesType && matchesFloor;
      });
    });
  }

  clearFilters(): void {
    this.selectedType = '';
    this.selectedFloor = '';
    this.filterZones();
  }

  openZoneDialog(zone?: Zone): void {
    const dialogRef = this.dialog.open(ZoneDialogComponent, {
      width: '500px',
      data: { zone }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (zone) {
          // Update
          this.zoneService.updateZone(zone.id, result)
            .then(() => this.snackBar.open('Zona actualizada', 'OK', { duration: 3000 }))
            .catch(err => {
              console.error('Update Error:', err);
              const msg = err.message || err.error_description || 'Error desconocido';
              this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
            });
        } else {
          // Create
          this.zoneService.createZone(result)
            .then(() => this.snackBar.open('Zona creada exitosamente', 'OK', { duration: 3000 }))
            .catch(err => {
              console.error('Create Error:', err);
              const msg = err.message || err.error_description || 'Error desconocido';
              this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
            });
        }
      }
    });
  }

  openZoneBoard(zone: Zone): void {
    this.router.navigate(['/tables/board', zone.id]);
  }

  editZone(zone: Zone): void {
    this.openZoneDialog(zone);
  }

  toggleZoneStatus(zone: Zone): void {
    this.zoneService.updateZone(zone.id, {
      // id: zone.id, 
      active: !zone.active
    }).then(() => {
      this.refreshZones();
      this.snackBar.open(
        `Zona ${zone.name} ${zone.active ? 'desactivada' : 'activada'}`,
        'Cerrar',
        { duration: 3000 }
      );
    }).catch(error => {
      console.error('Error updating zone:', error);
      const msg = error.message || error.error_description || 'Error desconocido';
      this.snackBar.open(`Error: ${msg}`, 'Cerrar', { duration: 5000 });
    });
  }

  deleteZone(zone: Zone): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Eliminar zona "${zone.name}"`,
        message: '¿Estás seguro de eliminar esta zona? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        icon: 'delete',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.zoneService.deleteZone(zone.id).then(() => {
          this.refreshZones();
          this.snackBar.open(`Zona "${zone.name}" eliminada`, 'Cerrar', { duration: 3000 });
        }).catch(error => {
          console.error('Error deleting zone:', error);
          this.snackBar.open('Error al eliminar la zona', 'Cerrar', { duration: 3000 });
        });
      }
    });
  }

  private refreshZones(): void {
    this.zones$.subscribe(zones => {
      this.filteredZones = zones;
      this.filterZones();
    });
  }
}