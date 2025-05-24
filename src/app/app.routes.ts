import { Routes } from '@angular/router';
import { VideoComponent } from './video-handling/component/video/video.component';
import { VideoPlayerComponent } from './video-handling/video-player/video-player.component';
import { AuthComponent } from './auth/auth.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ProfileComponent } from './profile/profile.component';
import { AuthGuard } from './auth-guard.service';
import { ProductDetailsPageComponent } from './pages/product-details-page/product-details-page.component';
import { ProductPageComponent } from './pages/product-page/product-page.component';
import { AdminPageComponent } from './pages/admin-page/admin-page.component';
import { CartPageComponent } from './pages/cart-page/cart-page.component';
import { OrderPageComponent } from './pages/order-page/order-page.component';
import { HomePageComponent } from './layout/home-page/home-page.component';
import { AdminOnlyComponent } from './admin-only/admin-only.component';
import { FlappMemeGameComponent } from './pages/flapp-meme-game/flapp-meme-game.component';
import { GamesComponent } from './pages/games/games.component';
import { PetFightComponent } from './pages/pet-fight/pet-fight.component';
import { PetFetchComponent } from './pages/pet-fetch/pet-fetch.component';
import { CricketGameComponent } from './pages/cricket-game/cricket-game.component';
import { DoodleComponent } from './pages/doodle/doodle.component';

export const routes: Routes = [
   {path: '', component: HomePageComponent},
   {path: 'player', component: VideoPlayerComponent},
   {path: 'auth', component: AuthComponent},
   {path: 'signin', component: SignInComponent},
   {path: 'signup', component: SignUpComponent},
   {path:'profile', component: ProfileComponent, canActivate: [AuthGuard]},
   {path: 'products/:id', component: ProductDetailsPageComponent},
   {path: 'all-products', component: ProductPageComponent},
   {path: 'admin-page', component: AdminPageComponent},
   {path: 'cart', component: CartPageComponent},
   {path: 'order', component: OrderPageComponent},
   {path: 'admin', component: AdminOnlyComponent},
   {
      path: 'games', 
      children: [
        { path: '', component: GamesComponent },
        { path: 'flapp-meme-game', component: FlappMemeGameComponent },
        {path: 'snake', component: PetFightComponent},
        {path: 'fetch', component: PetFetchComponent},
        // You can easily add more games here
        // { path: 'another-game', component: AnotherGameComponent }
      ]
    },
    
    {path: 'cricket', component: CricketGameComponent},
    {path: 'doodle', component: DoodleComponent}, // Assuming you have a DoodleComponent


];
