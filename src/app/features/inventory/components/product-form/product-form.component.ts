import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ProductService } from '../../../../core/services';
import { Product, Category } from '../../../../models/supabase.types';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEditMode ? 'Editar Producto' : 'Nuevo Producto' }}</h2>
    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <div class="row">
            <mat-form-field appearance="outline" class="col">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" placeholder="Ej. Pizza Margarita">
            </mat-form-field>

            <mat-form-field appearance="outline" class="col">
              <mat-label>Categoría</mat-label>
              <mat-select formControlName="category_id">
                <mat-option *ngFor="let cat of categories" [value]="cat.id">
                  {{ cat.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descripción</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="row">
            <mat-form-field appearance="outline" class="col">
              <mat-label>Precio ($)</mat-label>
              <input matInput type="number" formControlName="price" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline" class="col">
              <mat-label>Costo ($)</mat-label>
              <input matInput type="number" formControlName="cost" min="0">
            </mat-form-field>
        </div>

        <div class="row">
             <mat-form-field appearance="outline" class="col">
              <mat-label>Stock</mat-label>
              <input matInput type="number" formControlName="stock" min="0">
            </mat-form-field>

            <mat-form-field appearance="outline" class="col">
              <mat-label>Tiempo Prep. (min)</mat-label>
              <input matInput type="number" formControlName="prep_time_minutes" min="0">
              <mat-hint>Para priorización en cocina</mat-hint>
            </mat-form-field>
        </div>
        
        <!-- Image Upload Section -->
        <div class="image-upload-section">
            <div class="preview-container" *ngIf="productForm.get('image_url')?.value">
                <img [src]="productForm.get('image_url')?.value" alt="Preview" class="image-preview">
                <button mat-icon-button color="warn" class="remove-btn" type="button" (click)="removeImage()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div class="upload-controls" *ngIf="!productForm.get('image_url')?.value">
                <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none" accept="image/*">
                <button mat-stroked-button color="primary" type="button" (click)="fileInput.click()" [disabled]="isUploading">
                    <mat-icon>cloud_upload</mat-icon>
                    {{ isUploading ? 'Subiendo...' : 'Subir Imagen' }}
                </button>
                <mat-progress-bar *ngIf="isUploading" mode="indeterminate" class="upload-progress"></mat-progress-bar>
            </div>
            
            <!-- Hidden Input for URL storage -->
            <input type="hidden" formControlName="image_url">
        </div>

        <div class="toggles">
            <mat-slide-toggle formControlName="is_available" color="primary">Disponible para venta</mat-slide-toggle>
        </div>

      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()" [disabled]="isUploading">Cancelar</button>
        <button mat-raised-button color="primary" type="submit" [disabled]="productForm.invalid || isLoading || isUploading">
            {{ isLoading ? 'Guardando...' : 'Guardar' }}
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full-width { width: 100%; margin-bottom: 10px; }
    .row { display: flex; gap: 15px; }
    .col { flex: 1; }
    .toggles { margin: 15px 0; }
    
    .image-upload-section {
        margin: 10px 0 20px 0;
        border: 1px dashed #ccc;
        border-radius: 4px;
        padding: 15px;
        text-align: center;
        background-color: #f9f9f9;
    }
    .preview-container {
        position: relative;
        display: inline-block;
    }
    .image-preview {
        max-height: 150px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .remove-btn {
        position: absolute;
        top: -10px;
        right: -10px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }
    .upload-progress {
        margin-top: 10px;
    }
  `]
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  categories: Category[] = [];
  isEditMode = false;
  isLoading = false;
  isUploading = false;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    public dialogRef: MatDialogRef<ProductFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Product | null,
    private snackBar: MatSnackBar
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      category_id: [''],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      cost: [0, [Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      prep_time_minutes: [15, [Validators.required, Validators.min(1)]],
      image_url: [''],
      is_available: [true]
    });
  }

  ngOnInit(): void {
    this.productService.categories$.subscribe((cats: Category[]) => this.categories = cats);

    if (this.data) {
      this.isEditMode = true;
      this.productForm.patchValue(this.data);
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.isUploading = true;
    try {
      const url = await this.productService.uploadImage(file);
      this.productForm.patchValue({ image_url: url });
      this.snackBar.open('Imagen subida correctamente', 'Ok', { duration: 3000 });
    } catch (error) {
      console.error('Upload failed', error);
      this.snackBar.open('Error al subir imagen', 'Cerrar', { duration: 3000 });
    } finally {
      this.isUploading = false;
    }
  }

  removeImage() {
    this.productForm.patchValue({ image_url: '' });
  }

  async onSubmit() {
    console.log('ProductFormComponent: onSubmit called');
    console.log('Form Status:', this.productForm.status);
    console.log('Form Value:', this.productForm.value);

    if (this.productForm.invalid) {
      console.warn('ProductFormComponent: Form is invalid');
      // Log generic errors
      Object.keys(this.productForm.controls).forEach(key => {
        const controlErrors = this.productForm.get(key)?.errors;
        if (controlErrors) {
          console.error(`Control error [${key}]:`, controlErrors);
        }
      });
      return;
    }

    this.isLoading = true;
    const formValue = this.productForm.value;

    try {
      if (this.isEditMode && this.data) {
        await this.productService.updateProduct(this.data.id, formValue);
        this.snackBar.open('Producto actualizado', 'Ok', { duration: 3000 });
      } else {
        await this.productService.createProduct(formValue);
        this.snackBar.open('Producto creado', 'Ok', { duration: 3000 });
      }
      this.dialogRef.close(true);
    } catch (error) {
      console.error(error);
      this.snackBar.open('Error al guardar', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
