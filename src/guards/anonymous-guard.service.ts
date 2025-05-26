import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';
// import { AuthService } from '../services/auth-service.service';

@Injectable({
  providedIn: 'root',
})
export class AnonymousGuard implements CanActivate {
  constructor(public authService: AuthService, public router: Router) {}
  canActivate(): boolean {
    if (this.authService.isAdminAuthenticated() /* || this.authService.isUserAuthenticated() */) {
      this.router.navigate(['']);
      return false;
    }
    return true;
  }
}
