import { Service } from '@angular/core';
import { Subject } from 'rxjs';
import { ConfirmRequest } from '../models/confirm-request.model';

@Service()
export class ConfirmModalService {
  request$ = new Subject<ConfirmRequest>();

  confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.request$.next({ message, resolve });
    });
  }
}
