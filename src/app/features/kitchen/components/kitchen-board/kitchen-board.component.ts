import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenService } from '../../../../core/services/kitchen.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Order, OrderItem } from '../../../../models/supabase.types';
import { Subscription, interval } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { StationService } from '../../../../core/services/station.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';


@Component({
    selector: 'app-kitchen-board',
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatChipsModule,
        MatDividerModule,
        MatDividerModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        FormsModule,
        MatDialogModule,
        MatSnackBarModule
    ],
    templateUrl: './kitchen-board.component.html',
    styleUrls: ['./kitchen-board.component.scss']
})
export class KitchenBoardComponent implements OnInit, OnDestroy {
    rawOrders: any[] = []; // Store raw orders to re-filter
    orders: any[] = [];
    stations$: any;
    selectedStationId: string = 'all';

    private sub: Subscription = new Subscription();
    private refreshInterval = interval(30000); // Check priorities every 30s

    isHandset$: Observable<boolean>;

    constructor(
        private kitchenService: KitchenService,
        private stationService: StationService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private breakpointObserver: BreakpointObserver
    ) {
        this.stations$ = this.stationService.stations$;
        this.isHandset$ = this.breakpointObserver.observe([Breakpoints.Handset])
            .pipe(
                map(result => result.matches),
                shareReplay()
            );
    }

    ngOnInit(): void {
        this.stationService.loadStations();

        this.sub.add(
            this.kitchenService.orders$.subscribe(orders => {
                console.log('📦 DEBUG COCINA - Pedidos Recibidos:', orders);
                // Safe debug logging with type casting
                if (orders.length > 0) {
                    const firstOrder = orders[0] as any;
                    console.log('🐞 DIAGNÓSTICO DE PEDIDO:', firstOrder.id);
                    if (firstOrder.order_items) {
                        firstOrder.order_items.forEach((item: any) => {
                            const cats = item.products?.categories;
                            console.log(`   🛒 Producto: ${item.products?.name}`);
                            console.log(`      Categoría Raw:`, cats);
                            const stId = (Array.isArray(cats) && cats.length > 0) ? cats[0].station_id : cats?.station_id;
                            console.log(`      Station ID en Item: '${stId}'`);
                            console.log(`      Station ID Seleccionada: '${this.selectedStationId}'`);
                            console.log(`      ¿MATCH? ${stId === this.selectedStationId}`);
                        });
                    }
                }
                this.rawOrders = orders;
                this.filterOrders();
            })
        );

        // Periodic refresh for priority calculation time updates
        this.sub.add(
            this.refreshInterval.subscribe(() => {
                this.orders = this.sortOrders(this.orders); // Re-sort based on updated times
            })
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    onStationChange(event: any) {
        // MatChipListbox emits a change event, but we bound value.
        // If coming from chip SelectionChange
        if (event.value) {
            this.selectedStationId = event.value;
        }
        console.log('🔄 CAMBIO DE ESTACIÓN:', this.selectedStationId);
        this.filterOrders();
    }

    filterOrders() {
        console.log('🧹 Filtrando pedidos para estación:', this.selectedStationId);
        console.log('   Pedidos Raw Disponibles:', this.rawOrders.length);

        if (this.selectedStationId === 'all') {
            this.orders = this.sortOrders([...this.rawOrders]);
            return;
        }

        // Filter orders that have AT LEAST one item for this station
        const stationOrders = this.rawOrders.filter(order => {
            // Debug each order check
            const hasItem = order.order_items.some((item: any) => {
                const match = this.isItemForCurrentStation(item);
                // Only log failures if we expected success (e.g. valid product)
                if (item.products?.name?.includes('Cerveza') || item.products?.name?.includes('Test')) {
                    console.log(`🧐 DEBUG CHECK: ${item.products?.name}`);
                    console.log(`   Station Esperada: ${this.selectedStationId}`);
                    console.log(`   Categoría Objeto:`, item.products?.categories);
                    console.log(`   Es Match?: ${match}`);
                }
                return match;
            });
            return hasItem;
        });

        console.log('   Resultado filtro:', stationOrders.length);
        this.orders = this.sortOrders(stationOrders);
    }

    isItemForCurrentStation(item: any): boolean {
        if (this.selectedStationId === 'all') return true;

        const cats = item.products?.categories;
        let itemStationId: string | undefined;

        if (Array.isArray(cats) && cats.length > 0) {
            itemStationId = cats[0].station_id;
        } else if (cats) {
            itemStationId = cats.station_id;
        }

        return itemStationId === this.selectedStationId;
    }

    // --- Logic ---

    sortOrders(orders: Order[]): Order[] {
        return orders.sort((a, b) => {
            // 1. Priority: Critical > Warning > Normal
            const pA = this.getPriority(a);
            const pB = this.getPriority(b);
            const priorityWeight: Record<string, number> = { 'critical': 3, 'warning': 2, 'normal': 1 };

            if ((priorityWeight[pA] || 0) !== (priorityWeight[pB] || 0)) {
                return (priorityWeight[pB] || 0) - (priorityWeight[pA] || 0);
            }

            // 2. Status: In Progress > Pending
            if (a.status !== b.status) {
                if (a.status === 'in_progress') return -1;
                if (b.status === 'in_progress') return 1;
            }

            // 3. FIFO
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
    }

    getPriority(order: Order): string {
        return this.kitchenService.getPriorityLevel(order);
    }

    trackByOrderId(index: number, order: Order): string {
        return order.id;
    }

    getElapsedTime(dateStr: string): string {
        const start = new Date(dateStr).getTime();
        const now = new Date().getTime();
        const diffMs = now - start;
        const minutes = Math.floor(diffMs / 60000);
        return `${minutes} min`;
    }

    // --- Actions ---

    async toggleItemStatus(item: any) {
        // Prevent toggling if it's not my station (unless I'm viewing all, then allowed as admin/overlord)
        if (!this.isItemForCurrentStation(item) && this.selectedStationId !== 'all') return;

        const newStatus = item.status === 'ready' ? 'pending' : 'ready';
        // Optimistic update (UI)
        item.status = newStatus;

        try {
            await this.kitchenService.updateItemStatus(item.id, newStatus);
        } catch (err) {
            console.error('Error updating item', err);
            item.status = item.status === 'ready' ? 'pending' : 'ready'; // Revert
        }
    }

    async markStationItemsReady(order: any) {
        // Find all pending items for current station
        const itemsToUpdate = order.order_items.filter((item: any) =>
            this.isItemForCurrentStation(item) && item.status !== 'ready'
        );

        if (itemsToUpdate.length === 0) return;

        // Optimistic UI update
        itemsToUpdate.forEach((item: any) => item.status = 'ready');

        // Parallel requests (or could add a bulk endpoint, but this is fine for < 10 items)
        await Promise.all(itemsToUpdate.map((item: any) =>
            this.kitchenService.updateItemStatus(item.id, 'ready')
        ));
    }

    async clearAll() {
        // Clear Local View Only (or add backend service method if supported)
        // There is no standard "Delete All" in OrderService usually, so this might be clearing specific state
        // Checking previous implementation: this.orders = [];

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Borrar todo',
                message: '¿Seguro que quieres borrar todos los pedidos en pantalla? (Solo vista local)',
                confirmText: 'Borrar',
                icon: 'delete_sweep',
                type: 'danger'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.orders = [];
                this.snackBar.open('Pantalla limpia', 'OK', { duration: 2000 });
            }
        });
    }

    getOrderProgress(order: any): number {
        if (!order.order_items || order.order_items.length === 0) return 0;
        const total = order.order_items.length;
        const ready = order.order_items.filter((i: any) => i.status === 'ready').length;
        return (ready / total) * 100;
    }
}
