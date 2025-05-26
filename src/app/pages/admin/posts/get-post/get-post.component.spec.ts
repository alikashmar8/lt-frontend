import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetPostComponent } from './get-post.component';

describe('GetPostComponent', () => {
  let component: GetPostComponent;
  let fixture: ComponentFixture<GetPostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GetPostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GetPostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
