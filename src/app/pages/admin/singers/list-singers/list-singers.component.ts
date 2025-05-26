import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatFabButton, MatIconButton, MatMiniFabButton } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { Singer } from '../../../../../models/singer.model';
import { AuthService } from '../../../../services/auth.service';
import { SingersService } from '../../../../services/singers.service';
import { AlertService } from '../../../../services/alert.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-list-singers',
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
    TranslateModule,
  ],
  templateUrl: './list-singers.component.html',
  styleUrl: './list-singers.component.css',
})
export class ListSingersComponent implements OnInit {
  displayedColumns: string[] = ['thumbnail', 'nameEn', 'nameAr', 'actions'];
  dataSource = new MatTableDataSource<Singer>([]);

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
    private singersService: SingersService,
    private authService: AuthService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    // Load saved view preference if available
    const savedViewMode = localStorage.getItem('singersViewMode');
    if (savedViewMode === 'list' || savedViewMode === 'grid') {
      this.viewMode = savedViewMode;
    }

    this.fetchSingers();
  }

  async fetchSingers(pageNumber: number = 1): Promise<void> {
    const skip = (pageNumber - 1) * this.filters.take;
    this.currentPage = pageNumber;

    try {
      const response = await this.singersService.getSingers({
        take: this.filters.take,
        skip,
        search: this.searchTerm || undefined
      });

      const singers = response.data;
      this.totalItems = response.count;

      this.totalPages =
        this.totalItems > 0
          ? Math.ceil(this.totalItems / this.filters.take)
          : 1;

      this.dataSource.data = singers;
    } catch (error: any) {
      console.error('Error fetching singers', error);
      this.authService.handleHttpError(error);
    }
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('singersViewMode', mode);
  }

  onSearch(): void {
    // Debounce could be implemented here
    this.fetchSingers(1); // Reset to first page on search
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.fetchSingers(1);
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

  async deleteSinger(singer: Singer) {
    // Request confirmation
    const isConfirmed = confirm(
      `Are you sure you want to delete ${singer.nameEn} - ${singer.nameAr}?`
    );

    if (!isConfirmed) return;

    try {
      await this.singersService.delete(singer.id);
      this.alertService.success('Deleted Successfully');

      // Check if we're on the last page and it's now empty
      if (this.currentPage > 1 && this.dataSource.data.length === 1) {
        this.fetchSingers(this.currentPage - 1);
      } else {
        this.fetchSingers(this.currentPage);
      }
    } catch (error: any) {
      console.error('Error deleting singer', error);
      this.authService.handleHttpError(error);
    }
  }
}
