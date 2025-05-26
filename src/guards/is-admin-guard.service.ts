import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { AuthService } from '../app/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class IsAdminGuard implements CanActivate {
  constructor(public authService: AuthService, public router: Router) {}
  canActivate(route: ActivatedRouteSnapshot): boolean {
    // this will be passed from the route config
    // on the data property
    // const expectedRole = route.data.expectedRole;
    // const token = localStorage.getItem('admin_access_token');
    // if (!token) {
    //   this.router.navigate(['']);
    //   return false;
    // }
    // decode the token to get its payload
    // const tokenPayload: any = decode(token);

    if (!this.authService.isAdminAuthenticated()) {
      this.router.navigate(['']);
      return false;
    }

    // if (!this.auth.isAuthenticated() || !tokenPayload.user.isSuperAdmin) {
    //   this.router.navigate(['login']);
    //   return false;
    // }
    return true;
  }
}
