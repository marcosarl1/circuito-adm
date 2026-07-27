export type ToastType = 'sucess' | 'error';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}
