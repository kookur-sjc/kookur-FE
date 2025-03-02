import { Component, OnInit } from '@angular/core';
import { ItemInventory } from '../../model';
import { EcomService } from '../ecom/ecom.service';
import { Router } from '@angular/router';
import { NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [NgFor, HttpClientModule, FormsModule, NgIf],
  providers: [EcomService],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit {

  products: ItemInventory[] = [];
  images?: string[] = [];
  filteredProducts: ItemInventory[] = [];


  categories: string[] = ["Electronics", "Clothing", "Home", "Accessories"]; // Example categories
  subCategories: string[] = [];

  selectedCategory: string = "";
  selectedSubCategory: string = "";


  constructor(private inventoryService: EcomService, private router: Router) {}

  ngOnInit(): void {
    this.inventoryService.getAllItems().subscribe((data) => {
      this.products = data.map(product => ({
        ...product,
        images: product.imageUrl.split(',')
      }));
      this.filteredProducts = [...this.products];
    });
  }

  viewProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }
  
  filterByCategory(category: string): void {
    this.selectedCategory = category;
    this.selectedSubCategory = "";

    if (category) {
      this.filteredProducts = this.products.filter(product => product.category === category);
      this.updateSubCategories(category);
    } else {
      this.filteredProducts = [...this.products];
      this.subCategories = [];
    }
  }

  // Filter by Sub-Category
  filterBySubCategory(subCategory: string): void {
    this.selectedSubCategory = subCategory;

    if (subCategory) {
      this.filteredProducts = this.products.filter(
        product => product.category === this.selectedCategory && product.subCategory === subCategory
      );
    } else {
      this.filterByCategory(this.selectedCategory);
    }
  }

  // Reset Filters
  resetFilters(): void {
    this.selectedCategory = "";
    this.selectedSubCategory = "";
    this.filteredProducts = [...this.products];
    this.subCategories = [];
  }

  // Update Sub-Categories dynamically based on selected category
  updateSubCategories(category: string): void {
    const subCategorySet = new Set<string>();
    this.products
      .filter(product => product.category === category)
      .forEach(product => {
        if (product.subCategory) {
          subCategorySet.add(product.subCategory);
        }
      });
    
    this.subCategories = Array.from(subCategorySet);
  }
 
  
}
