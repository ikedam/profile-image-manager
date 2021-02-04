import { TestBed } from '@angular/core/testing';

import { RealProfileImageService } from './real-profile-image.service';

describe('RealProfileImageService', () => {
  let service: RealProfileImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RealProfileImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
