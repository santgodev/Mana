import { Component, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, CdkDragEnd, DragDropModule } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';


// Services
import { TableService } from '../../../core/services/table.service';
import { ZoneService } from '../../../core/services/zone.service';

// Models
import { Table } from '../../../models/supabase.types'; // Use Supabase Table
import { Zone } from '../../../models/supabase.types'; // Use Supabase Type
import { TableDetailsComponent } from '../table-details/table-details.component';
import { TableActionMenuComponent } from '../table-action-menu/table-action-menu.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { QrDisplayDialogComponent } from '../../../shared/components/qr-display-dialog/qr-display-dialog.component';
import { TableBillPreviewDialogComponent } from '../table-dialog/table-bill-preview-dialog/table-bill-preview-dialog.component';
import { TableDialogComponent } from '../table-dialog/table-dialog.component';

@Component({
  selector: 'app-table-board',
  templateUrl: './table-board.component.html',
  styleUrls: ['./table-board.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatMenuModule,
    DragDropModule,
    TableDetailsComponent
  ]
})
export class TableBoardComponent implements OnInit, OnDestroy {
  zones: Zone[] = [];
  selectedZone: Zone | undefined;
  allTables: Table[] = []; // Cache for all tables
  tables: Table[] = []; // Displayed tables (filtered)
  selectedTable: Table | null = null;

  // UI State
  isEditMode = false;
  showGrid = true;
  tableSize = 80;
  gridSize = 20;
  snapToGrid = true;
  zoomLevel = 100;

  // SLA & Timers
  timerInterval: any;
  now: number = Date.now();

  isHandset$: Observable<boolean>;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tableService: TableService,
    private zoneService: ZoneService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver
  ) {
    this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit(): void {
    // 1. Subscribe to params to handle navigation changes
    this.subscriptions.push(
      this.route.paramMap.subscribe(params => {
        const zoneId = params.get('zoneId');
        if (zoneId) {
          this.attemptSelectZone(zoneId);
        }
      })
    );

    this.loadZones();
    this.loadTables();
    this.startTimers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private loadZones(): void {
    this.zoneService.getZones().subscribe(zones => {
      this.zones = zones;

      // Try resolving zone from URL first
      const zoneId = this.route.snapshot.paramMap.get('zoneId');
      if (zoneId) {
        this.attemptSelectZone(zoneId);
      } else if (zones.length > 0 && !this.selectedZone) {
        // Fallback to first zone
        this.selectZone(zones[0]);
      }
    });
  }

  private attemptSelectZone(zoneId: string): void {
    if (this.zones.length === 0) return; // Wait for zones to load

    const zone = this.zones.find(z => z.id === zoneId);
    if (zone) {
      this.selectZone(zone);
    }
  }

  selectZone(zone: Zone): void {
    this.selectedZone = zone;
    this.updateVisibleTables();
  }

  private loadTables(): void {
    this.tableService.tables$.subscribe(tables => {
      this.allTables = tables;
      this.updateVisibleTables();
    });
  }

  private updateVisibleTables(): void {
    if (this.selectedZone) {
      this.tables = this.allTables.filter(t => t.zone_id === this.selectedZone!.id);
    } else {
      this.tables = this.allTables;
    }
  }

  private startTimers(): void {
    this.timerInterval = setInterval(() => {
      this.now = Date.now();
    }, 1000); // Update every second for smooth timers
  }

  // SLA Helpers
  getTableDuration(table: Table): number {
    if (table.status === 'free' || !table.current_session_start_time) return 0;
    const start = new Date(table.current_session_start_time).getTime();
    return Math.max(0, this.now - start);
  }

  getSLAStatus(table: Table): 'good' | 'warning' | 'danger' {
    if (table.status === 'free') return 'good';
    const durationMinutes = this.getTableDuration(table) / 1000 / 60;

    if (durationMinutes > 60) return 'danger';
    if (durationMinutes > 45) return 'warning';
    return 'good';
  }

  formatDuration(ms: number): string {
    if (!ms) return '00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    // const seconds = totalSeconds % 60; // Optional seconds

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  goBack(): void {
    this.router.navigate(['/tables']);
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.selectedTable = null;
      this.saveLayout();
    }
  }

  toggleGrid(): void {
    this.showGrid = !this.showGrid;
  }

  openCreateTableDialog(): void {
    if (!this.selectedZone) {
      this.snackBar.open('Selecciona una zona primero', 'Cerrar', { duration: 2000 });
      return;
    }

    const dialogRef = this.dialog.open(TableDialogComponent, {
      width: '400px',
      data: { zoneId: this.selectedZone.id }, // Pass zoneId for creation
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Mesa creada correctamente', 'OK', { duration: 2000 });
        // Table list updates automatically via subscription
      }
    });
  }

  // Kept for backward compatibility or quick-add if needed (optional)
  addTable(capacity: number = 4, shape: string = 'square'): void {
    this.openCreateTableDialog();
  }

  selectTable(table: Table): void {
    if (this.isEditMode) {
      this.selectedTable = table;
    }
  }

  openTableDetails(table: Table): void {
    this.selectedTable = table;
  }

  closeTableDetails(): void {
    this.selectedTable = null;
  }

  onTableUpdated(updatedTable: Table): void {
    const index = this.tables.findIndex(t => t.id === updatedTable.id);
    if (index !== -1) {
      this.tables[index] = updatedTable;
    }
    this.selectedTable = updatedTable;
  }

  editTable(table: Table): void {
    const dialogRef = this.dialog.open(TableDialogComponent, {
      width: '400px',
      data: { table: table },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Mesa actualizada', 'OK', { duration: 2000 });
      }
    });
  }

  deleteTable(table: Table): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Eliminar Mesa ${table.number}`,
        message: 'Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        type: 'danger',
        icon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.tableService.deleteTable(table.id).then(() => {
          this.tables = this.tables.filter(t => t.id !== table.id);
          if (this.selectedTable?.id === table.id) {
            this.selectedTable = null;
          }
          this.snackBar.open(`Mesa ${table.number} eliminada`, 'Cerrar', { duration: 3000 });
        });
      }
    });
  }

  handleTableClick(table: Table): void {
    if (this.isEditMode) {
      this.selectedTable = table;
    } else {
      this.handleWaiterInteraction(table);
    }
  }

  private handleWaiterInteraction(table: Table): void {
    if (table.status === 'free') {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: `Abrir Mesa ${table.number}`,
          message: '¿Deseas abrir esta mesa para nuevos clientes?',
          confirmText: 'Abrir Mesa',
          icon: 'meeting_room',
          type: 'info'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.tableService.openTable(table.id)
            .then(() => this.snackBar.open(`Mesa ${table.number} Abierta`, 'OK', { duration: 2000 }))
            .catch(err => {
              console.error('Error opening table:', err);
              this.snackBar.open(`Error: ${err.message || 'Error desconocido'}`, 'Cerrar', { duration: 3000 });
            });
        }
      });
    } else if (table.status === 'occupied') {
      // Use new modern Action Menu
      const dialogRef = this.dialog.open(TableActionMenuComponent, {
        width: '450px',
        panelClass: 'action-menu-dialog',
        data: { table },
        autoFocus: false
      });

      dialogRef.afterClosed().subscribe(action => {
        if (!action) return;

        switch (action) {
          case 'order':
            this.router.navigate(['/client/menu', table.id]);
            break;
          case 'close':
            const billPreviewRef = this.dialog.open(TableBillPreviewDialogComponent, {
              width: '450px',
              panelClass: 'bill-preview-dialog',
              data: { table }
            });

            billPreviewRef.afterClosed().subscribe(confirmed => {
              if (confirmed) {
                this.tableService.closeTable(table.id)
                  .then(() => this.snackBar.open(`Mesa ${table.number} Cerrada`, 'OK', { duration: 3000 }))
                  .catch(err => this.snackBar.open('Error al cerrar mesa', 'Cerrar'));
              }
            });
            break;
          case 'bill':
            // Navigate to Cart/Bill for this specific table (History via URL)
            this.router.navigate(['/client/cart', table.id]);
            break;
          case 'qr':
            // Generate valid URL if missing or use existing
            let targetUrl = table.qr_code;
            if (!targetUrl) {
              const origin = window.location.origin;
              targetUrl = `${origin}/client/menu/${table.id}`;
              // Silently update DB for next time
              this.tableService.updateTable(table.id, { qr_code: targetUrl });
            }

            // Show Premium QR Dialog
            this.dialog.open(QrDisplayDialogComponent, {
              width: '400px',
              panelClass: 'qr-dialog',
              data: {
                url: targetUrl,
                tableNumber: table.number
              },
              autoFocus: false
            });
            break;
        }
      });
    }
  }

  onDragEnded(event: CdkDragEnd, table: Table): void {
    if (!this.isEditMode) return;

    const freePos = event.source.getFreeDragPosition();
    let x = freePos.x;
    let y = freePos.y;

    if (this.snapToGrid) {
      x = Math.round(x / this.gridSize) * this.gridSize;
      y = Math.round(y / this.gridSize) * this.gridSize;
    }

    table.x_position = x;
    table.y_position = y;

    this.tableService.updateTable(table.id, { x_position: x, y_position: y })
      .catch(err => {
        console.error('Error moving table:', err);
        // Revert position visually if needed, or just alert
        this.snackBar.open(`Error al mover mesa: ${err.message || 'Permisos insuficientes'}`, 'Cerrar', { duration: 4000 });
      });
  }


  onNewTableDropped(event: any): void {
    const dropPoint = event.dropPoint;
    const canvasRect = event.container.element.nativeElement.getBoundingClientRect();
    let x = dropPoint.x - canvasRect.left;
    let y = dropPoint.y - canvasRect.top;

    if (this.snapToGrid) {
      x = Math.round(x / this.gridSize) * this.gridSize;
      y = Math.round(y / this.gridSize) * this.gridSize;
    }

    this.addTableAtPosition(x, y);
  }

  private addTableAtPosition(x: number, y: number): void {
    if (!this.selectedZone) return;

    const newNumber = (this.tables.length + 1).toString();
    this.tableService.createTable({
      zone_id: this.selectedZone.id.toString(),
      number: newNumber,
      x_position: x,
      y_position: y,
      status: 'free',
      capacity: 4
    }).then(table => {
      this.tables.push(table);
      this.selectedTable = table;
      this.snackBar.open('Mesa creada', 'OK', { duration: 2000 });
    });
  }

  @ViewChild('boardContainer', { static: true }) boardContainer!: ElementRef;
  scaleFactor: number = 1;
  isMobileLayout: boolean = false;
  private readonly BASE_WIDTH = 1200; // Standard design width
  private readonly MOBILE_BREAKPOINT = 1024; // Tablet/Mobile cut-off

  @HostListener('window:resize')
  onResize() {
    this.checkLayout();
  }

  ngAfterViewInit() {
    setTimeout(() => this.checkLayout(), 0);
  }

  checkLayout(): void {
    if (!this.boardContainer) return;

    this.isMobileLayout = window.innerWidth < this.MOBILE_BREAKPOINT;

    if (this.isMobileLayout) {
      this.scaleFactor = 1; // Reset scale for flow layout
      this.zoomLevel = 100;
    } else {
      this.updateDesktopScale();
    }
  }

  updateDesktopScale(): void {
    const containerWidth = this.boardContainer.nativeElement.offsetWidth;
    const padding = 32;
    const availableWidth = containerWidth - padding;

    this.scaleFactor = Math.min(availableWidth / this.BASE_WIDTH, 1);
    this.scaleFactor = Math.max(this.scaleFactor, 0.4);
    this.zoomLevel = Math.round(this.scaleFactor * 100);
  }

  // Adjusted drag end to account for scale if needed, 
  // but usually cdkDrag with freeDragPosition works on the element's coordinate system.

  getTableCountByStatus(status: string): number {
    return this.tables.filter(table => table.status === status).length;
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

  trackByTableId(index: number, table: Table): string {
    return table.id;
  }

  getTablePosition(table: Table): { x: number, y: number } {
    return { x: table.x_position, y: table.y_position };
  }

  saveTableChanges(): void {
    if (this.selectedTable) {
      this.tableService.updateTable(this.selectedTable.id, this.selectedTable)
        .then(() => {
          this.snackBar.open('Cambios guardados', 'Cerrar', { duration: 2000 });
          this.selectedTable = null;
        });
    }
  }

  cancelTableChanges(): void {
    this.selectedTable = null;
  }

  private saveLayout(): void {
    if (this.tables.length === 0) return;

    this.snackBar.open('Guardando disposición...', '', { duration: 1000 });

    const updatePromises = this.tables.map(table =>
      this.tableService.updateTable(table.id, {
        x_position: table.x_position,
        y_position: table.y_position
      })
    );

    Promise.all(updatePromises)
      .then(() => {
        this.snackBar.open('Disposición guardada correctamente', 'OK', { duration: 2000 });
      })
      .catch(err => {
        console.error('Error saving layout:', err);
        this.snackBar.open('Error al guardar la disposición', 'Cerrar', { duration: 3000 });
      });
  }
}