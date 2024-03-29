import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { ErrorService } from '../services/error.service';
import { ProfileImageService } from '../services/profile-image.service';

// GestureEvent is non-standard
interface MyGestureEvent {
  rotation: number;
  scale: number;
}

interface DragState {
  dragging: boolean;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
}

interface GestureState {
  gesturing: boolean;
  scale: number;
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
  destX: number;
  destY: number;
  destWidth: number;
  destHeight: number;
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
  public fileDragging = false;
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
  private gestureState: GestureState = {
    gesturing: false,
    scale: 1.0,
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

  constructor(private profileImageService: ProfileImageService, private error: ErrorService) { }

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

  onDragOver(event: DragEvent): void {
    this.fileDragging = true;
    event.stopPropagation();
    event.preventDefault();
  }

  onDragLeave(event: DragEvent): void {
    this.fileDragging = false;
    event.stopPropagation();
    event.preventDefault();
  }

  onDrop(event: DragEvent): void {
    this.fileDragging = false;
    event.stopPropagation();
    event.preventDefault();
    if (event.dataTransfer == null) {
      return;
    }
    this.fileElement.nativeElement.files = event.dataTransfer.files;
    this.onNewFileSelecteted();
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

  private isFileSelected(): boolean {
    return this.image.src !== '';
  }

  onCanvasMouseDown(event: MouseEvent): void {
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDragStart(event.pageX, event.pageY);
    event.stopPropagation();
    event.preventDefault();
  }

  onCanvasTouchStart(event: TouchEvent): void {
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDragStart(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    event.stopPropagation();
    event.preventDefault();
  }

  private onCanvasDragStart(x: number, y: number): void {
    if (this.dragState.dragging) {
      return;
    }
    if (this.gestureState.gesturing) {
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
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDrag(event.pageX, event.pageY);
    event.stopPropagation();
    event.preventDefault();
  }

  onCanvasTouchMove(event: TouchEvent): void {
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDrag(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    event.stopPropagation();
    event.preventDefault();
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
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDragEnd(event.pageX, event.pageY);
    event.stopPropagation();
    event.preventDefault();
  }

  onCanvasTouchEnd(event: TouchEvent): void {
    if (!this.isFileSelected()) {
      return;
    }
    this.onCanvasDragEnd(event.changedTouches[0].pageX, event.changedTouches[0].pageY);
    event.stopPropagation();
    event.preventDefault();
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

  onCanvasGestureStart(e: any): void {
    const event = e as MyGestureEvent;
    if (this.dragState.dragging) {
      this.dragState.dragging = false;
    }
    this.gestureState.gesturing = true;
    this.gestureState.scale = event.scale;

    this.drawCanvas();
  }

  onCanvasGestureChange(e: any): void {
    const event = e as MyGestureEvent;
    if (!this.gestureState.gesturing) {
      return;
    }
    this.gestureState.scale = event.scale;
    this.drawCanvas();
  }

  onCanvasGestureEnd(e: any): void {
    const event = e as MyGestureEvent;
    if (!this.gestureState.gesturing) {
      return;
    }
    this.gestureState.gesturing = false;
    this.canvasState.scale = Math.floor(this.canvasState.scale * event.scale);
    if (this.canvasState.scale < this.resizerMin) {
      this.canvasState.scale = this.resizerMin;
    }
    if (this.canvasState.scale > this.resizerMax) {
      this.canvasState.scale = this.resizerMax;
    }

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

  onCanvasClicked(): void {
    if (this.image.src !== '') {
      return;
    }
    this.selectFile();
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
    this.canvasState = {
      x: Math.floor(this.CANVAS_SIZE / 2 / scale),
      y: Math.floor(this.CANVAS_SIZE / 2 / scale),
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
    let rawScale = this.canvasState.scale;
    if (includeDrag && this.gestureState.gesturing) {
      rawScale *= this.gestureState.scale;
      if (rawScale < this.resizerMin) {
        rawScale = this.resizerMin;
      }
      if (rawScale > this.resizerMax) {
        rawScale = this.resizerMax;
      }
    }
    const scale = rawScale / this.SCALE_RESOLUTION;
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
    const fixX = x - baseX;
    const fixY = y - baseY;
    const cropX = Math.floor(x + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale);
    const cropY = Math.floor(y + (this.CANVAS_SIZE - this.CROP_SIZE) / 2 / scale);

    // 画像の枠外にあるとき、補正を行う。
    let destX = 0;
    let destY = 0;
    let destWidth = this.CANVAS_SIZE;
    let destHeight = this.CANVAS_SIZE;

    if (x < 0) {
      destX -= x * scale;
      destWidth -= destX;
      x = 0;
    } else if (x > this.image.width) {
      destWidth -= (x - this.image.width) * scale;
    }
    if (y < 0) {
      destY -= y * scale;
      destHeight -= destY;
      y = 0;
    } else if (y > this.image.height) {
      destHeight -= (y - this.image.height) * scale;
    }
    return {
      x,
      y,
      width: Math.floor(destWidth / scale),
      height: Math.floor(destHeight / scale),
      destX,
      destY,
      destWidth,
      destHeight,
      cropX,
      cropY,
      cropWidth: Math.floor(this.CROP_SIZE / scale),
      cropHeight: Math.floor(this.CROP_SIZE / scale),
      fixX,
      fixY,
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
      range.destX,
      range.destY,
      range.destWidth,
      range.destHeight,
    );
    if (this.isBlackMask) {
      ctx.fillStyle = 'rgb(0, 0, 0)';
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    }
    ctx.beginPath();
    if (this.isSquareMask) {
      ctx.rect(
        0,
        0,
        this.CANVAS_SIZE,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
      );
      ctx.rect(
        0,
        (this.CANVAS_SIZE + this.CROP_SIZE) / 2,
        this.CANVAS_SIZE,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
      );
      ctx.rect(
        0,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
        this.CROP_SIZE,
      );
      ctx.rect(
        (this.CANVAS_SIZE + this.CROP_SIZE) / 2,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
        (this.CANVAS_SIZE - this.CROP_SIZE) / 2,
        this.CROP_SIZE,
      );
    } else {
      ctx.rect(0, 0, this.CANVAS_SIZE, this.CANVAS_SIZE);
      ctx.arc(this.CANVAS_SIZE / 2, this.CANVAS_SIZE / 2, this.CROP_SIZE / 2, 0, 2 * Math.PI, true);
    }
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
      },
      (error) => {
        this.error.addError(error);
        this.uploading = false;
        this.verifying = false;
      },
    );
  }

  cancelUpload(): void {
    this.verifying = false;
  }
}
