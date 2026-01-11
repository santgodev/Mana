export interface Sale {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  status: 'pending' | 'completed' | 'cancelled';
  paymentMethod: 'cash' | 'card' | 'transfer';
  userId: number;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateSaleRequest {
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: CreateSaleItemRequest[];
  discount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
}

export interface CreateSaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
}
