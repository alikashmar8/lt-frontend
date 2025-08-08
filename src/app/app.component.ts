import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Subscription } from 'rxjs';
import { MaterialModule } from './material.module';
import { NavbarComponent } from './pages/common/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { LoadingService } from './services/loading.service';
import { CommonModule } from '@angular/common';
import {
  TranslateModule,
  TranslateService,
  TranslatePipe,
  TranslateDirective,
} from '@ngx-translate/core';
import { TranslationService } from './services/translation.service';
import { BidiModule, Dir } from '@angular/cdk/bidi';
import { GlobalAudioPlayerComponent } from './components/global-audio-player/global-audio-player.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    FormsModule,
    MaterialModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    NavbarComponent,
    CommonModule,
    TranslateModule,
    TranslatePipe,
    TranslateDirective,
    BidiModule,
    GlobalAudioPlayerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  title = 'lt-app';
  isLoading: boolean = true;
  isAdminAuthenticated = false;
  loadingSub?: Subscription;
  showMenu: boolean = true;
  isNavbarAllowed: boolean = true;

  constructor(
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    public translationService: TranslationService,
    private translate: TranslateService
  ) {
    this.isAdminAuthenticated = this.authService.isAdminAuthenticated();

    // Force loading of translations at app startup
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('ar');
    this.translate.use(this.translationService.getCurrentLang());

    router.events.subscribe((val) => {
      if (val instanceof NavigationEnd) {
        console.log('val.url', val.url);

        if (val.url === '/admin/auth/login') {
          this.isNavbarAllowed = false;
        } else {
          this.isNavbarAllowed = true;
        }
      }
    });
  }

  ngOnInit(): void {
    this.loadingSub = this.loadingService.loading$.subscribe((isLoading) => {
      this.isLoading = isLoading;
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.isLoading = this.loadingService.appLoading(false);
    }, 0);
  }

  ngOnDestroy() {
    this.loadingSub?.unsubscribe();
  }

  toggleMenu() {
    this.showMenu = !this.showMenu;
  }
}
