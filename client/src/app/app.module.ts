import { environment } from 'src/environments/environment';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppenderComponent } from './appender/appender.component';
import { ListerComponent } from './lister/lister.component';
import { ProfileImageService } from './services/profile-image.service';
import { ViewerComponent } from './viewer/viewer.component';

@NgModule({
  declarations: [
    AppComponent,
    AppenderComponent,
    ViewerComponent,
    ListerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [
    {provide: ProfileImageService, useClass: environment.ProfileImageService, },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
