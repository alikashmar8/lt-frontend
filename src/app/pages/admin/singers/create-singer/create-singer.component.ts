import { Component } from '@angular/core';
import {
  FormsModule
} from '@angular/forms';
import { from } from 'rxjs';
import { AlertService } from '../../../../services/alert.service';
import { AuthService } from '../../../../services/auth.service';
import { SingersService } from '../../../../services/singers.service';

@Component({
  selector: 'app-create-singer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './create-singer.component.html',
  styleUrl: './create-singer.component.css',
})
export class CreateSingerComponent {
  data: {
    nameEn: string;
    nameAr: string;
    description: string;
    thumbnail?: any;
  } = {
    nameEn: '',
    nameAr: '',
    description: '',
    thumbnail: null,
  };
  isStoreLoading: boolean = false;

  folders = [];
  constructor(
    private singersService: SingersService,
    private alertService: AlertService,
    private authService: AuthService
  ) {}

  uploadImage(event: any) {
    this.data!.thumbnail = event.target.files[0];
    console.log(this.data?.thumbnail);
  }

  submitData() {
    let data = new FormData();
    data.append('nameEn', this.data!.nameEn);
    data.append('nameAr', this.data!.nameAr);
    data.append('description', this.data!.description);
    if (this.data.thumbnail)
      data.append('thumbnail', this.data?.thumbnail, this.data.thumbnail?.name);

    from(this.singersService.createSinger(data)).subscribe(
      (res) => {
        this.isStoreLoading = false;
        console.log(res);
        window.location.reload();
        this.alertService.success('Created Successfully');
      },
      (err) => {
        this.isStoreLoading = false;
        this.authService.handleHttpError(err);
        console.log(err);
      }
    );
  }
}
