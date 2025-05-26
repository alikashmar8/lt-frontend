import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButton,
  MatFabButton,
  MatIconButton,
  MatMiniFabButton,
} from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Post } from '../../../../../models/post.model';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { PostsService } from '../../../../services/posts.service';

@Component({
  selector: 'app-list-posts',
  standalone: true,
  imports: [
    MatTableModule,
    MatFabButton,
    MatIcon,
    CommonModule,
    FormsModule,
    MatButton,
    RouterLink,
    MatMiniFabButton,
    MatIconButton,
    MatFormFieldModule,
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './list-posts.component.html',
  styleUrl: './list-posts.component.css',
})
export class ListPostsComponent implements OnInit {
  displayedColumns: string[] = [
    'thumbnail',
    'title',
    'radood',
    'created_at',
    'actions',
  ];
  dataSource = new MatTableDataSource<Post>([]);

  totalPages: number = 0;
  currentPage = 1;
  totalItems = 0;
  viewMode: 'grid' | 'list' = 'grid'; // Default view mode
  searchTerm: string = '';

  // Maximum number of page buttons to show
  maxPageButtons = 5;

  filters: { take: number; skip: number; search?: string } = {
    take: 10,
    skip: 0,
  };

  constructor(
    private postsService: PostsService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Load saved view preference if available
    const savedViewMode = localStorage.getItem('postsViewMode');
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      this.viewMode = savedViewMode as 'grid' | 'list';
    }

    this.fetchPosts();
  }

  async fetchPosts(pageNumber: number = 1): Promise<void> {
    const skip = (pageNumber - 1) * this.filters.take;
    this.currentPage = pageNumber;

    try {
      const response = await this.postsService.getPosts({
        take: this.filters.take,
        skip,
        search: this.searchTerm
      });
      const posts = response.data;
      this.totalItems = response.count;

      this.totalPages =
        this.totalItems > 0
          ? Math.ceil(this.totalItems / this.filters.take)
          : 1;

      this.dataSource.data = posts;
    } catch (error: any) {
      console.error('Error fetching posts', error);
      this.authService.handleHttpError(error);
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('postsViewMode', mode);
  }

  onSearch(): void {
    this.fetchPosts(1); // Reset to first page on search
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.fetchPosts(1);
  }

  getPaginationRange(): number[] {
    const range: number[] = [];

    // If few pages, show all
    if (this.totalPages <= this.maxPageButtons) {
      for (let i = 1; i <= this.totalPages; i++) {
        range.push(i);
      }
      return range;
    }

    // Calculate start and end for pagination display
    let start = Math.max(1, this.currentPage - Math.floor(this.maxPageButtons / 2));
    let end = Math.min(this.totalPages, start + this.maxPageButtons - 1);

    // Adjust start if we're near the end
    if (end - start + 1 < this.maxPageButtons) {
      start = Math.max(1, end - this.maxPageButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }

  async deletePost(post: Post) {
    // Request confirmation
    const isConfirmed = confirm(
      `Are you sure you want to delete ${post.title}?`
    );

    if (!isConfirmed) return;

    try {
      await this.postsService.delete(post.id);
      this.alertService.success('Deleted Successfully');

      // Check if we're on the last page and it's now empty
      if (this.currentPage > 1 && this.dataSource.data.length === 1) {
        this.fetchPosts(this.currentPage - 1);
      } else {
        this.fetchPosts(this.currentPage);
      }
    } catch (error: any) {
      console.error('Error deleting post', error);
      this.authService.handleHttpError(error);
    }
  }
}
