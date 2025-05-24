import { Component, HostListener, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { ItemInventory, Review } from '../../model';
import { ActivatedRoute, Router } from '@angular/router';
import { EcomService } from '../ecom/ecom.service';
import { HttpClientModule } from '@angular/common/http';
import { NgFor, NgIf, isPlatformBrowser } from '@angular/common';
import { CognitoService } from '../../cognito.service';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [HttpClientModule, NgIf, NgFor, LoadingComponent],
  providers: [EcomService],
  templateUrl: './product-details-page.component.html',
  styleUrl: './product-details-page.component.scss'
})
export class ProductDetailsPageComponent implements OnInit {
  product: ItemInventory | undefined;
  currentImageIndex = 0;
  isDesktop: boolean = false; // Initialize with a default value
  showNotification: boolean = false;
  notificationMessage: string = '';
  notificationType: 'success' | 'error' = 'success';
  isAuthenticated: boolean = false;
  loading: boolean = true;

  reviews: Review[] = [
    { user: 'Alice', rating: 5, comment: 'Amazing product!', date: '2024-02-28' },
    { user: 'Bob', rating: 4, comment: 'Good quality but a bit pricey.', date: '2024-02-25' },
    { user: 'Charlie', rating: 3, comment: 'Decent but not as expected.', date: '2024-02-20' },
    { user: 'David', rating: 5, comment: 'Totally worth it!', date: '2024-02-18' },
    { user: 'Eve', rating: 4, comment: 'Satisfied with my purchase.', date: '2024-02-15' }
  ];

  constructor(
    private route: ActivatedRoute,
    private inventoryService: EcomService,
    private cartService: EcomService,
    private cognitoService: CognitoService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    // Check if we're in the browser and set isDesktop accordingly
    if (isPlatformBrowser(this.platformId)) {
      this.isDesktop = window.innerWidth >= 1024;
    }

    // Check authentication status
    this.checkAuthStatus();

    this.loadProductDetails();
  }

  loadProductDetails() {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.inventoryService.getItemById(id).subscribe({
        next: (product) => {
          this.product = {
            ...product,
            images: product.imageUrl.split(','),
          };
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading product:', err);
          this.showNotification = true;
          this.notificationMessage = 'Failed to load product details';
          this.notificationType = 'error';
          this.loading = false;
          setTimeout(() => this.showNotification = false, 3000);
        }
      });
    });
  }

  async checkAuthStatus(): Promise<void> {
    try {
      const user = await this.cognitoService.getUser().catch(() => null);
      this.isAuthenticated = !!user;
    } catch (error) {
      console.log('User not authenticated');
      this.isAuthenticated = false;
    }
  }

  trackByReview(index: number, review: Review) {
    return review.user + review.date;
  }

  previousImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    }
  }

  nextImage(): void {
    if (this.currentImageIndex < (this.product?.images?.length || 0) - 1) {
      this.currentImageIndex++;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
  }

  async addToCart(product: ItemInventory | undefined): Promise<void> {
    if (!product) return;

    // Check if user is authenticated
    if (!this.isAuthenticated) {
      this.showNotification = true;
      this.notificationMessage = 'Please log in to add items to cart';
      this.notificationType = 'error';
      setTimeout(() => {
        this.showNotification = false;
        this.router.navigate(['/signup']);
      }, 0);
      return;
    }

    try {
      const user = await this.cognitoService.getUser().catch(err => {
        console.error('Error fetching user details:', err);
        this.router.navigate(['/signup']);
        return null;
      });

      if (!user) return;

      this.cartService.addItemToCart(user.userId, product.itemId, 1).subscribe({
        next: () => {
          this.showNotification = true;
          this.notificationMessage = `${product.itemName} added to cart`;
          this.notificationType = 'success';
          setTimeout(() => this.showNotification = false, 3000);
        },
        error: (err) => {
          console.error('Error adding product to cart:', err);
          this.showNotification = true;
          this.notificationMessage = 'Failed to add product to cart';
          this.notificationType = 'error';
          setTimeout(() => this.showNotification = false, 3000);
        },
      });
    } catch (err) {
      console.error('Error fetching user details:', err);
      this.router.navigate(['/signup']);
    }
  }

  @HostListener('window:resize', [])
  onResize(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isDesktop = window.innerWidth >= 1024; // Update layout based on screen size
    }
  }

  buyNow(product: any) {
    // Check if user is authenticated
    if (!this.isAuthenticated) {
      this.showNotification = true;
      this.notificationMessage = 'Please log in to make a purchase';
      this.notificationType = 'error';
      setTimeout(() => {
        this.showNotification = false;
        this.router.navigate(['/signup']);
      }, 0);
      return;
    }

    this.router.navigate(['/order'], {
      queryParams: { productId: product.itemId, quantity: 1 },
    });
  }

  getStars(rating: number): string[] {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      if (i < rating) {
        stars.push('full');
      } else {
        stars.push('empty');
      }
    }
    return stars;
  }

  handleImageError(event: any) {
    // Replace broken image with default
    event.target.src = 'assets/images/default-image.jpg';
  }
}
