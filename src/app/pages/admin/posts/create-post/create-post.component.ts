import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatMiniFabButton } from '@angular/material/button';
import {
  DateAdapter,
  MAT_DATE_LOCALE,
  MatOption,
} from '@angular/material/core';
import {
  MatDatepickerIntl,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import { MatIcon } from '@angular/material/icon';
import {
  MatFormField,
  MatInput,
  MatInputModule,
} from '@angular/material/input';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { from, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Singer } from '../../../../../models/singer.model';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { PostsService } from '../../../../services/posts.service';
import { SingersService } from '../../../../services/singers.service';
import 'moment/locale/ar-sa';
// import { HijriGregorianDatepickerModule } from 'angular-hijri-gregorian-datepicker';

import { NgxAngularMaterialHijriAdapterModule } from 'ngx-angular-material-hijri-adapter';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import {
  NgxAngularMaterialHijriAdapterService,
  DateLocaleKeys,
  MOMENT_HIJRI_DATE_FORMATS,
} from 'ngx-angular-material-hijri-adapter';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    MatSelectModule,
    MatSelect,
    MatOption,
    NgxMatSelectSearchModule,
    MatProgressBar,
    MatMiniFabButton,
    MatIcon,
    MatInput,
    MatInputModule,
    MatDatepickerModule,
    MatFormField,
    MatProgressSpinnerModule,
    MatButtonModule,
    // HijriGregorianDatepickerModule,
    NgxAngularMaterialHijriAdapterModule,
  ],
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.css',
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: DateLocaleKeys.AR_SA },
    provideMomentDateAdapter(),
    NgxAngularMaterialHijriAdapterService,
    {
      provide: MAT_DATE_FORMATS,
      useValue: {
        parse: {
          dateInput: 'YYYY/MM/DD',
        },
        display: {
          dateInput: 'YYYY/MM/DD',
          monthYearLabel: 'YYYY MMM',
          dateA11yLabel: 'YYYY/MM/DD',
          monthYearA11yLabel: 'YYYY MMM',
        },
      },
    },
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatePostComponent implements OnInit {
  // Add these properties for singer selection
  singers: Singer[] = [];
  filteredSingers: Singer[] = [];
  isLoadingSingers: boolean = false;
  searchTerm: string = '';
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  data: {
    title: string;
    description?: string;
    lyrics?: string;
    releaseDate?: any;
    releaseDateHijri?: any;
    location?: string;
    event?: string;
    thumbnail?: any;
    singerId: string;
    videos?: {
      title: string;
      videoUrl: string;
      videoType?: string;
      videoSize?: string;
      videoDuration?: string;
      isEditing?: boolean;
    }[];
    audios?: {
      title: string;
      audioUrl: string;
      audioType?: string;
      audioSize?: string;
      audioDuration?: string;
      isEditing?: boolean;
    }[];
  } = {
    title: '',
    singerId: '',
  };

  isStoreLoading: boolean = false;
  selectedVideoFiles: File[] = [];
  selectedAudioFiles: File[] = [];
  isUploading = false;
  uploadProgress = -1;
  uploadingStopped = false;
  currentHijriDate = new Date();

  currentlyUploading: string = '';
  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;

  constructor(
    private postsService: PostsService,
    private alertService: AlertService,
    private authService: AuthService,
    private singersService: SingersService,
    private hijriDateAdapter: NgxAngularMaterialHijriAdapterService
  ) {}

  ngOnInit(): void {
    this.hijriDateAdapter?.setLocale(DateLocaleKeys.AR_SA);
    var currentYear = new Date().getFullYear();
    var currentHijriYear = Math.round((currentYear - 622) * (33 / 32));
    this.currentHijriDate = new Date(
      currentHijriYear,
      new Date().getMonth(),
      new Date().getDate()
    );

    this.initData();

    // Setup debounced search
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchSingers(term);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initData() {
    this.loadSingers();
  }

  // Load initial singers list
  async loadSingers() {
    this.isLoadingSingers = true;
    try {
      const result = await this.singersService.getSingers({
        take: 50,
        skip: 0,
      });
      this.singers = result.data;
      this.filteredSingers = [...this.singers];
    } catch (error: any) {
      this.authService.handleHttpError(error);
      this.alertService.error('Failed to load singers');
    } finally {
      this.isLoadingSingers = false;
    }
  }

  // Method to handle input filtering with debounce
  filterSingers(event: any) {
    if (event?.target?.value !== undefined) {
      this.searchTerm = event.target.value;
      this.searchSubject.next(this.searchTerm);
    }
  }

  // Actual search implementation
  async searchSingers(term: string) {
    this.isLoadingSingers = true;
    try {
      if (!term || term.trim() === '') {
        this.filteredSingers = [...this.singers];
      } else {
        const result = await this.singersService.getSingers({
          take: 20,
          skip: 0,
          search: term,
        });
        this.filteredSingers = result.data;
      }
    } catch (error: any) {
      this.authService.handleHttpError(error);
    } finally {
      this.isLoadingSingers = false;
    }
  }

  // Clear search input
  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.searchTerm = '';
    this.filteredSingers = [...this.singers];
  }

  // Show all results
  showAllSingers() {
    this.filteredSingers = [...this.singers];
  }

  // Clear singer selection
  clearSingerSelection() {
    this.data.singerId = '';
  }

  handleInput(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  /**
   * Utility function to normalize date by removing time component
   * Returns a date string in ISO format but truncated to just the date part (YYYY-MM-DD)
   */
  normalizeDateForSubmission(date: any): string | null {
    if (!date) return null;

    // Convert to Date object if it's not already
    const dateObj = new Date(date);

    // Extract year, month, and day, constructing an ISO date string
    // and cutting off any time information
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Utility function to format a date for display in the date input
   * Returns a date string in the format YYYY-MM-DD
   */
  formatDateForInput(date: any): string {
    if (!date) return '';

    // If we already have a string in the correct format, return it
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    // Convert to Date object if it's not already
    const dateObj = new Date(date);

    // Format as YYYY-MM-DD string for input field
    return dateObj.toISOString().split('T')[0];
  }

  /**
   * Get the formatted release date for the input field
   */
  get formattedReleaseDate(): string {
    return this.formatDateForInput(this.data.releaseDate);
  }

  /**
   * Set the release date from the input field
   */
  set formattedReleaseDate(value: string) {
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      this.data.releaseDate = date;
    } else {
      this.data.releaseDate = null;
    }
  }

  // Process date input change
  onHijriDateChange(event: any): void {
    if (!event?.value) return;

    // Clone the date and set time to midnight
    const date = new Date(event.value);
    date.setHours(0, 0, 0, 0);

    // Update the model
    this.data.releaseDateHijri = date;
    console.log('Hijri date set to:', this.data.releaseDateHijri);
  }

  // Process regular date change
  onDateChange(event: any): void {
    if (!event?.target?.value) {
      this.data.releaseDate = null;
      return;
    }

    // Create a new date at midnight
    const date = new Date(event.target.value);
    date.setHours(0, 0, 0, 0);

    // Update the model with the date object
    this.data.releaseDate = date;
  }

  // Handle thumbnail selection
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

  // Remove selected thumbnail
  removeThumbnail(event: Event): void {
    event.stopPropagation(); // Prevent container click handler
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
  }

  submitData() {
    if (this.isUploading) {
      this.alertService.error('Please wait for the upload to complete');
      return;
    }

    // Create a deep copy of the data to avoid modifying the original
    const submissionData = JSON.parse(JSON.stringify(this.data));

    // Normalize dates to YYYY-MM-DD format without time components
    if (submissionData.releaseDateHijri) {
      submissionData.releaseDateHijri = this.normalizeDateForSubmission(
        submissionData.releaseDateHijri
      );
    }

    if (submissionData.releaseDate) {
      submissionData.releaseDate = this.normalizeDateForSubmission(
        submissionData.releaseDate
      );
    }

    // Create FormData for sending files
    const formData = new FormData();

    // Add all the text fields
    Object.keys(submissionData).forEach((key) => {
      if (key !== 'videos' && key !== 'audios' && key !== 'thumbnail') {
        formData.append(key, submissionData[key]);
      }
    });

    // Add videos and audios as JSON strings
    if (submissionData.videos && submissionData.videos.length > 0) {
      formData.append('videos', JSON.stringify(submissionData.videos));
    }

    if (submissionData.audios && submissionData.audios.length > 0) {
      formData.append('audios', JSON.stringify(submissionData.audios));
    }

    // Add thumbnail if available
    if (this.thumbnailFile) {
      formData.append('thumbnail', this.thumbnailFile, this.thumbnailFile.name);
    }

    this.isStoreLoading = true;
    from(this.postsService.createPostWithFormData(formData)).subscribe({
      next: (res) => {
        this.isStoreLoading = false;
        console.log(res);
        this.alertService.success('Created Successfully');
        window.location.reload();
      },
      error: (err) => {
        this.isStoreLoading = false;
        console.log(err);
        this.authService.handleHttpError(err);
      },
    });
  }

  async onFileSelect(event: Event, type: 'video' | 'audio'): Promise<void> {
    if (this.isUploading) {
      this.alertService.error('Please wait for the upload to complete');
      return;
    }
    const input = event.target as HTMLInputElement;
    if (input.files) {
      console.log('input.files');
      console.log(input.files);
      const selectedFiles = Array.from(input.files);

      try {
        this.isUploading = true;
        for (const file of selectedFiles) {
          const result = await this.uploadFileInChunks(file, type);

          if (type === 'video') {
            this.data.videos = [
              ...(this.data.videos ?? []),
              {
                videoUrl: result.key,
                title: result.name,
                videoSize: Number(file.size / 1024 / 1024)
                  .toFixed(2)
                  .toString() /* MB */,
                isEditing: false,
              },
            ];
          } else {
            this.data.audios = [
              ...(this.data.audios ?? []),
              {
                audioUrl: result.key,
                title: result.name,
                audioSize: Number(file.size / 1024 / 1024)
                  .toFixed(2)
                  .toString() /* MB */,
                isEditing: false,
              },
            ];
          }
        }
        this.isUploading = false;
      } catch (error: any) {
        console.error(`Error uploading ${type}`, error);
        this.alertService.error(`Error uploading ${type}`);
        this.isUploading = false;
        this.uploadProgress = -1;
        this.authService.handleHttpError(error);
      }
    }
  }

  async uploadFileInChunks(
    file: File,
    fileType: 'audio' | 'video'
  ): Promise<any> {
    this.currentlyUploading = file.name;
    const chunkSize = 15 * 1024 * 1024; // 15MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);

    // Initiate the upload
    const response = await this.postsService.initiateUpload(
      file.name,
      file.type,
      fileType
    );
    const { UploadId, Key } = response;

    const parts: { ETag: string; PartNumber: number }[] = [];

    for (let partNumber = 1; partNumber <= totalChunks; partNumber++) {
      if (this.uploadingStopped) {
        this.uploadingStopped = false;
        throw new Error('cancelled');
      }

      const start = (partNumber - 1) * chunkSize;
      const end = Math.min(partNumber * chunkSize, file.size);
      const chunk = file.slice(start, end);

      const { ETag } = await this.postsService.uploadChunk(
        UploadId,
        Key,
        partNumber,
        chunk
      );
      parts.push({ ETag, PartNumber: partNumber });

      this.uploadProgress = (partNumber / totalChunks) * 100;
    }

    // Complete the upload
    await this.postsService.completeUpload(UploadId, Key, parts);
    this.uploadProgress = -1; // Reset progress after upload
    this.currentlyUploading = '';
    return { key: Key, name: file.name };
  }

  cancelUpload() {
    this.uploadingStopped = true;
    this.isUploading = false;
    this.uploadProgress = -1;
    this.currentlyUploading = '';
  }

  startEditingTitle(type: 'video' | 'audio', index: number): void {
    if (type === 'video' && this.data.videos) {
      this.data.videos[index].isEditing = true;
    } else if (type === 'audio' && this.data.audios) {
      this.data.audios[index].isEditing = true;
    }
  }

  finishEditingTitle(type: 'video' | 'audio', index: number): void {
    if (type === 'video' && this.data.videos) {
      const video = this.data.videos[index];
      // Ensure title is not empty
      if (!video.title || video.title.trim() === '') {
        const originalFilename = video.videoUrl.split('/').pop() || 'video';
        video.title = originalFilename;
      }
      video.isEditing = false;
    } else if (type === 'audio' && this.data.audios) {
      const audio = this.data.audios[index];
      // Ensure title is not empty
      if (!audio.title || audio.title.trim() === '') {
        const originalFilename = audio.audioUrl.split('/').pop() || 'audio';
        audio.title = originalFilename;
      }
      audio.isEditing = false;
    }
  }
}
