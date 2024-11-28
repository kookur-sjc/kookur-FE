import { Component, NgModule, OnInit } from '@angular/core';
import { ItemInventory } from '../../model';
import { EcomService } from '../ecom/ecom.service';
import { FormsModule, NgModel } from '@angular/forms';
import { NgClass } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { finalize, Observable, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [HttpClientModule, FormsModule, NgClass],
  providers: [EcomService, HttpClientModule],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss'
})
export class AdminPageComponent implements OnInit {
  itemInventory: ItemInventory = {
    itemName: '',
    itemDescription: '',
    dogName: '',
    pricePerUnit: 0,
    quantity: 0,
    category: '',
    subCategory: '',
    filenames: [],
    imageUrl: '',
    maxOrderQuantity: 0,
  };
  
  selectedFiles: File[] = [];

  ngOnInit(): void {
    // this.loadProducts();
  }

  // loadProducts(): void {
  //   this.ecomService.getAllItems().subscribe((data) => {
  //     this.products = data;
  //   });
  // }

  constructor(private ecomService:EcomService) {}

  onFileSelected(event: any): void {
    this.selectedFiles = Array.from(event.target.files);  // Get the selected files
    // Map filenames (or keep full file objects, depending on backend handling)
    this.itemInventory.filenames = this.selectedFiles.map(file => file.name); 
}

onSubmit(): void {
    // Ensure the service method handles both the item data and the selected files
    this.ecomService.addNewItemWithImages(this.itemInventory, this.selectedFiles)
}
}
