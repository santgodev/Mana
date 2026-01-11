import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../../core/services';
import { Product } from '../../../models/supabase.types';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ProductFormComponent } from '../components/product-form/product-form.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CategoryDialogComponent } from '../components/category-dialog/category-dialog.component';
import { Category } from '../../../models/supabase.types';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './inventory.component.html',
  styleUrl: './inventory.component.scss'
})
export class InventoryComponent implements OnInit {
  displayedColumns: string[] = ['image', 'name', 'cost', 'price', 'stock', 'actions'];
  dataSource: MatTableDataSource<Product>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  categories: Category[] = [];
  selectedCategoryId: string | null = null;
  allProducts: Product[] = []; // Store full list for local filtering

  // Composite Filter State
  filterValues: { name: string, categoryId: string } = { name: '', categoryId: '' };

  constructor(
    private productService: ProductService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.dataSource = new MatTableDataSource();

    // Custom Filter Predicate that accepts a JSON string
    this.dataSource.filterPredicate = (data: Product, filter: string) => {
      try {
        const searchTerms = JSON.parse(filter);

        // 1. Check Category
        let matchesCategory = true;
        if (searchTerms.categoryId) {
          // Strict string comparison to avoid type issues (UUIDs are strings)
          matchesCategory = data.category_id === searchTerms.categoryId;
        }

        // 2. Check Name/Desc
        const nameSearch = (searchTerms.name || '').toLowerCase();
        const matchesName = data.name.toLowerCase().includes(nameSearch)
          || (data.description || '').toLowerCase().includes(nameSearch);

        return matchesCategory && matchesName;
      } catch (e) {
        // Fallback for non-JSON filter input (shouldn't happen with our logic)
        return true;
      }
    };
  }

  ngOnInit(): void {
    this.productService.products$.subscribe((products: Product[]) => {
      this.allProducts = products;
      this.dataSource.data = products;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;

      // Re-trigger filter if data changes
      this.triggerFilter();
    });

    this.productService.categories$.subscribe(cats => this.categories = cats);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterValues.name = filterValue.trim();
    this.triggerFilter();
  }

  private triggerFilter() {
    this.dataSource.filter = JSON.stringify(this.filterValues);

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  // Create or Edit Product
  openProductForm(product?: Product) {
    const dialogRef = this.dialog.open(ProductFormComponent, {
      width: '600px',
      data: product || null
    });

    dialogRef.afterClosed().subscribe(result => {
      // ProductService handles updates automatically via subscription
      if (result) {
        // Optional: Show specific success message if passed back
      }
    });
  }

  deleteProduct(product: Product) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `Eliminar ${product.name}`,
        message: '¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        type: 'danger',
        icon: 'delete'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.productService.deleteProduct(product.id)
          .then(() => this.snackBar.open('Producto eliminado', 'Ok', { duration: 3000 }))
          .catch(err => this.snackBar.open('Error al eliminar', 'Cerrar'));
      }
    });
  }

  // Create Category
  openCategoryDialog() {
    this.dialog.open(CategoryDialogComponent, { width: '400px' });
  }

  filterByCategory(categoryId: string | null) {
    this.selectedCategoryId = categoryId;
    this.filterValues.categoryId = categoryId || '';
    this.triggerFilter();
  }

  adjustStock(product: Product) {
    // For fast edits, maybe repurpose this for a smaller dialog or just rely on Edit Form
    this.openProductForm(product);
  }
}
