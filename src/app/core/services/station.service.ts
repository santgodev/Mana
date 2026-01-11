import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Station } from '../../models/supabase.types';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class StationService {
    private _stations = new BehaviorSubject<Station[]>([]);
    public stations$ = this._stations.asObservable();

    constructor(private supabase: SupabaseService) {
        this.loadStations();
    }

    async loadStations() {
        const { data, error } = await this.supabase.client
            .from('stations')
            .select('*')
            .order('name');

        if (error) {
            console.error('Error loading stations:', error);
            return;
        }

        if (data) {
            this._stations.next(data);
        }
    }

    async createStation(name: string): Promise<Station | null> {
        const { data, error } = await this.supabase.client
            .from('stations')
            .insert({ name })
            .select()
            .single();

        if (error) {
            console.error('Error creating station:', error);
            throw error;
        }

        if (data) {
            this.loadStations();
            return data;
        }
        return null;
    }

    async updateStation(id: string, name: string) {
        const { error } = await this.supabase.client
            .from('stations')
            .update({ name })
            .eq('id', id);

        if (error) throw error;
        this.loadStations();
    }

    async deleteStation(id: string) {
        const { error } = await this.supabase.client
            .from('stations')
            .delete()
            .eq('id', id);

        if (error) throw error;
        this.loadStations();
    }
}
