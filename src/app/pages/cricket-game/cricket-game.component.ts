import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-cricket-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cricket-game.component.html',
  styleUrl: './cricket-game.component.scss'
})
export class CricketGameComponent implements OnInit, OnDestroy {
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
      const self = this; // Store reference to this for use inside the classes
      
      // Main Menu Scene
      class MainMenuScene extends self.Phaser.Scene {
        constructor() {
          super({ key: 'MainMenuScene' });
        }
        
        preload() {
          // Create loading text
          this['add'].text(
            this['game'].config.width / 2, 
            this['game'].config.height / 2, 
            'Loading menu...', 
            { 
              fontSize: '24px', 
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4
            }
          ).setOrigin(0.5);
          
          // Load menu assets
          this['load'].image('menu-bg', './assets/images/cricket-pitch.png');
          this['load'].image('play-btn', './assets/images/restart-button.png');
          this['load'].image('title', './assets/images/cricket-title.png');
        }
        
        create() {
          const gameWidth = this['game'].config.width;
          const gameHeight = this['game'].config.height;
          
          // Add background
          const background = this['add'].image(gameWidth / 2, gameHeight / 2, 'menu-bg');
          background.setDisplaySize(gameWidth, gameHeight);
          
          // Add title text
          this['add'].text(gameWidth / 2, gameHeight * 0.3, 'Mini Cup Cricket', { 
            fontSize: '36px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 6
          }).setOrigin(0.5);
          
          this['add'].text(gameWidth / 2, gameHeight * 0.4, 'WPL 2025 Edition', { 
            fontSize: '24px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4
          }).setOrigin(0.5);
          
          // Add play button
          const playButton = this['add'].image(gameWidth / 2, gameHeight * 0.6, 'play-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this['scene'].start('CricketGameScene');
            })
            .setScale(0.3);
          
          // Animate play button
          this['tweens'].add({
            targets: playButton,
            scale: { from: 0.3, to: 0.35 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Add instructions text
          this['add'].text(gameWidth / 2, gameHeight * 0.75, 'Tap to swing the bat!', { 
            fontSize: '20px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
          }).setOrigin(0.5);
        }
      }
      
      // Main Cricket Game Scene
      class CricketGameScene extends self.Phaser.Scene {
        // Game objects
        batter: any;
        bowler: any;
        ball: any;
        pitch: any;
        loadingText: any;
        hitParticles: any;
        hitEmitter: any;
        
        // Game state
        score: number = 0;
        misses: number = 0;
        gameOver: boolean = false;
        ballInMotion: boolean = false;
        
        // UI elements
        scoreText: any;
        missesText: any;
        feedbackText: any;
        restartButton: any;
        muteButton: any;
        backButton: any;
        
        // Game settings
        gameWidth: number = 360;
        gameHeight: number = 640;
        isMuted: boolean = false;
        
        // Audio
        hitSound: any;
        missSound: any;
        cheerSound: any;
        
        // Timers
        ballReleaseTimer: any;
        
        constructor() {
          super({ key: 'CricketGameScene' });
        }
        
        preload() {
          console.log('Preloading cricket game assets');
          
          // Create loading text
          this.loadingText = this['add'].text(
            this['game'].config.width / 2, 
            this['game'].config.height / 2, 
            'Loading cricket game...', 
            { 
              fontSize: '24px', 
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4
            }
          ).setOrigin(0.5);
          
          // Add loading progress bar
          const progressBar = this['add'].graphics();
          const progressBox = this['add'].graphics();
          progressBox.fillStyle(0x222222, 0.8);
          progressBox.fillRect(this['game'].config.width / 2 - 160, 270, 320, 50);
          
          // Add loading progress event
          this['load'].on('progress', function (value: number) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(
              self.game.config.width / 2 - 150, 
              280, 
              300 * value, 
              30
            );
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
          
          // Load cricket game assets
          this['load'].image('background', './assets/images/ground.png');
          this['load'].image('pitch', './assets/images/cricket-pitch.png');
          this['load'].image('ball', './assets/images/ball.png');
          this['load'].image('batter-idle', './assets/images/batter-idle.png');
          this['load'].image('batter-swing', './assets/images/batter-swing.png');
          this['load'].image('bowler-idle', './assets/images/bowler-idle.png');
          this['load'].image('bowler-throw', './assets/images/bowler-throw.png');
          this['load'].image('restart-btn', './assets/images/restart-button.png');
          this['load'].image('back-btn', './assets/images/back.png');
          this['load'].image('mute-btn', './assets/images/mute.png');
          this['load'].image('unmute-btn', './assets/images/unmute.png');
          
          // Load particle effects
          this['load'].image('particle', './assets/images/particle.png');
          
          // Load audio files
          this['load'].audio('hit-sound', './assets/audio/test.mp3');
          this['load'].audio('miss-sound', './assets/audio/test.mp3');
          this['load'].audio('cheer-sound', './assets/audio/test.mp3');
          
          console.log('Cricket assets preload complete');
        }
        
        create() {
          console.log('Creating cricket game scene');
          
          // Get game dimensions for responsive sizing
          this.gameWidth = this['game'].config.width;
          this.gameHeight = this['game'].config.height;
          
          // Create audio objects
          this.hitSound = this['sound'].add('hit-sound');
          this.missSound = this['sound'].add('miss-sound');
          this.cheerSound = this['sound'].add('cheer-sound');
          
          // Set up background
          const background = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'background');
          background.setDisplaySize(this.gameWidth, this.gameHeight);
          background.setDepth(0);
          
          // Set up cricket pitch
          this.pitch = this['add'].image(this.gameWidth / 2, this.gameHeight / 2, 'pitch');
          this.pitch.setDisplaySize(this.gameWidth * 0.8, this.gameHeight * 0.6);
          this.pitch.setDepth(1);
          
          // Set up bowler (at top of screen)
          this.bowler = this['physics'].add.sprite(this.gameWidth / 2, this.gameHeight * 0.2, 'bowler-idle');
          this.bowler.setScale(0.15);
          this.bowler.setDepth(10);
          
          // Set up batter (at bottom of screen)
          this.batter = this['physics'].add.sprite(this.gameWidth / 2, this.gameHeight * 0.8, 'batter-idle');
          this.batter.setScale(0.15);
          this.batter.setDepth(10);
          
          // Create ball (initially hidden)
          this.ball = this['physics'].add.sprite(this.gameWidth / 2, this.gameHeight * 0.2, 'ball');
          this.ball.setScale(0.08);
          this.ball.setVisible(false);
          this.ball.setDepth(15);
          
          // Add collision detection between batter and ball
          this['physics'].add.overlap(
            this.batter, 
            this.ball, 
            this.handleBatBallCollision, 
            null, 
            this
          );
          
          // Set up particle emitter for hit effect - Fixed method based on current Phaser version
          try {
            // Try the newer Phaser 3 particle syntax first
            this.hitParticles = this['add'].particles({
              key: 'particle',
              config: {
                speed: { min: 100, max: 200 },
                scale: { start: 0.1, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                gravityY: 0,
                emitting: false
              }
            });
            this.hitEmitter = this.hitParticles;
          } catch (error) {
            // fallback to older syntax if newer one fails
            try {
              console.log('Falling back to older particle system syntax');
              this.hitParticles = this['add'].particles('particle');
              this.hitEmitter = this.hitParticles.createEmitter({
                speed: { min: 100, max: 200 },
                scale: { start: 0.1, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                on: false
              });
            } catch (particleError) {
              // If particles still fail, create a dummy implementation that won't break the game
              console.error('Particle system not working, creating dummy implementation', particleError);
              this.hitEmitter = {
                setPosition: () => {},
                explode: () => {}
              };
            }
          }
          
          // Add score and misses text
          this.scoreText = this['add'].text(16, 16, 'Runs: 0', { 
            fontSize: '24px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
          }).setDepth(50);
          
          this.missesText = this['add'].text(this.gameWidth - 16, 16, 'Misses: 0', { 
            fontSize: '24px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 3
          }).setOrigin(1, 0).setDepth(50);
          
          // Add feedback text (hidden initially)
          this.feedbackText = this['add'].text(this.gameWidth / 2, this.gameHeight / 2, '', { 
            fontSize: '48px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 5
          }).setOrigin(0.5).setDepth(100).setVisible(false);
          
          // Add back button
          this.backButton = this['add'].image(30, 30, 'back-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this['scene'].start('MainMenuScene');
            })
            .setScale(0.1)
            .setDepth(100);
          
          // Add mute button
          this.muteButton = this['add'].image(this.gameWidth - 30, 30, 'mute-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this.toggleMute();
            })
            .setScale(0.1)
            .setDepth(100);
          
          // Setup input - both mouse/touch for swing
          this['input'].on('pointerdown', this.swingBat, this);
          
          // Add keyboard controls for swing
          this['input'].keyboard.on('keydown-SPACE', this.swingBat, this);
          
          // Start the game loop
          this.startNextBall();
          
          // Handle resize events
          this.handleResize();
          window.addEventListener('resize', () => this.handleResize());
          
          console.log('Cricket game scene created');
        }
        
        update() {
          if (this.gameOver) return;
          
          // Check if ball is in motion
          if (this.ballInMotion && this.ball && this.ball.visible) {
            // Check for ball going off screen
            if (this.ball.y > this.gameHeight + 50 || 
                this.ball.y < -50 || 
                this.ball.x < -50 || 
                this.ball.x > this.gameWidth + 50) {
              // Ball flew off screen after being hit
              if (this.ball.getData('hit')) {
                this.ball.setVisible(false);
                this.ballInMotion = false;
                this.startNextBall();
              }
              // Ball missed and went past the batter
              else if (this.ball.y > this.batter.y + 20) {
                this.handleMiss();
              }
            }
            
            // Add trail effect to moving ball
            if (this.ball.body.velocity.length() > 0 && Math.random() > 0.8) {
              try {
                this.hitParticles.emitParticleAt(this.ball.x, this.ball.y, 1);
              } catch (error) {
                // Ignore particle errors
              }
            }
          }
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
        
        startNextBall() {
          if (this.gameOver) return;
          
          // Reset batter and bowler to idle position
          this.batter.setTexture('batter-idle');
          this.bowler.setTexture('bowler-idle');
          
          // Hide the ball initially
          this.ball.setVisible(false);
          this.ball.setPosition(this.bowler.x, this.bowler.y);
          
          // Reset ball motion flag
          this.ballInMotion = false;
          
          // Add a small delay before bowling the next ball
          this.ballReleaseTimer = this['time'].delayedCall(1000, () => {
            this.throwBall();
          }, [], this);
        }
        
        throwBall() {
          // Set bowler to throwing animation
          this.bowler.setTexture('bowler-throw');
          
          // Show the ball
          this.ball.setVisible(true);
          this.ball.setPosition(this.bowler.x, this.bowler.y + 20);
          
          // Calculate random velocity for the ball with more variation
          const speed = Phaser.Math.Between(280, 420); // More variation in speed
          const angle = Phaser.Math.Between(-8, 8); // More angle variation
          
          // Set velocity for the ball to move toward batter
          const velocityX = Math.sin(angle * Math.PI / 180) * speed;
          const velocityY = speed;
          
          this.ball.setVelocity(velocityX, velocityY);
          this.ball.setData('hit', false); // Mark ball as not hit yet
          
          // Set flag that ball is in motion
          this.ballInMotion = true;
          
          // Reset bowler to idle after throw animation
          this['time'].delayedCall(300, () => {
            this.bowler.setTexture('bowler-idle');
          }, [], this);
        }
        
        swingBat() {
          // Don't allow swing if game is over or ball is not in motion
          if (this.gameOver || !this.ballInMotion) return;
          
          // Change batter texture to swing animation
          this.batter.setTexture('batter-swing');
          
          // Set batter as "swinging" for a short duration
          this.batter.setData('swinging', true);
          
          // Reset batter to idle pose and swinging state after animation
          this['time'].delayedCall(300, () => {
            this.batter.setTexture('batter-idle');
            this.batter.setData('swinging', false);
          }, [], this);
          
          // Create a hit zone in front of the batter for more accurate hit detection
          const hitZoneStart = this.batter.y - 70;
          const hitZoneEnd = this.batter.y + 10;
          
          // Check if ball is in the hit zone (near the batter)
          if (this.ball.visible && 
              this.ball.y >= hitZoneStart && 
              this.ball.y <= hitZoneEnd &&
              Math.abs(this.ball.x - this.batter.x) < 50) {
            this.handleHit();
          } else if (this.ball.visible) {
            // Swing too early or too late or too far to the side
            this.handleMiss();
          }
        }
        
        // New method for physics-based collision detection
        handleBatBallCollision(batter: Phaser.Physics.Arcade.Sprite, ball: Phaser.Physics.Arcade.Sprite) {
          // Only process collision if ball is in motion and hasn't been hit yet
          if (!this.ballInMotion || this.gameOver || ball.getData('hit')) {
            return;
          }
          
          // Check if batter is currently swinging
          if (batter.getData('swinging')) {
            this.handleHit();
            ball.setData('hit', true); // Mark ball as hit to prevent multiple hits
          }
        }
        
        handleHit() {
          // Stop the ball's current movement
          this.ball.body.setVelocity(0, 0);
          
          // Calculate more realistic hit angles based on timing
          // More variance in angles for more interesting gameplay
          const hitAngle = Phaser.Math.Between(-75, 75);
          const hitSpeed = Phaser.Math.Between(350, 650); // More variance in speed
          
          // Calculate power based on how close to perfect timing
          const perfectY = this.batter.y - 30;
          const distFromPerfect = Math.abs(this.ball.y - perfectY);
          const powerFactor = 1 - Math.min(distFromPerfect / 50, 0.5);
          
          // Apply velocity with the power factor
          const adjustedSpeed = hitSpeed * powerFactor;
          const velocityX = Math.sin(hitAngle * Math.PI / 180) * adjustedSpeed;
          const velocityY = -Math.cos(hitAngle * Math.PI / 180) * adjustedSpeed;
          
          this.ball.setVelocity(velocityX, velocityY);
          
          // Add some rotation to the ball when hit
          this.ball.setAngularVelocity(Phaser.Math.Between(-300, 300));
          
          // Play hit sound and cheer
          this.hitSound.play();
          this.cheerSound.play();
          
          // Show particle effect at ball position - Updated to handle both API versions
          if (this.hitParticles && this.hitEmitter) {
            try {
              if (typeof this.hitEmitter.setPosition === 'function') {
                // Old API
                this.hitEmitter.setPosition(this.ball.x, this.ball.y);
                this.hitEmitter.explode(20);
              } else {
                // New API
                this.hitParticles.emitParticleAt(this.ball.x, this.ball.y, 20);
              }
            } catch (error) {
              console.error('Error with particle emission:', error);
            }
          }
          
          // Give more score for better hits
          const scoreIncrease = Math.max(1, Math.floor(powerFactor * 3));
          this.score += scoreIncrease;
          this.scoreText.setText('Runs: ' + this.score);
          
          // Show different feedback text based on quality of hit
          if (powerFactor > 0.8) {
            this.showFeedback('SIX!', '#ffff00');
          } else if (powerFactor > 0.5) {
            this.showFeedback('FOUR!', '#00ff00');
          } else {
            this.showFeedback('Run!', '#00ff00');
          }
          
          // Set a timer to remove the ball after it flies off
          this['time'].delayedCall(2000, () => {
            this.ball.setVisible(false);
            this.startNextBall();
          }, [], this);
        }
        
        handleMiss() {
          // Play miss sound
          this.missSound.play();
          
          // Stop the ball movement
          this.ball.setVisible(false);
          this.ballInMotion = false;
          
          // Increment misses
          this.misses++;
          this.missesText.setText('Misses: ' + this.misses);
          
          // Show feedback text
          this.showFeedback('Miss!', '#ff0000');
          
          // Check if game over
          if (this.misses >= 3) {
            this.gameOver = true;
            this.showGameOver();
          } else {
            // Start next ball after a delay
            this['time'].delayedCall(1000, () => {
              this.startNextBall();
            }, [], this);
          }
        }
        
        showFeedback(text: string, color: string) {
          this.feedbackText.setText(text);
          this.feedbackText.setColor(color);
          this.feedbackText.setVisible(true);
          
          // Animate the feedback text
          this['tweens'].add({
            targets: this.feedbackText,
            scale: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
              this.feedbackText.setVisible(false);
              this.feedbackText.setScale(1);
              this.feedbackText.setAlpha(1);
            }
          });
        }
        
        showGameOver() {
          // Create game over text
          const gameOverText = this['add'].text(this.gameWidth / 2, this.gameHeight * 0.3, 'GAME OVER', { 
            fontSize: '48px',
            color: '#ff0000',
            stroke: '#000',
            strokeThickness: 6
          }).setOrigin(0.5).setDepth(100);
          
          // Show final score
          const finalScoreText = this['add'].text(this.gameWidth / 2, this.gameHeight * 0.4, 'Total Runs: ' + this.score, { 
            fontSize: '32px',
            color: '#fff',
            stroke: '#000',
            strokeThickness: 4
          }).setOrigin(0.5).setDepth(100);
          
          // Add restart button
          this.restartButton = this['add'].image(this.gameWidth / 2, this.gameHeight * 0.6, 'restart-btn')
            .setInteractive()
            .on('pointerdown', () => {
              this['scene'].restart();
            })
            .setScale(0.3)
            .setDepth(100);
          
          // Animate game over text
          this['tweens'].add({
            targets: [gameOverText, finalScoreText],
            scale: { from: 0.5, to: 1 },
            duration: 1000,
            ease: 'Bounce'
          });
          
          // Animate restart button
          this['tweens'].add({
            targets: this.restartButton,
            scale: { from: 0, to: 0.3 },
            duration: 1000,
            delay: 500,
            ease: 'Back.out'
          });
        }
      }
      
      // Configure the game
      const config = {
        type: this.Phaser.AUTO,
        width: 360,
        height: 640,
        parent: 'game-container',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { y: 0 },
            debug: false
          }
        },
        scale: {
          mode: this.Phaser.Scale.FIT,
          autoCenter: this.Phaser.Scale.CENTER_BOTH,
          width: 360,
          height: 640
        },
        scene: [MainMenuScene, CricketGameScene]
      };
      
      console.log('Creating cricket game with config:', config);
      
      // Create new game instance
      this.game = new this.Phaser.Game(config);
      console.log('Cricket game created successfully');
      
    } catch (error) {
      console.error('Error creating cricket game:', error);
    }
  }
  
  ngOnDestroy() {
    console.log('Destroying cricket game');
    if (this.game) {
      this.game.destroy(true);
      
      // Remove any event listeners
      window.removeEventListener('resize', () => {});
    }
  }
}