import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ProfileImageService } from '../services/profile-image.service';

interface DragState {
  dragging: boolean;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
}

interface CanvasState {
  x: number;
  y: number;
  scale: number;
}

interface CalcuratedRange {
  x: number;
  y: number;
  width: number;
  height: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  fixY: number;
  fixX: number;
}

@Component({
  selector: 'app-appender',
  templateUrl: './appender.component.html',
  styleUrls: ['./appender.component.scss']
})
export class AppenderComponent implements OnInit {
  public readonly CANVAS_SIZE = 600;
  public readonly CROP_SIZE = 400;
  public readonly MIN_SIZE = 96;
  public readonly SCALE_RESOLUTION = 1000.0;
  public isSquareMask = true;
  public isBlackMask = false;
  public verifying = false;
  public uploading = false;
  public previewImage: string | null = null;
  public resizerMin = 0.1 * this.SCALE_RESOLUTION;
  public resizerMax = 5 * this.SCALE_RESOLUTION;
  public resizerValue = 1 * this.SCALE_RESOLUTION;
  private dragState: DragState = {
    dragging: false,
    startX: 0,
    startY: 0,
    moveX: 0,
    moveY: 0,
  };
  public canvasState: CanvasState = {
    x: this.CANVAS_SIZE / 2,
    y: this.CANVAS_SIZE / 2,
    scale: 1 * this.SCALE_RESOLUTION,
  };

  @ViewChild('file') private fileElement!: ElementRef<HTMLInputElement>;
  @ViewChild('canvas') private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('previewCanvas') private previewCanvas!: ElementRef<HTMLCanvasElement>;
  private image = new Image();

  constructor(private profileImageService: ProfileImageService) { }

  ngOnInit(): void {
  }

  setSquareMask(squareMask: boolean): void {
    if (this.isSquareMask === squareMask) {
      return;
    }
    this.isSquareMask = squareMask;
    this.drawCanvas();
  }

  toggleBlackMask(): void {
    this.isBlackMask = !this.isBlackMask;
    this.drawCanvas();
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

  onCanvasMouseDown(event: MouseEvent): void {
    this.onCanvasDragStart(event.pageX, event.pageY);
  }

  onCanvasTouchStart(event: TouchEvent): void {
    this.onCanvasDragStart(event.touches[0].pageX, event.touches[0].pageY);
  }

  private onCanvasDragStart(x: number, y: number): void {
    if (this.dragState.dragging) {
      return;
    }
    this.dragState = {
      dragging: true,
      startX: x,
      startY: y,
      moveX: x,
      moveY: y
    };
  }

  onCanvasMouseMove(event: MouseEvent): void {
    this.onCanvasDrag(event.pageX, event.pageY);
  }

  onCanvasTouchMove(event: TouchEvent): void {
    this.onCanvasDrag(event.touches[0].pageX, event.touches[0].pageY);
  }

  private onCanvasDrag(x: number, y: number): void {
    if (!this.dragState.dragging) {
      return;
    }
    this.dragState.moveX = x;
    this.dragState.moveY = y;
    this.drawCanvas();
  }

  onCanvasMouseUp(event: MouseEvent): void {
    this.onCanvasDragEnd(event.pageX, event.pageY);
  }

  onCanvasTouchEnd(event: TouchEvent): void {
    this.onCanvasDragEnd(event.touches[0].pageX, event.touches[0].pageY);
  }

  private onCanvasDragEnd(x: number, y: number): void {
    if (!this.dragState.dragging) {
      return;
    }
    const scale = this.canvasState.scale / this.SCALE_RESOLUTION;
    this.dragState.dragging = false;
    this.canvasState.x -= (x - this.dragState.startX) / scale;
    this.canvasState.y -= (y - this.dragState.startY) / scale;

    const range = this.calculateSourceRange(false);
    this.canvasState.x += range.fixX;
    this.canvasState.y += range.fixY;

    this.drawCanvas();
  }

  onCanvasResizing(): void {
    this.drawCanvas();
  }

  onCanvasResized(): void {
    const range = this.calculateSourceRange(false);
    this.canvasState.x += range.fixX;
    this.canvasState.y += range.fixY;
    this.drawCanvas();
  }

  initCanvas(): void {
    if (this.image.src === '') {
      return;
    }
    // scale が 2.0 → 画像は倍のサイズになる
    // 画像上のスケール * scale = キャンバス上のスケール

    // 画像が小さすぎる場合、等倍よりも大きく表示する必要がある
    // CROP_SIZE で表示するのに必要な倍率が 1.0 よりも大きい、最大のものを採用する。
    let scale = 1.0;
    const wScale = this.CROP_SIZE / this.image.width;
    const yScale = this.CROP_SIZE / this.image.height;
    if (scale < wScale) {
      scale = wScale;
    }
    if (scale < yScale) {
      scale = yScale;
    }
    // キャンバスの左上に画像をおいた場合の画像上の座標
    let x = this.CANVAS_SIZE / 2 / scale;
    let y = this.CANVAS_SIZE / 2 / scale;
    /*
    // 画像の右下のポイントは、キャンバスの表示領域の右下よりも左上にないといけない
    const cropBottomRight = ((this.CANVAS_SIZE - this.CROP_SIZE) / 2 + this.CROP_SIZE) / scale;
    if (x + this.image.width / 2 < cropBottomRight) {
      x = cropBottomRight - this.image.width / 2;
    }
    if (y + this.image.height / 2 < cropBottomRight) {
      y = cropBottomRight - this.image.height / 2;
    }
    */
    this.canvasState = {
      x,
      y,
      scale: Math.floor(scale * this.SCALE_RESOLUTION),
    };
    const range = this.calculateSourceRange(false);
    this.canvasState.x += range.fixX;
    this.canvasState.y += range.fixY;

    // 画像は最低でも 96x96 の解像度を要求する。
    // このため、拡大の最大率は 96 x 96 を 400 x 400 にするのに必要なサイズになる
    const maxScale = this.CROP_SIZE / this.MIN_SIZE;
    let minScale = wScale;
    if (minScale < yScale) {
      minScale = yScale;
    }
    this.resizerMax = Math.floor(maxScale * this.SCALE_RESOLUTION);
    this.resizerMin = Math.floor(minScale * this.SCALE_RESOLUTION);
    this.drawCanvas();
  }

  private calculateSourceRange(includeDrag: boolean): CalcuratedRange {
    const scale = this.canvasState.scale / this.SCALE_RESOLUTION;
    let baseX = this.canvasState.x - (this.CANVAS_SIZE / 2 / scale);
    let baseY = this.canvasState.y - (this.CANVAS_SIZE / 2 / scale);
    if (includeDrag && this.dragState.dragging) {
      baseX -= (this.dragState.moveX - this.dragState.startX) / scale;
      baseY -= (this.dragState.moveY - this.dragState.startY) / scale;
    }
    baseX = Math.floor(baseX);
    baseY = Math.floor(baseY);
    let x = baseX;
    let y = baseY;
    // 結果、切り取り範囲から画像がはみ出る場合は補正する
    const cropLeft = x + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale;
    const cropRight = x + (this.CANVAS_SIZE + this.CROP_SIZE) / 2 / scale;
    const cropTop = y + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale;
    const cropBottom = y + (this.CANVAS_SIZE + this.CROP_SIZE) / 2 / scale;
    if (cropLeft < 0) {
      x -= cropLeft;
    } else if (this.image.width < cropRight) {
      x -= cropRight - this.image.width;
    }
    if (cropTop < 0) {
      y -= cropTop;
    } else if (this.image.height < cropBottom) {
      y -= cropBottom - this.image.height;
    }
    return {
      x,
      y,
      width: Math.floor(this.CANVAS_SIZE / scale),
      height: Math.floor(this.CANVAS_SIZE / scale),
      cropX: Math.floor(x + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale),
      cropY: Math.floor(y + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale),
      cropWidth: Math.floor(this.CROP_SIZE / scale),
      cropHeight: Math.floor(this.CROP_SIZE / scale),
      fixX: x - baseX,
      fixY: y - baseY,
    };
  }

  drawCanvas(): void {
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (ctx == null) {
      return;
    }
    ctx.clearRect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
    if (this.image.src === '') {
      return;
    }
    const range = this.calculateSourceRange(true);
    ctx.drawImage(
      this.image,
      range.x,
      range.y,
      range.width,
      range.height,
      0,
      0,
      this.CANVAS_SIZE,
      this.CANVAS_SIZE,
    );
    if (this.isBlackMask) {
      ctx.fillStyle = 'rgb(0, 0, 0)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    }
    ctx.beginPath();
    if (this.isSquareMask) {
      ctx.rect(
        (this.CANVAS_SIZE + this.CROP_SIZE) / 2,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
        -this.CROP_SIZE,
        this.CROP_SIZE,
      );
    } else {
      ctx.arc(this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2, this.CROP_SIZE / 2, 0, 2 * Math.PI, true);
    }
    ctx.rect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
    ctx.fill();
  }

  fitToLargest(): void {

  }

  fitToSmallest(): void {
    this.canvasState.scale = this.resizerMin;
    this.onCanvasResized();
  }

  doUpload(): void {
    const canvas = this.previewCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (ctx == null) {
      return;
    }
    const range = this.calculateSourceRange(false);
    if (range.cropWidth < this.CROP_SIZE) {
      canvas.width = range.cropWidth;
      canvas.height = range.cropHeight;
    } else {
      canvas.width = this.CROP_SIZE;
      canvas.height = this.CROP_SIZE;
    }
    ctx.drawImage(
      this.image,
      range.cropX,
      range.cropY,
      range.cropWidth,
      range.cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    this.previewImage = canvas.toDataURL();
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
