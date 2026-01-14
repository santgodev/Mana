import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { Product, Category } from '../../models/supabase.types';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private _products = new BehaviorSubject<Product[]>([]);
    private _categories = new BehaviorSubject<Category[]>([]);
    private productSub: any;
    private categorySub: any;

    constructor(private supabase: SupabaseService) {
        this.loadProducts();
        this.loadCategories();
        this.subscribeToChanges();
    }

    get products$(): Observable<Product[]> {
        return this._products.asObservable();
    }

    get categories$(): Observable<Category[]> {
        return this._categories.asObservable();
    }

    async uploadImage(file: File): Promise<string> {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { data, error } = await this.supabase.client
            .storage
            .from('products')
            .upload(filePath, file);

        if (error) throw error;

        const { data: publicUrlData } = this.supabase.client
            .storage
            .from('products')
            .getPublicUrl(filePath);

        return publicUrlData.publicUrl;
    }

    async loadProducts() {
        const { data, error } = await this.supabase.client
            .from('products')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading products:', error);
            return;
        }

        if (data) {
            this._products.next(data as Product[]);
        }
    }

    async loadCategories() {
        const { data, error } = await this.supabase.client
            .from('categories')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) {
            console.error('ProductService: Error loading categories:', error);
            return;
        }

        if (data) {
            this._categories.next(data as Category[]);
        }
    }

    subscribeToChanges() {
        if (this.productSub || this.categorySub) return;

        // Products Subscription
        this.productSub = this.supabase.client
            .channel('public:products')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
                console.log('Product change received:', payload);
                this.handleProductUpdate(payload);
            })
            .subscribe();

        // Categories Subscription
        this.categorySub = this.supabase.client
            .channel('public:categories')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
                console.log('Category change received:', payload);
                this.loadCategories(); // Simpler for categories as there are few
            })
            .subscribe();
    }

    private handleProductUpdate(payload: any) {
        const current = this._products.value;
        if (payload.eventType === 'INSERT') {
            console.log('[ProductService] Adding new product:', payload.new.name);
            this._products.next([...current, payload.new as Product]);
        } else if (payload.eventType === 'UPDATE') {
            console.log('[ProductService] Updating product:', payload.new.name, 'Stock:', payload.new.stock);
            const updated = current.map((p: Product) => p.id === payload.new.id ? { ...p, ...payload.new } : p);
            this._products.next(updated as Product[]);
        } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            console.log('[ProductService] Deleting product id:', deletedId);
            this._products.next(current.filter((p: Product) => p.id !== deletedId));
        }
    }

    async createProduct(product: Partial<Product>) {
        console.log('ProductService: Creating product...', product);
        const { id, created_at, ...newProduct } = product as any;
        if (newProduct.category_id === '') {
            newProduct.category_id = null;
        }
        const { data, error } = await this.supabase.client
            .from('products')
            .insert(newProduct)
            .select()
            .single();

        if (error) {
            console.error('ProductService: Error inserting product', error);
            throw error;
        }

        console.log('ProductService: Product created successfully', data);

        if (data) {
            const current = this._products.value;
            this._products.next([...current, data as Product]);
        }
        return data;
    }

    async updateProduct(id: string, updates: Partial<Product>) {
        const { data, error } = await this.supabase.client
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            const current = this._products.value;
            const index = current.findIndex(p => p.id === id);
            if (index !== -1) {
                current[index] = data as Product;
                this._products.next([...current]);
            }
        }
        return data;
    }

    async deleteProduct(id: string) {
        const { error } = await this.supabase.client
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        const current = this._products.value;
        this._products.next(current.filter((p: Product) => p.id !== id));
    }

    async createCategory(category: Partial<Category>) {
        const { data, error } = await this.supabase.client
            .from('categories')
            .insert(category)
            .select()
            .single();

        if (error) throw error;

        if (data) {
            const current = this._categories.value;
            this._categories.next([...current, data as Category]);
        }
    }
}
