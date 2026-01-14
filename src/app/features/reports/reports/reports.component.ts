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
      this.snackBar.open('Error al cargar reportes', 'Cerrar', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  getMaxHourCount(): number {
    if (!this.stats?.peakHours) return 1;
    return Math.max(...this.stats.peakHours.map(h => h.count), 1);
  }

  async exportToPDF() {
    if (!this.stats) return;

    this.isLoading = true;
    let watermark: HTMLElement | null = null; // Declare watermark here to be accessible in finally
    try {
      const dashboard = document.getElementById('report-dashboard');
      if (!dashboard) return;

      // Temporarily show watermark for PDF
      watermark = document.querySelector('.watermark') as HTMLElement;
      if (watermark) watermark.style.display = 'block';

      const canvas = await html2canvas(dashboard, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add header
      pdf.setFontSize(20);
      pdf.setTextColor(139, 69, 19); // Coffee brown
      pdf.text('Maná - Reporte Ejecutivo', 105, 15, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }), 105, 22, { align: 'center' });

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, 30, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Add footer to all pages
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150);
        pdf.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
        pdf.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 105, 294, { align: 'center' });
      }

      // Reset watermark
      if (watermark) watermark.style.display = '';

      pdf.save(`Reporte-Mana-${new Date().toISOString().split('T')[0]}.pdf`);
      this.snackBar.open('PDF generado con éxito', 'OK', { duration: 3000 });
    } catch (error) {
      console.error('Error generating PDF:', error);
      this.snackBar.open('Error al generar PDF', 'Cerrar', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }
}
