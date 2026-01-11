import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Table } from '../../../models/supabase.types';

@Component({
    selector: 'app-table-action-menu',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    templateUrl: './table-action-menu.component.html',
    styleUrls: ['./table-action-menu.component.scss']
})
export class TableActionMenuComponent {

    constructor(
        public dialogRef: MatDialogRef<TableActionMenuComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { table: Table }
    ) { }

    selectAction(action: 'order' | 'bill' | 'close' | 'qr'): void {
        this.dialogRef.close(action);
    }

    close(): void {
        this.dialogRef.close();
    }

    // Helper for time display (optional, can be passed in or calculated)
    getElapsedTime(): string {
        // Simple calc placeholder or use service
        if (!this.data.table.current_session_start_time) return '0 min';
        const start = new Date(this.data.table.current_session_start_time).getTime();
        const now = Date.now();
        const minutes = Math.floor((now - start) / 60000);
        return `${minutes} min`;
    }
}
