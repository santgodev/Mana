export interface InventoryMovement {
  id: number;
  productId: number;
  productName: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
  userId: number;
  userName: string;
  createdAt: Date;
}

export interface CreateInventoryMovementRequest {
  productId: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reference?: string;
}

export interface InventoryReport {
  productId: number;
  productName: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  totalIn: number;
  totalOut: number;
  lastMovement: Date;
  status: 'normal' | 'low' | 'out' | 'overstock';
}
