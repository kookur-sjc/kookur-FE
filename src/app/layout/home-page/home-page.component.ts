import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {

  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object) {}

  navigateToFeature(feature: string) {
    switch (feature) {
      case 'videos':
        this.router.navigate(['/player']);
        break;
      case 'shop':
        this.router.navigate(['/all-products']);
        break;
      case 'games':
        this.router.navigate(['/games']);
        break;
      default:
        console.error('Invalid feature selected.');
    }
  }

  @ViewChild('moodVideoPlayer', { static: false }) moodVideoPlayer!: ElementRef<HTMLVideoElement>;

  // Array of video URLs
  moodVideos: string[] = [
    'https://kookurvideostorage.s3.ap-south-1.amazonaws.com/2023-11-30_13-23-57_UTC.mp4',
    'https://kookurvideostorage.s3.ap-south-1.amazonaws.com/2023-12-03_16-25-44_UTC.mp4',
  ];
  // swiper: Swiper | undefined;
  currentVideoIndex = 0;

  ngOnInit(): void {
    // Initialize with the first video
    this.currentVideo = this.moodVideos[this.currentVideoIndex];
  }

  get currentVideo(): string {
    return this.moodVideos[this.currentVideoIndex];
  }

  set currentVideo(url: string) {
    if (this.moodVideoPlayer) {
      this.moodVideoPlayer.nativeElement.src = url;
      this.moodVideoPlayer.nativeElement.play();
    }
  }

  playNextVideo(): void {
    // Move to the next video in the playlist, or loop back to the first
    this.currentVideoIndex = (this.currentVideoIndex + 1) % this.moodVideos.length;

    // Smooth transition: Fade out, update src, then fade in
    const videoElement = this.moodVideoPlayer.nativeElement;
    videoElement.classList.add('opacity-0'); // Fade out
    setTimeout(() => {
      this.currentVideo = this.moodVideos[this.currentVideoIndex];
      videoElement.classList.remove('opacity-0'); // Fade back in
    }, 1000); // Match fade-out duration
  }

}
