import { NgClass, NgIf } from '@angular/common';
import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CartPageComponent } from '../../pages/cart-page/cart-page.component';
import { Router } from '@angular/router';
import { CognitoService } from '../../cognito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgIf, NgClass],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isProductPage = false;
  isScrolled = false;
  isOrangeCatPage = false;

  constructor(
    private router: Router,
    private cognitoService: CognitoService
  ) {}

  ngOnInit() {
    this.router.events.subscribe(() => {
      this.isProductPage = this.router.url.includes("product");
      this.isOrangeCatPage = this.router.url === "/orange-cat";
      // Close mobile menu on route change
      this.isMenuOpen = false;
    });
  }

  ngOnDestroy() {
    // Clean up any subscriptions if needed
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    
    // Prevent body scroll when mobile menu is open
    if (this.isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  // Listen for scroll events to change navbar appearance
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 50;
  }

  // Close mobile menu when clicking outside
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    const navbar = document.querySelector('nav');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (this.isMenuOpen && navbar && mobileMenu && 
        !navbar.contains(target) && !mobileMenu.contains(target)) {
      this.isMenuOpen = false;
      document.body.style.overflow = '';
    }
  }

  // Handle cart click with enhanced UX
  async onCartClick() {
    try {
      const user = await this.cognitoService.getUser().catch(() => null);

      if (!user) {
        // Add a subtle animation before redirect
        const button = event?.currentTarget as HTMLElement;
        if (button) {
          button.style.transform = 'scale(0.95)';
          setTimeout(() => {
            button.style.transform = '';
          }, 150);
        }
        
        this.router.navigate(['/signup']);
      } else {
        this.router.navigate(['/cart']);
      }
    } catch (err) {
      console.error('Error checking user authentication:', err);
      this.router.navigate(['/signup']);
    }
  }

  // Close mobile menu on escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent) {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
      document.body.style.overflow = '';
    }
  }
}
