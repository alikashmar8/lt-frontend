import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { postsEndpoint, audiosEndpoint } from '../../constants/api-constants';
import { Post } from '../../models/post.model';
import { Audio } from '../../models/audio.model';
import {
  getAdminHeaders,
  getFormDataAdminHeaders,
  getHeaders,
} from '../../utils/functions';

@Injectable({
  providedIn: 'root',
})
export class PostsService {
  constructor(private http: HttpClient) {}

  async getPosts(filters?: {
    take: number;
    skip: number;
    search?: string;
  }): Promise<{
    data: Post[];
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
      this.http.get(postsEndpoint + queryParams, {
        headers: getAdminHeaders(),
      })
    )) as {
      data: Post[];
      count: number;
    };
  }

  async createPost(data: any) {
    return await this.http
      .post(postsEndpoint, data, {
        headers: getAdminHeaders(),
      })
      .toPromise();
  }

  createPostWithFormData(formData: FormData): Promise<any> {
    return firstValueFrom(
      this.http.post<any>(`${postsEndpoint}`, formData, {
        headers: getFormDataAdminHeaders(),
      })
    );
  }

  async delete(id: string) {
    return await firstValueFrom(
      this.http.delete(postsEndpoint + id, {
        headers: getAdminHeaders(),
      })
    );
  }

  async initiateUpload(
    fileName: string,
    fileType: string,
    uploadType: 'audio' | 'video'
  ): Promise<any> {
    return await firstValueFrom(
      this.http.post(
        `${postsEndpoint}initiate-upload`,
        { fileName, fileType, uploadType: uploadType },
        {
          headers: getAdminHeaders(),
        }
      )
    );
  }

  async uploadChunk(
    uploadId: string,
    key: string,
    partNumber: number,
    chunk: Blob
  ): Promise<any> {
    const formData = new FormData();
    formData.append('fileChunk', chunk);
    formData.append('uploadId', uploadId);
    formData.append('key', key);
    formData.append('partNumber', partNumber.toString());

    return await firstValueFrom(
      this.http.put(`${postsEndpoint}upload-part`, formData, {
        headers: getFormDataAdminHeaders(),
      })
    );
  }

  async completeUpload(
    uploadId: string,
    key: string,
    parts: { ETag: string; PartNumber: number }[]
  ): Promise<any> {
    return await firstValueFrom(
      this.http.post(
        `${postsEndpoint}complete-upload`,
        {
          uploadId,
          key,
          parts,
        },
        {
          headers: getAdminHeaders(),
        }
      )
    );
  }

  async getPost(id: string): Promise<Post> {
    return (await firstValueFrom(
      this.http.get(`${postsEndpoint}${id}`, {
        headers: getAdminHeaders(),
      })
    )) as Post;
  }

  /**
   * Update an existing post
   */
  async updatePost(id: string, formData: FormData): Promise<any> {
    return await firstValueFrom(
      this.http.put(`${postsEndpoint}${id}`, formData, {
        headers: getFormDataAdminHeaders(),
      })
    );
  }

  async getRandomAudios(params: { page: number; limit: number }): Promise<{
    data: Audio[];
    hasMore: boolean;
  }> {
    const queryParams = `?page=${params.page}&limit=${params.limit}`;
    return await firstValueFrom(
      this.http.get<{ data: Audio[]; hasMore: boolean }>(
        `${audiosEndpoint}/random${queryParams}`,
        { headers: getHeaders() }
      )
    );
  }

  async getTopAudios(params: { page: number; limit: number }): Promise<{
    data: Audio[];
    hasMore: boolean;
  }> {
    const queryParams = `?page=${params.page}&limit=${params.limit}`;
    return await firstValueFrom(
      this.http.get<{ data: Audio[]; hasMore: boolean }>(
        `${audiosEndpoint}/top${queryParams}`,
        { headers: getHeaders() }
      )
    );
  }

  async getRecentAudios(params: { page: number; limit: number }): Promise<{
    data: Audio[];
    hasMore: boolean;
  }> {
    const queryParams = `?page=${params.page}&limit=${params.limit}`;
    return await firstValueFrom(
      this.http.get<{ data: Audio[]; hasMore: boolean }>(
        `${audiosEndpoint}/recent${queryParams}`,
        { headers: getHeaders() }
      )
    );
  }

  async searchAudios(params: {
    query: string;
    page: number;
    limit: number;
  }): Promise<{ data: Audio[]; total: number; hasMore: boolean }> {
    const queryParams = `?q=${encodeURIComponent(
      params.query
    )}&page=${params.page}&limit=${params.limit}`;
    return await firstValueFrom(
      this.http.get<{ data: Audio[]; total: number; hasMore: boolean }>(
        `${audiosEndpoint}/search${queryParams}`,
        { headers: getHeaders() }
      )
    );
  }
}
