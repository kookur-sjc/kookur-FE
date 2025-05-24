import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [ngClass]="{'loading-overlay': overlay}" class="loading-container" [class.full-page]="fullPage">
      <img src="assets/images/dog-loading.gif" alt="Loading..." class="loading-image" />
      <p *ngIf="message" class="loading-message">{{message}}</p>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }
    
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 1);
      z-index: 1000;
    }
    
    .full-page {
      position: fixed;
      height: 100vh;
      width: 100vw;
    }
    
    .loading-image {
      max-width: 300px;
    }
    
    .loading-message {
      margin-top: 1rem;
      font-weight: 500;
      color: #440069;
    }
  `]
})
export class LoadingComponent {
  @Input() overlay: boolean = false;
  @Input() fullPage: boolean = false;
  @Input() message: string = '';
}
