import { Routes } from '@angular/router';
import { VideoComponent } from './video-handling/component/video/video.component';
import { VideoPlayerComponent } from './video-handling/video-player/video-player.component';
// import { AuthComponent } from './auth/auth.component';

export const routes: Routes = [
   {path: '', component: VideoComponent},
   {path: 'player', component: VideoPlayerComponent},
   // {path: 'auth', component: AuthComponent},


];
