import { NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { CartPageComponent } from '../../pages/cart-page/cart-page.component';
import { Router } from '@angular/router';
import { CognitoService } from '../../cognito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  isMenuOpen = false;
  isProductPage = false;

  constructor(
    private router: Router,
    private cognitoService: CognitoService
  ) {}
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;

  }

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.isProductPage = this.router.url.includes("product"); // Adjust the route accordingly
    });
  }

  async onCartClick() {
    try {
      const user = await this.cognitoService.getUser().catch(() => null);

      if (!user) {
        // If the user is not logged in, redirect to signup page
        this.router.navigate(['/signup']);
      } else {
        // If the user is logged in, navigate to the cart page
        this.router.navigate(['/cart']);
      }
    } catch (err) {
      console.error('Error checking user authentication:', err);
      // Redirect to signup in case of an error
      this.router.navigate(['/signup']);
    }
  }
}
