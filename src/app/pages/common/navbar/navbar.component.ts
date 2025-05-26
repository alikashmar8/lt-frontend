import { Component, HostListener } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import {
  MatToolbar,
  MatToolbarModule,
  MatToolbarRow,
} from '@angular/material/toolbar';
import { MatMenu, MatMenuTrigger } from '@angular/material/menu';
import {
  MatButtonModule,
  MatFabButton,
  MatIconButton,
} from '@angular/material/button';
import {
  MatSidenav,
  MatSidenavContainer,
  MatSidenavModule,
} from '@angular/material/sidenav';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Admin } from '../../../../models/admin.model';
import { AlertService } from '../../../services/alert.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { LanguageSwitcherComponent } from '../../../components/language-switcher/language-switcher.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLinkActive,
    RouterLink,
    MatToolbarModule,
    MatToolbar,
    MatSidenavModule,
    MatSidenav,
    MatIconModule,
    MatButtonModule,
    MatFabButton,
    MatIconButton,
    MatIcon,
    TranslateModule,
    LanguageSwitcherComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  isMobileMenuOpen = false;
  isScrolled = false;

  isAdminAuthenticated = false;
  isUserAuthenticated = false;

  currentAdmin?: Admin;

  constructor(
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router
  ) {
    this.isAdminAuthenticated = this.authService.isAdminAuthenticated();
    // this.isUserAuthenticated = this.authService.isUserAuthenticated?.() || false;
    this.currentAdmin = this.authService.currentAdmin as Admin;
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  @HostListener('window:resize', [])
  onResize() {
    // Close mobile menu when resizing to desktop view
    if (window.innerWidth > 768 && this.isMobileMenuOpen) {
      this.isMobileMenuOpen = false;
    }
  }

  toggleMobileMenu(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    // Prevent scrolling when mobile menu is open
    if (this.isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
    document.body.style.overflow = '';
  }

  logout() {
    const success = this.authService.logout();

    if (success) {
      this.closeMobileMenu();
      this.router.navigate(['/']).then(() => {
        window.location.reload();
      });
    } else {
      this.alertService.error('Failed to logout');
    }
  }
}
