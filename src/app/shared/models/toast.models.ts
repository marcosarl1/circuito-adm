export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  durationMs?: number;
  actionLabel?: string;
  onAction?: () => void;
}
