export interface Table {
  id: number;
  number: number;
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  location: 'indoor' | 'outdoor' | 'terrace' | 'private';
  shape: 'round' | 'square' | 'rectangle';
  zoneId: number;
  position: {
    x: number;
    y: number;
  };
  currentOrder?: Order;
  reservation?: Reservation;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: number;
  tableId: number;
  customerName: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'open' | 'closed' | 'cancelled';
  startTime: Date;
  endTime?: Date;
  notes?: string;
  userId: number;
  userName: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  notes?: string;
}

export interface Reservation {
  id: number;
  tableId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTableRequest {
  number: number;
  name: string;
  capacity: number;
  location: 'indoor' | 'outdoor' | 'terrace' | 'private';
  position: {
    x: number;
    y: number;
  };
}

export interface UpdateTableRequest extends Partial<CreateTableRequest> {
  id: number;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  currentOrder?: Order;
  reservation?: Reservation;
}

export interface CreateReservationRequest {
  tableId: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: Date;
  startTime: string;
  endTime: string;
  partySize: number;
  specialRequests?: string;
}

export interface TableStats {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  maintenanceTables: number;
  totalRevenue: number;
  averageOrderValue: number;
  peakHours: string[];
}

export interface TablePosition {
  x: number;
  y: number;
}
