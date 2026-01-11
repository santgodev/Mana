import { Table } from './table.interface';

export interface Zone {
  id: number;
  name: string;
  description: string;
  type: 'indoor' | 'outdoor' | 'terrace' | 'private' | 'floor';
  floor?: number;
  capacity: number;
  isActive: boolean;
  tables: Table[];
  layout: ZoneLayout;
  createdAt: Date;
  updatedAt: Date;
}

export interface ZoneLayout {
  width: number;
  height: number;
  backgroundImage?: string;
  backgroundColor: string;
  gridSize: number;
  snapToGrid: boolean;
}

export interface CreateZoneRequest {
  name: string;
  description: string;
  type: 'indoor' | 'outdoor' | 'terrace' | 'private' | 'floor';
  floor?: number;
  capacity: number;
  layout: ZoneLayout;
}

export interface UpdateZoneRequest extends Partial<CreateZoneRequest> {
  id: number;
  isActive?: boolean;
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
