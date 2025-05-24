import { Component, OnInit } from '@angular/core';
import { Cart, CartItem, ItemInventory } from '../../model';
import { EcomService } from '../ecom/ecom.service';
import { NgFor, NgIf } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CognitoService } from '../../cognito.service';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [NgFor, HttpClientModule, NgIf, LoadingComponent],
  providers: [EcomService],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss'
})
export class CartPageComponent implements OnInit {
  userId: string = '';
  cart: Cart | null = null;
  cartItemsWithDetails: { item: CartItem; details: ItemInventory | null }[] = [];
  showNotification: boolean = false;
  notificationMessage: string = '';
  isAuthenticated: boolean = false;
  loading: boolean = true;

  constructor(
    private cartService: EcomService,
    private cognitoService: CognitoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeCart();
    this.loadCartData();
  }

  async initializeCart() {
    try {
      const user = await this.cognitoService.getUser().catch(err => {
        console.log('User not authenticated:', err);
        this.isAuthenticated = false;
        // Optional: Redirect to login
        // this.router.navigate(['/login']);
        return null;
      });

      if (user) {
        this.isAuthenticated = true;
        this.userId = user.userId;
        this.loadCart();
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      this.isAuthenticated = false;
    }
  }

  loadCartData() {
    // Set loading to false when data is loaded
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  loadCart() {
    if (!this.userId) {
      console.log('Cannot load cart: No user ID available');
      return;
    }

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
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return;
    }

    if (this.cart && this.userId) {
      this.cartService.removeItemFromCart(this.userId, cartItemId).subscribe({
        next: (response) => {
          console.log(response);
          // Refresh the entire cart from server after removing item
          this.loadCart();
          this.showNotification = true;
          this.notificationMessage = 'Item removed from cart';
          setTimeout(() => this.showNotification = false, 3000);
        },
        error: (err) => {
          console.error('Error removing item:', err);
          this.showNotification = true;
          this.notificationMessage = 'Failed to remove item';
          setTimeout(() => this.showNotification = false, 3000);
        },
      });
    }
  }

  navigateToOrders() {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login']); // Redirect to login if not authenticated
      return;
    }
    this.router.navigate(['/order']);
  }

  // Calculate cart total
  getCartTotal(): number {
    return this.cartItemsWithDetails.reduce((total, entry) => {
      return total + (entry.details?.pricePerUnit || 0) * entry.item.quantity;
    }, 0);
  }

  // Redirect to login
  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
