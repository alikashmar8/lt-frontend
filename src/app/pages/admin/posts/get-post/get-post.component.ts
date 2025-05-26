import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';

import { mediaUrl } from '../../../../../constants/api-constants';
import { Post } from '../../../../../models/post.model';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { PostsService } from '../../../../services/posts.service';
import moment from 'moment-hijri';
import { CustomVideoPlayerComponent } from '../../../../components/custom-video-player/custom-video-player.component';
import { CustomAudioPlayerComponent } from '../../../../components/custom-audio-player/custom-audio-player.component';

@Component({
  selector: 'app-get-post',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSliderModule,
    CustomVideoPlayerComponent,
    CustomAudioPlayerComponent
  ],
  templateUrl: './get-post.component.html',
  styleUrl: './get-post.component.css',
})
export class GetPostComponent implements OnInit {
  post?: Post;
  mediaUrl = mediaUrl;
  isLoading = true;

  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.alertService.error('Post ID is required');
      this.router.navigate(['/admin/latmeyyat']);
      return;
    }

    try {
      this.post = await this.postsService.getPost(id);
    } catch (err: any) {
      this.authService.handleHttpError(err);
    } finally {
      this.isLoading = false;
    }
  }

  getHijriDate(hijriDate?: Date): string {
    if (!hijriDate) return '';
    const displayDate = moment(hijriDate, 'iYYYY-iMM-iDD').format('iDD iMMMM iYYYY');
    return displayDate;
  }
}
