import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService, MonthlyStats } from '../../../core/services';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss'
})
export class ReportsComponent implements OnInit {
  stats: MonthlyStats | null = null;
  isLoading = true;
  currentDate = new Date();

  constructor(
    private reportService: ReportService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadStats();
  }

  async loadStats() {
    this.isLoading = true;
    try {
      this.stats = await this.reportService.getMonthlyStats();
    } catch (error) {
      console.error('Error loading reports:', error);
      this.snackBar.open('Error al cargar reportes', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }
}
