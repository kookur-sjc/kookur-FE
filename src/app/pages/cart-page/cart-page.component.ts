import { Component } from '@angular/core';
import { Cart, CartItem, ItemInventory } from '../../model';
import { EcomService } from '../ecom/ecom.service';
import { NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CognitoService } from '../../cognito.service';
import { log } from 'console';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [NgFor, HttpClientModule, NgIf],
  providers: [EcomService],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent {

  userId: string = '';
  cart: Cart | null = null;
  cartItemsWithDetails: { item: CartItem; details: ItemInventory | null }[] = [];


  constructor(
    private cartService: EcomService,
    private cognitoService: CognitoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeCart();
  }

  async initializeCart() {
    try {
      const user = await this.cognitoService.getUser();
      console.log('User details in cart:', user);
      this.userId = user.userId;
  
      this.cartService.viewCart(this.userId).subscribe({
        next: (existingCart) => {
          // If a cart exists, use it
          this.cart = existingCart;
          this.loadCartItemDetails();
          console.log('Cart loaded:', this.cart);
        },
        error: (err) => {
          if (err.status === 404) {
            // If no cart exists, create one
            this.cartService.createCart(this.userId).subscribe({
              next: (newCart) => {
                this.cart = newCart;
                console.log('New cart created:', this.cart);
              },
              error: (createErr) => {
                console.error('Error creating cart:', createErr);
              },
            });
          } else {
            console.error('Error fetching cart:', err);
          }
        },
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  }

  loadCartItemDetails() {
    if (this.cart) {
      this.cartItemsWithDetails = this.cart.cartItems.map((cartItem) => ({
        item: cartItem,
        details: null, // Placeholder for details
      }));
  
      this.cartItemsWithDetails.forEach((entry) => {
        this.cartService.getItemById(entry.item.itemInventoryId).subscribe({
          next: (details) => {
            // Split imageUrl and get the first image
            details.imageUrl = details.imageUrl.split(',')[0];  // Taking the first image URL
            entry.details = details;
          },
          error: (err) => console.error('Error fetching item details:', err),
        });
      });
    }
  }
  

  removeItemFromCart(cartItemId: number) {
    if (this.cart && this.userId) {
      this.cartService.removeItemFromCart(this.userId, cartItemId).subscribe({
        next: (response) => {
          console.log(response);
          this.cartItemsWithDetails = this.cartItemsWithDetails.filter(
            (entry) => entry.item.cartItemId !== cartItemId
          );
          console.log('Item removed');
        },
        error: (err) => console.error('Error removing item:', err),
      });
    }
  }

  navigateToOrders() {
    this.router.navigate(['/order']);
  }

}
