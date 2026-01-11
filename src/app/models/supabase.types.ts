export type UserRole = 'admin' | 'waiter' | 'kitchen' | 'client';
export type TableStatus = 'free' | 'occupied' | 'waiting' | 'paying';
export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled' | 'paid';
export type ItemStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';

export interface Profile {
    id: string;
    email: string;
    username?: string;
    role: UserRole;
    created_at: string;
}

export interface Zone {
    id: string;
    name: string;
    description?: string;
    type?: 'indoor' | 'outdoor' | 'terrace' | 'private' | 'floor';
    floor?: number;
    capacity?: number;
    active: boolean;
    layout?: any;
    created_at?: string;
    // Joins
    tables?: Table[];
}

export interface Table {
    id: string;
    zone_id: string;
    number: string;
    status: TableStatus;
    capacity: number;
    x_position: number;
    y_position: number;
    shape?: string;
    current_session_id?: string;
    qr_code?: string;
    current_session_start_time?: string;
    // Legacy/Future properties
    currentOrder?: any;
    reservation?: any;
    created_at?: string;
}

export interface TableSession {
    id: string;
    table_id: string;
    waiter_id?: string;
    start_time: string;
    end_time?: string;
    ideal_duration: number;
    client_count: number;
    total_amount: number;
    status: 'active' | 'closed';
}

export interface Station {
    id: string;
    name: string;
    created_at?: string;
}

export interface Category {
    id: string;
    name: string;
    icon?: string;
    active: boolean;
    station_id?: string;
    stations?: Station; // Join
}

export interface Product {
    id: string;
    category_id?: string;
    name: string;
    description?: string;
    price: number;
    cost?: number;
    stock: number;
    is_available: boolean;
    prep_time_minutes: number;
    image_url?: string;
    created_at?: string;
}

export interface Order {
    id: string;
    session_id?: string;
    table_id: string;
    waiter_id?: string;
    status: OrderStatus;
    priority: number;
    estimated_total_time: number; // In minutes
    kitchen_started_at?: string;
    kitchen_finished_at?: string;
    created_at: string;
    updated_at: string;
    // Joins
    order_items?: OrderItem[];
    table?: Table;
}

export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    notes?: string;
    status: ItemStatus;
    started_at?: string;
    finished_at?: string;
    created_at: string;
    // Joins
    products?: Product;
}

export interface ZoneStats {
    totalZones: number;
    activeZones: number;
    totalTables: number;
    availableTables: number;
    occupiedTables: number;
    reservedTables: number;
    maintenanceTables: number;
}

export interface CashShift {
    id: string;
    opened_at: string;
    closed_at?: string;
    base_amount: number;
    final_cash_expected?: number;
    final_cash_real?: number;
    difference?: number;
    status: 'open' | 'closed';
    opened_by: string; // User UUID
    closed_by?: string; // User UUID
    notes?: string;
    created_at?: string;
}

export interface CashTransaction {
    id: string;
    shift_id: string;
    type: 'expense' | 'income';
    amount: number;
    description: string;
    user_id: string;
    created_at: string;
}

