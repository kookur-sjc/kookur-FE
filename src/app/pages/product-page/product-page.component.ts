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

  constructor(private inventoryService: EcomService, private router: Router) {}

  ngOnInit(): void {
    this.inventoryService.getAllItems().subscribe((data) => {
      this.products = data.map(product => ({
        ...product,
        images: product.imageUrl.split(',')
      }));
    });
  }

  viewProduct(id: number): void {
    this.router.navigate(['/products', id]);
  }

 
  
}
