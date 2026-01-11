import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CartItem } from './client-cart.service';
import { Order, OrderItem } from '../../models/supabase.types';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    constructor(private supabase: SupabaseService) { }

    async createClientOrder(tableId: string, cart: CartItem[]): Promise<Order | null> {
        if (!cart || cart.length === 0) return null;

        // 1. Get or Create Session? 
        // For MVP QR, we might link directly to table. 
        // Ideally we should check if there is an open session for the table.
        // For now, let's just create an order linked to the table.
        // OPTIONAL: Fetch table's current session.

        // We assume the policy allows INSERT on 'orders' and 'order_items' for public/anon

        // 1. Get Table Data (ID and Session)
        let resolvedTableId = tableId;
        let pSessionId = null;

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);

        // Fetch table details to get ID and Current Session
        const { data: tableData, error: tableError } = await this.supabase.client
            .from('tables')
            .select('id, current_session_id')
            .eq(isUuid ? 'id' : 'number', tableId)
            .single();

        if (tableError || !tableData) {
            console.error('Error finding table:', tableError);
            throw new Error(`Mesa ${tableId} no encontrada.`);
        }
        resolvedTableId = tableData.id;
        pSessionId = tableData.current_session_id;

        // 2. Create Order linked to Table AND Session
        const { data: orderData, error: orderError } = await this.supabase.client
            .from('orders')
            .insert({
                table_id: resolvedTableId,
                session_id: pSessionId, // Link to current session
                status: 'pending',
                priority: 1,
            })
            .select()
            .single();

        if (orderError) {
            console.error('Error creating order:', orderError);
            throw orderError;
        }

        if (!orderData) throw new Error('Order creation failed returning no data');

        const orderId = orderData.id;

        // 3. Create Order Items
        const itemsToInsert = cart.map(item => ({
            order_id: orderId,
            product_id: item.product.id,
            quantity: item.quantity,
            unit_price: item.product.price,
            notes: item.notes,
            status: 'pending'
        }));

        const { error: itemsError } = await this.supabase.client
            .from('order_items')
            .insert(itemsToInsert);

        if (itemsError) {
            console.error('Error creating items:', itemsError);
            // Ideally rollback order here if possible, or mark as cancelled
            // Supabase JS doesn't support transactions easily on client without RPC
            // We will assume happy path or manual cleanup for MVP
            throw itemsError;
        }

        return orderData;
    }

    async getActiveOrderItems(tableId: string): Promise<any[]> {
        // 1. Get Table Session
        const { data: tableData, error: tableError } = await this.supabase.client
            .from('tables')
            .select('current_session_id')
            .eq('id', tableId)
            .single();

        if (tableError || !tableData?.current_session_id) return [];

        // 2. Get Orders for this session
        const { data: orders, error: ordersError } = await this.supabase.client
            .from('orders')
            .select('id, created_at, status')
            .eq('table_id', tableId)
            .eq('session_id', tableData.current_session_id) // Strict session filtering
            .neq('status', 'cancelled'); // We might want to show 'paid' if they belong to this session? Usually 'pending'/'delivered'.

        if (ordersError || !orders || orders.length === 0) return [];

        const orderIds = orders.map(o => o.id);

        // 3. Get Items
        const { data: items, error: itemsError } = await this.supabase.client
            .from('order_items')
            .select('*, product:products(name, price)') // Join product
            .in('order_id', orderIds);

        if (itemsError) {
            console.error('Error fetching stored items:', itemsError);
            return [];
        }

        return items || [];
    }
}
