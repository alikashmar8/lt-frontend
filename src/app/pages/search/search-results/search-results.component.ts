import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { Audio } from '../../../../models/audio.model';
import { Singer } from '../../../../models/singer.model';
import { AudiosService } from '../../../services/audios.service';
import { mediaUrl } from '../../../../constants/api-constants';
import { CustomAudioPlayerComponent } from '../../../components/custom-audio-player/custom-audio-player.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    TranslateModule,
    CustomAudioPlayerComponent
  ],
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.css']
})
export class SearchResultsComponent implements OnInit {
  searchTerm: string = '';
  searchResults: Audio[] = [];
  mediaUrl = mediaUrl;
  isLoading = false;
  page = 1;
  totalResults = 0;
  hasMore = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private audiosService: AudiosService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.searchTerm = params['q'] || '';
      if (this.searchTerm) {
        this.page = 1;
        this.searchResults = [];
        this.search();
      }
    });
  }

  search(): void {
    if (!this.searchTerm.trim()) return;

    this.isLoading = true;
    this.audiosService.listAudios({
      take: 20,
      skip: (this.page - 1) * 20,
      search: this.searchTerm.trim()
    })
      .then(result => {
        this.searchResults = [...this.searchResults, ...result.data];
        this.totalResults = result.total;
        this.hasMore = result.hasMore;
        this.page++;
      })
      .catch(err => console.error('Search error:', err))
      .finally(() => this.isLoading = false);
  }

  loadMore(): void {
    if (this.hasMore && !this.isLoading) {
      this.search();
    }
  }

  updateSearch(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { q: this.searchTerm.trim() },
        queryParamsHandling: 'merge'
      });
    }
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.router.navigate(['/']);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
