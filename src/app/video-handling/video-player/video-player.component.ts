import { Component, ElementRef, Inject, OnInit, PLATFORM_ID, QueryList, ViewChildren } from '@angular/core';
import { VideoService } from '../service/video.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { isPlatformBrowser, NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-video-player',
  standalone: true,
  imports: [FormsModule, HttpClientModule,NgFor, NgIf],
  providers: [VideoService],
  templateUrl: './video-player.component.html',
  styleUrl: './video-player.component.scss'
})
export class VideoPlayerComponent implements OnInit {
  videos: string[] = [];
  currentVideoIndex = 0;
  isBrowser: boolean;
  observer: IntersectionObserver | undefined;
  preloadCount = 10; // Number of videos to preload
  videosLoaded = false; 
  @ViewChildren('videoElement') videoElements!: QueryList<ElementRef<HTMLVideoElement>>;


  videosWatched = 0;
  showFeedback = false;
  feedbackMessage = '';
  tags = ''; // To store user input for tags
  moods = ''; // To store user input for moods
  preloadedVideos: HTMLVideoElement[] = []; 
selectedTags: string[] = [];
selectedMoods: string[] = [];
tagsList = ['Dogs', 'Cats', 'Random']; // Example tags
moodsList = ['Happy', 'Sad', 'Angry', 'Tired']; // Example moods
currentVideoFeedbackMessage = '';
watchedVideos: Set<string> = new Set();


  constructor(private videoService: VideoService, @Inject(PLATFORM_ID) private platformId: Object ) { this.isBrowser = isPlatformBrowser(this.platformId); }

  ngOnInit() {
    this.healthCheck();
    // // Example: fetch videos based on selected tags and moods
    // this.loadVideos('dogs', 'happy');
  }

  // loadVideos(tags: string, moods: string) {
  //   this.videoService.getVideoUrls(tags, moods).subscribe((urls) => {
  //     this.videos = urls;
  //     console.log('Videos loaded:', this.videos);
  //   });
  // }

  // handleScroll(event: any): void {
  //   // Example logic for lazy-loading videos when scrolling to the bottom
  //   const { scrollTop, clientHeight, scrollHeight } = event.target;
  //   if (scrollTop + clientHeight >= scrollHeight - 100) {
  //     console.log('Reached the bottom of the video list!');
  //     // Load more videos or implement infinite scrolling logic here
  //   }
  // }

  // initializeIntersectionObserver() {
  //   const options = {
  //     root: null,
  //     rootMargin: '0px',
  //     threshold: 0.5 // Play video when 50% of it is visible
  //   };

  //   this.observer = new IntersectionObserver(this.handleIntersection.bind(this), options);

  //   // Observe each video element
  //   this.videos.forEach((_, index) => {
  //     const videoElement = document.querySelectorAll('video')[index] as HTMLVideoElement;
  //     if (videoElement) {
  //       this.observer?.observe(videoElement);
  //     }
  //   });
  // }

  // handleIntersection(entries: IntersectionObserverEntry[]) {
  //   entries.forEach(entry => {
  //     const video = entry.target as HTMLVideoElement;
  //     if (entry.isIntersecting) {
  //       video.play().catch((error) => console.error('Error playing video:', error));
  //     } else {
  //       video.pause();
  //     }
  //   });
  // }

  // preloadVideos() {
  //   // Clear any previously preloaded videos
  //   if (this.isBrowser) {
  //     this.videos.forEach(url => {
  //       const video = document.createElement('video');
  //       video.src = url;
  //       video.preload = 'auto';
  //     });
  //   }
  // }

  // playNextVideo() {
  //   if (this.currentVideoIndex < this.videos.length - 1) {
  //     this.currentVideoIndex++;
  //     // Optionally, you can automatically play the next video
  //     const videoElement = document.querySelectorAll('video')[this.currentVideoIndex] as HTMLVideoElement;
  //     if (videoElement) {
  //       videoElement.play();
  //     }
  //   }
  // }

  // handleScroll(event: any) {
  //   // Detect when to load the next video
  //   const container = event.target;
  //   if (container.scrollTop + container.clientHeight >= container.scrollHeight) {
  //     this.playNextVideo();
  //   }
  // }

  loadVideos(tags:string[],moods: string[]): void {
    if(this.selectedTags.length > 0 && this.selectedMoods.length > 0) {
    this.videoService.getVideoUrls(tags[0], moods[0]).subscribe((urls) => {
      this.videos = urls;
      this.videosLoaded = true;
      console.log('Videos loaded:', this.videos);
    });
  }
  }

  onScroll(event: any): void {
    if (this.isBrowser) {
      const { scrollTop, clientHeight } = event.target;
      const videoElements = this.videoElements.toArray();

      videoElements.forEach((video, index) => {
        const videoTop = video.nativeElement.offsetTop;
        const videoHeight = video.nativeElement.offsetHeight;

        if (
          scrollTop >= videoTop - clientHeight / 2 &&
          scrollTop < videoTop + videoHeight - clientHeight / 2
        ) {
          this.playVideo(index);
        } else {
          this.pauseVideo(index);
        }
      });
    }
  }

  // onVideoEnded(index: number): void {
  //   if (index < this.videos.length - 1) {
  //     const nextVideo = this.videoElements.toArray()[index + 1]?.nativeElement;
  //     nextVideo?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     this.playVideo(index + 1);
  //   }
  // }

  playVideo(index: number): void {
    const video = this.videoElements.get(index)?.nativeElement;
    if (video && video.paused) {
      video.play();
    }
  }

  pauseVideo(index: number): void {
    const video = this.videoElements.get(index)?.nativeElement;
    if (video && !video.paused) {
      video.pause();
    }
  }

  selectTag(tag: string): void {
    if (!this.selectedTags.includes(tag)) {
      this.selectedTags.push(tag);
    } else {
      this.selectedTags = this.selectedTags.filter((t) => t !== tag);
    }
  }
  
  selectMood(mood: string): void {
    if (!this.selectedMoods.includes(mood)) {
      this.selectedMoods.push(mood);
    } else {
      this.selectedMoods = this.selectedMoods.filter((m) => m !== mood);
    }
  }
  

  onAllVideoEnded(index: number): void {
    const videoUrl = this.videos[index]; // Get the URL of the current video
    this.watchedVideos.add(videoUrl);   // Mark the current video as watched
    console.log('Videos watched:', Array.from(this.watchedVideos));
  
    // Show feedback after this video ends
    this.showFeedback = true;
    this.currentVideoFeedbackMessage =
      this.moods.includes('happy') || this.tags.includes('positive')
        ? "We're glad this video improved your mood!"
        : "We'll keep trying to improve your experience!";
  };
  
  // Proceed to the next video (hide feedback)

  fetchMoreVideos(): void {
    this.showFeedback = false;
    this.videosWatched = 0; // Reset the counter
    this.loadVideos(this.selectedTags, this.selectedMoods); // Fetch the next set of videos
  }
  
  resetSelection(): void {
    this.showFeedback = false;
    this.videosWatched = 0; // Reset the counter
    this.videosLoaded = false; // Hide video section
    this.videos = []; // Clear current videos
    this.tags = ''; // Clear selected tags
    this.moods = ''; // Clear selected moods
  }

  healthCheck(): void {
    this.videoService.health().subscribe((response) => {
      console.log('Health check response:', response);
    });
  }
  
  // loadVideos(tags: string, moods: string): void {
  //   this.videoService.getVideoUrls(tags, moods).subscribe((urls) => {
  //     this.videos = urls.slice(0, this.preloadCount);
  //     console.log('Videos loaded:', this.videos);
  //     this.scrollToVideo(0);
  //   });
  // }

  // scrollToVideo(index: number): void {
  //   const videoContainer = document.querySelector(
  //     `[data-index="${index}"]`
  //   ) as HTMLElement;
  //   if (videoContainer) {
  //     videoContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //   }
  // }

  // onVideoEnd(): void {
  //   // Automatically scroll to the next video when the current one ends
  //   if (this.currentVideoIndex < this.videos.length - 1) {
  //     this.currentVideoIndex++;
  //     this.scrollToVideo(this.currentVideoIndex);
  //   }
  // }

}
