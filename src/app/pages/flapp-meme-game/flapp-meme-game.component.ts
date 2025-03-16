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
        
        constructor() {
          super({ key: 'FlappyCatScene' });
          this.gameOver = false;
          this.score = 0;
          this.passedObstacles = new Set();
        }
        
        // Rest of your scene code remains the same
        preload() {
          console.log('Preloading assets');
          
          // Add error handler for asset loading
          this['load'].on('loaderror', (fileObj: any) => {
            console.error('Error loading asset:', fileObj.src);
          });
          
          // Load cat meme sprites with absolute paths
          this['load'].image('cat-normal', './assets/images/cat-normal.gif');
          this['load'].image('cat-happy', './assets/images/cat-happy.gif');
          this['load'].image('cat-sad', './assets/images/cat-sad.gif');
          
          // Load dog meme sprites
          this['load'].image('dog-waiting', './assets/images/dog-waiting.jpg');
          this['load'].image('dog-crying', './assets/images/dog-sad.gif');
          this['load'].image('dog-happy', './assets/images/dog-happy.gif');
          this['load'].image('restart-btn', './assets/images/dog-happy.gif');
          
          // Game assets
          this['load'].image('background', './assets/images/background.jpg');
          
          console.log('Assets preload complete');
        }
        
        // The rest of your scene methods remain unchanged
        // ...
        
        create() {
          console.log('Creating game scene');
          
          // Add background
          this['add'].image(400, 300, 'background');
          
          // Create obstacles group
          this.obstacles = this['physics'].add.group({
            allowGravity: false,
            immovable: true
          });
          
          // Create dog images group (not physics objects, just for visuals)
          this.dogImages = this['add'].group();
          
          // Create cat sprite - adjust size for GIF
          this.cat = this['physics'].add.sprite(150, 300, 'cat-normal');
          this.cat.setCollideWorldBounds(true);
          
          // Scale the cat to appropriate size (adjust based on your GIF size)
          this.cat.setScale(0.15);
          
          // Adjust the hitbox of the cat to be smaller than the image
          this.cat.body.setSize(this.cat.width * 0.6, this.cat.height * 0.6);
          this.cat.body.setOffset(this.cat.width * 0.2, this.cat.height * 0.2);
          
          // Add score text
          this.scoreText = this['add'].text(16, 16, 'Score: 0', { fontSize: '32px', color: '#fff' });
          
          // Create obstacle timer
          this['time'].addEvent({
            delay: 2000, // Increased delay for bigger sprites
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
          
          this.restartButton = this['add'].image(400, 400, 'restart-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this['scene'].restart();
              this.gameOver = false;
              this.score = 0;
            })
            .setVisible(false)
            .setScale(0.5);
          
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
              
              // Find associated dog and change its emotion
              const dogIndex = Array.from(this.passedObstacles).indexOf(obstacle);
              const dogs = this.dogImages.getChildren();
              if (dogIndex !== -1 && dogs[dogIndex]) {
                dogs[dogIndex].setTexture('dog-crying');
              }
              
              // Make cat happy temporarily
              this.cat.setTexture('cat-happy');
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
        }
        
        addObstacleWithDog() {
          if (this.gameOver) return;
          
          const availableHeight = 600;
          const obstacleWidth = 80;
          const gapSize = 200; // Larger gap for bigger sprites
          
          // Calculate random gap position
          const gapStart = Math.floor(Math.random() * (availableHeight - gapSize - 100)) + 50;
          const gapEnd = gapStart + gapSize;
          
          // Create top rectangle obstacle
          const topObstacle = this.obstacles.create(800, gapStart / 2, null);
          topObstacle.body.setSize(obstacleWidth/4, gapStart/4);
          topObstacle.setVelocityX(-200);
          topObstacle.scored = false;
          topObstacle.visible = false; // Use visible instead of alpha
          
          // Create bottom rectangle obstacle
          const bottomObstacle = this.obstacles.create(800, gapEnd + (availableHeight - gapEnd) / 2, null);
          bottomObstacle.body.setSize(obstacleWidth, availableHeight - gapEnd);
          bottomObstacle.setVelocityX(-200);
          bottomObstacle.scored = false;
          bottomObstacle.visible = false; // Use visible instead of alpha
          
          // Add dog at the end of top obstacle (waiting dog)
          const topDog = this['add'].sprite(800 + obstacleWidth/2, gapStart - 40, 'dog-waiting');
          topDog.setScale(0.12); // Adjust scale based on your GIF size
          topDog.setOrigin(0.5, 1);
          this.dogImages.add(topDog);
          
          const bottomDog = this['add'].sprite(800 + obstacleWidth/4, gapEnd + 40, 'dog-waiting');
          bottomDog.setScale(0.12); // Adjust scale based on your GIF size
          bottomDog.setOrigin(0.5, 0);
          this.dogImages.add(bottomDog);
          
          // Add tweens to move the dogs
          this['tweens'].add({
              targets: [topDog, bottomDog],
              x: -100,
              duration: 5000,
              ease: 'Linear'
          });
        }
        
        hitObstacle() {
          if (!this.cat) return;
          
          this['physics'].pause();
          this.gameOver = true;
          
          // Stop all tweens
          this['tweens'].killAll();
          
          // Change cat to sad
          this.cat.setTexture('cat-sad');
          
          // Change any visible dogs to happy
          this.dogImages.getChildren().forEach((dog: any) => {
            dog.setTexture('dog-happy');
          });
          
          // Add game over text
          this['add'].text(400, 300, 'Game Over', { 
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
      
      // Configure the game with the scene
      const config = {
        type: this.Phaser.AUTO,
        width: 800,
        height: 600,
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 300, x: 0 },
            debug: false
          }
        },
        scene: [FlappyCatScene]
      };
      
      console.log('Creating game with config');
      
      // Add additional debug logging
      console.log('Phaser Game constructor:', this.Phaser.Game);
      
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
    }
  }
}
