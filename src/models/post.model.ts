import { Singer } from "./singer.model";
import { Audio } from "./audio.model";
import { Video } from "./video.model";

export class Post {
  id!: string;
  title!: string;
  description?: string;
  lyrics?: string;
  releaseDate?: Date;
  releaseDateHijri?: Date;
  location?: string;
  event?: string;
  thumbnail?: string;
  externalLinks?: string;
  views!: number;
  isActive!: boolean;
  singerId!: string;
  singer?: Singer;
  audios!: Audio[];
  videos!: Video[];
  createdAt!: Date;
  updatedAt!: Date;
}
