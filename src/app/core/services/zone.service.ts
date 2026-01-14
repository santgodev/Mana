import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Zone, Table } from '../../models/supabase.types';

@Injectable({
  providedIn: 'root'
})
export class ZoneService {
  private _zones = new BehaviorSubject<Zone[]>([]);

  constructor(private supabase: SupabaseService) {
    this.loadZones();
    this.subscribeToZoneChanges();
  }

  get zones$(): Observable<Zone[]> {
    return this._zones.asObservable();
  }

  // Adaptor for components expecting getZones()
  getZones(): Observable<Zone[]> {
    return this.zones$;
  }

  async loadZones() {
    const { data, error } = await this.supabase.client
      .from('zones')
      .select(`
                *,
                tables (*)
            `)
      .order('name');

    if (error) {
      console.error('Error loading zones:', error);
      return;
    }

    if (data) {
      this._zones.next(data as Zone[]);
    }
  }

  subscribeToZoneChanges() {
    this.supabase.client
      .channel('public:zones')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'zones' }, () => {
        this.loadZones();
      })
      .subscribe();
  }

  async createZone(zone: Partial<Zone>): Promise<Zone> {
    // Remove fields that might not exist in DB schema yet
    const payload = { ...zone };
    delete payload.capacity;
    delete payload.floor;
    delete payload.type;
    delete payload.tables; // Never send joined data

    const { data, error } = await this.supabase.client
      .from('zones')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating zone:', error);
      throw error;
    }

    const current = this._zones.value;
    this._zones.next([...current, data as Zone]);
    return data;
  }

  async updateZone(id: string, updates: Partial<Zone>) {
    const payload = { ...updates };
    delete payload.capacity;
    delete payload.floor;
    delete payload.type;
    delete payload.tables;

    const { data, error } = await this.supabase.client
      .from('zones')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Optimistic update or wait for realtime
    // Optimistic update
    const current = this._zones.value;
    // Map the update
    const updatedList = current.map(z => z.id === id ? { ...z, ...updates } : z);
    this._zones.next(updatedList as Zone[]);

    // Also re-fetch to ensure relations (tables) are correct if needed, but this gives immediate feedback
    // this.loadZones();
    return data;
  }

  async deleteZone(id: string) {
    const { error } = await this.supabase.client
      .from('zones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Helper for stats (calculated on frontend from loaded data to avoid complex queries)
  getZoneStats(): Observable<any> {
    return new Observable(observer => {
      this.zones$.subscribe(zones => {
        let totalTables = 0;
        let availableTables = 0;
        let occupiedTables = 0;

        zones.forEach(zone => {
          if (zone.tables) {
            totalTables += zone.tables.length;
            zone.tables.forEach((t: Table) => {
              if (t.status === 'free') availableTables++;
              if (t.status === 'occupied') occupiedTables++;
            });
          }
        });

        const stats = {
          totalZones: zones.length,
          activeZones: zones.filter(z => z.active).length,
          totalTables,
          availableTables,
          occupiedTables,
        };
        observer.next(stats);
      });
    });
  }
  // Auto-seed for development/recovery
  async ensureZonesExist() {
    const { count, error } = await this.supabase.client
      .from('zones')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Error checking zones:', error);
      return;
    }

    if (count === 0) {
      const zonesToSeed = [
        { name: 'Salón Principal', type: 'indoor', capacity: 40, active: true, floor: 1 },
        { name: 'Terraza', type: 'outdoor', capacity: 20, active: true, floor: 1 },
        { name: 'VIP', type: 'private', capacity: 10, active: true, floor: 2 }
      ];

      const { error: seedError } = await this.supabase.client.from('zones').insert(zonesToSeed).select();

      if (seedError) {
        console.error('Error seeding zones:', seedError);
        console.error(`Error creating zones: ${seedError.message || seedError.details || JSON.stringify(seedError)}`);
      } else {
        this.loadZones();
      }
    }
  }
}
