import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideMomentDateAdapter } from '@angular/material-moment-adapter';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { NgxAngularMaterialHijriAdapterModule, NgxAngularMaterialHijriAdapterService, DateLocaleKeys } from 'ngx-angular-material-hijri-adapter';
import { from, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Post } from '../../../../../models/post.model';
import { Singer } from '../../../../../models/singer.model';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { PostsService } from '../../../../services/posts.service';
import { SingersService } from '../../../../services/singers.service';
import 'moment/locale/ar-sa';

@Component({
  selector: 'app-update-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatSelectModule,
    MatOptionModule,
    MatDatepickerModule,
    NgxMatSelectSearchModule,
    NgxAngularMaterialHijriAdapterModule
  ],
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
  templateUrl: './update-post.component.html',
  styleUrls: ['./update-post.component.css']
})
export class UpdatePostComponent implements OnInit, OnDestroy {
  post: Post | null = null;
  isLoading = true;
  isSubmitting = false;
  postId: string | null = null;
  currentHijriDate = new Date();

  // Singers dropdown
  singers: Singer[] = [];
  filteredSingers: Singer[] = [];
  isLoadingSingers = false;
  searchTerm: string = '';

  // Upload tracking
  isUploading = false;
  uploadProgress = -1;
  uploadingStopped = false;
  currentlyUploading: string = '';

  // Form data
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
      id?: string;
      title: string;
      videoUrl: string;
      videoType?: string;
      videoSize?: string;
      videoDuration?: string;
      isEditing?: boolean;
    }[];
    audios?: {
      id?: string;
      title: string;
      audioUrl: string;
      audioType?: string;
      audioSize?: string;
      audioDuration?: string;
      isEditing?: boolean;
    }[];
    removedVideos?: string[];
    removedAudios?: string[];
  } = {
    title: '',
    singerId: '',
    videos: [],
    audios: [],
    removedVideos: [],
    removedAudios: []
  };

  thumbnailFile: File | null = null;
  thumbnailPreview: string | null = null;
  thumbnailChanged = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(
    private postsService: PostsService,
    private singersService: SingersService,
    private alertService: AlertService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private hijriDateAdapter: NgxAngularMaterialHijriAdapterService
  ) {}

  ngOnInit(): void {
    this.hijriDateAdapter?.setLocale(DateLocaleKeys.AR_SA);

    // Set current Hijri date
    const currentYear = new Date().getFullYear();
    const currentHijriYear = Math.round((currentYear - 622) * (33 / 32));
    this.currentHijriDate = new Date(
      currentHijriYear,
      new Date().getMonth(),
      new Date().getDate()
    );

    // Setup search with debounce
    this.searchSubject
      .pipe(debounceTime(300), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.searchSingers(term);
      });

    // Load singers first
    this.loadSingers().then(() => {
      // Then load post data after singers are loaded
      this.route.paramMap.subscribe(params => {
        this.postId = params.get('id');
        if (this.postId) {
          this.loadPostData(this.postId);
        } else {
          this.alertService.error('Post ID is missing');
          this.router.navigate(['/admin/latmeyyat']);
          this.isLoading = false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadSingers(): Promise<void> {
    this.isLoadingSingers = true;
    try {
      const result = await this.singersService.getSingers({
        take: 100,
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

  async loadPostData(id: string): Promise<void> {
    try {
      const post = await this.postsService.getPost(id);
      this.post = post;

      // Copy post data to form
      this.data = {
        ...this.data,
        title: post.title,
        description: post.description,
        lyrics: post.lyrics,
        releaseDate: post.releaseDate ? new Date(post.releaseDate) : undefined,
        releaseDateHijri: post.releaseDateHijri ? new Date(post.releaseDateHijri) : undefined,
        location: post.location,
        event: post.event,
        singerId: post.singerId,
        videos: post.videos?.map(v => ({
          id: v.id,
          title: v.title,
          videoUrl: v.videoUrl,
          videoType: v.videoType,
          videoSize: v.videoSize,
          videoDuration: v.videoDuration,
          isEditing: false // Add editing flag
        })) || [],
        audios: post.audios?.map(a => ({
          id: a.id,
          title: a.title,
          audioUrl: a.audioUrl,
          audioType: a.audioType,
          audioSize: a.audioSize,
          audioDuration: a.audioDuration,
          isEditing: false // Add editing flag
        })) || [],
        removedVideos: [],
        removedAudios: []
      };

      if (post.thumbnail) {
        this.thumbnailPreview = post.thumbnail;
      }
    } catch (error: any) {
      this.authService.handleHttpError(error);
      this.alertService.error('Failed to load post data');
      this.router.navigate(['/admin/latmeyyat']);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Utility function to normalize date by removing time component
   */
  normalizeDateForSubmission(date: any): string | null {
    if (!date) return null;

    // Convert to Date object if it's not already
    const dateObj = new Date(date);

    // Extract year, month, and day
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const day = dateObj.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  /**
   * Format date for input field
   */
  formatDateForInput(date: any): string {
    if (!date) return '';

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const dateObj = new Date(date);
    return dateObj.toISOString().split('T')[0];
  }

  get formattedReleaseDate(): string {
    return this.formatDateForInput(this.data.releaseDate);
  }

  set formattedReleaseDate(value: string) {
    if (value) {
      const date = new Date(value);
      date.setHours(0, 0, 0, 0);
      this.data.releaseDate = date;
    } else {
      this.data.releaseDate = null;
    }
  }

  onHijriDateChange(event: any): void {
    if (!event?.value) return;

    const date = new Date(event.value);
    date.setHours(0, 0, 0, 0);
    this.data.releaseDateHijri = date;
  }

  onDateChange(event: any): void {
    if (!event?.target?.value) {
      this.data.releaseDate = null;
      return;
    }

    const date = new Date(event.target.value);
    date.setHours(0, 0, 0, 0);
    this.data.releaseDate = date;
  }

  // SINGER SELECTION METHODS
  filterSingers(event: any) {
    if (event?.target?.value !== undefined) {
      this.searchTerm = event.target.value;
      this.searchSubject.next(this.searchTerm);
    }
  }

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

  clearSearch(input: HTMLInputElement) {
    input.value = '';
    this.searchTerm = '';
    this.filteredSingers = [...this.singers];
  }

  showAllSingers() {
    this.filteredSingers = [...this.singers];
  }

  clearSingerSelection() {
    this.data.singerId = '';
  }

  handleInput(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  // THUMBNAIL METHODS
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
      this.thumbnailChanged = true;

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
    this.thumbnailPreview = this.post?.thumbnail || null;
    this.thumbnailChanged = false;
  }

  removeThumbnailCompletely(event: Event): void {
    event.stopPropagation();
    this.thumbnailFile = null;
    this.thumbnailPreview = null;
    this.thumbnailChanged = true;
  }

  // MEDIA FILE METHODS
  async onFileSelect(event: Event, type: 'video' | 'audio'): Promise<void> {
    if (this.isUploading) {
      this.alertService.error('Please wait for the upload to complete');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files) {
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
                isEditing: false // Add editing flag
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
                isEditing: false // Add editing flag
              },
            ];
          }
        }
      } catch (error: any) {
        console.error(`Error uploading ${type}`, error);
        this.alertService.error(`Error uploading ${type}`);
        this.authService.handleHttpError(error);
      } finally {
        this.isUploading = false;
        this.uploadProgress = -1;
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
    this.uploadProgress = -1;
    this.currentlyUploading = '';

    return { key: Key, name: file.name };
  }

  cancelUpload() {
    this.uploadingStopped = true;
    this.isUploading = false;
    this.uploadProgress = -1;
    this.currentlyUploading = '';
  }

  removeMedia(type: 'video' | 'audio', index: number): void {
    if (type === 'video') {
      const video = this.data.videos?.[index];
      if (video?.id) {
        this.data.removedVideos?.push(video.id);
      }

      // Remove from array
      const updatedVideos = [...(this.data.videos || [])];
      updatedVideos.splice(index, 1);
      this.data.videos = updatedVideos;
    } else {
      const audio = this.data.audios?.[index];
      if (audio?.id) {
        this.data.removedAudios?.push(audio.id);
      }

      // Remove from array
      const updatedAudios = [...(this.data.audios || [])];
      updatedAudios.splice(index, 1);
      this.data.audios = updatedAudios;
    }
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

  submitData() {
    if (this.isUploading) {
      this.alertService.error('Please wait for the upload to complete');
      return;
    }

    if (!this.data.title || !this.data.singerId) {
      this.alertService.error('Title and Radood are required');
      return;
    }

    if ((!this.data.videos || this.data.videos.length === 0) &&
        (!this.data.audios || this.data.audios.length === 0)) {
      this.alertService.error('At least one audio or video file is required');
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
      if (key !== 'videos' && key !== 'audios' && key !== 'thumbnail' &&
          key !== 'removedVideos' && key !== 'removedAudios') {
        formData.append(key, submissionData[key]);
      }
    });

    // Add videos and audios as JSON strings
    if (submissionData.videos && submissionData.videos.length > 0) {
      formData.append('videos', JSON.stringify(submissionData.videos));
    } else {
      formData.append('videos', JSON.stringify([]));
    }

    if (submissionData.audios && submissionData.audios.length > 0) {
      formData.append('audios', JSON.stringify(submissionData.audios));
    } else {
      formData.append('audios', JSON.stringify([]));
    }

    // Add removed media IDs
    if (submissionData.removedVideos && submissionData.removedVideos.length > 0) {
      formData.append('removedVideos', JSON.stringify(submissionData.removedVideos));
    }

    if (submissionData.removedAudios && submissionData.removedAudios.length > 0) {
      formData.append('removedAudios', JSON.stringify(submissionData.removedAudios));
    }

    // Add thumbnail if changed
    if (this.thumbnailChanged) {
      if (this.thumbnailFile) {
        formData.append('thumbnail', this.thumbnailFile, this.thumbnailFile.name);
      } else if (this.thumbnailPreview === null) {
        // If thumbnail was completely removed
        formData.append('removeThumbnail', 'true');
      }
    }

    this.isSubmitting = true;
    from(this.postsService.updatePost(this.postId!, formData)).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        this.alertService.success('Updated Successfully');
        this.router.navigate(['/admin/latmeyyat', this.postId]);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        this.authService.handleHttpError(err);
      }
    });
  }

  resetForm(): void {
    if (this.post) {
      // Reset form data to original post data
      this.loadPostData(this.postId!);
      this.thumbnailFile = null;
      this.thumbnailChanged = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/latmeyyat']);
  }
}
