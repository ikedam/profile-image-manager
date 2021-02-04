import { Injectable } from '@angular/core';
import { ProfileImageService } from './profile-image.service';

@Injectable({
  providedIn: 'root'
})
export class MockProfileImageService extends ProfileImageService {

  constructor() {
    super();
  }
}
