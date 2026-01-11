import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainLayoutRoutingModule } from './main-layout-routing.module';
import { MainLayoutComponent } from './main-layout.component';

@NgModule({
  imports: [
    CommonModule,
    MainLayoutRoutingModule,
    MainLayoutComponent
  ]
})
export class MainLayoutModule { }