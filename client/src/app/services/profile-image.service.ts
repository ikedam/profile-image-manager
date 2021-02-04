import { Observable, Subject } from 'rxjs';

import { Injectable } from '@angular/core';

import { ProfileImage } from '../model/profile_image';

@Injectable({
  providedIn: 'root'
})
export abstract class ProfileImageService {

  protected change = new Subject<void>();

  constructor() { }

  public abstract loadImages(): Observable<ProfileImage[]>;
  public abstract delete(image: ProfileImage): Observable<void>;

  public onChange(): Observable<void> {
    return this.change.asObservable();
  }
}
