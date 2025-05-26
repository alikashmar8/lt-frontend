import { Post } from './post.model';

export class Video {
  id!: string;
  title!: string;
  fullTitle?: string;
  postId!: string;
  plays!: number;
  videoUrl!: string;
  videoType?: string;
  videoSize?: string;
  videoDuration?: string;
  post?: Post;
}
