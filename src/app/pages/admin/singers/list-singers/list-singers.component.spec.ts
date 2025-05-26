import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListSingersComponent } from './list-singers.component';

describe('ListSingersComponent', () => {
  let component: ListSingersComponent;
  let fixture: ComponentFixture<ListSingersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListSingersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListSingersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
