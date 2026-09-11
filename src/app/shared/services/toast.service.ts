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

  infoWithAction(
    message: string,
    actionLabel: string,
    onAction: () => void,
    durationMs = 5000,
  ): void {
    this.add('info', message, durationMs, actionLabel, onAction);
  }

  dismiss(id: string): void {
    this._toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  private add(
    type: ToastType,
    message: string,
    durationMs = 5000,
    actionLabel?: string,
    onAction?: () => void,
  ): void {
    const id = crypto.randomUUID();
    this._toasts.update((toasts) => [
      ...toasts,
      { id, type, message, durationMs, actionLabel, onAction },
    ]);
    setTimeout(() => this.dismiss(id), durationMs);
  }
}
