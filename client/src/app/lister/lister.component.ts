import { Subscription } from 'rxjs';

import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

import { ProfileImage } from '../model/profile_image';
import { ProfileImageService } from '../services/profile-image.service';

@Component({
  selector: 'app-lister',
  templateUrl: './lister.component.html',
  styleUrls: ['./lister.component.scss']
})
export class ListerComponent implements OnDestroy, OnInit {

  public loading = false;
  public profileImageList: ProfileImage[] = [];
  public activeImage: (ProfileImage|null) = null;
  public scale = 0;
  public size = 96;
  @Output() imageSelected = new EventEmitter<ProfileImage|null>();

  private profileImageSubscription = new Subscription();

  constructor(private profileImage: ProfileImageService) { }

  ngOnInit(): void {
    this.loadImages();
    this.profileImageSubscription.add(
      this.profileImage.onChange().subscribe(
        () => {
          this.loadImages();
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.profileImageSubscription.unsubscribe();
  }

  public loadImages(): void {
    if (this.loading) {
      return;
    }
    this.loading = true;
    this.profileImage.loadImages().subscribe(
      images => {
        this.profileImageList = images;
        this.loading = false;
        this.setActiveImage(this.activeImage);
      }
    );
  }

  public larger(): void {
    this.scale++;
    this.updateSize();
  }

  public smaller(): void {
    this.scale--;
    this.updateSize();
  }

  private updateSize(): void {
    let size = 96;
    if (this.scale > 0) {
      for (let i = 0; i < this.scale; ++i) {
        size *= 1.25;
      }
    } else if (this.scale < 0) {
      for (let i = 0; i > this.scale; --i) {
        size *= 0.8;
      }
    }
    this.size = Math.floor(size);
  }

  public selectImage(image: ProfileImage): void {
    if (this.isActive(image)) {
      this.setActiveImage(null);
      return;
    }
    this.setActiveImage(image);
  }

  public setActiveImage(image: ProfileImage | null): void {
    if (image != null) {
      for (const im of this.profileImageList) {
        if (image.id === im.id) {
          this.activeImage = im;
          this.imageSelected.emit(this.activeImage);
          return;
        }
      }
    }
    this.activeImage = null;
    this.imageSelected.emit(this.activeImage);
  }

  public isActive(image: ProfileImage): boolean {
    return (this.activeImage != null) && this.activeImage.id === image.id;
  }
}
