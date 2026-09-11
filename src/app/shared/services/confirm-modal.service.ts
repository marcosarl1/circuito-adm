import { Service } from '@angular/core';
import { Subject } from 'rxjs';
import ConfirmRequest from '../models/confirm-request.model';

@Service()
export class ConfirmModalService {
  request$ = new Subject<ConfirmRequest>();

  confirm(
    message: string,
    options?: Pick<ConfirmRequest, 'title' | 'confirmText' | 'cancelText' | 'variant'>,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      this.request$.next({ message, resolve, ...options });
    });
  }
}
