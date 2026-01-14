import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface MonthlyStats {
    // Financial Metrics
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;

    // Sales Metrics
    totalSales: number;
    orderCount: number;
    averageTicket: number;

    // Operational Metrics
    customerCount: number;
    itemsSold: number;
    avgItemsPerOrder: number;
    tableTurnoverRate: number;

    // Efficiency Metrics
    avgAttentionTime: number; // in minutes
    avgPrepTime: number; // in minutes

    // Analytics
    topProducts: TopProduct[];
    peakHours: { hour: number, count: number }[];
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

        // 1. Fetch all paid orders for the month with kitchen item timestamps
        const { data: orders, error: ordersError } = await this.supabase.client
            .from('orders')
            .select(`
                id,
                status,
                updated_at,
                created_at,
                kitchen_started_at,
                kitchen_finished_at,
                order_items (
                    quantity,
                    unit_price,
                    started_at,
                    finished_at,
                    created_at,
                    product:products ( name )
                )
            `)
            .eq('status', 'paid')
            .gte('updated_at', startOfMonth)
            .lte('updated_at', endOfMonth);

        if (ordersError) throw ordersError;

        // 2. Fetch completed table sessions for attention time and customer count
        const { data: sessions, error: sessionsError } = await this.supabase.client
            .from('table_sessions')
            .select('start_time, end_time, client_count')
            .eq('status', 'closed')
            .gte('end_time', startOfMonth)
            .lte('end_time', endOfMonth);

        if (sessionsError) throw sessionsError;

        // 3. Fetch expenses from cash transactions
        const { data: expenses, error: expensesError } = await this.supabase.client
            .from('cash_transactions')
            .select('amount')
            .eq('type', 'expense')
            .gte('created_at', startOfMonth)
            .lte('created_at', endOfMonth);

        if (expensesError) throw expensesError;

        // 4. Count unique tables used (for turnover rate)
        const { data: tablesUsed, error: tablesError } = await this.supabase.client
            .from('table_sessions')
            .select('table_id')
            .eq('status', 'closed')
            .gte('end_time', startOfMonth)
            .lte('end_time', endOfMonth);

        if (tablesError) throw tablesError;

        let totalSales = 0;
        let orderCount = orders?.length || 0;
        let itemsSold = 0;
        const productMap = new Map<string, { quantity: number, revenue: number }>();
        const hourMap = new Map<number, number>();
        let totalPrepTimeMs = 0;
        let prepCount = 0;

        orders?.forEach(order => {
            const items = (order.order_items as any[]) || [];
            items.forEach(item => {
                const subtotal = item.quantity * item.unit_price;
                totalSales += subtotal;
                itemsSold += item.quantity;

                const productName = item.product?.name || 'Producto Desconocido';
                const current = productMap.get(productName) || { quantity: 0, revenue: 0 };
                productMap.set(productName, {
                    quantity: current.quantity + item.quantity,
                    revenue: current.revenue + subtotal
                });

                // Item Preparation time calculation
                // Priority: item.finished_at - (item.started_at || item.created_at || order.created_at)
                if (item.finished_at) {
                    const end = new Date(item.finished_at).getTime();
                    const start = new Date(item.started_at || item.created_at || order.created_at).getTime();
                    const duration = end - start;
                    if (duration > 0) {
                        totalPrepTimeMs += duration;
                        prepCount++;
                    }
                }
            });

            // Fallback to order-level timestamps if no items had finished_at
            if (prepCount === 0 && order.kitchen_started_at && order.kitchen_finished_at) {
                const start = new Date(order.kitchen_started_at).getTime();
                const end = new Date(order.kitchen_finished_at).getTime();
                totalPrepTimeMs += (end - start);
                prepCount++;
            }

            // Peak hours calculation (using order creation time)
            const hour = new Date(order.created_at).getHours();
            hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
        });

        // Calculate expenses
        const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

        // Calculate customer count
        const customerCount = sessions?.reduce((sum, session) => sum + (session.client_count || 0), 0) || 0;

        // Attention time calculation
        let totalAttentionTimeMs = 0;
        let attentionCount = 0;
        sessions?.forEach(session => {
            if (session.start_time && session.end_time) {
                const start = new Date(session.start_time).getTime();
                const end = new Date(session.end_time).getTime();
                const duration = end - start;
                if (duration > 0) {
                    totalAttentionTimeMs += duration;
                    attentionCount++;
                }
            }
        });

        // Table turnover rate
        const uniqueTables = new Set(tablesUsed?.map(t => t.table_id) || []);
        const tableTurnoverRate = uniqueTables.size > 0 ? (sessions?.length || 0) / uniqueTables.size : 0;

        const topProducts: TopProduct[] = Array.from(productMap.entries())
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                totalRevenue: data.revenue
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        const peakHours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            count: hourMap.get(i) || 0
        }));

        // Financial calculations
        const totalIncome = totalSales;
        const netProfit = totalIncome - totalExpenses;
        const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

        return {
            // Financial
            totalIncome,
            totalExpenses,
            netProfit,
            profitMargin,

            // Sales
            totalSales,
            orderCount,
            averageTicket: orderCount > 0 ? totalSales / orderCount : 0,

            // Operational
            customerCount,
            itemsSold,
            avgItemsPerOrder: orderCount > 0 ? itemsSold / orderCount : 0,
            tableTurnoverRate,

            // Efficiency
            avgAttentionTime: attentionCount > 0 ? (totalAttentionTimeMs / attentionCount) / (1000 * 60) : 0,
            avgPrepTime: prepCount > 0 ? (totalPrepTimeMs / prepCount) / (1000 * 60) : 0,

            // Analytics
            topProducts,
            peakHours
        };
    }
}
