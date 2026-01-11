import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TablesRoutingModule } from './tables-routing.module';
import { ZonePanelComponent } from './zone-panel/zone-panel.component';
import { TablePanelComponent } from './table-panel/table-panel.component';
import { TableDialogComponent } from './table-dialog/table-dialog.component';
import { TableBoardComponent } from './table-board/table-board.component';
import { TableDetailsComponent } from './table-details/table-details.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    TablesRoutingModule,
    ZonePanelComponent, // Imported as standalone
    TablePanelComponent, // Imported as standalone
    TableDialogComponent, // Imported as standalone
    TableBoardComponent, // Imported as standalone
    TableDetailsComponent // Imported as standalone
  ]
})
export class TablesModule { }
