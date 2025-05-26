import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { MediaControllerService } from '../../services/media-controller.service';
import { Audio } from '../../../models/audio.model';

@Component({
  selector: 'app-custom-audio-player',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatSliderModule,
    MatTooltipModule,
    FormsModule
  ],
  templateUrl: './custom-audio-player.component.html',
  styleUrls: ['./custom-audio-player.component.css'],
})
export class CustomAudioPlayerComponent implements OnInit, OnDestroy {
  @ViewChild('audioPlayer') audioPlayerRef!: ElementRef<HTMLAudioElement>;
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  // Replace individual inputs with Audio model
  @Input() audio!: Audio;

  // Keep non-model related inputs
  @Input() thumbnail: string = '';
  @Input() mediaBaseUrl: string = '';

  // Computed properties based on model
  get src(): string {
    return this.audio && this.mediaBaseUrl ? `${this.mediaBaseUrl}?key=${this.audio.audioUrl}` : '';
  }

  get title(): string {
    return this.audio?.title || '';
  }

  get downloadUrl(): string {
    return this.audio && this.mediaBaseUrl ? `${this.mediaBaseUrl}?key=${this.audio.audioUrl}&download=true` : '';
  }

  get downloadFilename(): string {
    return `${this.title}.mp3`;
  }

  audioPlayer!: HTMLAudioElement;
  isPlaying: boolean = false;
  isMuted: boolean = false;
  volume: number = 100;
  currentTime: number = 0;
  duration: number = 0;
  buffered: number = 0;
  progressValue: number = 0;
  isLoading: boolean = true;
  hasError: boolean = false;
  errorMessage: string = '';
  bufferCheckInterval: any;

  // Visualization
  isVisualizerActive: boolean = false;
  audioContext: AudioContext | null = null;
  analyser: AnalyserNode | null = null;
  dataArray: any = null;
  source: MediaElementAudioSourceNode | null = null;
  canvas: HTMLCanvasElement | null = null;
  canvasContext: CanvasRenderingContext2D | null = null;
  animationFrameId: number | null = null;
  isVisualizerSupported: boolean = typeof window !== 'undefined' && window.AudioContext !== undefined;

  // Add a unique ID for this player and subscription for controller
  private playerId: string = 'audio_' + Math.random().toString(36).substr(2, 9);
  private mediaControllerSubscription: Subscription | null = null;

  constructor(
    private mediaControllerService: MediaControllerService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  // Format time in MM:SS
  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnInit(): void {
    // Subscribe to stop signals
    this.mediaControllerSubscription = this.mediaControllerService.playerStopSignal$
      .subscribe(id => {
        if (id === this.playerId && this.isPlaying) {
          this.pauseAudio();
        }
      });
  }

  ngAfterViewInit(): void {
    this.audioPlayer = this.audioPlayerRef.nativeElement;
    this.setupEventListeners();

    // Initialize canvas reference for visualizer
    if (this.canvasRef) {
      this.canvas = this.canvasRef.nativeElement;
      this.canvasContext = this.canvas.getContext('2d');
    }

    // Set up buffer checking interval
    this.bufferCheckInterval = setInterval(() => {
      this.updateBufferProgress();
    }, 500);
  }

  ngOnDestroy(): void {
    this.removeEventListeners();
    clearInterval(this.bufferCheckInterval);

    // Clean up audio context if active
    if (this.audioContext) {
      this.stopVisualization();
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close();
      }
    }

    if (this.mediaControllerSubscription) {
      this.mediaControllerSubscription.unsubscribe();
    }

    // Ensure we deregister when component is destroyed
    if (this.isPlaying) {
      this.mediaControllerService.deregisterActivePlayer(this.playerId);
    }
  }

  setupEventListeners(): void {
    this.audioPlayer.addEventListener('loadedmetadata', this.onLoadedMetadata.bind(this));
    this.audioPlayer.addEventListener('timeupdate', this.onTimeUpdate.bind(this));
    this.audioPlayer.addEventListener('progress', this.onProgress.bind(this));
    this.audioPlayer.addEventListener('waiting', this.onWaiting.bind(this));
    this.audioPlayer.addEventListener('canplay', this.onCanPlay.bind(this));
    this.audioPlayer.addEventListener('error', this.onError.bind(this));
    this.audioPlayer.addEventListener('ended', this.onEnded.bind(this));
    this.audioPlayer.addEventListener('seeking', this.onSeeking.bind(this));
    this.audioPlayer.addEventListener('seeked', this.onSeeked.bind(this));
  }

  removeEventListeners(): void {
    if (this.audioPlayer) {
      this.audioPlayer.removeEventListener('loadedmetadata', this.onLoadedMetadata);
      this.audioPlayer.removeEventListener('timeupdate', this.onTimeUpdate);
      this.audioPlayer.removeEventListener('progress', this.onProgress);
      this.audioPlayer.removeEventListener('waiting', this.onWaiting);
      this.audioPlayer.removeEventListener('canplay', this.onCanPlay);
      this.audioPlayer.removeEventListener('error', this.onError);
      this.audioPlayer.removeEventListener('ended', this.onEnded);
      this.audioPlayer.removeEventListener('seeking', this.onSeeking);
      this.audioPlayer.removeEventListener('seeked', this.onSeeked);
    }
  }

  // Event handlers
  onLoadedMetadata(): void {
    this.duration = this.audioPlayer.duration;
    this.updateBufferProgress();
  }

  onTimeUpdate(): void {
    this.currentTime = this.audioPlayer.currentTime;
    this.progressValue = this.duration ? (this.currentTime / this.duration) * 100 : 0;

    // Trigger change detection to update the UI
    this.cdr.detectChanges();
  }

  onProgress(): void {
    this.updateBufferProgress();
  }

  updateBufferProgress(): void {
    if (!this.audioPlayer || !this.audioPlayer.buffered || this.audioPlayer.buffered.length === 0) return;

    // Find the appropriate buffered range for current playback position
    for (let i = 0; i < this.audioPlayer.buffered.length; i++) {
      const start = this.audioPlayer.buffered.start(i);
      const end = this.audioPlayer.buffered.end(i);

      // If current time is within this buffer range
      if (this.audioPlayer.currentTime >= start && this.audioPlayer.currentTime <= end) {
        this.buffered = (end / this.audioPlayer.duration) * 100;
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

    switch (this.audioPlayer.error?.code) {
      case 1:
        this.errorMessage = 'Audio loading aborted';
        break;
      case 2:
        this.errorMessage = 'Network error occurred';
        break;
      case 3:
        this.errorMessage = 'Error decoding audio';
        break;
      case 4:
        this.errorMessage = 'Audio not supported';
        break;
      default:
        this.errorMessage = 'An unknown error occurred';
    }
  }

  onEnded(): void {
    this.isPlaying = false;
    this.mediaControllerService.deregisterActivePlayer(this.playerId);
  }

  // Controls handling
  togglePlay(): void {
    if (this.audioPlayer.paused) {
      // Register as active player before playing
      this.mediaControllerService.registerActivePlayer(this.playerId);
      this.audioPlayer.play();
      this.isPlaying = true;

      // Start visualization if enabled
      if (this.isVisualizerActive && this.isVisualizerSupported) {
        this.setupVisualization();
      }
    } else {
      this.pauseAudio();
    }
  }

  // New helper method to pause audio and deregister
  private pauseAudio(): void {
    this.audioPlayer.pause();
    this.isPlaying = false;
    this.mediaControllerService.deregisterActivePlayer(this.playerId);

    if (this.isVisualizerActive) {
      this.pauseVisualization();
    }
  }

  stop(): void {
    this.audioPlayer.pause();
    this.audioPlayer.currentTime = 0;
    this.isPlaying = false;

    if (this.isVisualizerActive) {
      this.pauseVisualization();
    }
  }

  restart(): void {
    this.audioPlayer.currentTime = 0;
  }

  forward10s(): void {
    this.audioPlayer.currentTime = Math.min(
      this.audioPlayer.duration,
      this.audioPlayer.currentTime + 10
    );
  }

  backward10s(): void {
    this.audioPlayer.currentTime = Math.max(
      0,
      this.audioPlayer.currentTime - 10
    );
  }

  toggleMute(): void {
    this.audioPlayer.muted = !this.audioPlayer.muted;
    this.isMuted = this.audioPlayer.muted;
  }

  setVolume(value: number): void {
    this.volume = value;
    this.audioPlayer.volume = value / 100;

    // Update mute state based on volume
    this.isMuted = value === 0;
    this.audioPlayer.muted = this.isMuted;
  }

  seek(value: number): void {
    if (this.duration > 0) {
      this.audioPlayer.currentTime = (value / 100) * this.duration;

      // Clear buffered amount for immediate visual feedback
      this.buffered = 0;

      // Trigger an immediate check for buffer after seeking
      setTimeout(() => {
        this.updateBufferProgress();
      }, 100);
    }
  }

  toggleVisualizer(): void {
    if (!this.isVisualizerSupported) return;

    this.isVisualizerActive = !this.isVisualizerActive;

    if (this.isVisualizerActive && this.isPlaying) {
      this.setupVisualization();
    } else {
      this.stopVisualization();
    }
  }

  setupVisualization(): void {
    if (!this.isVisualizerSupported || !this.audioPlayer || !this.canvas || this.audioContext) return;

    try {
      // Set up audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaElementSource(this.audioPlayer);

      // Connect the source to the analyser and the analyser to the destination
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      // Set up the analyser
      this.analyser.fftSize = 128; // Lower value for better performance
      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Start the visualization
      this.drawVisualization();
    } catch (e) {
      console.error('Error setting up visualizer', e);
      this.isVisualizerActive = false;
    }
  }

  pauseVisualization(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  stopVisualization(): void {
    this.pauseVisualization();

    if (this.canvas && this.canvasContext) {
      // Clear the canvas
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Reset audio context and analyser
    if (this.source) {
      try {
        this.source.disconnect();
      } catch (e) {
        console.error('Error disconnecting source', e);
      }
      this.source = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {
        console.error('Error disconnecting analyser', e);
      }
      this.analyser = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close().catch(e => console.error('Error closing audio context', e));
      } catch (e) {
        console.error('Error closing audio context', e);
      }
      this.audioContext = null;
    }

    this.dataArray = null;
  }

  drawVisualization(): void {
    if (!this.analyser || !this.canvas || !this.canvasContext || !this.dataArray) return;

    // Get canvas dimensions
    const WIDTH = this.canvas.width;
    const HEIGHT = this.canvas.height;

    // Schedule the next animation frame
    this.animationFrameId = requestAnimationFrame(this.drawVisualization.bind(this));

    // Get the frequency data
    this.analyser.getByteFrequencyData(this.dataArray);

    // Clear the canvas
    this.canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

    // Set background
    this.canvasContext.fillStyle = '#1e1e1e';
    this.canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

    // Calculate the width of each bar
    const bufferLength = this.dataArray.length;
    const barWidth = (WIDTH / bufferLength) * 0.8; // Add some spacing between bars
    let x = 0;

    // Draw the bars
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = (this.dataArray[i] / 255) * HEIGHT;

      // Create a gradient for the bar
      const gradient = this.canvasContext.createLinearGradient(
        0, HEIGHT - barHeight, 0, HEIGHT
      );
      gradient.addColorStop(0, '#90EE90'); // Light green
      gradient.addColorStop(1, '#006400'); // Dark green

      this.canvasContext.fillStyle = gradient;
      this.canvasContext.fillRect(
        x, HEIGHT - barHeight,
        barWidth, barHeight
      );

      x += barWidth + 1; // Add 1px spacing between bars
    }
  }
}
