import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, Inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { on } from 'events';

@Component({
  selector: 'app-pet-fight',
  standalone: true,
  imports: [],
  templateUrl: './pet-fight.component.html',
  styleUrl: './pet-fight.component.scss'
})
export class PetFightComponent implements OnInit, OnDestroy {
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
        this['load'].image('road', './assets/images/roads.png'); // Road texture
        this['load'].image('dog', './assets/images/dog-waiting.png');
      }

      create() {
        const { width, height } = this['game'].config;

        // Background
        this['add'].rectangle(width / 2, height / 2, width, height, 0x87CEEB);

        // Title
        this['add'].text(width / 2, height * 0.2, 'Meme Pet Racer', {
          fontSize: '32px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4,
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
      private barricades: any;
      private foodItems: any;  // New food group
      private roadLines: any[] = [];
      private currentLane: number = 2;
      private scoreText: any;
      private score: number = 0;
      private gameOver: boolean = false;
      private scrollSpeed: number = -200;
      private difficultyMultiplier: number = 1;  // New difficulty multiplier

      constructor() {
        super({ key: 'GameScene' });
      }

      preload() {
        // Player assets
        this['load'].image('cat-racer', './assets/images/cat-happy.gif');
        this['load'].image('cat-crash', './assets/images/cat-sad.gif');

        // Road and background
        this['load'].image('road', './assets/images/roads.png');

        // Obstacle assets
        this['load'].image('dog', './assets/images/dog-waiting.png');
        this['load'].image('barricade', './assets/images/dog-sad.gif');
        this['load'].image('restart-btn', './assets/images/restart-button.png');
        this['load'].image('cat-food', './assets/images/cat-food.png'); 

        this['load'].image('right-button', './assets/images/right-button.png');
        
      }

      create(data: { character: string }) {
        const { width, height } = this['game'].config;

        // Reset game state
        this.score = 0;
        this.gameOver = false;
        this.currentLane = 1;
        this.difficultyMultiplier = 1;  // Reset difficulty
        this.scrollSpeed = -200;  // Reset scroll speed // Start in middle lane

        // Create three roads
        this.roadLines = [];
        const roadWidth = width / 3;
        for (let i = 0; i < 3; i++) {
          const roadLine = this['add'].tileSprite(
            roadWidth * (i + 0.5), 
            height / 2, 
            roadWidth, 
            height, 
            'road'
          );
          roadLine.setTilePosition(0, this.score);
          this.roadLines.push(roadLine);
        }

        // Player
        this.player = this['physics'].add.sprite(
          roadWidth * (this.currentLane + 0.5), 
          height * 0.8, 
          data.character
      ).setScale(0.2);
      this.player.setCollideWorldBounds(true);
      this.player.setDepth(10);

      this.foodItems = this['physics'].add.group();
        

        // Obstacle Groups
        this.obstacles = this['physics'].add.group();
        this.barricades = this['physics'].add.group({
          allowGravity: false, // Prevent unnecessary gravity effects
          immovable: true // Make sure the barricade doesn't move on collision
        });

      

        

        // Score Text
        this.scoreText = this['add'].text(16, 16, 'Score: 0', { 
          fontSize: '32px', 
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 4
        }).setDepth(20);

        // Input Handling
        this['input'].keyboard.on('keydown-LEFT', () => this.switchLane(-1), this);
        this['input'].keyboard.on('keydown-RIGHT', () => this.switchLane(1), this);

        this.setupTouchControls();

        // Obstacle Spawner
        // this['time'].addEvent({
        //   delay: 1000, // Adjusted delay for better spawning
        //   callback: this.spawnObstacles,
        //   callbackScope: this,
        //   loop: true
        // });

        this['physics'].add.overlap(
          this.player, 
          this.foodItems, 
          this.collectFood, 
          null, 
          this
        );

        // Collision Detection
        this['physics'].add.overlap(
          this.player, 
          this.obstacles, 
          this.hitObstacle, 
          null, 
          this
        );

        this['physics'].add.overlap(
          this.player, 
          this.barricades, 
          this.hitBarricade, 
          null, 
          this
        );

        this['time'].addEvent({
          delay: 1000, 
          callback: this.spawnItemsAndIncreaseHardness,
          callbackScope: this,
          loop: true
        });
      }

      spawnItemsAndIncreaseHardness() {
        if (this.gameOver) return;
        
        const { width, height } = this['game'].config;
        const roadWidth = width / 3;

        const lanes = [0, 1, 2];
        lanes.sort(() => 0.5 - Math.random());

        // Increase difficulty based on score
        if (this.score > 0 && this.score % 100 === 0) {
          this.difficultyMultiplier += 0.2;
          this.scrollSpeed -= 2;  // Make roads move faster
        }

        // Spawn food in one lane
        const foodLane = lanes.splice(Math.floor(Math.random() * lanes.length), 1)[0];
        const food = this.foodItems.create(
          roadWidth * (foodLane + 0.5), 
          -50, 
          'cat-food'
        );
        food.setScale(0.3);
        food.setVelocityY(-this.scrollSpeed * this.difficultyMultiplier);
        food.setDepth(5);

        // Barricade in another lane
        const barricadeLane = lanes.splice(Math.floor(Math.random() * lanes.length), 1)[0];
        const barricade = this.barricades.create(
          roadWidth * (barricadeLane + 0.5), 
          -50, 
          'barricade'
        );
        barricade.setScale(0.15);
        barricade.setVelocityY(-this.scrollSpeed * this.difficultyMultiplier);
        barricade.setDepth(5);

        // Obstacles in remaining lanes
        lanes.forEach((lane) => {
          const obstacle = this.obstacles.create(
            roadWidth * (lane + 0.5), 
            -50,
            'dog'
          );
          obstacle.setScale(0.15);
          obstacle.setVelocityY(this.scrollSpeed * this.difficultyMultiplier);
          obstacle.setDepth(5);
        });
      }

      collectFood(player: any, food: any) {
        // Destroy food and increase score
        food.destroy();
        this.score += 50;  // More points for collecting food
        this.scoreText.setText('Score: ' + this.score);
      }

  

      removeOffScreenItems(group: any) {
        group.getChildren().forEach((item: any) => {
          if (item.y > this['game'].config.height + item.height) {
            item.destroy();
          }
        });
      }

      setupTouchControls() {
        const { width, height } = this['game'].config;
  
        // Add visual buttons for mobile (optional)
        const leftButton = this['add'].image(width * 0.2, height * 0.9, 'right-button')
          .setInteractive()
          .setScale(0.1)
          .setAlpha(1)
          .setDepth(20)
          .setAngle(180); 
          
        const rightButton = this['add'].image(width * 0.8, height * 0.9, 'right-button')
          .setInteractive()
          .setScale(0.1)
          .setAlpha(1)
          .setDepth(20);
        
        // Load these in preload()
        // this['load'].image('left-button', './assets/images/left-arrow.png');
        // this['load'].image('right-button', './assets/images/right-arrow.png');
        
        leftButton.on('pointerdown', () => {
          this.switchLane(-1);
        });
        
        rightButton.on('pointerdown', () => {
          this.switchLane(1);
        });
        
        // Create invisible touch zones for left and right
        const leftZone = this['add'].zone(width * 0.25, height * 0.5, width * 0.5, height)
          .setInteractive()
          .setOrigin(0.5);
          
        const rightZone = this['add'].zone(width * 0.75, height * 0.5, width * 0.5, height)
          .setInteractive()
          .setOrigin(0.5);
        
        // Add debug visualization if needed during development
        // Uncomment these lines to see the touch zones
        // this['add'].graphics().lineStyle(2, 0xff0000).strokeRectShape(leftZone.getBounds());
        // this['add'].graphics().lineStyle(2, 0x00ff00).strokeRectShape(rightZone.getBounds());
        
        // Add touch event handlers
        leftZone.on('pointerdown', () => {
          this.switchLane(-1);
        });
        
        rightZone.on('pointerdown', () => {
          this.switchLane(1);
        });

         // Add swipe support
  this['input'].on('pointerup', (pointer:any) => {
    if (pointer.downX - pointer.upX > 50) { // Swipe right to left
      this.switchLane(-1);
    } else if (pointer.upX - pointer.downX > 50) { // Swipe left to right
      this.switchLane(1);
    }
  });
}
        

   switchLane(direction: number) {
    if (this.gameOver) return;

    const { width } = this['game'].config;
    const roadWidth = width / 3;

    // Calculate new lane
    const newLane = this.currentLane + direction;
    
    // Prevent going out of bounds
    if (newLane >= 0 && newLane < 3) {
        this.currentLane = newLane;
        // Use tweens for smooth movement
        this['tweens'].add({
            targets: this.player,
            x: roadWidth * (this.currentLane + 0.5),
            duration: 200,
            ease: 'Power2'
        });
    }
}

// spawnObstacles() {
//   if (this.gameOver) return;
  
//   const { width, height } = this['game'].config;
//   const roadWidth = width / 3;

//   const lanes = [0, 1, 2];
//   lanes.sort(() => 0.5 - Math.random());

//   // Remove debug logs for production
//   // console.log('Available lanes:', lanes);
  
//   const barricadeLane = lanes.splice(Math.floor(Math.random() * lanes.length), 1)[0];
//   // console.log('Barricade lane:', barricadeLane);

//   const barricade = this.barricades.create(
//     roadWidth * (barricadeLane + 0.5), // Centered in lane
//     -50, // Start above screen
//     'barricade'
//   );
//   barricade.setScale(0.15);
//   barricade.setVelocityY(-this.scrollSpeed);
//   barricade.setDepth(5);

//   // console.log('Remaining lanes:', lanes);

//   lanes.forEach((lane) => {
//     const obstacle = this.obstacles.create(
//       roadWidth * (lane + 0.5), // Fix the position to be centered in lane
//       -50,
//       'dog'
//     );
//     obstacle.setScale(0.15);
//     obstacle.setVelocityY(this.scrollSpeed);
//     obstacle.setDepth(5);
//   });
// }

      hitObstacle(player: any, obstacle: any) {
        this.endGame('dog');
      }

      hitBarricade(player: any, barricade: any) {
        this.endGame('barricade');
      }

      endGame(reason: 'dog' | 'barricade') {
        this.gameOver = true;

        // Stop movement
        this['physics'].pause();

        // Change player texture to crash
        this.player.setTexture('cat-crash');
        this.player.setDepth(15);

        // Meme-style game over text
        const memeTexts = {
          'dog': 'Dogged by Danger!',
          'barricade': 'Barricaded Bummer!'
        };

        this['add'].text(
          this['game'].config.width / 2, 
          this['game'].config.height / 2, 
          memeTexts[reason], 
          { 
            fontSize: '32px', 
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
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

        // Scroll roads
        this.roadLines.forEach(roadLine => {
          roadLine.tilePositionY -= 5 * this.difficultyMultiplier;
        });

        // Increase base score
        // this.score++;
        this.scoreText.setText('Score: ' + this.score);

        // Remove off-screen items
        this.removeOffScreenItems(this.obstacles);
        this.removeOffScreenItems(this.barricades);
        this.removeOffScreenItems(this.foodItems);
      }
    }

    // Game Configuration
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