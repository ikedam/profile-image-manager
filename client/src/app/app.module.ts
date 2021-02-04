import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { AppenderComponent } from './appender/appender.component';
import { ViewerComponent } from './viewer/viewer.component';
import { ListerComponent } from './lister/lister.component';

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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
