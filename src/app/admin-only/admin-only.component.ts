import { Component } from '@angular/core';
import { EcomService } from '../pages/ecom/ecom.service';
import { VideoService } from '../video-handling/service/video.service';
import { ItemInventory, Order } from '../model';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-admin-only',
  standalone: true,
  providers: [VideoService, EcomService],
  imports: [ FormsModule,HttpClientModule, NgFor],
  templateUrl: './admin-only.component.html',
  styleUrl: './admin-only.component.scss'
})
export class AdminOnlyComponent {
  moods: string = '';
  tags: string = '';
  selectedFile: File | null = null;
  selectedFiles: File[] = [];
  items: ItemInventory[] = [];
  orders: Order[] = [];
  
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

  constructor(
    private uploadService: VideoService,
    private ecomService: EcomService,
    private orderService: EcomService
  ) {}

  ngOnInit(): void {
    this.loadItems();
    this.loadOrders();
  }

  loadItems(): void {
    this.ecomService.getAllItems().subscribe((data) => {
      this.items = data;
    });
  }

  loadOrders(): void {
    // this.orderService.getAllOrders().subscribe((data) => {
    //   this.orders = data;
    // });
  }

  onFileSelected(event: any): void {
    if (event.target.files.length === 1) {
      this.selectedFile = event.target.files[0];
    } else {
      this.selectedFiles = Array.from(event.target.files);
      this.itemInventory.filenames = this.selectedFiles.map(file => file.name);
    }
  }

  onUploadVideo(): void {
    if (!this.selectedFile) {
      alert('Please select a video file.');
      return;
    }
    this.uploadService.uploadVideo(this.selectedFile, this.moods, this.tags);
  }

  onSubmit(): void {
    if (this.selectedFiles.length === 0) {
      alert('Please select images for the item.');
      return;
    }
    this.ecomService.addNewItemWithImages(this.itemInventory, this.selectedFiles);
  }

  editItem(item: ItemInventory): void {
    this.ecomService.updateItem(item.itemId, item).subscribe(() => {
      alert('Item updated successfully!');
      this.loadItems();
    });
  }

  deleteItem(itemId: number): void {
    this.ecomService.deleteItem(itemId).subscribe(() => {
      alert('Item deleted successfully!');
      this.loadItems();
    });
  }

  updateOrderStatus(order: Order): void {
    // this.orderService.updateOrderStatus(order.id, order.status).subscribe(() => {
    //   alert(`Order #${order.id} updated to ${order.status}`);
    // });
  }

}
