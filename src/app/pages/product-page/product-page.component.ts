import { Component, HostListener, OnInit } from '@angular/core';
import { ItemInventory } from '../../model';
import { EcomService } from '../ecom/ecom.service';
import { Router } from '@angular/router';
import { NgFor, NgIf, NgStyle, NgClass } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { LoadingComponent } from '../../shared/components/loading/loading.component';
import { WindowService } from '../../services/window.service';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [NgFor, HttpClientModule, FormsModule, NgIf, NgStyle, NgClass, LoadingComponent],
  providers: [EcomService],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit {
  products: ItemInventory[] = [];
  filteredProducts: ItemInventory[] = [];
  categories: string[] = ["Electronics", "Clothing", "Home", "Accessories"];
  subCategories: string[] = [];
  selectedCategory: string = "";
  selectedSubCategory: string = "";
  isLoading: boolean = true;
  showFilters: boolean = false;
  window: any = window;
  loading: boolean = true;

  constructor(private inventoryService: EcomService, private router: Router, private windowService: WindowService) {}
  
  @HostListener('window:resize')
  onResize() {
    // If window width becomes larger than sm breakpoint, always show filters
    if (typeof window !== 'undefined' && window.innerWidth >= 640) {
      this.showFilters = true;
    }
  }
  
  ngOnInit(): void {
    this.fetchProducts();
    // Initialize filter visibility based on screen size
    this.showFilters = typeof window !== 'undefined' && window.innerWidth >= 640;

    if (this.windowService.isWindowAvailable()) {
      const windowObj = this.windowService.nativeWindow;
      // Now you can safely use windowObj
    }
    
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
  
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }
  
  fetchProducts(): void {
    this.isLoading = true;
    this.inventoryService.getAllItems().subscribe({
      next: (data) => {
        this.products = data.map(product => ({
          ...product,
          images: product.imageUrl?.split(',').filter(url => url.trim().length > 0) || []
        }));
        this.filteredProducts = [...this.products];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching products:', error);
        this.isLoading = false;
      }
    });
  }

  viewProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }
 
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.selectedSubCategory = "";
    
    if (category) {
      this.filteredProducts = this.products.filter(product => 
        product.category?.toLowerCase() === category.toLowerCase()
      );
      this.updateSubCategories(category);
    } else {
      this.filteredProducts = [...this.products];
      this.subCategories = [];
    }
  }
  
  filterBySubCategory(subCategory: string): void {
    this.selectedSubCategory = subCategory;
    
    if (subCategory) {
      this.filteredProducts = this.products.filter(
        product => 
          product.category?.toLowerCase() === this.selectedCategory.toLowerCase() && 
          product.subCategory?.toLowerCase() === subCategory.toLowerCase()
      );
    } else {
      this.filterByCategory(this.selectedCategory);
    }
  }
  
  resetFilters(): void {
    this.selectedCategory = "";
    this.selectedSubCategory = "";
    this.filteredProducts = [...this.products];
    this.subCategories = [];
  }
  
  updateSubCategories(category: string): void {
    const subCategorySet = new Set<string>();
    
    this.products
      .filter(product => product.category?.toLowerCase() === category.toLowerCase())
      .forEach(product => {
        if (product.subCategory?.trim()) {
          subCategorySet.add(product.subCategory);
        }
      });
   
    this.subCategories = Array.from(subCategorySet);
  }
}