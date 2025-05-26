import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { AlertService } from '../../../../services/alert.service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    FormsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;

  email: string = '';
  password: string = '';
  isLoginLoading: boolean = false;
  hidePassword: boolean = true;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private alertService: AlertService,
    private translateService: TranslateService
  ) {}

  ngOnInit(): void {
    // Check if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin/home']);
    }

    // Check for redirect parameters (in case of OAuth or other flows)
    // const urlParams = new URLSearchParams(window.location.search);
    // if (urlParams.has('error')) {
    //   this.errorMessage = urlParams.get('error') || 'Authentication error';
    //   this.alertService.error(this.errorMessage);
    // }
  }

  login() {
    if (!this.loginForm.valid) {
      this.validateAllFormFields();
      return;
    }

    this.isLoginLoading = true;
    this.errorMessage = '';

    this.authService
      .adminLogin({
        email: this.email.trim(),
        password: this.password,
      })
      .subscribe({
        next: (results) => {
          this.alertService.success('Login successful');
          this.router.navigate(['admin/home']).then(() => {
            window.location.reload();
          });
        },
        error: (err) => {
          this.isLoginLoading = false;
          this.errorMessage = err.error?.message || 'Login failed';
          this.authService.handleHttpError(err);
        },
        complete: () => {
          this.isLoginLoading = false;
        }
      });
  }

  onReset() {
    this.email = '';
    this.password = '';
    this.errorMessage = '';
    this.loginForm.resetForm();
  }

  private validateAllFormFields() {
    Object.keys(this.loginForm.controls).forEach(field => {
      const control = this.loginForm.controls[field];
      control.markAsTouched({ onlySelf: true });
    });
  }
}
