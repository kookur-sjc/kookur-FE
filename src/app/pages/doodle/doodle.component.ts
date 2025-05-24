import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-doodle',
  standalone: true,
  imports: [HttpClientModule],
  templateUrl: './doodle.component.html',
  styleUrl: './doodle.component.scss'
})
export class DoodleComponent implements OnInit {
  sanitizedGamePath: SafeResourceUrl;
  
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {
    // Default path
    const defaultPath = '/assets/doodle-cricket/index.html';
    this.sanitizedGamePath = this.sanitizer.bypassSecurityTrustResourceUrl(defaultPath);
  }
  
  ngOnInit() {
    // First try with absolute path
    const path = '/assets/doodle-cricket/index.html';
    
    // Check if file exists with a HEAD request (more efficient)
    this.http.head(path)
      .subscribe(
        () => {
          console.log('Game found at:', path);
          this.sanitizedGamePath = this.sanitizer.bypassSecurityTrustResourceUrl(path);
        },
        error => {
          console.warn('Failed to load game from primary path, trying alternative paths');
          this.tryAlternativePaths();
        }
      );
  }
  
  private tryAlternativePaths() {
    // Try alternative paths in sequence
    const paths = [
      './assets/doodle-cricket/index.html',
      '../assets/doodle-cricket/index.html',
      '/assets/doodle-cricket/Cricket-Doodle-Game/index.html',
      './assets/doodle-cricket/Cricket-Doodle-Game/index.html'
    ];
    
    let pathsChecked = 0;
    
    for (const path of paths) {
      this.http.head(path)
        .subscribe(
          () => {
            console.log('Game found at alternative path:', path);
            this.sanitizedGamePath = this.sanitizer.bypassSecurityTrustResourceUrl(path);
          },
          error => {
            pathsChecked++;
            if (pathsChecked === paths.length) {
              console.error('Game could not be found at any expected location');
            }
          }
        );
    }
  }
}