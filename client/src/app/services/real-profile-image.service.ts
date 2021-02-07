import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { ProfileImage } from '../model/profile_image';
import { RawProfileImage } from '../model/raw_profile_image';
import { ProfileImageService } from './profile-image.service';

@Injectable({
  providedIn: 'root'
})
export class RealProfileImageService extends ProfileImageService {
  private readonly SERVER_ROOT = './api.cgi';

  constructor(private http: HttpClient) {
    super();
   }

  public loadImages(): Observable<ProfileImage[]> {
    return this.http.get<RawProfileImage[]>(
      this.SERVER_ROOT + '/',
    ).pipe(
      map((rawProfileImageList: RawProfileImage[]) => {
        return rawProfileImageList.map(
          this.convertRawProfileImageToProfileImage,
        );
      }),
    );
  }

  public delete(image: ProfileImage): Observable<void> {
    // TODO
    return of('dummy').pipe(
      map((_) => { return; }),
    );
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

  private convertRawProfileImageToProfileImage(rawProfileImage: RawProfileImage): ProfileImage {
    return {
      id: rawProfileImage.id,
      image: rawProfileImage.image,
      createdAt: new Date(rawProfileImage.createdAt),
    };
  }
}
