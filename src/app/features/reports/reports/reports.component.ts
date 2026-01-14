import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ReportService, MonthlyStats } from '../../../core/services';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule
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

  async exportToPDF() {
    const data = document.getElementById('report-dashboard');
    if (!data) return;

    this.isLoading = true;
    try {
      const canvas = await html2canvas(data, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8f9fa'
      });

      const imgWidth = 208;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Reporte_Mana_${this.currentDate.getMonth() + 1}_${this.currentDate.getFullYear()}.pdf`);
      this.snackBar.open('PDF generado con éxito', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }
}
