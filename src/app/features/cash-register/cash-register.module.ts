import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CashLayoutComponent } from './pages/cash-layout/cash-layout.component';
import { CashRegisterRoutingModule } from './cash-register-routing.module';

@NgModule({
    declarations: [],
    imports: [
        CommonModule,
        CashRegisterRoutingModule,
        CashLayoutComponent
    ]
})
export class CashRegisterModule { }
