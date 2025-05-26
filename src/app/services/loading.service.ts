import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  loading$ = new Subject<boolean>();

  appLoading(isLoading: boolean) {
    this.loading$.next(isLoading);
    return isLoading;
  }
}
