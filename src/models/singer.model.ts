import { Post } from "./post.model";

export class Singer {
  id!: string;
  nameAr!: string;
  nameEn!: string;
  description?: string;
  thumbnail?: string;
  posts?: Post[];
}
