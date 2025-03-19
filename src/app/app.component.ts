import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { VideoComponent } from './video-handling/component/video/video.component';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { HammerModule } from '@angular/platform-browser';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VideoComponent, NavbarComponent, FooterComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'kookur-FE';
  showFooter = true;
  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.showFooter = !this.router.url.includes('/player');
      this.showFooter = !this.router.url.includes('/flapp');
    });
  }
}
