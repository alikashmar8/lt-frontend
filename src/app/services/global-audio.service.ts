import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Audio as AudioModel } from '../../models/audio.model';
import { mediaUrl } from '../../constants/api-constants';

@Injectable({
  providedIn: 'root',
})
export class GlobalAudioService {
  private audioElement: HTMLAudioElement | null = null;
  private currentAudioSubject = new BehaviorSubject<AudioModel | null>(null);
  public currentAudio$ = this.currentAudioSubject.asObservable();

  private isPlayingSubject = new BehaviorSubject<boolean>(false);
  private currentTimeSubject = new BehaviorSubject<number>(0);
  private durationSubject = new BehaviorSubject<number>(0);

  public isPlaying$ = this.isPlayingSubject.asObservable();
  public currentTime$ = this.currentTimeSubject.asObservable();
  public duration$ = this.durationSubject.asObservable();

  constructor() {
    if (typeof Audio != 'undefined') {
      // Browser-only code
      this.audioElement = new Audio();
    }

    if (this.audioElement) {
      this.audioElement.addEventListener('play', () => {
        console.log('"play" event: Audio started playing');
        this.isPlayingSubject.next(true);
      });
      this.audioElement.addEventListener('pause', () => {
        console.log('"pause" event: Audio paused');
        this.isPlayingSubject.next(false);
      });
      this.audioElement.addEventListener('timeupdate', () => {
        this.currentTimeSubject.next(this.audioElement?.currentTime || 0);
      });
      this.audioElement.addEventListener('loadedmetadata', () => {
        this.updateDuration();
      });
      this.audioElement.addEventListener('durationchange', () => {
        this.updateDuration();
      });

      // Fallback mechanism to periodically check duration
      // setInterval(() => {
      //   if (this.audioElement?.duration && this.audioElement.duration > 0) {
      //     this.updateDuration();
      //   }
      // }, 1000);
    }
  }

  private updateDuration(): void {
    const duration = this.audioElement?.duration || 0;
    this.durationSubject.next(duration);
  }

  playAudio(audio: AudioModel): void {
    if (!this.audioElement) return;
    this.audioElement.src = `${mediaUrl}?key=${audio.audioUrl}`;
    this.audioElement.play();
    this.currentAudioSubject.next(audio);
  }

  togglePlay(isPlaying: boolean): void {
    if (!this.audioElement) return;
    if (isPlaying) {
      this.audioElement.play();
    } else {
      this.audioElement.pause();
    }
  }

  seek(value: number): void {
    if (!this.audioElement) return;
    this.audioElement.currentTime = value;
    this.currentTimeSubject.next(value);
  }

  setVolume(value: number): void {
    if (!this.audioElement) return;
    this.audioElement.volume = value / 100;
  }

  getDuration(): number {
    return this.audioElement?.duration || 0;
  }
}
