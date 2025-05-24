import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-doodle',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: './doodle.component.html',
  styleUrl: './doodle.component.scss'
})
export class DoodleComponent implements OnInit {
gamePath = 'assets/doodle-cricket/index.html';
  
  constructor(private http: HttpClient) {}
  ngOnInit() {
    // Check if the file exists
    this.http.get(this.gamePath, { responseType: 'text' })
      .subscribe(
        () => console.log('Game HTML found!'),
        error => console.error('Game HTML not found!', error)
      );
  }

}
