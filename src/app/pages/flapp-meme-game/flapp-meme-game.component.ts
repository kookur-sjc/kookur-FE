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
      document.body.appendChild(container);
    }
    
    try {
      const self = this; // Store reference to this for use inside the class
      
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
        loadingText: any;
        gameWidth: number = 360;  // Update this line
        gameHeight: number = 640; // Update this line
        
        // Audio variables
        catFlapSound: any;
        catHappySound: any;
        catSadSound: any;
        dogWaitingSound: any;
        dogCryingSound: any;
        dogHappySound: any;
        gameOverSound: any;
        
        constructor() {
          super({ key: 'FlappyCatScene' });
          this.gameOver = false;
          this.score = 0;
          this.passedObstacles = new Set();
        }
        
        preload() {
          console.log('Preloading assets');
          
          // Create loading text
          this.loadingText = this['add'].text(
            this['game'].config.width / 2, 
            this['game'].config.height / 2, 
            'Loading game...', 
            { 
              fontSize: '32px', 
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4
            }
          ).setOrigin(0.5);
          
          // Add loading progress bar
          const progressBar = this['add'].graphics();
          const progressBox = this['add'].graphics();
          progressBox.fillStyle(0x222222, 0.8);
          progressBox.fillRect(240, 270, 320, 50);
          
          // Add loading progress event
          this['load'].on('progress', function (value: number) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(250, 280, 300 * value, 30);
          });
          
          // Add error handler for asset loading
          this['load'].on('loaderror', (fileObj: any) => {
            console.error('Error loading asset:', fileObj.src);
          });
          
          // Add complete handler
          this['load'].on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            this.loadingText.destroy();
          });
          
          // Load cat meme sprites with absolute paths
          this['load'].image('cat-normal', './assets/images/cat-normal.gif');
          this['load'].image('cat-happy', './assets/images/cat-happy.gif');
          this['load'].image('cat-sad', './assets/images/cat-sad.gif');
          
          // Load dog meme sprites
          this['load'].image('dog-waiting', './assets/images/dog-waiting.jpg');
          this['load'].image('dog-crying', './assets/images/dog-sad.gif');
          this['load'].image('dog-happy', './assets/images/dog-happy.gif');
          this['load'].image('restart-btn', './assets/images/restart-button.png');
          
          // Game assets
          this['load'].image('background', './assets/images/background.jpg');
          
          // Load audio files
          this['load'].audio('cat-flap', './assets/audio/test.mp3');
          this['load'].audio('cat-happy', './assets/audio/test.mp3');
          this['load'].audio('cat-sad', './assets/audio/test.mp3');
          this['load'].audio('dog-waiting', './assets/audio/test.mp3');
          this['load'].audio('dog-crying', './assets/audio/test.mp3');
          this['load'].audio('dog-happy', './assets/audio/test.mp3');
          this['load'].audio('game-over', './assets/audio/test.mp3');
          
          console.log('Assets preload complete');
        }
        
        create() {
          console.log('Creating game scene');
          
          // Get game dimensions for responsive sizing
          this.gameWidth = this['game'].config.width;
          this.gameHeight = this['game'].config.height;
          
          // Create audio objects
          this.catFlapSound = this['sound'].add('cat-flap');
          this.catHappySound = this['sound'].add('cat-happy');
          this.catSadSound = this['sound'].add('cat-sad');
          this.dogWaitingSound = this['sound'].add('dog-waiting');
          this.dogCryingSound = this['sound'].add('dog-crying');
          this.dogHappySound = this['sound'].add('dog-happy');
          this.gameOverSound = this['sound'].add('game-over');
          
          const background = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'background');
background.setDisplaySize(this.gameWidth, this.gameHeight);
background.setScale(
  Math.max(this.gameWidth / background.width, this.gameHeight / background.height)
);
// bg.setDisplaySize(this.gameWidth + 10, this.gameHeight + 10);
          // Create obstacles group
          this.obstacles = this['physics'].add.group({
            allowGravity: false,
            immovable: true
          });
          
          // Create dog images group (not physics objects, just for visuals)
          this.dogImages = this['add'].group();
          
          // Create cat sprite - adjust size for GIF
          // In the create method
          this.cat = this['physics'].add.sprite(this.gameWidth / 2, this.gameHeight / 2, 'cat-normal');
          this.cat.setCollideWorldBounds(true);
          
          // Set cat to die when touching world bounds
          this.cat.body.onWorldBounds = true;
          this['physics'].world.on('worldbounds', this.hitWorldBounds, this);
          
          // Scale the cat to appropriate size (adjust based on your GIF size)
          this.cat.setScale(0.15);
          
          // Adjust the hitbox of the cat to be smaller than the image
          this.cat.body.setSize(this.cat.width * 0.6, this.cat.height * 0.6);
          this.cat.body.setOffset(this.cat.width * 0.2, this.cat.height * 0.2);
          
          // Add score text
          this.scoreText = this['add'].text(16, 16, 'Score: 0', { 
            fontSize: '24px',  // Reduced from 32px
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3  // Reduced from 4
          });
          
          // Create obstacle timer
          this['time'].addEvent({
            delay: 2500, // Increased delay for bigger sprites
            callback: this.addObstacleWithDog,
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
          
          this.restartButton = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'restart-btn')
          .setInteractive()
          .on('pointerdown', () => {
            this['scene'].restart();
            this.gameOver = false;
            this.score = 0;
          })
          .setVisible(false)
          .setScale(0.3);
          
          console.log('Game scene created');
          
          // Handle resize events
          this.handleResize();
          window.addEventListener('resize', () => this.handleResize());
        }
        
        handleResize() {
          // Get window dimensions
          const width = window.innerWidth;
          const height = window.innerHeight;
          
          // Calculate the scale factor
          const scaleX = width / this.gameWidth;
          const scaleY = height / this.gameHeight;
          const scale = Math.min(scaleX, scaleY);
          
          // Apply the scale to the game
          if (this['game'].scale) {
            this['game'].scale.setGameSize(this.gameWidth * scale, this.gameHeight * scale);
            this['game'].scale.setZoom(scale);
          }
        }
        
        hitWorldBounds() {
          // End game when cat hits world bounds
          if (!this.gameOver) {
            this.gameOver = true;
            this.handleGameOver();
          }
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
              
              // Find associated dog and change its emotion
              const dogIndex = Array.from(this.passedObstacles).indexOf(obstacle);
              const dogs = this.dogImages.getChildren();
              if (dogIndex !== -1 && dogs[dogIndex]) {
                dogs[dogIndex].setTexture('dog-crying');
                this.dogCryingSound.play();
              }
              
              // Make cat happy temporarily
              this.cat.setTexture('cat-happy');
              this.catHappySound.play();
              
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
          this.catFlapSound.play();
        }
        
        addObstacleWithDog() {
          if (this.gameOver) return;
          
          const availableHeight = this.gameHeight;
          const obstacleWidth = 60;
          const gapSize = 220;  // Larger gap for bigger sprites
          
          // Calculate random gap position
          const gapStart = Math.floor(Math.random() * (availableHeight - gapSize - 100)) + 50;
          const gapEnd = gapStart + gapSize;
          
          // Create top rectangle obstacle with visible graphics
          const topObstacle = this['add'].rectangle(
            800, 
            gapStart / 2, 
            obstacleWidth, 
            gapStart, 
            0x00000, 
            0.7
          );
          this.obstacles.add(topObstacle);
          this['physics'].add.existing(topObstacle, true);
          topObstacle.body.setVelocityX(-200);
          topObstacle.scored = false;
          
          // Create bottom rectangle obstacle with visible graphics
          const bottomObstacle = this['add'].rectangle(
            800, 
            gapEnd + (availableHeight - gapEnd) / 2, 
            obstacleWidth, 
            availableHeight - gapEnd, 
            0x00000   , 
            0.7  
          );
          this.obstacles.add(bottomObstacle);
          this['physics'].add.existing(bottomObstacle, true);
          bottomObstacle.body.setVelocityX(-200);
          bottomObstacle.scored = false;
          
          // Add dog at the end of top obstacle (waiting dog)
          const topDog = this['add'].sprite(800, gapStart - 40, 'dog-waiting');
          topDog.setScale(0.12); // Adjust scale based on your GIF size
          topDog.setOrigin(0.5, 1);
          this.dogImages.add(topDog);
          
          const bottomDog = this['add'].sprite(800, gapEnd + 40, 'dog-waiting');
          bottomDog.setScale(0.12); // Adjust scale based on your GIF size
          bottomDog.setOrigin(0.5, 0);
          this.dogImages.add(bottomDog);
          
          // Play dog waiting sound
          this.dogWaitingSound.play();
          
          // Add tweens to move the dogs
          this['tweens'].add({
            targets: [topDog, bottomDog],
            x: -100,
            duration: 5000,
            ease: 'Linear'
          });
          
          // Add tweens to move the obstacles
          this['tweens'].add({
            targets: [topObstacle, bottomObstacle],
            x: -100,
            duration: 5000,
            ease: 'Linear'
          });
        }
        
        hitObstacle() {
          if (!this.cat || this.gameOver) return;
          
          this.handleGameOver();
        }
        
        handleGameOver() {
          this['physics'].pause();
          this.gameOver = true;
          
          // Stop all tweens
          this['tweens'].killAll();
          
          // Change cat to sad
          this.cat.setTexture('cat-sad');
          this.catSadSound.play();
          
          // Play game over sound
          this.gameOverSound.play();
          
          // Change any visible dogs to happy
          this.dogImages.getChildren().forEach((dog: any) => {
            dog.setTexture('dog-happy');
          });
          
          // Play dog happy sound
          this.dogHappySound.play();
          
          // Add game over text
          this['add'].text(this.gameWidth / 2, this.gameHeight / 3, 'Game Over', {  // Position at top third
            fontSize: '40px',  // Reduced from 64px
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4  // Reduced from 6
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
      
      // Configure the game with the scene
      const config = {
        type: this.Phaser.AUTO,
        width: 360,  // Standard mobile width
        height: 640, // Gives us approximately 16:9 ratio
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 300, x: 0 },
            debug: false
          }
        },
        scale: {
          mode: this.Phaser.Scale.FIT ,  // Change from FIT to RESIZE
          autoCenter: this.Phaser.Scale.CENTER_BOTH,
          width: 360,
          height: 640,
          parent: 'game-container'
        },
        scene: [FlappyCatScene]
      };
      
      console.log('Creating game with config:', config);
      
      // Create new game instance
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
      
      // Remove any event listeners
      window.removeEventListener('resize', () => {});
    }
  }
}