import { Component, HostListener } from '@angular/core';
import { ItemInventory } from '../../model';
import { ActivatedRoute, Router } from '@angular/router';
import { EcomService } from '../ecom/ecom.service';
import { HttpClientModule } from '@angular/common/http';
import { NgFor, NgIf } from '@angular/common';
import { CognitoService } from '../../cognito.service';

@Component({
  selector: 'app-product-details-page',
  standalone: true,
  imports: [HttpClientModule, NgIf, NgFor],
  providers: [EcomService],
  templateUrl: './product-details-page.component.html',
  styleUrl: './product-details-page.component.scss'
})
export class ProductDetailsPageComponent {
  product: ItemInventory | undefined ;
  currentImageIndex = 0;
  isDesktop: boolean = window.innerWidth >= 1024; 

  constructor(
    private route: ActivatedRoute,
    private inventoryService: EcomService,
    private cartService: EcomService,
    private cognitoService: CognitoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = +params['id'];
      this.inventoryService.getItemById(id).subscribe((product) => {
        this.product = {
          ...product,
          images: product.imageUrl.split(','),
        };
      });
    });
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
    if (product) {
      try {
        const user = await this.cognitoService.getUser();
        if (!user) {
          this.router.navigate(['/signup']);
          return;
        }
        
        this.cartService.addItemToCart(user.userId, product.itemId, 1).subscribe({
          next: () => alert('Product added to cart'),
          error: (err) => console.error('Error adding product to cart:', err),
        });
      } catch (err) {
        console.error('Error fetching user details:', err);
        this.router.navigate(['/signup']); // Redirect to signup if user is not authenticated
      }
    }
  }

  @HostListener('window:resize', [])
  onResize(): void {
    this.isDesktop = window.innerWidth >= 1024; // Update layout based on screen size
  }


  buyNow(product: any) {
    this.router.navigate(['/order'], {
      queryParams: { productId: product.itemId, quantity: 1 },
    });
  }
}
