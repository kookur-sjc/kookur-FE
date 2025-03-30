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
      private ground: any;
      private scoreText: any;
      private score: number = 0;
      private gameOver: boolean = false;
      private isJumping: boolean = false;
      private obstacleTimer: any;
      private gameSpeed: number = 5;
      private gravity: number = 700;
      private jumpVelocity: number = -400;
      private difficultyTimer: any;

      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        // Player assets
        this['load'].image('cat-racer', './assets/images/cat-dino.png');
        this['load'].image('cat-crash', './assets/images/cat-sad.gif');
        
        // Obstacle assets
        this['load'].image('dog', './assets/images/dog-waiting.png');
        this['load'].image('barricade', './assets/images/dog-sad.gif');
        this['load'].image('restart-btn', './assets/images/restart-button.png');
      }

      create(data: { character: string }) {
        const { width, height } = this['game'].config;

        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.gameSpeed = 5;
        
        // White background like Chrome's dinosaur game
        this['add'].rectangle(width / 2, height / 2, width, height, 0xFFFFFF);

        // Ground
        this.ground = this['add'].rectangle(width / 2, height - 30, width, 2, 0x000000);
        this['physics'].add.existing(this.ground, true); // true makes it static

        // Player
        this.player = this['physics'].add.sprite(
          width * 0.2, 
          height - 60, 
          data.character
        ).setScale(0.2);
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(this.gravity);
        this.player.setDepth(10);
        
        // Set hitbox size to be smaller than the image
        this.player.setSize(this.player.width * 0.6, this.player.height * 0.6);
        this.player.setOffset(this.player.width * 0.2, this.player.height * 0.2);

        // Obstacle Group
        this.obstacles = this['physics'].add.group();

        // Score Text
        this.scoreText = this['add'].text(16, 16, 'Score: 0', { 
          fontSize: '18px', 
          color: '#000000'
        }).setDepth(20);

        // Collisions
        this['physics'].add.collider(this.player, this.ground);
        this['physics'].add.overlap(
          this.player, 
          this.obstacles, 
          this.hitObstacle, 
          null, 
          this
        );

        // Input Handling
        this['input'].keyboard.on('keydown-SPACE', this.jump, this);
        this['input'].keyboard.on('keydown-UP', this.jump, this);
        
        // Touch control
        this.setupTouchControls();

        // Start spawning obstacles
        this.obstacleTimer = this['time'].addEvent({
          delay: 1500,
          callback: this.spawnObstacle,
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
          this.jump();
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

      spawnObstacle() {
        if (this.gameOver) return;
        
        const { width, height } = this['game'].config;
        
        // Randomly choose between dog and barricade
        const obstacleType = Math.random() > 0.5 ? 'dog' : 'barricade';
        
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
        obstacle.setSize(obstacle.width * 0.7, obstacle.height * 0.7);
        obstacle.setOffset(obstacle.width * 0.15, obstacle.height * 0.3);
        
        // Auto destroy when off screen
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
      }

      increaseDifficulty() {
        if (this.gameOver) return;
        
        // Increase game speed
        this.gameSpeed += 0.5;
        
        // Decrease spawn time (up to a minimum interval)
        const currentDelay = this.obstacleTimer.delay;
        if (currentDelay > 800) {
          this.obstacleTimer.delay = currentDelay - 100;
        }
      }

      hitObstacle(player: any, obstacle: any) {
        this.endGame();
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