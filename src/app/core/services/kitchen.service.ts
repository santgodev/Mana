import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Order, OrderStatus } from '../../models/supabase.types';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
export class KitchenService {
    private _orders = new BehaviorSubject<Order[]>([]);
    private ordersSubscription: RealtimeChannel | null = null;

    constructor(private supabase: SupabaseService) {
        this.loadActiveOrders();
        this.subscribeToOrderChanges();
    }

    get orders$(): Observable<Order[]> {
        return this._orders.asObservable();
    }

    async loadActiveOrders() {
        // Fetch orders that are pending or in_progress, including items and table info
        const { data, error } = await this.supabase.client
            .from('orders')
            .select(`
        *,
        order_items (
          *,
          products (
            name,
            categories (
                station_id,
                name
            )
          )
        ),
        table:tables (number, zone_id)
      `)
            .in('status', ['pending', 'in_progress'])
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading kitchen orders:', error);
            return;
        }

        if (data) {
            this._orders.next(data as any);
        }
    }

    subscribeToOrderChanges() {
        // Subscribe to Orders
        this.ordersSubscription = this.supabase.client
            .channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                this.loadActiveOrders();
            })
            .subscribe();

        // Subscribe to Order Items (to catch details status changes)
        this.supabase.client
            .channel('public:order_items')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'order_items' }, () => {
                this.loadActiveOrders();
            })
            .subscribe();
    }

    // --- Kitchen Actions ---

    async startPreparation(orderId: string) {
        const { error } = await this.supabase.client
            .from('orders')
            .update({
                status: 'in_progress',
                kitchen_started_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;
    }

    async completeOrder(orderId: string) {
        // Legacy method, better to use item updates now
        const { error } = await this.supabase.client
            .from('orders')
            .update({
                status: 'ready',
                kitchen_finished_at: new Date().toISOString()
            })
            .eq('id', orderId);

        if (error) throw error;
    }

    async updateItemStatus(itemId: string, status: 'preparing' | 'ready' | 'pending') {
        const updates: any = { status };
        if (status === 'preparing') updates.started_at = new Date().toISOString();
        if (status === 'ready') updates.finished_at = new Date().toISOString();

        const { error } = await this.supabase.client
            .from('order_items')
            .update(updates)
            .eq('id', itemId);

        if (error) throw error;
    }

    async archiveAllOrders() {
        // Archives all currently visible orders (pending/in_progress)
        const { error } = await this.supabase.client
            .from('orders')
            .update({ status: 'cancelled' })
            .in('status', ['pending', 'in_progress']);

        if (error) throw error;
        // The realtime subscription will automatically update the UI
    }

    // --- Priority Logic (Helper) ---

    getPriorityLevel(order: Order): 'normal' | 'warning' | 'critical' {
        if (!order.kitchen_started_at && !order.created_at) return 'normal';

        // Default estimate if not set (e.g. 15 mins)
        const estimatedMinutes = order.estimated_total_time || 15;
        const createdAt = new Date(order.created_at).getTime();
        const now = new Date().getTime();
        const elapsedMinutes = (now - createdAt) / 60000;

        const percentage = elapsedMinutes / estimatedMinutes;

        if (percentage >= 1.0) return 'critical'; // Over time
        if (percentage >= 0.7) return 'warning';  // Close to limit
        return 'normal';
    }
}
