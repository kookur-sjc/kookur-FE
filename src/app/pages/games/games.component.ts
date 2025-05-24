import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingComponent } from '../../shared/components/loading/loading.component';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [NgFor, NgIf, LoadingComponent],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss'
})
export class GamesComponent implements OnInit {
  loading = true;
  games: any[] = [
    {
      title: 'Meme Flappy Game',
      description: 'A hilarious twist on the classic Flappy Bird game with meme-inspired graphics.',
      route: 'games/flapp-meme-game',
      imagePath: 'assets/images/flappy-meme-thumbnail.png'
    },
    {
      title: 'Game 2',
      description: 'Description of Game 2',
      route: '/game2',
      imagePath: 'assets/images/game2-thumbnail.png'
    },
    {
      title: 'Game 3',
      description: 'Description of Game 3',
      route: '/game3',
      imagePath: 'assets/images/game3-thumbnail.png'
    }
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    // Simulate loading time
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  navigateToGame(route: string) {
    this.loading = true;
    this.router.navigate([route]).then(() => {
      // In a real app, this would be handled by route guards or resolvers
      this.loading = false;
    });
  }

  handleImageError(event: any) {
    event.target.src = 'assets/images/default-game-image.jpg';
  }
}
