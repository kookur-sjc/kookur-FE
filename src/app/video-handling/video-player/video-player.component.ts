import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { VideoService } from '../service/video.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser, NgFor } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [FormsModule, HttpClientModule,NgFor],
  providers: [VideoService],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent {
  videos: string[] = [];
  currentVideoIndex = 0;
  isBrowser: boolean;
  observer: IntersectionObserver | undefined;

  tags = ''; // To store user input for tags
  moods = ''; // To store user input for moods
  preloadedVideos: HTMLVideoElement[] = []; 

  constructor(private videoService: VideoService, @Inject(PLATFORM_ID) private platformId: Object ) { this.isBrowser = isPlatformBrowser(this.platformId); }

  ngOnInit() {
    // Example: fetch videos based on selected tags and moods
    this.loadVideos('dogs', 'happy');
  }

  loadVideos(tags: string, moods: string) {
    this.videoService.getVideoUrls(tags, moods).subscribe((urls) => {
      this.videos = urls;
      console.log('Videos loaded:', this.videos);
    });
  }

  initializeIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5 // Play video when 50% of it is visible
    };

    this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);

    // Observe each video element
    this.videos.forEach((_, index) => {
      const videoElement = document.querySelectorAll('video')[index] as HTMLVideoElement;
      if (videoElement) {
        this.observer?.observe(videoElement);
      }
    });
  }

  handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      const video = entry.target as HTMLVideoElement;
      if (entry.isIntersecting) {
        video.play().catch((error) => console.error('Error playing video:', error));
      } else {
        video.pause();
      }
    });
  }

  preloadVideos() {
    // Clear any previously preloaded videos
    if (this.isBrowser) {
      this.videos.forEach(url => {
        const video = document.createElement('video');
        video.src = url;
        video.preload = 'auto';
      });
    }
  }

  playNextVideo() {
    if (this.currentVideoIndex < this.videos.length - 1) {
      this.currentVideoIndex++;
      // Optionally, you can automatically play the next video
      const videoElement = document.querySelectorAll('video')[this.currentVideoIndex] as HTMLVideoElement;
      if (videoElement) {
        videoElement.play();
      }
    }
  }

  handleScroll(event: any) {
    // Detect when to load the next video
    const container = event.target;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
      this.playNextVideo();
    }
  }

}
