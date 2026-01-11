import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-qr-display-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
    template: `
    <div class="qr-dialog-content">
      <div class="header">
        <h2>Código QR - Mesa {{ data.tableNumber }}</h2>
        <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
      </div>

      <div class="qr-body">
        <div class="qr-card">
           <!-- Using a reliable public API for generating the QR on the fly for the view -->
           <img [src]="qrImageUrl" alt="QR Code" class="qr-image">
           <p class="scan-hint">Escanea para ver el menú</p>
        </div>
        
        <div class="url-box">
            <mat-icon>link</mat-icon>
            <span>{{ data.url }}</span>
        </div>
      </div>

      <div class="actions">
        <button mat-stroked-button color="primary" (click)="printQr()">
          <mat-icon>print</mat-icon> Imprimir
        </button>
        <button mat-flat-button color="primary" (click)="close()">
          Listo
        </button>
      </div>
    </div>
  `,
    styles: [`
    .qr-dialog-content {
      padding: 24px;
      font-family: 'Outfit', sans-serif;
      text-align: center;
      background: #faf9f6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header h2 { margin: 0; color: #2C1810; font-weight: 700; }
    
    .qr-body {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        margin-bottom: 24px;
    }

    .qr-card {
        background: white;
        padding: 20px;
        border-radius: 20px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .qr-image {
        width: 250px;
        height: 250px;
        object-fit: contain;
    }

    .scan-hint {
        margin-top: 12px;
        color: #8B5A2B;
        font-weight: 600;
        font-size: 0.9rem;
    }

    .url-box {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #F5EFEB;
        padding: 8px 16px;
        border-radius: 12px;
        color: #6d6d6d;
        font-size: 0.85rem;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    
    .actions {
        display: flex;
        justify-content: center;
        gap: 16px;
    }
  `]
})
export class QrDisplayDialogComponent {
    qrImageUrl: string = '';

    constructor(
        public dialogRef: MatDialogRef<QrDisplayDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { url: string; tableNumber: string }
    ) {
        // Generate QR Image URL using a public API service
        // Encoding the URL properly
        const encodedUrl = encodeURIComponent(this.data.url);
        this.qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}&color=2C1810&bgcolor=FFFFFF`;
    }

    close(): void {
        this.dialogRef.close();
    }

    printQr(): void {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
            <html>
            <head>
                <title>Mesa ${this.data.tableNumber} - QR</title>
                <style>
                    body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
                    .title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                    img { width: 300px; height: 300px; }
                    .footer { margin-top: 20px; color: #666; }
                </style>
            </head>
            <body>
                <div class="title">Mesa ${this.data.tableNumber}</div>
                <img src="${this.qrImageUrl}" />
                <div class="footer">Escanea para ordenar</div>
                <script>window.print(); window.close();</script>
            </body>
            </html>
        `);
            printWindow.document.close();
        }
    }
}
