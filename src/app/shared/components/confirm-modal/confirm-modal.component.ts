import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { ConfirmModalService } from '../../services/confirm-modal.service';
import { ConfirmRequest } from '../../models/confirm-request.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent implements OnInit, OnDestroy {
  private confirmService = inject(ConfirmModalService);

  visible = signal(false);
  message = signal('');
  private currentRequest: ConfirmRequest | null = null;
  private sub!: Subscription;

  ngOnInit(): void {
    this.sub = this.confirmService.request$.subscribe((req) => {
      this.currentRequest = req;
      this.message.set(req.message);
      this.visible.set(true);
    });
  }

  confirm() {
    this.closeWith(true);
  }

  cancel() {
    this.closeWith(false);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.currentRequest) this.closeWith(false);
  }

  private closeWith(confirmed: boolean) {
    this.visible.set(false);
    this.currentRequest?.resolve(confirmed);
    this.currentRequest = null;
  }
}
