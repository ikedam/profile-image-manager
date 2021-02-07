import { environment } from 'src/environments/environment';

import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
    BrowserModule,
    FormsModule,
    HttpClientModule,
  ],
  providers: [
    {provide: ProfileImageService, useClass: environment.ProfileImageService, },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
