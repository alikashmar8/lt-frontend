import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { singersEndpoint } from '../../constants/api-constants';
import { Singer } from '../../models/singer.model';
import {
  getAdminHeaders,
  getFormDataAdminHeaders,
} from '../../utils/functions';

@Injectable({
  providedIn: 'root',
})
export class SingersService {
  constructor(private http: HttpClient) {}

  async getSingers(filters?: {
    take: number;
    skip: number;
    search?: string;
    random?: boolean;
  }): Promise<{
    data: Singer[];
    count: number;
  }> {
    let queryParams = '?';
    for (var key in filters) {
      if (filters.hasOwnProperty(key) && filters[key as keyof typeof filters]) {
        var val = filters[key as keyof typeof filters];
        queryParams += '&' + key + '=' + val;
      }
    }

    return (await firstValueFrom(
      this.http.get(singersEndpoint + queryParams, {
        headers: getAdminHeaders(),
      })
    )) as {
      data: Singer[];
      count: number;
    };
  }

  async createSinger(data: any) {
    return await this.http
      .post(singersEndpoint, data, {
        headers: getFormDataAdminHeaders(),
      })
      .toPromise();
  }

  async delete(id: string) {
    return await firstValueFrom(
      this.http.delete(singersEndpoint + id, {
        headers: getAdminHeaders(),
      })
    );
  }

  /**
   * Get a single singer by ID
   */
  async getSinger(id: string): Promise<Singer> {
    return await firstValueFrom(
      this.http.get<Singer>(`${singersEndpoint}${id}`, {
        headers: getAdminHeaders(),
      })
    );
  }

  /**
   * Update an existing singer
   */
  async updateSinger(id: string, data: FormData): Promise<any> {
    return await firstValueFrom(
      this.http.patch(`${singersEndpoint}${id}`, data, {
        headers: getFormDataAdminHeaders(),
      })
    );
  }

  /**
   * Get random singers
   */
  async getRandomSingers(params: { page: number; limit: number }): Promise<{ data: Singer[]; hasMore: boolean }> {
    const queryParams = `?page=${params.page}&limit=${params.limit}`;
    return await firstValueFrom(
      this.http.get<{ data: Singer[]; hasMore: boolean }>(
        `${singersEndpoint}/random${queryParams}`,
        { headers: getAdminHeaders() }
      )
    );
  }
}
