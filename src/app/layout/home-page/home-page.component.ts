import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Component, ElementRef, Inject, PLATFORM_ID, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';

interface FloatingFood {
  id: number;
  type: 'cat-food' | 'dog-food';
  image: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  zone?: 'left' | 'right' | 'top' | 'bottom';
  // Add these new properties for wave movement
  initialY: number;
  waveOffset: number;
  direction: 1 | -1; // 1 for left to right, -1 for right to left
}

type CatState = 'normal' | 'happy' | 'angry';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('leftEye') leftEye!: ElementRef;
  @ViewChild('rightEye') rightEye!: ElementRef;

  private mouseMoveListener?: (event: MouseEvent) => void;
  private touchMoveListener?: (event: TouchEvent) => void;
  
  // Food system properties
  floatingFoods: FloatingFood[] = [];
  private foodCounter = 0;
  private isDragging = false;
  private draggedFood: FloatingFood | null = null;
  private animationFrameId?: number;
  
  // Cat state management
  catState: CatState = 'normal';
  private catStateTimeout?: any;

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
      case 'orange-cat':
        this.router.navigate(['/orange-cat']);
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
    // Remove duplicate food initialization - this will be handled in ngAfterViewInit
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

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.setupEyeTracking();
      this.setupDragListeners();
      this.initializeFloatingFoods();
      this.startFoodAnimation();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.mouseMoveListener) {
        document.removeEventListener('mousemove', this.mouseMoveListener);
      }
      if (this.touchMoveListener) {
        document.removeEventListener('touchmove', this.touchMoveListener);
      }
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
      }
      if (this.catStateTimeout) {
        clearTimeout(this.catStateTimeout);
      }
      this.removeDragListeners();
    }
  }

private initializeFloatingFoods() {
  const foodTypes = [
    { type: 'cat-food' as const, image: 'assets/images/cat-food-home.png' },
    { type: 'dog-food' as const, image: 'assets/images/dog-food-home.png' }
  ];

  // Create more initial food items - 6 of each type (12 total)
  this.spawnFoodPair(foodTypes);
  
  // Set up continuous spawning
  // this.startContinuousSpawning(foodTypes);
}

private spawnFoodPair(foodTypes: any[]) {
   // Randomly decide which type starts from which side
  const fishStartsRight = Math.random() < 0.5;
  
  // Device-specific spawn positions
  const isMobile = window.innerWidth <= 767;
  const spawnOffsetLeft = isMobile ? -200 : -420;   // Closer spawn for mobile
  const spawnOffsetRight = isMobile ? 600 : 1220;   // Closer spawn for mobile
  
  // Cat-food (fish) pair
  const fishDirection = fishStartsRight ? -1 : 1;
  const fishX = fishStartsRight ? spawnOffsetRight : spawnOffsetLeft;
  const fishY1 = 100; // First fish
  const fishY2 = 140; // Second fish (more separation)
  
  // Dog-food (bone) pair - opposite side
  const boneDirection = fishStartsRight ? 1 : -1;
  const boneX = fishStartsRight ? spawnOffsetLeft : spawnOffsetRight;
  const boneY1 = 260; // First bone
  const boneY2 = 300; // Second bone (more separation)
  
  // Create first fish immediately
  this.floatingFoods.push({
    id: this.foodCounter++,
    type: 'cat-food',
    image: 'assets/images/cat-food-home.png',
    x: fishX,
    y: fishY1,
    vx: fishDirection * 1.0,
    vy: 0,
    zone: fishDirection === 1 ? 'left' : 'right',
    initialY: fishY1,
    waveOffset: 0,
    direction: fishDirection as 1 | -1
  });
  
  // Create first bone immediately
  this.floatingFoods.push({
    id: this.foodCounter++,
    type: 'dog-food',
    image: 'assets/images/dog-food-home.png',
    x: boneX,
    y: boneY1,
    vx: boneDirection * 1.0,
    vy: 0,
    zone: boneDirection === 1 ? 'left' : 'right',
    initialY: boneY1,
    waveOffset: 0,
    direction: boneDirection as 1 | -1
  });
  
  // Create second fish with delay and different position
  setTimeout(() => {
    this.floatingFoods.push({
      id: this.foodCounter++,
      type: 'cat-food',
      image: 'assets/images/cat-food-home.png',
      x: fishX - (fishDirection * 150), // Start further back for more spacing
      y: fishY2,
      vx: fishDirection * 1.0,
      vy: 0,
      zone: fishDirection === 1 ? 'left' : 'right',
      initialY: fishY2,
      waveOffset: Math.PI, // Different wave phase for separation
      direction: fishDirection as 1 | -1
    });
  }, 4000); // Increased delay for better separation
  
  // Create second bone with delay and different position
  setTimeout(() => {
    this.floatingFoods.push({
      id: this.foodCounter++,
      type: 'dog-food',
      image: 'assets/images/dog-food-home.png',
      x: boneX - (boneDirection * 150), // Start further back for more spacing
      y: boneY2,
      vx: boneDirection * 1.0,
      vy: 0,
      zone: boneDirection === 1 ? 'left' : 'right',
      initialY: boneY2,
      waveOffset: Math.PI, // Different wave phase for separation
      direction: boneDirection as 1 | -1
    });
  }, 5000); // Increased delay for better separation
}

// private startContinuousSpawning(foodTypes: any[]) {
//   // Spawn new food items every 2-4 seconds (faster spawning for more food)
//   setInterval(() => {
//     // Increase maximum items to 12 on screen (6 of each type ideally)
//     this.spawnFoodPair(foodTypes);
//   }, 2000 + Math.random() * 2000); // Random interval between 2-4 seconds
// }

private startFoodAnimation() {
  let animationTime = 0;
  
  const animate = () => {
    animationTime += 0.01; // Slower wave speed (was 0.02)
    this.updateFoodPositions(animationTime);
    this.animationFrameId = requestAnimationFrame(animate);
  };
  animate();
}

private updateFoodPositions(time: number = 0) {
  this.floatingFoods.forEach((food, index) => {
    if (!this.isDragging || food !== this.draggedFood) {
      // Wave movement calculation
      const waveAmplitude = 25;
      const waveFrequency = 0.008;
      
      const waveY = food.initialY + Math.sin((food.x * waveFrequency) + food.waveOffset + time) * waveAmplitude;
      
      const catCenterX = 400;
      const catCenterY = 180;
      const distanceToCenter = Math.sqrt(Math.pow(food.x - catCenterX, 2) + Math.pow(waveY - catCenterY, 2));
      
      let finalY = waveY;
      
      if (distanceToCenter < 120 && food.x > 200 && food.x < 600) {
        if (food.initialY < 150) {
          finalY = Math.min(waveY, 70);
        } else {
          finalY = Math.max(waveY, 290);
        }
      }
      
      food.x += food.vx;
      food.y = finalY;
      
       const isMobile = window.innerWidth <= 767;
      const removeOffsetLeft = isMobile ? -150 : -300;   // Remove sooner on mobile
      const removeOffsetRight = isMobile ? 550 : 950;    // Remove sooner on mobile
      
      // When food exits screen, respawn new pair to maintain count
      if ((food.direction === 1 && food.x > removeOffsetRight) || 
          (food.direction === -1 && food.x < removeOffsetLeft)) {
        this.floatingFoods.splice(index, 1);
        
        setTimeout(() => {
          this.respawnFoodPair();
        }, 2000);
      }
      
      food.y = Math.max(10, Math.min(360, food.y));
    }
  });
}

private respawnFoodPair() {
  // Count existing food types
  const catFoodCount = this.floatingFoods.filter(f => f.type === 'cat-food').length;
  const dogFoodCount = this.floatingFoods.filter(f => f.type === 'dog-food').length;
  
  console.log('Current counts - Cat food:', catFoodCount, 'Dog food:', dogFoodCount); // Debug log
  
  // Only spawn individual items to reach exactly 2 of each type
  const fishStartsRight = Math.random() < 0.5;
  const isMobile = window.innerWidth <= 767;
  const spawnOffsetLeft = isMobile ? -200 : -420;
  const spawnOffsetRight = isMobile ? 600 : 1220;
  
  // Spawn cat food if we have less than 2
  if (catFoodCount < 2) {
    const fishDirection = fishStartsRight ? -1 : 1;
    const fishX = fishStartsRight ? spawnOffsetRight : spawnOffsetLeft;
    const fishY = catFoodCount === 0 ? 100 : 140; // More Y separation
    
    this.floatingFoods.push({
      id: this.foodCounter++,
      type: 'cat-food',
      image: 'assets/images/cat-food-home.png',
      x: fishX - (fishDirection * (catFoodCount * 200)), // Space them apart horizontally
      y: fishY,
      vx: fishDirection * 1.0,
      vy: 0,
      zone: fishDirection === 1 ? 'left' : 'right',
      initialY: fishY,
      waveOffset: catFoodCount * Math.PI, // Different wave phases
      direction: fishDirection as 1 | -1
    });
    
    console.log('Spawned cat food. New count:', catFoodCount + 1); // Debug log
  }
  
  // Spawn dog food if we have less than 2
  if (dogFoodCount < 2) {
    const boneDirection = fishStartsRight ? 1 : -1;
    const boneX = fishStartsRight ? spawnOffsetLeft : spawnOffsetRight;
    const boneY = dogFoodCount === 0 ? 260 : 300; // More Y separation
    
    this.floatingFoods.push({
      id: this.foodCounter++,
      type: 'dog-food',
      image: 'assets/images/dog-food-home.png',
      x: boneX - (boneDirection * (dogFoodCount * 200)), // Space them apart horizontally
      y: boneY,
      vx: boneDirection * 1.0,
      vy: 0,
      zone: boneDirection === 1 ? 'left' : 'right',
      initialY: boneY,
      waveOffset: dogFoodCount * Math.PI, // Different wave phases
      direction: boneDirection as 1 | -1
    });
    
    console.log('Spawned dog food. New count:', dogFoodCount + 1); // Debug log
  }
}

  trackFood(index: number, food: FloatingFood): number {
    return food.id;
  }

  getCurrentCatImage(): string {
    switch (this.catState) {
      case 'happy':
        return 'assets/images/cat-home-happy.png';
      case 'angry':
        return 'assets/images/cat-angry-home.png';
      default:
        return 'assets/images/cat-image-home.png';
    }
  }

  startDragging(event: MouseEvent | TouchEvent, food: FloatingFood) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
    this.draggedFood = food;
    
    const foodElement = event.currentTarget as HTMLElement;
    foodElement.classList.add('dragging');
    foodElement.style.zIndex = '1000'; // Bring to front while dragging
    foodElement.style.cursor = 'grabbing'; // Change cursor
    
    // Add visual feedback for mobile
    if ('touches' in event) {
      foodElement.style.transform = 'scale(1.1)';
      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }
    
    console.log('Started dragging:', food.type, 'Touch event:', 'touches' in event); // Debug log
  }  private setupDragListeners() {
    const mouseMoveHandler = this.onDragMove.bind(this);
    const mouseUpHandler = this.onDragEnd.bind(this);
    const touchMoveHandler = this.onDragMove.bind(this);
    const touchEndHandler = this.onDragEnd.bind(this);

    document.addEventListener('mousemove', mouseMoveHandler, { passive: false });
    document.addEventListener('mouseup', mouseUpHandler);
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);

    // Store references for cleanup
    this.dragMoveHandler = mouseMoveHandler;
    this.dragEndHandler = mouseUpHandler;
    this.touchMoveHandler = touchMoveHandler;
    this.touchEndHandler = touchEndHandler;
  }

  private removeDragListeners() {
    if (this.dragMoveHandler) {
      document.removeEventListener('mousemove', this.dragMoveHandler);
    }
    if (this.dragEndHandler) {
      document.removeEventListener('mouseup', this.dragEndHandler);
    }
    if (this.touchMoveHandler) {
      document.removeEventListener('touchmove', this.touchMoveHandler);
    }
    if (this.touchEndHandler) {
      document.removeEventListener('touchend', this.touchEndHandler);
    }
  }

  // Add properties for handler references
  private dragMoveHandler?: (event: MouseEvent) => void;
  private dragEndHandler?: (event: MouseEvent) => void;
  private touchMoveHandler?: (event: TouchEvent) => void;
  private touchEndHandler?: (event: TouchEvent) => void;

  private onDragMove(event: MouseEvent | TouchEvent) {
  if (!this.isDragging || !this.draggedFood) return;
  
  event.preventDefault();
  const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
  const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

  // Get the floating food container bounds for proper positioning
  const container = document.querySelector('.floating-food-container') as HTMLElement;
  if (container) {
    const containerRect = container.getBoundingClientRect();
    // Position relative to container, accounting for offset
    this.draggedFood.x = clientX - containerRect.left - 45; // 45px is half the food width (90px/2)
    this.draggedFood.y = clientY - containerRect.top - 45;  // 45px is half the food height (90px/2)
  } else {
    // Fallback: position relative to viewport
    this.draggedFood.x = clientX - 45;
    this.draggedFood.y = clientY - 45;
  }
}

  private onDragEnd(event: MouseEvent | TouchEvent) {
    if (!this.isDragging || !this.draggedFood) return;

    console.log('Drag ended, checking for drop. Touch event:', 'changedTouches' in event); // Debug log

    // Get the current position
    const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : (event as MouseEvent).clientX;
    const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : (event as MouseEvent).clientY;

    // Check if dropped on cat before cleaning up
    this.checkFoodDrop(clientX, clientY);

    const draggedElement = document.querySelector('.floating-food.dragging');
    if (draggedElement) {
      draggedElement.classList.remove('dragging');
      (draggedElement as HTMLElement).style.zIndex = ''; // Reset z-index
      (draggedElement as HTMLElement).style.cursor = 'grab'; // Reset cursor
      (draggedElement as HTMLElement).style.transform = ''; // Reset transform
    }

    this.isDragging = false;
    this.draggedFood = null;
  }  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onCatMouseUp(event: MouseEvent) {
    console.log('Cat mouse up triggered'); // Debug log
    if (this.isDragging && this.draggedFood) {
      this.checkFoodDrop(event.clientX, event.clientY);
    }
  }

  onCatTouchEnd(event: TouchEvent) {
    console.log('Cat touch end triggered'); // Debug log
    if (event.changedTouches.length > 0 && this.isDragging && this.draggedFood) {
      const touch = event.changedTouches[0];
      this.checkFoodDrop(touch.clientX, touch.clientY);
    }
  }

  onCatDrop(event: DragEvent) {
    event.preventDefault();
    console.log('Cat drop triggered'); // Debug log
    if (this.isDragging && this.draggedFood) {
      this.checkFoodDrop(event.clientX, event.clientY);
    }
  }

  private checkFoodDrop(clientX: number, clientY: number) {
    if (!this.isDragging || !this.draggedFood) {
      console.log('No dragging or no dragged food'); // Debug log
      return;
    }

    console.log('Checking food drop at:', clientX, clientY, 'Food:', this.draggedFood.type); // Debug log

    // Get cat container bounds
    const catContainer = document.querySelector('.cat-image-wrapper') as HTMLElement;
    if (!catContainer) {
      console.log('Cat container not found'); // Debug log
      return;
    }

    const rect = catContainer.getBoundingClientRect();
    console.log('Cat container bounds:', rect); // Debug log
    
    // Increase tolerance for easier dropping on mobile
    const tolerance = window.innerWidth <= 768 ? 100 : 50; // Larger tolerance on mobile
    
    if (clientX >= rect.left - tolerance && clientX <= rect.right + tolerance && 
        clientY >= rect.top - tolerance && clientY <= rect.bottom + tolerance) {
      
      console.log('Food dropped on cat!', this.draggedFood.type); // Debug log
      
      // Add haptic feedback on successful drop
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }
      
      this.feedCat(this.draggedFood.type);
      this.removeFoodItem(this.draggedFood);
      
      // Reset dragging state
      this.isDragging = false;
      this.draggedFood = null;
    } else {
      console.log('Food not dropped on cat. Position:', clientX, clientY, 'Cat bounds:', rect, 'Tolerance:', tolerance); // Debug log
    }
  }

  private feedCat(foodType: 'cat-food' | 'dog-food') {
    console.log('Feeding cat with:', foodType); // Debug log
    
    if (foodType === 'cat-food') {
      this.catState = 'happy';
      console.log('Cat is now happy!'); // Debug log
    } else {
      this.catState = 'angry';
      console.log('Cat is now angry!'); // Debug log
    }

    // Reset to normal after X seconds - change this value to adjust duration
    if (this.catStateTimeout) {
      clearTimeout(this.catStateTimeout);
    }
    
    this.catStateTimeout = setTimeout(() => {
      this.catState = 'normal';
      console.log('Cat is back to normal'); // Debug log
    }, 800); // Change this value: 1000 = 1 second, 3000 = 3 seconds, 5000 = 5 seconds, etc.
  }
  
private removeFoodItem(food: FloatingFood) {
  const index = this.floatingFoods.indexOf(food);
  if (index > -1) {
    this.floatingFoods.splice(index, 1);
  }

  // Longer delay to prevent overlapping spawns
  setTimeout(() => {
    this.respawnFoodPair();
  }, 2500); // Increased from 1000 to 2500 for better spacing
}

  private setupEyeTracking() {
    this.mouseMoveListener = (event: MouseEvent) => {
      this.moveEyes(event.clientX, event.clientY);
    };

    this.touchMoveListener = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        const touch = event.touches[0];
        this.moveEyes(touch.clientX, touch.clientY);
      }
    };

    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('touchmove', this.touchMoveListener);
  }

  private moveEyes(x: number, y: number) {
    // Only move eyes if cat is in normal state
    if (!this.leftEye || !this.rightEye || this.catState !== 'normal') return;

    const leftEyeElement = this.leftEye.nativeElement;
    const rightEyeElement = this.rightEye.nativeElement;

    const leftEyeRect = leftEyeElement.getBoundingClientRect();
    const rightEyeRect = rightEyeElement.getBoundingClientRect();

    // Calculate eye movement for left eye
    const leftEyeCenterX = leftEyeRect.left + leftEyeRect.width / 2;
    const leftEyeCenterY = leftEyeRect.top + leftEyeRect.height / 2;
    const leftAngle = Math.atan2(y - leftEyeCenterY, x - leftEyeCenterX);
    const leftDistance = Math.min(3, Math.hypot(x - leftEyeCenterX, y - leftEyeCenterY) / 10);
    const leftMoveX = Math.cos(leftAngle) * leftDistance;
    const leftMoveY = Math.sin(leftAngle) * leftDistance;

    // Calculate eye movement for right eye
    const rightEyeCenterX = rightEyeRect.left + rightEyeRect.width / 2;
    const rightEyeCenterY = rightEyeRect.top + rightEyeRect.height / 2;
    const rightAngle = Math.atan2(y - rightEyeCenterY, x - rightEyeCenterX);
    const rightDistance = Math.min(3, Math.hypot(x - rightEyeCenterX, y - rightEyeCenterY) / 10);
    const rightMoveX = Math.cos(rightAngle) * rightDistance;
    const rightMoveY = Math.sin(rightAngle) * rightDistance;

    // Apply transformations
    leftEyeElement.style.transform = `translate(${leftMoveX}px, ${leftMoveY}px)`;
    rightEyeElement.style.transform = `translate(${rightMoveX}px, ${rightMoveY}px)`;
  }

}
