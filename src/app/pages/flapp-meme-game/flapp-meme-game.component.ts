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
        catWings: any[] = []; // Left and right wings
        catHalo: any; // Angel ring/halo
        obstacles: any;
        dogImages: any;
        restartButton: any;
        backButton: any;
        muteButton: any;
        gameOver: boolean;
        score: number;
        scoreText: any;
        passedObstacles: Set<any>;
        catEmotionTimer: any;
        loadingText: any;
        gameWidth: number = 360;
        gameHeight: number = 640;
        isMuted: boolean = false;
        
        // Background elements for motion illusion
        clouds: any[] = [];
        floor: any;
        
        // Game over elements
        gameOverGif: any;
        gameOverShakeTween: any;
        
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
          
          // Load wing and halo assets
          this['load'].image('wing-left', './assets/images/wing-left.png');
          this['load'].image('wing-right', './assets/images/wing-right.png');
          this['load'].image('halo', './assets/images/halo.png');
          
          // Load dog meme sprites
          this['load'].image('dog-waiting', './assets/images/dog-waiting.png');
          this['load'].image('dog-crying', './assets/images/dog-sad.gif');
          this['load'].image('dog-happy', './assets/images/dog-happy.gif');
          this['load'].image('restart-btn', './assets/images/restart-button.png');
          
          // Load back and mute button assets
          this['load'].image('back-btn', './assets/images/back.png'); // Add this asset
          this['load'].image('mute-btn', './assets/images/mute.png'); // Add this asset
          this['load'].image('unmute-btn', './assets/images/unmute.png'); // Add this asset
          
          // Game assets
          this['load'].image('background', './assets/images/background.jpg');
          this['load'].image('cloud', './assets/images/cloud.png');
          this['load'].image('floor', './assets/images/ground.png');
          this['load'].image('pipe', './assets/images/pipe.png'); // Load pipe image
          
          // Load game over GIF instead of video
          this['load'].image('game-over-gif', './assets/images/dog-happy.gif');
          
          // Load audio files
          this['load'].audio('cat-flap', './assets/audio/test.mp3');
          this['load'].audio('cat-happy', './assets/audio/test.mp3');
          this['load'].audio('cat-sad', './assets/audio/test.mp3');
          this['load'].audio('dog-waiting', './assets/audio/test.mp3');
          this['load'].audio('dog-crying', './assets/audio/test.mp3');
          this['load'].audio('dog-happy', './assets/audio/test.mp3');
          this['load'].audio('game-over', './assets/audio/game-over-audio.mp3');
          
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
          
          // Set up layers with proper depth
          // Background (lowest depth)
          const background = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'background');
          background.setDisplaySize(this.gameWidth, this.gameHeight);
          background.setScale(
            Math.max(this.gameWidth / background.width, this.gameHeight / background.height)
          );
          background.setDepth(0);
          
          // Add clouds with lower depth
          this.createClouds();
          
          // Create obstacles group - higher depth than clouds
          this.obstacles = this['physics'].add.group({
            allowGravity: false,
            immovable: true
          });
          
          // Create dog images group - higher depth than obstacles
          this.dogImages = this['add'].group();
          
          // Add moving floor - above clouds but below obstacles and dogs
          this.createMovingFloor();
          
          // Create cat sprite - highest depth for gameplay elements
          this.cat = this['physics'].add.sprite(this.gameWidth / 2, this.gameHeight / 2, 'cat-normal');
          this.cat.setCollideWorldBounds(true);
          this.cat.setDepth(30);
          
          // Set cat to die when touching world bounds
          this.cat.body.onWorldBounds = true;
          this['physics'].world.on('worldbounds', this.hitWorldBounds, this);
          
          // Scale the cat to appropriate size
          this.cat.setScale(0.15);
          
          // Adjust the hitbox of the cat to be smaller than the image
          this.cat.body.setSize(this.cat.width * 0.6, this.cat.height * 0.6);
          this.cat.body.setOffset(this.cat.width * 0.2, this.cat.height * 0.2);
          
          // Add wings and halo to the cat
          // this.addCatWingsAndHalo();
          
          // Add score text - highest depth
          this.scoreText = this['add'].text(this.gameWidth/2 - 40, 16, 'Score: 0', { 
            fontSize: '24px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
          }).setDepth(50);
          
          // Add back button at top right
          this.backButton = this['add'].image(25, 30, 'back-btn')
            .setInteractive()
            .on('pointerdown', () => {
              // Redirect to ../# when back button is clicked
              window.location.href = '../#';
            })
            .setScale(0.1)  // Adjust scale as needed
            .setDepth(100); // Ensure button is above everything
          
          // Add mute/unmute button
          this.muteButton = this['add'].image(this.gameWidth, 30, 'mute-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this.toggleMute();
            })
            .setScale(0.1)  // Adjust scale as needed
            .setDepth(100); // Ensure button is above everything
          
          // Add initial obstacle immediately
          this.addObstacleWithDog();
          
          // Create obstacle timer for subsequent obstacles
          this['time'].addEvent({
            delay: 2500,
            callback: this.addObstacleWithDog,
            callbackScope: this,
            loop: true,
            startAt: 500 // Start sooner to add obstacles faster
          });
          
          // Setup input - both mouse/touch and keyboard
          this['input'].on('pointerdown', this.flapCat, this);
          
          // Add keyboard controls
          this['input'].keyboard.on('keydown-SPACE', this.flapCat, this);
          this['input'].keyboard.on('keydown-UP', this.flapCat, this);
          this['input'].keyboard.on('keydown-W', this.flapCat, this);
          
          // Setup collision detection
          this['physics'].add.collider(this.cat, this.obstacles, this.hitObstacle, null, this);
          
          // Create game over GIF (hidden initially)
          this.gameOverGif = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'game-over-gif');
          this.gameOverGif.setVisible(false);
          this.gameOverGif.setScale(0.1); // Start small for growth animation
          this.gameOverGif.setDepth(90); // Very high depth to appear above everything
          
          this.restartButton = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'restart-btn')
          .setInteractive()
          .on('pointerdown', () => {
            this['scene'].restart();
            this.gameOverSound.stop();
            this.gameOver = false;
            this.score = 0;
          })
          .setVisible(false)
          .setScale(0.3)
          .setDepth(100); // Ensure restart button is above everything
          
          console.log('Game scene created');
          
          // Handle resize events
          this.handleResize();
          window.addEventListener('resize', () => this.handleResize());
        }
        
        toggleMute() {
          this.isMuted = !this.isMuted;
          
          // Update the button texture
          if (this.isMuted) {
            this.muteButton.setTexture('unmute-btn');
            this['sound'].mute = true;
          } else {
            this.muteButton.setTexture('mute-btn');
            this['sound'].mute = false;
          }
        }
        
        createClouds() {
          // Create multiple clouds at different depths for parallax effect
          for (let i = 0; i < 5; i++) {
            const y = Math.random() * (this.gameHeight * 0.5);
            const x = Math.random() * this.gameWidth;
            const scale = 0.3 + Math.random() * 0.4; // Random scale between 0.3 and 0.7
            const speed = 0.5 + Math.random() * 1.5; // Random speed
            
            const cloud = this['add'].image(x, y, 'cloud');
            cloud.setScale(scale);
            cloud.speed = speed;
            cloud.setAlpha(0.7); // Slightly transparent
            cloud.setDepth(5); // Set lower depth for clouds so they appear behind other elements
            
            this.clouds.push(cloud);
          }
        }
        
        createMovingFloor() {
          // Create a tiled floor that moves to create scrolling effect
          this.floor = this['add'].tileSprite(
            this.gameWidth / 2,
            this.gameHeight - 30,
            this.gameWidth * 2,
            60,
            'floor'
          );
          this.floor.setDepth(10); // Set depth to be above clouds but below obstacles
        }
        
        // addCatWingsAndHalo() {
        //   // Add left wing
        //   const leftWing = this['add'].image(0, 0, 'wing-left');
        //   leftWing.setScale(0.1);
        //   leftWing.setOrigin(1, 0.5);
        //   this.catWings.push(leftWing);
          
        //   // Add right wing
        //   const rightWing = this['add'].image(0, 0, 'wing-right');
        //   rightWing.setScale(0.1);
        //   rightWing.setOrigin(0, 0.5);
        //   this.catWings.push(rightWing);
          
        //   // Add halo
        //   this.catHalo = this['add'].image(0, 0, 'halo');
        //   this.catHalo.setScale(0.1);
        //   this.catHalo.setOrigin(0.5, 1);
          
        //   // Create flapping animation for wings
        //   this.createWingAnimation();
        // }
        
        // createWingAnimation() {
        //   // Create animation for wings flapping
        //   this['tweens'].add({
        //     targets: this.catWings,
        //     scaleX: { from: 0.1, to: 0.12 },
        //     scaleY: { from: 0.1, to: 0.12 },
        //     duration: 200,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: 'Sine.easeInOut'
        //   });
          
        //   // Create subtle animation for halo
        //   this['tweens'].add({
        //     targets: this.catHalo,
        //     y: '-=3',
        //     duration: 1000,
        //     yoyo: true,
        //     repeat: -1,
        //     ease: 'Sine.easeInOut'
        //   });
        // }
        
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
          
          // Update wings and halo positions to follow cat
          // this.updateWingsAndHalo();
          
          // Update clouds position for parallax effect
          this.updateClouds();
          
          // Update floor position
          this.updateFloor();
          
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
        
        // updateWingsAndHalo() {
        //   // Position wings and halo relative to cat
        //   if (this.cat && this.catWings.length === 2 && this.catHalo) {
        //     // Left wing position
        //     this.catWings[0].x = this.cat.x - (this.cat.width * 0.15 * 0.2);
        //     this.catWings[0].y = this.cat.y;
        //     this.catWings[0].angle = this.cat.angle;
            
        //     // Right wing position
        //     this.catWings[1].x = this.cat.x + (this.cat.width * 0.15 * 0.2);
        //     this.catWings[1].y = this.cat.y;
        //     this.catWings[1].angle = this.cat.angle;
            
        //     // Halo position
        //     this.catHalo.x = this.cat.x;
        //     this.catHalo.y = this.cat.y - (this.cat.height * 0.15 * 0.4);
        //     this.catHalo.angle = this.cat.angle * 0.3; // Subtle angle change
        //   }
        // }
        
        updateClouds() {
          // Move clouds for parallax effect
          this.clouds.forEach(cloud => {
            cloud.x -= cloud.speed;
            
            // Reset cloud position when it goes off screen
            if (cloud.x < -cloud.width) {
              cloud.x = this.gameWidth + cloud.width;
              cloud.y = Math.random() * (this.gameHeight * 0.5);
            }
          });
        }
        
        updateFloor() {
          // Update floor tilePosition to create scrolling effect
          this.floor.tilePositionX += 2;
        }
        
        flapCat() {
          if (this.gameOver || !this.cat) return;
          
          // Apply upward velocity to make the cat "flap"
          this.cat.body.velocity.y = -240;
          
          // Play flap sound
          this.catFlapSound.play();
          
          // Additional wing flap animation
          // this.catWings.forEach(wing => {
          //   this['tweens'].add({
          //     targets: wing,
          //     scaleX: { from: 0.12, to: 0.15 },
          //     scaleY: { from: 0.12, to: 0.15 },
          //     duration: 100,
          //     yoyo: true,
          //     ease: 'Sine.easeInOut'
          //   });
          // });
        }
        
        addObstacleWithDog() {
          if (this.gameOver) return;
          
          const availableHeight = this.gameHeight;
          const obstacleWidth = 60;
          const gapSize = 220;  // Larger gap for bigger sprites
          
          // Calculate random gap position
          const gapStart = Math.floor(Math.random() * (availableHeight - gapSize - 100)) + 50;
          const gapEnd = gapStart + gapSize;
          
          // Create top pipe obstacle with visible pipe image
          const topObstacle = this['add'].image(
            800, 
            gapStart / 2, 
            'pipe'
          );
          topObstacle.setDisplaySize(obstacleWidth, gapStart);
          topObstacle.setFlipY(true); // Flip the top pipe
          topObstacle.setDepth(15); // Set depth to be above floor but below dogs
          this.obstacles.add(topObstacle);
          this['physics'].add.existing(topObstacle, true);
          topObstacle.body.setVelocityX(-200);
          topObstacle.scored = false;
          
          // Create bottom pipe obstacle with visible pipe image
          const bottomObstacle = this['add'].image(
            800, 
            gapEnd + (availableHeight - gapEnd) / 2, 
            'pipe'
          );
          bottomObstacle.setDisplaySize(obstacleWidth, availableHeight - gapEnd);
          bottomObstacle.setDepth(15); // Set depth to be above floor but below dogs
          this.obstacles.add(bottomObstacle);
          this['physics'].add.existing(bottomObstacle, true);
          bottomObstacle.body.setVelocityX(-200);
          bottomObstacle.scored = false;
          
          // Add dog at the end of top obstacle (waiting dog)
          const topDog = this['add'].sprite(800, gapStart - 40, 'dog-waiting');
          topDog.setScale(0.12); // Adjust scale based on your GIF size
          topDog.setOrigin(0.5, 1);
          topDog.setDepth(20); // Set depth to be above pipes
          this.dogImages.add(topDog);
          
          const bottomDog = this['add'].sprite(800, gapEnd + 40, 'dog-waiting');
          bottomDog.setScale(0.12); // Adjust scale based on your GIF size
          bottomDog.setOrigin(0.5, 0);
          bottomDog.setDepth(20); // Set depth to be above pipes
          this.dogImages.add(bottomDog);
          
          // Play dog waiting sound
          this.dogWaitingSound.play();
          
          // Add tweens to move the dogs
          this['tweens'].add({
            targets: [topDog, bottomDog],
            x: -30,
            duration: 6000,
            ease: 'Linear'
          });
          
          // Add tweens to move the obstacles
          this['tweens'].add({
            targets: [topObstacle, bottomObstacle],
            x: -30,
            duration: 6000,
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
          
          // Find the center position of a visible dog for GIF start position
          let dogX = this.gameWidth / 2;
          let dogY = this.gameHeight / 2;
          
          const visibleDogs = this.dogImages.getChildren();
          if (visibleDogs.length > 0) {
            // Get the first visible dog
            for (const dog of visibleDogs) {
              if (dog.x > 0 && dog.x < this.gameWidth) {
                dogX = dog.x;
                dogY = dog.y;
                dog.setTexture('dog-happy');
                break;
              }
            }
          }
          
          // Change any remaining visible dogs to happy
          this.dogImages.getChildren().forEach((dog: any) => {
            dog.setTexture('dog-happy');
          });
          
          // Play dog happy sound
          this.dogHappySound.play();
          
          // Position and show the game over GIF starting from the dog position
          this.gameOverGif.x = dogX;
          this.gameOverGif.y = dogY;
          this.gameOverGif.setVisible(true);
          
          // Create shaking and growing effect for the GIF
          this.gameOverShakeTween = this['tweens'].add({
            targets: this.gameOverGif,
            scale: { from: 0.1, to: 2.0 },
            x: { from: dogX, to: this.gameWidth / 2 },
            y: { from: dogY, to: this.gameHeight / 2 },
            duration: 1500,
            ease: 'Power2',
            onUpdate: () => {
              // Add random shake effect during scaling
              if (this.gameOverGif.visible) {
                this.gameOverGif.x += (Math.random() - 0.5) * 10 * this.gameOverGif.scale;
                this.gameOverGif.y += (Math.random() - 0.5) * 10 * this.gameOverGif.scale;
              }
            },
            onComplete: () => {
              // Show game over text after GIF is full screen
              this['add'].text(this.gameWidth / 2, this.gameHeight / 4, 'Game Over', {
                fontSize: '40px',
                color: '#fff',
                stroke: '#000',
                strokeThickness: 4
              }).setOrigin(0.5).setDepth(95);
              
              // Show restart button on top of GIF
              this.restartButton.setVisible(true);
              this.restartButton.y = this.gameHeight * 0.75; // Position lower on screen
              
              // Continue subtle shake effect
              this['tweens'].add({
                targets: this.gameOverGif,
                x: { from: this.gameWidth / 2 - 5, to: this.gameWidth / 2 + 5 },
                y: { from: this.gameHeight / 2 - 5, to: this.gameHeight / 2 + 5 },
                duration: 100,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
              });
            }
          });
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
        width: 360,
        height: 640,
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 300, x: 0 },
            debug: false
          }
        },
        scale: {
          mode: this.Phaser.Scale.FIT,
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