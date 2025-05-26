import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Audio } from '../../models/audio.model';
import { audiosEndpoint } from '../../constants/api-constants';
import { getHeaders } from '../../utils/functions';

// API endpoint for audios

// Define interface for list options
export interface AudioListOptions {
  take: number;
  skip: number;
  search?: string;
  orderBy?: string;
  order?: 'ASC' | 'DESC';
  random?: boolean;
  singerId?: string;
  postId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AudiosService {
  constructor(private http: HttpClient) {}

  /**
   * Unified method to list audios with various filtering and sorting options
   * @param options Object containing filtering and pagination options
   */
  async listAudios(options: AudioListOptions): Promise<{
    data: Audio[];
    hasMore: boolean;
    total: number;
  }> {
    let queryParams = new HttpParams()
      .set('take', options.take.toString())
      .set('skip', options.skip.toString());

    // Add optional parameters if they exist
    if (options.search) queryParams = queryParams.set('search', options.search);
    if (options.orderBy)
      queryParams = queryParams.set('orderBy', options.orderBy);
    if (options.order) queryParams = queryParams.set('order', options.order);
    if (options.random) queryParams = queryParams.set('random', 'true');
    if (options.singerId)
      queryParams = queryParams.set('singerId', options.singerId);
    if (options.postId) queryParams = queryParams.set('postId', options.postId);

    return firstValueFrom(
      this.http.get<{ data: Audio[]; hasMore: boolean; total: number }>(
        audiosEndpoint,
        {
          headers: getHeaders(),
          params: queryParams,
        }
      )
    );
  }

  /**
   * Get a single audio by ID
   * @param id Audio ID
   */
  async getAudio(id: string): Promise<Audio> {
    return firstValueFrom(
      this.http.get<Audio>(`${audiosEndpoint}/${id}`, { headers: getHeaders() })
    );
  }

  /**
   * Increment play count for an audio
   * @param id Audio ID
   */
  async incrementPlayCount(id: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(
        `${audiosEndpoint}/${id}/play`,
        {},
        { headers: getHeaders() }
      )
    );
  }

  /**
   * Get audios by post ID
   * @param postId Post ID
   */
  async getAudiosByPost(postId: string): Promise<Audio[]> {
    const response = await this.listAudios({
      take: 100, // Assuming a reasonable limit
      skip: 0,
      postId: postId,
    });
    return response.data;
  }
}
