import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-orange-cat-page',
  standalone: true,
  imports: [CommonModule,NgClass, FormsModule],
  templateUrl: './orange-cat-page.component.html',
  styleUrl: './orange-cat-page.component.scss'
})
export class OrangeCatPageComponent implements OnInit, OnDestroy {
  spotlightX: number = 0;
  spotlightY: number = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    // Initialize spotlight at center of screen
    this.spotlightX = window.innerWidth / 2;
    this.spotlightY = window.innerHeight / 2;
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  onMouseMove(event: MouseEvent) {
    this.spotlightX = event.clientX;
    this.spotlightY = event.clientY;
  }

  onTouchMove(event: TouchEvent) {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.spotlightX = touch.clientX;
      this.spotlightY = touch.clientY;
    }
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
