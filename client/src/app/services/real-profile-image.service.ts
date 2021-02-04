import { Observable, of } from 'rxjs';

import { Injectable } from '@angular/core';

import { ProfileImage } from '../model/profile_image';
import { ProfileImageService } from './profile-image.service';

@Injectable({
  providedIn: 'root'
})
export class RealProfileImageService extends ProfileImageService {

  constructor() {
    super();
   }

  public loadImages(): Observable<ProfileImage[]> {
    // TODO
    return of([]);
  }

  public delete(image: ProfileImage): Observable<void> {
    // TODO
    return of();
  }

  public upload(data: string): Observable<ProfileImage> {
    // TODO
    const profileImage: ProfileImage = {
      id: (new Date()).getTime().toString(),
      image: data,
      createdAt: new Date(),
    };
    return of(profileImage);
  }
}
