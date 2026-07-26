export interface ConfirmRequest {
  message: string;
  resolve: (confirmed: boolean) => void;
}
