import { Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
    const expectedPrefix = 'data:image/png;base64,';
    if (!data.startsWith(expectedPrefix)) {
      return throwError('Unexpected data format');
    }
    data = data.substr(expectedPrefix.length);
    return this.http.post<RawProfileImage>(
      this.SERVER_ROOT + '/upload/png',
      data,
    ).pipe(
      map((rawProfileImage: RawProfileImage) => {
        return this.convertRawProfileImageToProfileImage(
          rawProfileImage,
        );
      }),
      tap((profileImage: ProfileImage) => {
        this.change.next({
          eventType: 'upload',
          id: profileImage.id,
        });
      }),
    );
  }

  private convertRawProfileImageToProfileImage(rawProfileImage: RawProfileImage): ProfileImage {
    return {
      id: rawProfileImage.id,
      image: rawProfileImage.image,
      createdAt: new Date(rawProfileImage.createdAt),
    };
  }
}
