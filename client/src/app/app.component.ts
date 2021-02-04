import { Component } from '@angular/core';

import { ProfileImage } from './model/profile_image';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public isAppenderOpen = true;
  public isViewerOpen = false;
  public profileImage: ProfileImage | null  = null;

  public onImageSelected(profileImage: ProfileImage | null): void {
    this.profileImage = profileImage;
    if (this.profileImage != null) {
      this.isViewerOpen = true;
    }
  }
}
