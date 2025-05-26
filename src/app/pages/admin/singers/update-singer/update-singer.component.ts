import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { from } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { Singer } from '../../../../../models/singer.model';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { SingersService } from '../../../../services/singers.service';

@Component({
  selector: 'app-update-singer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './update-singer.component.html',
  styleUrls: ['./update-singer.component.css']
})
export class UpdateSingerComponent implements OnInit {
  updateForm: FormGroup;
  isLoading = false;
  isSubmitting = false;
  singer: Singer | null = null;
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  singerId: string | null = null;

  constructor(
    private singersService: SingersService,
    private alertService: AlertService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.updateForm = this.fb.group({
      nameEn: ['', [Validators.required]],
      nameAr: ['', [Validators.required]],
      description: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.singerId = params.get('id');
      if (this.singerId) {
        this.loadSingerData(this.singerId);
      } else {
        this.alertService.error('Singer ID is missing');
        this.router.navigate(['/admin/rawadeed']);
      }
    });
  }

  loadSingerData(id: string): void {
    this.isLoading = true;
    this.singersService.getSinger(id)
      .then((singer: Singer) => {
        this.singer = singer;
        this.updateForm.patchValue({
          nameEn: singer.nameEn,
          nameAr: singer.nameAr,
          description: singer.description || ''
        });

        if (singer.thumbnail) {
          this.thumbnailPreview = singer.thumbnail;
        }

        this.isLoading = false;
      })
      .catch(error => {
        this.isLoading = false;
        this.authService.handleHttpError(error);
        this.alertService.error('Failed to load singer data');
        this.router.navigate(['/admin/rawadeed']);
      });
  }

  onThumbnailSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check if file is valid image
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        this.alertService.error('Please select a valid image file (JPEG or PNG)');
        return;
      }

      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.error('Image file is too large. Maximum size is 5MB.');
        return;
      }

      this.thumbnailFile = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.thumbnailPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  removeThumbnail(event: Event): void {
    event.stopPropagation();
    this.thumbnailFile = null;
    this.thumbnailPreview = this.singer?.thumbnail || null;
  }

  removeThumbnailCompletely(event: Event): void {
    event.stopPropagation();
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
  }

  submitUpdate(): void {
    if (this.updateForm.invalid) {
      this.alertService.error('Please fill all required fields');
      return;
    }

    if (!this.singerId) {
      this.alertService.error('Singer ID is missing');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    formData.append('nameEn', this.updateForm.get('nameEn')?.value);
    formData.append('nameAr', this.updateForm.get('nameAr')?.value);
    formData.append('description', this.updateForm.get('description')?.value || '');

    // If there's a new thumbnail, add it to the form data
    if (this.thumbnailFile) {
      formData.append('thumbnail', this.thumbnailFile, this.thumbnailFile.name);
    }

    // If the thumbnail was completely removed, add a flag
    if (this.thumbnailPreview === null && this.singer?.thumbnail) {
      formData.append('removeThumbnail', 'true');
    }

    from(this.singersService.updateSinger(this.singerId, formData))
      .pipe(
        tap(() => {
          this.alertService.success('Singer updated successfully');
          this.router.navigate(['/admin/rawadeed']);
        }),
        catchError(err => {
          this.authService.handleHttpError(err);
          throw err;
        }),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe();
  }

  resetForm(): void {
    if (this.singer) {
      this.updateForm.patchValue({
        nameEn: this.singer.nameEn,
        nameAr: this.singer.nameAr,
        description: this.singer.description || ''
      });
      this.thumbnailFile = null;
      this.thumbnailPreview = this.singer?.thumbnail || null;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/rawadeed']);
  }
}
