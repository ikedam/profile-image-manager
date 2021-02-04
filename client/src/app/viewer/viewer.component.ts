import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ProfileImage } from '../model/profile_image';
import { ProfileImageService } from '../services/profile-image.service';

@Component({
  selector: 'app-viewer',
  templateUrl: './viewer.component.html',
  styleUrls: ['./viewer.component.scss']
})
export class ViewerComponent implements OnInit {

  @Input() profileImage: ProfileImage | null =  null;
  public verifying = false;
  public deleting = false;

  constructor(private profileImageService: ProfileImageService) { }

  ngOnInit(): void {
  }

  doDelete(): void {
    this.deleting = false;
    this.verifying = true;
  }

  doDeleteEnsure(): void {
    if (this.profileImage == null) {
      this.verifying = false;
      return;
    }

    this.deleting = true;
    this.profileImageService.delete(this.profileImage).subscribe(
      () => {
        this.deleting = false;
        this.verifying = false;
        this.profileImage = null;
      }
    );
  }

  cancelDelete(): void {
    this.verifying = false;
  }
}
