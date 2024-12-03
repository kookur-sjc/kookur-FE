import { Component } from '@angular/core';
import { EcomService } from '../ecom/ecom.service';
import { Router } from '@angular/router';
import { CartItem, ItemInventory, UserAddressTable } from '../../model';
import { CognitoService } from '../../cognito.service';
import { NgFor, NgIf, NgSwitchDefault } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, NgModel } from '@angular/forms';

@Component({
  selector: 'app-order-page',
  standalone: true,
  providers: [EcomService],
  imports: [NgIf, NgFor, HttpClientModule, FormsModule],
  templateUrl: './order-page.component.html',
  styleUrl: './order-page.component.scss'
})
export class OrderPageComponent {

  userId: string = '';
  address: UserAddressTable | null = null;
  cartItemsWithDetails: { item: CartItem; details: ItemInventory | null }[] = [];
  totalAmount: number = 0;

  currentStep: number = 1; // Step 1: Address, Step 2: Summary, Step 3: Payment

  constructor(
    private ecomService: EcomService,
    private cognitoService: CognitoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeOrder();
  }

  async initializeOrder() {
    try {
      const user = await this.cognitoService.getUser();
      this.userId = user.userId;

      // Fetch Address
      // this.ecomService.getUserAddress(this.userId).subscribe({
      //   next: (address) => {
      //     this.address = address;
      //   },
      //   error: (err) => {
      //     console.error('Error fetching user address:', err);
      //   },
      // });

      // Fetch Cart Items
      this.ecomService.viewCart(this.userId).subscribe({
        next: (cart) => {
          this.cartItemsWithDetails = cart.cartItems.map((cartItem) => ({
            item: cartItem,
            details: null,
          }));

          this.cartItemsWithDetails.forEach((entry) => {
            this.ecomService.getItemById(entry.item.itemInventoryId).subscribe({
              next: (details) => {
                entry.details = details;
                this.calculateTotal();
              },
              error: (err) => console.error('Error fetching item details:', err),
            });
          });
        },
        error: (err) => console.error('Error fetching cart:', err),
      });
    } catch (error) {
      console.error('Error initializing order:', error);
    }
  }

  // saveAddress() {
  //   this.ecomService.setUserAddress(this.address).subscribe({
  //     next: (response) => {
  //       console.log('Address saved successfully', response);
  //     },
  //     error: (err) => {
  //       console.error('Error saving address:', err);
  //     },
  //   });
  // }

  calculateTotal() {
    this.totalAmount = this.cartItemsWithDetails.reduce((total, entry) => {
      if (entry.details) {
        return total + entry.details.pricePerUnit * entry.item.quantity;
      }
      return total;
    }, 0);
  }

  proceedToNextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    } else {
      this.placeOrder();
    }
  }

  placeOrder() {
    this.ecomService.placeOrder(this.userId).subscribe({
      next: (order) => {
        alert('Order placed successfully!');
        this.router.navigate(['/order-success']);
      },
      error: (err) => {
        console.error('Error placing order:', err);
      },
    });
  }
}
