import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MonthlyStats {
    totalSales: number;
    orderCount: number;
    averageTicket: number;
    topProducts: TopProduct[];
}

export interface TopProduct {
    name: string;
    quantity: number;
    totalRevenue: number;
}

@Injectable({
    providedIn: 'root'
})
export class ReportService {

    constructor(private supabase: SupabaseService) { }

    async getMonthlyStats(): Promise<MonthlyStats> {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // 1. Fetch all paid orders for the month
        const { data: orders, error: ordersError } = await this.supabase.client
            .from('orders')
            .select(`
                id,
                status,
                updated_at,
                order_items (
                    quantity,
                    unit_price,
                    product:products ( name )
                )
            `)
            .eq('status', 'paid')
            .gte('updated_at', startOfMonth)
            .lte('updated_at', endOfMonth);

        if (ordersError) throw ordersError;

        let totalSales = 0;
        let orderCount = orders?.length || 0;
        const productMap = new Map<string, { quantity: number, revenue: number }>();

        orders?.forEach(order => {
            const items = (order.order_items as any[]) || [];
            items.forEach(item => {
                const subtotal = item.quantity * item.unit_price;
                totalSales += subtotal;

                const productName = item.product?.name || 'Producto Desconocido';
                const current = productMap.get(productName) || { quantity: 0, revenue: 0 };
                productMap.set(productName, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + subtotal
                });
            });
        });

        const topProducts: TopProduct[] = Array.from(productMap.entries())
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                totalRevenue: data.revenue
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            totalSales,
            orderCount,
            averageTicket: orderCount > 0 ? totalSales / orderCount : 0,
            topProducts
        };
    }
}
