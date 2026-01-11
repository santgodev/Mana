import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatCardModule } from '@angular/material/card';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-pricing-calculator',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatSliderModule,
        MatCardModule,
        MatSlideToggleModule,
        MatIconModule,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatTooltipModule
    ],
    templateUrl: './pricing-calculator.component.html',
    styleUrls: ['./pricing-calculator.component.scss']
})
export class PricingCalculatorComponent {
    // Base Configuration
    readonly BASE_PRICE = 50000;
    readonly INCLUDED_TABLES = 10;
    readonly INCLUDED_USERS = 3;
    readonly INCLUDED_ZONES = 1;

    // Costs
    readonly COST_PER_EXTRA_TABLE = 2000;
    readonly COST_PER_EXTRA_USER = 5000;
    readonly COST_PER_EXTRA_ZONE = 10000;

    // Module Costs
    readonly MODULE_COSTS = {
        inventory: 20000,
        kds: 15000,
        analytics: 15000,
        multibranch: 40000
    };

    // User Selection
    tableCount = 10;
    userCount = 3;
    zoneCount = 1;

    selectedModules = {
        inventory: false,
        kds: false,
        analytics: false,
        multibranch: false
    };

    // Derived Values
    get extraTablesCost(): number {
        return Math.max(0, this.tableCount - this.INCLUDED_TABLES) * this.COST_PER_EXTRA_TABLE;
    }

    get extraUsersCost(): number {
        return Math.max(0, this.userCount - this.INCLUDED_USERS) * this.COST_PER_EXTRA_USER;
    }

    get extraZonesCost(): number {
        return Math.max(0, this.zoneCount - this.INCLUDED_ZONES) * this.COST_PER_EXTRA_ZONE;
    }

    get modulesCost(): number {
        let total = 0;
        if (this.selectedModules.inventory) total += this.MODULE_COSTS.inventory;
        if (this.selectedModules.kds) total += this.MODULE_COSTS.kds;
        if (this.selectedModules.analytics) total += this.MODULE_COSTS.analytics;
        if (this.selectedModules.multibranch) total += this.MODULE_COSTS.multibranch;
        return total;
    }

    get estimatedTotal(): number {
        return this.BASE_PRICE + this.extraTablesCost + this.extraUsersCost + this.extraZonesCost + this.modulesCost;
    }

    get planTierName(): string {
        if (this.estimatedTotal <= 60000) return 'Maná Esencial';
        if (this.estimatedTotal <= 120000) return 'Maná Crecimiento';
        return 'Maná Pro';
    }

    // Helpers for UI
    increment(field: 'userCount' | 'zoneCount') {
        this[field]++;
    }

    decrement(field: 'userCount' | 'zoneCount') {
        if (field === 'userCount' && this.userCount > 1) this.userCount--;
        if (field === 'zoneCount' && this.zoneCount > 1) this.zoneCount--;
    }

    formatLabel(value: number): string {
        return `${value}`;
    }
}
