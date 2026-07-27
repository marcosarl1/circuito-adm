import { Service, signal } from '@angular/core';
import { Toast, ToastType } from '../models/toast.models';

@Service()
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  success(message: string): void {
    this.add('success', message);
  }

  error(message: string): void {
    this.add('error', message);
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(type: ToastType, message: string): void {
    const id = crypto.randomUUID();
    this._toasts.update((toasts) => [...toasts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 5000);
  }
}
