import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { InventoryMovement, CreateInventoryMovementRequest, InventoryReport } from '../../models';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private movementsSubject = new BehaviorSubject<InventoryMovement[]>(this.getMockMovements());
  public movements$ = this.movementsSubject.asObservable();

  constructor(private productService: ProductService) { }

  private getMockMovements(): InventoryMovement[] {
    return [
      {
        id: 1,
        productId: 1,
        productName: 'Laptop HP Pavilion',
        type: 'in',
        quantity: 20,
        reason: 'Compra inicial',
        reference: 'PO-001',
        userId: 1,
        userName: 'Administrador',
        createdAt: new Date('2024-01-15')
      }
    ];
  }

  getMovements(): Observable<InventoryMovement[]> {
    return this.movements$;
  }

  getMovementsByProduct(productId: number): Observable<InventoryMovement[]> {
    const movements = this.movementsSubject.value;
    const productMovements = movements.filter(m => m.productId === productId);
    return of(productMovements);
  }

  // Placeholder for createMovement (to be valid TS)
  createMovement(movementData: CreateInventoryMovementRequest): Observable<InventoryMovement> {
    return of({} as InventoryMovement);
  }

  getInventoryReport(): Observable<InventoryReport[]> {
    const mockReport: InventoryReport[] = [];
    return of(mockReport);
  }

  getLowStockProducts(): Observable<InventoryReport[]> {
    return this.getInventoryReport();
  }
}
