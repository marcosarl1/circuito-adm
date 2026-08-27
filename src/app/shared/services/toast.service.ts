import { Service, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.models';

@Service()
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string, durationMs = 5000): void {
    this.add('success', message, durationMs);
  }

  error(message: string, durationMs = 7000): void {
    this.add('error', message, durationMs);
  }

  info(message: string, durationMs = 6000): void {
    this.add('info', message, durationMs);
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(type: ToastType, message: string, durationMs = 5000): void {
    const id = crypto.randomUUID();
    this._toasts.update((toasts) => [...toasts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
