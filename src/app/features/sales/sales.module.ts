import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SalesRoutingModule } from './sales-routing.module';
import { SalesComponent } from './sales/sales.component';

@NgModule({
  imports: [
    CommonModule,
    SalesRoutingModule,
    SalesComponent
  ]
})
export class SalesModule { }