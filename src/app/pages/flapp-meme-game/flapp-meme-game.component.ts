import { CommonModule, isPlatformBrowser, NgIf } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import * as Phaser from 'phaser';

interface PhaserTypes {
  Game: any;
  AUTO: number;
  Scene: any;
  Physics: any;
}

@Component({
  selector: 'app-flapp-meme-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flapp-meme-game.component.html',
  styleUrl: './flapp-meme-game.component.scss'
})
export class FlappMemeGameComponent implements OnInit, OnDestroy {
  private Phaser: any = null;
  private game: any = null;
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private resizeHandler: any = null;
  private orientationHandler: any = null;
  
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}
  
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      console.log('Initializing Phaser in browser environment');
      
      // Import Phaser in the browser
      import('phaser').then(phaserModule => {
        console.log('Phaser imported successfully');
        
        // Store the default export as Phaser
        this.Phaser = phaserModule.default;
        
        // Ensure Phaser is properly loaded before initializing
        if (!this.Phaser) {
          console.error('Phaser not properly imported, checking for named exports');
          // Try alternative approach if default export doesn't work
          this.Phaser = phaserModule;
        }
        
        // Verify Phaser is valid
        if (!this.Phaser || !this.Phaser.Scene) {
          console.error('Phaser Scene not found in imported module', this.Phaser);
          return;
        }
        
        // Setup responsive game size
        this.setupGameSize();
        
        // Small delay to ensure Phaser is fully initialized
        setTimeout(() => {
          console.log('Initializing game after delay');
          this.initGame();
        }, 100);
      }).catch(err => {
        console.error('Failed to load Phaser:', err);
      });
    }
  }

  private setupGameSize() {
    // Set game size based on window size
    const updateGameSize = () => {
      let width = window.innerWidth;
      let height = window.innerHeight;
      
      // Force landscape orientation
      if (width < height) {
        // Show rotate device message
        this.showRotateMessage(true);
        return;
      } else {
        this.showRotateMessage(false);
      }
      
      this.gameWidth = width;
      this.gameHeight = height;
      
      // Update game size if it exists
      if (this.game && this.game.scale) {
        this.game.scale.resize(width, height);
      }
    };
    
    // Initial setup
    updateGameSize();
    
    // Add resize listener
    this.resizeHandler = () => updateGameSize();
    this.orientationHandler = () => updateGameSize();
    
    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('orientationchange', this.orientationHandler);
  }
  
  private showRotateMessage(show: boolean) {
    let rotateMessage = document.getElementById('rotate-message');
    
    if (show) {
      if (!rotateMessage) {
        rotateMessage = document.createElement('div');
        rotateMessage.id = 'rotate-message';
        rotateMessage.style.position = 'fixed';
        rotateMessage.style.top = '0';
        rotateMessage.style.left = '0';
        rotateMessage.style.width = '100%';
        rotateMessage.style.height = '100%';
        rotateMessage.style.backgroundColor = 'rgba(0,0,0,0.8)';
        rotateMessage.style.color = 'white';
        rotateMessage.style.display = 'flex';
        rotateMessage.style.alignItems = 'center';
        rotateMessage.style.justifyContent = 'center';
        rotateMessage.style.zIndex = '1000';
        rotateMessage.style.fontSize = '24px';
        rotateMessage.innerHTML = '<div style="text-align: center;"><div style="transform: rotate(90deg); margin-bottom: 20px;">⟳</div>Please rotate your device to landscape mode</div>';
        document.body.appendChild(rotateMessage);
      } else {
        rotateMessage.style.display = 'flex';
      }
    } else if (rotateMessage) {
      rotateMessage.style.display = 'none';
    }
  }
  
  private initGame() {
    if (!this.Phaser || !this.Phaser.Scene) {
      console.error('Phaser not loaded correctly. Available properties:', Object.keys(this.Phaser || {}));
      return;
    }
    
    // Check if game container exists
    let container = document.getElementById('game-container');
    if (!container) {
      console.warn('Game container not found, creating one');
      container = document.createElement('div');
      container.id = 'game-container';
      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.width = '100%';
      container.style.height = '100%';
      document.body.appendChild(container);
    }
    
    try {
      const self = this; // Store reference to this for use inside the class
      
      // Create Boot Scene for loading screen
      class BootScene extends self.Phaser.Scene {
        loadingText: any;
        progressBar: any;
        progressBox: any;
        
        constructor() {
          super({ key: 'BootScene' });
        }
        
        preload() {
          const width = this['cameras'].main.width;
          const height = this['cameras'].main.height;
          
          // Display loading text
          this.loadingText = this['add'].text(width / 2, height / 2 - 50, 'Loading Game...', {
            font: '32px Arial',
            color: '#ffffff'
          });
          this.loadingText.setOrigin(0.5, 0.5);
          
          // Create loading bar
          this.progressBar = this['add'].graphics();
          this.progressBox = this['add'].graphics();
          this.progressBox.fillStyle(0x222222, 0.8);
          this.progressBox.fillRect(width / 2 - 160, height / 2 + 30, 320, 50);
          
          // Loading progress events
          this['load'].on('progress', (value: number) => {
            this.progressBar.clear();
            this.progressBar.fillStyle(0xffffff, 1);
            this.progressBar.fillRect(width / 2 - 150, height / 2 + 40, 300 * value, 30);
            this.loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
          });
          
          this['load'].on('complete', () => {
            this.progressBar.destroy();
            this.progressBox.destroy();
            this.loadingText.destroy();
            this['scene'].start('FlappyCatScene');
          });
          
          // Load all assets - Modified to treat GIFs as images
          this['load'].image('background', './assets/images/background.jpg');
          
          // Load cat images (treat GIFs as static images)
          this['load'].image('cat-normal', './assets/images/cat-normal.gif');
          this['load'].image('cat-happy', './assets/images/cat-happy.gif');
          this['load'].image('cat-sad', './assets/images/cat-sad.gif');
          
          // Load dog images (treat GIFs as static images)
          this['load'].image('dog-waiting', './assets/images/dog-waiting.jpg');
          this['load'].image('dog-crying', './assets/images/dog-sad.gif');
          this['load'].image('dog-happy', './assets/images/dog-happy.gif');
          
          // Load restart button
          this['load'].image('restart-btn', './assets/images/restart-button.png');
          
          // Load audio files
          this['load'].audio('cat-meow', './assets/audio/test.mp3');
          this['load'].audio('dog-bark', './assets/audio/test.mp3');
          this['load'].audio('collision', './assets/audio/test.mp3');
          this['load'].audio('point', './assets/audio/test.mp3');
          this['load'].audio('game-over', './assets/audio/test.mp3');
          this['load'].audio('flap', './assets/audio/test.mp3');
        }
        
        create() {
          // No animations needed since we're using static images
          console.log('Boot scene complete, starting game');
        }
      }
      
      // Modern approach to creating a Phaser scene - use local reference to Phaser
      class FlappyCatScene extends self.Phaser.Scene {
        cat: any;
        obstacles: any;
        dogImages: any;
        restartButton: any;
        gameOver: boolean;
        score: number;
        scoreText: any;
        passedObstacles: Set<any>;
        catEmotionTimer: any;
        background: any;
        sounds: any = {};
        
        constructor() {
          super({ key: 'FlappyCatScene' });
          this.gameOver = false;
          this.score = 0;
          this.passedObstacles = new Set();
        }
        
        create() {
          console.log('Creating game scene');
          
          // Get game dimensions
          const width = this['cameras'].main.width;
          const height = this['cameras'].main.height;
          
          // Add background - scale to fit screen
          this.background = this['add'].image(width / 2, height / 2, 'background');
          this.background.setDisplaySize(width, height);
          
          // Create obstacles group
          this.obstacles = this['physics'].add.group({
            allowGravity: false,
            immovable: true
          });
          
          // Create dog images group (not physics objects, just for visuals)
          this.dogImages = this['add'].group();
          
          // Create cat sprite (static image)
          this.cat = this['physics'].add.sprite(150, height / 2, 'cat-normal');
          // Set cat size - adjust as needed
          this.cat.setScale(0.2);
          this.cat.setCollideWorldBounds(true);
          
          // Adjust the hitbox of the cat to be smaller than the image
          this.cat.body.setSize(this.cat.width * 0.6, this.cat.height * 0.6);
          this.cat.body.setOffset(this.cat.width * 0.2, this.cat.height * 0.2);
          
          // Add collision with world bounds - when cat hits bounds, end game
          this.cat.body.onWorldBounds = true;
          this['physics'].world.on('worldbounds', this.hitWorldBounds, this);
          
          // Add score text
          this.scoreText = this['add'].text(16, 16, 'Score: 0', { 
            fontSize: '32px', 
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
          });
          
          // Create obstacle timer - increased delay to make game more playable
          this['time'].addEvent({
            delay: 2500, // Increased from 2000 to give more breathing room
            callback: this.addRandomObstacle,
            callbackScope: this,
            loop: true
          });
          
          // Setup input - both mouse/touch and keyboard
          this['input'].on('pointerdown', this.flapCat, this);
          
          // Add keyboard controls
          this['input'].keyboard.on('keydown-SPACE', this.flapCat, this);
          this['input'].keyboard.on('keydown-UP', this.flapCat, this);
          this['input'].keyboard.on('keydown-W', this.flapCat, this);
          
          // Setup collision detection
          this['physics'].add.collider(this.cat, this.obstacles, this.hitObstacle, null, this);
          
          // Create restart button
          this.restartButton = this['add'].image(width / 2, height / 2 + 100, 'restart-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this['scene'].restart();
              this.gameOver = false;
              this.score = 0;
            })
            .setVisible(false)
            .setScale(0.5);
          
          // Load sounds
          this.sounds = {
            catMeow: this['sound'].add('cat-meow'),
            dogBark: this['sound'].add('dog-bark'),
            collision: this['sound'].add('collision'),
            point: this['sound'].add('point'),
            gameOver: this['sound'].add('game-over'),
            flap: this['sound'].add('flap')
          };
          
          // Play cat sound on start
          this.sounds.catMeow.play();
          
          console.log('Game scene created');
        }
        
        update(time: number, delta: number) {
          if (this.gameOver || !this.cat) {
            return;
          }
          
          // Update cat rotation based on velocity
          if (this.cat.body.velocity.y > 0) {
            this.cat.angle += 1;
          } else {
            this.cat.angle = -15;
          }
          
          // Check for obstacle passing
          this.obstacles.getChildren().forEach((obstacle: any) => {
            if (!obstacle.scored && obstacle.x < this.cat.x) {
              this.increaseScore();
              obstacle.scored = true;
              this.passedObstacles.add(obstacle);
              
              // Play point sound
              this.sounds.point.play();
              
              // Find associated dog and change its emotion
              const dogIndex = Array.from(this.passedObstacles).indexOf(obstacle);
              const dogs = this.dogImages.getChildren();
              if (dogIndex !== -1 && dogs[dogIndex]) {
                dogs[dogIndex].setTexture('dog-crying');
                this.sounds.dogBark.play();
              }
              
              // Make cat happy temporarily
              this.cat.setTexture('cat-happy');
              this.sounds.catMeow.play();
              
              if (this.catEmotionTimer) this.catEmotionTimer.remove();
              this.catEmotionTimer = this['time'].delayedCall(500, () => {
                if (!this.gameOver && this.cat) this.cat.setTexture('cat-normal');
              }, [], this);
            }
          });
          
          // Clean up obstacles that are off screen
          this.obstacles.getChildren().forEach((obstacle: any) => {
            if (obstacle.x < -obstacle.width) {
              obstacle.destroy();
            }
          });

            // Clean up dog images that are off screen
            this.dogImages.getChildren().forEach((dog: any) => {
              if (dog.x < -dog.width) {
                dog.destroy();
              }
            });
          }
          
          flapCat() {
            if (this.gameOver || !this.cat) return;
            
            // Apply upward velocity to make the cat "flap"
            this.cat.body.velocity.y = -350;
            
            // Play flap sound
            this.sounds.flap.play();
          }
          
          // Method to handle hitting the world bounds - MODIFIED to end game on ANY boundary hit
          hitWorldBounds(body: any, up: boolean, down: boolean, left: boolean, right: boolean) {
            if (!this.gameOver && (up || down || left || right)) {
              // End game if cat hits any screen boundary
              this.hitObstacle();
            }
          }
          
          // New method to add random obstacles with improved gaps
          addRandomObstacle() {
            if (this.gameOver) return;
            
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            const obstacleTypes = ['top-bottom', 'middle', 'diagonal', 'multiple'];
            // Randomly select obstacle type but with better distribution
            // Increase chance of easier obstacles for better gameplay
            const typeRoll = Math.random();
            let obstacleType;
            
            if (typeRoll < 0.4) {
              obstacleType = 'top-bottom'; // 40% chance - most playable
            } else if (typeRoll < 0.7) {
              obstacleType = 'middle'; // 30% chance
            } else if (typeRoll < 0.85) {
              obstacleType = 'diagonal'; // 15% chance
            } else {
              obstacleType = 'multiple'; // 15% chance - most difficult
            }
            
            switch (obstacleType) {
              case 'top-bottom':
                this.addTopBottomObstacle();
                break;
              case 'middle':
                this.addMiddleObstacle();
                break;
              case 'diagonal':
                this.addDiagonalObstacle();
                break;
              case 'multiple':
                this.addMultipleObstacles();
                break;
            }
          }
          
          // Improved top-bottom obstacle pattern with larger gaps
          addTopBottomObstacle() {
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            const obstacleWidth = 80;
            const gapSize = 250; // Increased gap size (was 200)
            
            // Calculate random gap position - ensure it's not too close to edges
            const gapStart = Math.floor(Math.random() * (height - gapSize - 150)) + 75;
            const gapEnd = gapStart + gapSize;
            
            // Create top obstacle
            const topObstacle = this.obstacles.create(width, gapStart / 2, null);
            topObstacle.body.setSize(obstacleWidth, gapStart);
            topObstacle.setVelocityX(-200);
            topObstacle.scored = false;
            
            // Make obstacle visible
            const topGraphics = this['add'].graphics();
            topGraphics.fillStyle(0xFF0000, 0.5); // Semi-transparent red
            topGraphics.fillRect(-obstacleWidth/2, -gapStart/2, obstacleWidth, gapStart);
            topGraphics.x = topObstacle.x;
            topGraphics.y = topObstacle.y;

            
            // Create bottom obstacle
            const bottomObstacle = this.obstacles.create(width, gapEnd + (height - gapEnd) / 2, null);
            bottomObstacle.body.setSize(obstacleWidth, height - gapEnd);
            bottomObstacle.setVelocityX(-200);
            bottomObstacle.scored = false;
            
            // Make obstacle visible
            const bottomGraphics = this['add'].graphics();
            bottomGraphics.fillStyle(0xFF0000, 0.5); // Semi-transparent red
            bottomGraphics.fillRect(-obstacleWidth/2, -(height - gapEnd)/2, obstacleWidth, height - gapEnd);
            bottomGraphics.x = bottomObstacle.x;
            bottomGraphics.y = bottomObstacle.y;
            
            // Add dog at the top and bottom
            const topDog = this['add'].sprite(width, gapStart - 20, 'dog-waiting');
            topDog.setScale(0.15);
            topDog.setOrigin(0.5, 1);
            this.dogImages.add(topDog);
            
            const bottomDog = this['add'].sprite(width, gapEnd + 20, 'dog-waiting');
            bottomDog.setScale(0.15);
            bottomDog.setOrigin(0.5, 0);
            this.dogImages.add(bottomDog);
            
            // Add tweens to move the dogs with obstacles
            this['tweens'].add({
              targets: [topDog, bottomDog],
              x: -100,
              duration: 5000,
              ease: 'Linear'
            });
          }
          
          // Middle obstacle with larger gaps
          addMiddleObstacle() {
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            const obstacleWidth = 80;
            const obstacleHeight = 130; // Reduced height (was 150)
            
            // Create middle obstacle
            const middleObstacle = this.obstacles.create(width, height / 2, null);
            middleObstacle.body.setSize(obstacleWidth, obstacleHeight);
            middleObstacle.setVelocityX(-200);
            middleObstacle.scored = false;
            
            // Make obstacle visible
            const middleGraphics = this['add'].graphics();
            middleGraphics.fillStyle(0xFF0000, 0.5); // Semi-transparent red
            middleGraphics.fillRect(-obstacleWidth/2, -obstacleHeight/2, obstacleWidth, obstacleHeight);
            middleGraphics.x = middleObstacle.x;
            middleGraphics.y = middleObstacle.y;
            
            // Add dogs on either side of the obstacle
            const topDog = this['add'].sprite(width, height / 2 - obstacleHeight / 2 - 20, 'dog-waiting');
            topDog.setScale(0.15);
            topDog.setOrigin(0.5, 1);
            this.dogImages.add(topDog);
            
            const bottomDog = this['add'].sprite(width, height / 2 + obstacleHeight / 2 + 20, 'dog-waiting');
            bottomDog.setScale(0.15);
            bottomDog.setOrigin(0.5, 0);
            this.dogImages.add(bottomDog);
            
            // Add tweens to move the dogs with obstacles
            this['tweens'].add({
              targets: [topDog, bottomDog, middleObstacle],
              x: -100,
              duration: 5000,
              ease: 'Linear'
            });
          }
          
          // Diagonal obstacles with improved spacing
          addDiagonalObstacle() {
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            const obstacleWidth = 80;
            const obstacleHeight = 80; // Reduced height for easier passage
            const gapSize = 240; // Increased gap size (was 200)
            
            // Create diagonal obstacles (top-right to bottom-left) - only 2 obstacles instead of 3
            for (let i = 0; i < 2; i++) {
              const posY = i * (gapSize + obstacleHeight);
              const obstacle = this.obstacles.create(width, posY, null);
              obstacle.body.setSize(obstacleWidth, obstacleHeight);
              obstacle.setVelocityX(-200);
              obstacle.scored = i === 0; // Only count first obstacle for score
              
              // Make obstacle visible
              const graphics = this['add'].graphics();
              graphics.fillStyle(0xFF0000, 0.5); // Semi-transparent red
              graphics.fillRect(-obstacleWidth/2, -obstacleHeight/2, obstacleWidth, obstacleHeight);
              graphics.x = obstacle.x;
              graphics.y = obstacle.y;
              
              // Add dog beside obstacle
              const dog = this['add'].sprite(width + 20, posY, 'dog-waiting');
              dog.setScale(0.15);
              this.dogImages.add(dog);
              
              // Add tween for diagonal movement
              this['tweens'].add({
                targets: [obstacle, dog],
                x: -100,
                y: posY + height * 0.7, // Reduced movement to make path more predictable
                duration: 5000,
                ease: 'Linear'
              });
            }
          }
          
          // Multiple scattered obstacles with improved spacing
          addMultipleObstacles() {
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            const obstacleWidth = 50; // Reduced size
            const obstacleHeight = 50; // Reduced size
            
            // Number of obstacles to create - reduced count
            const obstacleCount = 2 + Math.floor(Math.random() * 2); // 2-3 obstacles instead of 3-5
            
            // Create multiple small obstacles
            for (let i = 0; i < obstacleCount; i++) {
              // Random position but ensure there's always a path through
              const segment = height / (obstacleCount + 1);
              const baseY = segment * (i + 1);
              const randomOffsetY = (Math.random() - 0.5) * segment * 0.5; // Reduced randomness
              const posY = baseY + randomOffsetY;
              
              const obstacle = this.obstacles.create(width, posY, null);
              obstacle.body.setSize(obstacleWidth, obstacleHeight);
              obstacle.setVelocityX(-200);
              obstacle.scored = i === 0; // Only count first obstacle for score
              
              // Make obstacle visible
              const graphics = this['add'].graphics();
              graphics.fillStyle(0xFF0000, 0.5); // Semi-transparent red
              graphics.fillRect(-obstacleWidth/2, -obstacleHeight/2, obstacleWidth, obstacleHeight);
              graphics.x = obstacle.x;
              graphics.y = obstacle.y;
              
              // Add dog in or beside obstacle
              const dog = this['add'].sprite(width + 10, posY, 'dog-waiting');
              dog.setScale(0.12);
              this.dogImages.add(dog);
              
              // Add tweens to move the objects
              this['tweens'].add({
                targets: [obstacle, dog],
                x: -100,
                duration: 5000,
                ease: 'Linear'
              });
            }
          }
          
          hitObstacle() {
            if (!this.cat || this.gameOver) return;
            
            this['physics'].pause();
            this.gameOver = true;
            
            // Play collision and game over sounds
            this.sounds.collision.play();
            this.sounds.gameOver.play();
            
            // Stop all tweens
            this['tweens'].killAll();
            
            // Change cat to sad
            this.cat.setTexture('cat-sad');
            
            // Change any visible dogs to happy
            this.dogImages.getChildren().forEach((dog: any) => {
              dog.setTexture('dog-happy');
              // Random dog barks 
              if (Math.random() > 0.5) {
                this.sounds.dogBark.play();
              }
            });
            
            const width = this['cameras'].main.width;
            const height = this['cameras'].main.height;
            
            // Add game over text
            this['add'].text(width / 2, height / 2 - 50, 'Game Over', { 
              fontSize: '64px', 
              color: '#fff',
              stroke: '#000',
              strokeThickness: 6
            }).setOrigin(0.5);
            
            this.restartButton.setVisible(true);
          }
          
          increaseScore() {
            this.score += 1;
            if (this.scoreText) {
              this.scoreText.setText('Score: ' + this.score);
            }
          }
        }
        // Configure the game with the scenes
const config = {
  type: this.Phaser.AUTO,
  width: this.gameWidth,
  height: this.gameHeight,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 300, x: 0 },
      debug: false
    }
  },
  scene: [BootScene, FlappyCatScene],
  scale: {
    mode: this.Phaser.Scale.RESIZE,
    autoCenter: this.Phaser.Scale.CENTER_BOTH
  },
  autoRound: true // Ensure pixel-perfect rendering
};

console.log('Creating game with config');
this.game = new this.Phaser.Game(config);
console.log('Game created successfully');

} catch (error) {
  console.error('Error creating scene:', error);
}
}

ngOnDestroy() {
  console.log('Destroying game');
  if (this.game) {
    this.game.destroy(true);
  }
  
  // Only remove event listeners if in browser environment
  if (isPlatformBrowser(this.platformId)) {
    // Clean up event listeners
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
    }
    
    // Remove the rotate message if it exists
    const rotateMessage = document.getElementById('rotate-message');
    if (rotateMessage) {
      rotateMessage.remove();
    }
  }
}

}
