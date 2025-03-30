import { isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-pet-fetch',
  standalone: true,
  imports: [],
  templateUrl: './pet-fetch.component.html',
  styleUrl: './pet-fetch.component.scss'
})
export class PetFetchComponent  implements OnInit, OnDestroy {
  private Phaser: any = null;
  private game: any = null;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      import('phaser').then(phaserModule => {
        this.Phaser = phaserModule.default || phaserModule;
        this.initGame();
      }).catch(err => {
        console.error('Failed to load Phaser:', err);
      });
    }
  }

  private initGame() {
    // Character Selection Scene
    class CharacterSelectionScene extends this.Phaser.Scene {
      constructor() {
        super({ key: 'CharacterSelectionScene' });
      }

      preload() {
        // Load selection assets
        this['load'].image('cat-head', './assets/images/cat-normal.gif');
        this['load'].image('start-button', './assets/images/restart-button.png');
        this['load'].image('dog', './assets/images/dog-waiting.png');
        // Load cloud images
        this['load'].image('cloud1', './assets/images/cloud.png');
        this['load'].image('cloud2', './assets/images/cloud.png');
        // Load power-up images
        this['load'].image('laser-powerup', './assets/images/laser-powerup.png');
        this['load'].image('eat-powerup', './assets/images/eat-powerup.png');
        this['load'].image('cat-laser', './assets/images/cat-laser.png');
        this['load'].image('cat-eating', './assets/images/cat-eating.png');
      }

      create() {
        const { width, height } = this['game'].config;

        // Background - white like Chrome's dinosaur game
        this['add'].rectangle(width / 2, height / 2, width, height, 0xFFFFFF);

        // Title
        this['add'].text(width / 2, height * 0.2, 'Pet Runner', {
          fontSize: '32px',
          color: '#000000',
          fontStyle: 'bold'
        }).setOrigin(0.5);

        // Character Options
        const catOption = this['add'].image(width * 0.3, height * 0.5, 'cat-head')
          .setScale(0.2)
          .setInteractive();
        const dogOption = this['add'].image(width * 0.7, height * 0.5, 'dog')
          .setScale(0.2)
          .setInteractive();

        // Select character on click
        catOption.on('pointerdown', () => {
          this['scene'].start('GameScene', { character: 'cat-racer' });
        });
        dogOption.on('pointerdown', () => {
          this['scene'].start('GameScene', { character: 'dog' });
        });

        // Instructions
        this['add'].text(width / 2, height * 0.7, 'Select your pet or press start', {
          fontSize: '16px',
          color: '#000000'
        }).setOrigin(0.5);

        // Start Button
        const startButton = this['add'].image(width / 2, height * 0.8, 'start-button')
          .setScale(0.2)
          .setInteractive();

        startButton.on('pointerdown', () => {
          this['scene'].start('GameScene', { character: 'cat-racer' }); // Default to cat
        });
      }
    }

    // Main Game Scene
    class GameScene extends this.Phaser.Scene {
      private player: any;
      private obstacles: any;
      private clouds: any;
      private powerups: any;
      private ground: any;
      private scoreText: any;
      private powerupText: any;
      private score: number = 0;
      private gameOver: boolean = false;
      private isJumping: boolean = false;
      private obstacleTimer: any;
      private cloudTimer: any;
      private powerupTimer: any;
      private gameSpeed: number = 5;
      private gravity: number = 1200;
      private jumpVelocity: number = -600;
      private difficultyTimer: any;
      private hasLaserPower: boolean = false;
      private hasEatPower: boolean = false;
      private powerupDuration: number = 5000; // 5 seconds
      private powerupTimers: any = {
        laser: null,
        eat: null
      };
      private laserGroup: any;

      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        // Player assets
        this['load'].image('cat-racer', './assets/images/cat-dino.png');
        this['load'].image('cat-crash', './assets/images/cat-sad.gif');
        this['load'].image('cat-laser', './assets/images/cat-dino.png');
        this['load'].image('cat-eating', './assets/images/cat-eating.gif');
        
        // Obstacle assets
        this['load'].image('dog', './assets/images/dog-waiting.png');
        this['load'].image('barricade', './assets/images/dog-sad.gif');
        this['load'].image('restart-btn', './assets/images/restart-button.png');
        
        // Cloud assets
        this['load'].image('cloud1', './assets/images/cloud1.png');
        this['load'].image('cloud2', './assets/images/cloud2.png');
        
        // Power-up assets
        this['load'].image('laser-powerup', './assets/images/laser-powerup.png');
        this['load'].image('eat-powerup', './assets/images/eat-powerup.png');
        this['load'].image('laser-beam', './assets/images/laser-beam.png');
      }

      create(data: { character: string }) {
        const { width, height } = this['game'].config;

        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.gameSpeed = 5;
        this.hasLaserPower = false;
        this.hasEatPower = false;
        
        // White background like Chrome's dinosaur game
        this['add'].rectangle(width / 2, height / 2, width, height, 0xFFFFFF);

        // Ground
        this.ground = this['add'].rectangle(width / 2, height - 30, width, 2, 0x000000);
        this['physics'].add.existing(this.ground, true); // true makes it static

        // Player
        this.player = this['physics'].add.sprite(
          width * 0.2, 
          height - 80, 
          data.character
        ).setScale(0.3);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(this.gravity);
        this.player.setDepth(10);
        this.player.powerState = 'normal'; // Track player power state
        
        // Set hitbox size to be smaller than the image
        this.player.setSize(this.player.width * 0.6, this.player.height * 0.6);
        this.player.setOffset(this.player.width * 0.2, this.player.height * 0.2);

        // Obstacle Group
        this.obstacles = this['physics'].add.group();
        
        // Cloud Group
        this.clouds = this['physics'].add.group();
        
        // Powerup Group
        this.powerups = this['physics'].add.group();
        
        // Laser Group
        this.laserGroup = this['physics'].add.group();

        // Score Text
        this.scoreText = this['add'].text(16, 16, 'Score: 0', { 
          fontSize: '18px', 
          color: '#000000'
        }).setDepth(20);
        
        // Powerup Text
        this.powerupText = this['add'].text(16, 40, '', { 
          fontSize: '16px', 
          color: '#FF0000'
        }).setDepth(20);

        // Collisions
        this['physics'].add.collider(this.player, this.ground);
        this['physics'].add.overlap(
          this.player, 
          this.obstacles, 
          this.handleObstacleCollision, 
          null, 
          this
        );
        this['physics'].add.overlap(
          this.player,
          this.powerups,
          this.collectPowerup,
          null,
          this
        );
        this['physics'].add.overlap(
          this.laserGroup,
          this.obstacles,
          this.laserHitObstacle,
          null,
          this
        );

        // Input Handling
        this['input'].keyboard.on('keydown-SPACE', this.jump, this);
        this['input'].keyboard.on('keydown-UP', this.jump, this);
        this['input'].keyboard.on('keydown-X', this.fireLaser, this);
        
        // Touch control
        this.setupTouchControls();

        // Start spawning obstacles with random timing
        this.scheduleNextObstacle();
        
        // Start spawning clouds
        this.cloudTimer = this['time'].addEvent({
          delay: 2000,
          callback: this.spawnCloud,
          callbackScope: this,
          loop: true
        });
        
        // Start spawning powerups
        this.powerupTimer = this['time'].addEvent({
          delay: 10000, // Every 10 seconds
          callback: this.spawnPowerup,
          callbackScope: this,
          loop: true
        });

        // Increase difficulty over time
        this.difficultyTimer = this['time'].addEvent({
          delay: 5000, // Every 5 seconds
          callback: this.increaseDifficulty,
          callbackScope: this,
          loop: true
        });
      }

      setupTouchControls() {
        // Make the entire screen a touch zone for jumping
        const { width, height } = this['game'].config;
        
        const touchZone = this['add'].zone(width / 2, height / 2, width, height)
          .setInteractive()
          .setOrigin(0.5);
          
        touchZone.on('pointerdown', () => {
          // Double tap detection could be added here
          this.jump();
          
          // If has laser power, also fire laser
          if (this.hasLaserPower) {
            this.fireLaser();
          }
        });
      }

      jump() {
        // Only allow jumping when on the ground
        if (this.gameOver) return;
        
        if (this.player.body.touching.down) {
          this.player.setVelocityY(this.jumpVelocity);
          this.isJumping = true;
        }
      }
      
      scheduleNextObstacle() {
        if (this.gameOver) return;
        
        // Random delay between 1000ms and 3000ms
        const delay = Phaser.Math.Between(1000, 3000);
        
        this.obstacleTimer = this['time'].addEvent({
          delay: delay,
          callback: () => {
            this.spawnObstacle();
            this.scheduleNextObstacle(); // Schedule next obstacle with new random delay
          },
          callbackScope: this,
          loop: false
        });
      }

      spawnObstacle() {
        if (this.gameOver) return;
        
        const { width, height } = this['game'].config;
        
        // Randomly choose between dog and barricade
        const obstacleType = Math.random() > 0.5 ? 'dog' : 'dog';
        
        // Create the obstacle
        const obstacle = this.obstacles.create(
          width + 50, // Start off-screen
          height - 40, // Just above ground
          obstacleType
        );
        
        obstacle.setScale(0.15);
        obstacle.setOrigin(0.5, 1);
        obstacle.setImmovable(true);
        obstacle.setVelocityX(-200 - (this.gameSpeed * 10)); // Adjust speed based on game speed
        
        // Set smaller hitbox
        obstacle.setSize(obstacle.width * 0.3, obstacle.height * 0.3);
        obstacle.setOffset(obstacle.width * 0.15, obstacle.height * 0.3);
        
        // Auto destroy when off screen
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
      }
      
      spawnCloud() {
        if (this.gameOver) return;
        
        const { width, height } = this['game'].config;
        
        // Choose cloud type
        const cloudType = Math.random() > 0.5 ? 'cloud1' : 'cloud2';
        
        // Random y position for cloud
        const yPos = Phaser.Math.Between(30, height - 100);
        
        // Create the cloud
        const cloud = this.clouds.create(
          width + 50,
          yPos,
          cloudType
        );
        
        // Random scale for clouds
        const scale = Phaser.Math.FloatBetween(0.1, 0.3);
        cloud.setScale(scale);
        
        // Clouds move slower than obstacles
        cloud.setVelocityX(-100 - (this.gameSpeed * 5));
        
        // Set depth below player
        cloud.setDepth(5);
        
        // Auto destroy when off screen
        cloud.checkWorldBounds = true;
        cloud.outOfBoundsKill = true;
      }
      
      spawnPowerup() {
        if (this.gameOver) return;
        
        const { width, height } = this['game'].config;
        
        // Don't spawn if already has powerup
        if (this.hasLaserPower || this.hasEatPower) return;
        
        // Randomly choose powerup type
        const powerupType = Math.random() > 0.5 ? 'laser-powerup' : 'eat-powerup';
        
        // Random y position for powerup (a bit higher to make player jump for it)
        const yPos = Phaser.Math.Between(height - 120, height - 80);
        
        // Create the powerup
        const powerup = this.powerups.create(
          width + 50,
          yPos,
          powerupType
        );
        
        powerup.setScale(0.1);
        powerup.setVelocityX(-200 - (this.gameSpeed * 10));
        powerup.powerupType = powerupType.split('-')[0]; // 'laser' or 'eat'
        
        // Auto destroy when off screen
        powerup.checkWorldBounds = true;
        powerup.outOfBoundsKill = true;
      }
      
      collectPowerup(player: any, powerup: any) {
        // Handle powerup collection
        if (powerup.powerupType === 'laser') {
          this.activateLaserPower();
        } else if (powerup.powerupType === 'eat') {
          this.activateEatPower();
        }
        
        // Remove the powerup
        powerup.destroy();
      }
      
      activateLaserPower() {
        this.hasLaserPower = true;
        
        // Change player texture to laser cat
        this.player.setTexture('cat-laser');
        this.player.powerState = 'laser';
        
        // Update powerup text

        this.powerupText.setText('LASER EYES ACTIVE!');
        
        // Clear any existing timer
        if (this.powerupTimers.laser) {
          this.powerupTimers.laser.remove();
        }
        
        // Set timer to deactivate
        this.powerupTimers.laser = this['time'].delayedCall(this.powerupDuration, () => {
          this.deactivateLaserPower();
        }, [], this);
      }
      
      deactivateLaserPower() {
        this.hasLaserPower = false;
        
        // Only change texture back if not in another power state
        if (this.player.powerState === 'laser') {
          this.player.setTexture('cat-racer');
          this.player.powerState = 'normal';
        }
        
        // Clear powerup text if no other powerup is active
        if (!this.hasEatPower) {
          this.powerupText.setText('');
        }
      }
      
      activateEatPower() {
        this.hasEatPower = true;
        
        // Change player texture to eating cat
        this.player.setTexture('cat-eating');
        this.player.powerState = 'eat';
        
        // Update powerup text
        this.powerupText.setText('NOM NOM POWER ACTIVE!');
        
        // Clear any existing timer
        if (this.powerupTimers.eat) {
          this.powerupTimers.eat.remove();
        }
        
        // Set timer to deactivate
        this.powerupTimers.eat = this['time'].delayedCall(this.powerupDuration, () => {
          this.deactivateEatPower();
        }, [], this);
      }
      
      deactivateEatPower() {
        this.hasEatPower = false;
        
        // Only change texture back if not in another power state
        if (this.player.powerState === 'eat') {
          this.player.setTexture('cat-racer');
          this.player.powerState = 'normal';
        }
        
        // Clear powerup text if no other powerup is active
        if (!this.hasLaserPower) {
          this.powerupText.setText('');
        }
      }
      
      fireLaser() {
        if (this.gameOver || !this.hasLaserPower) return;
        
        // Create laser beam
        const laser = this.laserGroup.create(
          this.player.x + 30, // Start from cat's eyes
          this.player.y - 10,
          'laser-beam'
        );
        
        laser.setScale(0.5, 0.1);
        laser.setVelocityX(600); // Fast moving laser
        
        // Auto destroy when off screen
        laser.checkWorldBounds = true;
        laser.outOfBoundsKill = true;
        
        // Add visual effect - tint
        laser.setTint(0xff0000);
      }
      
      laserHitObstacle(laser: any, obstacle: any) {
        // Destroy both laser and obstacle
        laser.destroy();
        
        // Add a score for destroying obstacle with laser
        this.score += 2;
        this.scoreText.setText('Score: ' + this.score);
        
        // Create explosion effect
        const explosion = this['add'].particles('laser-beam', {
          x: obstacle.x,
          y: obstacle.y,
          speed: { min: -100, max: 100 },
          scale: { start: 0.1, end: 0 },
          lifespan: 300,
          quantity: 10
        });
        
        // Set a timer to destroy the particle emitter
        this['time'].delayedCall(300, () => {
          explosion.destroy();
        });
        
        // Destroy obstacle
        obstacle.destroy();
      }
      
      handleObstacleCollision(player: any, obstacle: any) {
        // If player has eat power, eat the obstacle and get points
        if (this.hasEatPower) {
          this.score += 3;
          this.scoreText.setText('Score: ' + this.score);
          obstacle.destroy();
          
          // Play eating animation or effect here
          
          return;
        }
        
        // Normal collision handling
        this.endGame();
      }

      increaseDifficulty() {
        if (this.gameOver) return;
        
        // Increase game speed
        this.gameSpeed += 0.5;
      }

      endGame() {
        this.gameOver = true;

        // Stop movement
        this['physics'].pause();

        // Change player texture to crash
        this.player.setTexture('cat-crash');

        // Game over text
        this['add'].text(
          this['game'].config.width / 2, 
          this['game'].config.height / 2, 
          'GAME OVER', 
          { 
            fontSize: '32px', 
            color: '#000000',
            fontStyle: 'bold'
          }
        ).setOrigin(0.5).setDepth(25);

        // Display final score
        this['add'].text(
          this['game'].config.width / 2, 
          this['game'].config.height / 2 + 40, 
          'Score: ' + this.score, 
          { 
            fontSize: '24px', 
            color: '#000000'
          }
        ).setOrigin(0.5).setDepth(25);

        // Restart button
        const restartButton = this['add'].image(
          this['game'].config.width / 2, 
          this['game'].config.height * 0.7, 
          'restart-btn'
        )
        .setScale(0.2)
        .setInteractive()
        .setDepth(25)
        .on('pointerdown', () => {
          this['scene'].restart();
        });
      }

      update() {
        if (this.gameOver) return;

        // Check for successful jumps over obstacles
        this.obstacles.getChildren().forEach((obstacle: any) => {
          // If player has jumped over an obstacle that hasn't been counted yet
          if (!obstacle.scored && obstacle.x < this.player.x) {
            this.score++;
            this.scoreText.setText('Score: ' + this.score);
            obstacle.scored = true;
          }
        });

        // Clean up obstacles that are off-screen
        this.obstacles.getChildren().forEach((obstacle: any) => {
          if (obstacle.x < -obstacle.width) {
            this.obstacles.remove(obstacle, true, true);
          }
        });
        
        // Clean up clouds that are off-screen
        this.clouds.getChildren().forEach((cloud: any) => {
          if (cloud.x < -cloud.width) {
            this.clouds.remove(cloud, true, true);
          }
        });
        
        // Clean up powerups that are off-screen
        this.powerups.getChildren().forEach((powerup: any) => {
          if (powerup.x < -powerup.width) {
            this.powerups.remove(powerup, true, true);
          }
        });
        
        // Clean up lasers that are off-screen
        this.laserGroup.getChildren().forEach((laser: any) => {
          if (laser.x > this['game'].config.width + laser.width) {
            this.laserGroup.remove(laser, true, true);
          }
        });
      }
    }

    // Game Configuration
    const config = {
      type: this.Phaser.AUTO,
      width: 800,
      height: 300, // Like Chrome's dinosaur game
      parent: 'game-container',
      backgroundColor: 0xFFFFFF, // White background
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scale: {
        mode: this.Phaser.Scale.FIT,
        autoCenter: this.Phaser.Scale.CENTER_BOTH
      },
      scene: [CharacterSelectionScene, GameScene]
    };

    // Create game instance
    this.game = new this.Phaser.Game(config);
  }

  ngOnDestroy() {
    if (this.game) {
      this.game.destroy(true);
    }
  }
}