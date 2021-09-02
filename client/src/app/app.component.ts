import { of, Subscription } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { ImageSelectedEvent } from './lister/lister.component';
import { ProfileImage } from './model/profile_image';
import { ErrorService } from './services/error.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  public isAppenderOpen = false;
  public isViewerOpen = false;
  public profileImage: ProfileImage | null  = null;
  private subscription: Subscription = new Subscription();
  @ViewChild('viewer') private viewerSectionElement!: ElementRef<HTMLElement>;
  @ViewChild('errorBlock') private errorSectionElement!: ElementRef<HTMLElement>;

  constructor(public error: ErrorService) {}

  ngOnInit() {
    this.subscription.add(
      this.error.onError().subscribe((_) => {
        this.errorSectionElement.nativeElement.scrollIntoView({behavior: 'smooth'});
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

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

  public stringify(o: any): string {
    try {
      return JSON.stringify(o);
    } catch(_) {
      return `${o}`;
    }
  }
}
