import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Sale, CreateSaleRequest, SaleItem } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class SaleService {
  private salesSubject = new BehaviorSubject<Sale[]>(this.getMockSales());
  public sales$ = this.salesSubject.asObservable();

  private getMockSales(): Sale[] {
    return [
      {
        id: 1,
        customerName: 'Juan Pérez',
        customerEmail: 'juan@email.com',
        customerPhone: '555-0123',
        total: 929.98,
        subtotal: 929.98,
        tax: 0,
        discount: 0,
        status: 'completed',
        paymentMethod: 'card',
        userId: 2,
        userName: 'Gerente',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
        items: [
          {
            id: 1,
            saleId: 1,
            productId: 1,
            productName: 'Laptop HP Pavilion',
            quantity: 1,
            unitPrice: 899.99,
            total: 899.99
          },
          {
            id: 2,
            saleId: 1,
            productId: 2,
            productName: 'Camiseta Nike',
            quantity: 1,
            unitPrice: 29.99,
            total: 29.99
          }
        ]
      },
      {
        id: 2,
        customerName: 'María García',
        customerEmail: 'maria@email.com',
        customerPhone: '555-0456',
        total: 199.99,
        subtotal: 199.99,
        tax: 0,
        discount: 0,
        status: 'completed',
        paymentMethod: 'cash',
        userId: 3,
        userName: 'Empleado',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
        items: [
          {
            id: 3,
            saleId: 2,
            productId: 3,
            productName: 'Silla de Oficina',
            quantity: 1,
            unitPrice: 199.99,
            total: 199.99
          }
        ]
      }
    ];
  }

  getSales(): Observable<Sale[]> {
    return this.sales$;
  }

  getSale(id: number): Observable<Sale | undefined> {
    const sales = this.salesSubject.value;
    const sale = sales.find(s => s.id === id);
    return of(sale);
  }

  createSale(saleData: CreateSaleRequest): Observable<Sale> {
    const sales = this.salesSubject.value;
    
    // Calculate totals
    const subtotal = saleData.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const discountAmount = (subtotal * saleData.discount) / 100;
    const tax = (subtotal - discountAmount) * 0.16; // 16% tax
    const total = subtotal - discountAmount + tax;

    const newSale: Sale = {
      id: Math.max(...sales.map(s => s.id)) + 1,
      customerName: saleData.customerName,
      customerEmail: saleData.customerEmail,
      customerPhone: saleData.customerPhone,
      total: Math.round(total * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discountAmount * 100) / 100,
      status: 'pending',
      paymentMethod: saleData.paymentMethod,
      userId: 1, // Mock user ID
      userName: 'Usuario Actual', // Mock user name
      createdAt: new Date(),
      updatedAt: new Date(),
      items: saleData.items.map((item, index) => ({
        id: index + 1,
        saleId: Math.max(...sales.map(s => s.id)) + 1,
        productId: item.productId,
        productName: 'Producto', // Will be updated with actual product name
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice
      }))
    };

    const updatedSales = [...sales, newSale];
    this.salesSubject.next(updatedSales);
    
    return of(newSale);
  }

  updateSaleStatus(id: number, status: 'pending' | 'completed' | 'cancelled'): Observable<Sale> {
    const sales = this.salesSubject.value;
    const index = sales.findIndex(s => s.id === id);
    
    if (index === -1) {
      throw new Error('Venta no encontrada');
    }

    const updatedSale = {
      ...sales[index],
      status,
      updatedAt: new Date()
    };

    const updatedSales = [...sales];
    updatedSales[index] = updatedSale;
    this.salesSubject.next(updatedSales);
    
    return of(updatedSale);
  }

  getSalesByDateRange(startDate: Date, endDate: Date): Observable<Sale[]> {
    const sales = this.salesSubject.value;
    const filteredSales = sales.filter(s => 
      s.createdAt >= startDate && s.createdAt <= endDate
    );
    return of(filteredSales);
  }

  getTotalRevenue(): Observable<number> {
    const sales = this.salesSubject.value;
    const completedSales = sales.filter(s => s.status === 'completed');
    const total = completedSales.reduce((sum, sale) => sum + sale.total, 0);
    return of(Math.round(total * 100) / 100);
  }
}
