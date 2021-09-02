import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface ErrorInfo {
  id: string;
  message: string;
  data: any;
  expand: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorService {

  errors: ErrorInfo[] = [];
  private onerror = new Subject<ErrorInfo>();
  private nextId = 1;

  constructor() { }

  addError(error: any) {
    const errorInfo: ErrorInfo = {
      id: `${this.nextId++}`,
      message: this.getMessage(error),
      data: error,
      expand: false,
    };
    this.errors.push(errorInfo);
    this.onerror.next(errorInfo);
  }

  getMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    return `${error}`;
  }

  dismiss(id: string): void {
    const idx = this.errors.findIndex(e => {return e.id === id;});
    if (idx < 0) {
      return;
    }
    // const e = this.errors[idx];
    this.errors.splice(idx, 1);
  }

  onError(): Observable<ErrorInfo> {
    return this.onerror.asObservable();
  }
}
