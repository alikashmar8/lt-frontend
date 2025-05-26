import { TestBed } from '@angular/core/testing';

import { SingersService } from './singers.service';

describe('SingersService', () => {
  let service: SingersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SingersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
