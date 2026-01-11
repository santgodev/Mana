import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { StationService } from '../../../../core/services';
import { Station } from '../../../../models/supabase.types';
import { StationDialogComponent } from '../../components/station-dialog/station-dialog.component';

@Component({
  selector: 'app-stations-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule
  ],
  template: `
    <div class="stations-container">
      <!-- Welcome Section -->
      <div class="welcome-section">
        <h1 class="welcome-title">Gestión de Estaciones</h1>
        <p class="welcome-subtitle">Administra las zonas de preparación y cocina</p>
      </div>

      <!-- Action Bar -->
      <div class="action-bar">
        <button mat-raised-button color="primary" class="add-btn" (click)="openDialog()">
          <mat-icon>add</mat-icon> Nueva Estación
        </button>
      </div>

      <!-- Stations Grid -->
      <div class="stations-grid">
        <!-- New Station Ghost Card -->
        <mat-card class="station-card ghost-card" (click)="openDialog()">
          <mat-card-content class="ghost-content">
            <mat-icon>add_circle_outline</mat-icon>
            <span>Crear Estación</span>
          </mat-card-content>
        </mat-card>

        <!-- Station Cards -->
        <mat-card class="station-card" *ngFor="let station of (stationService.stations$ | async)">
          <div class="card-menu">
            <button mat-icon-button [matMenuTriggerFor]="menu" (click)="$event.stopPropagation()">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="openDialog(station)">
                <mat-icon>edit</mat-icon>
                <span>Editar</span>
              </button>
              <button mat-menu-item class="delete-item" (click)="deleteStation(station)">
                <mat-icon color="warn">delete</mat-icon>
                <span>Eliminar</span>
              </button>
            </mat-menu>
          </div>

          <mat-card-content class="card-content">
            <div class="station-icon">
              <mat-icon>soup_kitchen</mat-icon>
            </div>
            <h3 class="station-name">{{ station.name }}</h3>
            <!-- Optional: Add random status or badge if applicable -->
            <div class="station-status">
              <span class="status-badge active">Activa</span>
            </div>
          </mat-card-content>
          
          <mat-card-actions class="card-actions">
            <button mat-button color="primary" (click)="openDialog(station)">Editar</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stations-container {
      padding: 0;
      position: relative;
      z-index: 1;
    }

    /* Welcome Section matched to Dashboard */
    .welcome-section {
      margin-bottom: 30px;
      text-align: center;
      padding: 40px 20px;
      background: var(--gradient-card, linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%));
      border-radius: 20px;
      box-shadow: var(--shadow-soft, 0 8px 30px rgba(0,0,0,0.04));
      border: 1px solid var(--border-light, rgba(0,0,0,0.05));
      position: relative;
      overflow: hidden;
    }

    .welcome-section::before {
      content: '🍳';
      position: absolute;
      top: -20px;
      right: -20px;
      font-size: 8rem;
      opacity: 0.1;
      transform: rotate(15deg);
    }

    .welcome-title {
      font-size: 2.5rem;
      font-weight: 700;
      font-family: 'Poppins', sans-serif;
      margin: 0 0 12px 0;
      color: #2C1810;
    }

    .welcome-subtitle {
      font-size: 1.1rem;
      color: #7f8c8d;
      margin: 0;
      font-family: 'Inter', sans-serif;
    }

    .action-bar {
      margin-bottom: 24px;
      display: flex;
      justify-content: flex-end;
    }

    .add-btn {
      padding: 8px 24px;
      border-radius: 50px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3); /* Gold/Coffee accent shadow */
      background-color: #D4AF37; /* Gold */
      color: white;
    }

    .stations-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 24px;
      padding-bottom: 40px;
    }

    .station-card {
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      border: 1px solid rgba(0,0,0,0.05);
      position: relative;
      overflow: hidden;
      cursor: default;
    }

    .station-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 28px rgba(0,0,0,0.1);
    }

    .card-menu {
      position: absolute;
      top: 8px;
      right: 8px;
      z-index: 2;
    }

    .card-content {
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .station-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #FFF8F0; /* Soft cream */
      color: #D4AF37; /* Gold */
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 12px rgba(212, 175, 55, 0.15);
    }
    .station-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .station-name {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: #2C1810;
      margin: 0 0 8px 0;
    }

    .station-status {
      margin-top: 8px;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #E8F5E9;
      color: #2E7D32;
    }

    .card-actions {
      padding: 0 16px 16px 16px;
      display: flex;
      justify-content: center;
    }

    /* Ghost Card for styling "Add New" as a card */
    .ghost-card {
      background: transparent;
      border: 2px dashed #e0e0e0;
      box-shadow: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .ghost-card:hover {
      border-color: #D4AF37;
      background: rgba(212, 175, 55, 0.05);
      transform: translateY(-5px);
    }

    .ghost-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      color: #9e9e9e;
      gap: 12px;
    }

    .ghost-content mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #bdbdbd;
    }

    .ghost-content span {
      font-weight: 600;
      font-size: 1rem;
    }
    
    .delete-item {
        color: #f44336;
    }
  `]
})
export class StationsListComponent implements OnInit {

  // No longer needed displayedColumns as we aren't using mat-table

  constructor(
    public stationService: StationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.stationService.loadStations();
  }

  openDialog(station?: Station): void {
    const dialogRef = this.dialog.open(StationDialogComponent, {
      width: '400px',
      data: station ? { ...station } : { name: '' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        if (station) {
          this.stationService.updateStation(station.id, result);
        } else {
          this.stationService.createStation(result);
        }
      }
    });
  }

  deleteStation(station: Station): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Eliminar Estación`,
        message: `¿Estás seguro de eliminar la estación "${station.name}"?`,
        confirmText: 'Eliminar',
        icon: 'delete',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.stationService.deleteStation(station.id)
          .then(() => {
            this.snackBar.open('Estación eliminada', 'Cerrar', { duration: 3000 });
            this.stationService.loadStations();
          })
          .catch((err) => {
            console.error('Error deleting station:', err);
            this.snackBar.open('Error al eliminar estación', 'Cerrar', { duration: 3000 });
          });
      }
    });
  }
}

