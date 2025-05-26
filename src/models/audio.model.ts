import { Post } from "./post.model";

export class Audio {
  id!: string;
  title!: string;
  fullTitle?: string;
  audioUrl!: string;
  audioType?: string;
  audioSize?: string;
  audioDuration?: string;
  plays!: number;
  postId!: string;
  post?: Post;
  createdAt!: Date;
  updatedAt!: Date;
}
