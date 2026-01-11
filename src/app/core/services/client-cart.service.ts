import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../../models/supabase.types';

export interface CartItem {
    product: Product;
    quantity: number;
    notes?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ClientCartService {
    private _cart = new BehaviorSubject<CartItem[]>([]);
    private _tableId = new BehaviorSubject<string | null>(null);

    // Store all carts: { 'table-uuid': [items], 'another-uuid': [items] }
    private _cartsByTable: Record<string, CartItem[]> = {};

    constructor() {
        this.loadFromStorage();
    }

    get cart$() {
        return this._cart.asObservable();
    }

    get tableId$() {
        return this._tableId.asObservable();
    }

    setTableId(id: string | null) {
        this._tableId.next(id);
        if (id) {
            // Switch current cart view to this table's cart
            this._cart.next(this._cartsByTable[id] || []);
            localStorage.setItem('qr_table_id', id);
        } else {
            this._cart.next([]); // No table, no cart
        }
    }

    addToCart(product: Product, quantity: number = 1, notes: string = '') {
        const tableId = this._tableId.value;
        if (!tableId) {
            console.error('Cannot add to cart: No table selected');
            return;
        }

        // Get current table's cart or init
        const currentTableCart = this._cartsByTable[tableId] || [];

        const existingIndex = currentTableCart.findIndex(item => item.product.id === product.id && item.notes === notes);

        if (existingIndex !== -1) {
            currentTableCart[existingIndex].quantity += quantity;
        } else {
            currentTableCart.push({ product, quantity, notes });
        }

        // Update state
        this._cartsByTable[tableId] = [...currentTableCart];
        this._cart.next(this._cartsByTable[tableId]);

        this.saveToStorage();
    }

    removeFromCart(index: number) {
        const tableId = this._tableId.value;
        if (!tableId) return;

        const current = this._cartsByTable[tableId];
        if (!current) return;

        current.splice(index, 1);

        this._cartsByTable[tableId] = [...current];
        this._cart.next(this._cartsByTable[tableId]);
        this.saveToStorage();
    }

    updateQuantity(index: number, quantity: number) {
        const tableId = this._tableId.value;
        if (!tableId) return;

        const current = this._cartsByTable[tableId];
        if (!current) return;

        if (quantity <= 0) {
            this.removeFromCart(index);
            return;
        }

        current[index].quantity = quantity;

        this._cartsByTable[tableId] = [...current];
        this._cart.next(this._cartsByTable[tableId]);
        this.saveToStorage();
    }

    updateNote(index: number, note: string) {
        const tableId = this._tableId.value;
        if (!tableId) return;

        const current = this._cartsByTable[tableId];
        if (!current) return;

        current[index].notes = note;

        this._cartsByTable[tableId] = [...current];
        this._cart.next(this._cartsByTable[tableId]);
        this.saveToStorage();
    }

    clearCart() {
        const tableId = this._tableId.value;
        if (!tableId) return;

        this._cartsByTable[tableId] = [];
        this._cart.next([]);
        this.saveToStorage();
    }

    get totalItems() {
        return this._cart.value.reduce((sum, item) => sum + item.quantity, 0);
    }

    get totalPrice() {
        return this._cart.value.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    }

    private saveToStorage() {
        // Save the entire dictionary
        localStorage.setItem('waiter_carts_v2', JSON.stringify(this._cartsByTable));
    }

    private loadFromStorage() {
        const savedCarts = localStorage.getItem('waiter_carts_v2');
        // Legacy fallback
        const legacyCart = localStorage.getItem('qr_cart');

        if (savedCarts) {
            try {
                this._cartsByTable = JSON.parse(savedCarts);
            } catch (e) {
                console.error('Error loading carts', e);
                this._cartsByTable = {};
            }
        } else if (legacyCart) {
            // Migrate legacy single cart to a temporary 'unknown' bucket or discard
            // Discarding is safer to avoid confusion, or migration if mostly 1 table used.
            // Let's just start fresh or use empty.
            this._cartsByTable = {};
        }

        const savedTableId = localStorage.getItem('qr_table_id');
        if (savedTableId) {
            this.setTableId(savedTableId);
        }
    }
}
