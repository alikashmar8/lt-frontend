import { Injectable } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { Observable, Subject, firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { DynamicInputComponent } from '../common/modals/dynamic-input/dynamic-input.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InputType } from '../../enums/input-type.enum';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  private subject = new Subject<any>();
  private keepAfterRouteChange = false;

  constructor(
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // clear alert messages on route change unless 'keepAfterRouteChange' flag is true
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (this.keepAfterRouteChange) {
          // only keep for a single route change
          this.keepAfterRouteChange = false;
        } else {
          // clear alert custom-message.ts
          this.clear();
        }
      }
    });
  }

  // getAlert(): Observable<any> {
  //   return this.subject.asObservable();
  // }

  success(message: string, keepAfterRouteChange = false) {
    // this.keepAfterRouteChange = keepAfterRouteChange;
    // this.subject.next({ type: 'success', text: message });
    this.snackBar.open(message, 'X', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-success'],
    });
  }

  error(message: string, keepAfterRouteChange = false) {
    this.snackBar.open(message, 'X', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }

  clear() {
    // clear by calling subject.next() without parameters
    this.subject.next(true);
  }

  // toastNotification(
  //   message: string,
  //   type: DialogLayoutDisplay,
  //   title?: string
  // ) {
  //   const newToastNotification = new ToastNotificationInitializer();

  //   newToastNotification.setMessage(message);
  //   newToastNotification.setConfig({
  //     layoutType: type, // SUCCESS | INFO | NONE | DANGER | WARNING
  //   });

  //   if (title) {
  //     newToastNotification.setTitle(title);
  //   }
  //   newToastNotification.openToastNotification$();
  // }

  // toastError(message: string, title?: string) {
  //   this.toastNotification(message, DialogLayoutDisplay.DANGER, title);
  // }

  // toastSuccess(message: string, title?: string) {
  //   this.toastNotification(message, DialogLayoutDisplay.SUCCESS, title);
  // }

  async dynamicInputDialog(defaultData: {
    label?: any;
    value: any;
    inputType: InputType;
    options?: { label: string; value: string }[];
  }) {
    const dialogRef = this.dialog.open(DynamicInputComponent, {
      width: '400px',
      data: {
        label: defaultData.label,
        value: defaultData.value,
        inputType: defaultData.inputType,
        options: defaultData.options,
      },
    });

    const result = await firstValueFrom(dialogRef.afterClosed());

    console.log('dialog result', result);

    return result;
  }
}
