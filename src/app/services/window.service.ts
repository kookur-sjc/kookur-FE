import { Injectable, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class WindowService {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  get nativeWindow(): Window | null {
    return isPlatformBrowser(this.platformId) ? window : null;
  }

  isWindowAvailable(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
