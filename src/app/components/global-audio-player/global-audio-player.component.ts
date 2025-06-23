import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { Subscription } from 'rxjs';
import { Audio } from '../../../models/audio.model';
import { GlobalAudioService } from '../../services/global-audio.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-global-audio-player',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSliderModule,
    FormsModule,
  ],
  templateUrl: './global-audio-player.component.html',
  styleUrls: ['./global-audio-player.component.css'],
})
export class GlobalAudioPlayerComponent implements OnInit, OnDestroy {
  currentAudio: Audio | null = null;
  isPlaying = false;
  currentTime = 0;
  duration = 0;
  volume = 100;
  private subscriptions: Subscription[] = [];

  constructor(
    private globalAudioService: GlobalAudioService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.globalAudioService.currentAudio$.subscribe((audio) => {
        this.currentAudio = audio;
        // this.isPlaying = false;
        this.currentTime = 0;
        this.cdr.detectChanges(); // Trigger change detection
      }),
      this.globalAudioService.isPlaying$.subscribe((isPlaying) => {
        console.log('Audio subscriber: is playing:', isPlaying);

        this.isPlaying = isPlaying;
        this.cdr.detectChanges(); // Trigger change detection
      }),
      this.globalAudioService.currentTime$.subscribe((time) => {
        this.currentTime = time;
        this.cdr.detectChanges(); // Trigger change detection
      }),
      this.globalAudioService.duration$.subscribe((dur) => {
        this.duration = dur;
        console.log('Audio subscriber: duration:', dur);
        this.cdr.detectChanges(); // Trigger change detection
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  togglePlay(): void {
    this.globalAudioService.togglePlay(!this.isPlaying);
  }

  seek(value: number): void {
    console.log('value');
    console.log(value);
    // const duration = this.globalAudioService.getDuration();

    // this.duration = this.globalAudioService.getDuration();
    // console.log('init this.duration');
    // console.log(this.duration);

    console.log('duration');
    console.log(this.duration);
    if (this.duration > 0) {
      // const newTime = (value / 100) * this.duration; // Calculate the correct time based on the slider value
      this.globalAudioService.seek(value);
    }
  }

  setVolume(value: number): void {
    this.volume = value;
    this.globalAudioService.setVolume(value);
  }

  formatTime(seconds: number): string {
    if (isNaN(seconds)) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
