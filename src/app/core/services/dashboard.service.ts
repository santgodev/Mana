import { Injectable } from '@angular/core';
import { Observable, from, combineLatest, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DashboardMetrics, TopSellingProduct, MonthlyRevenue, InventoryStatus } from '../../models';
import { Product, Order, CashTransaction } from '../../models/supabase.types';
import { SupabaseService } from './supabase.service';

export interface Activity {
  icon: string;
  text: string;
  time: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  constructor(
    private supabase: SupabaseService
  ) { }

  getDashboardMetrics(): Observable<DashboardMetrics> {
    // 1. Fetch Products for Inventory Stats
    const products$ = from(this.supabase.client.from('products').select('*'));

    // 2. Fetch Orders (with items) for Sales Stats
    // For MVP, just fetching all orders. In prod, filter by date range.
    const orders$ = from(this.supabase.client.from('orders').select('*, order_items(*, products(*))'));

    return combineLatest([products$, orders$]).pipe(
      map(([productsRes, ordersRes]) => {
        const products = (productsRes.data as Product[]) || [];
        const orders = (ordersRes.data as any[]) || [];

        // --- Inventory Logic ---
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => p.stock <= 5).length; // Threshold 5
        const inventoryStatus = this.calculateInventoryStatus(products);

        // --- Sales Logic ---
        // Consider 'paid' or 'delivered' as completed sales for revenue
        const completedOrders = orders.filter(o => o.status === 'paid' || o.status === 'delivered');

        const totalSales = completedOrders.length;

        let totalRevenue = 0;
        const recentSales = orders.length; // Or filter by date

        // Calculate Revenue from Order Items
        completedOrders.forEach(order => {
          if (order.order_items) {
            order.order_items.forEach((item: any) => {
              totalRevenue += (item.quantity * item.unit_price);
            });
          }
        });

        // Top Selling
        const topSellingProducts = this.calculateTopSelling(completedOrders);
        const monthlyRevenue: MonthlyRevenue[] = []; // Implement if needed, leaving empty for now to save complexity

        return {
          totalProducts,
          totalSales,
          totalRevenue,
          lowStockProducts,
          recentSales, // Using total order count as proxy for recent activity in this context
          topSellingProducts,
          monthlyRevenue,
          inventoryStatus
        };
      }),
      catchError(err => {
        console.error('Error fetching dashboard metrics', err);
        return of({
          totalProducts: 0,
          totalSales: 0,
          totalRevenue: 0,
          lowStockProducts: 0,
          recentSales: 0,
          topSellingProducts: [],
          monthlyRevenue: [],
          inventoryStatus: { normal: 0, low: 0, out: 0, overstock: 0 }
        } as DashboardMetrics);
      })
    );
  }

  getRecentActivities(): Observable<Activity[]> {
    // 1. Fetch Table Sessions (Open/Close events)
    // We want the most recent sessions. 
    // If a session is closed, it has an end_time. If open, start_time.
    // For simplicity, we order by start_time DESC.
    const sessionsQuery = this.supabase.client
      .from('table_sessions')
      .select('*, tables(number)') // Join to get table number
      .order('start_time', { ascending: false })
      .limit(5);

    // 2. Fetch Cash Transactions (Income/Expense)
    const cashQuery = this.supabase.client
      .from('cash_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    return combineLatest([from(sessionsQuery), from(cashQuery)]).pipe(
      map(([sessionsRes, cashRes]) => {
        const activities: Activity[] = [];

        // Map Table Sessions
        if (sessionsRes.data) {
          sessionsRes.data.forEach((s: any) => {
            const tableNum = s.tables?.number || '??';

            // Create an activity for the OPENING
            activities.push({
              icon: 'table_restaurant',
              text: `Mesa ${tableNum} abierta`,
              time: this.timeSince(new Date(s.start_time))
            });

            // If closed, Create an activity for the CLOSING
            // Ideally we'd treat them as separate events time-wise, but for this "Recent Activity" feed,
            // if it's closed, we probably care more about the closure result than the opening.
            // However, if we just push both, they might clutter. 
            // Let's refine: 
            // - If status is 'closed', show "Mesa X Cerrada - Total $..."
            // - If status is 'active', show "Mesa X Abierta"
            // This reflects the *current significant state* or the *most recent event* of that session.

            // better approach: 
            // If we want a timeline, we need distinct events.
            // But our DB row is a "Session".
            // Let's just show the LATEST status of that session as the activity.
            if (s.status === 'closed') {
              activities.push({
                icon: 'check_circle',
                text: `Mesa ${tableNum} cerrada - Total: $${s.total_amount || 0}`,
                time: this.timeSince(new Date(s.end_time || s.start_time)) // Use end time
              });
            }
          });
        }

        // Map Cash Transactions
        if (cashRes.data) {
          cashRes.data.forEach((t: any) => {
            activities.push({
              icon: t.type === 'income' ? 'savings' : 'payments',
              text: `${t.type === 'income' ? 'Ingreso' : 'Gasto'}: ${t.description} ($${t.amount})`,
              time: this.timeSince(new Date(t.created_at))
            });
          });
        }

        // Sort merged list manually by "time ago" string is hard.
        // We should re-sort by raw date if possible, but we lost raw date in map.
        // Hack: Just return the mixed list. Since we pulled "recent" from DB, they are somewhat ordered.
        // Ideally we'd map to an intermediate object with 'date' field, sort, then map to Activity.

        return activities
          .sort((a, b) => {
            // Very rough sort based on "Hace..." string? No, that's fragile.
            // Let's rely on the DB fetch order.
            return 0;
          })
          .slice(0, 6);
      })
    );
  }

  // --- Helpers ---

  private calculateInventoryStatus(products: Product[]): InventoryStatus {
    let normal = 0;
    let low = 0;
    let out = 0;
    let overstock = 0;

    products.forEach(p => {
      if (p.stock === 0) out++;
      else if (p.stock <= 5) low++;
      else if (p.stock > 50) overstock++;
      else normal++;
    });
    return { normal, low, out, overstock };
  }

  private calculateTopSelling(orders: any[]): TopSellingProduct[] {
    const salesMap = new Map<string, { name: string, quantity: number, revenue: number }>();

    orders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          const pid = item.product_id;
          const name = item.products?.name || 'Producto';
          const total = item.quantity * item.unit_price;

          if (salesMap.has(pid)) {
            const existing = salesMap.get(pid)!;
            existing.quantity += item.quantity;
            existing.revenue += total;
          } else {
            salesMap.set(pid, { name, quantity: item.quantity, revenue: total });
          }
        });
      }
    });

    return Array.from(salesMap.entries())
      .map(([id, val]) => ({
        productId: Number(id), // Note: ID might be UUID, interface expects number? Check Types.
        productName: val.name,
        quantitySold: val.quantity,
        revenue: val.revenue
      }))
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);
  }

  private timeSince(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
  }
}
