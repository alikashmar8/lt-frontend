import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MediaControllerService } from '../../services/media-controller.service';
import { Video } from '../../../models/video.model';

@Component({
  selector: 'app-custom-video-player',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatSliderModule, MatTooltipModule, FormsModule],
  templateUrl: './custom-video-player.component.html',
  styleUrls: ['./custom-video-player.component.css']
})
export class CustomVideoPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('videoPlayer') videoPlayerRef!: ElementRef<HTMLVideoElement>;
  @ViewChild('videoContainer') videoContainerRef!: ElementRef<HTMLDivElement>;

  // Replace individual inputs with Video model
  @Input() video!: Video;

  // Keep non-model related inputs
  @Input() mediaBaseUrl: string = '';

  // Computed properties based on model
  get src(): string {
    return this.video && this.mediaBaseUrl ? `${this.mediaBaseUrl}?key=${this.video.videoUrl}` : '';
  }

  get title(): string {
    return this.video?.title || '';
  }

  get downloadUrl(): string {
    return this.video && this.mediaBaseUrl ? `${this.mediaBaseUrl}?key=${this.video.videoUrl}&download=true` : '';
  }

  get downloadFilename(): string {
    return `${this.title}.mp4`;
  }

  videoPlayer!: HTMLVideoElement;
  isPlaying: boolean = false;
  isMuted: boolean = false;
  isFullscreen: boolean = false;
  volume: number = 100;
  currentTime: number = 0;
  duration: number = 0;
  buffered: number = 0;
  progressValue: number = 0;
  showControls: boolean = true;
  hideControlsTimeout: any;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  bufferCheckInterval: any;

  private playerId: string = 'video_' + Math.random().toString(36).substr(2, 9);
  private mediaControllerSubscription: Subscription | null = null;

  constructor(private mediaControllerService: MediaControllerService) {}

  // Format time in MM:SS
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    // Initialization logic is handled in ngAfterViewInit

    // Subscribe to stop signals
    this.mediaControllerSubscription = this.mediaControllerService.playerStopSignal$
      .subscribe(id => {
        if (id === this.playerId && this.isPlaying) {
          this.pauseVideo();
        }
      });
  }

  ngAfterViewInit(): void {
    this.videoPlayer = this.videoPlayerRef.nativeElement;
    this.setupEventListeners();

    // Set up buffer checking interval
    this.bufferCheckInterval = setInterval(() => {
      this.updateBufferProgress();
    }, 500);
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
    clearTimeout(this.hideControlsTimeout);
    clearInterval(this.bufferCheckInterval);

    if (this.mediaControllerSubscription) {
      this.mediaControllerSubscription.unsubscribe();
    }

    // Ensure we deregister when component is destroyed
    if (this.isPlaying) {
      this.mediaControllerService.deregisterActivePlayer(this.playerId);
    }
  }

  setupEventListeners(): void {
    this.videoPlayer.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
    this.videoPlayer.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    this.videoPlayer.addEventListener('progress', this.onProgress.bind(this));
    this.videoPlayer.addEventListener('waiting', this.onWaiting.bind(this));
    this.videoPlayer.addEventListener('canplay', this.onCanPlay.bind(this));
    this.videoPlayer.addEventListener('error', this.onError.bind(this));
    this.videoPlayer.addEventListener('ended', this.onEnded.bind(this));
    this.videoPlayer.addEventListener('seeking', this.onSeeking.bind(this));
    this.videoPlayer.addEventListener('seeked', this.onSeeked.bind(this));

    // Mouse movement for showing/hiding controls
    this.videoContainerRef.nativeElement.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.videoContainerRef.nativeElement.addEventListener('mouseleave', this.scheduleHideControls.bind(this));
  }

  removeEventListeners(): void {
    if (this.videoPlayer) {
      this.videoPlayer.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      this.videoPlayer.removeEventListener('timeupdate', this.onTimeUpdate);
      this.videoPlayer.removeEventListener('progress', this.onProgress);
      this.videoPlayer.removeEventListener('waiting', this.onWaiting);
      this.videoPlayer.removeEventListener('canplay', this.onCanPlay);
      this.videoPlayer.removeEventListener('error', this.onError);
      this.videoPlayer.removeEventListener('ended', this.onEnded);
      this.videoPlayer.removeEventListener('seeking', this.onSeeking);
      this.videoPlayer.removeEventListener('seeked', this.onSeeked);
    }

    if (this.videoContainerRef?.nativeElement) {
      this.videoContainerRef.nativeElement.removeEventListener('mousemove', this.onMouseMove);
      this.videoContainerRef.nativeElement.removeEventListener('mouseleave', this.scheduleHideControls);
    }
  }

  // Event handlers
  onLoadedMetadata(): void {
    this.duration = this.videoPlayer.duration;
    this.updateBufferProgress();
  }

  onTimeUpdate(): void {
    this.currentTime = this.videoPlayer.currentTime;
    this.progressValue = this.duration ? (this.currentTime / this.duration) * 100 : 0;
  }

  onProgress(): void {
    this.updateBufferProgress();
  }

  updateBufferProgress(): void {
    if (!this.videoPlayer || !this.videoPlayer.buffered || this.videoPlayer.buffered.length === 0) return;

    // Find the appropriate buffered range for current playback position
    for (let i = 0; i < this.videoPlayer.buffered.length; i++) {
      const start = this.videoPlayer.buffered.start(i);
      const end = this.videoPlayer.buffered.end(i);

      // If current time is within this buffer range
      if (this.videoPlayer.currentTime >= start && this.videoPlayer.currentTime <= end) {
        this.buffered = (end / this.videoPlayer.duration) * 100;
        break;
      }
    }
  }

  onWaiting(): void {
    this.isLoading = true;
  }

  onCanPlay(): void {
    this.isLoading = false;
    this.updateBufferProgress();
  }

  onSeeking(): void {
    this.isLoading = true;
  }

  onSeeked(): void {
    this.isLoading = false;
    this.updateBufferProgress();
  }

  onError(): void {
    this.hasError = true;
    this.isLoading = false;

    switch (this.videoPlayer.error?.code) {
      case 1:
        this.errorMessage = 'Video loading aborted';
        break;
      case 2:
        this.errorMessage = 'Network error occurred';
        break;
      case 3:
        this.errorMessage = 'Error decoding video';
        break;
      case 4:
        this.errorMessage = 'Video not supported';
        break;
      default:
        this.errorMessage = 'An unknown error occurred';
    }
  }

  onEnded(): void {
    this.isPlaying = false;
    this.mediaControllerService.deregisterActivePlayer(this.playerId);
  }

  onMouseMove(): void {
    this.showControls = true;
    this.scheduleHideControls();
  }

  // Controls handling
  scheduleHideControls(): void {
    clearTimeout(this.hideControlsTimeout);
    this.hideControlsTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.showControls = false;
      }
    }, 3000);
  }

  togglePlay(): void {
    if (this.videoPlayer.paused) {
      // Register as active player before playing
      this.mediaControllerService.registerActivePlayer(this.playerId);
      this.videoPlayer.play();
      this.isPlaying = true;
      this.scheduleHideControls();
    } else {
      this.pauseVideo();
    }
  }

  private pauseVideo(): void {
    this.videoPlayer.pause();
    this.isPlaying = false;
    this.showControls = true;
    this.mediaControllerService.deregisterActivePlayer(this.playerId);
  }

  stop(): void {
    this.videoPlayer.pause();
    this.videoPlayer.currentTime = 0;
    this.isPlaying = false;
    this.showControls = true;
  }

  restart(): void {
    this.videoPlayer.currentTime = 0;
    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  forward10s(): void {
    this.videoPlayer.currentTime = Math.min(this.videoPlayer.duration, this.videoPlayer.currentTime + 10);
    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  backward10s(): void {
    this.videoPlayer.currentTime = Math.max(0, this.videoPlayer.currentTime - 10);
    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  toggleMute(): void {
    this.videoPlayer.muted = !this.videoPlayer.muted;
    this.isMuted = this.videoPlayer.muted;
    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  setVolume(value: number): void {
    this.volume = value;
    this.videoPlayer.volume = value / 100;

    // Update mute state based on volume
    this.isMuted = value === 0;
    this.videoPlayer.muted = this.isMuted;

    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  seek(value: number): void {
    if (this.duration > 0) {
      this.videoPlayer.currentTime = (value / 100) * this.duration;

      // Clear buffered amount for immediate visual feedback
      this.buffered = 0;

      // Trigger an immediate check for buffer after seeking
      setTimeout(() => {
        this.updateBufferProgress();
      }, 100);

      if (!this.videoPlayer.paused) {
        this.scheduleHideControls();
      }
    }
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      this.videoContainerRef.nativeElement.requestFullscreen()
        .then(() => {
          this.isFullscreen = true;
        })
        .catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
      document.exitFullscreen()
        .then(() => {
          this.isFullscreen = false;
        })
        .catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
    }

    if (!this.videoPlayer.paused) {
      this.scheduleHideControls();
    }
  }

  handleDownload(): void {
    // The download will be handled by the browser via the download attribute in the template
  }
}
