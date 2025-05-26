import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { InputType } from '../../../../enums/input-type.enum';

@Component({
  selector: 'app-dynamic-input',
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDialogContent,
    FormsModule,
    MatButtonModule,
    MatOption,
    MatDialogActions,
  ],
  templateUrl: './dynamic-input.component.html',
  styleUrl: './dynamic-input.component.css',
})
export class DynamicInputComponent implements OnInit {
  InputType = InputType;
  file: any;

  constructor(
    public dialogRef: MatDialogRef<DynamicInputComponent>,
    @Inject(MAT_DIALOG_DATA)
    public passedData: {
      label?: string;
      value: string;
      inputType: InputType;
      options?: {
        label: string;
        value: string;
      }[];
    }
  ) {}

  ngOnInit(): void {
    console.log(this.passedData);
  }

  uploadImage(event: any) {
    this.file = event.target.files[0];
  }

  onCancel() {
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close(
      this.passedData.inputType != InputType.IMAGE
        ? this.passedData.value
        : this.file
    );
  }
}
