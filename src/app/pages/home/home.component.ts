import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subscription
} from 'rxjs';

import { mediaUrl } from '../../../constants/api-constants';
import { Audio } from '../../../models/audio.model';
import { Singer } from '../../../models/singer.model';
import { CustomAudioPlayerComponent } from '../../components/custom-audio-player/custom-audio-player.component';
import { AudiosService } from '../../services/audios.service';
import { GlobalAudioService } from '../../services/global-audio.service';
import { MediaControllerService } from '../../services/media-controller.service';
import { PostsService } from '../../services/posts.service';
import { SingersService } from '../../services/singers.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule,
    CustomAudioPlayerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('randomAudiosContainer') randomAudiosContainer!: ElementRef;
  @ViewChild('topAudiosContainer') topAudiosContainer!: ElementRef;
  @ViewChild('randomSingersContainer') randomSingersContainer!: ElementRef;
  @ViewChild('recentAudiosContainer') recentAudiosContainer!: ElementRef;

  mediaUrl = mediaUrl;
  searchTerm: string = '';

  // Content Collections
  randomAudios: Audio[] = [];
  topAudios: Audio[] = [];
  randomSingers: Singer[] = [];
  recentAudios: Audio[] = [];

  // Loading states
  isLoadingRandomAudios = true;
  isLoadingTopAudios = true;
  isLoadingRandomSingers = true;
  isLoadingRecentAudios = true;

  // Pagination
  randomAudiosPage = 1;
  topAudiosPage = 1;
  randomSingersPage = 1;
  recentAudiosPage = 1;

  // Determine if more content can be loaded
  hasMoreRandomAudios = true;
  hasMoreTopAudios = true;
  hasMoreRandomSingers = true;
  hasMoreRecentAudios = true;

  // Track current playing audio for continuous playback
  currentPlayingAudio: Audio | null = null;
  currentPlayingIndex = -1;
  currentPlayingSection: 'random' | 'top' | 'recent' = 'random';
  autoplayEnabled = true;

  private subscriptions: Subscription[] = [];

  constructor(
    private postsService: PostsService,
    private singersService: SingersService,
    private audiosService: AudiosService,
    private mediaControllerService: MediaControllerService,
    private router: Router,
    public globalAudioService: GlobalAudioService
  ) {}

  ngOnInit(): void {
    this.loadRandomAudios();
    this.loadTopAudios();
    this.loadRandomSingers();
    this.loadRecentAudios();

    // Set up subscription for audio ended event to enable autoplay
    this.subscriptions.push(
      this.mediaControllerService.activePlayerId$.subscribe((id) => {
        // When a player becomes inactive (null), check if autoplay is needed
        if (id === null && this.autoplayEnabled && this.currentPlayingAudio) {
          this.playNextAudio();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  // Content loading methods
  loadRandomAudios(reset: boolean = false): void {
    if (reset) {
      this.randomAudiosPage = 1;
      this.randomAudios = [];
      this.hasMoreRandomAudios = true;
    }

    if (!this.hasMoreRandomAudios) return;

    this.isLoadingRandomAudios = true;
    this.audiosService
      .listAudios({
        take: 10,
        skip: (this.randomAudiosPage - 1) * 10,
        random: true,
      })
      .then((result) => {
        this.randomAudios = [...this.randomAudios, ...result.data];
        this.hasMoreRandomAudios = result.hasMore;
        this.randomAudiosPage++;
      })
      .catch((err) => console.error('Error loading random audios', err))
      .finally(() => (this.isLoadingRandomAudios = false));
  }

  loadTopAudios(reset: boolean = false): void {
    if (reset) {
      this.topAudiosPage = 1;
      this.topAudios = [];
      this.hasMoreTopAudios = true;
    }

    if (!this.hasMoreTopAudios) return;

    this.isLoadingTopAudios = true;
    this.audiosService
      .listAudios({
        take: 10,
        skip: (this.topAudiosPage - 1) * 10,
        orderBy: 'plays',
        order: 'DESC',
      })
      .then((result) => {
        this.topAudios = [...this.topAudios, ...result.data];
        this.hasMoreTopAudios = result.hasMore;
        this.topAudiosPage++;
      })
      .catch((err) => console.error('Error loading top audios', err))
      .finally(() => (this.isLoadingTopAudios = false));
  }

  loadRandomSingers(reset: boolean = false): void {
    if (reset) {
      this.randomSingersPage = 1;
      this.randomSingers = [];
      this.hasMoreRandomSingers = true;
    }

    if (!this.hasMoreRandomSingers) return;

    this.isLoadingRandomSingers = true;
    this.singersService
      .getSingers({
        take: 10,
        skip: (this.randomSingersPage - 1) * 10,
        random: true,
      })
      .then((result) => {
        this.randomSingers = [...this.randomSingers, ...result.data];
        this.randomSingersPage++;
      })
      .catch((err) => console.error('Error loading random singers', err))
      .finally(() => (this.isLoadingRandomSingers = false));
  }

  loadRecentAudios(reset: boolean = false): void {
    if (reset) {
      this.recentAudiosPage = 1;
      this.recentAudios = [];
      this.hasMoreRecentAudios = true;
    }

    if (!this.hasMoreRecentAudios) return;

    this.isLoadingRecentAudios = true;
    this.audiosService
      .listAudios({
        take: 10,
        skip: (this.recentAudiosPage - 1) * 10,
        orderBy: 'createdAt',
        order: 'DESC',
      })
      .then((result) => {
        this.recentAudios = [...this.recentAudios, ...result.data];
        this.hasMoreRecentAudios = result.hasMore;
        this.recentAudiosPage++;
      })
      .catch((err) => console.error('Error loading recent audios', err))
      .finally(() => (this.isLoadingRecentAudios = false));
  }

  // Scroll event handlers for horizontal scroll containers
  onRandomAudiosScroll(): void {
    if (
      this.isScrolledNearRight(this.randomAudiosContainer.nativeElement) &&
      !this.isLoadingRandomAudios
    ) {
      this.loadRandomAudios();
    }
  }

  onTopAudiosScroll(): void {
    if (
      this.isScrolledNearRight(this.topAudiosContainer.nativeElement) &&
      !this.isLoadingTopAudios
    ) {
      this.loadTopAudios();
    }
  }

  onRandomSingersScroll(): void {
    if (
      this.isScrolledNearRight(this.randomSingersContainer.nativeElement) &&
      !this.isLoadingRandomSingers
    ) {
      this.loadRandomSingers();
    }
  }

  onRecentAudiosScroll(): void {
    if (
      this.isScrolledNearRight(this.recentAudiosContainer.nativeElement) &&
      !this.isLoadingRecentAudios
    ) {
      this.loadRecentAudios();
    }
  }

  // Helper to check if scroll container is near right edge
  private isScrolledNearRight(element: HTMLElement): boolean {
    const threshold = 200; // pixels from the right edge to trigger loading more
    return (
      element.scrollLeft + element.clientWidth >=
      element.scrollWidth - threshold
    );
  }

  // Search functionality
  search(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/search'], {
        queryParams: { q: this.searchTerm.trim() },
      });
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  // Audio playback management
  setCurrentAudio(
    audio: Audio,
    index: number,
    section: 'random' | 'top' | 'recent'
  ): void {
    this.currentPlayingAudio = audio;
    this.currentPlayingIndex = index;
    this.currentPlayingSection = section;
  }

  playNextAudio(): void {
    if (!this.currentPlayingAudio || this.currentPlayingIndex === -1) return;

    let nextIndex = this.currentPlayingIndex + 1;
    let currentCollection: Audio[] = [];

    // Determine which collection we're playing from
    switch (this.currentPlayingSection) {
      case 'random':
        currentCollection = this.randomAudios;
        break;
      case 'top':
        currentCollection = this.topAudios;
        break;
      case 'recent':
        currentCollection = this.recentAudios;
        break;
    }

    // If we're at the end of current collection, load more if available
    if (nextIndex >= currentCollection.length) {
      switch (this.currentPlayingSection) {
        case 'random':
          if (this.hasMoreRandomAudios && !this.isLoadingRandomAudios) {
            this.loadRandomAudios();
            // We'll retry playing next after data loads
            return;
          }
          break;
        case 'top':
          if (this.hasMoreTopAudios && !this.isLoadingTopAudios) {
            this.loadTopAudios();
            return;
          }
          break;
        case 'recent':
          if (this.hasMoreRecentAudios && !this.isLoadingRecentAudios) {
            this.loadRecentAudios();
            return;
          }
          break;
      }

      // If no more content to load, wrap to the beginning
      nextIndex = 0;
    }

    // Set the next audio to play
    if (currentCollection[nextIndex]) {
      this.currentPlayingAudio = currentCollection[nextIndex];
      this.currentPlayingIndex = nextIndex;

      // Trigger playback (this will be implemented in the template)
      this.triggerPlay();
    }
  }

  // Method to programmatically trigger play on the current audio
  // This is a placeholder - the actual implementation will depend on how audio players
  // are implemented and how they can be accessed
  triggerPlay(): void {
    // This would be implemented to trigger play on the appropriate audio component
    // For example, by using ViewChildren to access the player components
    setTimeout(() => {
      // Find the player for the current audio and trigger play
      // This would be custom logic based on implementation
      console.log('Auto-playing next audio:', this.currentPlayingAudio?.title);
    }, 500);
  }

  // Navigate to singer detail page
  goToSinger(singerId: string): void {
    this.router.navigate(['/singers', singerId]);
  }

  toggleAutoplay(): void {
    this.autoplayEnabled = !this.autoplayEnabled;
  }
}
