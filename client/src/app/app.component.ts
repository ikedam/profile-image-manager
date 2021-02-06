import { of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { Component, ElementRef, ViewChild } from '@angular/core';

import { ImageSelectedEvent } from './lister/lister.component';
import { ProfileImage } from './model/profile_image';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public isAppenderOpen = false;
  public isViewerOpen = false;
  public profileImage: ProfileImage | null  = null;
  @ViewChild('viewer') private viewerSectionElement!: ElementRef<HTMLElement>;

  public onImageSelected(event: ImageSelectedEvent): void {
    this.profileImage = event.profileImage;
    if (this.profileImage != null) {
      this.isViewerOpen = true;
      if (event.forEvent) {
        // fails to scroll if viewer is not open yet.
        of('dummy').pipe(
          delay(100),
          tap(() => {
            this.viewerSectionElement.nativeElement.scrollIntoView({behavior: 'smooth'});
          }),
        ).subscribe();
      }
    }
  }
}
