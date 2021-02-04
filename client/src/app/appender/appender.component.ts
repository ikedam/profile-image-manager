import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ProfileImageService } from '../services/profile-image.service';

@Component({
  selector: 'app-appender',
  templateUrl: './appender.component.html',
  styleUrls: ['./appender.component.scss']
})
export class AppenderComponent implements OnInit {
  public isSquareMask = true;
  public verifying = false;
  public uploading = false;
  public previewImage: string | null = null;

  @ViewChild('file') private fileElement!: ElementRef<HTMLInputElement>;
  @ViewChild('canvas') private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewCanvas') private previewCanvas!: ElementRef<HTMLCanvasElement>;
  private image = new Image();

  constructor(private profileImageService: ProfileImageService) { }

  ngOnInit(): void {
  }

  selectFile(): void {
    this.fileElement.nativeElement.click();
  }

  onNewFileSelecteted(): void {
    const files = this.fileElement.nativeElement.files;
    if (files == null) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target == null) {
        return;
      }
      this.image.onload = () => {
        this.initCanvas();
      };
      this.image.src = e.target.result as string;
    };

    reader.readAsDataURL(file);
  }

  initCanvas(): void {
    // TODO: 画像サイズの自動調整
    this.drawCanvas();
  }

  drawCanvas(): void {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx == null) {
      return;
    }
    ctx.drawImage(
      this.image,
      0,
      0,
      this.image.width,
      this.image.height,
      0,
      0,
      this.image.width,
      this.image.height,
    );
    if (this.isSquareMask) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, 600, 100);
      ctx.fillRect(0, 500, 600, 100);
      ctx.fillRect(0, 100, 100, 400);
      ctx.fillRect(500, 100, 100, 400);
    } else {

    }
  }

  doUpload(): void {
    const ctx = this.previewCanvas.nativeElement.getContext('2d');
    if (ctx == null) {
      return;
    }
    ctx.drawImage(
      this.image,
      100,
      100,
      400,
      400,
      0,
      0,
      400,
      400,
    );
    this.previewImage = this.previewCanvas.nativeElement.toDataURL();
    this.uploading = false;
    this.verifying = true;
  }

  doUploadEnsure(): void {
    if (this.previewImage == null) {
      return;
    }
    this.uploading = true;
    this.profileImageService.upload(this.previewImage).subscribe(
      () => {
        this.uploading = false;
        this.verifying = false;
      }
    );
  }

  cancelUpload(): void {
    this.verifying = false;
  }
}
