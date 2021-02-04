import { TestBed } from '@angular/core/testing';

import { MockProfileImageService } from './mock-profile-image.service';

describe('MockProfileImageService', () => {
  let service: MockProfileImageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockProfileImageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
