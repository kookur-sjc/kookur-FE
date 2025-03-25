import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-games',
  standalone: true,
  imports: [NgFor],
  templateUrl: './games.component.html',
  styleUrl: './games.component.scss'
})
export class GamesComponent {
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

  navigateToGame(route: string) {
    this.router.navigate([route]);
  }
}
