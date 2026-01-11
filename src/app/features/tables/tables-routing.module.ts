import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ZonePanelComponent } from './zone-panel/zone-panel.component';
import { TablePanelComponent } from './table-panel/table-panel.component';
import { TableBoardComponent } from './table-board/table-board.component';

const routes: Routes = [
  { path: '', component: ZonePanelComponent },
  { path: 'list', component: TablePanelComponent },
  { path: 'board/:zoneId', component: TableBoardComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TablesRoutingModule { }
