import { DOCUMENT, Location } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// import { JwtHelperService } from '@auth0/angular-jwt';
// import { DialogLayoutDisplay } from '@costlydeveloper/ngx-awesome-popup';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { apiUrl } from '../../constants/api-constants';
import { Admin } from '../../models/admin.model';
import { getAdminAccessToken, getAdminHeaders } from '../../utils/functions';
import { AlertService } from './alert.service';
// import { apiUrl } from 'src/constants/api-constants';
// import { User } from 'src/models/user.model';
// import { getCurrencySymbol, getHeaders } from 'src/utils/functions';
// import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // currentUserSubject: BehaviorSubject<User | null>;
  // public currentUserObservable: Observable<User | null>;
  currentAdminSubject: BehaviorSubject<Admin | null> | undefined;
  public currentAdminObservable: Observable<Admin | null> | undefined;

  constructor(
    private http: HttpClient,
    // public jwtHelper: JwtHelperService,
    private alertService: AlertService,
    private router: Router,
    private readonly location: Location,
    private readonly route: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document
  ) {
    const s = this.document.defaultView?.localStorage?.getItem('currentAdmin');
    if (s != null) {
      this.currentAdminSubject = new BehaviorSubject<Admin | null>(
        JSON.parse(s)
      );
    } else {
      this.currentAdminSubject = new BehaviorSubject<Admin | null>(null);
    }

    this.currentAdminObservable = this.currentAdminSubject?.asObservable();
  }

  public get currentAdmin(): Admin | null | undefined {
    return this.currentAdminSubject?.value;
  }

  adminLogin(data: { email: string; password: string }) {
    return this.http.post<any>(`${apiUrl}auth/login/admin`, data).pipe(
      map((response: { admin: Admin; access_token: string }) => {
        this.document.defaultView?.localStorage.setItem(
          'currentAdmin',
          JSON.stringify(response.admin)
        );
        this.document.defaultView?.localStorage.setItem(
          'admin_access_token',
          response.access_token
        );



        // console.log('access_token', response.access_token);
        // console.log('getAdminAccess_token', getAdminAccessToken());

        // debugger;

        if (this.currentAdminSubject) {
          this.currentAdminSubject.next(response.admin);
        }
        return response;
      })
    );
  }

  adminLogout() {
    this.document.defaultView?.localStorage.removeItem('currentAdmin');
    this.document.defaultView?.localStorage.removeItem('admin_access_token');
    //TODO: logout from server
    return true;
  }

  // register(data: {
  //   lastName: string;
  //   firstName: string;
  //   password: string;
  //   confirmPassword: string;
  //   role: number;
  //   email: string;
  // }) {
  //   return this.http.post(`${apiUrl}/auth/register`, data, {
  //     headers: {
  //       'Content-Type': 'application/json',
  //       'X-Requested-With': 'XMLHttpRequest',
  //     },
  //   });
  // }

  // resetPasswordRequest(email: any) {
  //   const data: any = {};
  //   data.email = email;
  //   return this.http.post(`${apiUrl}/forgot`, data);
  // }

  // resetPassword(data: any, token: any) {
  //   const d: any = {};
  //   d.data = data;
  //   d.token = token;
  //   return this.http.post(`${apiUrl}/resetpassword`, d);
  // }

  public isAdminAuthenticated(): boolean {
    const token =
      this.document.defaultView?.localStorage?.getItem('admin_access_token');
    if (!token) return false;
    const currentAdmin = this.currentAdmin;
    if (!currentAdmin) return false;
    // TODO: Check if token is valid from server
    return true;
  }

  public isAuthenticated(): boolean {
    return this.isAdminAuthenticated(); // || this.isUserAuthenticated();
  }

  handleHttpError(err: HttpErrorResponse) {
    switch (err.error.statusCode) {
      case 400:
        Array.isArray(err.error.message)
          ? err.error.message.forEach((message: string) => {
              this.alertService.error(message);
            })
          : this.alertService.error(err.error.message);
        break;
      case 404:
        let canGoBack =
          !!this.router.getCurrentNavigation()?.previousNavigation;
        if (canGoBack) {
          // We can safely go back to the previous location as
          // we know it's within our app.
          this.alertService.error('Error 404 - not found');
          this.location.back();
        } else {
          // There's no previous navigation.
          // Here we decide where to go. For example, let's say the
          // upper level is the index page, so we go up one level.
          this.alertService.error('Error 404 - not found');
          this.router.navigate(['..'], { relativeTo: this.route });
        }
        break;
      case 401:
      case 403:
        //not authorized
        this.logout();
        this.router.navigate(['/']).then(() => {
          window.location.reload();
        });
        break;

      default:
        break;
    }
  }

  logout() {
    const adminLogoutSuccessful = this.adminLogout();

    return adminLogoutSuccessful;
  }

  // async updatePassword(
  //   id: string,
  //   data: { oldPassword: string; newPassword: string; confirmPassword: string }
  // ) {
  //   return await this.http
  //     .patch<any>(
  //       `${apiUrl}auth/${id}/update-password`,
  //       { ...data, employeeId: id },
  //       {
  //         headers: getHeaders(),
  //       }
  //     )
  //     .toPromise();
  // }
}
