export default interface ConfirmRequest {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
  resolve: (confirmed: boolean) => void;
}
